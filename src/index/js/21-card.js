/* ================= RELATIONSHIPS & CARDINALITY ================= */
const CARDS=[
 {id:"o2o", n:"One to one", sym:"1 to 1",
  q:"One student has one locker, and one locker belongs to one student.",
  tables:[{n:"students",c:["<b>id</b> pk","name","<i>locker_id</i> fk unique"]},
          {n:"lockers",c:["<b>id</b> pk","location"]}],
  note:"A foreign key (fk) is a column that holds the primary key (pk), the identifying id, of a row in another table. In a one-to-one relationship the foreign key can sit on either side. A <code>unique</code> rule on it makes each id appear only once, and that rule enforces the <em>one</em>. Without it you have built a one-to-many relationship and labeled it 1:1.<br><br>Also ask whether you need two tables. If the locker has no data of its own, make it a column in students.",
  v:`<b>Two tables with a unique foreign key</b>Put the key on either side and add the unique rule. This is the rarest of the three types, and it often means that the two entities could be one.`},
 {id:"o2m", n:"One to many", sym:"1 to many",
  q:"One course has many sections, and each section belongs to one course.",
  tables:[{n:"courses",c:["<b>id</b> pk","code","title"]},
          {n:"sections",c:["<b>id</b> pk","letter","<i>course_id</i> fk"]}],
  note:"A foreign key (fk) is a column that holds the primary key (pk), the identifying id, of a row in another table. In a one-to-many relationship it always goes on the <em>many</em> side, so each section stores the id of its course. If it went on the one side, a course would need a column that holds a list of section ids, and a table column cannot hold a list.<br><br>This is the relationship you will draw most often, and it needs no extra table.",
  v:`<b>The foreign key goes on the many side</b>Each section holds the id of its course. The courses table holds nothing about its sections, because a column cannot hold a list of ids.`},
 {id:"m2m", n:"Many to many", sym:"many to many",
  q:"A student takes many courses, and a course has many students.",
  tables:[{n:"students",c:["<b>id</b> pk","name"]},
          {n:"courses",c:["<b>id</b> pk","code","title"]},
          {n:"enrollments",c:["<b>id</b> pk","<i>student_id</i> fk","<i>course_id</i> fk","enrolled_on","status","grade"],new:true}],
  note:"Neither table can hold the foreign key, because each row would have to point at many rows in the other table. A third table is needed, with one row for each pairing of a student and a course.<br><br>Look at the last three columns. A date, a status and a grade describe the pairing, so they cannot be stored in the student or the course. This is why Enrollment counts as an entity in \"Entities, attributes and instances\".",
  v:`<b>A third table appears</b>Neither side can store the other's key, so each pairing gets its own row in a new table. <b class="i">enrollments</b> holds enrolled_on, status and grade, because those facts describe the pairing and neither side owns them.`}
];
let cardSel="o2m";
function renderCard(){
  const c=CARDS.find(x=>x.id===cardSel);
  $("#cardTab").innerHTML=CARDS.map(x=>
    `<button data-c="${x.id}" aria-pressed="${x.id===cardSel}">${x.n}</button>`).join("");
  $$("#cardTab button").forEach(el=>el.onclick=()=>{cardSel=el.dataset.c;renderCard()});

  $("#cardDia").innerHTML=
    `<div style="font-family:var(--mono);font-size:.86em;color:var(--res)">`+
    `${c.tables[0].n} &nbsp;<span style="color:var(--req)">${c.sym}</span>&nbsp; ${c.tables[1].n}</div>`+
    `<div style="margin-top:9px;font-size:.8em;color:var(--dim)">${c.q}</div>`;

  $("#cardTables").innerHTML=c.tables.map(t=>
    `<div class="tbl3${t.new?" newt":""}"><div class="tname">${t.n}${t.new?" &nbsp;&larr; new":""}</div>
      <div class="cols">${t.c.join("<br>")}</div></div>`).join("");
  $("#cardNote").innerHTML=c.note;
  $("#cardVerdict").className="verdict "+(c.id==="m2m"?"ok":"warn");
  $("#cardVerdict").innerHTML=c.v;
}
renderCard();

