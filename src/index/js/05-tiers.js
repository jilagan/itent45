/* ================= 01 TIERS ================= */
const TIERS=[
 {n:"Tier 1",h:"Presentation, the browser",
  p:"HTML, CSS and JavaScript. This code is downloaded and then runs on the user's own machine, which means you do not control it and cannot trust what it tells you.",
  m:[["Runs on","the user's laptop"],["You write","templates, JS"],["In practice","templates / static"]],
  mv:{django:[["Runs on","the user's laptop"],["You write","templates, JS"],["In practice","templates / static"]],
      express:[["Runs on","the user's laptop"],["You write","JSX, CSS, JS"],["In practice","the React bundle"]],
      laravel:[["Runs on","the user's laptop"],["You write","Blade, CSS, JS"],["In practice","Blade views / public"]]}},
 {n:"Tier 2",h:"Application, your server process",
  p:"Routing, permission checks, business rules, and turning data into a response. This is the only tier that holds credentials, and the only one that decides which questions the database is allowed to answer.",
  m:[["Runs on","your server"],["You write","routes, handlers, models"],["In practice","the project itself"]],
  mv:{django:[["Runs on","your server"],["You write","urls.py, views, models"],["Stack","Django + gunicorn"]],
      express:[["Runs on","your server"],["You write","routes, controllers, models"],["Stack","Express + Node"]],
      laravel:[["Runs on","your server"],["You write","routes, controllers, models"],["Stack","Laravel + PHP-FPM"]]}},
 {n:"Tier 3",h:"Data, the database",
  p:"A separate program that stores rows and answers SQL. It receives text, plans how to answer it, and returns a grid of values.",
  pv:{django:"A separate program that stores rows and answers SQL. It has never heard of Python or Django. It receives text, plans how to answer it, and returns a grid of values.",
      express:"A separate program that stores rows and answers SQL. It has never heard of JavaScript or Prisma. It receives text, plans how to answer it, and returns a grid of values.",
      laravel:"A separate program that stores rows and answers SQL. It has never heard of PHP or Eloquent. It receives text, plans how to answer it, and returns a grid of values."},
  m:[["Runs on","your server, or its own"],["You write","schema, indexes, queries"],["In practice","Postgres behind the ORM"]]}
];
const TRACE=[
 {t:1,h:"You click a button on a page you already have",
  x:"The page at <code>/my-courses</code> is already open. Clicking here navigates nowhere: JavaScript on the page asks for data instead, so the address bar will not change. The browser is a program on your own laptop, and nothing has left your machine yet.",
  l:"the page, tier 1",
  a:`<span class="d">&lt;button onclick=</span><span class="s">"loadCourses()"</span><span class="d">&gt;</span>My Courses<span class="d">&lt;/button&gt;</span>

<span class="kw">async function</span> loadCourses(){
  <span class="kw">const</span> r = <span class="kw">await</span> fetch(<span class="s">"/api/enrollments?student=20-1234"</span>);
  render(<span class="kw">await</span> r.json());   <span class="c">// address bar stays on /my-courses</span>
}`},
 {t:1,h:"The browser builds a request",
  x:"It turns that URL into the plain text message from panel 04. Your Django code has not run yet. The server does not know you exist.",
  l:"HTTP request, tier 1",
  a:`<span class="kw">GET</span> /api/enrollments?student=20-1234 HTTP/1.1\nHost: enlist.university.edu\nAccept: application/json\nCookie: sessionid=8f2a...`},
 {t:0,h:"The request crosses the network",
  x:"Wrapped in the envelopes from panel 02, hopping across however many routers sit between you and the server. This is the part that costs milliseconds no amount of code can remove.",
  l:"panels 02 and 03",
  a:`<span class="c">laptop → wifi → ISP → ... → data centre → server</span>\n<span class="c">every hop rewrites the L2 frame, nothing above it</span>`},
 {t:2,h:"The framework matches the URL",
  x:"Your server process reads the path and walks its route table top to bottom, taking the first pattern that matches. Every framework has this file; only the syntax changes.",
  lv:{django:"urls.py, tier 2", express:"routes/index.js, tier 2", laravel:"routes/api.php, tier 2"},
  av:{
   django:`urlpatterns = [\n    path(<span class="s">"my-courses"</span>, views.my_courses_page),  <span class="c"># the page you are on</span>\n    path(<span class="s">"api/enrollments"</span>, views.enrollment_list),\n    path(<span class="s">"api/courses/&lt;str:code&gt;"</span>, views.course_detail),\n]`,
   express:`router.get(<span class="s">"/api/enrollments"</span>, enrollmentList);\nrouter.get(<span class="s">"/api/courses/:code"</span>, courseDetail);`,
   laravel:`Route::get(<span class="s">'/api/enrollments'</span>, [EnrollmentController::<span class="kw">class</span>, <span class="s">'index'</span>]);\nRoute::get(<span class="s">'/api/courses/{code}'</span>, [CourseController::<span class="kw">class</span>, <span class="s">'show'</span>]);`}},
 {t:2,h:"Your handler runs",
  x:"Finally, your code. This function runs on the server, inside a process you control, with access to secrets the browser must never see.",
  lv:{django:"views.py, tier 2", express:"controller, tier 2", laravel:"Controller, tier 2"},
  av:{
   django:`<span class="kw">def</span> enrollment_list(request):\n    <span class="kw">if</span> <span class="kw">not</span> request.user.is_authenticated:\n        <span class="kw">return</span> JsonResponse({...}, status=<span class="s">401</span>)\n    sid = request.GET.get(<span class="s">"student"</span>)`,
   express:`<span class="kw">async function</span> enrollmentList(req, res) {\n  <span class="kw">if</span> (!req.user) <span class="kw">return</span> res.status(<span class="s">401</span>).json({...});\n  <span class="kw">const</span> sid = req.query.student;`,
   laravel:`<span class="kw">public function</span> index(Request $request) {\n    <span class="kw">if</span> (! $request->user()) {\n        <span class="kw">return</span> response()->json([...], <span class="s">401</span>);\n    }\n    $sid = $request->query(<span class="s">'student'</span>);`}},
 {t:2,h:"The ORM writes SQL for you",
  x:"This line is not magic. The ORM turns it into a SQL string and hands that string to the database driver. Everything you can do here, you could do by writing the SQL yourself.",
  lv:{django:"Django ORM, tier 2", express:"Prisma, tier 2", laravel:"Eloquent, tier 2"},
  av:{
   django:`qs = (Enrollment.objects\n        .filter(student_id=sid)\n        .select_related(<span class="s">"course"</span>))\n\n<span class="c"># select_related is why this stays one query</span>\n<span class="c"># instead of one per row — see card F</span>`,
   express:`<span class="kw">const</span> rows = <span class="kw">await</span> prisma.enrollment.findMany({\n  where:   { studentId: sid },\n  include: { course: <span class="kw">true</span> }\n});\n\n<span class="c">// include is why this stays one query</span>\n<span class="c">// instead of one per row — see card F</span>`,
   laravel:`$rows = Enrollment::where(<span class="s">'student_id'</span>, $sid)\n        ->with(<span class="s">'course'</span>)\n        ->get();\n\n<span class="c">// with() is why this stays one query</span>\n<span class="c">// instead of one per row — see card F</span>`}},
 {t:3,h:"The database receives SQL",
  x:"A separate program, often on a separate machine. It parses the text, plans how to answer it, and reads from disk or memory. It does not know Django exists.",
  l:"the actual query, tier 3",
  a:`<span class="kw">SELECT</span> e.id, e.student_id, c.code, c.title, c.units\n<span class="kw">FROM</span> enrollment e\n<span class="kw">JOIN</span> course c <span class="kw">ON</span> c.id = e.course_id\n<span class="kw">WHERE</span> e.student_id = <span class="s">'20-1234'</span>;`},
 {t:3,h:"Rows come back",
  x:"Not objects, rows. A grid of values with no behavior attached. The database has no concept of a Python class.",
  l:"result set, tier 3",
  a:`<span class="d"> id  | student_id | code     | title              | units</span>\n<span class="d">-----+------------+----------+--------------------+------</span>\n 881 | 20-1234    | ITENT 45 | Application Dev... |     3\n 882 | 20-1234    | CSCI 21  | Data Structures    |     3`},
 {t:2,h:"Rows become objects",
  x:"The ORM maps each row onto an object so you can use dot notation. This mapping is the O in ORM, and it is not free. It costs CPU and memory in proportion to how many rows you asked for.",
  lv:{django:"back in tier 2", express:"back in tier 2", laravel:"back in tier 2"},
  av:{
   django:`[&lt;Enrollment: 20-1234 → ITENT 45&gt;,\n &lt;Enrollment: 20-1234 → CSCI 21&gt;]`,
   express:`[ { id: 881, course: { code: <span class="s">'ITENT 45'</span>, units: 3 } },\n  { id: 882, course: { code: <span class="s">'CSCI 21'</span>,  units: 3 } } ]`,
   laravel:`Illuminate\\Support\\Collection {\n  <span class="d">#items:</span> [ App\\Models\\Enrollment {...},\n            App\\Models\\Enrollment {...} ]\n}`}},
 {t:2,h:"Objects become text",
  x:"Objects cannot travel over a socket. They are serialized into JSON, plain text, exactly like the response in panel 04.",
  lv:{django:"serialization, tier 2", express:"serialization, tier 2", laravel:"serialization, tier 2"},
  av:{
   django:`<span class="kw">return</span> JsonResponse({\n  <span class="s">"enrollments"</span>: [\n    {<span class="s">"code"</span>: <span class="s">"ITENT 45"</span>, <span class="s">"units"</span>: 3},\n    {<span class="s">"code"</span>: <span class="s">"CSCI 21"</span>,  <span class="s">"units"</span>: 3}\n  ]\n})`,
   express:`res.json({\n  enrollments: [\n    { code: <span class="s">"ITENT 45"</span>, units: 3 },\n    { code: <span class="s">"CSCI 21"</span>,  units: 3 }\n  ]\n});`,
   laravel:`<span class="kw">return</span> response()->json([\n  <span class="s">'enrollments'</span> => [\n    [<span class="s">'code'</span> => <span class="s">'ITENT 45'</span>, <span class="s">'units'</span> => 3],\n    [<span class="s">'code'</span> => <span class="s">'CSCI 21'</span>,  <span class="s">'units'</span> => 3]\n  ]\n]);`}},
 {t:0,h:"The response crosses back",
  x:"Status line, headers, blank line, body. The same shape as every response in panel 04, and it pays the same network cost on the way home.",
  l:"HTTP response",
  a:`<span class="kw">HTTP/1.1 200 OK</span>\nContent-Type: application/json\nContent-Length: 94\n\n{<span class="s">"enrollments"</span>: [ ... ]}`},
 {t:1,h:"The browser renders it",
  x:"JavaScript on the user's laptop parses the JSON and writes DOM nodes. This code runs on a machine you do not control. Which is why every check you did in tier 2 has to exist there, and not only here.",
  l:"back in tier 1",
  a:`<span class="kw">const</span> r = <span class="kw">await</span> fetch(<span class="s">"/api/enrollments?student=20-1234"</span>);\n<span class="kw">const</span> data = <span class="kw">await</span> r.json();\nlist.innerHTML = data.enrollments\n  .map(e =&gt; <span class="s">\`&lt;li&gt;\${e.code}&lt;/li&gt;\`</span>).join(<span class="s">""</span>);`}
];
let trI=0, trTimer=null, trView="wire";

/* --- what the user actually sees at each step --- */
const PAGE_CSS=`<style>
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;
  background:#fff;color:var(--panel);padding:20px 24px;display:flex;flex-direction:column}
h1{font-size:19px;margin:0 0 3px;letter-spacing:-.01em}
.sub{color:var(--dim2);font-size:13px;margin-bottom:16px}
a{color:var(--link);text-decoration:none;font-weight:600;font-size:15px}
ul{list-style:none;padding:0;margin:0}
li{display:flex;justify-content:space-between;align-items:center;
  padding:12px 14px;border:1px solid var(--ink);border-radius:7px;margin-bottom:8px}
.code{font-weight:600;font-size:15px}
.units{color:var(--dim2);font-size:13px}
.mid{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}
.spin{width:26px;height:26px;border-radius:50%;border:3px solid var(--ink);
  border-top-color:var(--link);animation:sp .8s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
.wait{color:var(--dim2);font-size:13px}
@media (prefers-reduced-motion:reduce){.spin{animation:none;border-top-color:var(--dim2)}}
</style>`;

const VIEWS={
 start:{ html:`${PAGE_CSS}<h1>The enlistment system</h1><div class="sub">Logged in as 20-1234</div>
   <div class="mid" style="justify-content:flex-start;align-items:flex-start"><a href="#">My Courses &rsaquo;</a></div>`,
   spin:false, url:"https://enlist.university.edu/",
   cap:`The page they are on right now. Nothing has been asked for yet.` },
 loading:{ html:`${PAGE_CSS}<h1>My Courses</h1><div class="sub">&nbsp;</div>
   <div class="mid"><div class="spin"></div><div class="wait">Waiting for the server</div></div>`,
   spin:true, url:"https://enlist.university.edu/my-courses",
   cap:`<b>This is most of the trace.</b> Ten of the twelve steps happen behind this spinner. The user cannot tell a fast database from a slow one. Only how long they stare at this.` },
 done:{ html:`${PAGE_CSS}<h1>My Courses</h1><div class="sub">First Semester, 2026&ndash;2027</div>
   <ul>
     <li data-src="json"><span class="code">ITENT 45</span><span class="units">3 units</span></li>
     <li data-src="json"><span class="code">CSCI 21</span><span class="units">3 units</span></li>
   </ul>`,
   spin:false, url:"https://enlist.university.edu/my-courses",
   cap:`Everything above finally became pixels. Rows from the database are now DOM nodes, drawn on a machine you do not control.` }
};
function stepView(i){
  if(i===0) return "start";
  if(i>=TRACE.length-1) return "done";
  return "loading";
}
let browSeq=0;
function renderBrowser(){
  const v=VIEWS[stepView(trI)];
  const f=$("#browFrame");
  // a discarded browsing context will not reload if srcdoc is byte-identical,
  // which is what produced the blank frame after toggling. Keep it unique.
  f.removeAttribute("srcdoc");
  f.srcdoc = v.html + "<!--" + (++browSeq) + "-->";
  $(".brow-url").textContent=v.url;
  $("#browSpin").style.visibility = v.spin ? "visible" : "hidden";
  $("#browCap").innerHTML=v.cap;
}
/* the tree is read out of the page the iframe actually rendered, not hand-written */
function buildDomTree(root, depth, out){
  for(const el of root.children){
    const tag=el.tagName.toLowerCase();
    if(tag==="style"||tag==="script") continue;
    const text=[...el.childNodes].filter(n=>n.nodeType===3)
      .map(n=>n.textContent.trim()).join(" ").trim();
    out.push({depth, tag, cls: el.getAttribute("class")||"",
      href: el.getAttribute("href")||"", text,
      json: !!(el.dataset && el.dataset.src==="json")});
    buildDomTree(el, depth+1, out);
  }
  return out;
}
function renderDom(){
  const f=$("#browFrame"), box=$("#trDom"), cap=$("#domCap");
  let doc=null;
  try{ doc=f.contentDocument; }catch(e){ doc=null; }
  if(!doc||!doc.body){ box.innerHTML='<span class="c">building the tree\u2026</span>'; return; }
  const nodes=buildDomTree(doc.body,0,[]);
  box.innerHTML = `<span class="c">document</span>\n<span class="kw">&lt;body&gt;</span>\n` +
    nodes.map(n=>{
      const pad="  ".repeat(n.depth+1);
      const cls=n.cls?`<span class="d"> class=</span><span class="s">"${n.cls}"</span>`:"";
      const href=n.href?`<span class="d"> href=</span><span class="s">"${n.href}"</span>`:"";
      const txt=n.text?`\n${pad}  <span class="s">"${n.text}"</span>`:"";
      const mark=n.json?`   <span class="kw">\u2190 built from the JSON</span>`:"";
      const c=n.json?"kw":"d";
      return `${pad}<span class="${c}">&lt;${n.tag}</span>${cls}${href}<span class="${c}">&gt;</span>${mark}${txt}`;
    }).join("\n");
  const made=nodes.filter(n=>n.json).length;
  cap.innerHTML = made
    ? `<b>Not one of these nodes came over the network.</b> The response was text. JavaScript on the user's laptop parsed it and created ${made} list items, and only then did the browser turn the tree into pixels. Text \u2192 tree \u2192 what you see.`
    : `A page is a tree of nodes before it is ever a picture. Step forward and watch the tree change shape as the data arrives.`;
}
function setView(mode){
  trView=mode;
  $("#vWire").setAttribute("aria-pressed",mode==="wire");
  $("#vDom").setAttribute("aria-pressed",mode==="dom");
  $("#vRender").setAttribute("aria-pressed",mode==="render");
  $("#trArt").style.display  = mode==="wire"   ? "" : "none";
  $("#trDom").style.display  = mode==="dom"    ? "" : "none";
  $("#domCap").style.display = mode==="dom"    ? "" : "none";
  $("#trBrow").style.display = mode==="render" ? "" : "none";
  if(mode!=="wire"){ renderBrowser(); if(mode==="dom") setTimeout(renderDom,60); }
}
$("#browFrame").addEventListener("load",()=>{ if(trView==="dom") renderDom(); });
$$("#stackTog button").forEach(btn=>btn.onclick=()=>{
  $$("#stackTog button").forEach(x=>x.setAttribute("aria-pressed", x===btn));
  STACK=btn.dataset.st;
  renderTiers(); renderTrace(); placeBall(trI); stackNote(); if(typeof renderVerbs==='function') renderVerbs();
});
$("#vWire").onclick=()=>setView("wire");
$("#vDom").onclick=()=>setView("dom");
$("#vRender").onclick=()=>setView("render");
let STACK="django";
const STACK_NAME={django:"Django process",express:"Node process",laravel:"PHP-FPM process"};
function renderTiers(){
  TIERS.forEach((t,i)=>{
    const meta = (t.mv && t.mv[STACK]) ? t.mv[STACK] : t.m;
    let name = (t.h.split(", ")[1]||t.h).replace(/^./,c=>c.toUpperCase());
    if(i===1) name = "Your " + STACK_NAME[STACK];
    $("#tb"+(i+1)).innerHTML=`
      <div class="tn">${t.n}</div>
      <h4>${name}</h4>
      <div class="trole">${t.h.split(", ")[0]} tier</div>
      <p>${(t.pv && t.pv[STACK]) ? t.pv[STACK] : t.p}</p>
      <div class="meta">${meta.map(([k,v])=>`<span>${k}: <b>${v}</b></span>`).join("")}</div>`;
  });
}
renderTiers();

/* which hop is moving at each step, and what is on it */
const SEG=[
 null,                                                  // 1 click
 null,                                                  // 2 build request
 {lane:"A",dir:"fwd",p:"GET /api/enrollments"},         // 3 network
 null,                                                  // 4 urls.py
 null,                                                  // 5 view runs
 null,                                                  // 6 ORM builds SQL
 {lane:"B",dir:"fwd",p:"SELECT … JOIN course …"},       // 7 db receives
 {lane:"B",dir:"back",p:"2 rows"},                      // 8 rows come back
 null,                                                  // 9 rows to objects
 null,                                                  // 10 objects to JSON
 {lane:"A",dir:"back",p:"200 OK + JSON"},               // 11 response back
 null                                                   // 12 render
];
/* where the ball is, step by step: tb1 -> laneA -> tb2 -> tb3 -> laneB -> tb2 -> laneA -> tb1 */
const BALL_AT=["tb1","tb1","laneA","tb2","tb2","tb2","tb3","laneB","tb2","tb2","laneA","tb1"];
function laneEl(which){ return $(`.lane[data-lane="${which}"]`); }
function flowStacked(){
  const a=$("#tb1").getBoundingClientRect(), b=$("#tb3").getBoundingClientRect();
  return Math.abs((a.left+a.width/2)-(b.left+b.width/2)) < 20;
}
function placeBall(i){
  const flow=$(".flow"), ball=$("#flowBall");
  if(!flow||!ball) return;
  const key=BALL_AT[i]||"tb1";
  const el = key==="laneA" ? laneEl("A") : key==="laneB" ? laneEl("B") : $("#"+key);
  if(!el) return;
  const returning = i>=7;
  if(flowStacked()){
    const fb2=flow.getBoundingClientRect(), tb2=el.getBoundingClientRect();
    ball.style.left=(tb2.right-fb2.left-14)+"px";
    ball.style.top =(tb2.top-fb2.top+tb2.height/2)+"px";
    ball.classList.toggle("res", returning);
    return;
  }
  // outbound rides the upper rail (request / query); the return leg rides the lower one (response / rows)
  const rail = $(returning ? "#railAb" : "#railAf");
  const fb=flow.getBoundingClientRect(), tb=el.getBoundingClientRect();
  const railY = rail.getBoundingClientRect().top - fb.top;
  ball.style.left = (tb.left - fb.left + tb.width/2) + "px";
  ball.style.top  = railY + 1 + "px";
  ball.classList.toggle("res", returning);
}
function animateHop(i){
  ["railAf","railAb","railBf","railBb"].forEach(id=>$("#"+id).classList.remove("on-req","on-res"));
  ["capA","capB"].forEach(id=>{const c=$("#"+id);c.className="lcap";c.textContent=""});
  placeBall(i);
  const seg=SEG[i];
  if(!seg) return;
  const fwd = seg.dir==="fwd";
  $("#rail"+seg.lane+(fwd?"f":"b")).classList.add(fwd?"on-req":"on-res");
  const cap=$("#cap"+seg.lane);
  cap.className="lcap on "+(fwd?"req":"res");
  cap.textContent=seg.p;
}
addEventListener("resize",()=>{ if($(".panel.on")?.id==="p-tiers") placeBall(trI); });


function renderTrace(){
  const s=TRACE[trI];
  $("#trStep").textContent=`Step ${trI+1} of ${TRACE.length}`;
  $("#trTitle").textContent=s.h;
  $("#trText").textContent=s.x;
  $("#trLbl").textContent = (s.lv && s.lv[STACK]) ? s.lv[STACK] : s.l;
  $("#trArt").innerHTML = (s.av && s.av[STACK]) ? s.av[STACK] : s.a;
  $$(".flow .tbox").forEach(el=>el.classList.toggle("lit",+el.dataset.t===s.t));
  animateHop(trI);
  if(trView!=="wire") renderBrowser();
}
$("#trNext").onclick=()=>{clearInterval(trTimer);trI=Math.min(TRACE.length-1,trI+1);renderTrace()};
$("#trPrev").onclick=()=>{clearInterval(trTimer);trI=Math.max(0,trI-1);renderTrace()};
$("#trRst").onclick=()=>{clearInterval(trTimer);trI=0;renderTrace();$("#trPlay").textContent="▶ Play trace"};
$("#trPlay").onclick=e=>{
  clearInterval(trTimer);
  if(e.target.dataset.on==="1"){e.target.dataset.on="";e.target.textContent="▶ Play trace";return}
  e.target.dataset.on="1"; e.target.textContent="❚❚ Pause";
  trTimer=setInterval(()=>{
    if(trI>=TRACE.length-1){clearInterval(trTimer);$("#trPlay").dataset.on="";$("#trPlay").textContent="▶ Play trace";return}
    trI++; renderTrace();
  }, REDUCED?900:2600);
};
function stackNote(){
  const n={
   django:"<b>In Django terms:</b> tier 1 is your templates and any JavaScript. Tier 2 is <code>urls.py</code>, your views and your models. Tier 3 is Postgres, and it has never heard of Django.",
   express:"<b>In Node terms:</b> tier 1 is your React or plain JavaScript. Tier 2 is your Express routes, controllers and Prisma models. Tier 3 is Postgres, and it has never heard of Node.",
   laravel:"<b>In Laravel terms:</b> tier 1 is your Blade templates and any JavaScript. Tier 2 is <code>routes/api.php</code>, your controllers and Eloquent models. Tier 3 is Postgres, and it has never heard of PHP."
  }[STACK];
  const el=$("#stackNote"); if(el) el.innerHTML=n;
}
stackNote();
renderTrace();

/* ---- run-it-yourself, with commands you can copy ---- */
const SHELLS=[
 {id:"unix", n:"macOS / Linux", py:"python3", curl:"curl",
  post:`curl -X POST localhost:8080/enrollments \\\n  -H 'Content-Type: application/json' \\\n  -d '{"code":"ITENT 45"}'`,
  note:"Single quotes around the JSON keep the shell from touching the double quotes inside it."},
 {id:"win", n:"Windows PowerShell", py:"python", curl:"curl.exe",
  post:`curl.exe -X POST localhost:8080/enrollments ^\n  -H "Content-Type: application/json" ^\n  --data-raw "{\\"code\\":\\"ITENT 45\\"}"`,
  note:"Two Windows traps here. Use <code>curl.exe</code>, because plain <code>curl</code> in PowerShell is an alias for a different command that takes different arguments. And the inner double quotes must be escaped with backslashes, because single quotes do not protect them the way they do on macOS."}
];
let shellSel="unix";
function esc(t){ return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function copyBtn(cmd,i){
  return `<button data-cmd="${encodeURIComponent(cmd)}" data-k="${i}">copy</button>`;
}
function cmdBlock(cmd,i){
  return `<div class="cmd"><code>${esc(cmd)}</code>${copyBtn(cmd,i)}</div>`;
}
function renderRun(){
  const sh=SHELLS.find(x=>x.id===shellSel);
  $("#shellPick").innerHTML=SHELLS.map(x=>
    `<button data-s="${x.id}" aria-pressed="${x.id===shellSel}">${x.n}</button>`).join("");
  $$("#shellPick button").forEach(el=>el.onclick=()=>{shellSel=el.dataset.s;renderRun()});

  let i=0;
  const steps=[
    {h:"Get the files, once",
     p:"Clone the repository, or download the ZIP from the same page and unzip it.",
     c:[`git clone https://github.com/jilagan/itent45.git\ncd itent45`]},
    {h:"Start the server, and leave it running",
     p:"It prints every byte any client sends it. Keep this terminal where you can see it.",
     c:[`${sh.py} start.py demo`]},
    {h:"In a second terminal, look at the wire",
     p:"The first two are the same request. Count the headers each one sends, and ask why a browser sends so many more.",
     c:[`${sh.curl} http://localhost:8080/courses`,
        `${sh.curl} -v http://localhost:8080/courses`]},
    {h:"Send a body, and find the blank line",
     p:"In the server log, locate the empty line. Everything above it is headers; everything below is the body.",
     c:[sh.post]},
    {h:"Break it on purpose",
     p:"A 404, and a handler that takes two seconds. Read the Content-Length on the 404 and count the body characters yourself.",
     c:[`${sh.curl} http://localhost:8080/nope`,
        `${sh.curl} http://localhost:8080/slow`]},
    {h:"Type a request by hand",
     p:"No client at all. Type the request line, press Enter twice, and watch a reply come back. Then try it again without the Host line.",
     c:[`nc localhost 8080`,
        `GET /courses HTTP/1.1\nHost: localhost`]}
  ];
  $("#runSteps").innerHTML=steps.map((s,n)=>`
    <div class="st3">
      <span class="no">${n+1}</span>
      <div><h5>${s.h}</h5><p>${s.p}</p>
      ${s.c.map(c=>cmdBlock(c,i++)).join("")}
      ${n===3?`<p class="cmdnote">${sh.note}</p>`:""}
      ${n===5&&shellSel==="win"?`<p class="cmdnote"><code>nc</code> is not on Windows by default. Use <code>Test-NetConnection</code> to check the port is open, or skip this step and read a classmate's screen, because the point is seeing a request typed by a human rather than generated.</p>`:""}
      </div></div>`).join("");

  $$("#runSteps .cmd button").forEach(el=>el.onclick=async()=>{
    const text=decodeURIComponent(el.dataset.cmd);
    let ok=false;
    try{ await navigator.clipboard.writeText(text); ok=true; }
    catch(e){
      // clipboard API is blocked on file:// in some browsers, so fall back
      try{
        const ta=document.createElement("textarea");
        ta.value=text; ta.style.position="fixed"; ta.style.opacity="0";
        document.body.appendChild(ta); ta.select();
        ok=document.execCommand("copy"); ta.remove();
      }catch(e2){ ok=false; }
    }
    el.textContent=ok?"copied":"select it";
    el.classList.toggle("done",ok);
    setTimeout(()=>{el.textContent="copy";el.classList.remove("done");},1600);
  });
}
renderRun();

