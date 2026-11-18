/* ================= 12 MONOLITH VS SERVICES ================= */
const PARTS=[
 {n:"Browse the catalog", ms:40,   ram:90,  share:.72},
 {n:"Reserve a seat",     ms:80,   ram:120, share:.25},
 {n:"Generate a transcript PDF", ms:3000, ram:400, share:.01},
 {n:"Send notifications", ms:150,  ram:80,  share:.02}
];
const SPLIT={load:400};
const WPM=4;                              // workers per machine, from panel 18
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
    const h=Math.round(22+ (x.inst/hMax)*30);
    return `<div class="ibox s" style="width:46px;height:${h}px" title="${x.n}">${x.n.split(" ")[0].toLowerCase()}<br>${x.inst}</div>`;
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
    v.innerHTML=`<b>Splitting uses ${gb(diff)} less memory (${x}× less)</b>At ${SPLIT.load} rps the monolith pays for ${m.mInst*WPM} workers that could each be asked to build a PDF, so every one is sized at ${m.worstRam} MB. Only ${m.svc[2].inst*WPM} workers ever do that job. That unused memory is the case for splitting. Read the four costs in the next section before you decide.`;
  } else if(diff===0){
    v.className="verdict warn";
    v.innerHTML=`<b>Equal memory</b>This is the crossover. Below this load the monolith uses less memory. Above it, sizing each part separately starts to pay off. The comparison covers memory only. The operating costs in the next section start on the first day you split.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>Splitting uses ${gb(-diff)} more memory</b>Every service needs at least one machine even when it is nearly idle, so four services need at least four machines. At ${SPLIT.load} rps the monolith fits on ${m.mInst} machine${m.mInst===1?"":"s"} and does the same work. Most capstone projects are in this situation, and one application is the sensible default.`;
  }
}
$("#sLoad2").oninput=e=>{SPLIT.load=+e.target.value;$("#vLoad2").textContent=SPLIT.load+" rps";renderSplit()};
$("#sLoad2").dispatchEvent(new Event("input"));

