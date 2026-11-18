/* ================= 06 THE LOOP ================= */
const STEPS=[
 ["th","Thought","The enrolment count is wrong. I should look at the view."],
 ["ac","Action",'read_file("views.py")'],
 ["ob","Observation","def enrol(request): … 38 lines returned"],
 ["th","Thought","It calls save() without checking for an existing row."],
 ["ac","Action",'edit_file("views.py", add get_or_create)'],
 ["ob","Observation","edit applied, 1 file changed"],
 ["th","Thought","I should confirm the tests still pass."],
 ["ac","Action","run_tests()"],
 ["ob","Observation","FAILED test_double_enrol — 2 rows, expected 1"],
 ["th","Thought","The check runs, but two requests can still pass it at once."],
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
    v.innerHTML=`<b>Six iterations, eighteen lines</b>Press Step. Watch the <b class="i">Observation</b> lines in particular; they are the only ones that do not come from the model.`; return; }
  if(lpAt<9){ v.className="verdict";
    v.innerHTML=`<b>${Math.ceil(lpAt/3)} iterations in</b>Thought, Action, Observation, repeat. So far it is doing what you would do.`; return; }
  if(lpAt===9){ v.className="verdict ok";
    v.innerHTML=`<b>The test failed, and it found out</b>This is the line that matters. Before tools, that mistake would have propagated in silence and shipped. The failing test came from the world, not from the model, and it contradicted a conclusion the model had already reached.<br><br>It can now be wrong <b class="i">and find out</b>. Keep stepping.`; return; }
  if(lpAt<16){ v.className="verdict warn";
    v.innerHTML=`<b>It corrected itself and the tests pass</b>Which looks like success. Keep going.`; return; }
  v.className="verdict bad";
  v.innerHTML=`<b>Nobody asked it to reorder the imports</b>The task was finished at step 15. It kept going, touched a file that was already correct, and produced a diff you now have to review.<br><br>Look at the two numbers on the right. The context has grown every single step, and the cost per step has grown faster than the step count because attention cost rises with the square of the context. The greyed-out lines at the top are the ones that have fallen out of what it can still see, <b class="i">including the instruction you started with</b>.<br><br>Now the question you cannot answer yet: at which step should you have stepped in? Learning that is most of Module 3.`;
}
$("#lpStep").onclick=()=>{ if(lpAt<STEPS.length){lpAt++;lpRender();} };
$("#lpPlay").onclick=()=>{
  clearInterval(lpTimer); lpAt=0; lpRender();
  lpTimer=setInterval(()=>{ if(lpAt<STEPS.length){lpAt++;lpRender();} else clearInterval(lpTimer); }, REDUCED?1:520);
};
$("#lpReset").onclick=()=>{clearInterval(lpTimer);lpAt=0;lpRender()};
lpRender();

