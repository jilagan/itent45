/* ================= TRANSACTIONS ================= */
/* each step: [who, text, seatsAfter, flag]  who: a | b | db */
const TXN=[
 {id:"none", n:"No transaction", ok:false,
  note:"Four plain statements from each session, interleaved the way the operating system happens to schedule them. Nothing here is wrong on its own. The bug only exists in the gap between reading and writing.",
  steps:[
   ["a","SELECT slots FROM courses  &rarr; 1",1],
   ["b","SELECT slots FROM courses  &rarr; 1",1],
   ["a","slots > 0, so go ahead",1],
   ["b","slots > 0, so go ahead",1],
   ["a","UPDATE courses SET slots = 0",0],
   ["b","UPDATE courses SET slots = 0",0],
   ["a","INSERT INTO enrollments &hellip;",0],
   ["b","INSERT INTO enrollments &hellip;",0]],
  v:`<b>Two enrolments, one seat</b>Both sessions read <code>1</code> before either wrote, so both passed the check. The second UPDATE wrote a value it calculated from a number that was already stale. Nobody made a mistake and the seat is still oversold.<br><br>This is a <b class="i">lost update</b>, the most common concurrency bug in student projects.`},
 {id:"begin", n:"BEGIN … COMMIT", ok:false,
  note:"The same statements, wrapped in a transaction each. This is what most people reach for, and it is worth watching carefully, because the outcome does not change.",
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
  v:`<b>Still two enrolments. The transaction did not help.</b>Atomicity means <em>your</em> statements land together or not at all, and both sessions got that. It says nothing about whether the other session read the row while you were deciding.<br><br>At <code>READ COMMITTED</code>, which is the default in Postgres and most others, session B's SELECT was allowed to see the pre-commit value. <b class="i">A transaction is a unit of work, not a lock.</b>`},
 {id:"lock", n:"SELECT … FOR UPDATE", ok:true,
  note:"Session A asks the database to hold the row while it decides. Anyone else reading that row with the same intent waits until A finishes. Watch what B reads when it finally gets in.",
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
  v:`<b>One enrolment, and B was told no</b>The lock made B wait rather than read something about to be wrong. When it finally read, it read the truth. Look at what it cost: B sat there doing nothing while A finished, and on enlistment morning that queue is nine thousand deep.<br><br>Correct, and the reason panel 19's database ceiling does not move when you add web servers.`},
 {id:"atomic", n:"One statement", ok:true,
  note:"No lock, no read-then-write. The decision and the change become a single statement, and the database is free to serialize it however it likes. Check how many rows it says it changed.",
  steps:[
   ["a","UPDATE courses SET slots = slots - 1<br>&nbsp;WHERE code = 'ITENT 45' AND slots > 0",0],
   ["a","&rarr; UPDATE 1, so the seat is mine",0],
   ["b","UPDATE courses SET slots = slots - 1<br>&nbsp;WHERE code = 'ITENT 45' AND slots > 0",0],
   ["b","&rarr; UPDATE 0, nothing matched",0,"fail"],
   ["a","INSERT INTO enrollments &hellip;",0],
   ["b","no seat, no insert",0,"fail"]],
  v:`<b>One enrolment, and nobody waited</b>The check moved into the <code>WHERE</code>, so there is no gap between reading and deciding. The database applied both statements in some order it chose, and the second one simply matched no rows.<br><br><b class="i">The row count is the answer.</b> <code>UPDATE 1</code> means you got it; <code>UPDATE 0</code> means somebody else did. Cheaper than a lock and harder to get wrong, whenever the decision can be written as a condition.`}
];
let txnSel="none", txnAt=0, txnTimer=null;
function renderTxn(){
  const t=TXN.find(x=>x.id===txnSel);
  $("#txnTab").innerHTML=TXN.map(x=>
    `<button data-t="${x.id}" aria-pressed="${x.id===txnSel}">${x.n}</button>`).join("");
  $$("#txnTab button").forEach(el=>el.onclick=()=>{
    clearTimeout(txnTimer); txnSel=el.dataset.t; txnAt=0; renderTxn();
  });

  let h=`<div class="th a">Juan &middot; session A</div><div class="th b">Maria &middot; session B</div><div class="th">seats</div>`;
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

