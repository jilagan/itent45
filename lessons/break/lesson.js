/* Lesson break. Widget code for the markup in lesson.html. */
/* ================= 09 BREAKOUTS ================= */
const BK={
1:{
 title:"Group exercise 1: inspect an HTTP exchange",
 intro:"Work in groups of three. If the server is not running yet, <a data-lesson='bytes'>HTTP messages</a> has the setup at the bottom, with commands ready to copy. For this exercise, use no slides or notes and do not ask an AI. Find the answers by looking at what the server does.",
 taskT:"Task: 20 minutes, then report back",
 short:[
  "Start the demo server. Keep its terminal visible.",
  "Compare the headers curl and a browser send for <code>/courses</code>.",
  "Make a 404. Does <code>Content-Length</code> match the body?",
  "Send a POST. What is on each side of the blank line?",
  "Request <code>/slow</code> twice at once. What changes with threading?",
  "Type a request by hand. Which header can you not drop?"],
 roles:[
  ["Driver","Types the commands the group agrees on."],
  ["Prober","Decides what to try next and keeps off the keyboard."],
  ["Scribe","Writes down what surprised the group and gives the report."]],
 task:[
  "Open a terminal. A terminal is a window where you type commands as text and the computer prints the result. Start the server with <code>python3 start.py demo</code>, or <code>python start.py demo</code> on Windows. Leave that terminal visible, because the server prints every byte a client sends it. The commands for the remaining steps are at the bottom of <a data-lesson='bytes'>HTTP messages</a>, ready to copy for both kinds of shell.",
  "Send a request with <code>curl http://localhost:8080/courses</code>. curl is a command-line program that sends a web request and prints the reply. Then open the same URL in a browser. <b>Count the headers each one sends.</b> Headers are the extra lines of information that travel with a request. Why does the browser send so many more?",
  "Make the server return a 404 (page not found). Read the <code>Content-Length</code> header in the response, then count the characters in the body yourself. <b>Do the two numbers agree?</b>",
  "Send a POST request, which submits data: <code>curl -X POST localhost:8080/enrollments -d '{\"code\":\"MGT 45\"}'</code>. In the server log, find the blank line. <b>What is on each side of it?</b>",
  "Open two terminals. Request <code>/slow</code> in both at the same time. <b>Time the second one.</b> Then set <code>THREADED = True</code> near the bottom of the file, which lets the server handle more than one request at once. Restart the server and repeat. What changed, and what did it cost?",
  "Type a request by hand. Run <code>nc localhost 8080</code>, which opens a plain connection to the server. Then type <code>GET /courses HTTP/1.1</code> and press Enter twice. Try again <b>without</b> the <code>Host:</code> header, and again with a made-up <code>User-Agent</code>. <b>Which header can you not leave out, and which can you change freely?</b>"],
 report:"Each group has 90 seconds to report, standing, with no notes and no screen. State one thing that surprised you and the evidence for it. If another group has already given yours, give a different one, so prepare a spare.",
 listen:[
  "<b>Good sign:</b> a group says the browser sends cookies, cache validators and Accept-Language that curl does not, and connects that to why the same URL can return different bytes to different clients.",
  "<b>Good sign:</b> someone notices <code>Host</code> is the one header that cannot be dropped, and works out that one IP address serves many sites.",
  "<b>Good sign:</b> on the <code>/slow</code> test, a group describes the second request waiting for the first, and names the queue from <a data-lesson='server'>Server capacity</a> without being prompted.",
  "<span class='bad'>Watch for:</span> a group reporting what they expected to see without checking the terminal. Ask them to scroll back and point at the line.",
  "<span class='bad'>Watch for:</span> a group describing threading as free. Ask once: what did you spend to get that? The answer is memory per thread, from <a data-lesson='mem'>Server memory</a>."]},
2:{
 title:"Group exercise 2: design for a load",
 intro:"Use the same groups and rotate roles. Each group gets one scenario. Use the tool in <a data-lesson='scale'>Load balancers and scaling</a> to size it. You will be asked for numbers. Another group then tries to find weaknesses in your design.",
 taskT:"Task: 25 minutes to build, 10 minutes of questions",
 short:[
  "Write the load number first, with the arithmetic.",
  "Build a configuration that serves it in the scaling tool.",
  "State your ceiling and your headroom multiple.",
  "Name the next bottleneck.",
  "Name one move you chose not to make, and why.",
  "Answer your instructor's extra question. This part is graded."],
 roles:[
  ["Architect","Owns the design and says the numbers out loud during the defense."],
  ["Operator","Operates the <a data-lesson='scale'>Load balancers and scaling</a> tool and reads out the ceiling and the named bottleneck."],
  ["Skeptic","Writes the two hardest questions to ask another group, then asks them."]],
 task:[
  "Take your scenario card. <b>Write the load number first</b>, before changing anything else. If the card does not give it directly, work it out and show the arithmetic.",
  "Build a configuration in the <a data-lesson='scale'>Load balancers and scaling</a> tool that serves that load. Record the number of instances (copies of the server), the handler time, the cache, the replicas (extra copies of the database) and the queue.",
  "State your <b>system ceiling</b>, the most requests per second the design can serve, and your <b>headroom multiple</b>, which is how many times the ceiling exceeds your load. A design with 1.0× headroom fails on the first busy day.",
  "Name the <b>next bottleneck</b>, the tier that gives way first when the load doubles. Every design has one. If you cannot name it, the design is not finished.",
  "Name <b>one move you chose not to make</b>, and why. Cost, complexity and \"we do not need it yet\" are all valid reasons if you can defend them.",
  "Answer the extra question your instructor gives you for your card. <b>This part is graded.</b>"],
 report:"Each group presents for 2 minutes: load, configuration, ceiling, headroom, next bottleneck, and the move they chose not to make. Then the group to their left has 90 seconds to challenge the design. Question the design only.",
 listen:[
  "<b>Good sign:</b> a group adds instances, sees the bottleneck move to the database, and says so before you point it out.",
  "<b>Good sign:</b> refusing a move for cost or complexity reasons, and defending that choice. This is engineering judgment.",
  "<b>Good sign:</b> on the spiky scenarios, someone asks whether the average request rate is the right number to design for.",
  "<span class='bad'>Watch for:</span> a group setting every slider to its maximum. Ask what that costs per month and who pays. Groups must defend their design, and a maxed-out design cannot be defended on cost.",
  "<span class='bad'>Watch for:</span> a cache proposed for a write-heavy workload. Ask what share of their requests the cache would serve.",
  "<span class='bad'>Watch for:</span> a group that cannot say what breaks next. That suggests they adjusted sliders until the number turned green."]}
};
const SCEN=[
 {n:"Card A",t:"Enlistment morning",
  d:[["Load","4,000 students in one enlistment window, all clicking at 8:00:00"],
     ["Shape","One short, sharp spike, then almost nothing"],
     ["Work","15 requests per session, 3 of them writes. Seat reservation must be correct"]],
  c:"Curveball: your web tier can autoscale, but seat reservation cannot be cached and cannot be spread across read replicas, because two students must never get the same last slot. What do you do? Name a move that costs no hardware."},
 {n:"Card B",t:"Course catalog",
  d:[["Load","900 rps sustained through the day"],
     ["Shape","Steady. Read-only browsing"],
     ["Work","3 queries per request, 40 ms handler. Most students request the same 20 pages"]],
  c:"Curveball: a third of your users are on mobile data abroad, at 120 ms one way. Go back to <a data-lesson='journey'>Round trips and latency</a>. Does any amount of server capacity fix their experience? What would?"},
 {n:"Card C",t:"Grade upload",
  d:[["Load","Only 40 rps. Faculty, not students"],
     ["Shape","Bursty around deadline week"],
     ["Work","Each upload generates a PDF transcript. 2,000 ms handler, 2 queries"]],
  c:"Curveball: work out the ceiling for one instance before you change anything. No combination of sliders reaches 40 rps. The tool's queue toggle models only a 35% saving. What would you change so the handler returns in 20 ms, and what does the faculty member see on screen meanwhile?"},
 {n:"Card D",t:"Campus sensor dashboard",
  d:[["Load","3,000 sensors, each posting every 10 seconds"],
     ["Shape","Perfectly constant, 24/7"],
     ["Work","Tiny payloads. 8 ms handler, 2 writes per request"]],
  c:"Curveball: work out the request rate yourself, because the card does not state it. The tool treats replicas as helping every query equally, but these are writes. Does that assumption hold, and what does it mean for your design?"},
 {n:"Card E",t:"Alumni portal, tight budget",
  d:[["Load","Normally 30 rps"],
     ["Shape","Unpredictable. A news story can multiply it by 50× with no warning"],
     ["Work","3 queries per request, 70 ms handler. Read-heavy"]],
  c:"Curveball: you cannot afford to run 50× capacity all year. Design for the normal day, and state exactly what you would do in the first 10 minutes of a spike and what users would experience meanwhile."},
 {n:"Card F",t:"The dashboard that got slow",
  d:[["Load","120 rps. A page built with Django (a Python web framework) lists each student's 50 enrollments"],
     ["Shape","Steady, all day. 40 ms handler"],
     ["Work","The page template reads e.course.title inside the loop, and nobody wrote select_related(), the Django option that fetches related rows in one query"]],
  c:"Curveball: work out the number of queries per request first: one for the list, then one more per row. Put that number into the tool and read the ceiling. Then set it to 2, which is what select_related() gives, and read the ceiling again. Which is cheaper: the one-line fix, or all the extra infrastructure you would otherwise buy?"},
 {n:"Card G",t:"Flash sale checkout",
  d:[["Load","900 rps for 10 minutes when the sale opens"],
     ["Shape","Hard spike, then nothing. Shoppers refresh and re-click constantly"],
     ["Work","40 ms of your own code, plus an 800 ms call to the payment gateway"]],
  c:"Curveball: put 840 ms into the tool's handler slider and read the ceiling. This is the cost of a third-party call inside your request. Then answer two questions. How do you take the gateway off the request path, and what stops a shopper who double-clicks from being charged twice?"}
];
function renderBk(n){
  const d=BK[n];
  $("#bkIntro"+n).innerHTML=d.intro;
  $("#bkTaskT"+n).textContent=d.taskT;
  $("#bkTask"+n).innerHTML=d.short.map(t=>`<li>${t}</li>`).join("");
  $("#bkFull"+n).innerHTML=d.task.map(t=>`<li>${t}</li>`).join("");
  $("#bkRoles"+n).innerHTML=d.roles.map(([r,p])=>`<div class="role"><div class="rn">${r}</div><p>${p}</p></div>`).join("");
  $("#bkReport"+n).innerHTML=d.report;
  $("#bkListen"+n).innerHTML=d.listen.map(l=>`<li>${l}</li>`).join("");
}
renderBk(1); renderBk(2);
$("#bkCards").innerHTML=`<div class="cards">`+
  SCEN.map((s,i)=>`<button class="sc" data-i="${i}">
    <div class="sn">${s.n}</div><h4>${s.t}</h4>
    <dl>${s.d.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
    <div class="curve instructor">${s.c}</div></button>`).join("")+`</div>`;
$$("#bkCards .sc").forEach(el=>el.onclick=()=>{
  const was=el.classList.contains("pick");
  $$("#bkCards .sc").forEach(x=>x.classList.remove("pick"));
  if(!was) el.classList.add("pick");
});

/* timers: one in each exercise step */
function makeTimer(root, defMin){
  const clock=root.querySelector(".clock"), run=root.querySelector("[data-run]"), rst=root.querySelector("[data-rst]");
  let left=defMin*60, tick=null, on=false;
  function paint(){
    const m=Math.floor(Math.abs(left)/60), s=Math.abs(left)%60;
    clock.textContent=(left<0?"-":"")+m+":"+String(s).padStart(2,"0");
    root.classList.toggle("warn",left<=120&&left>30);
    root.classList.toggle("crit",left<=30);
  }
  function stop(){ clearInterval(tick); on=false; run.textContent="Start"; }
  function set(min){ stop(); left=min*60; paint(); }
  run.onclick=()=>{
    if(on){ stop(); return; }
    on=true; run.textContent="Pause";
    tick=setInterval(()=>{ left--; paint(); },1000);
  };
  rst.onclick=()=>set(defMin);
  root.querySelectorAll(".presets button").forEach(b=>b.onclick=()=>set(+b.dataset.m));
  paint();
}
$$(".timer[data-timer]").forEach(t=>makeTimer(t,+t.dataset.timer));

/* keyboard: Space starts the timer of the step that is showing */
addEventListener("keydown",e=>{
  const run=document.querySelector("#p-break .sec.on [data-run]");
  if(run && e.key===" "){e.preventDefault();run.click()}
});
