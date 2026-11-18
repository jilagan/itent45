/* Lesson entity. Widget code for the markup in lesson.html. */
/* ================= ENTITY / ATTRIBUTE / INSTANCE ================= */
const TERMS=[
 {t:"Student",           k:"E", why:"A kind of thing the school keeps data about, with many examples."},
 {t:"Juan dela Cruz",    k:"I", why:"One student, stored as one row. It is an instance."},
 {t:"ID number",         k:"A", why:"A fact that describes a student. It has no meaning on its own."},
 {t:"Course",            k:"E", why:"A kind of thing the school keeps data about, with many examples that can be told apart."},
 {t:"MGT 45",          k:"I", why:"One course. Drawing a box for each course would take 3,000 boxes."},
 {t:"Units",             k:"A", why:"A property of a course. The value 3 describes the course."},
 {t:"Enlistment",        k:"E", why:"An <b class=\"i\">event</b>: a student signing up for a course. It has a date, a status and a grade, and none of those belong to the student or to the course alone."},
 {t:"Enlisted on 12 Aug",k:"I", why:"One enlistment. It is one example of the Enlistment entity."},
 {t:"Grade",             k:"A", why:"A property of an enlistment. It belongs to neither the student nor the course alone."},
 {t:"Section",           k:"E", why:"Debatable. It is an attribute if it only names a letter, and an entity if it also has a room, a schedule and a seat limit."}
];
const KIND={E:"entity",A:"attribute",I:"instance"};
const ENT={ans:{}};
function renderEnt(){
  $("#entList").innerHTML=TERMS.map((x,i)=>{
    const a=ENT.ans[i], cls=a?(a===x.k?"right":"wrong"):"";
    return `<div class="trm ${cls}">
      <span class="lab">${x.t}${a?`<small>${a===x.k?"":"You said "+KIND[a]+". "}${x.why}</small>`:""}</span>
      <span class="opts">${["E","A","I"].map(k=>
        `<button data-i="${i}" data-k="${k}" aria-pressed="${a===k}">${KIND[k]}</button>`).join("")}</span>
    </div>`;
  }).join("");
  $$("#entList .opts button").forEach(el=>el.onclick=()=>{
    ENT.ans[+el.dataset.i]=el.dataset.k; renderEnt();
  });
  const done=Object.keys(ENT.ans).length, right=TERMS.filter((x,i)=>ENT.ans[i]===x.k).length;
  const v=$("#entVerdict");
  if(!done){ v.className="verdict"; v.innerHTML=`<b>Sort all ten</b>Each answer shows a short explanation.`; return; }
  if(done<TERMS.length){ v.className="verdict warn"; v.innerHTML=`<b>${right} of ${done} correct so far</b>Keep going.`; return; }
  v.className = right===TERMS.length ? "verdict ok" : "verdict warn";
  v.innerHTML = right===TERMS.length
    ? `<b>All ten correct</b>You decided which nouns become tables, columns and rows. Making these decisions before writing any SQL is called conceptual modeling.`
    : `<b>${right} of ${TERMS.length} correct</b>Read the explanations under the terms marked in red. Enlistment and Section are where real diagrams most often go wrong.`;
}
renderEnt();
