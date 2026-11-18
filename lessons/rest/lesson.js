/* Lesson rest. Widget code for the markup in lesson.html. */
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
      ? `\n\n<span class="c">// left out of the body: ${missing.join(", ")}</span>`+
        (q.id==="put"
          ? `\n<span class="c">// PUT replaces, so those become null (empty)</span>`
          : `\n<span class="c">// PATCH ignores them, so those keep their values</span>`)
      : `\n\n<span class="c">// every field is here, so both verbs do the same thing</span>`);
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
    `<span class="c">// You send the code. The server builds the id from it</span>\n`+
    `<span class="c">// and stores both:  id = "${b.code?slug(b.code):"…"}"</span>`;
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
    ? `<b style="color:var(--warn)">${DB.row} is not in the table.</b> Single-item requests return 404 until you click a row that exists.`
    : `Click a row to point the single-item requests at it. The selected row is <b style="color:var(--req)">${disp}</b>.`;
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
    else { status="404 Not Found"; fx="row not found"; kind="err"; }
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
    if(!target){ status="404 Not Found"; fx="row not found"; kind="err"; }
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
    if(!target){ status="404 Not Found"; fx="row not found"; kind="err"; }
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
    else { status="404 Not Found"; fx="row already deleted"; kind="err"; }
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
    v.innerHTML=`<b>Sent ${n}×, still ${DB.rows.length} rows</b>GET only reads, so repeating it changes nothing. A verb with this property is called <b class="i">safe</b>.`;
  } else if(q.id==="post"){
    const b=postBody();
    if(!b.code){
      v.className="verdict bad";
      v.innerHTML=`<b>422, and nothing was created</b>The body had no <code>code</code>, so the server refused it. Type a code and send again.`;
    } else if(twice){
      v.className="verdict bad";
      v.innerHTML=`<b>${n} clicks, ${n} rows called ${b.code}</b>The server created a course each time, and nothing stopped the duplicates. This is what <b class="i">not idempotent</b> means.`;
    } else {
      v.className="verdict warn";
      v.innerHTML=`<b>201 Created, and ${b.code} is in the table</b>Press <em>Send the same one again</em> without changing anything, and count the rows.`;
    }
  } else if(q.v==="PUT"||q.v==="PATCH"){
    const missing=["title","units","slots"].filter(k=>!(k in reqBody()));
    if(q.v==="PUT" && missing.length){
      v.className="verdict bad";
      v.innerHTML=`<b>${missing.join(" and ")} ${missing.length>1?"are":"is"} now null</b>PUT replaces the whole item, so the ${missing.length>1?"fields":"field"} your body left out ${missing.length>1?"are":"is"} now empty. Select <b class="i">PATCH</b>, keep the same body and send it.`;
    } else if(q.v==="PATCH" && missing.length){
      v.className="verdict ok";
      v.innerHTML=`<b>Only ${Object.keys(reqBody()).join(", ")} changed</b>PATCH left <code>${missing.join("</code> and <code>")}</code> untouched, and the same body sent with PUT emptied ${missing.length>1?"them":"it"}. Send it again and the table stays the same, so PATCH is <b class="i">idempotent</b> here.`;
    } else {
      v.className = twice ? "verdict ok" : "verdict warn";
      v.innerHTML = twice
        ? `<b>Sent ${n}×, the table looks the same</b>Each request wrote the same values over the same values, so the request is <b class="i">idempotent</b>. It changes data, so it is not safe.`
        : `<b>Every field was in the body, so PUT and PATCH give the same result</b>Untick a field and send again to see where they differ.`;
    }
  } else {
    v.className = twice ? "verdict ok" : "verdict warn";
    v.innerHTML = twice
      ? `<b>The second send returned 404</b>The reply changed and the end state is the same: the course is gone. So DELETE is <b class="i">idempotent</b>.`
      : `<b>204 No Content, row removed</b>Press <em>Send the same one again</em> and read the reply.`;
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
  ex:`GET /courses/ITENT45`,
  twice:"The answer is the same both times, because nothing changed.",
  note:"Search engines send GET to every link they find, so a GET must never delete anything."},
 {v:"POST",d:"Create something new, or submit work.",safe:false,idem:false,body:true,
  ex:`POST /enrollments`,
  twice:"Two enrollments are created. This is the double-enrollment bug after a page refresh.",
  note:"POST is the only common verb that is neither safe nor idempotent. Anything that must not happen twice needs protection that you build."},
 {v:"PUT",d:"Replace an item completely.",safe:false,idem:true,body:true,
  ex:`PUT /courses/ITENT45`,
  twice:"The result is the same. The second request replaces the item with the same values.",
  note:"PUT means the whole item, so any field you leave out is cleared."},
 {v:"PATCH",d:"Change part of an item.",safe:false,idem:true,body:true,
  ex:`PATCH /courses/ITENT45`,
  twice:"The result is the same for a plain value like units: 6. A patch that says 'add 3 units' would not be idempotent.",
  note:"The usual verb for edit forms. Send only what changed."},
 {v:"DELETE",d:"Remove an item.",safe:false,idem:true,body:false,
  ex:`DELETE /enrollments/8891`,
  twice:"The first call removes the item and returns 204. The second returns 404, and the end state is the same.",
  note:"Most real systems keep the row and mark it inactive, so the history survives."}
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
    <div class="card-t">What ${v.v} promises</div>
    <div class="art" style="margin-top:0">${v.ex.replace(/^([A-Z]+)/,'<span class="kw">$1</span>')}</div>
    <dl class="detail" style="margin-top:14px">
      <dt>Send it twice</dt><dd>${v.twice}</dd>
      <dt>Watch for</dt><dd>${v.note}</dd>
    </dl>`;
  $$("#verbList .vb").forEach(el=>el.onclick=()=>{vSel=+el.dataset.i;renderVerbs()});
}
renderVerbs();

const MTX=[
 ["GET",  ["List them all","200 + a list",0,"Returns every course, usually one page at a time."],
          ["Fetch that one","200, or 404",0,"The standard way to read one item. If the code does not exist, the server returns 404."]],
 ["POST", ["Create a new one","201 + Location",0,"The server assigns the id and returns the new item's URL in the Location header. Sending this twice creates two."],
          ["Rarely meaningful","405",1,"The item already exists, so there is nothing to create. Some APIs use this form for actions such as /courses/ITENT45/archive."]],
 ["PUT",  ["Replace the whole set","405 in practice",1,"This would mean discard every course and use these instead. Almost no API allows it."],
          ["Replace that one","200 or 204",0,"Overwrites every field, and any field you leave out is cleared. People make this mistake first."]],
 ["PATCH",["Not meaningful","405",1,"There is no single item to update part of."],
          ["Change some fields","200",0,"The everyday edit. Send only what changed."]],
 ["DELETE",["Delete everything","405",1,"This would delete every course, and someone would eventually call it by accident."],
          ["Delete that one","204, then 404",0,"Removes it and returns no body. Calling it again returns 404, and the end state is the same."]]
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
 [200,"OK",2,"The request worked and the answer is in the body. GET, PUT and PATCH return it when they succeed.",1],
 [201,"Created",2,"A new item now exists, and the <code>Location</code> header (a labeled line in the reply) gives its URL. Do not resend the request, because that would create a second item.",1],
 [204,"No Content",2,"It worked and there is nothing to send back. It is the usual reply to a successful DELETE.",0],
 [301,"Moved Permanently",3,"This URL has moved for good. Browsers and search engines remember the answer for a long time, so use 302 (a temporary move) unless you are sure.",1],
 [303,"See Other",3,"After a POST, the server sends the browser to a page that GET can safely reload. This stops a refresh from resubmitting the form.",0],
 [304,"Not Modified",3,"You already have the current version, so use the copy your browser saved. The reply has no body, which saves bandwidth.",0],
 [400,"Bad Request",4,"The request is malformed, such as broken JSON or a missing required field. The server could not read what you sent.",1],
 [401,"Unauthorized",4,"The name is misleading, because it means unauthenticated. The server does not know who you are, so send your login details and try again.",1],
 [403,"Forbidden",4,"The server knows who you are and still says no. Better credentials will not help.",1],
 [404,"Not Found",4,"The URL names nothing, and the server is working. Check your path and your ids first.",1],
 [405,"Method Not Allowed",4,"The URL is right and the verb is wrong, such as <code>DELETE /courses</code> on a server that allows DELETE only on one course.",0],
 [409,"Conflict",4,"The request is valid and clashes with the current state. If two students click for the last seat, one gets 201 and the other gets 409.",0],
 [422,"Unprocessable Content",4,"The syntax is fine and the content breaks a rule, such as a date in the past or a unit load over the maximum.",0],
 [429,"Too Many Requests",4,"The client sent too many requests, so the server is limiting it. A <code>Retry-After</code> header says how long to wait.",0],
 [500,"Internal Server Error",5,"The server code failed with an error, which is always a bug. Read the server's error report (the traceback) and ignore the page itself.",1],
 [502,"Bad Gateway",5,"A server in front of your application (a gateway) got no valid reply from it, usually because the worker process died.",0],
 [503,"Service Unavailable",5,"The server is running and refusing work because it is overloaded or in maintenance. A 503 is better than a very slow 200.",0],
 [504,"Gateway Timeout",5,"Your application did not reply in time, so the gateway stopped waiting. On enlistment morning this is the code people see.",0]
];
const chip=([c,n,f],i)=>`<button class="cd c${f}" data-i="${i}"><b>${c}</b>${n}</button>`;
$("#codeChips").innerHTML=CODES.map((x,i)=>x[4]?chip(x,i):"").join("");
if($("#codeChipsMore")) $("#codeChipsMore").innerHTML=CODES.map((x,i)=>x[4]?"":chip(x,i)).join("");
$$("#codeChips .cd, #codeChipsMore .cd").forEach(el=>el.onclick=()=>{
  $$("#codeChips .cd, #codeChipsMore .cd").forEach(x=>x.classList.remove("on"));
  el.classList.add("on");
  const [c,n,f,d]=CODES[+el.dataset.i];
  const who={2:"success",3:"redirect",4:"client error",5:"server error"}[f];
  $("#codeOut").innerHTML=`<div class="et">${c} ${n} &nbsp;·&nbsp; ${f}xx, ${who}</div><p>${d}</p>`;
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
    ["Data sent", kb(m.chatty.up), kb(m.bulk.up)],
    ["Data received", kb(m.chatty.down), kb(m.bulk.down)],
    ["Server handler runs", m.chatty.handlers, m.bulk.handlers]
  ];
  $("#granBody").innerHTML=rows.map(([l,a,b])=>{
    const worse=String(a)!==String(b);
    return `<tr><td>${l}</td>
      <td class="${worse?"n":"y"}">${a}</td>
      <td class="y">${b}</td></tr>`;
  }).join("");

  const v=$("#granVerdict");
  if(m.n<=3){
    v.className="verdict warn";
    v.innerHTML=`<b>At ${m.n} item${m.n===1?"":"s"} it makes almost no difference</b>Both versions fit in one round trip and the difference in data is small. The many-request version passes testing with three rows, and nobody checks it again.`;
  } else if(m.h2){
    v.className="verdict warn";
    v.innerHTML=`<b>HTTP/2 reduced the waiting and nothing else</b>All ${m.chatty.reqs} requests now share one connection, so the wait drops to a single round trip. The server still runs <b class="i">${m.chatty.handlers} handlers</b> where one would do, a pattern called the N+1 problem.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>${m.chatty.rounds} round trips and ${kb(m.chatty.up)} of headers to fetch ${kb(m.n*G_ITEM)} of data</b>A browser opens only six connections to one host, so ${m.chatty.reqs} requests wait in batches of six. The last course title appears after <b class="i">${m.chatty.wait} ms</b>, against ${m.bulk.wait} ms for one request.`;
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
    v.innerHTML=`<b>They read ${pct}% of it, and you sent all of it</b>Loading everything moved ${(m.bulk.bytes/1024).toFixed(0)} KB so the student could look at ${(m.v*L_ITEM/1024).toFixed(1)} KB, and the first screen took ${Math.round(m.bulk.ttfc)} ms. Loading one page at a time takes ${Math.round(m.lazy.ttfc)} ms.`;
  } else if(pct<80){
    v.className="verdict warn";
    v.innerHTML=`<b>${pct}% read: loading as they scroll still transfers less</b>Paging sends ${(m.lazy.bytes/1024).toFixed(1)} KB against ${(m.bulk.bytes/1024).toFixed(0)} KB, at the cost of ${m.lazy.rt} round trips where loading everything takes one. Where the balance tips depends on your users.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>They read nearly all of it, and paging cost you ${m.lazy.rt} round trips</b>The data moved is now about the same, so the only difference left is <b class="i">${m.lazy.rt} round trips against one</b>. Fetching everything up front suits a reader like this.`;
  }
}
$("#sLazy").oninput=e=>{LAZY.viewed=+e.target.value;$("#vLazy").textContent=LAZY.viewed;renderLazy()};
$("#sLazy").dispatchEvent(new Event("input"));
