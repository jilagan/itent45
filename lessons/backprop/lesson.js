/* Lesson backprop. Widget code for the markup in lesson.html. */
/* ================= BACKPROP ================= */
const BPsig=z=>1/(1+Math.exp(-z));
const BPX=[1.0,0.5], BPT=1.0;
const BPW1=[[0.4,-0.3],[0.2,0.6]], BPB1=[0.1,-0.1];
const BPW2=[0.7,-0.5], BPB2=0.2;
const bpH=[0,1].map(i=>BPsig(BPX[0]*BPW1[i][0]+BPX[1]*BPW1[i][1]+BPB1[i]));
const bpO=BPsig(bpH[0]*BPW2[0]+bpH[1]*BPW2[1]+BPB2);
const bpLoss=0.5*(bpO-BPT)**2;
const bpDo=(bpO-BPT)*bpO*(1-bpO);
const bpDh=[0,1].map(i=>bpDo*BPW2[i]*bpH[i]*(1-bpH[i]));
const BPSTEP=[
 {dir:"f", lb:"Forward", txt:`h1 = ${bpH[0].toFixed(3)},  h2 = ${bpH[1].toFixed(3)}`,
  note:`The inputs go in. Each hidden unit adds up its weighted inputs and converts the total to a number between 0 and 1.`},
 {dir:"f", lb:"Forward", txt:`out = ${bpO.toFixed(3)}`,
  note:`The output unit does the same to the two hidden values. The result is the network's prediction.`},
 {dir:"f", lb:"Compare", txt:`target ${BPT}, out ${bpO.toFixed(3)}, loss ${bpLoss.toFixed(4)}`,
  note:`This one number says how wrong the whole network is. Everything after this works backward from it.`},
 {dir:"b", lb:"Blame", txt:`at the output: ${bpDo.toFixed(4)}`,
  note:`This is how much the loss would change if the output moved. Every other slope is built from this one.`},
 {dir:"b", lb:"Slopes", txt:`out&larr;h1: ${bpDo.toFixed(4)} &times; ${bpH[0].toFixed(3)} = ${(bpDo*bpH[0]).toFixed(4)}   &nbsp; out&larr;h2: ${(bpDo*bpH[1]).toFixed(4)}`,
  note:`A weight's slope is the blame at its destination multiplied by the value the weight carried. Both are already on screen, so this takes two multiplications.`},
 {dir:"b", lb:"Pass back", txt:`to h1: ${bpDh[0].toFixed(4)}   &nbsp; to h2: ${bpDh[1].toFixed(4)}`,
  note:`Each hidden unit receives a share of the blame, sized by the weight that connects it forward. The share for h2 has the opposite sign because its weight is negative.`},
 {dir:"b", lb:"Slopes", txt:`h1&larr;x1: ${(bpDh[0]*BPX[0]).toFixed(4)} &nbsp; h1&larr;x2: ${(bpDh[0]*BPX[1]).toFixed(4)} &nbsp; h2&larr;x1: ${(bpDh[1]*BPX[0]).toFixed(4)} &nbsp; h2&larr;x2: ${(bpDh[1]*BPX[1]).toFixed(4)}`,
  note:`The same rule applies one layer further back. Every weight now has a slope.`},
 {dir:"u", lb:"Update", txt:`every weight moves against its own slope`,
  note:`Each weight takes a small step against its own slope. Then the process repeats with the next example.`}
];
let bpAt=0, bpTimer=null;
function bpRender(){
  const W=440,H=190, ix=[62,62], iy=[62,128], hx=[220,220], hy=[62,128], ox=372, oy=95;
  const lit=(from)=>bpAt>from;
  let g=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  const phase = bpAt===0?null : BPSTEP[Math.min(bpAt,BPSTEP.length)-1].dir;
  const edge=(x1,y1,x2,y2,on,back)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
    stroke="${on?(back?"var(--req)":"var(--res)"):"var(--line2)"}" stroke-width="${on?2.4:1}" opacity="${on?1:.45}"/>`;
  for(let i=0;i<2;i++) for(let j=0;j<2;j++)
    g+=edge(ix[j]+11,iy[j],hx[i]-11,hy[i], bpAt>=1 && (phase!=="b"||bpAt>=7), phase==="b"&&bpAt>=7);
  for(let i=0;i<2;i++)
    g+=edge(hx[i]+11,hy[i],ox-11,oy, bpAt>=2, phase==="b"&&bpAt>=5&&bpAt<7);
  const node=(x,y,lb,val,on,col)=>`<circle cx="${x}" cy="${y}" r="19" fill="var(--panel2)"
     stroke="${on?col:"var(--line3)"}" stroke-width="${on?2.2:1.4}"/>
    <text x="${x}" y="${y+4}" text-anchor="middle" font-size="13.5"
     fill="${on?col:"var(--faint)"}">${val}</text>
    <text x="${x}" y="${y-26}" text-anchor="middle" font-size="13.5" fill="var(--faint)">${lb}</text>`;
  for(let j=0;j<2;j++) g+=node(ix[j],iy[j],"x"+(j+1),BPX[j].toFixed(1),bpAt>=1,"var(--res)");
  for(let i=0;i<2;i++) g+=node(hx[i],hy[i],"h"+(i+1),bpAt>=1?bpH[i].toFixed(2):"?",bpAt>=1,
      (phase==="b"&&bpAt>=6)?"var(--req)":"var(--res)");
  g+=node(ox,oy,"out",bpAt>=2?bpO.toFixed(2):"?",bpAt>=2,(phase==="b")?"var(--req)":"var(--res)");
  if(bpAt>=3) g+=`<text x="${ox}" y="${oy+40}" text-anchor="middle" font-size="13.5"
     fill="var(--warn)">target ${BPT}</text>`;
  g+=`<text x="${(ix[0]+hx[0])/2}" y="16" text-anchor="middle" font-size="13.5"
     fill="${phase==="b"?"var(--req)":"var(--faint)"}">${phase==="b"?"&larr; blame flows back":"forward &rarr;"}</text>`;
  $("#bpNet").innerHTML=g+`</svg>`;

  $("#bpTrace").innerHTML=BPSTEP.map((st,i)=>{
    const on=i<bpAt;
    const cls = st.dir==="b" ? "tr ac" : st.dir==="u" ? "tr th" : "tr ob";
    return `<div class="${cls} ${on?"on":""}"><span class="lb">${st.lb}</span><span>${st.txt}</span></div>`;
  }).join("");
  $("#bpNote").innerHTML = bpAt===0
    ? `A network with two inputs, two hidden units and one output. It has six weights, and biases are left out to keep the example small.`
    : BPSTEP[bpAt-1].note;

  const v=$("#bpVerdict");
  if(bpAt===0){ v.className="verdict";
    v.innerHTML=`<b>Six weights, and each one needs a slope</b>Two of them connect to the output directly and four do not. Step through and watch where their numbers come from.`; }
  else if(bpAt<4){ v.className="verdict";
    v.innerHTML=`<b>Still going forward</b>The network is making a prediction and finding out that it was wrong by ${Math.abs(bpO-BPT).toFixed(3)}.`; }
  else if(bpAt===4){ v.className="verdict warn";
    v.innerHTML=`<b>One slope, computed from the loss</b>This is the only number that comes straight from how wrong the answer was. Every other slope is built from it.`; }
  else if(bpAt<BPSTEP.length){ v.className="verdict";
    v.innerHTML=`<b>Blame moving backward</b>Each number in the last line is the one above it multiplied by something already known. No part of the network is run again.`; }
  else { v.className="verdict ok";
    v.innerHTML=`<b>Six slopes, one pass, nothing computed twice</b>Every weight now knows which way to move, including the four that do not connect to the output directly. That low cost makes training large networks possible.`; }
}
$("#bpStep").onclick=()=>{ if(bpAt<BPSTEP.length){bpAt++;bpRender();} };
$("#bpAll").onclick=()=>{ clearInterval(bpTimer); bpAt=0; bpRender();
  bpTimer=setInterval(()=>{ if(bpAt<BPSTEP.length){bpAt++;bpRender();} else clearInterval(bpTimer); }, REDUCED?0:620); };
$("#bpReset").onclick=()=>{ clearInterval(bpTimer); bpAt=0; bpRender(); };
bpRender();
