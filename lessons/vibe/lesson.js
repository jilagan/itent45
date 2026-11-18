/* Lesson vibe. Widget code for the markup in lesson.html. */
/* ================= 10 VIBE CODING ================= */
const SNIP=[
 {id:"n1", label:"List my courses", task:"Asked for: show the logged-in student their enlisted courses.",
  lines:["def my_courses(request):",
         "    student = request.user.student",
         "    enlistments = Enlistment.objects.filter(student=student)",
         "    rows = []",
         "    for e in enlistments:",
         "        rows.append({",
         '            "code":  e.course.code,',
         '            "title": e.course.title,',
         '            "units": e.course.units,',
         "        })",
         '    return JsonResponse({"courses": rows})'],
  bad:2, also:[4],
  cat:"Slow with real data (N+1 queries)",
  why:`Line 3 does not fetch the courses, so each pass through the loop sends another query to the database. Fifty enlistments make fifty-one queries, and the fix is <code>.select_related("course")</code> on line 3.`,
  full:`Line 3 asks for the student's enlistments but does not fetch the courses. Each time the loop reads <code>e.course</code>, Django sends another query (a request to the database) to fetch that course. With fifty enlistments that makes fifty-one queries: one for the list and fifty for the courses.<br><br>The fix goes on line 3: <code>.select_related("course")</code>, which tells Django to fetch each course in the same query. The slowdown shows up in the loop, but line 3 is where to fix it.<br><br>Reading the code does not reveal this. It only shows up with a number of rows the model never saw.`},
 {id:"upd", label:"Close a course", task:"Asked for: set a single course to zero remaining slots.",
  lines:["@require_POST",
         "def close_course(request):",
         '    code = request.POST.get("course")',
         "    Course.objects.update(slots=0)",
         '    return JsonResponse({"ok": True})'],
  bad:3, also:[],
  cat:"Changes more than intended (missing filter)",
  why:`Line 4 has no filter, so it closes every course in the catalog. The function still returns <code>{"ok": true}</code>, with no error and no undo.`,
  full:`Line 4 has no filter, so it closes every course in the catalog. The clue is on line 3: <code>code</code> is read and then never used again.<br><br>The function runs without complaint and returns <code>{"ok": true}</code>. There is no error message, no exception in the log and no undo. The only sign that anything happened is a response nobody reads.`},
 {id:"race", label:"Enlist a student", task:"Asked for: enlist a student if a slot is free.",
  lines:["def enlist(request, code):",
         "    course = Course.objects.get(code=code)",
         "    if course.slots > 0:",
         "        Enlistment.objects.create(",
         "            student=request.user.student, course=course)",
         "        course.slots -= 1",
         "        course.save()",
         '        return JsonResponse({"ok": True})',
         '    return JsonResponse({"error": "full"}, status=409)'],
  bad:2, also:[5],
  cat:"Fails when two requests overlap (race condition)",
  why:`Line 3 reads the slot count and line 6 writes it back, and another request can read the same number in between. On enlistment morning two students can both see one free slot and both get enlisted.`,
  full:`Line 3 reads the slot count, and line 6 writes it back. Between those two lines, another request can read the same number.<br><br>On a quiet afternoon this works. On enlistment morning, two students both see one free slot, both pass the check, and both are enlisted. This is the problem in <a data-lesson="txn">Transactions</a>.<br><br>The code is <b class="i">only correct when nobody else is using it</b>, and you cannot see that by reading it.`},
 {id:"invented", label:"Fetch one course", task:"Asked for: return a course, or 404 if there is no such code.",
  lines:["def course_detail(request, code):",
         "    course = Course.objects.get_or_none(code=code)",
         "    if course is None:",
         '        return JsonResponse({"error": "not found"}, status=404)',
         '    return JsonResponse({"code": course.code,',
         '                         "title": course.title})'],
  bad:1, also:[],
  cat:"Calls a method that does not exist",
  why:`Line 2 calls <code>get_or_none()</code>, a method that does not exist. This one fails with an error the first time it runs, and the other three run without any error.`,
  full:`Line 2 calls <code>get_or_none()</code>, which the Django ORM does not have. The ORM is the part of Django that lets code read and write database rows. It has <code>get()</code>, <code>filter().first()</code> and <code>get_or_create()</code>, and the invented method fits neatly among them.<br><br>The model produced it because it has the shape of a method Django could plausibly provide, and the code around it handles the result correctly.<br><br>This one fails with an error the first time you run it. The other three run without any error.`}
];
const VB={sel:"n1", picks:{}, first:null};
function vbRender(){
  const q=SNIP.find(x=>x.id===VB.sel), p=VB.picks[q.id];
  const idx=SNIP.indexOf(q);
  $("#vbPick").innerHTML=SNIP.map(x=>
    `<button data-s="${x.id}" aria-pressed="${x.id===VB.sel}">${VB.picks[x.id]!==undefined&&VB.picks[x.id]===x.bad?"&#10003; ":""}${x.label}</button>`).join("");
  $$("#vbPick button").forEach(el=>el.onclick=()=>{VB.sel=el.dataset.s;vbRender()});
  $("#vbTask").textContent=`Snippet ${idx+1} of ${SNIP.length}. ${q.task}`;
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
  $("#vbNext").style.display = (p!==undefined && idx<SNIP.length-1) ? "" : "none";
  const sum=$("#vbSum");
  if(done===SNIP.length){
    sum.style.display="";
    sum.className="verdict "+(got===SNIP.length?"ok":"warn");
    sum.innerHTML=`<b>${got} of ${SNIP.length}</b>`+(got===SNIP.length
      ? "You found all four, and each had exactly one defect. An agent will hand you three hundred lines and tell you the tests pass."
      : "Each snippet looked like correct code, and nothing on the screen marked the problem. A review needs a fixed set of questions.");
  } else sum.style.display="none";
  const v=$("#vbVerdict");
  if(p===undefined){
    v.className="verdict";
    v.innerHTML=`<b>Click the line that causes the problem</b>The code looks right, and tests written for it may pass. One line still makes it unsafe to ship.`;
    $("#vbWhy").innerHTML=`<p>Click a line in the snippet to see the full explanation.</p>`;
    return;
  }
  const right=p===q.bad;
  v.className="verdict "+(right?"ok":"bad");
  v.innerHTML=(right
    ? `<b>Line ${q.bad+1} is the problem.</b>`
    : `<b>Line ${p+1} is fine. The problem is on line ${q.bad+1}.</b>`)
    + `<span style="display:block;color:var(--req);margin:2px 0 8px">${q.cat}</span>`
    + q.why;
  $("#vbWhy").innerHTML=`<p>${q.full}</p>`;
}
$("#vbNext").onclick=()=>{
  const idx=SNIP.findIndex(x=>x.id===VB.sel);
  if(idx<SNIP.length-1){ VB.sel=SNIP[idx+1].id; vbRender(); }
};
$("#vbReset").onclick=()=>{VB.picks={};VB.first=null;VB.sel=SNIP[0].id;vbRender()};
vbRender();
