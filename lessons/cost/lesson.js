/* Lesson cost. Widget code for the markup in lesson.html. */
/* ================= 14 CLOUD ECONOMICS ================= */
const COST={capex:true, cap:120};
// a year of demand: quiet baseline with two enrolment spikes and a graduation bump
function demandAt(t){
  const base=28+10*Math.sin(t*Math.PI*2);
  const spike=(c,w,h)=>h*Math.exp(-Math.pow((t-c)/w,2));
  return base + spike(.09,.012,240) + spike(.56,.012,225) + spike(.78,.03,70);
}
const SAMPLES=Array.from({length:180},(_,i)=>demandAt(i/179));
function costModel(){
  const peak=Math.max(...SAMPLES);
  let served=0, waste=0, lost=0, capSum=0;
  const capAt=SAMPLES.map((d,i)=>{
    if(COST.capex) return COST.cap;
    // elastic: follows demand with a lag, plus a little headroom
    const prev=i?SAMPLES[i-1]:d;
    return Math.max(30, Math.max(d,prev)*1.15);
  });
  SAMPLES.forEach((d,i)=>{
    const c=capAt[i];
    served+=Math.min(d,c); waste+=Math.max(0,c-d); lost+=Math.max(0,d-c); capSum+=c;
  });
  return {peak, served, waste, lost, capAt, capSum,
          spend: COST.capex ? COST.cap*SAMPLES.length : capSum};
}
function elasticSpend(){
  const keep=COST.capex; COST.capex=false;
  const e=costModel().spend; COST.capex=keep; return e;
}
function renderCost(){
  const m=costModel(), W=720,H=230, pad=6;
  const base=elasticSpend();
  const maxY=Math.max(m.peak, COST.cap)*1.08;
  const x=i=>pad+i/(SAMPLES.length-1)*(W-2*pad);
  const y=v=>H-pad-(v/maxY)*(H-2*pad);
  const dPath="M"+SAMPLES.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" L");
  const cPath="M"+m.capAt.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" L");
  const wasteArea="M"+m.capAt.map((c,i)=>`${x(i).toFixed(1)},${y(Math.max(c,SAMPLES[i])).toFixed(1)}`).join(" L")+
    " L"+[...SAMPLES].map((d,i)=>`${x(SAMPLES.length-1-i).toFixed(1)},${y(Math.max(SAMPLES[SAMPLES.length-1-i],0)).toFixed(1)}`).join(" L")+" Z";
  const lostArea="M"+SAMPLES.map((d,i)=>`${x(i).toFixed(1)},${y(Math.max(d,m.capAt[i])).toFixed(1)}`).join(" L")+
    " L"+m.capAt.map((c,i)=>`${x(SAMPLES.length-1-i).toFixed(1)},${y(m.capAt[SAMPLES.length-1-i]).toFixed(1)}`).join(" L")+" Z";
  $("#curveSvg").innerHTML=`
    <path d="${wasteArea}" fill="rgba(63,208,201,.16)"/>
    <path d="${lostArea}" fill="rgba(255,95,95,.22)"/>
    <path d="${dPath}" fill="none" stroke="var(--dim)" stroke-width="1.6"/>
    <path d="${cPath}" fill="none" stroke="${COST.capex?"var(--req)":"var(--res)"}" stroke-width="2" stroke-dasharray="${COST.capex?"":"5 3"}"/>
    <text x="96" y="20" fill="var(--dim)" font-size="16">demand</text>
    <text x="${W-8}" y="20" fill="${COST.capex?"var(--req)":"var(--res)"}" font-size="16" text-anchor="end">${COST.capex?"capacity you bought":"capacity you rented"}</text>
    <text x="8" y="${H-6}" fill="var(--dim)" font-size="16">Aug</text>
    <text x="${W/2}" y="${H-6}" fill="var(--dim)" font-size="16" text-anchor="middle">enlistment</text>
    <text x="${W-8}" y="${H-6}" fill="var(--dim)" font-size="16" text-anchor="end">Jul</text>`;

  const set=(id,v,hot,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot);g.classList.toggle("good",!!good)};
  const pct=v=>Math.round(v/m.capSum*100)+"%";
  const lostPct=m.lost/(m.served+m.lost);
  const mult=m.spend/base;
  set("#cgSpend",mult.toFixed(1)+"\u00d7", mult>2, mult<=1.05);
  set("#cgWaste",pct(m.waste), m.waste/m.capSum>.5, m.waste/m.capSum<.25);
  set("#cgLost", (lostPct*100).toFixed(lostPct<.01&&lostPct>0?1:0)+"%", lostPct>=.005, lostPct<.005);

  const v=$("#costVerdict");
  if(!COST.capex){
    v.className="verdict ok";
    v.innerHTML=`<b>Capacity follows demand</b>You pay for roughly what you used, and the enlistment spike is served without owning hardware for it. The cost is a meter that runs every hour.`;
  } else if(lostPct>=.005 && m.waste/m.capSum>.5){
    v.className="verdict bad";
    v.innerHTML=`<b>Wrong in both directions at once</b>${pct(m.waste)} of the capacity you bought sat idle across the year, and you still turned people away on enlistment morning.`;
  } else if(lostPct>=.005){
    v.className="verdict bad";
    v.innerHTML=`<b>Too little capacity</b>You turned away demand at the peak, which means students refreshing the enlistment system at 8:00. Raise the capacity to the peak and see what that costs for the rest of the year.`;
  } else {
    v.className="verdict warn";
    v.innerHTML=`<b>Sized for the peak, paid for all year</b>Nobody is turned away, but ${pct(m.waste)} of the capacity is idle and the year costs ${mult.toFixed(1)}× what renting would cost. The servers are busy for about twenty minutes at each enlistment period.`;
  }
}
$("#sCap").oninput=e=>{COST.cap=+e.target.value;$("#vCap").textContent=COST.cap+" units";renderCost()};
function setBuy(capex){
  COST.capex=capex;
  $("#tgCapex").setAttribute("aria-pressed",capex);
  $("#tgOpex").setAttribute("aria-pressed",!capex);
  $("#sCap").disabled=!capex;
  $("#sCap").style.opacity=capex?1:.35;
  renderCost();
}
$("#tgCapex").onclick=()=>setBuy(true);
$("#tgOpex").onclick=()=>setBuy(false);
$("#sCap").dispatchEvent(new Event("input"));

/* called by the platform after a theme change */
PAGE_HOOKS.redraw=()=>{ try{ renderCost(); }catch(e){} };
