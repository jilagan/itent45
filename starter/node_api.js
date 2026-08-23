#!/usr/bin/env node
/**
 * ITENT 45 - starter API, Node.
 *
 * The same endpoints as django_api.py, in the other language panel 01 shows
 * you. Compare the two files side by side: the routing, the status codes and
 * the idempotency handling are identical in shape. Only the words change.
 *
 * No dependencies, so it runs immediately:
 *
 *     node node_api.js
 *
 * Swapping in real Express is about six lines - `app.get(path, handler)`
 * instead of the little router at the bottom. The design does not move.
 *
 * State is in memory, so it resets when you stop the process. Giving it a
 * real database is the first thing worth doing to it.
 */
import http from "node:http";

const PORT = 8000;

// ------------------------------------------------------------------ data
const courses = new Map([
  ["ITENT 45", { code: "ITENT 45", title: "Application Dev & Emerging Tech", units: 3, slots: 4 }],
  ["CSCI 21",  { code: "CSCI 21",  title: "Data Structures",                units: 3, slots: 0 }],
  ["ITMGT 25", { code: "ITMGT 25", title: "Programming Fundamentals",       units: 3, slots: 12 }],
]);

let enrollments = [];          // { id, student, code }
let nextId = 1;
const idempotency = new Map(); // key -> enrollment id

// A student cannot hold two seats in the same course. In the Django file the
// database enforces this. Here nothing does, so the check has to be yours -
// which is exactly the kind of thing that goes wrong under load.
const alreadyEnrolled = (student, code) =>
  enrollments.some(e => e.student === student && e.code === code);

const view = e => ({
  id: e.id, student: e.student,
  course: e.code, units: courses.get(e.code)?.units ?? null,
});

// ------------------------------------------------------------------ helpers
const send = (res, status, body, headers = {}) => {
  const payload = status === 204 ? "" : JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(payload);
};

const notAllowed = (res, allowed) =>
  send(res, 405, { error: "method not allowed" }, { Allow: allowed.join(", ") });

const readBody = req => new Promise(resolve => {
  let raw = "";
  req.on("data", c => (raw += c));
  req.on("end", () => {
    if (!raw) return resolve({});
    try { resolve(JSON.parse(raw)); } catch { resolve(null); }
  });
});

// ------------------------------------------------------------------ handlers
async function coursesCollection(req, res) {
  if (req.method === "GET")
    return send(res, 200, { courses: [...courses.values()].sort((a, b) => a.code.localeCompare(b.code)) });

  if (req.method === "POST") {
    const data = await readBody(req);
    if (data === null) return send(res, 400, { error: "body is not valid JSON" });
    if (!data.code)    return send(res, 422, { error: "code is required" });
    if (courses.has(data.code))
      return send(res, 409, { error: "that course already exists" });
    const c = { code: data.code, title: data.title ?? "", units: data.units ?? 3, slots: data.slots ?? 0 };
    courses.set(c.code, c);
    return send(res, 201, c, { Location: `/api/courses/${encodeURIComponent(c.code)}` });
  }
  return notAllowed(res, ["GET", "POST"]);
}

async function courseItem(req, res, code) {
  const c = courses.get(code);
  if (!c) return send(res, 404, { error: "no course with that code" });

  if (req.method === "GET") return send(res, 200, c);

  if (req.method === "PUT") {
    // Replace. Anything you leave out goes back to its default.
    const data = await readBody(req);
    if (data === null) return send(res, 400, { error: "body is not valid JSON" });
    const replaced = { code: c.code, title: data.title ?? "", units: data.units ?? 3, slots: data.slots ?? 0 };
    courses.set(code, replaced);
    return send(res, 200, replaced);
  }

  if (req.method === "PATCH") {
    // Change only what arrived.
    const data = await readBody(req);
    if (data === null) return send(res, 400, { error: "body is not valid JSON" });
    for (const f of ["title", "units", "slots"]) if (f in data) c[f] = data[f];
    return send(res, 200, c);
  }

  if (req.method === "DELETE") { courses.delete(code); return send(res, 204, {}); }

  return notAllowed(res, ["GET", "PUT", "PATCH", "DELETE"]);
}

async function enrollmentsCollection(req, res, url) {
  if (req.method === "GET") {
    const student = url.searchParams.get("student");
    const rows = enrollments.filter(e => !student || e.student === student);
    return send(res, 200, { enrollments: rows.map(view) });
  }

  if (req.method === "POST") {
    const data = await readBody(req);
    if (data === null) return send(res, 400, { error: "body is not valid JSON" });

    const key = req.headers["idempotency-key"];
    if (key && idempotency.has(key)) {
      // Seen this key already: replay the first answer, do not act again.
      const e = enrollments.find(x => x.id === idempotency.get(key));
      if (e) return send(res, 200, view(e));
    }

    const c = courses.get(data.code ?? "");
    if (!c) return send(res, 404, { error: "no course with that code" });
    if (c.slots < 1) return send(res, 409, { error: "no slots left" });
    if (alreadyEnrolled(data.student, data.code))
      return send(res, 409, { error: "already enrolled in that course" });

    const e = { id: nextId++, student: data.student ?? "", code: data.code };
    enrollments.push(e);
    c.slots -= 1;
    if (key) idempotency.set(key, e.id);
    return send(res, 201, view(e), { Location: `/api/enrollments/${e.id}` });
  }
  return notAllowed(res, ["GET", "POST"]);
}

function enrollmentItem(req, res, id) {
  if (req.method !== "DELETE") return notAllowed(res, ["DELETE"]);
  const i = enrollments.findIndex(e => e.id === Number(id));
  if (i === -1) return send(res, 404, { error: "no such enrollment" });
  const c = courses.get(enrollments[i].code);
  if (c) c.slots += 1;
  enrollments.splice(i, 1);
  return send(res, 204, {});
}

// ------------------------------------------------------------------ router
// Express would give you this. It is written out so you can see there is no
// magic in it: match a method and a path, call a function.
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // A client can send a broken percent-escape like %%20. decodeURIComponent
    // throws on it, and an uncaught throw in here takes the whole server down
    // with it - one bad URL, every user offline. Malformed input is a 400.
    let p;
    try {
      p = decodeURIComponent(url.pathname);
    } catch {
      return send(res, 400, { error: "path is not valid percent-encoding" });
    }

    let m;
    if (p === "/api/courses")                       return await coursesCollection(req, res);
    if ((m = p.match(/^\/api\/courses\/(.+)$/)))    return await courseItem(req, res, m[1]);
    if (p === "/api/enrollments")                   return await enrollmentsCollection(req, res, url);
    if ((m = p.match(/^\/api\/enrollments\/(\d+)$/))) return enrollmentItem(req, res, m[1]);

    send(res, 404, { error: "no route for that path" });
  } catch (err) {
    // Anything unexpected becomes a 500 for this one request. The process
    // survives to serve the next one. This is what panel 05's 500 means.
    console.error("unhandled error:", err);
    if (!res.headersSent) send(res, 500, { error: "something broke on our side" });
  }
});

server.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`);
  console.log("try:  curl localhost:8000/api/courses");
});
