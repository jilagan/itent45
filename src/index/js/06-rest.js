/* ================= 05 VERBS & REST ================= */
/* ---- live table: what each verb does to real rows ---- */
const SEED=[
 {id:"ITENT45", code:"ITENT 45", title:"Application Dev & Emerging Tech", units:3, slots:4},
 {id:"CSCI21",  code:"CSCI 21",  title:"Data Structures",                units:3, slots:0},
 {id:"ITMGT25", code:"ITMGT 25", title:"Programming Fundamentals",       units:3, slots:12}
];
const REQS=[
 {id:"getall", v:"GET",    d:"list every course"},
 {id:"getone", v:"GET",    item:true, d:"fetch the selected course"},
 {id:"post",   v:"POST",   d:"create a course from the body"},
 {id:"put",    v:"PUT",    item:true, body:true, d:"replace it with the body you write"},
 {id:"patch",  v:"PATCH",  item:true, body:true, d:"change only what the body contains"},
 {id:"del",    v:"DELETE", item:true, d:"remove it"}
];
const DB={rows:JSON.parse(JSON.stringify(SEED)), sel:"post", row:"ITENT45", log:[], mark:null, sent:0, lastId:null, seq:0};
const key=r=>r.id;                       // identity, not the display code
const slug=c=>c.trim().replace(/\s+/g,"").toUpperCase();
// the row a single-item request will act on
const selRow=()=>DB.rows.find(r=>key(r)===DB.row) || null;
const reqPath=q=>q.item ? `/courses/${DB.row}` : "/courses";

/* the body the PUT / PATCH builder currently describes */
function reqBody(){
  const on=k=>{const e=$("#bfOn"+k); return e?e.checked:true;};
  const val=(k,d)=>{const e=$("#bf"+k); return e?(e.type==="number"?+e.value:e.value):d;};
  const b={};
  if(on("Title")) b.title=val("Title","");
  if(on("Units")) b.units=val("Units",3);
  if(on("Slots")) b.slots=val("Slots",3);
  return b;
}
function renderBodyForm(){
  const q=REQS.find(x=>x.id===DB.sel);
  const f=$("#bodyForm"); if(!f) return;
  const on = !!(q && q.body);
  f.style.display = on ? "" : "none";
  if(!on) return;
  const b=reqBody(), keys=Object.keys(b);
  const missing=["title","units","slots"].filter(k=>!(k in b));
  const lines=keys.map(k=>` <span class="s">"${k}"</span>: ${typeof b[k]==="number"?b[k]:`<span class="s">"${b[k]}"</span>`}`);
  $("#bfBody").innerHTML =
    `<span class="kw">${q.v}</span> /courses/${DB.row}\n`+
    `Content-Type: <span class="d">application/json</span>\n\n`+
    (keys.length ? `{\n${lines.join(",\n")}\n}` : `{}`)+
    (missing.length
      ? `\n\n<span class="c">// not in the body: ${missing.join(", ")}</span>`+
        (q.id==="put"
          ? `\n<span class="c">// PUT replaces, so those become null</span>`
          : `\n<span class="c">// PATCH ignores them, so those keep their values</span>`)
      : `\n\n<span class="c">// every field is here, so both verbs would do the same thing</span>`);
}
["#bfTitle","#bfUnits","#bfSlots","#bfOnTitle","#bfOnUnits","#bfOnSlots"].forEach(sel=>{
  const el=$(sel); if(el) el.addEventListener("input", ()=>{renderBodyForm();});
});

/* what the POST form is currently describing */
function postBody(){
  return {
    code : ($("#pfCode")  ? $("#pfCode").value  : "").trim(),
    title: ($("#pfTitle") ? $("#pfTitle").value : "").trim(),
    units: +(($("#pfUnits")||{}).value || 3),
    slots: +(($("#pfSlots")||{}).value || 12)
  };
}
function renderPostForm(){
  const on = DB.sel==="post";
  const f=$("#postForm"); if(!f) return;
  f.style.display = on ? "" : "none";
  if(!on) return;
  const b=postBody();
  $("#pfBody").innerHTML =
    `<span class="kw">POST</span> /courses\n`+
    `Content-Type: <span class="d">application/json</span>\n\n`+
    `{<span class="s">"code"</span>: <span class="s">"${b.code||"…"}"</span>,\n`+
    ` <span class="s">"title"</span>: <span class="s">"${b.title||"…"}"</span>,\n`+
    ` <span class="s">"units"</span>: ${b.units},\n`+
    ` <span class="s">"slots"</span>: ${b.slots}}\n\n`+
    `<span class="c">// you send the code. The server derives the id it will</span>\n`+
    `<span class="c">// answer on, and stores both:  id = "${b.code?slug(b.code):"…"}"</span>`;
}
["#pfCode","#pfTitle","#pfUnits","#pfSlots"].forEach(sel=>{
  const el=$(sel); if(el) el.addEventListener("input", renderPostForm);
});

function dbRender(){
  const m=DB.mark||{};
  $("#dbCount").textContent=DB.rows.length+" row"+(DB.rows.length===1?"":"s");
  $("#dbBody").innerHTML = DB.rows.length ? DB.rows.map(r=>{
    const cls = (m.added===key(r) ? "added " : "") + (key(r)===DB.row ? "picked" : "");
    const cell=(f,v)=>{
      const c = (m.changed===key(r) && m.fields && m.fields.includes(f)) ? (v===null?"hlnull":"hl") : "";
      // the code is what people read; the id underneath it is what the URL uses
      const extra = f==="code" ? `<small class="rid">${r.id}</small>` : "";
      return `<td class="${f==="code"?"k ":""}${c}">${v===null?"null":v}${extra}</td>`;
    };
    return `<tr class="${cls}" data-row="${key(r)}">${cell("code",r.code)}${cell("title",r.title)}${cell("units",r.units)}${cell("slots",r.slots)}</tr>`;
  }).join("") + (m.gone?`<tr class="gone"><td class="k">${m.gone}</td><td>deleted</td><td>—</td><td>—</td></tr>`:"")
    : `<tr><td colspan="4" class="dbempty">No rows.</td></tr>`;

  $$("#dbBody tr[data-row]").forEach(tr=>tr.onclick=()=>{
    DB.row=tr.dataset.row; DB.sent=0; DB.lastId=null;
    $("#reqAgain").disabled=true; dbRender();
  });

  const gone=!selRow();
  const disp=selRow()?selRow().code:DB.row;
  $("#reqNote").innerHTML = gone
    ? `<b style="color:var(--warn)">${DB.row} is not in the table.</b> Single-item requests will return 404 until you pick a row that exists. Click one.`
    : `Click any row to point the single-item requests at it. Currently <b style="color:var(--req)">${disp}</b>.
       <br><br>Look at the row: it carries <b style="color:var(--ink)">two</b> fields. <code>${disp}</code> is the code people read, and <code>${DB.row}</code> underneath it is the id the URL uses. The space is not stripped and put back, because that would be a one-way trip. Both are stored when the course is created, and the id never changes after that.
       <br><br>The URL needs its own field because a literal space is not allowed in one, and would have to travel as <code>%20</code>. An identifier that needs encoding is an identifier waiting to cause a bug.`;
  $("#reqList").innerHTML=REQS.map(q=>`
    <button class="rq${q.id===DB.sel?" on":""}" data-r="${q.id}">
      <span class="vb ${q.v}">${q.v}</span>
      <span class="pt">${reqPath(q)}<small>${q.d}</small></span></button>`).join("");
  $$("#reqList .rq").forEach(el=>el.onclick=()=>{
    DB.sel=el.dataset.r; DB.sent=0; DB.lastId=null;
    $("#reqAgain").disabled=true; dbRender();
  });

  renderPostForm(); renderBodyForm();
  $("#reqLog").innerHTML=DB.log.slice(-5).reverse().map(l=>
    `<div class="le ${l.k}"><span class="st">${l.status}</span><span>${l.line}</span><span class="fx">${l.fx}</span></div>`).join("");
}
function send(){
  const q=REQS.find(x=>x.id===DB.sel);
  const same = DB.lastId===q.id;
  DB.sent = same ? DB.sent+1 : 1;
  DB.lastId=q.id; DB.mark=null;
  const target=selRow();
  let status="200 OK", fx="nothing changed", kind="ok";

  if(q.id==="getall"){ fx=`returned ${DB.rows.length} rows`; }
  else if(q.id==="getone"){
    if(target) fx="returned 1 row";
    else { status="404 Not Found"; fx="it is gone"; kind="err"; }
  }
  else if(q.id==="post"){
    const body=postBody();
    if(!body.code){
      status="422 Unprocessable"; fx="code is required"; kind="err";
    } else {
      // a duplicate code is allowed on purpose: the server has no reason to
      // refuse, and that is exactly what makes POST worth being careful with
      let id=slug(body.code), n=1;
      while(DB.rows.some(r=>r.id===id)) id=slug(body.code)+"-"+(++n);
      const row={id, code:body.code.trim(), title:body.title||"Untitled",
                 units:body.units, slots:body.slots};
      DB.rows.push(row); status="201 Created"; kind="new";
      fx=`row ${DB.rows.length} created`; DB.mark={added:id};
      DB.dupe = n>1;
    }
  }
  else if(q.id==="put"){
    if(!target){ status="404 Not Found"; fx="it is gone"; kind="err"; }
    else {
      const b=reqBody(), all=["title","units","slots"];
      // replace: anything the body left out is not preserved, it is emptied
      all.forEach(k=>{ target[k] = (k in b) ? b[k] : null; });
      const wiped=all.filter(k=>!(k in b));
      DB.wiped=wiped;
      fx = wiped.length ? `${wiped.join(", ")} wiped` : "all fields written";
      if(wiped.length) kind="err";
      DB.mark={changed:DB.row, fields:all};
    }
  }
  else if(q.id==="patch"){
    if(!target){ status="404 Not Found"; fx="it is gone"; kind="err"; }
    else {
      const b=reqBody(), keys=Object.keys(b);
      keys.forEach(k=>{ target[k]=b[k]; });           // only what arrived
      DB.wiped=[];
      fx = keys.length ? `${keys.join(", ")} updated` : "nothing sent, nothing changed";
      DB.mark={changed:DB.row, fields:keys};
    }
  }
  else if(q.id==="del"){
    if(target){ DB.rows=DB.rows.filter(r=>key(r)!==DB.row); status="204 No Content";
                fx="row removed"; DB.mark={gone:target.code}; DB.goneRow=DB.row; }
    else { status="404 Not Found"; fx="already gone"; kind="err"; }
  }
  DB.log.push({status, line:`${q.v} ${reqPath(q)}`, fx, k:kind});
  $("#reqAgain").disabled=false;
  dbRender(); dbVerdict(q);
}
function dbVerdict(q){
  const v=$("#dbVerdict"), n=DB.sent;
  const twice = n>1;
  if(q.v==="GET"){
    v.className="verdict ok";
    v.innerHTML=`<b>Sent ${n}×, still ${DB.rows.length} rows</b>GET only reads. You can send it a hundred times, refresh, or let a crawler follow it, and the data is untouched. That property has a name: <b class="i">safe</b>. It is also why putting a state change behind GET is such a bad idea, because everything on the internet assumes this.`;
  } else if(q.id==="post"){
    const b=postBody();
    if(!b.code){
      v.className="verdict bad";
      v.innerHTML=`<b>422, and nothing was created</b>The body had no <code>code</code>, so the server refused it. Read the number: <b class="i">4xx</b> means the request was the problem, and the table is untouched. Type a code and try again.`;
    } else if(twice){
      v.className="verdict bad";
      v.innerHTML=`<b>${n} clicks, ${n} rows called ${b.code}</b>You sent the identical body ${n} times and the server created a course each time. Nothing was wrong with any of those requests, and nothing stopped you ending up with duplicates. This is what <b class="i">not idempotent</b> means. It is the refresh-the-form bug, the double enrolment and the ₱3,897 charge in panel 08, all from one property.<br><br>Look at the URLs: the second one had to become <code>${slug(b.code)}-2</code>, because the code you chose was already taken.`;
    } else {
      v.className="verdict warn";
      v.innerHTML=`<b>201 Created, and ${b.code} is in the table</b>The server made something and told you where it lives. Now press <em>Send the same one again</em> without changing a thing, and count the rows.`;
    }
  } else if(q.v==="PUT"||q.v==="PATCH"){
    const missing=["title","units","slots"].filter(k=>!(k in reqBody()));
    if(q.v==="PUT" && missing.length){
      v.className="verdict bad";
      v.innerHTML=`<b>${missing.join(" and ")} ${missing.length>1?"are":"is"} now null</b>PUT means replace the whole thing. Your body left out <code>${missing.join("</code>, <code>")}</code>, so the server did exactly what you asked and what you omitted is gone. Nothing here was a mistake by the server.<br><br>Send it again and nothing further changes, so PUT is still <b class="i">idempotent</b>. Idempotent does not mean safe. It means repeatable.<br><br>Now switch to <b class="i">PATCH</b> without touching the form, and send that instead.`;
    } else if(q.v==="PATCH" && missing.length){
      v.className="verdict ok";
      v.innerHTML=`<b>Only ${Object.keys(reqBody()).join(", ")} changed</b>The same body you gave PUT, sent as PATCH. <code>${missing.join("</code> and <code>")}</code> were left out and are untouched, because PATCH describes a change rather than a replacement. One body, two verbs, two very different outcomes.<br><br>Send it again and the table does not move, so PATCH is <b class="i">idempotent</b> here too.`;
    } else {
      v.className = twice ? "verdict ok" : "verdict warn";
      v.innerHTML = twice
        ? `<b>Sent ${n}×, the table looks identical</b>Each request wrote the same values over the same values. The end state after ten sends is the end state after one, which is <b class="i">idempotent</b>. It changes data, so it is not safe. The two properties are separate questions.`
        : `<b>Every field was in the body, so both verbs agree</b>With a complete body, PUT and PATCH do the same thing. Untick a field and send again to see where they part company.`;
    }
  } else {
    v.className = twice ? "verdict ok" : "verdict warn";
    v.innerHTML = twice
      ? `<b>Second send returned 404</b>A different status code, and the same end state: the course is gone and stays gone. Idempotency is about where you end up, not about what you are told on the way. DELETE is <b class="i">idempotent</b>.`
      : `<b>204 No Content, row removed</b>Nothing to send back, so nothing was sent. Now press <em>Send the same one again</em>.`;
  }
}
$("#reqSend").onclick=()=>{ DB.lastId=null; send(); };
$("#reqAgain").onclick=send;
$("#reqReset").onclick=()=>{
  DB.rows=JSON.parse(JSON.stringify(SEED)); DB.log=[]; DB.mark=null; DB.row="ITENT45"; DB.goneRow=null;
  DB.sent=0; DB.lastId=null; DB.seq=0; $("#reqAgain").disabled=true;
  $("#dbVerdict").className="verdict"; $("#dbVerdict").innerHTML="<b>Reset</b>Three rows, as they started.";
  dbRender();
};
dbRender();
$("#dbVerdict").className="verdict";
$("#dbVerdict").innerHTML="<b>Ready</b>Pick a request and press Send.";

const VERBS=[
 {v:"GET",d:"Fetch something. Change nothing.",safe:true,idem:true,body:false,
  ex:`GET /courses/ITENT45 HTTP/1.1`,
  twice:"Identical answer both times. Nothing changed, so nothing can go wrong.",
  dj:{django:`request.method == "GET"  →  your list or detail view`,express:`router.get(path, handler)  →  your list or detail route`,laravel:`Route::get(...)  →  index() or show()`},
  note:"Because GET promises to change nothing, browsers, proxies and search crawlers feel free to send it whenever they like. Put a delete behind a GET and a crawler will eventually find it."},
 {v:"POST",d:"Create something new, or submit work.",safe:false,idem:false,body:true,
  ex:`POST /enrollments HTTP/1.1\nContent-Type: application/json\n\n{"student":"20-1234","code":"ITENT 45"}`,
  twice:"Two enrollments. This is exactly the refresh-the-form bug. The browser warns before resubmitting for that reason.",
  dj:{django:`request.method == "POST"  →  form.save() / Model.objects.create()`,express:`router.post(...)  →  prisma.model.create({ data })`,laravel:`Route::post(...)  →  Model::create($validated)`},
  note:"POST is the only common verb that is neither safe nor idempotent. Anything that must not happen twice needs protection you write yourself. A unique constraint, or an idempotency key the client sends."},
 {v:"PUT",d:"Replace an item completely.",safe:false,idem:true,body:true,
  ex:`PUT /courses/ITENT45 HTTP/1.1\nContent-Type: application/json\n\n{"title":"App Dev and Emerging Tech","units":3}`,
  twice:"Same result. You replaced it with those exact values; doing it again replaces it with the same values.",
  dj:{django:`request.method == "PUT"  →  overwrite every field on the instance`,express:`router.put(...)  →  prisma.model.update({ where, data })`,laravel:`Route::put(...)  →  $model->update($all)`},
  note:"PUT means the whole thing. Any field you leave out should be wiped, not kept. If you only wanted to change one field, the verb you wanted was PATCH."},
 {v:"PATCH",d:"Change part of an item.",safe:false,idem:true,body:true,
  ex:`PATCH /courses/ITENT45 HTTP/1.1\nContent-Type: application/json\n\n{"units":6}`,
  twice:"Same result for a plain value like this. Careful: a patch that says 'add 3 units' would not be idempotent.",
  dj:{django:`request.method == "PATCH"  →  update only the keys you were sent`,express:`router.patch(...)  →  update only the keys you were sent`,laravel:`Route::patch(...)  →  $model->fill($partial)->save()`},
  note:"The everyday verb for edit forms. Send only what changed, leave everything else alone."},
 {v:"DELETE",d:"Remove an item.",safe:false,idem:true,body:false,
  ex:`DELETE /enrollments/8891 HTTP/1.1`,
  twice:"First call removes it and returns 204. Second returns 404. The end state is the same either way, which is what idempotent means. The effect, not the status code.",
  dj:{django:`request.method == "DELETE"  →  instance.delete()`,express:`router.delete(...)  →  prisma.model.delete({ where })`,laravel:`Route::delete(...)  →  $model->delete()`},
  note:"Most real systems mark a row inactive instead of removing it, so that history survives. The verb still reads DELETE to the client."}
];
let vSel=0;
function renderVerbs(){
  $("#verbList").innerHTML=VERBS.map((v,i)=>`
    <button class="vb${i===vSel?" pick":""}" data-i="${i}">
      <div class="vn">${v.v}</div><div class="vd">${v.d}</div>
      <div class="flags">
        <span class="flag ${v.safe?"yes":"no"}">${v.safe?"safe":"changes data"}</span>
        <span class="flag ${v.idem?"yes":"no"}">${v.idem?"idempotent":"not idempotent"}</span>
      </div></button>`).join("");
  const v=VERBS[vSel];
  $("#verbDetail").innerHTML=`
    <div class="card-t">${v.v}, what it promises</div>
    <div class="art" style="margin-top:0">${v.ex.replace(/^([A-Z]+)/,'<span class="kw">$1</span>')}</div>
    <dl class="detail" style="margin-top:14px">
      <dt>Send it twice</dt><dd>${v.twice}</dd>
      <dt>In ${ {django:"Django",express:"Express",laravel:"Laravel"}[STACK] }</dt><dd><code>${v.dj[STACK]}</code></dd>
      <dt>The part that bites</dt><dd>${v.note}</dd>
    </dl>`;
  $$("#verbList .vb").forEach(el=>el.onclick=()=>{vSel=+el.dataset.i;renderVerbs()});
}
renderVerbs();

const MTX=[
 ["GET",  ["List them all","200 + an array",0,"Returns every course, usually paginated. The most common endpoint in any API."],
          ["Fetch that one","200, or 404",0,"The canonical way to read a single resource. If the code does not exist you get 404, not an empty 200."]],
 ["POST", ["Create a new one","201 + Location",0,"The server assigns the id and tells you where the new thing lives. Sending this twice creates two."],
          ["Rarely meaningful","405",1,"The item already exists, so there is nothing to create. Some APIs use this for actions like /courses/ITENT45/archive."]],
 ["PUT",  ["Replace the whole set","405 in practice",1,"This would mean 'discard every course and use these instead'. Almost no API allows it."],
          ["Replace that one","200 or 204",0,"Overwrites every field. Anything you omit gets wiped, which is the trap people hit first."]],
 ["PATCH",["Not meaningful","405",1,"There is no single thing to partially update."],
          ["Change some fields","200",0,"The everyday edit. Send only what changed."]],
 ["DELETE",["Delete everything","405",1,"Exactly as dangerous as it reads. If your API allows this, someone will eventually call it by accident."],
          ["Delete that one","204, then 404",0,"Removes it and returns no body. Calling it again gives 404, and the end state is unchanged."]]
];
$("#mtxBody").innerHTML=MTX.map(([v,coll,item],r)=>`
  <tr><td class="vcell">${v}</td>
  ${[coll,item].map((c,ci)=>`<td><button class="mc${c[2]?" warn2":""}" data-r="${r}" data-c="${ci}">
      ${c[0]}<span class="code">${c[1]}</span></button></td>`).join("")}
  </tr>`).join("");
$$("#mtxBody .mc").forEach(el=>el.onclick=()=>{
  $$("#mtxBody .mc").forEach(x=>x.classList.remove("pick"));
  el.classList.add("pick");
  const row=MTX[+el.dataset.r], cell=[row[1],row[2]][+el.dataset.c];
  const url=+el.dataset.c===0?"/courses":"/courses/ITENT45";
  $("#mtxOut").innerHTML=`<div class="et">${row[0]} ${url}</div><p>${cell[3]}</p>`;
});

/* ---- status codes ---- */
const CODES=[
 [200,"OK",2,"The answer is in the body. What a successful GET returns, and what PUT or PATCH return when they hand back the updated thing."],
 [201,"Created",2,"A new resource now exists, and the <code>Location</code> header says where. Do not resend this request, you would create a second one."],
 [204,"No Content",2,"It worked and there is deliberately nothing to send back. The usual answer to a successful DELETE. The body must be empty, not an empty string."],
 [301,"Moved Permanently",3,"This URL has changed forever. Browsers and search engines cache this very aggressively and for a long time, so it is painful to undo. Reach for 302 unless you are certain."],
 [303,"See Other",3,"Redirect after a POST. This is the classic cure for the refresh-resubmits-the-form bug: accept the POST, then redirect to a GET, so the page the user lands on is safe to reload. Same problem as the double-charge in panel 08, solved at a different layer."],
 [304,"Not Modified",3,"You already have the current version, so use your cached copy. No body at all. This is how conditional requests save real bandwidth on the catalog pages from panel 19."],
 [400,"Bad Request",4,"The request itself is malformed, broken JSON, a missing required field. The server could not even parse what you sent."],
 [401,"Unauthorized",4,"Badly named: it means <b>unauthenticated</b>. The server has no idea who you are. Send credentials and try again."],
 [403,"Forbidden",4,"The server knows exactly who you are and the answer is still no. Sending better credentials will not help."],
 [404,"Not Found",4,"The URL names nothing. The server is working perfectly. Check your path and your ids before you check anything else."],
 [405,"Method Not Allowed",4,"Right URL, wrong verb. This is every greyed-out cell in the matrix above, <code>DELETE /courses</code> when only <code>DELETE /courses/{code}</code> makes sense."],
 [409,"Conflict",4,"The request is valid but collides with the current state. Two students clicking for the same last seat: one gets 201, the other gets 409. This is the enlistment race from panel 20, expressed as a status code."],
 [422,"Unprocessable Content",4,"The syntax is fine but the meaning is wrong. A date in the past, a unit load over the maximum. Where Django form validation errors belong."],
 [429,"Too Many Requests",4,"Rate limited. Comes with a <code>Retry-After</code> header telling the client how long to wait. This is a server protecting the capacity you measured in panel 18."],
 [500,"Internal Server Error",5,"Your code raised an exception. This is always a bug, never a valid outcome. Stop looking at the front end and go and read the traceback."],
 [502,"Bad Gateway",5,"nginx reached your application and got nonsense back, or nothing at all, usually because the worker died. Panel 17's out-of-memory kill looks like this from outside."],
 [503,"Service Unavailable",5,"The server is running but refusing work: overloaded, or in maintenance. An honest 503 is far better than a slow 200."],
 [504,"Gateway Timeout",5,"Your application did not answer in time, so nginx gave up waiting. This is the queue in panel 18 overflowing, seen from the user's side. On enlistment morning this is the one you get."]
];
$("#codeChips").innerHTML=CODES.map(([c,n,f],i)=>
  `<button class="cd c${f}" data-i="${i}"><b>${c}</b>${n}</button>`).join("");
$$("#codeChips .cd").forEach(el=>el.onclick=()=>{
  $$("#codeChips .cd").forEach(x=>x.classList.remove("on"));
  el.classList.add("on");
  const [c,n,f,d]=CODES[+el.dataset.i];
  const who={2:"it worked",3:"look elsewhere",4:"your fault",5:"their fault"}[f];
  $("#codeOut").innerHTML=`<div class="et">${c} ${n.toUpperCase()} &nbsp;·&nbsp; ${f}xx, ${who}</div><p>${d}</p>`;
});

/* ---- one request or fifty: what request granularity costs ---- */
const G_RTT=38, G_REQ_HDR=700, G_H2_HDR=60, G_ITEM=120, G_RESP_HDR=250, G_CONN=6;
const GRAN={n:50, h2:false};
function granModel(){
  const n=GRAN.n, h2=GRAN.h2;
  const reqs=1+n;
  const rounds=h2?1:Math.ceil(reqs/G_CONN);
  const chatty={
    reqs, rounds, wait:rounds*G_RTT,
    up:G_REQ_HDR + n*(h2?G_H2_HDR:G_REQ_HDR),
    down:reqs*G_RESP_HDR + n*G_ITEM, handlers:reqs
  };
  const bulk={reqs:1, rounds:1, wait:G_RTT, up:G_REQ_HDR,
              down:G_RESP_HDR + n*G_ITEM, handlers:1};
  return {chatty, bulk, n, h2};
}
const kb=b=>b<1024?b+" B":(b/1024).toFixed(1)+" KB";
function renderGran(){
  const m=granModel();
  $("#granN").textContent=m.n;
  const rows=[
    ["Requests", m.chatty.reqs, m.bulk.reqs],
    ["Round trips", m.chatty.rounds, m.bulk.rounds],
    ["Time spent waiting", m.chatty.wait+" ms", m.bulk.wait+" ms"],
    ["Sent up the wire", kb(m.chatty.up), kb(m.bulk.up)],
    ["Came back down", kb(m.chatty.down), kb(m.bulk.down)],
    ["Handler runs on the server", m.chatty.handlers, m.bulk.handlers]
  ];
  $("#granBody").innerHTML=rows.map(([l,a,b])=>{
    const worse=String(a)!==String(b);
    return `<tr><td>${l}</td>
      <td class="${worse?"n":"y"}">${a}</td>
      <td class="y">${b}</td></tr>`;
  }).join("");

  const v=$("#granVerdict");
  const ratio=(m.chatty.up/m.bulk.up).toFixed(0);
  if(m.n<=3){
    v.className="verdict warn";
    v.innerHTML=`<b>At ${m.n} item${m.n===1?"":"s"} it barely matters</b>Both fit in one round trip and the byte difference is noise. This is worth knowing because it is how the chatty version gets written in the first place: it is fine in testing with three rows, and nobody looks again.`;
  } else if(m.h2){
    v.className="verdict warn";
    v.innerHTML=`<b>HTTP/2 fixed the waiting, and nothing else</b>All ${m.chatty.reqs} requests now go down one connection at once, so the wait drops back to a single round trip. But your server still runs <b class="i">${m.chatty.handlers} handlers</b> instead of one, still does ${m.n} database lookups, and still sends ${kb(m.chatty.down)} back where ${kb(m.bulk.down)} would do. The protocol hid the symptom. The N+1 is still there, and panel 15 puts a number on it.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>${m.chatty.rounds} round trips and ${kb(m.chatty.up)} of headers to fetch ${kb(m.n*G_ITEM)} of data</b>The browser will only hold six connections open to one host, so ${m.chatty.reqs} requests queue up in batches of six. That is <b class="i">${m.chatty.wait} ms</b> of waiting before the last course title appears, against ${m.bulk.wait} ms for the same information in one trip. Most of what went up the wire was the same cookie and user-agent, ${m.n} times over.`;
  }
}
$("#sGran").oninput=e=>{GRAN.n=+e.target.value;$("#vGran").textContent=GRAN.n;renderGran()};
$("#tgH2").onclick=()=>{GRAN.h2=!GRAN.h2;$("#tgH2").setAttribute("aria-pressed",GRAN.h2);renderGran()};
$("#sGran").dispatchEvent(new Event("input"));

/* ---- the reverse case: fetching more than anyone reads ---- */
const L_TOTAL=500, L_PAGE=20, L_ITEM=120, L_RTT=38, L_MS_PER_KB=1.6;
const LAZY={viewed:10};
function lazyModel(){
  const v=LAZY.viewed;
  const allB=L_TOTAL*L_ITEM;
  const pages=Math.max(1, Math.ceil(v/L_PAGE));
  const lazyB=pages*L_PAGE*L_ITEM;
  return {
    v,
    bulk:{rt:1, ttfc:L_RTT+allB/1024*L_MS_PER_KB, bytes:allB, waste:(L_TOTAL-v)*L_ITEM},
    lazy:{rt:pages, ttfc:L_RTT+(L_PAGE*L_ITEM)/1024*L_MS_PER_KB, bytes:lazyB,
          waste:(pages*L_PAGE-v)*L_ITEM}
  };
}
function renderLazy(){
  const m=lazyModel(), kb=b=>b<1024?b+" B":(b/1024).toFixed(1)+" KB";
  const rows=[
    ["First screen appears", Math.round(m.bulk.ttfc)+" ms", Math.round(m.lazy.ttfc)+" ms", "lazy"],
    ["Round trips", m.bulk.rt, m.lazy.rt, m.lazy.rt<=m.bulk.rt?"lazy":"bulk"],
    ["Transferred", kb(m.bulk.bytes), kb(m.lazy.bytes), m.lazy.bytes<=m.bulk.bytes?"lazy":"bulk"],
    ["Never looked at", kb(m.bulk.waste), kb(m.lazy.waste), m.lazy.waste<=m.bulk.waste?"lazy":"bulk"]
  ];
  $("#lazyBody").innerHTML=rows.map(([l,a,b,win])=>
    `<tr><td>${l}</td>
      <td class="${win==="bulk"?"y":"n"}">${a}</td>
      <td class="${win==="lazy"?"y":"n"}">${b}</td></tr>`).join("");

  const pct=Math.round(m.v/L_TOTAL*100);
  const v=$("#lazyVerdict");
  if(pct<=25){
    v.className="verdict ok";
    v.innerHTML=`<b>They read ${pct}% of it, and you sent all of it</b>Loading everything up front moved ${( m.bulk.bytes/1024).toFixed(0)} KB so the student could look at ${(m.v*L_ITEM/1024).toFixed(1)} KB of it, and made them wait ${Math.round(m.bulk.ttfc)} ms for the first screen instead of ${Math.round(m.lazy.ttfc)} ms. This is the shape of most catalogs, feeds and search results. Infinite scroll exists because of it.`;
  } else if(pct<80){
    v.className="verdict warn";
    v.innerHTML=`<b>${pct}% read: loading as they scroll still transfers less</b>${(m.lazy.bytes/1024).toFixed(1)} KB against ${(m.bulk.bytes/1024).toFixed(0)} KB, at the cost of ${m.lazy.rt} round trips instead of one. The first screen still arrives three times sooner. Somewhere past here the round trips start to hurt more than the wasted bytes, and where that sits depends on your users, not on a rule.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>They read nearly all of it, and paging cost you ${m.lazy.rt} round trips</b>The bytes are now the same either way, so the only difference left is <b class="i">${m.lazy.rt} trips against one</b>, and every one of those is a wait. For a reader like this, fetching up front is the better call. Look at what did not change: the first screen still appears in ${Math.round(m.lazy.ttfc)} ms rather than ${Math.round(m.bulk.ttfc)} ms, because they can start reading page one while page two is still coming.`;
  }
}
$("#sLazy").oninput=e=>{LAZY.viewed=+e.target.value;$("#vLazy").textContent=LAZY.viewed;renderLazy()};
$("#sLazy").dispatchEvent(new Event("input"));

