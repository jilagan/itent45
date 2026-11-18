/* Lesson layers. Widget code for the markup in lesson.html. */
/* ================= 01 LAYERS ================= */
const LAYERS=[
  {n:"L7",name:"HTTP",unit:"message",hdr:38,pay:24,
   adds:"A request line, <code>Name: value</code> headers, a blank line and an optional body.",
   solves:"Agreeing on what a request means: which resource, which method (such as GET) and which format of answer.",
   peer:"The web server program (nginx, or your Node or Python app).",
   note:"This is the only layer you normally write code for."},
  {n:"L6/5",name:"TLS",unit:"record",hdr:29,pay:62,
   adds:"A record header and a tag that lets the receiver detect tampering. Everything inside is now encrypted.",
   solves:"Anyone who can see the wire, such as the café router, cannot read or change the message.",
   peer:"The TLS software on the server, which holds the matching session key.",
   note:"Setting up these keys (the handshake) costs one or two extra round trips, so HTTPS can feel slower on the first load. A round trip is a message out and the reply back."},
  {n:"L4",name:"TCP",unit:"segment",hdr:20,pay:91,
   adds:"Source and destination ports (numbers that identify programs), a sequence number, an acknowledgment number and flags.",
   solves:"Networks lose and reorder data. TCP numbers every byte and resends what was not acknowledged.",
   peer:"The TCP software in the server's operating system, listening on port 443.",
   note:"Port 443 tells the operating system which of the many running programs should receive this data."},
  {n:"L3",name:"IP",unit:"packet",hdr:20,pay:111,
   adds:"Source and destination IP addresses, plus a hop limit (TTL) that stops lost packets from circulating forever.",
   solves:"Getting data across networks it has never seen, one hop at a time.",
   peer:"The IP software on the destination computer.",
   note:"Routers, the devices that forward packets between networks, read only this layer and the one below it. They do not know that HTTP is inside."},
  {n:"L2",name:"Ethernet / Wi-Fi",unit:"frame",hdr:14,pay:131,
   adds:"MAC addresses (the hardware addresses of network cards) for this hop only, such as your laptop to the router.",
   solves:"Moving bits between two devices that share one physical link.",
   peer:"The next device on the link. This header is rewritten at every hop.",
   note:"The IP addresses stay the same the whole way. The MAC addresses change at every router."},
  {n:"L1",name:"Physical",unit:"bits",hdr:0,pay:145,
   adds:"Nothing. The bits become voltage on copper, light in fiber, or radio waves.",
   solves:"Moving a 1 or a 0 across physical space.",
   peer:"The transceiver at the other end of the cable.",
   note:"Light in fiber travels about 200,000 km/s. Manila to Frankfurt and back is about 20,000 km, so the signal alone needs at least 100 ms. Real connections measure closer to 190 ms."}
];
function drawLayers(){
  $("#nest").innerHTML = LAYERS.map((l,i)=>{
    const tot=l.hdr+l.pay, hp=(l.hdr/tot*100).toFixed(1);
    return `<div class="lyr${i===0?" sel":""}" data-i="${i}">
      <div class="lyr-h">
        <span class="lyr-n">${l.n}</span>
        <span class="lyr-name">${l.name}</span>
        <span class="lyr-unit">${l.unit} · ${tot} B</span>
      </div>
      <div class="lyr-inner">
        <div class="lyr-bar">
          ${l.hdr?`<div class="hdr" style="width:${hp}%">+${l.hdr}B</div>`:""}
          <div class="pay" style="width:${100-hp}%">${l.hdr?(i===0?"app message":"everything above"):"the whole message, as bits"}</div>
        </div>
      </div></div>`;
  }).join("");
  $$(".lyr").forEach(el=>el.onclick=()=>{
    $$(".lyr").forEach(x=>x.classList.remove("sel"));
    el.classList.add("sel"); showLayer(+el.dataset.i);
  });
  showLayer(0);
}
function showLayer(i){
  const l=LAYERS[i], tot=l.hdr+l.pay;
  $("#lyrDetail").innerHTML=`
    <dt>Adds</dt><dd>${l.adds}</dd>
    <dt>Solves</dt><dd>${l.solves}</dd>`;
  const m=$("#lyrMore");
  if(m) m.innerHTML=`
    <dt>Unit of transmission</dt><dd>One <code>${l.unit}</code>: ${tot} bytes in total, of which ${l.hdr} are this layer's own header.</dd>
    <dt>Who it talks to</dt><dd>${l.peer}</dd>
    <dt>Worth knowing</dt><dd>${l.note}</dd>`;
}
drawLayers();

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
  $("#waveLine").innerHTML=m.waves.map((w,i)=>`<span>Round trip ${i+1}: ${w} packet${w===1?"":"s"}</span>`).join("");
  fragVerdict(m);
}
function fragVerdict(m){
  const v=$("#segVerdict");
  if(m.n===1){
    v.className="verdict ok";
    v.innerHTML=`<b>One packet each way, and ${m.pct.toFixed(0)}% of the reply is headers</b>The reply fits in a single frame, so nothing needs cutting. The smaller the message, the larger the share taken by headers.`;
  } else if(m.rtts<=2){
    v.className="verdict ok";
    v.innerHTML=`<b>One packet out, ${m.n} back</b>Your code gave the network one message, the network carried it as ${m.n} packets, and the browser received one message.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>One packet out, ${m.n} back, over ${m.rtts} round trips</b>TCP sends about ten packets, waits for confirmation, then sends twice as many. At ${FRAG.rtt} ms per round trip that is <b class="i">${m.rtts*FRAG.rtt} ms spent waiting</b>.`;
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
        $("#jPhase").innerHTML=`<b class="i" style="color:var(--res)">The reply is whole again.</b> Your code sends one reply and receives one reply, and the cutting happens only on the wire.`;
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
