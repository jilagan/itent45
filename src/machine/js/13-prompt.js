/* ================= PROMPTING ================= */
const PRC=[
 {t:"Creates the row, no checks at all",           w:.26, bad:["concurrent"], ok:false,
  c:'Enrollment.objects.create(student=s, course=c)'},
 {t:"Reads the slot count, checks it, then creates",        w:.30, bad:["concurrent"], ok:false,
  c:'if course.slots > 0:\n    Enrollment.objects.create(...)\n    course.slots -= 1'},
 {t:"get_or_create, which handles duplicates",    w:.13, bad:["concurrent"], ok:false,
  c:'Enrollment.objects.get_or_create(student=s, course=c)'},
 {t:"Raw SQL INSERT",                              w:.08, bad:["django"], ok:false,
  c:'cursor.execute("INSERT INTO enrollments ...")'},
 {t:"SQLAlchemy session.add",                      w:.06, bad:["django"], ok:false,
  c:'session.add(Enrollment(...)); session.commit()'},
 {t:"Uses a Course.capacity field that does not exist",             w:.04, bad:["schema"], ok:false,
  c:'if course.capacity > course.taken:   # no such fields'},
 {t:"SELECT \u2026 FOR UPDATE, then create",        w:.07, bad:[], ok:true,
  c:'with transaction.atomic():\n    c = Course.objects.select_for_update().get(pk=pk)\n    if c.slots < 1: raise CourseFull\n    c.slots -= 1; c.save()\n    Enrollment.objects.create(student=s, course=c)'},
 {t:"One conditional UPDATE, checks rowcount",     w:.06, bad:[], ok:true,
  c:'n = Course.objects.filter(pk=pk, slots__gt=0).update(slots=F("slots")-1)\nif not n: raise CourseFull\nEnrollment.objects.create(student=s, course_id=pk)'}
];
const PRT=[
 {id:"django",     lb:"Use Django, not raw SQL",                     line:'Use the Django ORM.'},
 {id:"concurrent", lb:"Two students may click at the same moment",   line:'Two requests can arrive at the same instant. It must still sell one seat.'},
 {id:"schema",     lb:"Include the table definitions",                line:'Course has a slots integer. Enrollment has unique(student, course).'}
];
const PR={on:new Set()};
function prRender(){
  $("#prToggles").innerHTML=PRT.map(t=>
    `<button class="tg" data-t="${t.id}" aria-pressed="${PR.on.has(t.id)}"><span class="dot"></span>${t.lb}</button>`).join("");
  $$("#prToggles .tg").forEach(el=>el.onclick=()=>{
    const id=el.dataset.t; PR.on.has(id)?PR.on.delete(id):PR.on.add(id); prRender();
  });

  const live=PRC.filter(c=>!c.bad.some(b=>PR.on.has(b)));
  const tot=live.reduce((a,c)=>a+c.w,0);
  const rows=live.map(c=>({...c,p:c.w/tot})).sort((a,b)=>b.p-a.p);
  const top=rows[0], safe=rows.filter(r=>r.ok).reduce((a,r)=>a+r.p,0);

  $("#prPrompt").innerHTML=
    `<span class="c">// the prompt so far</span>\nWrite a function that enrolls a student in a course.`+
    PRT.filter(t=>PR.on.has(t.id)).map(t=>`\n<span class="s">${t.line}</span>`).join("");

  const mx=rows[0].p;
  $("#prBars").innerHTML=rows.map(r=>
    `<div class="pr"><span class="tok" style="color:${r.ok?"var(--res)":"var(--faint)"};font-weight:${r===top?600:400}">${r.t.length>34?r.t.slice(0,33)+"\u2026":r.t}</span>
      <div class="lane"><div class="bar" style="width:${(r.p/mx*100).toFixed(0)}%;background:${r.ok?"var(--res)":"var(--warn)"};opacity:${r.ok?1:.72}"></div></div>
      <span class="pc">${(r.p*100).toFixed(0)}%</span></div>`).join("");

  const set=(id,v,hot,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot);g.classList.toggle("good",!!good)};
  set("#prCount", rows.length, false, rows.length<=2);
  set("#prTop", top.ok?"correct":"wrong", !top.ok, top.ok);
  set("#prSafe", Math.round(safe*100)+"%", safe<.3, safe>.9);

  const v=$("#prVerdict");
  if(PR.on.size===0){
    v.className="verdict bad";
    v.innerHTML=`<b>Eight possible answers, and the most likely one is broken</b>Each answer is real code that has been used in real systems. The most likely one reads the seat count, checks it, and then writes. When two students click together, both get through.<br><br>Only <b class="i">13%</b> of the answers survive that case. Nothing you asked for ruled out the rest, because you did not ask for anything.<br><br>Turn on the first constraint.`;
  } else if(!top.ok){
    v.className="verdict warn";
    v.innerHTML=`<b>${rows.length} answers left, and the most likely one is still wrong</b>Each constraint removes only the answers it describes. The answers that fail in some other way are still possible.<br><br>Turn on the constraints you have not used yet.`;
  } else if(safe<1){
    v.className="verdict ok";
    v.innerHTML=`<b>${rows.length} answers left, and the most likely one is now correct</b>The sentence about simultaneous requests removed every check-then-write answer, and those were 69% of the original range.<br><br>${Math.round(safe*100)}% of what remains is correct. The last constraint removes the rest.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>Two answers left, and both work</b>You gave the model three facts it could not have known: which framework you use, that requests can overlap, and what the columns are called. Each fact ruled out a group of reasonable answers. Telling it to try harder or be careful would have ruled out nothing.<br><br>Compare the two answers below. Both are correct. The second does not hold a lock (a hold that makes other requests wait), which matters on enlistment morning.`;
  }
  $("#prCode").innerHTML=`<span class="c">// the most likely answer now</span>\n`+top.c.replace(/</g,"&lt;");
}
prRender();

