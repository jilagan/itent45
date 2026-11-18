/* ================= ENTITY / ATTRIBUTE / INSTANCE ================= */
const TERMS=[
 {t:"Student",           k:"E", why:"A person the school keeps data about, with many specimens. Textbook entity."},
 {t:"Juan dela Cruz",    k:"I", why:"One student. A row, not a box on a diagram."},
 {t:"ID number",         k:"A", why:"A fact that describes a student. On its own it describes nothing."},
 {t:"Course",            k:"E", why:"A concept the school keeps data about. Many specimens, each distinguishable."},
 {t:"ITENT 45",          k:"I", why:"One course. If you drew a box for it you would need 3,000 more."},
 {t:"Units",             k:"A", why:"A property of a course. Three is not a thing, it is a fact about a thing."},
 {t:"Enrolment",         k:"E", why:"An <b class=\"i\">event</b>, and the one students leave out. It has a date, a status and a grade, and none of those belong to the student or to the course alone."},
 {t:"Enrolled on 12 Aug",k:"I", why:"One enrolment. A specimen of the event, not the event type."},
 {t:"Grade",             k:"A", why:"A property of an enrolment. Not of the student, and not of the course."},
 {t:"Section",           k:"E", why:"Arguable, and worth arguing. If it only ever names a letter it is an attribute. The moment it has a room, a schedule and a cap, it is an entity."}
];
const KIND={E:"entity",A:"attribute",I:"instance"};
const ENT={ans:{}};
function renderEnt(){
  $("#entList").innerHTML=TERMS.map((x,i)=>{
    const a=ENT.ans[i], cls=a?(a===x.k?"right":"wrong"):"";
    return `<div class="trm ${cls}">
      <span class="lab">${x.t}${a?`<small>${a===x.k?"":"you said "+KIND[a]+". "}${x.why}</small>`:""}</span>
      <span class="opts">${["E","A","I"].map(k=>
        `<button data-i="${i}" data-k="${k}" aria-pressed="${a===k}">${KIND[k]}</button>`).join("")}</span>
    </div>`;
  }).join("");
  $$("#entList .opts button").forEach(el=>el.onclick=()=>{
    ENT.ans[+el.dataset.i]=el.dataset.k; renderEnt();
  });
  const done=Object.keys(ENT.ans).length, right=TERMS.filter((x,i)=>ENT.ans[i]===x.k).length;
  const v=$("#entVerdict");
  if(!done){ v.className="verdict"; v.innerHTML=`<b>Sort all ten</b>Guess before you read the panel on the right. The ones you get wrong are the interesting ones.`; return; }
  if(done<TERMS.length){ v.className="verdict warn"; v.innerHTML=`<b>${right} of ${done} so far</b>Keep going.`; return; }
  v.className = right===TERMS.length ? "verdict ok" : "verdict warn";
  v.innerHTML = right===TERMS.length
    ? `<b>All ten</b>Now notice what you did: you decided which nouns become tables, which become columns, and which become rows. That is the whole of conceptual modelling, and it happened before you wrote any SQL.`
    : `<b>${right} of ${TERMS.length}</b>The misses are the lesson. Read the reasons under the ones in red, then look at <em>Enrolment</em> and <em>Section</em> in particular, because those two are where real diagrams go wrong.`;
}
renderEnt();

