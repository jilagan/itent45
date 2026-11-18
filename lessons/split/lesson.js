/* Lesson split. Widget code for the markup in lesson.html. */
/* ================= 12 MONOLITH VS SERVICES ================= */
const PARTS=[
 {n:"Browse restaurants", ms:40,   ram:90,  share:.72},
 {n:"Order checkout",      ms:80,   ram:120, share:.25},
 {n:"Generate a receipt PDF", ms:3000, ram:400, share:.01},
 {n:"Send notifications", ms:150,  ram:80,  share:.02}
];
const SPLIT={load:400};
const WPM=4;                              // workers per machine
const inst = (rps,ms) => Math.max(1, Math.ceil(rps*(ms/1000)/WPM));

function splitModel(){
  const L=SPLIT.load;
  // monolith: any worker may get any request, so size every worker for the heaviest part
  const avgMs = PARTS.reduce((a,p)=>a+p.share*p.ms,0);
  const worstRam = Math.max(...PARTS.map(p=>p.ram));
  const mInst = inst(L, avgMs);
  const mRam  = mInst*WPM*worstRam;
  // services: each part sized for its own traffic, with its own footprint
  const svc = PARTS.map(p=>{
    const i=inst(L*p.share, p.ms);
    return {n:p.n, ms:p.ms, share:p.share, perRam:p.ram,
            inst:i, ram:i*WPM*p.ram, rps:L*p.share};
  });
  const sInst=svc.reduce((a,x)=>a+x.inst,0);
  const sRam =svc.reduce((a,x)=>a+x.ram,0);
  return {avgMs, worstRam, mInst, mRam, svc, sInst, sRam};
}
const gb = mb => mb>=1024 ? (mb/1024).toFixed(1).replace(/\.0$/,"")+" GB" : mb+" MB";

function renderSplit(){
  const m=splitModel();
  $("#monoBoxes").innerHTML=Array.from({length:Math.min(m.mInst,14)},()=>
    `<div class="ibox m">all<br>4</div>`).join("") +
    (m.mInst>14?`<div class="ibox m" style="border-style:dashed">+${m.mInst-14}</div>`:"");
  const hMax=Math.max(...m.svc.map(x=>x.inst));
  $("#svcBoxes").innerHTML=m.svc.map(x=>{
    const h=Math.round(44+ (x.inst/hMax)*28);
    return `<div class="ibox s" style="height:${h}px" title="${x.n}">${x.n.split(" ")[0].toLowerCase()}<br>${x.inst} machine${x.inst===1?"":"s"}</div>`;
  }).join("");

  $("#monoRam").textContent=gb(m.mRam);
  $("#monoInst").textContent=`${m.mInst} machine${m.mInst===1?"":"s"} × ${WPM} workers × ${m.worstRam} MB`;
  $("#svcRam").textContent=gb(m.sRam);
  $("#svcInst").textContent=`${m.sInst} machine${m.sInst===1?"":"s"} across 4 services`;

  $("#partList").innerHTML =
    `<div class="prt hdr"><span>Part</span><span>Handler time</span><span>RAM each</span><span>Share of requests</span></div>` +
    m.svc.map(x=>`<div class="prt">
        <span><b>${x.n}</b></span>
        <span class="${x.ms>=1000?"hot":""}">${x.ms} ms</span>
        <span class="${x.perRam>=400?"hot":""}">${x.perRam} MB</span>
        <span>${Math.round(x.share*100)}%</span></div>`).join("");

  const v=$("#splitVerdict"), diff=m.mRam-m.sRam;
  if(diff>0){
    const x=(m.mRam/m.sRam).toFixed(1);
    v.className="verdict ok";
    v.innerHTML=`<b>Splitting uses ${gb(diff)} less memory (${x}× less)</b>At ${SPLIT.load} rps the monolith pays for ${m.mInst*WPM} workers that could each be asked to build a PDF, so every one is sized at ${m.worstRam} MB, and only ${m.svc[2].inst*WPM} workers ever do that job. That unused memory is the case for splitting.`;
  } else if(diff===0){
    v.className="verdict warn";
    v.innerHTML=`<b>Equal memory</b>This is the crossover. Below this load the monolith uses less memory, and above it sizing each part separately pays off.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>Splitting uses ${gb(-diff)} more memory</b>Every service needs at least one machine even when it is nearly idle, so four services need at least four machines. At ${SPLIT.load} rps the monolith fits on ${m.mInst} machine${m.mInst===1?"":"s"} and does the same work.`;
  }
}
$("#sLoad2").oninput=e=>{SPLIT.load=+e.target.value;$("#vLoad2").textContent=SPLIT.load+" rps";renderSplit()};
$("#sLoad2").dispatchEvent(new Event("input"));

/* ---- what inter-service chatter costs ---- */
const CALL_MS=3.0, P_SLOW=0.01, SVC_AVAIL=0.999, BASE_MS=40;
const CHAT={n:4};
function chatModel(){
  const n=CHAT.n;
  const mono=BASE_MS+n*0.05;
  const svc=BASE_MS+n*CALL_MS;
  const slow=1-Math.pow(1-P_SLOW, n);
  const av=Math.pow(SVC_AVAIL, Math.max(1,n));
  return {n, mono, svc, slow, av, downMin:(1-av)*30*24*60, mult:svc/mono};
}
function renderChat(){
  const m=chatModel();
  const set=(id,v,hot,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot);g.classList.toggle("good",!!good)};
  set("#chLat", `${m.mono.toFixed(0)} \u2192 ${m.svc.toFixed(0)} ms`, m.mult>1.4, m.n===0);
  set("#chSlow", (m.slow*100).toFixed(1)+"%", m.slow>0.05, m.slow<0.02);
  set("#chAvail", (m.av*100).toFixed(2)+"%", m.av<0.995, m.av>=0.999);
  set("#chDown", m.downMin<60 ? Math.round(m.downMin)+" min" : (m.downMin/60).toFixed(1)+" hrs",
      m.downMin>120, m.downMin<60);

  const v=$("#chVerdict");
  if(m.n===0){
    v.className="verdict ok";
    v.innerHTML=`<b>No extra calls</b>Each request is served by one service and never asks another. Splitting works best here, and this case is rare.`;
  } else if(m.n<=3){
    v.className="verdict warn";
    v.innerHTML=`<b>${m.n} call${m.n===1?"":"s"}, still affordable</b>The handler goes from ${m.mono.toFixed(0)} to ${m.svc.toFixed(0)} ms, and combined uptime drops to ${(m.av*100).toFixed(2)}%. Every new feature that needs one more lookup moves the slider to the right.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>${m.n} calls: ${m.mult.toFixed(1)}× slower and unavailable ${m.downMin<60?Math.round(m.downMin)+" minutes":(m.downMin/60).toFixed(1)+" hours"} a month</b>The handler goes from ${m.mono.toFixed(0)} to ${m.svc.toFixed(0)} ms because it makes ${m.n} network round trips where it used to make ${m.n} function calls. All ${m.n} services must be up at once, so combined uptime is ${(m.av*100).toFixed(2)}% and at least one call is slow on ${(m.slow*100).toFixed(0)}% of requests.`;
  }
}
$("#sChat").oninput=e=>{CHAT.n=+e.target.value;$("#vChat").textContent=CHAT.n;renderChat()};
$("#sChat").dispatchEvent(new Event("input"));
