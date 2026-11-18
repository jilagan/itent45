/* ================= 01 LEARNING A BOUNDARY ================= */
/* Seventeen students. Five are hidden before anything is fitted, and the curve
   below is both the picture and the classifier, so nothing here is illustrative. */
const STUD=[[4,.45,0],[6,.30,0],[9,.55,0],[11,.40,0],[7,.70,0],[20,.70,0],
            [16,.75,1],[19,.60,1],[22,.85,1],[25,.65,1],[18,.90,1],[12,.30,1]];
const HELD=[[21,.68,1],[13,.32,0],[8,.75,1],[24,.60,1],[17,.50,1]];
const CTRL=[[0,.75],[4,.78],[7,.85],[9,.72],[11,.60],[11.8,.34],[12.2,.22],
            [16,.30],[19,.45],[20,.78],[21,.72],[22,.40],[25,.35],[30,.32]];
function wigAt(h){
  for(let i=0;i<CTRL.length-1;i++){
    const [x0,y0]=CTRL[i],[x1,y1]=CTRL[i+1];
    if(h>=x0 && h<=x1) return x1>x0 ? y0+(y1-y0)*((h-x0)/(x1-x0)) : y0;
  }
  return CTRL[CTRL.length-1][1];
}
const straightAt=h=>(0.98-0.055*h)/0.55;
const LN={stage:0, mode:"line"};
const lx=h=>52+(h/30)*418, ly=a=>246-(a*208);
const straightSide=(h,a)=>a>straightAt(h);
const wigglySide=(h,a)=>a>wigAt(h);
const LNSTAGE=[
 {t:"Seventeen students", s:`Every one of them finished the course, or did not. Two axes, because those are the two things a registrar actually has: hours studied and attendance.<br><br>Right now they are all the same to you. Nothing has been fitted and nothing has been hidden.`},
 {t:"Five put away, unlooked at", s:`Chosen at random and set aside, marked with a dashed ring. From here on, pretend you have never seen them. They are your <b style="color:var(--req)">test set</b>.<br><br>The other twelve are your <b style="color:var(--res)">training set</b>, and they are all the model is allowed to look at.`},
 {t:"A line fitted to the twelve", s:`Fitted using only the training set. The five hidden ones took no part in it.<br><br>You have two options in the panel below. Start with the straight line, then bend it, and watch what happens to the score on the twelve.`},
 {t:"Now look at the five", s:`The moment of truth, and the only number worth quoting. These five were never available while the line was being placed, so how the line treats them is the closest thing you have to how it will treat the next student who walks in.<br><br>Compare the two scores. Then switch between the straight line and the bent one and compare the gaps.`}
];
function lnRender(){
  const st=LN.stage;
  const f = LN.mode==="line" ? straightSide : wigglySide;
  const at = LN.mode==="line" ? straightAt : wigAt;
  $("#lnStage").innerHTML=LNSTAGE.map((x,i)=>
    `<button data-st="${i}" aria-pressed="${i===st}">${i+1}. ${x.t}</button>`).join("");
  $$("#lnStage button").forEach(el=>el.onclick=()=>{LN.stage=+el.dataset.st;lnRender()});
  $("#lnSideT").textContent=LNSTAGE[st].t;
  $("#lnSide").innerHTML=LNSTAGE[st].s;
  $("#lnPickWrap").style.display = st>=2 ? "" : "none";
  $("#lnPickA").setAttribute("aria-pressed", LN.mode==="line");
  $("#lnPickB").setAttribute("aria-pressed", LN.mode==="wig");
  $("#lnNext").style.visibility = st<3 ? "visible" : "hidden";
  $("#lnBack").style.visibility = st>0 ? "visible" : "hidden";

  let svg=`<svg viewBox="0 0 500 286" xmlns="http://www.w3.org/2000/svg">`;
  if(st>=2){
    let path="";
    for(let h=0;h<=30;h+=0.25){
      const y=Math.max(0,Math.min(1,at(h)));
      path += (h===0?"M":"L")+lx(h).toFixed(1)+","+ly(y).toFixed(1)+" ";
    }
    svg+=`<clipPath id="pl"><rect x="52" y="34" width="418" height="212"/></clipPath>
      <g clip-path="url(#pl)">
        <path d="${path} L${lx(30)},${ly(0)} L${lx(0)},${ly(0)} Z" fill="var(--warn)" opacity=".07"/>
        <path d="${path}" fill="none" stroke="var(--req)" stroke-width="2.6" stroke-linejoin="round"/>
      </g>
      <text x="${lx(1.5)}" y="52" fill="var(--res)" font-family="monospace" font-size="10" opacity=".75">predicted pass</text>
      <text x="${lx(1.5)}" y="238" fill="var(--warn)" font-family="monospace" font-size="10" opacity=".75">predicted fail</text>`;
  }
  svg+=`<line x1="52" y1="246" x2="470" y2="246" stroke="var(--line2)"/>
    <line x1="52" y1="34" x2="52" y2="246" stroke="var(--line2)"/>
    <text x="261" y="272" fill="var(--faint)" font-family="monospace" font-size="10.5" text-anchor="middle">hours studied</text>
    <text x="17" y="140" fill="var(--faint)" font-family="monospace" font-size="10.5" text-anchor="middle" transform="rotate(-90 17 140)">attendance</text>`;

  const mark=(sPt,held)=>{
    const [h,a,pass]=sPt, x=lx(h), y=ly(a);
    const hiddenNow = held && st>=1;
    const scored = st>=2 && (!held || st>=3);
    const wrong = scored && f(h,a)!==!!pass;
    const col = pass?"var(--res)":"var(--warn)";
    const dim = (held && st>=1 && st<3) ? .45 : 1;
    const ring = hiddenNow ? `<circle cx="${x}" cy="${y}" r="10.5" fill="none" stroke="${st>=3?"var(--req)":"var(--dim)"}"
        stroke-width="${st>=3?1.6:1}" stroke-dasharray="2.5 2.5" opacity="${dim}"/>` : "";
    const bad = wrong ? `<circle cx="${x}" cy="${y}" r="13" fill="none" stroke="var(--warn)" stroke-width="2"/>
        <text x="${x+15}" y="${y-9}" fill="var(--warn)" font-family="monospace" font-size="9.5">wrong</text>` : "";
    const g = pass
      ? `<circle cx="${x}" cy="${y}" r="6" fill="${held?"var(--bg)":"none"}" stroke="${col}" stroke-width="2.2" opacity="${dim}"/>`
      : `<path d="M${x-5},${y-5} L${x+5},${y+5} M${x+5},${y-5} L${x-5},${y+5}" stroke="${col}" stroke-width="2.4" opacity="${dim}"/>`;
    return ring+bad+g;
  };
  STUD.forEach(x=>svg+=mark(x,false));
  HELD.forEach(x=>svg+=mark(x,true));
  $("#lnPlot").innerHTML=svg+`</svg>`;

  const tr=STUD.filter(x=>f(x[0],x[1])===!!x[2]).length;
  const te=HELD.filter(x=>f(x[0],x[1])===!!x[2]).length;
  const trp=Math.round(tr/STUD.length*100), tep=Math.round(te/HELD.length*100);
  const set=(id,v,hot,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot);g.classList.toggle("good",!!good)};
  set("#lnTrain", st>=2?trp+"%":"\u2014", false, st>=2&&trp===100);
  set("#lnTest",  st>=3?tep+"%":"\u2014", st>=3&&tep<60, st>=3&&tep>=80);
  set("#lnGap",   st>=3?(trp-tep)+" pts":"\u2014", st>=3&&(trp-tep)>25, false);

  const v=$("#lnVerdict");
  if(st===0){ v.className="verdict";
    v.innerHTML=`<b>All seventeen, and no model yet</b>Circles finished the course, crosses did not. Before fitting anything, take some of them away from yourself.`;
  } else if(st===1){ v.className="verdict";
    v.innerHTML=`<b>Twelve to fit on, five to be honest with</b>The dashed ones are gone as far as the next step is concerned. Nothing about them will influence where the line goes, which is the only reason their score will mean anything later.<br><br>Five out of seventeen is roughly the usual proportion. The exact number matters less than the discipline of not peeking.`;
  } else if(st===2){ v.className="verdict "+(trp===100?"warn":"");
    v.innerHTML = LN.mode==="line"
      ? `<b>${trp}% on the twelve, and two are wrong</b>One straight line, and no straight line will catch both of those. You could stop here, or you could bend the line until it catches everything.<br><br>Try the other option.`
      : `<b>100%. Every one of the twelve.</b>The boundary now weaves between them. On the only evidence available at this stage, this is the better model by a clear margin.<br><br>Now go to step 4 and look at the five you hid.`;
  } else {
    const gap=trp-tep;
    v.className="verdict "+(gap>25?"bad":"ok");
    v.innerHTML = LN.mode==="line"
      ? `<b>${trp}% training, ${tep}% test, a gap of ${gap}</b>It was never perfect on the twelve and did not need to be. The two scores are close, which is what you actually wanted: the line found the general shape, and that shape holds for people it has never met.`
      : `<b>${trp}% training, ${tep}% test, a gap of ${gap}</b>The same model that looked flawless one step ago. Look at where the held-back five landed: two of them fell inside a bend that was carved around a single awkward student from the training set, and inherited that student's outcome.<br><br>It never learned that studying helps. It learned the twelve people, and that scored perfectly on the only test it had been given.<br><br>This is <b class="i">overfitting</b>, and note that you could not have detected it from the training score alone. The split is what made it visible.`;
  }
}
$("#lnNext").onclick=()=>{ if(LN.stage<3){LN.stage++;lnRender();} };
$("#lnBack").onclick=()=>{ if(LN.stage>0){LN.stage--;lnRender();} };
$("#lnPickA").onclick=()=>{LN.mode="line";lnRender()};
$("#lnPickB").onclick=()=>{LN.mode="wig";lnRender()};
lnRender();

