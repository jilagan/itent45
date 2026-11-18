/* ================= TRANSACTIONS ================= */
/* each step: [who, text, seatsAfter, flag]  who: a | b | db */
const TXN=[
 {id:"none", n:"No transaction", ok:false,
  note:"Each session sends four ordinary statements, and the order they run in depends on timing. This is one possible order. Here slots is the number of free seats. No single statement is wrong. The problem is the gap between reading the seat count and writing it.",
  steps:[
   ["a","SELECT slots FROM courses  &rarr; 1",1],
   ["b","SELECT slots FROM courses  &rarr; 1",1],
   ["a","slots > 0, so go ahead",1],
   ["b","slots > 0, so go ahead",1],
   ["a","UPDATE courses SET slots = 0",0],
   ["b","UPDATE courses SET slots = 0",0],
   ["a","INSERT INTO enrollments &hellip;",0],
   ["b","INSERT INTO enrollments &hellip;",0]],
  v:`<b>Two enrollments, one seat</b>Both sessions read <code>1</code> before either one wrote, so both passed the check. The second UPDATE wrote a value based on a number that was already out of date. Neither session made a mistake, and the seat is still sold twice.<br><br>This is called a <b class="i">lost update</b>, and it is a common bug in student projects when two users change the same data at once.`},
 {id:"begin", n:"BEGIN … COMMIT", ok:false,
  note:"The same statements, with each session wrapped in a transaction. A transaction starts with BEGIN and ends with COMMIT, which saves its changes. Many people try this first. Watch the result, which is the same as before.",
  steps:[
   ["a","BEGIN",1],
   ["b","BEGIN",1],
   ["a","SELECT slots  &rarr; 1",1],
   ["b","SELECT slots  &rarr; 1",1],
   ["a","UPDATE courses SET slots = 0",0],
   ["a","INSERT INTO enrollments &hellip;",0],
   ["a","COMMIT",0],
   ["b","UPDATE courses SET slots = 0",0],
   ["b","INSERT INTO enrollments &hellip;",0],
   ["b","COMMIT",0]],
  v:`<b>Still two enrollments</b>The transaction did not help. Atomicity means that <em>each</em> session's statements succeed together or not at all, and both sessions got that. It does not control whether the other session read the row while you were deciding.<br><br>The isolation level is the setting that controls how much sessions see of each other. At <code>READ COMMITTED</code>, the default in Postgres, session B's SELECT could still see the old value. <b class="i">A transaction groups statements into one unit of work. It does not lock the row.</b>`},
 {id:"lock", n:"SELECT … FOR UPDATE", ok:true,
  note:"Session A asks the database to hold the row while it decides. If session B asks for the same row in the same way, it waits until A finishes. Watch what B reads when it gets in.",
  steps:[
   ["a","BEGIN",1],
   ["a","SELECT slots FOR UPDATE  &rarr; 1",1],
   ["b","BEGIN",1],
   ["b","SELECT slots FOR UPDATE &hellip;",1,"blocked"],
   ["a","UPDATE courses SET slots = 0",0],
   ["a","INSERT INTO enrollments &hellip;",0],
   ["a","COMMIT",0],
   ["b","&hellip; unblocked, reads  &rarr; 0",0],
   ["b","slots is 0, refuse",0,"fail"],
   ["b","ROLLBACK",0]],
  v:`<b>One enrollment, and B was refused</b>The lock made B wait. When B finally read the row, it saw the current value, which was 0. The lock has a cost: B waited while A finished, and on enlistment morning that waiting line would be nine thousand users long.<br><br>The result is correct. It is also why adding web servers does not raise the database limit, as covered later in "Case study: enlistment".`},
 {id:"atomic", n:"One statement", ok:true,
  note:"There is no lock and no read followed by a write. The decision and the change are one statement, so the database can order the two requests itself. Look at how many rows each statement reports changing.",
  steps:[
   ["a","UPDATE courses SET slots = slots - 1<br>&nbsp;WHERE code = 'ITENT 45' AND slots > 0",0],
   ["a","&rarr; UPDATE 1, so the seat is mine",0],
   ["b","UPDATE courses SET slots = slots - 1<br>&nbsp;WHERE code = 'ITENT 45' AND slots > 0",0],
   ["b","&rarr; UPDATE 0, nothing matched",0,"fail"],
   ["a","INSERT INTO enrollments &hellip;",0],
   ["b","no seat, no insert",0,"fail"]],
  v:`<b>One enrollment, and nobody waited</b>The check is now inside the <code>WHERE</code> clause, so there is no gap between reading and deciding. The database ran the two statements one after the other, and the second one matched no rows.<br><br><b class="i">The row count tells you the result.</b> <code>UPDATE 1</code> means you got the seat. <code>UPDATE 0</code> means somebody else did. This is cheaper than a lock and harder to get wrong, whenever the decision can be written as a condition.`}
];
let txnSel="none", txnAt=0, txnTimer=null;
function renderTxn(){
  const t=TXN.find(x=>x.id===txnSel);
  $("#txnTab").innerHTML=TXN.map(x=>
    `<button data-t="${x.id}" aria-pressed="${x.id===txnSel}">${x.n}</button>`).join("");
  $$("#txnTab button").forEach(el=>el.onclick=()=>{
    clearTimeout(txnTimer); txnSel=el.dataset.t; txnAt=0; renderTxn();
  });

  let h=`<div class="th a">Juan &middot; session A</div><div class="th b">Maria &middot; session B</div><div class="th">Seats left</div>`;
  t.steps.forEach((st,i)=>{
    const [who,txt,seats,flag]=st;
    const on=i<txnAt, act=i===txnAt-1;
    const cell=`<div class="tstep ${who} ${on?"on":""} ${act?"act":""} ${flag||""}">${txt}</div>`;
    h += who==="a" ? cell+`<div class="tstep"></div>` : `<div class="tstep"></div>`+cell;
    h += `<div class="tstep db ${on?"on":""}">${on?seats:""}</div>`;
  });
  $("#txnLine").innerHTML=h;
  $("#txnNote").innerHTML=t.note;

  const v=$("#txnVerdict");
  if(txnAt<t.steps.length){
    v.className="verdict";
    v.innerHTML=`<b>${txnAt} of ${t.steps.length} steps</b>Press Step, or Run it. Watch the seats column, and watch when each session reads it.`;
  } else {
    v.className="verdict "+(t.ok?"ok":"bad");
    v.innerHTML=t.v;
  }
}
$("#txnStep").onclick=()=>{
  const t=TXN.find(x=>x.id===txnSel);
  if(txnAt<t.steps.length){ txnAt++; renderTxn(); }
};
$("#txnPlay").onclick=()=>{
  clearTimeout(txnTimer);
  const t=TXN.find(x=>x.id===txnSel);
  txnAt=0; renderTxn();
  const tick=()=>{ if(txnAt<t.steps.length){ txnAt++; renderTxn(); txnTimer=setTimeout(tick,620);} };
  txnTimer=setTimeout(tick,300);
};
$("#txnReset").onclick=()=>{ clearTimeout(txnTimer); txnAt=0; renderTxn(); };
renderTxn();

