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
  cat:"It has not run anything",
  why:`Line 3 fetches the enrolments and stops there. Every <code>e.course</code> inside the loop is a fresh trip to the database, so fifty enrolments cost fifty-one queries.<br><br>The fix goes on line 3: <code>.select_related("course")</code>. The symptom shows in the loop. People look there and find nothing wrong, because nothing there <em>is</em> wrong.<br><br>Nothing in the code can tell you this. It only appears under a row count the model never saw.`},
 {id:"upd", label:"Close a course", task:"Asked for: set a single course to zero remaining slots.",
  lines:["@require_POST",
         "def close_course(request):",
         '    code = request.POST.get("course")',
         "    Course.objects.update(slots=0)",
         '    return JsonResponse({"ok": True})'],
  bad:3, also:[],
  cat:"No truth check",
  why:`Line 4 has no filter, so it closes every course in the catalog. The tell is on line 3: <code>code</code> is read and then never used again.<br><br>It runs without complaint and returns <code>{"ok": true}</code>. There is no error to notice, no exception in the log, and no undo. The only sign anything happened is a number in a response nobody reads.`},
 {id:"race", label:"Enrol a student", task:"Asked for: enrol a student if a seat is free.",
  lines:["def enrol(request, code):",
         "    course = Course.objects.get(code=code)",
         "    if course.slots > 0:",
         "        Enrollment.objects.create(",
         "            student=request.user.student, course=course)",
         "        course.slots -= 1",
         "        course.save()",
         '        return JsonResponse({"ok": True})',
         '    return JsonResponse({"error": "full"}, status=409)'],
  bad:2, also:[5],
  cat:"It has not run anything",
  why:`Line 3 reads the seat count, and line 6 writes it back. Between those two lines another request can read the same number.<br><br>On a quiet afternoon this is correct. On enlistment morning two students both see one free seat, both pass the check, and both get enrolled. You have met this already: it is the transactions panel in the Module 1 tool.<br><br>The code is not wrong so much as it is <b class="i">only correct when nobody else is using it</b>, which is not a property you can see by reading.`},
 {id:"hall", label:"Fetch one course", task:"Asked for: return a course, or 404 if there is no such code.",
  lines:["def course_detail(request, code):",
         "    course = Course.objects.get_or_none(code=code)",
         "    if course is None:",
         '        return JsonResponse({"error": "not found"}, status=404)',
         '    return JsonResponse({"code": course.code,',
         '                         "title": course.title})'],
  bad:1, also:[],
  cat:"It invents things that fit the pattern",
  why:`Line 2 calls <code>get_or_none()</code>, which the Django ORM does not have. There is <code>get()</code>, there is <code>filter().first()</code>, there is <code>get_or_create()</code>, and this sits neatly among them.<br><br>It was produced because it has the shape of a method Django would plausibly provide, and everything around it handles the return value correctly.<br><br>This one at least fails loudly the first time you run it. The other three do not.`}
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
    v.innerHTML=`<b>Click the line that causes the problem</b>The code runs. The tests somebody wrote for it probably pass. One line still makes it unsafe to ship.`;
    return;
  }
  const right=p===q.bad;
  v.className="verdict "+(right?"ok":"bad");
  v.innerHTML=(right
    ? `<b>Line ${q.bad+1}. That is the one.</b>`
    : `<b>Line ${p+1} is fine. It is line ${q.bad+1}.</b>`)
    + `<span style="display:block;font-family:var(--mono);font-size:.72em;letter-spacing:.08em;text-transform:uppercase;color:var(--req);margin:2px 0 8px">${q.cat}</span>`
    + q.why
    + (done===SNIP.length
      ? `<br><br><b class="i">${got} of ${SNIP.length}.</b> ${got===SNIP.length
          ? "All four. Now notice how long that took you, with four short snippets, knowing in advance that each held exactly one defect. An agent will hand you three hundred lines and tell you the tests pass."
          : "Every one of these reads like working Django, because it is working Django until the conditions change. The difficulty is that there is no visual tell, so review has to be a procedure and not an impression."}`
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
