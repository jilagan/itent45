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
 {t:"Seventeen students", s:`Each of these students either finished the course or did not. Each student has two measurements, hours studied and attendance, which are the two things a registrar would have on record.<br><br>All 17 are treated the same for now. Nothing has been fitted and nothing has been set aside.`},
 {t:"Five set aside", s:`Five students are chosen at random and set aside, marked with a dashed ring. From here on, pretend you have never seen them. They are the <b style="color:var(--req)">test set</b>.<br><br>The other twelve are the <b style="color:var(--res)">training set</b>. The model is allowed to look only at these.`},
 {t:"A line fitted to the twelve", s:`The line is fitted using only the training set. The five students set aside took no part.<br><br>Use the two buttons below to choose the kind of line. Start with the straight line, then switch to the bent line, and watch what happens to the score on the twelve.`},
 {t:"Testing on the five", s:`Now the line is checked against the five students it never saw. Their score is the one to report. These five were not available while the line was being placed, so how the line treats them is the best estimate of how it will treat the next student who enrolls.<br><br>Compare the two scores. Then switch between the straight line and the bent line and compare the gaps.`}
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
      <text x="${lx(1.5)}" y="52" fill="var(--res)" font-size="12.5" opacity=".85">predicted pass</text>
      <text x="${lx(1.5)}" y="238" fill="var(--warn)" font-size="12.5" opacity=".85">predicted fail</text>`;
  }
  svg+=`<line x1="52" y1="246" x2="470" y2="246" stroke="var(--line2)"/>
    <line x1="52" y1="34" x2="52" y2="246" stroke="var(--line2)"/>
    <text x="261" y="272" fill="var(--faint)" font-size="13" text-anchor="middle">hours studied</text>
    <text x="17" y="140" fill="var(--faint)" font-size="13" text-anchor="middle" transform="rotate(-90 17 140)">attendance</text>`;

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
        <text x="${x+15}" y="${y-9}" fill="var(--warn)" font-size="13">wrong</text>` : "";
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
  set("#lnGap",   st>=3?(trp-tep)+" points":"\u2014", st>=3&&(trp-tep)>25, false);

  const v=$("#lnVerdict");
  if(st===0){ v.className="verdict";
    v.innerHTML=`<b>All 17 students, and no model yet</b>Circles are students who finished the course and crosses are students who did not. Before fitting anything, some of them will be set aside.`;
  } else if(st===1){ v.className="verdict";
    v.innerHTML=`<b>Twelve to fit on, five to test on</b>The dashed students are set aside for the next step. Nothing about them will influence where the line goes. That is the only reason their score will mean anything later.<br><br>Five of 17 is about 30 percent. A test set is commonly 20 to 30 percent of the data. The exact share matters less than not looking at the test set while fitting.`;
  } else if(st===2){ v.className="verdict "+(trp===100?"warn":"");
    v.innerHTML = LN.mode==="line"
      ? `<b>${trp}% on the twelve, and two are wrong</b>No straight line can catch both of those students. You could stop here, or you could bend the line until it catches every student.<br><br>Try the other option.`
      : `<b>100% on the twelve. Every student is right.</b>The boundary now weaves between the students. Judged only on these twelve, this looks like the better model by a clear margin.<br><br>Now go to step 4 and test it on the five students set aside.`;
  } else {
    const gap=trp-tep;
    v.className="verdict "+(gap>25?"bad":"ok");
    v.innerHTML = LN.mode==="line"
      ? `<b>${trp}% training, ${tep}% test, a gap of ${gap} points</b>The line was not perfect on the twelve, and it did not need to be. The two scores are close. That is the result you want: the line found the general shape, and the shape holds for students it has never met.`
      : `<b>${trp}% training, ${tep}% test, a gap of ${gap} points</b>This is the same model that looked flawless one step ago. Three of the five test students are wrong. Two of those fall inside bends that were carved around single awkward students in the training set, and they get those students' outcomes.<br><br>The bent line memorized the twelve students, and that scored perfectly on the only test it had been given.<br><br>This is <b class="i">overfitting</b>: a model that fits its training examples too closely and does worse on new ones. You could not have seen it from the training score alone. The split made it visible.`;
  }
}
$("#lnNext").onclick=()=>{ if(LN.stage<3){LN.stage++;lnRender();} };
$("#lnBack").onclick=()=>{ if(LN.stage>0){LN.stage--;lnRender();} };
$("#lnPickA").onclick=()=>{LN.mode="line";lnRender()};
$("#lnPickB").onclick=()=>{LN.mode="wig";lnRender()};
lnRender();

