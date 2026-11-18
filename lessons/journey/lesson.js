/* Lesson journey. Widget code for the markup in lesson.html. */
/* ================= 02 JOURNEY ================= */
const PHASES=[
  {k:"dns",   n:"DNS lookup",        rtt:1, fixed:4,   dir:"both", lbl:"Look up the address of api.example.com"},
  {k:"tcp",   n:"TCP handshake",     rtt:1, fixed:1,   dir:"both", lbl:"Open a connection (SYN, SYN-ACK, ACK)"},
  {k:"tls",   n:"TLS handshake",     rtt:2, fixed:6,   dir:"both", lbl:"Agree on encryption keys"},
  {k:"send",  n:"Request sent",      rtt:.5,fixed:1,   dir:"req",  lbl:"GET /courses"},
  {k:"think", n:"Server handler",    rtt:0, fixed:40,  dir:"none", lbl:"Your code runs and queries the database"},
  {k:"first", n:"First byte back",   rtt:.5,fixed:1,   dir:"res",  lbl:"200 OK"}
];
let rttMs=5, jIdx=-1, jTimer=null;

function phaseMs(p){ return p.rtt*rttMs*2 + p.fixed; }
function renderFall(){
  const times=PHASES.map(phaseMs), max=Math.max(...times), tot=times.reduce((a,b)=>a+b,0);
  $("#fall").innerHTML=PHASES.map((p,i)=>{
    const t=times[i], col = p.dir==="res" ? "var(--res)" : p.dir==="none" ? "var(--line2)" : "var(--req)";
    return `<div class="ph ${jIdx<0?"":(i===jIdx?"act":(i<jIdx?"":"dim"))}" data-i="${i}">
      <span class="pn">${p.n}</span>
      <div class="pbar"><div class="pfill" style="width:${(t/max*100).toFixed(1)}%;background:${col}"></div></div>
      <span class="pt">${Math.round(t)} ms</span></div>`;
  }).join("");
  $("#ttfb").textContent=Math.round(tot)+" ms";
  const rt = PHASES.reduce((a,p)=>a+p.rtt,0);
  const waitMs = Math.round(rt*rttMs*2), otherMs = Math.round(tot-40-rt*rttMs*2);
  $("#totNote").innerHTML=`Your code accounts for <b style="color:var(--ink)">40 ms</b> of that. Waiting on round trips accounts for <b style="color:var(--ink)">${waitMs} ms</b>.`;
  $("#rttNote").innerHTML=`At ${rttMs} ms one-way, a round trip is <b>${rttMs*2} ms</b>. This request spends <b>${rt} round trips</b> waiting, about <b>${Math.round(rt*rttMs*2)} ms</b>.`;
}
$("#rtt").oninput=e=>{
  rttMs=+e.target.value;
  const d = rttMs<=2?"same building":rttMs<=8?"same city":rttMs<=40?"same region":rttMs<=90?"across an ocean":"opposite side of Earth";
  $("#rttVal").textContent=`${rttMs} ms · ${d}`;
  renderFall();
};
function wirePulse(dir,ms){
  const pl=$("#pulse");
  if(dir==="none"||REDUCED) return;
  pl.className="pulse "+(dir==="res"?"res":"req");
  const fwd = dir!=="res";
  pl.animate(
    [{left:fwd?"14%":"86%",opacity:0},{left:fwd?"20%":"80%",opacity:1},
     {left:fwd?"80%":"20%",opacity:1},{left:fwd?"86%":"14%",opacity:0}],
    {duration:Math.max(280,Math.min(ms,1100)),easing:"linear"});
}
function stepJ(){
  jIdx++;
  if(jIdx>=PHASES.length){ jIdx=-1; $("#wireLbl").textContent="Done. The browser starts drawing the page."; renderFall(); return false; }
  const p=PHASES[jIdx];
  $("#wireLbl").textContent=p.lbl;
  wirePulse(p.dir, phaseMs(p)*4);
  renderFall();
  return true;
}
$("#stepJ").onclick=()=>{clearTimeout(jTimer);stepJ()};
$("#resetJ").onclick=()=>{clearTimeout(jTimer);jIdx=-1;$("#wireLbl").textContent="Idle";renderFall()};
$("#playJ").onclick=()=>{
  clearTimeout(jTimer); jIdx=-1;
  (function run(){
    if(!stepJ()) return;
    jTimer=setTimeout(run, REDUCED?400:Math.max(500,Math.min(phaseMs(PHASES[jIdx])*4,1400)));
  })();
};
renderFall(); $("#rtt").dispatchEvent(new Event("input"));

/* keyboard: Space plays and Right arrow steps (shortcuts that act inside this lesson only) */
addEventListener("keydown",e=>{
  if(e.key===" "){e.preventDefault();$("#playJ").click()}
  if(e.key==="ArrowRight"){e.preventDefault();$("#stepJ").click()}
});
