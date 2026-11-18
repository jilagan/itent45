/* Lesson txn. Widget code for the markup in lesson.html. */
/* ================= TRANSACTIONS ================= */
/* each step: [who, text, slotsAfter, flag]  who: a | b | db */
const TXN=[
 {id:"none", n:"No transaction", ok:false,
  note:"Each session reads the slot count, decides, then writes. This is one possible timing.",
  steps:[
   ["a","Read slots left &rarr; 1",1],
   ["b","Read slots left &rarr; 1",1],
   ["a","1 slot left, so go ahead",1],
   ["b","1 slot left, so go ahead",1],
   ["a","Set slots left to 0",0],
   ["b","Set slots left to 0",0],
   ["a","Record the enlistment",0],
   ["b","Record the enlistment",0]],
  v:`<b>Two enlistments, one slot</b>Both sessions read 1 before either one wrote, so both went ahead. Neither made a mistake, and the last slot went to two students.`},
 {id:"begin", n:"Transaction only", ok:false,
  note:"Each session wraps its steps in a transaction, which many people try first. Watch whether the result changes.",
  steps:[
   ["a","Start a transaction",1],
   ["b","Start a transaction",1],
   ["a","Read slots left &rarr; 1",1],
   ["b","Read slots left &rarr; 1",1],
   ["a","Set slots left to 0",0],
   ["a","Record the enlistment",0],
   ["a","Save the transaction",0],
   ["b","Set slots left to 0",0],
   ["b","Record the enlistment",0],
   ["b","Save the transaction",0]],
  v:`<b>Still two enlistments</b>A transaction makes each session's own steps succeed together. It does not stop the other session from reading the old slot count in the meantime.`},
 {id:"lock", n:"Lock the row", ok:true,
  note:"Session A asks the database to hold the row while it decides. Session B must wait for the same row.",
  steps:[
   ["a","Start a transaction",1],
   ["a","Read slots left and lock the row &rarr; 1",1],
   ["b","Start a transaction",1],
   ["b","Read slots left and lock the row &hellip;",1,"blocked"],
   ["a","Set slots left to 0",0],
   ["a","Record the enlistment",0],
   ["a","Save the transaction",0],
   ["b","Lock released, reads &rarr; 0",0],
   ["b","0 slots left, so refuse",0,"fail"],
   ["b","Undo the transaction",0]],
  v:`<b>One enlistment, and B was refused</b>The lock made B wait, so B read the current count, which was 0. The cost is the waiting. On enlistment day, nine thousand users pressing Enlist would wait on the same row.`},
 {id:"atomic", n:"One statement", ok:true,
  note:"The check and the change are one statement, with no lock. The database orders the two requests itself.",
  steps:[
   ["a","Subtract 1 slot, only if slots left &gt; 0",0],
   ["a","&rarr; 1 row changed, so the slot is mine",0],
   ["b","Subtract 1 slot, only if slots left &gt; 0",0],
   ["b","&rarr; 0 rows changed, nothing matched",0,"fail"],
   ["a","Record the enlistment",0],
   ["b","No slot, so no enlistment",0,"fail"]],
  v:`<b>One enlistment, and nobody waited</b>The check sits inside the same statement as the change, so the database handles the two requests one after the other. The number of rows changed tells each student whether they got the slot.`}
];
let txnSel="none", txnAt=0, txnTimer=null;
function renderTxn(){
  const t=TXN.find(x=>x.id===txnSel);
  $("#txnTab").innerHTML=TXN.map(x=>
    `<button data-t="${x.id}" aria-pressed="${x.id===txnSel}">${x.n}</button>`).join("");
  $$("#txnTab button").forEach(el=>el.onclick=()=>{
    clearTimeout(txnTimer); txnSel=el.dataset.t; txnAt=0; renderTxn();
  });

  let h=`<div class="th a">${ICO("laptop")} Juan &middot; session A</div><div class="th b">${ICO("laptop")} Maria &middot; session B</div><div class="th">Slots left</div>`;
  t.steps.forEach((st,i)=>{
    const [who,txt,slots,flag]=st;
    const on=i<txnAt, act=i===txnAt-1;
    const cell=`<div class="tstep ${who} ${on?"on":""} ${act?"act":""} ${flag||""}">${txt}</div>`;
    h += who==="a" ? cell+`<div class="tstep"></div>` : `<div class="tstep"></div>`+cell;
    h += `<div class="tstep db ${on?"on":""}">${on?slots:""}</div>`;
  });
  $("#txnLine").innerHTML=h;
  $("#txnNote").innerHTML=t.note;

  const v=$("#txnVerdict");
  if(txnAt<t.steps.length){
    v.className="verdict";
    v.innerHTML=`<b>${txnAt} of ${t.steps.length} steps</b>Press Play or Step, and watch the Slots left column.`;
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
