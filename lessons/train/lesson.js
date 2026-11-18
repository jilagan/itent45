/* Lesson train. Widget code for the markup in lesson.html. Shared code it needs: lib/students.js. */
/* ================= 02 TRAINING ================= */
const TRD=STUD.map(([h,a,y])=>[h/30,a,y]);
const LRS=[[0.5,"crawling"],[6,"about right"],[40,"too large"],[220,"far too large"]];
const TR={w1:-1.4,w2:1.1,b:0.2,lr:1,step:0,hist:[],timer:null};
const sig=z=>1/(1+Math.exp(-Math.max(-30,Math.min(30,z))));
function trLoss(){
  let t=0;
  for(const [x1,x2,y] of TRD){
    const p=Math.min(1-1e-9,Math.max(1e-9,sig(TR.w1*x1+TR.w2*x2+TR.b)));
    t+= -(y*Math.log(p)+(1-y)*Math.log(1-p));
  }
  return t/TRD.length;
}
function trStep(){
  let g1=0,g2=0,gb=0;
  for(const [x1,x2,y] of TRD){
    const d=sig(TR.w1*x1+TR.w2*x2+TR.b)-y;
    g1+=d*x1; g2+=d*x2; gb+=d;
  }
  const n=TRD.length, lr=LRS[TR.lr][0];
  TR.w1-=lr*g1/n; TR.w2-=lr*g2/n; TR.b-=lr*gb/n;
  TR.step++; TR.hist.push(trLoss());
  if(TR.hist.length>220) TR.hist.shift();
}
function trRender(){
  const tx=h=>54+h*416, ty=a=>246-a*212;
  let svg=`<svg viewBox="0 0 500 286" xmlns="http://www.w3.org/2000/svg">
    <clipPath id="tp"><rect x="54" y="28" width="416" height="218"/></clipPath><g clip-path="url(#tp)">`;
  // the line where the model is undecided: w1*x1 + w2*x2 + b = 0
  const yAt=x1 => -(TR.w1*x1+TR.b)/(TR.w2||1e-6);
  svg+=`<path d="M${tx(0)},${ty(yAt(0))} L${tx(1)},${ty(yAt(1))}" stroke="var(--req)" stroke-width="2.6"/>`;
  svg+=`</g>
    <line x1="54" y1="246" x2="470" y2="246" stroke="var(--line2)"/>
    <line x1="54" y1="28" x2="54" y2="246" stroke="var(--line2)"/>
    <text x="262" y="272" fill="var(--faint)" font-size="13" text-anchor="middle">hours studied</text>
    <text x="18" y="138" fill="var(--faint)" font-size="13" text-anchor="middle" transform="rotate(-90 18 138)">attendance</text>`;
  let ok=0;
  for(const [x1,x2,y] of TRD){
    const pred=sig(TR.w1*x1+TR.w2*x2+TR.b)>0.5, right=pred===!!y; if(right) ok++;
    const X=tx(x1), Y=ty(x2), col=y?"var(--res)":"var(--warn)";
    svg += y ? `<circle cx="${X}" cy="${Y}" r="6" fill="none" stroke="${col}" stroke-width="2.2"/>`
             : `<path d="M${X-5},${Y-5} L${X+5},${Y+5} M${X+5},${Y-5} L${X-5},${Y+5}" stroke="${col}" stroke-width="2.3"/>`;
    if(!right) svg+=`<circle cx="${X}" cy="${Y}" r="11.5" fill="none" stroke="var(--warn)" stroke-width="1.7"/>`;
  }
  $("#trPlot").innerHTML=svg+`</svg>`;

  const L=trLoss();
  const set=(id,v,hot,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot);g.classList.toggle("good",!!good)};
  set("#trLoss", L.toFixed(3), L>0.7, L<0.45);
  set("#trAcc", ok+" of "+TRD.length, false, ok===TRD.length);
  set("#trStep", TR.step);

  // loss over time
  const h=TR.hist;
  if(h.length>1){
    const mx=Math.max(...h), mn=Math.min(...h), rng=(mx-mn)||1;
    const pts=h.map((v,i)=>`${(i/(h.length-1)*220).toFixed(1)},${(46-(v-mn)/rng*40).toFixed(1)}`).join(" ");
    const up=h[h.length-1]>h[0];
    $("#trCurve").innerHTML=`<span class="c">Loss over ${h.length} steps</span>\n`+
      `<svg viewBox="0 0 224 52" style="width:100%;height:auto;display:block;margin-top:4px">
         <polyline points="${pts}" fill="none" stroke="${up?"var(--warn)":"var(--res)"}" stroke-width="1.6"/>
       </svg>`;
  } else $("#trCurve").innerHTML=`<span class="c">Press Step to start.</span>`;

  $("#vLr").textContent=LRS[TR.lr][0];
  $("#trNote").innerHTML={
    0:`Each step moves the line only a little. It goes the right way but needs thousands of steps, which wastes computing.`,
    1:`Steady progress. The loss falls on every step and the line settles where it should.`,
    2:`The loss falls, overshoots its lowest value and starts bouncing up and down. The line jitters and does not settle.`,
    3:`Each step leaves the loss larger than before. The loss climbs, and waiting does not fix it.`
  }[TR.lr];

  const v=$("#trVerdict");
  if(TR.step===0){
    v.className="verdict";
    v.innerHTML=`<b>A line placed at random</b>Loss ${L.toFixed(3)}, with ${ok} of ${TRD.length} right, which is about what guessing gets you. Press <em>Step</em> a few times, or <em>Run 200</em>.`;
    return;
  }
  const rising = h.length>6 && h[h.length-1] > h[Math.max(0,h.length-6)];
  if(TR.lr===3 || (rising && TR.lr===2)){
    v.className="verdict bad";
    v.innerHTML=`<b>The loss is going up</b>The steps are too large, so each one overshoots the lowest loss and leaves a worse line than before. Nothing raises an error, so you find out by watching the loss.`;
  } else if(L<0.45){
    v.className="verdict ok";
    v.innerHTML=`<b>Loss ${L.toFixed(3)} after ${TR.step} step${TR.step===1?"":"s"}, ${ok} of ${TRD.length} correct</b>The line stopped moving because the slope of the loss flattened out. No straight line can catch the two students it still gets wrong.`;
  } else {
    v.className="verdict warn";
    v.innerHTML=`<b>Loss ${L.toFixed(3)}, ${ok} of ${TRD.length} correct after ${TR.step} step${TR.step===1?"":"s"}</b>The loss is still falling. Keep pressing <em>Step</em>, or press <em>Run 200</em>.`;
  }
}
$("#trStepBtn").onclick=()=>{trStep();trRender()};
$("#trRun").onclick=()=>{
  clearInterval(TR.timer); let n=0;
  TR.timer=setInterval(()=>{ trStep(); if(++n%4===0) trRender(); if(n>=200){clearInterval(TR.timer);trRender();} }, REDUCED?0:14);
};
$("#trReset").onclick=()=>{clearInterval(TR.timer);
  Object.assign(TR,{w1:-1.4,w2:1.1,b:0.2,step:0,hist:[]}); trRender()};
$("#sLr").oninput=e=>{TR.lr=+e.target.value;trRender()};
trRender();

/* called by the platform after a theme change */
PAGE_HOOKS.redraw=()=>{ try{ trRender(); }catch(e){} };
