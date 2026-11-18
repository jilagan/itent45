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
  $("#totNote").innerHTML=`Your code accounts for <b style="color:var(--ink)">40 ms</b> of that. Waiting on round trips accounts for <b style="color:var(--ink)">${waitMs} ms</b>. The remaining ${otherMs} ms is fixed processing time in the DNS server and the handshakes.`;
  $("#rttNote").innerHTML=`At ${rttMs} ms one-way, a round trip is <b>${rttMs*2} ms</b>. This request spends <b>${rt} round trips</b> waiting on the network, about <b>${Math.round(rt*rttMs*2)} ms</b>, in addition to the time your code runs and the fixed processing time.`;
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

/* ---- a round trip where the cutting happens on the wire, not at the ends ---- */
const MSS=1460, PKT_HDR=54, INIT_CWND=10, REQ_BYTES=700;
const FRAG={kb:45, rtt:38, timers:[]};
function fragModel(){
  const bytes=FRAG.kb*1024;
  const n=Math.max(1, Math.ceil(bytes/MSS));
  const over=n*PKT_HDR;
  let left=n, cw=INIT_CWND, waves=[];
  while(left>0 && waves.length<14){ const go=Math.min(left,cw); waves.push(go); left-=go; cw*=2; }
  return {bytes, n, over, pct:over/(bytes+over)*100, rtts:waves.length, waves};
}
function fragClear(){ FRAG.timers.forEach(clearTimeout); FRAG.timers=[]; }
const at=(fn,ms)=>{ FRAG.timers.push(setTimeout(fn,ms)); };
const wireEl=()=>$("#jWire");
// a whole message sitting in one of the two zones, never in pieces
function bar(zone, cls, pct, label){
  $(zone).innerHTML = pct<=0
    ? `<div class="msgbar empty"></div>`
    : `<div class="msgbar ${cls}" style="width:${pct}%">${label||""}</div>`;
}
function setBarWidth(zone, pct, label){
  const el=$(zone).querySelector(".msgbar");
  if(!el || el.classList.contains("empty")) return;
  el.style.width=pct+"%";
  if(label!==undefined) el.textContent=label;
}
function fragStatic(){
  bar("#jLeft","req",100,"GET /courses");
  bar("#jRight","",0);
  $("#jLeftCap").textContent="Request in one piece";
  $("#jRightCap").textContent="Idle";
  $("#jThink").classList.remove("on");
  wireEl().querySelectorAll(".flyer").forEach(f=>f.remove());
  $("#jPhase").textContent="";
  fragMeters();
}
/* stream `count` packets across the wire, shrinking the source bar and growing the
   destination bar as they go, so the message is only ever in pieces mid-flight */
function stream(dir, count, total, startedAt, pw, isReq, onEach, onLast){
  for(let k=0;k<count;k++){
    const idx=startedAt+k;
    at(()=>{
      const w=wireEl(), W=w.clientWidth||420;
      const f=document.createElement("div");
      f.className="flyer"+(isReq?" reqf":"");
      f.style.width=pw+"px";
      f.style.left=(dir==="out"?0:W-pw)+"px";
      w.appendChild(f);
      requestAnimationFrame(()=>{ f.style.left=(dir==="out"?W-pw:0)+"px"; });
      // the source has now handed this piece over
      onEach&&onEach(idx+1,"left");
      at(()=>{
        f.remove();
        onEach&&onEach(idx+1,"arrived");
        if(idx+1>=total) onLast&&onLast();
      }, 380);
    }, k*Math.max(16, 240/count));
  }
}
function fragMeters(){
  const m=fragModel();
  const set=(id,v,hot,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot);g.classList.toggle("good",!!good)};
  set("#sgPkts", m.n.toLocaleString(), m.n>50, m.n===1);
  set("#sgOver", m.pct.toFixed(1)+"%", m.pct>15, m.pct<5);
  set("#sgRtt", m.rtts, m.rtts>3, m.rtts===1);
  set("#sgTime", (m.rtts*FRAG.rtt)+" ms", m.rtts*FRAG.rtt>200, false);
  $("#waveLine").innerHTML=m.waves.map((w,i)=>`<span>Round trip ${i+1}: ${w}</span>`).join("");
  fragVerdict(m);
}
function fragVerdict(m){
  const v=$("#segVerdict");
  if(m.n===1){
    v.className="verdict ok";
    v.innerHTML=`<b>One packet each way, and ${m.pct.toFixed(0)}% of the reply is headers</b>The reply fits in a single frame, so nothing needs cutting in either direction. The smaller the message, the larger the share taken by headers. The 144-byte JSON reply covered later in "Server or browser rendering" arrives with ${PKT_HDR} bytes of headers, so 27% of that transfer is headers.`;
  } else if(m.rtts<=2){
    v.className="verdict ok";
    v.innerHTML=`<b>One packet out, ${m.n} back</b>The request fit in a single frame. The reply needed ${m.n}. Your code gave the network one message, the network carried it as ${m.n} packets, and the browser received one message.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>One packet out, ${m.n} back, over ${m.rtts} round trips</b>The reply is larger than TCP will send before hearing back. It sends about ten packets, waits a full round trip for confirmation, sends twice as many, and waits again. At ${FRAG.rtt} ms per round trip that is <b class="i">${m.rtts*FRAG.rtt} ms spent waiting</b>, on top of the time the bytes take to move. The 280 KB JavaScript bundle (the file of code the browser downloads) covered later in "Server or browser rendering", needs several round trips for the same reason. Shrinking a reply helps even when bandwidth is not the limit.`;
  }
}
function fragPlay(){
  fragClear(); fragStatic();
  const m=fragModel();
  const W=wireEl().clientWidth||420;
  const pw=Math.max(3, Math.min(26, Math.floor(W/Math.max(m.n,1))-1));
  $("#segSend").textContent="Running\u2026";

  /* ---- 1. request: whole on the left, one packet on the wire, whole on the right ---- */
  at(()=>{ $("#jPhase").textContent=`The ${REQ_BYTES}-byte request fits in one frame, so it crosses in one piece.`; }, 200);
  at(()=>{
    stream("out", 1, 1, 0, 24, true,
      (done,state)=>{
        if(state==="left"){ setBarWidth("#jLeft",0); $("#jLeftCap").textContent="Handed to the network"; }
        else { bar("#jRight","req",100,"GET /courses"); $("#jRightCap").textContent="Request in one piece"; }
      },
      ()=>{ $("#jPhase").textContent="The server receives the request as one message."; });
  }, 500);

  /* ---- 2. the handler runs, wire empty ---- */
  at(()=>{
    $("#jThink").classList.add("on"); $("#jThink").textContent="Your code running, 40 ms";
    $("#jPhase").textContent="Your code runs. Nothing is on the wire.";
    $("#jLeftCap").textContent="Waiting";
  }, 1250);
  at(()=>{
    $("#jThink").classList.remove("on");
    bar("#jRight","",100,`${FRAG.kb} KB`);
    $("#jRightCap").textContent="Reply in one piece";
    $("#jPhase").textContent="The server builds the reply in one piece.";
  }, 2050);

  /* ---- 3. response: shrinks on the right, pieces on the wire, grows on the left ---- */
  at(()=>{
    $("#jPhase").textContent=`The reply is too big for one frame, so the network cuts it every ${MSS.toLocaleString()} bytes.`;
    bar("#jLeft","",0);
    $("#jLeftCap").textContent="Nothing yet";
  }, 2650);

  let sent=0, wi=0, arrived=0;
  const onEach=(_, state)=>{
    if(state==="left"){
      sent++;
      setBarWidth("#jRight", Math.max(0,100-sent/m.n*100), sent>=m.n?"":`${FRAG.kb} KB`);
      $("#jRightCap").textContent = sent>=m.n ? "Handed to the network" : `${m.n-sent} of ${m.n} still here`;
    } else {
      arrived++;
      const pct=arrived/m.n*100, lbl=arrived>=m.n?`${FRAG.kb} KB`:"";
      const cur=$("#jLeft").querySelector(".msgbar");
      // the first arrival replaces the empty placeholder with a real bar that can grow
      if(!cur || cur.classList.contains("empty")) bar("#jLeft","",pct,lbl);
      else setBarWidth("#jLeft", pct, lbl);
      $("#jLeftCap").textContent = arrived>=m.n ? "Reply in one piece" : `${arrived} of ${m.n} arrived`;
      if(arrived>=m.n){
        $("#jRightCap").textContent="Idle";
        bar("#jRight","",0);
        $("#jPhase").innerHTML=`<b class="i" style="color:var(--res)">The reply is whole again.</b> Neither your server code nor your browser code ever handles packets. Your code sends one reply, <code>fetch()</code> (the browser's function for requesting data) receives one reply, and the cutting happens only on the wire.`;
        $("#segSend").textContent="Send it";
      }
    }
  };
  const wave=()=>{
    if(wi>=m.waves.length) return;
    const count=m.waves[wi];
    $("#jPhase").textContent=`Round trip ${wi+1}: ${count} packet${count===1?"":"s"} crossing.`;
    stream("back", count, m.n, sent, pw, false, onEach, null);
    wi++;
    if(wi<m.waves.length) at(wave, Math.max(620, Math.min(1100, FRAG.rtt*9)));
  };
  at(wave, 3150);
}
$("#segSend").onclick=()=>{
  if($("#segSend").textContent!=="Send it"){ fragClear(); $("#segSend").textContent="Send it"; fragStatic(); }
  else fragPlay();
};
$("#segReset").onclick=()=>{ fragClear(); $("#segSend").textContent="Send it"; fragStatic(); };
$("#sResp").oninput=e=>{FRAG.kb=+e.target.value;$("#vResp").textContent=FRAG.kb+" KB";
  fragClear();$("#segSend").textContent="Send it";fragStatic()};
$("#sRtt2").oninput=e=>{FRAG.rtt=+e.target.value;$("#vRtt2").textContent=FRAG.rtt+" ms";fragMeters()};
$("#sResp").dispatchEvent(new Event("input"));

