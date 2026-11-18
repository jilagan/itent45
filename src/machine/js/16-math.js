/* ================= MATH ================= */
const MT={ang:40, w:0, p:40};
/* --- 1. dot product --- */
function mtDotRender(){
  const A=[4,0], L=3.2, th=MT.ang*Math.PI/180;
  const B=[L*Math.cos(th), L*Math.sin(th)];
  const dot=A[0]*B[0]+A[1]*B[1];
  const ox=52, oy=170, S=32;
  const X=v=>ox+v*S, Y=v=>oy-v*S;
  let g=`<svg viewBox="0 0 440 210" xmlns="http://www.w3.org/2000/svg">
    <line x1="${ox-30}" y1="${oy}" x2="430" y2="${oy}" stroke="var(--line2)"/>
    <line x1="${ox}" y1="20" x2="${ox}" y2="200" stroke="var(--line2)"/>`;
  // the shadow b casts on a, which is what the number measures
  if(B[0]>0) g+=`<line x1="${ox}" y1="${oy}" x2="${X(B[0])}" y2="${oy}"
      stroke="var(--req)" stroke-width="7" opacity=".16"/>`;
  g+=`<line x1="${ox}" y1="${oy}" x2="${X(A[0])}" y2="${Y(A[1])}" stroke="var(--res)" stroke-width="2.8"/>
      <text x="${X(A[0])+7}" y="${Y(A[1])+4}" font-family="monospace" font-size="13" fill="var(--res)" font-weight="600">a</text>
      <line x1="${ox}" y1="${oy}" x2="${X(B[0])}" y2="${Y(B[1])}" stroke="var(--req)" stroke-width="2.8"/>
      <text x="${X(B[0])+7}" y="${Y(B[1])-4}" font-family="monospace" font-size="13" fill="var(--req)" font-weight="600">b</text>
      <line x1="${X(B[0])}" y1="${Y(B[1])}" x2="${X(B[0])}" y2="${oy}" stroke="var(--req)" stroke-width="1" stroke-dasharray="3 3" opacity=".6"/>`;
  $("#mtDot").innerHTML=g+`</svg>`;
  $("#mtDotSum").innerHTML=
    `a &middot; b  =  4 &times; ${B[0].toFixed(2)}  +  0 &times; ${B[1].toFixed(2)}  =  <span class="kw">${dot.toFixed(2)}</span>`;
  const set=(id,v,hot,good)=>{const g2=$(id);g2.querySelector(".gv").firstChild.nodeValue=v;
    g2.classList.toggle("hot",!!hot);g2.classList.toggle("good",!!good)};
  set("#mtDotVal", dot.toFixed(2), dot<-0.01, dot>8);
  $("#vMtAng").textContent=MT.ang+"\u00b0";
  $("#mtDotNote").innerHTML = MT.ang<12
    ? `The arrows point the same way, so the number is at its largest.`
    : MT.ang<85 ? `The arrows are partly aligned. Only the part of <b>b</b> that lies along <b>a</b> counts, shown by the shaded stretch.`
    : MT.ang<95 ? `At a right angle the number is <b style="color:var(--ink)">zero</b>, because no part of <b>b</b> lies along <b>a</b>.`
    : `Past a right angle the number is negative, which means the arrows point apart.`;
}
/* --- 2. slope --- */
function mtSlopeRender(){
  const w=MT.w/10, Lf=x=>(x-3)*(x-3)+1, dL=x=>2*(x-3);
  const ox=54, oy=196, sx=52, sy=8.6;
  const X=v=>ox+(v+2)*sx, Y=v=>oy-(v-1)*sy;
  let path="";
  for(let x=-2;x<=8;x+=0.1) path+=(x===-2?"M":"L")+X(x).toFixed(1)+","+Y(Lf(x)).toFixed(1)+" ";
  const s=dL(w), px=X(w), py=Y(Lf(w)), t=2.1;
  let g=`<svg viewBox="0 0 470 215" xmlns="http://www.w3.org/2000/svg">
    <clipPath id="mtc"><rect x="0" y="8" width="470" height="190"/></clipPath>
    <line x1="${ox}" y1="${oy}" x2="462" y2="${oy}" stroke="var(--line2)"/>
    <g clip-path="url(#mtc)"><path d="${path}" fill="none" stroke="var(--res)" stroke-width="2.4"/>
    <line x1="${X(w-t)}" y1="${Y(Lf(w)-s*t)}" x2="${X(w+t)}" y2="${Y(Lf(w)+s*t)}"
      stroke="var(--req)" stroke-width="2.2" stroke-dasharray="${Math.abs(s)<0.2?"none":"5 4"}"/>
    <circle cx="${px}" cy="${py}" r="6" fill="var(--req)"/></g>
    <text x="${X(3)}" y="${Y(1)-13}" font-size="12.5" fill="var(--res)" text-anchor="middle">Lowest point</text>
    <text x="462" y="18" font-size="12.5" fill="var(--faint)" text-anchor="end">How wrong the model is</text>
    <text x="462" y="${oy+15}" font-size="12.5" fill="var(--faint)" text-anchor="end">The weight &rarr;</text>`;
  $("#mtSlope").innerHTML=g+`</svg>`;
  const set=(id,v,hot,good)=>{const g2=$(id);g2.querySelector(".gv").firstChild.nodeValue=v;
    g2.classList.toggle("hot",!!hot);g2.classList.toggle("good",!!good)};
  set("#mtW", w.toFixed(1));
  set("#mtL", Lf(w).toFixed(1), Lf(w)>8, Lf(w)<1.3);
  set("#mtS", (s>=0?"+":"")+s.toFixed(1), false, Math.abs(s)<0.25);
  $("#vMtW").textContent=w.toFixed(1);
  const v=$("#mtSlopeV");
  if(Math.abs(s)<0.25){ v.className="verdict ok";
    v.innerHTML=`<b>The slope is zero, so the line is flat</b>There is no direction to move, so training stops here at the lowest point.`;
  } else { v.className="verdict";
    v.innerHTML=`<b>The slope is ${(s>=0?"+":"")+s.toFixed(1)}, so move ${s>0?"left":"right"}</b>The curve ${s>0?"rises":"falls"} as you go right, so moving ${s>0?"left":"right"} lowers how wrong the model is.`;
  }
}
/* --- 3. distribution and loss --- */
function mtDistRender(){
  const p=MT.p/100, rest=[["the",.35],["a",.25],["located",.22],["home",.18]];
  const rs=rest.reduce((a,b)=>a+b[1],0);
  const rows=[["Paris",p,true]].concat(rest.map(([w,v])=>[w,(1-p)*v/rs,false]));
  const mx=Math.max(...rows.map(r=>r[1]));
  $("#mtDist").innerHTML=rows.map(([w,v,truth])=>
    `<div class="pr"><span class="tok" style="color:${truth?"var(--res)":"var(--faint)"};font-weight:${truth?600:400}">${w}${truth?" \u2190 true":""}</span>
      <div class="lane"><div class="bar" style="width:${(v/mx*100).toFixed(0)}%;background:${truth?"var(--res)":"var(--line3)"}"></div></div>
      <span class="pc">${(v*100).toFixed(0)}%</span></div>`).join("");
  const loss=-Math.log(p);
  const set=(id,v,hot,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot);g.classList.toggle("good",!!good)};
  const total=Math.round(rows.reduce((a,r)=>a+r[1],0)*100);
  set("#mtSum",total+"%",false,true);
  set("#mtLoss", loss.toFixed(2), loss>1.5, loss<0.4);
  $("#vMtP").textContent=MT.p+"%";
  const v=$("#mtDistV");
  v.className="verdict ok";
  v.innerHTML=`<b>Paris has ${MT.p}%, and the other words share ${100-MT.p}%</b>The total stays at 100%, so more probability for Paris means less for the rest.`;
  const lv=$("#mtLossV");
  if(p>=.8){ lv.className="verdict ok";
    lv.innerHTML=`<b>Loss ${loss.toFixed(2)}, close to the minimum</b>Most of the probability is on the right answer. The minimum loss is zero, which needs 100% on the right answer.`;
  } else if(p<=.15){ lv.className="verdict bad";
    lv.innerHTML=`<b>Loss ${loss.toFixed(2)}, and rising fast</b>Almost no probability is on the right answer, so a confident wrong answer costs the model a lot during training.`;
  } else { lv.className="verdict warn";
    lv.innerHTML=`<b>Loss ${loss.toFixed(2)}</b>Move the slider and watch how the loss changes.`;
  }
}
$("#sMtAng").oninput=e=>{MT.ang=+e.target.value;mtDotRender()};
$("#sMtW").oninput=e=>{MT.w=+e.target.value;mtSlopeRender()};
$("#sMtP").oninput=e=>{MT.p=+e.target.value;mtDistRender()};
mtDotRender(); mtSlopeRender(); mtDistRender();

