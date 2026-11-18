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
    <text x="8" y="14" fill="var(--faint)" font-family="monospace" font-size="9">demand</text>
    <text x="${W-8}" y="14" fill="${COST.capex?"var(--req)":"var(--res)"}" font-family="monospace" font-size="9" text-anchor="end">${COST.capex?"capacity you bought":"capacity you rented"}</text>
    <text x="8" y="${H-4}" fill="var(--faint)" font-family="monospace" font-size="9">Aug</text>
    <text x="${W/2}" y="${H-4}" fill="var(--faint)" font-family="monospace" font-size="9" text-anchor="middle">enlistment</text>
    <text x="${W-8}" y="${H-4}" fill="var(--faint)" font-family="monospace" font-size="9" text-anchor="end">Jul</text>`;

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
    v.innerHTML=`<b>Capacity follows the shape</b>You pay for roughly what you used, waste stays low, and the enlistment spike is served without owning hardware for it in October. The catch is on the meter: this is billed every hour forever, and nobody ever depreciates it away.`;
  } else if(lostPct>=.005 && m.waste/m.capSum>.5){
    v.className="verdict bad";
    v.innerHTML=`<b>Wrong in both directions at once</b>${pct(m.waste)} of what you bought sat idle across the year, <em>and</em> you still turned people away on enlistment morning. The line is fine. This is the shape of the problem. A flat line cannot fit a spiky curve.`;
  } else if(lostPct>=.005){
    v.className="verdict bad";
    v.innerHTML=`<b>Under-provisioned</b>You turned away demand at the peak. Every one of those is a student refreshing the enlistment system at 8:00. Buy for the peak instead and look at what the line costs you the rest of the year.`;
  } else {
    v.className="verdict warn";
    v.innerHTML=`<b>Sized for the peak, and paying for it all year</b>Nobody is turned away, ${pct(m.waste)} of the capacity is idle, and the year costs ${mult.toFixed(1)}× what renting the same shape would. Those servers exist for twenty minutes in August and twenty in January. This is the on-premise era, drawn.`;
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

