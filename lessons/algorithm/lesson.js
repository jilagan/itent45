/* Lesson algorithm. Widget code for the markup in lesson.html.
   Two widgets: the robot barista (#algBot) and the repeat block (#algLoop). All data is fixed, so the worked answers in the text stay true.
   Styles for these widgets are added here and scoped to #p-algorithm. */

(() => {
const css = `
#p-algorithm .algw{margin:0 0 4px}
#p-algorithm .algw .ctab{margin-bottom:12px}
#p-algorithm .algw .ctab button{display:inline-flex;align-items:center;gap:6px;min-height:44px}
#p-algorithm .algw .ctab .ico{width:16px;height:16px}
#p-algorithm .algorder{margin:0 0 14px;color:var(--ink)}
#p-algorithm .abot{display:grid;grid-template-columns:minmax(0,1fr) 240px;gap:20px;align-items:start}
@media(max-width:820px){#p-algorithm .abot{grid-template-columns:minmax(0,1fr)}}
#p-algorithm .akeys{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px}
#p-algorithm .akeys .btn{min-height:44px}
#p-algorithm .asteps{list-style:none;margin:0 0 14px;padding:0;border:1px solid var(--line2);border-radius:6px;min-height:46px}
#p-algorithm .asteps li{display:flex;align-items:center;gap:10px;min-height:42px;padding:6px 12px;border-top:1px solid var(--line);font-size:15px;color:var(--ink)}
#p-algorithm .asteps li:first-child{border-top:0}
#p-algorithm .asteps .n{flex:0 0 1.8em;color:var(--dim);font-variant-numeric:tabular-nums}
#p-algorithm .asteps .t{flex:1 1 auto;min-width:0}
#p-algorithm .asteps .m{flex:0 0 auto;display:inline-flex;align-items:center;gap:4px;font-size:14px;color:var(--dim)}
#p-algorithm .asteps .m .ico{width:16px;height:16px}
#p-algorithm .asteps li.empty{color:var(--dim)}
#p-algorithm .asteps li.run{background:color-mix(in srgb,var(--req) 10%,var(--panel));box-shadow:inset 3px 0 0 var(--req)}
#p-algorithm .asteps li.done .m{color:var(--res)}
#p-algorithm .asteps li.fail{background:color-mix(in srgb,var(--warn) 8%,var(--panel));box-shadow:inset 3px 0 0 var(--warn)}
#p-algorithm .asteps li.fail .m{color:var(--warn);font-weight:600}
#p-algorithm .acup{text-align:left}
#p-algorithm .acupic{margin:0 0 8px}
#p-algorithm .acupic .ico{width:44px;height:44px}
#p-algorithm .acuptext{font-size:15px;line-height:1.5;color:var(--ink)}
#p-algorithm .acuptext span{display:block;color:var(--dim)}
#p-algorithm .algw .meter{grid-template-columns:repeat(2,minmax(0,1fr));margin:4px 0 14px}
#p-algorithm #algLoop .meter{grid-template-columns:repeat(3,minmax(0,1fr))}
#p-algorithm .rpblock{border:1px solid var(--line2);border-radius:6px;padding:12px 14px;margin:0 0 16px}
#p-algorithm .rphead{font-size:15px;color:var(--ink);margin:0 0 8px}
#p-algorithm .rpsteps{display:flex;flex-wrap:wrap;gap:6px;list-style:none;margin:0;padding:0}
#p-algorithm .rpsteps li{padding:4px 10px;border:1px solid var(--line);border-radius:4px;font-size:15px;color:var(--ink);background:var(--bg2)}
#p-algorithm .rpline{display:flex;flex-wrap:wrap;gap:6px 8px;min-height:72px;margin:0 0 16px}
#p-algorithm .rpc{display:flex;flex-direction:column;align-items:center;gap:2px;width:44px;color:var(--ink)}
#p-algorithm .rpc .ico{width:30px;height:30px}
#p-algorithm .rpc .tick{height:18px;display:flex;align-items:center;color:var(--res)}
#p-algorithm .rpc .tick .ico{width:16px;height:16px}
#p-algorithm .rpc.wait{color:var(--req)}
#p-algorithm .rplinenote{align-self:center;font-size:15px;color:var(--dim)}
`;
const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

const join = a => a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");

/* ================= robot barista ================= */
const INSTR = [
  {label: "Take cup", key: "cup"},
  {label: "Add tea", key: "add", item: "tea"},
  {label: "Add milk", key: "add", item: "milk"},
  {label: "Add pearls", key: "add", item: "pearls"},
  {label: "Add ice", key: "add", item: "ice"},
  {label: "Seal", key: "seal"},
  {label: "Serve", key: "serve"}
];
const ORDERS = [
  {name: "Pearl milk tea with ice", need: ["tea", "milk", "pearls", "ice"]},
  {name: "Milk tea, no ice", need: ["tea", "milk"]},
  {name: "Milk tea with pearls, no ice", need: ["tea", "milk", "pearls"]}
];
const MAXSTEPS = 12;
const copy = c => c && {items: c.items.slice(), sealed: c.sealed, served: c.served};

/* Run a list of instruction numbers against one order. Returns the cup after each step, the first failure and whether the order was served correctly. */
function algSim(prog, need) {
  let cup = null, fail = null;
  const snaps = [];
  for (let i = 0; i < prog.length && !fail; i++) {
    const k = INSTR[prog[i]];
    let why = null;
    if (k.key === "cup") {
      if (cup) why = "The robot is already holding a cup.";
      else cup = {items: [], sealed: false, served: false};
    } else if (k.key === "add") {
      if (!cup) why = "There is no cup yet, so nothing can be added.";
      else if (cup.served) why = "The drink is already served.";
      else if (cup.sealed) why = "The cup is already sealed, so nothing can be added.";
      else if (!need.includes(k.item)) why = "This order has no " + k.item + ".";
      else if (cup.items.includes(k.item)) why = "The cup already has " + k.item + ".";
      else cup.items.push(k.item);
    } else if (k.key === "seal") {
      if (!cup) why = "There is no cup to seal.";
      else if (cup.sealed) why = "The cup is already sealed.";
      else cup.sealed = true;
    } else {
      if (!cup) why = "There is no cup to serve.";
      else if (cup.served) why = "The drink is already served.";
      else if (!cup.sealed) why = "Serve needs a sealed cup.";
      else {
        const miss = need.filter(x => !cup.items.includes(x));
        if (miss.length) why = "The cup is missing " + join(miss) + ".";
        else cup.served = true;
      }
    }
    snaps.push(copy(cup));
    if (why) fail = {at: i, why};
  }
  if (!fail && prog.length && !(cup && cup.served)) fail = {at: prog.length, why: "The drink was never served."};
  return {snaps, fail, ok: !fail && prog.length > 0};
}

const A = {sel: 0, prog: [[], [], []], solved: [false, false, false], shown: 0, final: null, timer: null};
const algStop = () => { clearTimeout(A.timer); A.timer = null; };

function algCupText(c) {
  if (!c) return `The robot has no cup.`;
  const has = c.items.length ? "Holds " + join(c.items) + "." : "Empty.";
  const state = c.served ? "Served." : c.sealed ? "Sealed." : "Open.";
  return `${has}<span>${state}</span>`;
}

function algBuild() {
  $("#algOrders").innerHTML = ORDERS.map((x, i) =>
    `<button type="button" data-o="${i}" aria-pressed="false"><span class="chk"></span>Order ${i + 1}</button>`).join("");
  $$("#algOrders button").forEach(b => b.onclick = () => { algStop(); A.sel = +b.dataset.o; A.final = null; A.shown = 0; algRender(); });
  $("#algKeys").innerHTML = INSTR.map((k, i) => `<button type="button" class="btn" data-i="${i}">${k.label}</button>`).join("");
  $$("#algKeys button").forEach(b => b.onclick = () => {
    algStop(); A.final = null; A.shown = 0;
    const prog = A.prog[A.sel];
    if (prog.length >= MAXSTEPS) { algRender(); algVerdict("warn", "The list is full", `A list holds up to ${MAXSTEPS} steps. Press Undo to remove the last one.`); return; }
    prog.push(+b.dataset.i); algRender();
  });
}
function algRender() {
  const o = ORDERS[A.sel], prog = A.prog[A.sel], res = A.final;
  $$("#algOrders button").forEach((b, i) => {
    b.setAttribute("aria-pressed", i === A.sel);
    b.querySelector(".chk").innerHTML = A.solved[i] ? ICO("check") : "";
  });
  $("#algOrderText").innerHTML = `<b>Order ${A.sel + 1}:</b> ${o.name}. The cup must hold ${join(o.need)}.`;
  const sim = res ? res.sim : null;
  const n = A.shown;
  $("#algSteps").innerHTML = prog.length ? prog.map((p, i) => {
    let cls = "", mark = "";
    if (sim && i < n) {
      if (sim.fail && sim.fail.at === i) { cls = "fail"; mark = "Stopped here"; }
      else { cls = "done"; mark = ICO("check"); }
    }
    if (A.timer && i === n) cls = "run";
    return `<li class="${cls}"><span class="n">${i + 1}</span><span class="t">${INSTR[p].label}</span><span class="m">${mark}</span></li>`;
  }).join("") : `<li class="empty"><span class="t">No steps yet. Press an instruction.</span></li>`;
  const cupNow = sim && n > 0 ? sim.snaps[Math.min(n, sim.snaps.length) - 1] : null;
  $("#algCup").innerHTML = algCupText(cupNow);
  const set = (id, v, good) => { const g = $(id); g.querySelector(".gv").textContent = v; g.classList.toggle("good", !!good); };
  set("#algWritten", prog.length);
  const finished = !!(res && res.finished);
  set("#algDone", finished ? (sim.fail ? sim.fail.at : prog.length) + " of " + prog.length : "—", finished && sim.ok);
  if (finished) {
    if (sim.ok) {
      const all = A.solved.every(Boolean);
      algVerdict("ok", "Order correct", `The robot followed your ${prog.length} steps in the order you wrote them.` + (all ? " All three orders are done." : ""));
    } else {
      const at = sim.fail.at;
      algVerdict("bad", at < prog.length ? `Step ${at + 1} failed` : "The list ended", sim.fail.why + (at < prog.length ? " The robot stops at the first step it cannot do." : ""));
    }
  } else if (A.timer) algVerdict("", "Running", "The robot follows your steps one at a time.");
  else if (!prog.length) algVerdict("", `Order ${A.sel + 1}`, "The list is empty. Press an instruction to add step 1.");
  else algVerdict("", plural(prog.length, "step") + " written", "Press Run to see what the robot does.");
}
function algVerdict(cls, head, body) {
  const v = $("#algVerdict");
  v.className = "verdict" + (cls ? " " + cls : "");
  v.innerHTML = `<b>${head}</b>${body}`;
}

$("#algRun").onclick = () => {
  algStop();
  const prog = A.prog[A.sel];
  if (!prog.length) { A.final = null; A.shown = 0; algRender(); algVerdict("warn", "The list is empty", "Press an instruction to add a step, then press Run."); return; }
  const sim = algSim(prog, ORDERS[A.sel].need);
  A.final = {sim, finished: false};
  A.shown = 0;
  const total = sim.snaps.length;
  const finish = () => {
    A.timer = null; A.final.finished = true; A.shown = total;
    if (sim.ok) A.solved[A.sel] = true;
    algRender();
  };
  if (REDUCED) { finish(); return; }
  const tick = () => {
    A.timer = setTimeout(() => { if (A.shown < total) { A.shown++; tick(); } else finish(); }, 420);
    algRender();
  };
  tick();
};
$("#algUndo").onclick = () => { algStop(); A.final = null; A.shown = 0; A.prog[A.sel].pop(); algRender(); };
$("#algReset").onclick = () => { algStop(); A.prog = [[], [], []]; A.solved = [false, false, false]; A.sel = 0; A.final = null; A.shown = 0; algRender(); };
algBuild();
algRender();

/* ================= repeat block ================= */
const RP_STEPS = ["Take cup", "Add tea", "Add milk", "Seal", "Serve"];
const RP_RULES = [{label: "6 times", text: "6 times", count: 6}, {label: "Until the line is empty", text: "until the line is empty", count: null}];
const RP_MAX = 12;
const R = {rule: 0, n: 6, res: null};

function rpCompute() {
  const n = R.n, rule = RP_RULES[R.rule];
  const passes = rule.count === null ? n : rule.count;
  const served = Math.min(passes, n);
  return {n, passes, served, waiting: n - served, empty: passes - served, ran: passes * RP_STEPS.length};
}
function rpVerdict(cls, head, body) {
  const v = $("#rpVerdict");
  v.className = "verdict" + (cls ? " " + cls : "");
  v.innerHTML = `<b>${head}</b>${body}`;
}
function rpBuild() {
  $("#rpRules").innerHTML = RP_RULES.map((r, i) => `<button type="button" data-r="${i}" aria-pressed="false">${r.label}</button>`).join("");
  $$("#rpRules button").forEach(bt => bt.onclick = () => { R.rule = +bt.dataset.r; R.res = null; rpRender(); });
  $("#rpSteps").innerHTML = RP_STEPS.map(x => `<li>${x}</li>`).join("");
}
function rpRender() {
  $$("#rpRules button").forEach((bt, i) => bt.setAttribute("aria-pressed", i === R.rule));
  $("#rpRuleText").textContent = RP_RULES[R.rule].text;
  const res = R.res;
  let line = "";
  for (let i = 0; i < R.n; i++) {
    const served = res && i < res.served;
    const waiting = res && i >= res.served;
    line += `<span class="rpc${waiting ? " wait" : ""}">${ICO("user")}<span class="tick">${served ? ICO("check") : ""}</span></span>`;
  }
  $("#rpLine").innerHTML = line || `<span class="rplinenote">The line is empty.</span>`;
  $("#rpLine").setAttribute("role", "img");
  $("#rpLine").setAttribute("aria-label", plural(R.n, "customer") + " in line" + (res ? ", " + res.served + " served and " + res.waiting + " waiting" : ""));
  const set = (id, v, cls) => { const g = $(id); g.querySelector(".gv").textContent = v; g.classList.toggle("good", cls === "good"); g.classList.toggle("hot", cls === "hot"); };
  set("#rpRan", res ? res.ran : "—");
  set("#rpWaiting", res ? res.waiting : "—", res ? (res.waiting ? "hot" : "good") : "");
  if (!res) {
    rpVerdict("", `Line of ${R.n}`, R.n ? "Press Run line to serve the line with this rule." : "The line is empty. Press Add customer.");
    return;
  }
  const r = RP_RULES[R.rule];
  if (r.count === null) {
    if (res.n === 0) rpVerdict("ok", "Nothing to do", "The line is empty, so the loop made no drinks.");
    else rpVerdict("ok", `All ${res.n} customers served`, `The same ${RP_STEPS.length} steps ran ${plural(res.passes, "time")}, once for each customer.`);
  } else if (res.waiting > 0) {
    rpVerdict("bad", `${plural(res.waiting, "customer")} still waiting`, `The program counted to ${r.count} but the line had ${res.n}.`);
  } else if (res.empty > 0) {
    rpVerdict("warn", `${plural(res.empty, "cup")} for nobody`, `The line had ${res.n}, but the program counted to ${r.count}. It kept making drinks after the last customer.`);
  } else {
    rpVerdict("ok", `All ${res.n} customers served`, `The count of ${r.count} matches this line. A line of any other length changes the result.`);
  }
}
$("#rpRun").onclick = () => { R.res = rpCompute(); rpRender(); };
$("#rpAdd").onclick = () => {
  if (R.n >= RP_MAX) { rpVerdict("warn", `Line of ${R.n}`, `The line holds up to ${RP_MAX} customers.`); return; }
  R.n++; R.res = null; rpRender();
};
$("#rpRemove").onclick = () => {
  if (R.n <= 0) { rpVerdict("warn", "Line of 0", "There is nobody left to remove."); return; }
  R.n--; R.res = null; rpRender();
};
$("#rpReset").onclick = () => { R.rule = 0; R.n = 6; R.res = null; rpRender(); };
rpBuild();
rpRender();
})();
