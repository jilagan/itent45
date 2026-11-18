/* ================= RELATIONSHIPS & CARDINALITY ================= */
const CARDS=[
 {id:"o2o", n:"One to one", sym:"1 &mdash; 1",
  q:"One student has one locker, and one locker belongs to one student.",
  tables:[{n:"students",c:["<b>id</b> pk","name","<i>locker_id</i> fk unique"]},
          {n:"lockers",c:["<b>id</b> pk","location"]}],
  note:"The foreign key can sit on either side, and a <code>unique</code> on it is what actually enforces the <em>one</em>. Without that constraint you have built one-to-many and written 1:1 on the diagram.<br><br>Ask whether you need two tables at all. If a locker has no life of its own, it is a column.",
  v:`<b>Two tables, one of them optional</b>A unique foreign key on either side. The rarest of the three, and often a sign that two entities should have been one.`},
 {id:"o2m", n:"One to many", sym:"1 &mdash; &#8734;",
  q:"One course has many sections, and each section belongs to one course.",
  tables:[{n:"courses",c:["<b>id</b> pk","code","title"]},
          {n:"sections",c:["<b>id</b> pk","letter","<i>course_id</i> fk"]}],
  note:"The foreign key goes on the <em>many</em> side, always. Putting it on the one side would mean a column holding a list, which relational tables do not do.<br><br>This is the shape you will draw most often, and the one that needs no extra table.",
  v:`<b>The key goes on the many side</b>Sections point at their course. Nothing points back, because a course would need room for an unknown number of section ids, and a column cannot hold a list.`},
 {id:"m2m", n:"Many to many", sym:"&#8734; &mdash; &#8734;",
  q:"A student takes many courses, and a course has many students.",
  tables:[{n:"students",c:["<b>id</b> pk","name"]},
          {n:"courses",c:["<b>id</b> pk","code","title"]},
          {n:"enrollments",c:["<b>id</b> pk","<i>student_id</i> fk","<i>course_id</i> fk","enrolled_on","status","grade"],new:true}],
  note:"Neither side can hold the key, so a third table appears whether you planned it or not. It carries one row per pairing.<br><br>Notice the last three columns. A date, a status and a grade have nowhere else to live: they describe the pairing, not the student and not the course. That is why panel 09 called Enrolment an entity.",
  v:`<b>A third table appeared, and it carries the interesting columns</b>Neither side can store the other's key, so the pairing needs a table of its own. <b class="i">enrollments</b> is where enrolled_on, status and grade live, because those facts belong to the pairing rather than to either side.`}
];
let cardSel="o2m";
function renderCard(){
  const c=CARDS.find(x=>x.id===cardSel);
  $("#cardTab").innerHTML=CARDS.map(x=>
    `<button data-c="${x.id}" aria-pressed="${x.id===cardSel}">${x.n}</button>`).join("");
  $$("#cardTab button").forEach(el=>el.onclick=()=>{cardSel=el.dataset.c;renderCard()});

  $("#cardDia").innerHTML=
    `<div style="font-family:var(--mono);font-size:.86em;color:var(--res)">`+
    `${c.tables[0].n.toUpperCase()} &nbsp;<span style="color:var(--req)">${c.sym}</span>&nbsp; ${c.tables[1].n.toUpperCase()}</div>`+
    `<div style="margin-top:9px;font-size:.8em;color:var(--dim)">${c.q}</div>`;

  $("#cardTables").innerHTML=c.tables.map(t=>
    `<div class="tbl3${t.new?" newt":""}"><div class="tname">${t.n}${t.new?" &nbsp;&larr; new":""}</div>
      <div class="cols">${t.c.join("<br>")}</div></div>`).join("");
  $("#cardNote").innerHTML=c.note;
  $("#cardVerdict").className="verdict "+(c.id==="m2m"?"ok":"warn");
  $("#cardVerdict").innerHTML=c.v;
}
renderCard();

