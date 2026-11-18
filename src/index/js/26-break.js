/* ================= 09 BREAKOUTS ================= */
const BK={
1:{
 title:"Breakout 1, Read the wire",
 intro:"Groups of three. If the server is not running yet, panel 04 has the setup at the bottom, with the commands ready to copy. The rule for this one: no slides, no notes, and do not ask an AI. Find out by looking.",
 taskT:"Your task, 20 minutes, then report",
 roles:[
  ["Driver","Types. Does not decide what to type."],
  ["Prober","Decides what to try next. Hands stay off the keyboard."],
  ["Scribe","Writes down what surprised the group. Owns the report-back."]],
 task:[
  "Start the server: <code>python3 start.py demo</code>, or <code>python start.py demo</code> on Windows. Leave that terminal visible. It prints every byte a client sends. The commands for the rest of these are at the bottom of panel 04, copyable, in both shells.",
  "Hit it with <code>curl http://localhost:8080/courses</code>, then open the same URL in a browser. <b>Count the headers each one sends.</b> Why does the browser send so many more?",
  "Make it return a 404. Read the <code>Content-Length</code> off the response, then count the body characters yourself. <b>Do the two numbers agree?</b>",
  "POST something: <code>curl -X POST localhost:8080/enrollments -d '{\"code\":\"ITENT 45\"}'</code>. In the server log, find the blank line. <b>What is on each side of it?</b>",
  "Open two terminals. Hit <code>/slow</code> in both at the same time. <b>Time the second one.</b> Now set <code>THREADED = True</code> near the bottom of the file, restart, and do it again. What changed, and what did it cost?",
  "Type a request by hand: <code>nc localhost 8080</code>, then enter <code>GET /courses HTTP/1.1</code>, press Enter twice. Now try it again <b>without</b> the <code>Host:</code> header, and with a nonsense <code>User-Agent</code>. <b>Which single header can you not leave out, and which can you lie about freely?</b>"],
 report:"90 seconds per group, standing, no notes, no screen. Each group states one thing that surprised them and the evidence for it. If another group already said yours, you must give a different one, so keep a spare.",
 listen:[
  "<b>Good sign:</b> a group says the browser sends cookies, cache validators and Accept-Language that curl does not, and connects that to why the same URL can return different bytes to different clients.",
  "<b>Good sign:</b> someone notices <code>Host</code> is the one header that cannot be dropped, and reasons out that one IP serves many sites.",
  "<b>Good sign:</b> on the <code>/slow</code> test, a group describes the second request <em>waiting</em> rather than failing, and names the queue from panel 18 without being prompted.",
  "<span class='bad'>Watch for:</span> a group reporting what they expected rather than what the terminal showed. Ask them to scroll back and point at the line.",
  "<span class='bad'>Watch for:</span> threading described as free. Push once: what did you just spend to get that? (memory per thread, straight back to panel 04)"]},
2:{
 title:"Breakout 2, Defend the architecture",
 intro:"Same groups, rotate roles. Each group gets one scenario. Use panel 19 to size it. You will be asked for numbers, not adjectives. Then another group tries to break your design.",
 taskT:"Your task, 25 minutes build, 10 minutes cross-examination",
 roles:[
  ["Architect","Owns the design and says the numbers out loud during defense."],
  ["Operator","Drives panel 19. Reads out the ceiling and the named bottleneck."],
  ["Sceptic","Writes the two hardest questions you would ask another group, then asks them."]],
 task:[
  "Take your scenario card. <b>Write the load number first</b>, before touching anything else. If the card does not give it to you directly, derive it and show the arithmetic.",
  "Build a configuration in panel 19 that serves that load. Record: instances, handler time, cache, replicas, queue.",
  "State your <b>system ceiling</b> and your <b>headroom multiple</b>. A design with 1.0× headroom is a design that fails on the first busy day.",
  "Name the <b>next bottleneck</b>. The tier that gives way when load doubles. Every design has one. If you cannot name it, you have not finished.",
  "Name <b>one move you deliberately did not make</b>, and why. Cost, complexity, and 'we do not need it yet' are all valid reasons if you can defend them.",
  "Answer your card's curveball. <b>This is the part that is actually being graded.</b>"],
 report:"Each group presents for 2 minutes: load, configuration, ceiling, headroom, next bottleneck, and the move they refused. Then the group to their left gets 90 seconds to attack the design. Attack the design, never the group.",
 listen:[
  "<b>Good sign:</b> a group that adds instances, sees the bottleneck move to the database, and says so out loud before you point at it.",
  "<b>Good sign:</b> refusing a move for cost or complexity reasons and defending it. That is engineering judgement.",
  "<b>Good sign:</b> on the spiky scenarios, someone questions whether the average rate is even the right number to design against.",
  "<span class='bad'>Watch for:</span> maxing every slider. Ask what it costs per month and who pays. The syllabus says they must defend the design, not just produce one.",
  "<span class='bad'>Watch for:</span> a cache proposed for a write-heavy workload. Ask what fraction of their requests the cache actually serves.",
  "<span class='bad'>Watch for:</span> a group that cannot say what breaks next. That is the tell that they tuned sliders until the number went green."]}
};
const SCEN=[
 {n:"Card A",t:"Enlistment morning (The enlistment system)",
  d:[["Load","4,000 students in one enlistment window, all clicking at 8:00:00"],
     ["Shape","One short violent spike, then almost nothing"],
     ["Work","15 requests per session, 3 of them writes. Seat reservation must be correct"]],
  c:"Curveball: your web tier can autoscale, but seat reservation cannot be cached and cannot be spread across read replicas, two students must never get the same last slot. So what do you actually do? Name a move that costs no hardware at all."},
 {n:"Card B",t:"Course catalog",
  d:[["Load","900 rps sustained through the day"],
     ["Shape","Steady. Read-only browsing"],
     ["Work","3 queries per request, 40 ms handler. Most students request the same 20 pages"]],
  c:"Curveball: a third of your users are on mobile data abroad, at 120 ms one-way. Go back to panel 02. Does any amount of server capacity fix their experience? What actually would?"},
 {n:"Card C",t:"Grade upload",
  d:[["Load","Only 40 rps. Faculty, not students"],
     ["Shape","Bursty around deadline week"],
     ["Work","Each upload generates a PDF transcript. 2,000 ms handler, 2 queries"]],
  c:"Curveball: work out the ceiling for one instance before you touch anything. You will find no combination of sliders gets you to 40 rps. The panel's queue toggle only models a 35% saving. So what would you actually change so the handler returns in 20 ms, and what does the faculty member see on screen instead?"},
 {n:"Card D",t:"Campus sensor dashboard",
  d:[["Load","3,000 sensors, each posting every 10 seconds"],
     ["Shape","Perfectly constant, 24/7"],
     ["Work","Tiny payloads. 8 ms handler, 2 writes per request"]],
  c:"Curveball: derive the request rate yourself. The card does not state it. Then note that the panel treats replicas as helping every query equally. These are writes. Does that assumption hold, and what does it mean for your design?"},
 {n:"Card E",t:"Alumni portal, tight budget",
  d:[["Load","Normally 30 rps"],
     ["Shape","Unpredictable. A news story can multiply it by 50× with no warning"],
     ["Work","3 queries per request, 70 ms handler. Read-heavy"]],
  c:"Curveball: you cannot afford to run 50× capacity year-round. Design for the normal day and state exactly what you would do in the first 10 minutes of a spike, and what users would experience meanwhile."},
 {n:"Card F",t:"The dashboard that got slow",
  d:[["Load","120 rps. A Django page listing each student's 50 enrollments"],
     ["Shape","Steady, all day. 40 ms handler"],
     ["Work","The template reads e.course.title inside the loop, and nobody wrote select_related()"]],
  c:"Curveball: work out queries per request before anything else. One for the list, then one more per row. Put that number into panel 19 and read the ceiling. Now set it to 2, which is what select_related() would give you, and read it again. Which is cheaper: the one-line ORM fix, or all the infrastructure you would otherwise have to buy?"},
 {n:"Card G",t:"Flash sale checkout",
  d:[["Load","900 rps for 10 minutes when the sale opens"],
     ["Shape","Hard spike, then nothing. Shoppers refresh and re-click constantly"],
     ["Work","40 ms of your own code, plus an 800 ms call to the payment gateway"]],
  c:"Curveball: put 840 ms into panel 19's handler slider and read the ceiling. That is what a third-party call inside your request costs you. Then answer two things. How do you get the gateway off the request path, and what stops a double-clicking shopper from being charged twice?"}
];
let bk="1";
function renderBk(){
  const d=BK[bk];
  $("#bkTitle").textContent=d.title;
  $("#bkIntro").textContent=d.intro;
  $("#bkTaskT").textContent=d.taskT;
  $("#bkTask").innerHTML=d.task.map(t=>`<li>${t}</li>`).join("");
  $("#bkRoles").innerHTML=d.roles.map(([n,p])=>`<div class="role"><div class="rn">${n}</div><p>${p}</p></div>`).join("");
  $("#bkReport").textContent=d.report;
  $("#bkListen").innerHTML=d.listen.map(l=>`<li>${l}</li>`).join("");
  $("#bkCards").innerHTML = bk==="2"
    ? `<div class="card-t">Scenario cards. One per group</div><div class="cards">`+
      SCEN.map((s,i)=>`<button class="sc" data-i="${i}">
        <div class="sn">${s.n}</div><h4>${s.t}</h4>
        <dl>${s.d.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
        <div class="curve">${s.c}</div></button>`).join("")+`</div>`
    : "";
  $$("#bkCards .sc").forEach(el=>el.onclick=()=>{
    const was=el.classList.contains("pick");
    $$("#bkCards .sc").forEach(x=>x.classList.remove("pick"));
    if(!was) el.classList.add("pick");
  });
}
$$("[data-bk]").forEach(b=>b.onclick=()=>{
  $$("[data-bk]").forEach(x=>x.setAttribute("aria-pressed",x===b));
  bk=b.dataset.bk; renderBk();
  setTimer(bk==="1"?20:25);
});

/* timer */
let tLeft=20*60, tTick=null, tOn=false;
function paint(){
  const m=Math.floor(Math.abs(tLeft)/60), s=Math.abs(tLeft)%60;
  $("#clock").textContent=(tLeft<0?"-":"")+m+":"+String(s).padStart(2,"0");
  const t=$("#timer");
  t.classList.toggle("warn",tLeft<=120&&tLeft>30);
  t.classList.toggle("crit",tLeft<=30);
}
function setTimer(min){ stopTimer(); tLeft=min*60; paint(); }
function stopTimer(){ clearInterval(tTick); tOn=false; $("#tRun").textContent="▶ Start"; }
$("#tRun").onclick=()=>{
  if(tOn){ stopTimer(); return; }
  tOn=true; $("#tRun").textContent="❚❚ Pause";
  tTick=setInterval(()=>{ tLeft--; paint(); },1000);
};
$("#tRst").onclick=()=>setTimer(bk==="1"?20:25);
$$(".presets button").forEach(b=>b.onclick=()=>setTimer(+b.dataset.m));
renderBk(); paint();

/* keyboard */
addEventListener("keydown",e=>{
  if(e.target.matches("input")) return;
  const on=$(".panel.on").id;
  if(on==="p-journey"){
    if(e.key===" "){e.preventDefault();$("#playJ").click()}
    if(e.key==="ArrowRight"){e.preventDefault();$("#stepJ").click()}
  }
  if(on==="p-server" && e.key===" "){e.preventDefault();$("#simRun").click()}
  if(on==="p-break" && e.key===" "){e.preventDefault();$("#tRun").click()}
  if(on==="p-tiers"){
    if(e.key==="ArrowRight"){e.preventDefault();$("#trNext").click()}
    if(e.key==="ArrowLeft"){e.preventDefault();$("#trPrev").click()}
    if(e.key===" "){e.preventDefault();$("#trPlay").click()}
  }
  const kmap={'0':0,'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'c':10,'C':10,'a':11,'A':11,'w':12,'W':12,'t':13,'T':13,'n':14,'N':14,'q':15,'Q':15,'h':16,'H':16,'m':17,'M':17,'s':18,'S':18,'p':19,'P':19,'e':20,'E':20,'v':21,'V':21,'k':22,'K':22,'r':23,'R':23,'o':24,'O':24,'b':25,'B':25};
  if(e.key in kmap) $$("#nav button")[kmap[e.key]].click();
});
