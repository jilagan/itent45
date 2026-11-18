/* Lesson tiers. Widget code for the markup in lesson.html. */
/* ================= 01 TIERS ================= */
const TIERS=[
 {n:"Tier 1",h:"Presentation, the browser",
  m:[["Runs on","the user's laptop"],["You write","templates, JavaScript"],["In practice","templates and static files"]],
  mv:{django:[["Runs on","the user's laptop"],["You write","templates, JavaScript"],["In practice","templates and static files"]],
      express:[["Runs on","the user's laptop"],["You write","JSX, CSS, JavaScript"],["In practice","the React code"]],
      laravel:[["Runs on","the user's laptop"],["You write","Blade, CSS, JavaScript"],["In practice","Blade views and public files"]]}},
 {n:"Tier 2",h:"Application, your server process",
  m:[["Runs on","your server"],["You write","routes, handlers, models"],["In practice","the project itself"]],
  mv:{django:[["Runs on","your server"],["You write","urls.py, views, models"],["Stack","Django + gunicorn"]],
      express:[["Runs on","your server"],["You write","routes, controllers, models"],["Stack","Express + Node"]],
      laravel:[["Runs on","your server"],["You write","routes, controllers, models"],["Stack","Laravel + PHP-FPM"]]}},
 {n:"Tier 3",h:"Data, the database",
  m:[["Runs on","your server, or its own"],["You write","table design, queries"],["In practice","Postgres, a widely used database"]]}
];
const TRACE=[
 {t:1,h:"You click a button on a page you already have",
  x:"The page is already open, so the click only runs JavaScript that asks the server for data. Nothing has left your laptop yet.",
  l:"The page's button and the function it runs (tier 1)",
  a:`<span class="d">&lt;button onclick=</span><span class="s">"loadCourses()"</span><span class="d">&gt;</span>My Courses<span class="d">&lt;/button&gt;</span>

<span class="kw">async function</span> loadCourses(){
  <span class="kw">const</span> r = <span class="kw">await</span> fetch(<span class="s">"/api/enrollments?student=20-1234"</span>);
  render(<span class="kw">await</span> r.json());   <span class="c">// address bar stays on /my-courses</span>
}`},
 {t:1,h:"The browser builds a request",
  x:"The browser turns the address into a plain text message. The server has not heard from you yet.",
  l:"The HTTP request text (tier 1)",
  a:`<span class="kw">GET</span> /api/enrollments?student=20-1234 HTTP/1.1\nHost: enlist.university.edu\nAccept: application/json\nCookie: sessionid=8f2a...`},
 {t:0,h:"The request crosses the network",
  x:"The request passes through the routers between you and the server. This takes milliseconds that no code can remove.",
  l:"The path across the network",
  a:`<span class="c">laptop → wifi → internet provider → ... → data center → server</span>\n<span class="c">each router replaces the outer frame and leaves everything inside unchanged</span>`},
 {t:2,h:"The framework matches the URL",
  x:"The server reads the path and checks a list of URL patterns from top to bottom. It uses the first pattern that matches.",
  lv:{django:"urls.py, the list of URL patterns (tier 2)", express:"routes/index.js, the list of URL patterns (tier 2)", laravel:"routes/api.php, the list of URL patterns (tier 2)"},
  av:{
   django:`urlpatterns = [\n    path(<span class="s">"my-courses"</span>, views.my_courses_page),  <span class="c"># the page you are on</span>\n    path(<span class="s">"api/enrollments"</span>, views.enrollment_list),\n    path(<span class="s">"api/courses/&lt;str:code&gt;"</span>, views.course_detail),\n]`,
   express:`router.get(<span class="s">"/api/enrollments"</span>, enrollmentList);\nrouter.get(<span class="s">"/api/courses/:code"</span>, courseDetail);`,
   laravel:`Route::get(<span class="s">'/api/enrollments'</span>, [EnrollmentController::<span class="kw">class</span>, <span class="s">'index'</span>]);\nRoute::get(<span class="s">'/api/courses/{code}'</span>, [CourseController::<span class="kw">class</span>, <span class="s">'show'</span>]);`}},
 {t:2,h:"Your handler runs",
  x:"Your own code now runs on a server you control. It checks that the user is logged in, then reads the student number from the URL.",
  lv:{django:"views.py, the handler (tier 2)", express:"The controller, the handler (tier 2)", laravel:"The controller, the handler (tier 2)"},
  av:{
   django:`<span class="kw">def</span> enrollment_list(request):\n    <span class="kw">if</span> <span class="kw">not</span> request.user.is_authenticated:\n        <span class="kw">return</span> JsonResponse({...}, status=<span class="s">401</span>)\n    sid = request.GET.get(<span class="s">"student"</span>)`,
   express:`<span class="kw">async function</span> enrollmentList(req, res) {\n  <span class="kw">if</span> (!req.user) <span class="kw">return</span> res.status(<span class="s">401</span>).json({...});\n  <span class="kw">const</span> sid = req.query.student;`,
   laravel:`<span class="kw">public function</span> index(Request $request) {\n    <span class="kw">if</span> (! $request->user()) {\n        <span class="kw">return</span> response()->json([...], <span class="s">401</span>);\n    }\n    $sid = $request->query(<span class="s">'student'</span>);`}},
 {t:2,h:"The ORM writes SQL for you",
  x:"An ORM (object-relational mapper) is a library that turns your code's objects into SQL text and rows back into objects. Your code describes the data you want, and the ORM writes the SQL.",
  lv:{django:"The Django ORM (tier 2)", express:"The Prisma ORM (tier 2)", laravel:"The Eloquent ORM (tier 2)"},
  av:{
   django:`qs = (Enrollment.objects\n        .filter(student_id=sid)\n        .select_related(<span class="s">"course"</span>))\n\n<span class="c"># select_related fetches each course in the same query,</span>\n<span class="c"># so the total stays at one query</span>`,
   express:`<span class="kw">const</span> rows = <span class="kw">await</span> prisma.enrollment.findMany({\n  where:   { studentId: sid },\n  include: { course: <span class="kw">true</span> }\n});\n\n<span class="c">// include fetches each course in the same query,</span>\n<span class="c">// so the total stays at one query</span>`,
   laravel:`$rows = Enrollment::where(<span class="s">'student_id'</span>, $sid)\n        ->with(<span class="s">'course'</span>)\n        ->get();\n\n<span class="c">// with() fetches each course in the same query,</span>\n<span class="c">// so the total stays at one query</span>`}},
 {t:3,h:"The database receives SQL",
  x:"The database is a separate program. It reads the SQL text and finds the data, and it knows nothing about your framework.",
  l:"The SQL query (tier 3)",
  a:`<span class="kw">SELECT</span> e.id, e.student_id, c.code, c.title, c.units\n<span class="kw">FROM</span> enrollment e\n<span class="kw">JOIN</span> course c <span class="kw">ON</span> c.id = e.course_id\n<span class="kw">WHERE</span> e.student_id = <span class="s">'20-1234'</span>;`},
 {t:3,h:"Rows come back",
  x:"The database returns rows, which are lines of values with no behavior attached. It knows nothing about your programming language's classes.",
  l:"The result: two rows (tier 3)",
  a:`<span class="d"> id  | student_id | code     | title              | units</span>\n<span class="d">-----+------------+----------+--------------------+------</span>\n 881 | 20-1234    | ITENT 45 | Application Dev... |     3\n 882 | 20-1234    | CSCI 21  | Data Structures    |     3`},
 {t:2,h:"Rows become objects",
  x:"The ORM turns each row into an object, so your code can read fields such as <code>enrollment.course.code</code>. This uses processor time and memory in proportion to the number of rows.",
  lv:{django:"The objects the ORM created (tier 2)", express:"The objects the ORM created (tier 2)", laravel:"The objects the ORM created (tier 2)"},
  av:{
   django:`[&lt;Enrollment: 20-1234 → ITENT 45&gt;,\n &lt;Enrollment: 20-1234 → CSCI 21&gt;]`,
   express:`[ { id: 881, course: { code: <span class="s">'ITENT 45'</span>, units: 3 } },\n  { id: 882, course: { code: <span class="s">'CSCI 21'</span>,  units: 3 } } ]`,
   laravel:`Illuminate\\Support\\Collection {\n  <span class="d">#items:</span> [ App\\Models\\Enrollment {...},\n            App\\Models\\Enrollment {...} ]\n}`}},
 {t:2,h:"Objects become text",
  x:"Objects cannot travel over the network, so the server converts them to JSON, a plain text format for data. This step is called serialization.",
  lv:{django:"Converting the objects to JSON (tier 2)", express:"Converting the objects to JSON (tier 2)", laravel:"Converting the objects to JSON (tier 2)"},
  av:{
   django:`<span class="kw">return</span> JsonResponse({\n  <span class="s">"enrollments"</span>: [\n    {<span class="s">"code"</span>: <span class="s">"ITENT 45"</span>, <span class="s">"units"</span>: 3},\n    {<span class="s">"code"</span>: <span class="s">"CSCI 21"</span>,  <span class="s">"units"</span>: 3}\n  ]\n})`,
   express:`res.json({\n  enrollments: [\n    { code: <span class="s">"ITENT 45"</span>, units: 3 },\n    { code: <span class="s">"CSCI 21"</span>,  units: 3 }\n  ]\n});`,
   laravel:`<span class="kw">return</span> response()->json([\n  <span class="s">'enrollments'</span> => [\n    [<span class="s">'code'</span> => <span class="s">'ITENT 45'</span>, <span class="s">'units'</span> => 3],\n    [<span class="s">'code'</span> => <span class="s">'CSCI 21'</span>,  <span class="s">'units'</span> => 3]\n  ]\n]);`}},
 {t:0,h:"The response crosses back",
  x:"The server sends a status line, headers, a blank line and the body. The trip back costs the same network time as the trip out.",
  l:"The HTTP response text",
  a:`<span class="kw">HTTP/1.1 200 OK</span>\nContent-Type: application/json\nContent-Length: 94\n\n{<span class="s">"enrollments"</span>: [ ... ]}`},
 {t:1,h:"The browser renders it",
  x:"JavaScript on the user's laptop reads the JSON and builds the page's elements. A user can change this code, so the server must repeat every check that matters.",
  l:"The page code that builds the list (tier 1)",
  a:`<span class="kw">const</span> r = <span class="kw">await</span> fetch(<span class="s">"/api/enrollments?student=20-1234"</span>);\n<span class="kw">const</span> data = <span class="kw">await</span> r.json();\nlist.innerHTML = data.enrollments\n  .map(e =&gt; <span class="s">\`&lt;li&gt;\${e.code}&lt;/li&gt;\`</span>).join(<span class="s">""</span>);`}
];
let trI=0, trTimer=null, trView="wire";

/* --- what the user sees at each step --- */
const PAGE_CSS=`<style>
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;
  background:#fff;color:var(--panel);padding:20px 24px;display:flex;flex-direction:column}
h1{font-size:19px;margin:0 0 3px}
.sub{color:var(--dim2);font-size:14px;margin-bottom:16px}
a{color:var(--link);text-decoration:none;font-weight:600;font-size:15px}
ul{list-style:none;padding:0;margin:0}
li{display:flex;justify-content:space-between;align-items:center;
  padding:12px 14px;border:1px solid var(--ink);border-radius:7px;margin-bottom:8px}
.code{font-weight:600;font-size:15px}
.units{color:var(--dim2);font-size:14px}
.mid{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}
.spin{width:26px;height:26px;border-radius:50%;border:3px solid var(--ink);
  border-top-color:var(--link);animation:sp .8s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
.wait{color:var(--dim2);font-size:14px}
@media (prefers-reduced-motion:reduce){.spin{animation:none;border-top-color:var(--dim2)}}
</style>`;

const VIEWS={
 start:{ html:`${PAGE_CSS}<h1>The enlistment system</h1><div class="sub">Logged in as 20-1234</div>
   <div class="mid" style="justify-content:flex-start;align-items:flex-start"><a href="#">My Courses &rsaquo;</a></div>`,
   spin:false, url:"https://enlist.university.edu/",
   cap:`This is the page the user sees now. Nothing has been requested yet.` },
 loading:{ html:`${PAGE_CSS}<h1>My Courses</h1><div class="sub">&nbsp;</div>
   <div class="mid"><div class="spin"></div><div class="wait">Waiting for the server</div></div>`,
   spin:true, url:"https://enlist.university.edu/my-courses",
   cap:`Ten of the twelve parts happen while the user sees this spinner. The user cannot tell where the time goes. They only see how long the wait is.` },
 done:{ html:`${PAGE_CSS}<h1>My Courses</h1><div class="sub">First Semester, 2026&ndash;2027</div>
   <ul>
     <li data-src="json"><span class="code">ITENT 45</span><span class="units">3 units</span></li>
     <li data-src="json"><span class="code">CSCI 21</span><span class="units">3 units</span></li>
   </ul>`,
   spin:false, url:"https://enlist.university.edu/my-courses",
   cap:`The list is now on screen. Rows from the database became page elements (DOM nodes) on a device you do not control.` }
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
/* the tree is read out of the page the iframe rendered, not hand-written */
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
  if(!doc||!doc.body){ box.innerHTML='<span class="c">Building the tree\u2026</span>'; return; }
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
    ? `None of these elements came over the network. The response was plain text. JavaScript on the user's laptop read that text and created ${made} list items, and the browser then drew them on screen.`
    : `A page is a tree of elements before it is a picture. Step forward to see the tree change as the data arrives.`;
}
function setView(mode){
  trView=mode;
  $("#vWire").setAttribute("aria-pressed",mode==="wire");
  $("#vDom").setAttribute("aria-pressed",mode==="dom");
  $("#vRender").setAttribute("aria-pressed",mode==="render");
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
    let name = (t.h.split(", ")[1]||t.h).replace(/^./,c=>c.toUpperCase());
    if(i===1) name = "Your " + STACK_NAME[STACK];
    $("#tb"+(i+1)).innerHTML=`
      ${ICO(["user","bell-simple","cooking-pot"][i],"big")}
      <div class="tn">${t.n}</div>
      <h4>${name}</h4>
      <div class="trole">${t.h.split(", ")[0]} tier</div>`;
  });
  /* the rows that depend on the framework live under More detail */
  const rows = TIERS.map((t,i)=>{
    const meta = (t.mv && t.mv[STACK]) ? t.mv[STACK] : t.m;
    return `<tr><th scope="row">${t.n}, ${(t.h.split(", ")[1]||t.h)}</th>` +
      meta.map(([k,v])=>`<td><span class="mk">${k}</span> ${v}</td>`).join("") + `</tr>`;
  }).join("");
  const el=$("#tierMeta"); if(el) el.innerHTML = `<tbody>${rows}</tbody>`;
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
    // stacked layout has no horizontal rail for the ball; the lit tier box shows where the request is
    ball.style.display="none";
    return;
  }
  ball.style.display="";
  const bic = i>=10 ? "bowl-food" : i>=7 ? "table" : "receipt";
  if(ball.dataset.ic!==bic){ ball.dataset.ic=bic; ball.innerHTML=ICO(bic); }
  // outbound rides the upper rail (request / query); the return leg rides the lower one (response / rows)
  const rail = $(returning ? "#railAb" : "#railAf");
  const fb=flow.getBoundingClientRect(), tb=el.getBoundingClientRect();
  const railY = rail.getBoundingClientRect().top - fb.top;
  ball.style.left = (tb.left - fb.left + tb.width/2) + "px";
  // inside a tier the ball sits on the top border of its box, clear of the text; on a lane it rides the rail
  ball.style.top  = (key.startsWith("tb") ? tb.top - fb.top : railY + 1) + "px";
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
  $("#trStep").textContent=`Part ${trI+1} of ${TRACE.length}`;
  $("#trTitle").textContent=s.h;
  $("#trText").innerHTML=s.x;
  $("#trLbl").textContent = (s.lv && s.lv[STACK]) ? s.lv[STACK] : s.l;
  $("#trArt").innerHTML = (s.av && s.av[STACK]) ? s.av[STACK] : s.a;
  $$(".flow .tbox").forEach(el=>el.classList.toggle("lit",+el.dataset.t===s.t));
  animateHop(trI);
  if(trView!=="wire") renderBrowser();
}
$("#trNext").onclick=()=>{clearInterval(trTimer);trI=Math.min(TRACE.length-1,trI+1);renderTrace()};
$("#trPrev").onclick=()=>{clearInterval(trTimer);trI=Math.max(0,trI-1);renderTrace()};
$("#trRst").onclick=()=>{clearInterval(trTimer);trI=0;renderTrace();$("#trPlay").textContent="▶ Play"};
$("#trPlay").onclick=e=>{
  clearInterval(trTimer);
  if(e.target.dataset.on==="1"){e.target.dataset.on="";e.target.textContent="▶ Play";return}
  e.target.dataset.on="1"; e.target.textContent="❚❚ Pause";
  trTimer=setInterval(()=>{
    if(trI>=TRACE.length-1){clearInterval(trTimer);$("#trPlay").dataset.on="";$("#trPlay").textContent="▶ Play";return}
    trI++; renderTrace();
  }, REDUCED?900:2600);
};
function stackNote(){
  const n={
   django:"<b>In Django terms:</b> tier 1 is your templates (page layouts with blanks for data) and any JavaScript. Tier 2 is <code>urls.py</code> (the list of addresses your app answers), your views (functions that handle one request) and your models (descriptions of your data). Tier 3 is Postgres, which knows nothing about Django.",
   express:"<b>In Node terms:</b> tier 1 is your React (a JavaScript library for building pages) or plain JavaScript. Tier 2 is your Express routes (the list of addresses your app answers), your controllers (functions that handle one request) and your Prisma models (descriptions of your data). Node runs JavaScript on a server. Tier 3 is Postgres, which knows nothing about Node.",
   laravel:"<b>In Laravel terms:</b> tier 1 is your Blade templates (page layouts with blanks for data) and any JavaScript. Tier 2 is <code>routes/api.php</code> (the list of addresses your app answers), your controllers (functions that handle one request) and your Eloquent models (descriptions of your data). Tier 3 is Postgres, which knows nothing about PHP."
  }[STACK];
  const el=$("#stackNote"); if(el) el.innerHTML=n;
}
stackNote();
renderTrace();

/* keyboard: arrows and Space drive the trace while that step is showing */
addEventListener("keydown",e=>{
  if(document.querySelector('#p-tiers .sec.on[data-sec="trace"]')){
    if(e.key==="ArrowRight"){e.preventDefault();$("#trNext").click()}
    if(e.key==="ArrowLeft"){e.preventDefault();$("#trPrev").click()}
    if(e.key===" "){e.preventDefault();$("#trPlay").click()}
  }
});

/* called by the platform when this lesson or a step or More detail becomes visible */
PAGE_HOOKS.show=()=>{ placeBall(trI); };
