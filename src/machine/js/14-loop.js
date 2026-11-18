/* ================= 06 THE LOOP ================= */
const STEPS=[
 ["th","Thought","Some students are enrolled twice. I should look at the code that handles enrollment."],
 ["ac","Action",'read_file("views.py")'],
 ["ob","Observation","def enroll(request): … 38 lines returned"],
 ["th","Thought","It calls save() without checking for an existing row."],
 ["ac","Action",'edit_file("views.py", add get_or_create)'],
 ["ob","Observation","edit applied, 1 file changed"],
 ["th","Thought","I should confirm the tests still pass."],
 ["ac","Action","run_tests()"],
 ["ob","Observation","FAILED test_double_enroll: 2 rows, expected 1"],
 ["th","Thought","The check runs, but two requests can still pass it at the same time."],
 ["ac","Action",'edit_file("views.py", add unique constraint)'],
 ["ob","Observation","edit applied"],
 ["th","Thought","Re-run."],
 ["ac","Action","run_tests()"],
 ["ob","Observation","PASSED, 14 tests"],
 ["th","Thought","Done. I will also tidy the imports while I am here."],
 ["ac","Action",'edit_file("views.py", reorder imports)'],
 ["ob","Observation","edit applied, 1 file changed"]
];
let lpAt=0, lpTimer=null;
function lpRender(){
  $("#lpTrace").innerHTML=STEPS.map((s,i)=>{
    const on=i<lpAt;
    const lost=on && lpAt>12 && i<Math.max(0,(lpAt-12));
    return `<div class="tr ${s[0]} ${on?"on":""} ${lost?"lost":""}">
      <span class="lb">${s[1]}</span><span>${s[2].replace(/</g,"&lt;")}</span></div>`;
  }).join("");
  const lost=Math.max(0,lpAt-12);
  const set=(id,v,hot)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;g.classList.toggle("hot",!!hot)};
  set("#lpIter", Math.ceil(lpAt/3)+" of 6");
  set("#lpCtx", (2+lpAt*1.4).toFixed(1)+"k", lpAt>12);
  set("#lpCost", "₱"+(lpAt*0.9+Math.pow(lpAt,1.6)*0.11).toFixed(2), lpAt>12);
  const v=$("#lpVerdict");
  if(lpAt===0){ v.className="verdict";
    v.innerHTML=`<b>Six rounds, eighteen lines</b>Each round is a Thought, an Action and an Observation. Observation lines are the only ones that do not come from the model.`; return; }
  if(lpAt<9){ v.className="verdict";
    v.innerHTML=`<b>Round ${Math.ceil(lpAt/3)} of 6</b>So far the agent is doing what a careful person would do.`; return; }
  if(lpAt===9){ v.className="verdict ok";
    v.innerHTML=`<b>The test failed, and the agent found out</b>The failing test came from the test runner and contradicted the model's own conclusion. With tools, the model can be wrong <b class="i">and find out</b>.`; return; }
  if(lpAt<16){ v.className="verdict warn";
    v.innerHTML=`<b>The agent corrected itself and the tests pass</b>This looks like success. Keep stepping.`; return; }
  v.className="verdict bad";
  v.innerHTML=`<b>Nobody asked it to reorder the imports</b>The task was finished at step 15, yet the agent kept going and changed a file that was already correct. The greyed lines have left what the model can still see, <b class="i">including your first instruction</b>.`;
}
$("#lpStep").onclick=()=>{ if(lpAt<STEPS.length){lpAt++;lpRender();} };
$("#lpPlay").onclick=()=>{
  clearInterval(lpTimer); lpAt=0; lpRender();
  lpTimer=setInterval(()=>{ if(lpAt<STEPS.length){lpAt++;lpRender();} else clearInterval(lpTimer); }, REDUCED?1:520);
};
$("#lpReset").onclick=()=>{clearInterval(lpTimer);lpAt=0;lpRender()};
lpRender();

