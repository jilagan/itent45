/* Lesson prompt. Widget code for the markup in lesson.html. */
/* ================= PROMPTING ================= */
const PRC=[
 {t:"No checks", f:"creates the row with no checks at all",           w:.26, bad:["concurrent"], ok:false,
  c:'Enlistment.objects.create(student=s, course=c)'},
 {t:"Check, then create", f:"reads the slot count, checks it, then creates the row",        w:.30, bad:["concurrent"], ok:false,
  c:'if course.slots > 0:\n    Enlistment.objects.create(...)\n    course.slots -= 1'},
 {t:"get_or_create", f:"a Django call that handles duplicate rows",    w:.13, bad:["concurrent"], ok:false,
  c:'Enlistment.objects.get_or_create(student=s, course=c)'},
 {t:"Raw SQL", f:"an INSERT statement written by hand",                              w:.08, bad:["django"], ok:false,
  c:'cursor.execute("INSERT INTO enlistments ...")'},
 {t:"SQLAlchemy", f:"code for a different Python database tool",                      w:.06, bad:["django"], ok:false,
  c:'session.add(Enlistment(...)); session.commit()'},
 {t:"Invented field", f:"code that uses a Course.capacity field that does not exist",             w:.04, bad:["schema"], ok:false,
  c:'if course.capacity > course.taken:   # no such fields'},
 {t:"Lock the row", f:"locks the course row, then creates the enlistment",        w:.07, bad:[], ok:true,
  c:'with transaction.atomic():\n    c = Course.objects.select_for_update().get(pk=pk)\n    if c.slots < 1: raise CourseFull\n    c.slots -= 1; c.save()\n    Enlistment.objects.create(student=s, course=c)'},
 {t:"Conditional update", f:"one update that succeeds only if a slot is free",     w:.06, bad:[], ok:true,
  c:'n = Course.objects.filter(pk=pk, slots__gt=0).update(slots=F("slots")-1)\nif not n: raise CourseFull\nEnlistment.objects.create(student=s, course_id=pk)'}
];
const PRT=[
 {id:"django",     lb:"Name the framework (Django)",                     line:'Use the Django ORM.'},
 {id:"concurrent", lb:"Two students may click at the same moment",   line:'Two requests can arrive at the same instant. It must still sell one slot.'},
 {id:"schema",     lb:"Include the table definitions",                line:'Course has a slots integer. Enlistment has unique(student, course).'}
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
    `<span class="c">// the prompt so far</span>\nWrite a function that enlists a student in a course.`+
    PRT.filter(t=>PR.on.has(t.id)).map(t=>`\n<span class="s">${t.line}</span>`).join("");

  $("#prKinds").innerHTML=PRC.map(c=>`<li>${c.t}: ${c.f.replace(/</g,"&lt;")}</li>`).join("");
  const mx=rows[0].p;
  $("#prBars").innerHTML=rows.map(r=>
    `<div class="pr"><span class="tok" style="color:${r.ok?"var(--res)":"var(--faint)"};font-weight:${r===top?600:400}">${r.t}</span>
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
    v.innerHTML=`<b>Eight kinds of answer, and the most likely one is broken</b>It reads the slot count and then writes the row, so two students who click together both get the last slot. Only <b class="i">13%</b> of the answers avoid that.`;
  } else if(!top.ok){
    v.className="verdict warn";
    v.innerHTML=`<b>${rows.length} kinds left, and the most likely one is still wrong</b>Each fact removes only the answers it describes. Turn on the facts you have not used yet.`;
  } else if(safe<1){
    v.className="verdict ok";
    v.innerHTML=`<b>${rows.length} kinds left, and the most likely one now works</b>The sentence about simultaneous requests removed every check-then-write answer, which made up 69% of the range. ${Math.round(safe*100)}% of what remains is correct.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>Two kinds left, and both work</b>You gave the model three facts it could not have known, and each one ruled out a group of answers. Telling it to be careful would have ruled out nothing.`;
  }
  $("#prCode").innerHTML=`<span class="c">// the most likely answer now</span>\n`+top.c.replace(/</g,"&lt;");
}
prRender();
