/* ================= 10 VIBE CODING ================= */
const SNIP=[
 {id:"n1", label:"List my courses", task:"Asked for: show the logged-in student their enrolled courses.",
  lines:["def my_courses(request):",
         "    student = request.user.student",
         "    enrollments = Enrollment.objects.filter(student=student)",
         "    rows = []",
         "    for e in enrollments:",
         "        rows.append({",
         '            "code":  e.course.code,',
         '            "title": e.course.title,',
         '            "units": e.course.units,',
         "        })",
         '    return JsonResponse({"courses": rows})'],
  bad:2, also:[4],
  cat:"Slow with real data (N+1 queries)",
  why:`Line 3 asks for the student's enrollments but does not fetch the courses. Each time the loop reads <code>e.course</code>, Django sends another query (a request to the database) to fetch that course. With fifty enrollments that makes fifty-one queries: one for the list and fifty for the courses.<br><br>The fix goes on line 3: <code>.select_related("course")</code>, which tells Django to fetch each course in the same query. The slowdown shows up in the loop, but line 3 is where to fix it.<br><br>Reading the code does not reveal this. It only shows up with a number of rows the model never saw.`},
 {id:"upd", label:"Close a course", task:"Asked for: set a single course to zero remaining slots.",
  lines:["@require_POST",
         "def close_course(request):",
         '    code = request.POST.get("course")',
         "    Course.objects.update(slots=0)",
         '    return JsonResponse({"ok": True})'],
  bad:3, also:[],
  cat:"Changes more than intended (missing filter)",
  why:`Line 4 has no filter, so it closes every course in the catalog. The clue is on line 3: <code>code</code> is read and then never used again.<br><br>The function runs without complaint and returns <code>{"ok": true}</code>. There is no error message, no exception in the log and no undo. The only sign that anything happened is a response nobody reads.`},
 {id:"race", label:"Enroll a student", task:"Asked for: enroll a student if a seat is free.",
  lines:["def enroll(request, code):",
         "    course = Course.objects.get(code=code)",
         "    if course.slots > 0:",
         "        Enrollment.objects.create(",
         "            student=request.user.student, course=course)",
         "        course.slots -= 1",
         "        course.save()",
         '        return JsonResponse({"ok": True})',
         '    return JsonResponse({"error": "full"}, status=409)'],
  bad:2, also:[5],
  cat:"Fails when two requests overlap (race condition)",
  why:`Line 3 reads the seat count, and line 6 writes it back. Between those two lines, another request can read the same number.<br><br>On a quiet afternoon this works. On enlistment morning, two students both see one free seat, both pass the check, and both are enrolled. This is the problem in the Module 1 site, "Transactions and two users changing the same data".<br><br>The code is <b class="i">only correct when nobody else is using it</b>, and you cannot see that by reading it.`},
 {id:"hall", label:"Fetch one course", task:"Asked for: return a course, or 404 if there is no such code.",
  lines:["def course_detail(request, code):",
         "    course = Course.objects.get_or_none(code=code)",
         "    if course is None:",
         '        return JsonResponse({"error": "not found"}, status=404)',
         '    return JsonResponse({"code": course.code,',
         '                         "title": course.title})'],
  bad:1, also:[],
  cat:"Calls a method that does not exist",
  why:`Line 2 calls <code>get_or_none()</code>, which the Django ORM does not have. The ORM is the part of Django that lets code read and write database rows. It has <code>get()</code>, <code>filter().first()</code> and <code>get_or_create()</code>, and the invented method fits neatly among them.<br><br>The model produced it because it has the shape of a method Django could plausibly provide, and the code around it handles the result correctly.<br><br>This one fails with an error the first time you run it. The other three run without any error.`}
];
const VB={sel:"n1", picks:{}, first:null};
function vbRender(){
  const q=SNIP.find(x=>x.id===VB.sel), p=VB.picks[q.id];
  $("#vbPick").innerHTML=SNIP.map(x=>
    `<button data-s="${x.id}" aria-pressed="${x.id===VB.sel}">${VB.picks[x.id]!==undefined&&VB.picks[x.id]===x.bad?"&#10003; ":""}${x.label}</button>`).join("");
  $$("#vbPick button").forEach(el=>el.onclick=()=>{VB.sel=el.dataset.s;vbRender()});
  $("#vbTask").textContent=q.task;
  $("#vbCode").innerHTML=q.lines.map((l,i)=>{
    let cls="cl";
    if(p!==undefined){ cls+=" dead";
      if(i===q.bad) cls+=" right";
      else if(i===p) cls+=" wrongpick";
    }
    return `<div class="${cls}" data-i="${i}"><span class="ln">${i+1}</span><span>${l.replace(/</g,"&lt;")||"&nbsp;"}</span></div>`;
  }).join("");
  if(p===undefined) $$("#vbCode .cl").forEach(el=>el.onclick=()=>{
    const i=+el.dataset.i;
    VB.picks[q.id]=i;
    if(VB.first===null) VB.first = (i===q.bad);
    vbRender();
  });
  const done=Object.keys(VB.picks).length;
  const got=SNIP.filter(x=>VB.picks[x.id]===x.bad).length;
  const set=(id,v,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;g.classList.toggle("good",!!good)};
  set("#vbFound", got+" of "+SNIP.length, got===SNIP.length);
  set("#vbFirst", VB.first===null?"—":VB.first?"correct":"missed", VB.first===true);
  const v=$("#vbVerdict");
  if(p===undefined){
    v.className="verdict";
    v.innerHTML=`<b>Click the line that causes the problem</b>The code runs, and any tests written for it probably pass. One line still makes it unsafe to ship.`;
    return;
  }
  const right=p===q.bad;
  v.className="verdict "+(right?"ok":"bad");
  v.innerHTML=(right
    ? `<b>Line ${q.bad+1} is the problem.</b>`
    : `<b>Line ${p+1} is fine. The problem is on line ${q.bad+1}.</b>`)
    + `<span style="display:block;color:var(--req);margin:2px 0 8px">${q.cat}</span>`
    + q.why
    + (done===SNIP.length
      ? `<br><br><b class="i">${got} of ${SNIP.length}.</b> ${got===SNIP.length
          ? "You found all four. Notice how long that took with four short snippets, when you knew each held exactly one defect. An agent will hand you three hundred lines and tell you the tests pass."
          : "Each snippet reads like correct Django code and runs without errors. Nothing on the screen marks the problem, so a review needs a fixed set of questions: what is in the tables, what runs twice, and what happens when two people click at once."}`
      : "");
}
$("#vbReset").onclick=()=>{VB.picks={};VB.first=null;vbRender()};
vbRender();

function redrawAll(){ try{lnRender();trRender();nnRender();emRender();vecRender();attRender();}catch(e){} }

/* ---- nav, zoom, theme ---- */
const PANELS=['intro', 'next', 'learn', 'train', 'deep', 'backprop', 'tokens', 'embed', 'vectors', 'rnn', 'attn', 'ctx', 'prompt', 'loop', 'tools', 'vibe', 'math'];
$$('[role="tab"]').forEach(b=>b.onclick=()=>{
  $$('[role="tab"]').forEach(x=>x.setAttribute("aria-selected", x===b));
  $$(".panel").forEach(p=>p.classList.toggle("on", p.id==="p-"+b.dataset.p));
  document.querySelector(".stage").scrollTop=0;
});
const kmap={}; PANELS.forEach((p,i)=>{kmap[String(i)]=i;});
addEventListener("keydown",e=>{
  if(/input|textarea/i.test(e.target.tagName)) return;
  if(e.key in kmap) $$('[role="tab"]')[kmap[e.key]].click();
});
let SC=1;
const setSc=v=>{SC=Math.max(.8,Math.min(1.35,v));document.documentElement.style.setProperty("--scale",SC);};
$("#zIn").onclick=()=>setSc(SC+.06); $("#zOut").onclick=()=>setSc(SC-.06);
$("#thBtn").onclick=()=>{
  const now=document.documentElement.getAttribute("data-theme")==="light"?"dark":"light";
  document.documentElement.setAttribute("data-theme",now);
  for(const k in CSSV.cache) delete CSSV.cache[k];
  $("#thBtn").textContent = now==="light"?"Dark":"Light";
  if(typeof redrawAll==="function") redrawAll();
};
