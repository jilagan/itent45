const CSSV=(()=>{ const c={};
  const f=n=>{ if(!(n in c)) c[n]=getComputedStyle(document.documentElement).getPropertyValue(n).trim();
               return c[n]||"#888"; };
  f.cache=c; return f; })();
"use strict";
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const REDUCED = matchMedia("(prefers-reduced-motion:reduce)").matches;

/* ================= shell ================= */
$$("#nav button").forEach(b=>b.addEventListener("click",()=>{
  $$("#nav button").forEach(x=>x.setAttribute("aria-selected", x===b));
  $$(".panel").forEach(p=>p.classList.remove("on"));
  $("#p-"+b.dataset.p).classList.add("on");
  if(b.dataset.p==="server") sizeCanvas();
  // rect measurements are all zero while a panel is display:none
  if(b.dataset.p==="pay"   && typeof layoutBypass==="function"){ layoutBypass(); placePayBall(pyI); }
  if(b.dataset.p==="tiers" && typeof placeBall==="function")   { placeBall(trI); }
}));
let scale=1;
const applyScale=()=>document.documentElement.style.setProperty("--scale",scale);
/* dark reads better on a projector, light screenshots better. Keys: t */
function setTheme(t){
  document.documentElement.setAttribute("data-theme", t);
  if(typeof CSSV==="function" && CSSV.cache) for(const k in CSSV.cache) delete CSSV.cache[k];
  // anything drawn to a canvas has to be repainted with the new palette
  ["renderScale","renderQueue","renderCost","elRender","drawQueue"].forEach(f=>{
    try{ if(typeof window[f]==="function") window[f](); }catch(e){}
  });
}
$("#thBtn").onclick=()=>{
  const now=document.documentElement.getAttribute("data-theme")==="light" ? "dark" : "light";
  setTheme(now);
  $("#thBtn").textContent = now==="light" ? "Dark" : "Light";
};
$("#zIn").onclick =()=>{scale=Math.min(1.5,scale+.1);applyScale();sizeCanvas()};
$("#zOut").onclick=()=>{scale=Math.max(.75,scale-.1);applyScale();sizeCanvas()};

/* ================= 01 LAYERS ================= */
const LAYERS=[
  {n:"L7",name:"HTTP",unit:"message",hdr:38,pay:24,
   adds:"A request line, then <code>Header: value</code> pairs, a blank line, and an optional body.",
   solves:"Agreeing on what a request even <em>means</em>. Which resource, which verb, what format the answer should take.",
   peer:"The web server process (nginx, your Node/Python app).",
   note:"This is the only layer you normally write code against."},
  {n:"L6/5",name:"TLS",unit:"record",hdr:29,pay:62,
   adds:"A record header plus a message authentication tag. The payload is now ciphertext.",
   solves:"Anyone who can see the wire, the café router, the ISP, must not be able to read or alter the message.",
   peer:"The TLS stack on the server, holding the matching session key.",
   note:"The handshake that sets up these keys costs 1–2 extra round trips. That is why HTTPS 'feels' slower on first load."},
  {n:"L4",name:"TCP",unit:"segment",hdr:20,pay:91,
   adds:"Source and destination <em>ports</em>, a sequence number, an acknowledgement number, flags.",
   solves:"The network loses, duplicates, and reorders things. TCP numbers every byte and re-sends what was not acknowledged, so the app sees a clean ordered stream.",
   peer:"The TCP stack in the server's kernel, listening on port 443.",
   note:"Port 443 is how the kernel knows which of the hundred running programs gets this data."},
  {n:"L3",name:"IP",unit:"packet",hdr:20,pay:111,
   adds:"Source and destination IP addresses, plus a hop limit (TTL).",
   solves:"Getting the thing across networks it has never seen, hop by hop, with no single machine knowing the whole route.",
   peer:"The IP stack on the destination host.",
   note:"Routers only read this layer. They neither know nor care that it is HTTP inside."},
  {n:"L2",name:"Ethernet / Wi-Fi",unit:"frame",hdr:14,pay:131,
   adds:"MAC addresses of <em>this hop only</em>. Your laptop to the router next to you.",
   solves:"Moving bits between two devices that share one physical link.",
   peer:"The next device on the link. Rewritten at every single hop.",
   note:"The IP addresses stay the same the whole way. The MAC addresses change at every router."},
  {n:"L1",name:"Physical",unit:"bits",hdr:0,pay:145,
   adds:"Nothing. It becomes voltage on copper, light in fibre, or radio.",
   solves:"Actually moving a 1 or a 0 across physical space.",
   peer:"The transceiver at the other end of the cable.",
   note:"Speed of light in fibre is about 200,000 km/s. Manila to Frankfurt and back is roughly 190 ms of pure physics, before any equipment touches it."}
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
          ${l.hdr?`<div class="hdr" style="width:${hp}%">${hp<14?`+${l.hdr}B`:`+${l.hdr}B header`}</div>`:""}
          <div class="pay" style="width:${100-hp}%">${l.hdr?"everything above":"the whole thing, as bits"}</div>
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
    <dt>Unit of transmission</dt><dd>One <code>${l.unit}</code>, ${tot} bytes total, of which ${l.hdr} are this layer's own header.</dd>
    <dt>What this layer adds</dt><dd>${l.adds}</dd>
    <dt>Problem it solves</dt><dd>${l.solves}</dd>
    <dt>Who it talks to</dt><dd>${l.peer}</dd>
    <dt>The part that bites</dt><dd>${l.note}</dd>`;
}
drawLayers();

/* ================= 02 JOURNEY ================= */
const PHASES=[
  {k:"dns",   n:"DNS lookup",        rtt:1, fixed:4,   dir:"both", lbl:"Where is api.example.com?"},
  {k:"tcp",   n:"TCP handshake",     rtt:1, fixed:1,   dir:"both", lbl:"SYN → SYN-ACK → ACK"},
  {k:"tls",   n:"TLS handshake",     rtt:2, fixed:6,   dir:"both", lbl:"Agree on keys"},
  {k:"send",  n:"Request sent",      rtt:.5,fixed:1,   dir:"req",  lbl:"GET /courses"},
  {k:"think", n:"Server handler",    rtt:0, fixed:40,  dir:"none", lbl:"Your code runs · DB query"},
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
  const netPart = tot - 40;
  $("#totNote").innerHTML=`Your handler is <b style="color:var(--ink)">40 ms</b> of that.<br>${Math.round(netPart)} ms is network and setup.`;
  const rt = PHASES.reduce((a,p)=>a+p.rtt,0);
  $("#rttNote").innerHTML=`At ${rttMs} ms one-way, a round trip is <b>${rttMs*2} ms</b>. This request needs <b>${rt} round trips</b> before your code even starts, about <b>${Math.round(rt*rttMs*2)} ms</b> of pure waiting.`;
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
  if(jIdx>=PHASES.length){ jIdx=-1; $("#wireLbl").textContent="Done, page starts rendering"; renderFall(); return false; }
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
  $("#jLeftCap").textContent="one request, whole";
  $("#jRightCap").textContent="idle";
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
  $("#waveLine").innerHTML=m.waves.map((w,i)=>`<span>rtt ${i+1}: ${w}</span>`).join("");
  fragVerdict(m);
}
function fragVerdict(m){
  const v=$("#segVerdict");
  if(m.n===1){
    v.className="verdict ok";
    v.innerHTML=`<b>One packet each way, and ${m.pct.toFixed(0)}% of the reply is envelopes</b>Small enough to fit in a single frame, so nothing needs cutting in either direction. Go smaller and the ratio gets worse, not better: the 144-byte JSON from panel 07 arrives with ${PKT_HDR} bytes of headers on it, so 27% of that transfer is envelope.`;
  } else if(m.rtts<=2){
    v.className="verdict ok";
    v.innerHTML=`<b>One packet out, ${m.n} back</b>Note the asymmetry: the question fitted in a single frame and the answer did not. Neither end ever handled the pieces. Your code passed one message down, the network carried ${m.n} of them, and the browser handed one message back up.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>One packet out, ${m.n} back, over ${m.rtts} round trips</b>The reply is more than TCP will send without hearing back, so it sends about ten, waits a full round trip, doubles, waits again. At ${FRAG.rtt} ms that is <b class="i">${m.rtts*FRAG.rtt} ms spent waiting</b>, on top of the time the bytes take to move. This is why the 280 KB bundle in panel 07 is not one round trip, and why shrinking a payload helps even when bandwidth was never the problem.`;
  }
}
function fragPlay(){
  fragClear(); fragStatic();
  const m=fragModel();
  const W=wireEl().clientWidth||420;
  const pw=Math.max(3, Math.min(26, Math.floor(W/Math.max(m.n,1))-1));
  $("#segSend").textContent="Running\u2026";

  /* ---- 1. request: whole on the left, one packet on the wire, whole on the right ---- */
  at(()=>{ $("#jPhase").textContent=`${REQ_BYTES} bytes fits in one frame, so it crosses uncut`; }, 200);
  at(()=>{
    stream("out", 1, 1, 0, 24, true,
      (done,state)=>{
        if(state==="left"){ setBarWidth("#jLeft",0); $("#jLeftCap").textContent="handed to the network"; }
        else { bar("#jRight","req",100,"GET /courses"); $("#jRightCap").textContent="one request, whole"; }
      },
      ()=>{ $("#jPhase").textContent="the server got one message, not a packet"; });
  }, 500);

  /* ---- 2. the handler runs, wire empty ---- */
  at(()=>{
    $("#jThink").classList.add("on"); $("#jThink").textContent="handler running, 40 ms";
    $("#jPhase").textContent="your code runs. Nothing is on the wire.";
    $("#jLeftCap").textContent="waiting";
  }, 1250);
  at(()=>{
    $("#jThink").classList.remove("on");
    bar("#jRight","",100,`${FRAG.kb} KB`);
    $("#jRightCap").textContent="one reply, whole";
    $("#jPhase").textContent="the reply is built, all in one piece";
  }, 2050);

  /* ---- 3. response: shrinks on the right, pieces on the wire, grows on the left ---- */
  at(()=>{
    $("#jPhase").textContent=`too big for one frame, so the network cuts it every ${MSS.toLocaleString()} bytes`;
    bar("#jLeft","",0);
    $("#jLeftCap").textContent="nothing yet";
  }, 2650);

  let sent=0, wi=0, arrived=0;
  const onEach=(_, state)=>{
    if(state==="left"){
      sent++;
      setBarWidth("#jRight", Math.max(0,100-sent/m.n*100), sent>=m.n?"":`${FRAG.kb} KB`);
      $("#jRightCap").textContent = sent>=m.n ? "handed to the network" : `${m.n-sent} of ${m.n} still here`;
    } else {
      arrived++;
      const pct=arrived/m.n*100, lbl=arrived>=m.n?`${FRAG.kb} KB`:"";
      const cur=$("#jLeft").querySelector(".msgbar");
      // the first arrival replaces the empty placeholder with a real bar that can grow
      if(!cur || cur.classList.contains("empty")) bar("#jLeft","",pct,lbl);
      else setBarWidth("#jLeft", pct, lbl);
      $("#jLeftCap").textContent = arrived>=m.n ? "one reply, whole" : `${arrived} of ${m.n} arrived`;
      if(arrived>=m.n){
        $("#jRightCap").textContent="idle";
        bar("#jRight","",0);
        $("#jPhase").innerHTML=`<b class="i" style="color:var(--res)">whole again.</b> Neither end ever saw a packet. Your code sent one reply, <code>fetch()</code> received one reply, and the cutting existed only on the wire.`;
        $("#segSend").textContent="Send it";
      }
    }
  };
  const wave=()=>{
    if(wi>=m.waves.length) return;
    const count=m.waves[wi];
    $("#jPhase").textContent=`round trip ${wi+1}: ${count} packet${count===1?"":"s"} crossing`;
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

/* ================= 03 BYTES ================= */
const SCN={
  get:{
    req:[
      ["GET /courses?sem=1 HTTP/1.1","start","Request line","Three things separated by spaces: the <em>method</em> (GET, read something, change nothing), the <em>path</em> including the query string, and the protocol version. Everything after this line is metadata."],
      ["Host: api.example.com","k","Host header","Mandatory in HTTP/1.1. One IP address may serve hundreds of sites, so the server needs to be told which one you meant. This is what makes shared hosting possible."],
      ["User-Agent: Mozilla/5.0","k","User-Agent","Free-text description of the client. Servers use it for analytics and for serving different assets. It is trivially forgeable, never trust it for anything that matters."],
      ["Accept: application/json","k","Accept","Content negotiation. The client states what formats it can handle; the server picks one. The same URL can return JSON to your app and HTML to a browser."],
      ["Accept-Encoding: gzip, br","k","Accept-Encoding","The client is saying it can decompress. If the server honours it, the body goes over the wire 60–80% smaller. Costs CPU on both ends to save bandwidth."],
      ["Connection: keep-alive","k","Connection","Do not close the TCP socket after this response, more requests are coming. This is what avoids paying the handshake cost again on the next call."],
      ["","blank","The blank line","A single empty line marks the end of the headers. Everything after it is the body. Without this delimiter the server would not know where headers stop."]
    ],
    res:[
      ["HTTP/1.1 200 OK","start","Status line","Protocol version, a three-digit status code, and a human-readable reason. 2xx worked, 3xx go elsewhere, 4xx you made a mistake, 5xx the server made a mistake."],
      ["Content-Type: application/json; charset=utf-8","k","Content-Type","How to interpret the bytes in the body. Get this wrong and the browser renders your JSON as plain text, or tries to execute it. The charset matters for anything non-ASCII."],
      ["Content-Length: 51","k","Content-Length","Exactly how many bytes of body follow. This is how the client knows the response is complete without waiting for the socket to close."],
      ["Cache-Control: max-age=60","k","Cache-Control","Permission to reuse this answer for 60 seconds without asking again. The cheapest request is the one never sent."],
      ["","blank","The blank line","Same delimiter as the request. Headers end, body begins."],
      ['{"sem":1,"courses":[{"code":"ITENT 45","units":3}]}',"body","Response body","The payload. Exactly the number of bytes promised by Content-Length, in the format promised by Content-Type. Nothing here is special. It is just the remaining bytes on the socket."]
    ]},
  post:{
    req:[
      ["POST /enrollments HTTP/1.1","start","Request line","POST means create or submit. This request has side effects. Repeating it may create a second enrollment. Buttons get disabled after the first click for that reason."],
      ["Host: api.example.com","k","Host header","Same role as before: which site on this IP."],
      ["Content-Type: application/json","k","Content-Type on a request","Describes the format of what <em>you</em> are sending up. The server needs this to know how to parse the body."],
      ["Content-Length: 41","k","Content-Length","Tells the server how many body bytes to read from the socket. Read fewer and you hang; read more and you eat the next request."],
      ["Authorization: Bearer eyJhbGciOi...","k","Authorization","Proof of who you are. Everything after 'Bearer' is an opaque token the server issued at login. Anyone holding it can act as you. Which is why this must only travel over TLS."],
      ["","blank","The blank line","Headers end here."],
      ['{"studentId":"20-1234","code":"ITENT 45"}',"body","Request body","The data being submitted. Unlike a query string, this is not in the URL, so it does not land in server logs or browser history."]
    ],
    res:[
      ["HTTP/1.1 201 Created","start","201 Created","Not just 'it worked'. A new resource now exists. The client should not resend this request; doing so would create a duplicate."],
      ["Location: /enrollments/8891","k","Location","Where the newly created thing lives. The client can follow this to fetch it. This is the server handing back the ID it just assigned."],
      ["Content-Type: application/json","k","Content-Type","Format of the confirmation body below."],
      ["Content-Length: 49","k","Content-Length","Byte count of the body."],
      ["","blank","The blank line","Headers end here."],
      ['{"id":8891,"code":"ITENT 45","status":"enrolled"}',"body","Response body","Confirmation, including the server-assigned id. Returning the created object saves the client a second round trip to go fetch it."]
    ]},
  miss:{
    req:[
      ["GET /courses/ITENT99 HTTP/1.1","start","Request line","A perfectly well-formed request. Nothing about it is wrong. The syntax is valid, the connection worked. It just names something that does not exist."],
      ["Host: api.example.com","k","Host header","Which site on this IP."],
      ["Accept: application/json","k","Accept","Client wants JSON back, including for errors. A well-built API honours this and does not suddenly return an HTML error page."],
      ["","blank","The blank line","Headers end here."]
    ],
    res:[
      ["HTTP/1.1 404 Not Found","start","404 Not Found","4xx means the client is at fault. The request was understood and the server is working fine. The named resource simply is not there. Compare with 500, which means your code crashed."],
      ["Content-Type: application/json","k","Content-Type","The error is still JSON, because the client asked for JSON. Returning an HTML error page here would break the client's parser."],
      ["Content-Length: 50","k","Content-Length","Errors have bodies and byte counts like any other response."],
      ["","blank","The blank line","Headers end here."],
      ['{"error":"not_found","detail":"No course ITENT99"}',"body","Error body","A machine-readable code plus a human-readable detail. The client branches on the code; the developer reads the detail."]
    ]}
};
let scn="get";
function esc(s){return s.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]))}
function renderBytes(){
  const d=SCN[scn];
  const build=(rows,side)=>rows.map((r,i)=>{
    const [txt,kind]=r;
    if(kind==="blank") return `<span class="seg mt" data-s="${side}" data-i="${i}">↵ (blank line)</span>`;
    let html=esc(txt);
    if(kind==="k"){const c=txt.indexOf(":");html=`<span class="k">${esc(txt.slice(0,c+1))}</span><span class="v">${esc(txt.slice(c+1))}</span>`}
    if(kind==="start") html=`<span class="v">${esc(txt)}</span>`;
    if(kind==="body")  html=`<span class="b">${esc(txt)}</span>`;
    return `<span class="seg" data-s="${side}" data-i="${i}">${html}</span>`;
  }).join("\n");
  $("#rawReq").innerHTML=build(d.req,"req");
  $("#rawRes").innerHTML=build(d.res,"res");
  $$(".raw .seg").forEach(el=>el.onclick=()=>{
    $$(".raw .seg").forEach(x=>x.classList.remove("on"));
    el.classList.add("on");
    const row=SCN[scn][el.dataset.s][+el.dataset.i];
    $("#explain").innerHTML=`<div class="et">${esc(row[2]).toUpperCase()}</div><p>${row[3]}</p>`;
  });
  $("#explain").innerHTML=`<div class="et">SELECT A LINE</div><p class="hint">Click any highlighted part of the request or response above.</p>`;
}
$$("[data-scn]").forEach(b=>b.onclick=()=>{
  $$("[data-scn]").forEach(x=>x.setAttribute("aria-pressed",x===b));
  scn=b.dataset.scn; renderBytes();
});
renderBytes();

/* ================= 00 BASICS ================= */
/* ---- how is this page being read right now? the panel adapts to the answer ---- */
const CTX=(()=>{
  const proto=location.protocol, host=location.hostname, port=location.port;
  if(proto==="file:") return {
    mode:"file",
    line:`Your address bar starts with <code>file://</code>. There is <b class="i">no server involved at all</b>. The browser opened this document straight off your disk, the way it would open a photo. Nothing is listening, no port is in use, and no network was involved.`,
    laptop:`Not at this moment. Look at your address bar: it says <code>file://</code>, so the browser read this file off the disk and no program is listening. Run <code>python3 start.py</code> from the repo and the address becomes <code>localhost:8080</code>. At that point, and not before, your laptop is a server.`,
    close:`Right now it is not one, and the address bar is the evidence: <code>file://</code> means the browser opened a file, not a connection. Run <code>python3 start.py</code> and Python starts a program that sits in a loop on port 8080 waiting for connections. Your browser then connects to it and the two of them speak HTTP, on the same machine, both roles at once. That is what <code>localhost:8080</code> means. Sending that link to a classmate gets them nothing. Panel 01 picks up from there.`
  };
  if(host==="localhost"||host==="127.0.0.1") return {
    mode:"local",
    line:`<code>${host}${port?":"+port:""}</code>. This page arrived over HTTP from a program running on <b class="i">your own machine</b>, almost certainly the one you started with <code>python3 start.py</code>. Your laptop is the server and the client at the same time.`,
    laptop:`It is one right now, and this page is the proof. It did not come off your disk; it came over HTTP from a program listening on port ${port||"8080"} of this machine. Stop that process and this page stops loading.`,
    close:`It already is one. This page came over HTTP from a program listening on port ${port||"8080"} of this very machine, which is what <code>${host}${port?":"+port:""}</code> in your address bar means. Python started that program, it sits in a loop waiting for connections, your browser connected to it, and the two of them spoke HTTP. Same machine, both roles at once, which is also why sending that link to a classmate does not work. Panel 01 picks up from there.`
  };
  return {
    mode:"remote",
    line:`<code>${host}</code>. This page came over the network from a machine you have never seen and will never touch, and your laptop is <b class="i">the client</b> in that exchange. Nothing on your computer is serving it.`,
    laptop:`Not at this moment. This page came from <code>${host}</code>, a machine somewhere else. But clone the repo and run <code>python3 start.py</code> and your laptop starts listening on port 8080, and for as long as that runs it is a server, on exactly the same terms.`,
    close:`Not at this moment, because this copy came from <code>${host}</code> and your laptop is the client. Clone the repo and run <code>python3 start.py</code> and that reverses: Python starts a program that sits in a loop on port 8080 waiting for connections, your browser connects to it, and the two of them speak HTTP on the same machine, both roles at once. That is what <code>localhost:8080</code> means. Sending that link to a classmate gets them nothing. Panel 01 picks up from there.`
  };
})();
{
  const l=$("#ctxLine"), c=$("#ctxClose");
  if(l) l.innerHTML=CTX.line;
  if(c) c.innerHTML=CTX.close;
}


const GUESS=[
 {n:"Your laptop", d:"the one in front of you",
  a:CTX.mode==="local"?"yes \u2014 right now, in fact":"yes, when something listens",
  x:CTX.laptop},
 {n:"A Raspberry Pi", d:"costs about \u20b12,000",
  a:"yes",
  x:"Plenty of real websites run on hardware weaker than this. Nothing about being a server requires expensive equipment. It requires a program that waits and a network that can reach it."},
 {n:"A rented cloud box", d:"the usual answer",
  a:"yes",
  x:"This is what most people picture, and panel 21 shows it is a slice of a machine, shared with strangers, created by software in about a minute."},
 {n:"Your phone", d:"surely not",
  a:"yes, technically",
  x:"A phone has a processor, memory and a network connection. Apps exist that turn one into a web server. It is a bad idea for other reasons, but nothing about the definition rules it out."},
 {n:"A rack in a data centre", d:"the classic image",
  a:"only if something is running",
  x:"A powered rack with no program listening serves nothing. It is an expensive space heater. The rack is not what makes it a server."}
];
let guessSeen=0;
$("#guessRow").innerHTML=GUESS.map((g,i)=>`
  <button class="gs" data-i="${i}">
    <h5>${g.n}</h5><p>${g.d}</p>
    <div class="ans">${g.a}</div></button>`).join("");
$$("#guessRow .gs").forEach(el=>el.onclick=()=>{
  el.classList.add("on");
  guessSeen=$$("#guessRow .gs.on").length;
  const g=GUESS[+el.dataset.i], v=$("#guessVerdict");
  v.className="verdict ok";
  v.innerHTML=`<b>${g.n}, ${g.a}</b>${g.x}` + (guessSeen>=3
    ? ` <br><br><b class="i">The pattern:</b> every answer is yes, and every answer has the same condition attached. A server is a computer running a program that waits for connections. Nothing more specific than that is true.`
    : "");
});
$("#guessVerdict").className="verdict";
$("#guessVerdict").innerHTML="<b>Have a guess first</b>Click one and see whether you were right.";

const URLP=[
 {t:"https", c:"scheme", d:"<b>How to talk.</b> <code>https</code> means HTTP with the conversation encrypted, so anyone sitting between you and the server sees noise instead of your password. <code>http</code> is the same conversation in the open. Panel 03 shows what the encryption costs you in round trips."},
 {t:"://",  c:"", d:"Punctuation. It separates how from where, and carries no meaning of its own."},
 {t:"enlist.university.edu", c:"host", d:"<b>Which machine.</b> A name, because <code>18.141.62.7</code> is hard to remember and hard to change. Something has to turn this name into a number before anything can happen. That is DNS, and it is a lookup that costs a round trip of its own the first time."},
 {t:":443", c:"port", d:"<b>Which program on that machine.</b> One computer can run many programs that listen, so the port says which one you want. <code>443</code> is the convention for HTTPS and <code>80</code> for HTTP, so browsers add it for you and hide it. Your starter API uses <code>8000</code>, which is a convention for nothing at all."},
 {t:"/api/courses", c:"path", d:"<b>Which thing on that program.</b> This is the part you design. Panel 05 is about doing it well, and the short rule is that it should name a noun."},
 {t:"?sem=1", c:"query", d:"<b>Extra detail.</b> Filters, page numbers, search terms. It is part of the address, which means it is visible in logs and browser history. Never put a password here."}
];
$("#urlBar").innerHTML=URLP.map((p,i)=>
  p.c ? `<span class="up" data-i="${i}">${p.t}<span class="lab">${p.c}</span></span>`
      : `<span style="color:var(--faint)">${p.t}</span>`).join("");
$$("#urlBar .up").forEach(el=>el.onclick=()=>{
  $$("#urlBar .up").forEach(x=>x.classList.remove("on"));
  el.classList.add("on");
  const p=URLP[+el.dataset.i];
  $("#urlOut").innerHTML=`<div class="et">${p.c.toUpperCase()} &nbsp;&middot;&nbsp; ${p.t}</div><p>${p.d}</p>`;
});

/* ---- your laptop's several addresses, and how far a packet gets ---- */
const HOPS=["your program","the OS network code","the wifi card","your home router","your ISP","the internet"];
const IFACES=[
 {dev:"lo0", ip:"127.0.0.1", s:"loopback", reach:2, turn:"turns around here, inside the operating system",
  v:`<b>It never leaves the machine</b>There is no cable, no wifi, no router. The packet goes down as far as the operating system's network code and comes straight back up into a program on the same computer. Turn off your wifi entirely and <code>localhost:8080</code> still works. That is the test that proves it, and it surprises people every time.`},
 {dev:"en0", ip:"192.168.1.7", s:"wifi, handed out by your router", reach:4, turn:"stops at your router, which is as far as this address means anything",
  v:`<b>As far as your router, and no further</b>This one is real, in the sense that a classmate on the same wifi can reach it. It is also meaningless outside this building: <code>192.168.x.x</code> is a private range that millions of homes use simultaneously, so no router on the internet knows which one you meant. Your router hands these out and remembers who asked for what.`},
 {dev:"wan", ip:"112.198.44.19", s:"your router's public address", reach:6, turn:"reaches the internet, but it is the router's address, not your laptop's",
  v:`<b>This one is routable, and it is not yours</b>It belongs to your router, and everyone in the building shares it. When your laptop talks out, the router rewrites the packet to look like it came from here, and remembers the swap so the reply finds its way back. That machinery works beautifully outward and not at all inward. Nothing on the internet can start a conversation with your laptop.`}
];
let ifSel=0;
function renderIface(){
  $("#ifaceList").innerHTML=IFACES.map((f,i)=>`
    <button class="ifc${i===ifSel?" on":""}" data-i="${i}">
      <span class="dev">${f.dev}</span>
      <span class="ip">${f.ip}<small>${f.s}</small></span></button>`).join("");
  $$("#ifaceList .ifc").forEach(el=>el.onclick=()=>{ifSel=+el.dataset.i;renderIface()});

  const f=IFACES[ifSel];
  $("#hopTrack").innerHTML=HOPS.map((h,i)=>{
    const lit=i<f.reach, last=i===HOPS.length-1;
    return `<div class="hop2 ${lit?"lit":"dead"}">
      <div class="box">${h}</div>${last?"":`<span class="arr">${i===f.reach-1?"&#8630;":"&rarr;"}</span>`}</div>`;
  }).join("");
  $("#hopTurn").textContent=f.turn;
  $("#ifaceVerdict").className="verdict "+(ifSel===2?"ok":"warn");
  $("#ifaceVerdict").innerHTML=f.v;
}
renderIface();

const WHO=[
 {id:"me",   n:"You, on your own laptop", s:"the machine running it",
  r:[true,true,true],
  v:`<b>Everything works</b>All three addresses reach it, because you are already on the machine and on the network. This is why "it works on my machine" is such a famously useless sentence.`},
 {id:"lan",  n:"A classmate on the same wifi", s:"same room, same network",
  r:[false,true,true],
  v:`<b>Your LAN address works, localhost does not</b>When they type <code>localhost</code> their own computer answers, not yours, because localhost always means <em>this machine</em>. Give them <code>192.168.1.7:8080</code> instead and it works, as long as you are both on the same wifi.`},
 {id:"far",  n:"Someone at home in Cebu", s:"a different network entirely",
  r:[false,false,true],
  v:`<b>Only the public address works</b>Your laptop has no address the wider internet can route to. <code>192.168.x.x</code> is a private range that exists inside thousands of networks at once, so it is meaningless from outside. To let them in you would need a public address and something willing to forward the traffic. Renting one of those is the entire business panel 21 describes.`}
];
const TARGETS=[
 {a:"127.0.0.1:8080", s:"localhost, this machine"},
 {a:"192.168.1.7:8080", s:"your laptop on the local wifi"},
 {a:"enlist.university.edu:443", s:"a public address on the internet"}
];
let who="me";
function renderReach(){
  const w=WHO.find(x=>x.id===who);
  $("#whoList").innerHTML=WHO.map(x=>`
    <button class="tg" data-w="${x.id}" aria-pressed="${x.id===who}">
      <span class="dot"></span><span>${x.n}<small>${x.s}</small></span></button>`).join("");
  $$("#whoList .tg").forEach(el=>el.onclick=()=>{who=el.dataset.w;renderReach()});
  $("#reachRows").innerHTML=TARGETS.map((t,i)=>`
    <div class="rr"><span class="addr">${t.a}<small>${t.s}</small></span>
      <span class="yn ${w.r[i]?"y":"n"}">${w.r[i]?"reaches":"no"}</span></div>`).join("");
  const v=$("#reachVerdict");
  v.className="verdict "+(w.r[0]?"ok":"warn");
  v.innerHTML=w.v;
}
renderReach();

/* ================= 01 TIERS ================= */
const TIERS=[
 {n:"Tier 1",h:"Presentation, the browser",
  p:"HTML, CSS and JavaScript. This code is downloaded and then runs on the user's own machine, which means you do not control it and cannot trust what it tells you.",
  m:[["Runs on","the user's laptop"],["You write","templates, JS"],["In practice","templates / static"]],
  mv:{django:[["Runs on","the user's laptop"],["You write","templates, JS"],["In practice","templates / static"]],
      express:[["Runs on","the user's laptop"],["You write","JSX, CSS, JS"],["In practice","the React bundle"]],
      laravel:[["Runs on","the user's laptop"],["You write","Blade, CSS, JS"],["In practice","Blade views / public"]]}},
 {n:"Tier 2",h:"Application, your server process",
  p:"Routing, permission checks, business rules, and turning data into a response. This is the only tier that holds credentials, and the only one that decides which questions the database is allowed to answer.",
  m:[["Runs on","your server"],["You write","routes, handlers, models"],["In practice","the project itself"]],
  mv:{django:[["Runs on","your server"],["You write","urls.py, views, models"],["Stack","Django + gunicorn"]],
      express:[["Runs on","your server"],["You write","routes, controllers, models"],["Stack","Express + Node"]],
      laravel:[["Runs on","your server"],["You write","routes, controllers, models"],["Stack","Laravel + PHP-FPM"]]}},
 {n:"Tier 3",h:"Data, the database",
  p:"A separate program that stores rows and answers SQL. It receives text, plans how to answer it, and returns a grid of values.",
  pv:{django:"A separate program that stores rows and answers SQL. It has never heard of Python or Django. It receives text, plans how to answer it, and returns a grid of values.",
      express:"A separate program that stores rows and answers SQL. It has never heard of JavaScript or Prisma. It receives text, plans how to answer it, and returns a grid of values.",
      laravel:"A separate program that stores rows and answers SQL. It has never heard of PHP or Eloquent. It receives text, plans how to answer it, and returns a grid of values."},
  m:[["Runs on","your server, or its own"],["You write","schema, indexes, queries"],["In practice","Postgres behind the ORM"]]}
];
const TRACE=[
 {t:1,h:"You click a button on a page you already have",
  x:"The page at <code>/my-courses</code> is already open. Clicking here navigates nowhere: JavaScript on the page asks for data instead, so the address bar will not change. The browser is a program on your own laptop, and nothing has left your machine yet.",
  l:"the page, tier 1",
  a:`<span class="d">&lt;button onclick=</span><span class="s">"loadCourses()"</span><span class="d">&gt;</span>My Courses<span class="d">&lt;/button&gt;</span>

<span class="kw">async function</span> loadCourses(){
  <span class="kw">const</span> r = <span class="kw">await</span> fetch(<span class="s">"/api/enrollments?student=20-1234"</span>);
  render(<span class="kw">await</span> r.json());   <span class="c">// address bar stays on /my-courses</span>
}`},
 {t:1,h:"The browser builds a request",
  x:"It turns that URL into the plain text message from panel 04. Your Django code has not run yet. The server does not know you exist.",
  l:"HTTP request, tier 1",
  a:`<span class="kw">GET</span> /api/enrollments?student=20-1234 HTTP/1.1\nHost: enlist.university.edu\nAccept: application/json\nCookie: sessionid=8f2a...`},
 {t:0,h:"The request crosses the network",
  x:"Wrapped in the envelopes from panel 02, hopping across however many routers sit between you and the server. This is the part that costs milliseconds no amount of code can remove.",
  l:"panels 02 and 03",
  a:`<span class="c">laptop → wifi → ISP → ... → data centre → server</span>\n<span class="c">every hop rewrites the L2 frame, nothing above it</span>`},
 {t:2,h:"The framework matches the URL",
  x:"Your server process reads the path and walks its route table top to bottom, taking the first pattern that matches. Every framework has this file; only the syntax changes.",
  lv:{django:"urls.py, tier 2", express:"routes/index.js, tier 2", laravel:"routes/api.php, tier 2"},
  av:{
   django:`urlpatterns = [\n    path(<span class="s">"my-courses"</span>, views.my_courses_page),  <span class="c"># the page you are on</span>\n    path(<span class="s">"api/enrollments"</span>, views.enrollment_list),\n    path(<span class="s">"api/courses/&lt;str:code&gt;"</span>, views.course_detail),\n]`,
   express:`router.get(<span class="s">"/api/enrollments"</span>, enrollmentList);\nrouter.get(<span class="s">"/api/courses/:code"</span>, courseDetail);`,
   laravel:`Route::get(<span class="s">'/api/enrollments'</span>, [EnrollmentController::<span class="kw">class</span>, <span class="s">'index'</span>]);\nRoute::get(<span class="s">'/api/courses/{code}'</span>, [CourseController::<span class="kw">class</span>, <span class="s">'show'</span>]);`}},
 {t:2,h:"Your handler runs",
  x:"Finally, your code. This function runs on the server, inside a process you control, with access to secrets the browser must never see.",
  lv:{django:"views.py, tier 2", express:"controller, tier 2", laravel:"Controller, tier 2"},
  av:{
   django:`<span class="kw">def</span> enrollment_list(request):\n    <span class="kw">if</span> <span class="kw">not</span> request.user.is_authenticated:\n        <span class="kw">return</span> JsonResponse({...}, status=<span class="s">401</span>)\n    sid = request.GET.get(<span class="s">"student"</span>)`,
   express:`<span class="kw">async function</span> enrollmentList(req, res) {\n  <span class="kw">if</span> (!req.user) <span class="kw">return</span> res.status(<span class="s">401</span>).json({...});\n  <span class="kw">const</span> sid = req.query.student;`,
   laravel:`<span class="kw">public function</span> index(Request $request) {\n    <span class="kw">if</span> (! $request->user()) {\n        <span class="kw">return</span> response()->json([...], <span class="s">401</span>);\n    }\n    $sid = $request->query(<span class="s">'student'</span>);`}},
 {t:2,h:"The ORM writes SQL for you",
  x:"This line is not magic. The ORM turns it into a SQL string and hands that string to the database driver. Everything you can do here, you could do by writing the SQL yourself.",
  lv:{django:"Django ORM, tier 2", express:"Prisma, tier 2", laravel:"Eloquent, tier 2"},
  av:{
   django:`qs = (Enrollment.objects\n        .filter(student_id=sid)\n        .select_related(<span class="s">"course"</span>))\n\n<span class="c"># select_related is why this stays one query</span>\n<span class="c"># instead of one per row — see card F</span>`,
   express:`<span class="kw">const</span> rows = <span class="kw">await</span> prisma.enrollment.findMany({\n  where:   { studentId: sid },\n  include: { course: <span class="kw">true</span> }\n});\n\n<span class="c">// include is why this stays one query</span>\n<span class="c">// instead of one per row — see card F</span>`,
   laravel:`$rows = Enrollment::where(<span class="s">'student_id'</span>, $sid)\n        ->with(<span class="s">'course'</span>)\n        ->get();\n\n<span class="c">// with() is why this stays one query</span>\n<span class="c">// instead of one per row — see card F</span>`}},
 {t:3,h:"The database receives SQL",
  x:"A separate program, often on a separate machine. It parses the text, plans how to answer it, and reads from disk or memory. It does not know Django exists.",
  l:"the actual query, tier 3",
  a:`<span class="kw">SELECT</span> e.id, e.student_id, c.code, c.title, c.units\n<span class="kw">FROM</span> enrollment e\n<span class="kw">JOIN</span> course c <span class="kw">ON</span> c.id = e.course_id\n<span class="kw">WHERE</span> e.student_id = <span class="s">'20-1234'</span>;`},
 {t:3,h:"Rows come back",
  x:"Not objects, rows. A grid of values with no behavior attached. The database has no concept of a Python class.",
  l:"result set, tier 3",
  a:`<span class="d"> id  | student_id | code     | title              | units</span>\n<span class="d">-----+------------+----------+--------------------+------</span>\n 881 | 20-1234    | ITENT 45 | Application Dev... |     3\n 882 | 20-1234    | CSCI 21  | Data Structures    |     3`},
 {t:2,h:"Rows become objects",
  x:"The ORM maps each row onto an object so you can use dot notation. This mapping is the O in ORM, and it is not free. It costs CPU and memory in proportion to how many rows you asked for.",
  lv:{django:"back in tier 2", express:"back in tier 2", laravel:"back in tier 2"},
  av:{
   django:`[&lt;Enrollment: 20-1234 → ITENT 45&gt;,\n &lt;Enrollment: 20-1234 → CSCI 21&gt;]`,
   express:`[ { id: 881, course: { code: <span class="s">'ITENT 45'</span>, units: 3 } },\n  { id: 882, course: { code: <span class="s">'CSCI 21'</span>,  units: 3 } } ]`,
   laravel:`Illuminate\\Support\\Collection {\n  <span class="d">#items:</span> [ App\\Models\\Enrollment {...},\n            App\\Models\\Enrollment {...} ]\n}`}},
 {t:2,h:"Objects become text",
  x:"Objects cannot travel over a socket. They are serialized into JSON, plain text, exactly like the response in panel 04.",
  lv:{django:"serialization, tier 2", express:"serialization, tier 2", laravel:"serialization, tier 2"},
  av:{
   django:`<span class="kw">return</span> JsonResponse({\n  <span class="s">"enrollments"</span>: [\n    {<span class="s">"code"</span>: <span class="s">"ITENT 45"</span>, <span class="s">"units"</span>: 3},\n    {<span class="s">"code"</span>: <span class="s">"CSCI 21"</span>,  <span class="s">"units"</span>: 3}\n  ]\n})`,
   express:`res.json({\n  enrollments: [\n    { code: <span class="s">"ITENT 45"</span>, units: 3 },\n    { code: <span class="s">"CSCI 21"</span>,  units: 3 }\n  ]\n});`,
   laravel:`<span class="kw">return</span> response()->json([\n  <span class="s">'enrollments'</span> => [\n    [<span class="s">'code'</span> => <span class="s">'ITENT 45'</span>, <span class="s">'units'</span> => 3],\n    [<span class="s">'code'</span> => <span class="s">'CSCI 21'</span>,  <span class="s">'units'</span> => 3]\n  ]\n]);`}},
 {t:0,h:"The response crosses back",
  x:"Status line, headers, blank line, body. The same shape as every response in panel 04, and it pays the same network cost on the way home.",
  l:"HTTP response",
  a:`<span class="kw">HTTP/1.1 200 OK</span>\nContent-Type: application/json\nContent-Length: 94\n\n{<span class="s">"enrollments"</span>: [ ... ]}`},
 {t:1,h:"The browser renders it",
  x:"JavaScript on the user's laptop parses the JSON and writes DOM nodes. This code runs on a machine you do not control. Which is why every check you did in tier 2 has to exist there, and not only here.",
  l:"back in tier 1",
  a:`<span class="kw">const</span> r = <span class="kw">await</span> fetch(<span class="s">"/api/enrollments?student=20-1234"</span>);\n<span class="kw">const</span> data = <span class="kw">await</span> r.json();\nlist.innerHTML = data.enrollments\n  .map(e =&gt; <span class="s">\`&lt;li&gt;\${e.code}&lt;/li&gt;\`</span>).join(<span class="s">""</span>);`}
];
let trI=0, trTimer=null, trView="wire";

/* --- what the user actually sees at each step --- */
const PAGE_CSS=`<style>
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;
  background:#fff;color:var(--panel);padding:20px 24px;display:flex;flex-direction:column}
h1{font-size:19px;margin:0 0 3px;letter-spacing:-.01em}
.sub{color:var(--dim2);font-size:13px;margin-bottom:16px}
a{color:var(--link);text-decoration:none;font-weight:600;font-size:15px}
ul{list-style:none;padding:0;margin:0}
li{display:flex;justify-content:space-between;align-items:center;
  padding:12px 14px;border:1px solid var(--ink);border-radius:7px;margin-bottom:8px}
.code{font-weight:600;font-size:15px}
.units{color:var(--dim2);font-size:13px}
.mid{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}
.spin{width:26px;height:26px;border-radius:50%;border:3px solid var(--ink);
  border-top-color:var(--link);animation:sp .8s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
.wait{color:var(--dim2);font-size:13px}
@media (prefers-reduced-motion:reduce){.spin{animation:none;border-top-color:var(--dim2)}}
</style>`;

const VIEWS={
 start:{ html:`${PAGE_CSS}<h1>The enlistment system</h1><div class="sub">Logged in as 20-1234</div>
   <div class="mid" style="justify-content:flex-start;align-items:flex-start"><a href="#">My Courses &rsaquo;</a></div>`,
   spin:false, url:"https://enlist.university.edu/",
   cap:`The page they are on right now. Nothing has been asked for yet.` },
 loading:{ html:`${PAGE_CSS}<h1>My Courses</h1><div class="sub">&nbsp;</div>
   <div class="mid"><div class="spin"></div><div class="wait">Waiting for the server</div></div>`,
   spin:true, url:"https://enlist.university.edu/my-courses",
   cap:`<b>This is most of the trace.</b> Ten of the twelve steps happen behind this spinner. The user cannot tell a fast database from a slow one. Only how long they stare at this.` },
 done:{ html:`${PAGE_CSS}<h1>My Courses</h1><div class="sub">First Semester, 2026&ndash;2027</div>
   <ul>
     <li data-src="json"><span class="code">ITENT 45</span><span class="units">3 units</span></li>
     <li data-src="json"><span class="code">CSCI 21</span><span class="units">3 units</span></li>
   </ul>`,
   spin:false, url:"https://enlist.university.edu/my-courses",
   cap:`Everything above finally became pixels. Rows from the database are now DOM nodes, drawn on a machine you do not control.` }
};
function stepView(i){
  if(i===0) return "start";
  if(i>=TRACE.length-1) return "done";
  return "loading";
}
let browSeq=0;
function renderBrowser(){
  const v=VIEWS[stepView(trI)];
  const f=$("#browFrame");
  // a discarded browsing context will not reload if srcdoc is byte-identical,
  // which is what produced the blank frame after toggling. Keep it unique.
  f.removeAttribute("srcdoc");
  f.srcdoc = v.html + "<!--" + (++browSeq) + "-->";
  $(".brow-url").textContent=v.url;
  $("#browSpin").style.visibility = v.spin ? "visible" : "hidden";
  $("#browCap").innerHTML=v.cap;
}
/* the tree is read out of the page the iframe actually rendered, not hand-written */
function buildDomTree(root, depth, out){
  for(const el of root.children){
    const tag=el.tagName.toLowerCase();
    if(tag==="style"||tag==="script") continue;
    const text=[...el.childNodes].filter(n=>n.nodeType===3)
      .map(n=>n.textContent.trim()).join(" ").trim();
    out.push({depth, tag, cls: el.getAttribute("class")||"",
      href: el.getAttribute("href")||"", text,
      json: !!(el.dataset && el.dataset.src==="json")});
    buildDomTree(el, depth+1, out);
  }
  return out;
}
function renderDom(){
  const f=$("#browFrame"), box=$("#trDom"), cap=$("#domCap");
  let doc=null;
  try{ doc=f.contentDocument; }catch(e){ doc=null; }
  if(!doc||!doc.body){ box.innerHTML='<span class="c">building the tree\u2026</span>'; return; }
  const nodes=buildDomTree(doc.body,0,[]);
  box.innerHTML = `<span class="c">document</span>\n<span class="kw">&lt;body&gt;</span>\n` +
    nodes.map(n=>{
      const pad="  ".repeat(n.depth+1);
      const cls=n.cls?`<span class="d"> class=</span><span class="s">"${n.cls}"</span>`:"";
      const href=n.href?`<span class="d"> href=</span><span class="s">"${n.href}"</span>`:"";
      const txt=n.text?`\n${pad}  <span class="s">"${n.text}"</span>`:"";
      const mark=n.json?`   <span class="kw">\u2190 built from the JSON</span>`:"";
      const c=n.json?"kw":"d";
      return `${pad}<span class="${c}">&lt;${n.tag}</span>${cls}${href}<span class="${c}">&gt;</span>${mark}${txt}`;
    }).join("\n");
  const made=nodes.filter(n=>n.json).length;
  cap.innerHTML = made
    ? `<b>Not one of these nodes came over the network.</b> The response was text. JavaScript on the user's laptop parsed it and created ${made} list items, and only then did the browser turn the tree into pixels. Text \u2192 tree \u2192 what you see.`
    : `A page is a tree of nodes before it is ever a picture. Step forward and watch the tree change shape as the data arrives.`;
}
function setView(mode){
  trView=mode;
  $("#vWire").setAttribute("aria-pressed",mode==="wire");
  $("#vDom").setAttribute("aria-pressed",mode==="dom");
  $("#vRender").setAttribute("aria-pressed",mode==="render");
  $("#trArt").style.display  = mode==="wire"   ? "" : "none";
  $("#trDom").style.display  = mode==="dom"    ? "" : "none";
  $("#domCap").style.display = mode==="dom"    ? "" : "none";
  $("#trBrow").style.display = mode==="render" ? "" : "none";
  if(mode!=="wire"){ renderBrowser(); if(mode==="dom") setTimeout(renderDom,60); }
}
$("#browFrame").addEventListener("load",()=>{ if(trView==="dom") renderDom(); });
$$("#stackTog button").forEach(btn=>btn.onclick=()=>{
  $$("#stackTog button").forEach(x=>x.setAttribute("aria-pressed", x===btn));
  STACK=btn.dataset.st;
  renderTiers(); renderTrace(); placeBall(trI); stackNote(); if(typeof renderVerbs==='function') renderVerbs();
});
$("#vWire").onclick=()=>setView("wire");
$("#vDom").onclick=()=>setView("dom");
$("#vRender").onclick=()=>setView("render");
let STACK="django";
const STACK_NAME={django:"Django process",express:"Node process",laravel:"PHP-FPM process"};
function renderTiers(){
  TIERS.forEach((t,i)=>{
    const meta = (t.mv && t.mv[STACK]) ? t.mv[STACK] : t.m;
    let name = (t.h.split(", ")[1]||t.h).replace(/^./,c=>c.toUpperCase());
    if(i===1) name = "Your " + STACK_NAME[STACK];
    $("#tb"+(i+1)).innerHTML=`
      <div class="tn">${t.n}</div>
      <h4>${name}</h4>
      <div class="trole">${t.h.split(", ")[0]} tier</div>
      <p>${(t.pv && t.pv[STACK]) ? t.pv[STACK] : t.p}</p>
      <div class="meta">${meta.map(([k,v])=>`<span>${k}: <b>${v}</b></span>`).join("")}</div>`;
  });
}
renderTiers();

/* which hop is moving at each step, and what is on it */
const SEG=[
 null,                                                  // 1 click
 null,                                                  // 2 build request
 {lane:"A",dir:"fwd",p:"GET /api/enrollments"},         // 3 network
 null,                                                  // 4 urls.py
 null,                                                  // 5 view runs
 null,                                                  // 6 ORM builds SQL
 {lane:"B",dir:"fwd",p:"SELECT … JOIN course …"},       // 7 db receives
 {lane:"B",dir:"back",p:"2 rows"},                      // 8 rows come back
 null,                                                  // 9 rows to objects
 null,                                                  // 10 objects to JSON
 {lane:"A",dir:"back",p:"200 OK + JSON"},               // 11 response back
 null                                                   // 12 render
];
/* where the ball is, step by step: tb1 -> laneA -> tb2 -> tb3 -> laneB -> tb2 -> laneA -> tb1 */
const BALL_AT=["tb1","tb1","laneA","tb2","tb2","tb2","tb3","laneB","tb2","tb2","laneA","tb1"];
function laneEl(which){ return $(`.lane[data-lane="${which}"]`); }
function flowStacked(){
  const a=$("#tb1").getBoundingClientRect(), b=$("#tb3").getBoundingClientRect();
  return Math.abs((a.left+a.width/2)-(b.left+b.width/2)) < 20;
}
function placeBall(i){
  const flow=$(".flow"), ball=$("#flowBall");
  if(!flow||!ball) return;
  const key=BALL_AT[i]||"tb1";
  const el = key==="laneA" ? laneEl("A") : key==="laneB" ? laneEl("B") : $("#"+key);
  if(!el) return;
  const returning = i>=7;
  if(flowStacked()){
    const fb2=flow.getBoundingClientRect(), tb2=el.getBoundingClientRect();
    ball.style.left=(tb2.right-fb2.left-14)+"px";
    ball.style.top =(tb2.top-fb2.top+tb2.height/2)+"px";
    ball.classList.toggle("res", returning);
    return;
  }
  // outbound rides the upper rail (request / query); the return leg rides the lower one (response / rows)
  const rail = $(returning ? "#railAb" : "#railAf");
  const fb=flow.getBoundingClientRect(), tb=el.getBoundingClientRect();
  const railY = rail.getBoundingClientRect().top - fb.top;
  ball.style.left = (tb.left - fb.left + tb.width/2) + "px";
  ball.style.top  = railY + 1 + "px";
  ball.classList.toggle("res", returning);
}
function animateHop(i){
  ["railAf","railAb","railBf","railBb"].forEach(id=>$("#"+id).classList.remove("on-req","on-res"));
  ["capA","capB"].forEach(id=>{const c=$("#"+id);c.className="lcap";c.textContent=""});
  placeBall(i);
  const seg=SEG[i];
  if(!seg) return;
  const fwd = seg.dir==="fwd";
  $("#rail"+seg.lane+(fwd?"f":"b")).classList.add(fwd?"on-req":"on-res");
  const cap=$("#cap"+seg.lane);
  cap.className="lcap on "+(fwd?"req":"res");
  cap.textContent=seg.p;
}
addEventListener("resize",()=>{ if($(".panel.on")?.id==="p-tiers") placeBall(trI); });


function renderTrace(){
  const s=TRACE[trI];
  $("#trStep").textContent=`Step ${trI+1} of ${TRACE.length}`;
  $("#trTitle").textContent=s.h;
  $("#trText").textContent=s.x;
  $("#trLbl").textContent = (s.lv && s.lv[STACK]) ? s.lv[STACK] : s.l;
  $("#trArt").innerHTML = (s.av && s.av[STACK]) ? s.av[STACK] : s.a;
  $$(".flow .tbox").forEach(el=>el.classList.toggle("lit",+el.dataset.t===s.t));
  animateHop(trI);
  if(trView!=="wire") renderBrowser();
}
$("#trNext").onclick=()=>{clearInterval(trTimer);trI=Math.min(TRACE.length-1,trI+1);renderTrace()};
$("#trPrev").onclick=()=>{clearInterval(trTimer);trI=Math.max(0,trI-1);renderTrace()};
$("#trRst").onclick=()=>{clearInterval(trTimer);trI=0;renderTrace();$("#trPlay").textContent="▶ Play trace"};
$("#trPlay").onclick=e=>{
  clearInterval(trTimer);
  if(e.target.dataset.on==="1"){e.target.dataset.on="";e.target.textContent="▶ Play trace";return}
  e.target.dataset.on="1"; e.target.textContent="❚❚ Pause";
  trTimer=setInterval(()=>{
    if(trI>=TRACE.length-1){clearInterval(trTimer);$("#trPlay").dataset.on="";$("#trPlay").textContent="▶ Play trace";return}
    trI++; renderTrace();
  }, REDUCED?900:2600);
};
function stackNote(){
  const n={
   django:"<b>In Django terms:</b> tier 1 is your templates and any JavaScript. Tier 2 is <code>urls.py</code>, your views and your models. Tier 3 is Postgres, and it has never heard of Django.",
   express:"<b>In Node terms:</b> tier 1 is your React or plain JavaScript. Tier 2 is your Express routes, controllers and Prisma models. Tier 3 is Postgres, and it has never heard of Node.",
   laravel:"<b>In Laravel terms:</b> tier 1 is your Blade templates and any JavaScript. Tier 2 is <code>routes/api.php</code>, your controllers and Eloquent models. Tier 3 is Postgres, and it has never heard of PHP."
  }[STACK];
  const el=$("#stackNote"); if(el) el.innerHTML=n;
}
stackNote();
renderTrace();

/* ---- run-it-yourself, with commands you can copy ---- */
const SHELLS=[
 {id:"unix", n:"macOS / Linux", py:"python3", curl:"curl",
  post:`curl -X POST localhost:8080/enrollments \\\n  -H 'Content-Type: application/json' \\\n  -d '{"code":"ITENT 45"}'`,
  note:"Single quotes around the JSON keep the shell from touching the double quotes inside it."},
 {id:"win", n:"Windows PowerShell", py:"python", curl:"curl.exe",
  post:`curl.exe -X POST localhost:8080/enrollments ^\n  -H "Content-Type: application/json" ^\n  --data-raw "{\\"code\\":\\"ITENT 45\\"}"`,
  note:"Two Windows traps here. Use <code>curl.exe</code>, because plain <code>curl</code> in PowerShell is an alias for a different command that takes different arguments. And the inner double quotes must be escaped with backslashes, because single quotes do not protect them the way they do on macOS."}
];
let shellSel="unix";
function esc(t){ return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function copyBtn(cmd,i){
  return `<button data-cmd="${encodeURIComponent(cmd)}" data-k="${i}">copy</button>`;
}
function cmdBlock(cmd,i){
  return `<div class="cmd"><code>${esc(cmd)}</code>${copyBtn(cmd,i)}</div>`;
}
function renderRun(){
  const sh=SHELLS.find(x=>x.id===shellSel);
  $("#shellPick").innerHTML=SHELLS.map(x=>
    `<button data-s="${x.id}" aria-pressed="${x.id===shellSel}">${x.n}</button>`).join("");
  $$("#shellPick button").forEach(el=>el.onclick=()=>{shellSel=el.dataset.s;renderRun()});

  let i=0;
  const steps=[
    {h:"Get the files, once",
     p:"Clone the repository, or download the ZIP from the same page and unzip it.",
     c:[`git clone https://github.com/jilagan/itent45.git\ncd itent45`]},
    {h:"Start the server, and leave it running",
     p:"It prints every byte any client sends it. Keep this terminal where you can see it.",
     c:[`${sh.py} start.py demo`]},
    {h:"In a second terminal, look at the wire",
     p:"The first two are the same request. Count the headers each one sends, and ask why a browser sends so many more.",
     c:[`${sh.curl} http://localhost:8080/courses`,
        `${sh.curl} -v http://localhost:8080/courses`]},
    {h:"Send a body, and find the blank line",
     p:"In the server log, locate the empty line. Everything above it is headers; everything below is the body.",
     c:[sh.post]},
    {h:"Break it on purpose",
     p:"A 404, and a handler that takes two seconds. Read the Content-Length on the 404 and count the body characters yourself.",
     c:[`${sh.curl} http://localhost:8080/nope`,
        `${sh.curl} http://localhost:8080/slow`]},
    {h:"Type a request by hand",
     p:"No client at all. Type the request line, press Enter twice, and watch a reply come back. Then try it again without the Host line.",
     c:[`nc localhost 8080`,
        `GET /courses HTTP/1.1\nHost: localhost`]}
  ];
  $("#runSteps").innerHTML=steps.map((s,n)=>`
    <div class="st3">
      <span class="no">${n+1}</span>
      <div><h5>${s.h}</h5><p>${s.p}</p>
      ${s.c.map(c=>cmdBlock(c,i++)).join("")}
      ${n===3?`<p class="cmdnote">${sh.note}</p>`:""}
      ${n===5&&shellSel==="win"?`<p class="cmdnote"><code>nc</code> is not on Windows by default. Use <code>Test-NetConnection</code> to check the port is open, or skip this step and read a classmate's screen, because the point is seeing a request typed by a human rather than generated.</p>`:""}
      </div></div>`).join("");

  $$("#runSteps .cmd button").forEach(el=>el.onclick=async()=>{
    const text=decodeURIComponent(el.dataset.cmd);
    let ok=false;
    try{ await navigator.clipboard.writeText(text); ok=true; }
    catch(e){
      // clipboard API is blocked on file:// in some browsers, so fall back
      try{
        const ta=document.createElement("textarea");
        ta.value=text; ta.style.position="fixed"; ta.style.opacity="0";
        document.body.appendChild(ta); ta.select();
        ok=document.execCommand("copy"); ta.remove();
      }catch(e2){ ok=false; }
    }
    el.textContent=ok?"copied":"select it";
    el.classList.toggle("done",ok);
    setTimeout(()=>{el.textContent="copy";el.classList.remove("done");},1600);
  });
}
renderRun();

/* ================= 05 VERBS & REST ================= */
/* ---- live table: what each verb does to real rows ---- */
const SEED=[
 {id:"ITENT45", code:"ITENT 45", title:"Application Dev & Emerging Tech", units:3, slots:4},
 {id:"CSCI21",  code:"CSCI 21",  title:"Data Structures",                units:3, slots:0},
 {id:"ITMGT25", code:"ITMGT 25", title:"Programming Fundamentals",       units:3, slots:12}
];
const REQS=[
 {id:"getall", v:"GET",    d:"list every course"},
 {id:"getone", v:"GET",    item:true, d:"fetch the selected course"},
 {id:"post",   v:"POST",   d:"create a course from the body"},
 {id:"put",    v:"PUT",    item:true, body:true, d:"replace it with the body you write"},
 {id:"patch",  v:"PATCH",  item:true, body:true, d:"change only what the body contains"},
 {id:"del",    v:"DELETE", item:true, d:"remove it"}
];
const DB={rows:JSON.parse(JSON.stringify(SEED)), sel:"post", row:"ITENT45", log:[], mark:null, sent:0, lastId:null, seq:0};
const key=r=>r.id;                       // identity, not the display code
const slug=c=>c.trim().replace(/\s+/g,"").toUpperCase();
// the row a single-item request will act on
const selRow=()=>DB.rows.find(r=>key(r)===DB.row) || null;
const reqPath=q=>q.item ? `/courses/${DB.row}` : "/courses";

/* the body the PUT / PATCH builder currently describes */
function reqBody(){
  const on=k=>{const e=$("#bfOn"+k); return e?e.checked:true;};
  const val=(k,d)=>{const e=$("#bf"+k); return e?(e.type==="number"?+e.value:e.value):d;};
  const b={};
  if(on("Title")) b.title=val("Title","");
  if(on("Units")) b.units=val("Units",3);
  if(on("Slots")) b.slots=val("Slots",3);
  return b;
}
function renderBodyForm(){
  const q=REQS.find(x=>x.id===DB.sel);
  const f=$("#bodyForm"); if(!f) return;
  const on = !!(q && q.body);
  f.style.display = on ? "" : "none";
  if(!on) return;
  const b=reqBody(), keys=Object.keys(b);
  const missing=["title","units","slots"].filter(k=>!(k in b));
  const lines=keys.map(k=>` <span class="s">"${k}"</span>: ${typeof b[k]==="number"?b[k]:`<span class="s">"${b[k]}"</span>`}`);
  $("#bfBody").innerHTML =
    `<span class="kw">${q.v}</span> /courses/${DB.row}\n`+
    `Content-Type: <span class="d">application/json</span>\n\n`+
    (keys.length ? `{\n${lines.join(",\n")}\n}` : `{}`)+
    (missing.length
      ? `\n\n<span class="c">// not in the body: ${missing.join(", ")}</span>`+
        (q.id==="put"
          ? `\n<span class="c">// PUT replaces, so those become null</span>`
          : `\n<span class="c">// PATCH ignores them, so those keep their values</span>`)
      : `\n\n<span class="c">// every field is here, so both verbs would do the same thing</span>`);
}
["#bfTitle","#bfUnits","#bfSlots","#bfOnTitle","#bfOnUnits","#bfOnSlots"].forEach(sel=>{
  const el=$(sel); if(el) el.addEventListener("input", ()=>{renderBodyForm();});
});

/* what the POST form is currently describing */
function postBody(){
  return {
    code : ($("#pfCode")  ? $("#pfCode").value  : "").trim(),
    title: ($("#pfTitle") ? $("#pfTitle").value : "").trim(),
    units: +(($("#pfUnits")||{}).value || 3),
    slots: +(($("#pfSlots")||{}).value || 12)
  };
}
function renderPostForm(){
  const on = DB.sel==="post";
  const f=$("#postForm"); if(!f) return;
  f.style.display = on ? "" : "none";
  if(!on) return;
  const b=postBody();
  $("#pfBody").innerHTML =
    `<span class="kw">POST</span> /courses\n`+
    `Content-Type: <span class="d">application/json</span>\n\n`+
    `{<span class="s">"code"</span>: <span class="s">"${b.code||"…"}"</span>,\n`+
    ` <span class="s">"title"</span>: <span class="s">"${b.title||"…"}"</span>,\n`+
    ` <span class="s">"units"</span>: ${b.units},\n`+
    ` <span class="s">"slots"</span>: ${b.slots}}\n\n`+
    `<span class="c">// you send the code. The server derives the id it will</span>\n`+
    `<span class="c">// answer on, and stores both:  id = "${b.code?slug(b.code):"…"}"</span>`;
}
["#pfCode","#pfTitle","#pfUnits","#pfSlots"].forEach(sel=>{
  const el=$(sel); if(el) el.addEventListener("input", renderPostForm);
});

function dbRender(){
  const m=DB.mark||{};
  $("#dbCount").textContent=DB.rows.length+" row"+(DB.rows.length===1?"":"s");
  $("#dbBody").innerHTML = DB.rows.length ? DB.rows.map(r=>{
    const cls = (m.added===key(r) ? "added " : "") + (key(r)===DB.row ? "picked" : "");
    const cell=(f,v)=>{
      const c = (m.changed===key(r) && m.fields && m.fields.includes(f)) ? (v===null?"hlnull":"hl") : "";
      // the code is what people read; the id underneath it is what the URL uses
      const extra = f==="code" ? `<small class="rid">${r.id}</small>` : "";
      return `<td class="${f==="code"?"k ":""}${c}">${v===null?"null":v}${extra}</td>`;
    };
    return `<tr class="${cls}" data-row="${key(r)}">${cell("code",r.code)}${cell("title",r.title)}${cell("units",r.units)}${cell("slots",r.slots)}</tr>`;
  }).join("") + (m.gone?`<tr class="gone"><td class="k">${m.gone}</td><td>deleted</td><td>—</td><td>—</td></tr>`:"")
    : `<tr><td colspan="4" class="dbempty">No rows.</td></tr>`;

  $$("#dbBody tr[data-row]").forEach(tr=>tr.onclick=()=>{
    DB.row=tr.dataset.row; DB.sent=0; DB.lastId=null;
    $("#reqAgain").disabled=true; dbRender();
  });

  const gone=!selRow();
  const disp=selRow()?selRow().code:DB.row;
  $("#reqNote").innerHTML = gone
    ? `<b style="color:var(--warn)">${DB.row} is not in the table.</b> Single-item requests will return 404 until you pick a row that exists. Click one.`
    : `Click any row to point the single-item requests at it. Currently <b style="color:var(--req)">${disp}</b>.
       <br><br>Look at the row: it carries <b style="color:var(--ink)">two</b> fields. <code>${disp}</code> is the code people read, and <code>${DB.row}</code> underneath it is the id the URL uses. The space is not stripped and put back, because that would be a one-way trip. Both are stored when the course is created, and the id never changes after that.
       <br><br>The URL needs its own field because a literal space is not allowed in one, and would have to travel as <code>%20</code>. An identifier that needs encoding is an identifier waiting to cause a bug.`;
  $("#reqList").innerHTML=REQS.map(q=>`
    <button class="rq${q.id===DB.sel?" on":""}" data-r="${q.id}">
      <span class="vb ${q.v}">${q.v}</span>
      <span class="pt">${reqPath(q)}<small>${q.d}</small></span></button>`).join("");
  $$("#reqList .rq").forEach(el=>el.onclick=()=>{
    DB.sel=el.dataset.r; DB.sent=0; DB.lastId=null;
    $("#reqAgain").disabled=true; dbRender();
  });

  renderPostForm(); renderBodyForm();
  $("#reqLog").innerHTML=DB.log.slice(-5).reverse().map(l=>
    `<div class="le ${l.k}"><span class="st">${l.status}</span><span>${l.line}</span><span class="fx">${l.fx}</span></div>`).join("");
}
function send(){
  const q=REQS.find(x=>x.id===DB.sel);
  const same = DB.lastId===q.id;
  DB.sent = same ? DB.sent+1 : 1;
  DB.lastId=q.id; DB.mark=null;
  const target=selRow();
  let status="200 OK", fx="nothing changed", kind="ok";

  if(q.id==="getall"){ fx=`returned ${DB.rows.length} rows`; }
  else if(q.id==="getone"){
    if(target) fx="returned 1 row";
    else { status="404 Not Found"; fx="it is gone"; kind="err"; }
  }
  else if(q.id==="post"){
    const body=postBody();
    if(!body.code){
      status="422 Unprocessable"; fx="code is required"; kind="err";
    } else {
      // a duplicate code is allowed on purpose: the server has no reason to
      // refuse, and that is exactly what makes POST worth being careful with
      let id=slug(body.code), n=1;
      while(DB.rows.some(r=>r.id===id)) id=slug(body.code)+"-"+(++n);
      const row={id, code:body.code.trim(), title:body.title||"Untitled",
                 units:body.units, slots:body.slots};
      DB.rows.push(row); status="201 Created"; kind="new";
      fx=`row ${DB.rows.length} created`; DB.mark={added:id};
      DB.dupe = n>1;
    }
  }
  else if(q.id==="put"){
    if(!target){ status="404 Not Found"; fx="it is gone"; kind="err"; }
    else {
      const b=reqBody(), all=["title","units","slots"];
      // replace: anything the body left out is not preserved, it is emptied
      all.forEach(k=>{ target[k] = (k in b) ? b[k] : null; });
      const wiped=all.filter(k=>!(k in b));
      DB.wiped=wiped;
      fx = wiped.length ? `${wiped.join(", ")} wiped` : "all fields written";
      if(wiped.length) kind="err";
      DB.mark={changed:DB.row, fields:all};
    }
  }
  else if(q.id==="patch"){
    if(!target){ status="404 Not Found"; fx="it is gone"; kind="err"; }
    else {
      const b=reqBody(), keys=Object.keys(b);
      keys.forEach(k=>{ target[k]=b[k]; });           // only what arrived
      DB.wiped=[];
      fx = keys.length ? `${keys.join(", ")} updated` : "nothing sent, nothing changed";
      DB.mark={changed:DB.row, fields:keys};
    }
  }
  else if(q.id==="del"){
    if(target){ DB.rows=DB.rows.filter(r=>key(r)!==DB.row); status="204 No Content";
                fx="row removed"; DB.mark={gone:target.code}; DB.goneRow=DB.row; }
    else { status="404 Not Found"; fx="already gone"; kind="err"; }
  }
  DB.log.push({status, line:`${q.v} ${reqPath(q)}`, fx, k:kind});
  $("#reqAgain").disabled=false;
  dbRender(); dbVerdict(q);
}
function dbVerdict(q){
  const v=$("#dbVerdict"), n=DB.sent;
  const twice = n>1;
  if(q.v==="GET"){
    v.className="verdict ok";
    v.innerHTML=`<b>Sent ${n}×, still ${DB.rows.length} rows</b>GET only reads. You can send it a hundred times, refresh, or let a crawler follow it, and the data is untouched. That property has a name: <b class="i">safe</b>. It is also why putting a state change behind GET is such a bad idea, because everything on the internet assumes this.`;
  } else if(q.id==="post"){
    const b=postBody();
    if(!b.code){
      v.className="verdict bad";
      v.innerHTML=`<b>422, and nothing was created</b>The body had no <code>code</code>, so the server refused it. Read the number: <b class="i">4xx</b> means the request was the problem, and the table is untouched. Type a code and try again.`;
    } else if(twice){
      v.className="verdict bad";
      v.innerHTML=`<b>${n} clicks, ${n} rows called ${b.code}</b>You sent the identical body ${n} times and the server created a course each time. Nothing was wrong with any of those requests, and nothing stopped you ending up with duplicates. This is what <b class="i">not idempotent</b> means. It is the refresh-the-form bug, the double enrolment and the ₱3,897 charge in panel 08, all from one property.<br><br>Look at the URLs: the second one had to become <code>${slug(b.code)}-2</code>, because the code you chose was already taken.`;
    } else {
      v.className="verdict warn";
      v.innerHTML=`<b>201 Created, and ${b.code} is in the table</b>The server made something and told you where it lives. Now press <em>Send the same one again</em> without changing a thing, and count the rows.`;
    }
  } else if(q.v==="PUT"||q.v==="PATCH"){
    const missing=["title","units","slots"].filter(k=>!(k in reqBody()));
    if(q.v==="PUT" && missing.length){
      v.className="verdict bad";
      v.innerHTML=`<b>${missing.join(" and ")} ${missing.length>1?"are":"is"} now null</b>PUT means replace the whole thing. Your body left out <code>${missing.join("</code>, <code>")}</code>, so the server did exactly what you asked and what you omitted is gone. Nothing here was a mistake by the server.<br><br>Send it again and nothing further changes, so PUT is still <b class="i">idempotent</b>. Idempotent does not mean safe. It means repeatable.<br><br>Now switch to <b class="i">PATCH</b> without touching the form, and send that instead.`;
    } else if(q.v==="PATCH" && missing.length){
      v.className="verdict ok";
      v.innerHTML=`<b>Only ${Object.keys(reqBody()).join(", ")} changed</b>The same body you gave PUT, sent as PATCH. <code>${missing.join("</code> and <code>")}</code> were left out and are untouched, because PATCH describes a change rather than a replacement. One body, two verbs, two very different outcomes.<br><br>Send it again and the table does not move, so PATCH is <b class="i">idempotent</b> here too.`;
    } else {
      v.className = twice ? "verdict ok" : "verdict warn";
      v.innerHTML = twice
        ? `<b>Sent ${n}×, the table looks identical</b>Each request wrote the same values over the same values. The end state after ten sends is the end state after one, which is <b class="i">idempotent</b>. It changes data, so it is not safe. The two properties are separate questions.`
        : `<b>Every field was in the body, so both verbs agree</b>With a complete body, PUT and PATCH do the same thing. Untick a field and send again to see where they part company.`;
    }
  } else {
    v.className = twice ? "verdict ok" : "verdict warn";
    v.innerHTML = twice
      ? `<b>Second send returned 404</b>A different status code, and the same end state: the course is gone and stays gone. Idempotency is about where you end up, not about what you are told on the way. DELETE is <b class="i">idempotent</b>.`
      : `<b>204 No Content, row removed</b>Nothing to send back, so nothing was sent. Now press <em>Send the same one again</em>.`;
  }
}
$("#reqSend").onclick=()=>{ DB.lastId=null; send(); };
$("#reqAgain").onclick=send;
$("#reqReset").onclick=()=>{
  DB.rows=JSON.parse(JSON.stringify(SEED)); DB.log=[]; DB.mark=null; DB.row="ITENT45"; DB.goneRow=null;
  DB.sent=0; DB.lastId=null; DB.seq=0; $("#reqAgain").disabled=true;
  $("#dbVerdict").className="verdict"; $("#dbVerdict").innerHTML="<b>Reset</b>Three rows, as they started.";
  dbRender();
};
dbRender();
$("#dbVerdict").className="verdict";
$("#dbVerdict").innerHTML="<b>Ready</b>Pick a request and press Send.";

const VERBS=[
 {v:"GET",d:"Fetch something. Change nothing.",safe:true,idem:true,body:false,
  ex:`GET /courses/ITENT45 HTTP/1.1`,
  twice:"Identical answer both times. Nothing changed, so nothing can go wrong.",
  dj:{django:`request.method == "GET"  →  your list or detail view`,express:`router.get(path, handler)  →  your list or detail route`,laravel:`Route::get(...)  →  index() or show()`},
  note:"Because GET promises to change nothing, browsers, proxies and search crawlers feel free to send it whenever they like. Put a delete behind a GET and a crawler will eventually find it."},
 {v:"POST",d:"Create something new, or submit work.",safe:false,idem:false,body:true,
  ex:`POST /enrollments HTTP/1.1\nContent-Type: application/json\n\n{"student":"20-1234","code":"ITENT 45"}`,
  twice:"Two enrollments. This is exactly the refresh-the-form bug. The browser warns before resubmitting for that reason.",
  dj:{django:`request.method == "POST"  →  form.save() / Model.objects.create()`,express:`router.post(...)  →  prisma.model.create({ data })`,laravel:`Route::post(...)  →  Model::create($validated)`},
  note:"POST is the only common verb that is neither safe nor idempotent. Anything that must not happen twice needs protection you write yourself. A unique constraint, or an idempotency key the client sends."},
 {v:"PUT",d:"Replace an item completely.",safe:false,idem:true,body:true,
  ex:`PUT /courses/ITENT45 HTTP/1.1\nContent-Type: application/json\n\n{"title":"App Dev and Emerging Tech","units":3}`,
  twice:"Same result. You replaced it with those exact values; doing it again replaces it with the same values.",
  dj:{django:`request.method == "PUT"  →  overwrite every field on the instance`,express:`router.put(...)  →  prisma.model.update({ where, data })`,laravel:`Route::put(...)  →  $model->update($all)`},
  note:"PUT means the whole thing. Any field you leave out should be wiped, not kept. If you only wanted to change one field, the verb you wanted was PATCH."},
 {v:"PATCH",d:"Change part of an item.",safe:false,idem:true,body:true,
  ex:`PATCH /courses/ITENT45 HTTP/1.1\nContent-Type: application/json\n\n{"units":6}`,
  twice:"Same result for a plain value like this. Careful: a patch that says 'add 3 units' would not be idempotent.",
  dj:{django:`request.method == "PATCH"  →  update only the keys you were sent`,express:`router.patch(...)  →  update only the keys you were sent`,laravel:`Route::patch(...)  →  $model->fill($partial)->save()`},
  note:"The everyday verb for edit forms. Send only what changed, leave everything else alone."},
 {v:"DELETE",d:"Remove an item.",safe:false,idem:true,body:false,
  ex:`DELETE /enrollments/8891 HTTP/1.1`,
  twice:"First call removes it and returns 204. Second returns 404. The end state is the same either way, which is what idempotent means. The effect, not the status code.",
  dj:{django:`request.method == "DELETE"  →  instance.delete()`,express:`router.delete(...)  →  prisma.model.delete({ where })`,laravel:`Route::delete(...)  →  $model->delete()`},
  note:"Most real systems mark a row inactive instead of removing it, so that history survives. The verb still reads DELETE to the client."}
];
let vSel=0;
function renderVerbs(){
  $("#verbList").innerHTML=VERBS.map((v,i)=>`
    <button class="vb${i===vSel?" pick":""}" data-i="${i}">
      <div class="vn">${v.v}</div><div class="vd">${v.d}</div>
      <div class="flags">
        <span class="flag ${v.safe?"yes":"no"}">${v.safe?"safe":"changes data"}</span>
        <span class="flag ${v.idem?"yes":"no"}">${v.idem?"idempotent":"not idempotent"}</span>
      </div></button>`).join("");
  const v=VERBS[vSel];
  $("#verbDetail").innerHTML=`
    <div class="card-t">${v.v}, what it promises</div>
    <div class="art" style="margin-top:0">${v.ex.replace(/^([A-Z]+)/,'<span class="kw">$1</span>')}</div>
    <dl class="detail" style="margin-top:14px">
      <dt>Send it twice</dt><dd>${v.twice}</dd>
      <dt>In ${ {django:"Django",express:"Express",laravel:"Laravel"}[STACK] }</dt><dd><code>${v.dj[STACK]}</code></dd>
      <dt>The part that bites</dt><dd>${v.note}</dd>
    </dl>`;
  $$("#verbList .vb").forEach(el=>el.onclick=()=>{vSel=+el.dataset.i;renderVerbs()});
}
renderVerbs();

const MTX=[
 ["GET",  ["List them all","200 + an array",0,"Returns every course, usually paginated. The most common endpoint in any API."],
          ["Fetch that one","200, or 404",0,"The canonical way to read a single resource. If the code does not exist you get 404, not an empty 200."]],
 ["POST", ["Create a new one","201 + Location",0,"The server assigns the id and tells you where the new thing lives. Sending this twice creates two."],
          ["Rarely meaningful","405",1,"The item already exists, so there is nothing to create. Some APIs use this for actions like /courses/ITENT45/archive."]],
 ["PUT",  ["Replace the whole set","405 in practice",1,"This would mean 'discard every course and use these instead'. Almost no API allows it."],
          ["Replace that one","200 or 204",0,"Overwrites every field. Anything you omit gets wiped, which is the trap people hit first."]],
 ["PATCH",["Not meaningful","405",1,"There is no single thing to partially update."],
          ["Change some fields","200",0,"The everyday edit. Send only what changed."]],
 ["DELETE",["Delete everything","405",1,"Exactly as dangerous as it reads. If your API allows this, someone will eventually call it by accident."],
          ["Delete that one","204, then 404",0,"Removes it and returns no body. Calling it again gives 404, and the end state is unchanged."]]
];
$("#mtxBody").innerHTML=MTX.map(([v,coll,item],r)=>`
  <tr><td class="vcell">${v}</td>
  ${[coll,item].map((c,ci)=>`<td><button class="mc${c[2]?" warn2":""}" data-r="${r}" data-c="${ci}">
      ${c[0]}<span class="code">${c[1]}</span></button></td>`).join("")}
  </tr>`).join("");
$$("#mtxBody .mc").forEach(el=>el.onclick=()=>{
  $$("#mtxBody .mc").forEach(x=>x.classList.remove("pick"));
  el.classList.add("pick");
  const row=MTX[+el.dataset.r], cell=[row[1],row[2]][+el.dataset.c];
  const url=+el.dataset.c===0?"/courses":"/courses/ITENT45";
  $("#mtxOut").innerHTML=`<div class="et">${row[0]} ${url}</div><p>${cell[3]}</p>`;
});

/* ---- status codes ---- */
const CODES=[
 [200,"OK",2,"The answer is in the body. What a successful GET returns, and what PUT or PATCH return when they hand back the updated thing."],
 [201,"Created",2,"A new resource now exists, and the <code>Location</code> header says where. Do not resend this request, you would create a second one."],
 [204,"No Content",2,"It worked and there is deliberately nothing to send back. The usual answer to a successful DELETE. The body must be empty, not an empty string."],
 [301,"Moved Permanently",3,"This URL has changed forever. Browsers and search engines cache this very aggressively and for a long time, so it is painful to undo. Reach for 302 unless you are certain."],
 [303,"See Other",3,"Redirect after a POST. This is the classic cure for the refresh-resubmits-the-form bug: accept the POST, then redirect to a GET, so the page the user lands on is safe to reload. Same problem as the double-charge in panel 08, solved at a different layer."],
 [304,"Not Modified",3,"You already have the current version, so use your cached copy. No body at all. This is how conditional requests save real bandwidth on the catalog pages from panel 19."],
 [400,"Bad Request",4,"The request itself is malformed, broken JSON, a missing required field. The server could not even parse what you sent."],
 [401,"Unauthorized",4,"Badly named: it means <b>unauthenticated</b>. The server has no idea who you are. Send credentials and try again."],
 [403,"Forbidden",4,"The server knows exactly who you are and the answer is still no. Sending better credentials will not help."],
 [404,"Not Found",4,"The URL names nothing. The server is working perfectly. Check your path and your ids before you check anything else."],
 [405,"Method Not Allowed",4,"Right URL, wrong verb. This is every greyed-out cell in the matrix above, <code>DELETE /courses</code> when only <code>DELETE /courses/{code}</code> makes sense."],
 [409,"Conflict",4,"The request is valid but collides with the current state. Two students clicking for the same last seat: one gets 201, the other gets 409. This is the enlistment race from panel 20, expressed as a status code."],
 [422,"Unprocessable Content",4,"The syntax is fine but the meaning is wrong. A date in the past, a unit load over the maximum. Where Django form validation errors belong."],
 [429,"Too Many Requests",4,"Rate limited. Comes with a <code>Retry-After</code> header telling the client how long to wait. This is a server protecting the capacity you measured in panel 18."],
 [500,"Internal Server Error",5,"Your code raised an exception. This is always a bug, never a valid outcome. Stop looking at the front end and go and read the traceback."],
 [502,"Bad Gateway",5,"nginx reached your application and got nonsense back, or nothing at all, usually because the worker died. Panel 17's out-of-memory kill looks like this from outside."],
 [503,"Service Unavailable",5,"The server is running but refusing work: overloaded, or in maintenance. An honest 503 is far better than a slow 200."],
 [504,"Gateway Timeout",5,"Your application did not answer in time, so nginx gave up waiting. This is the queue in panel 18 overflowing, seen from the user's side. On enlistment morning this is the one you get."]
];
$("#codeChips").innerHTML=CODES.map(([c,n,f],i)=>
  `<button class="cd c${f}" data-i="${i}"><b>${c}</b>${n}</button>`).join("");
$$("#codeChips .cd").forEach(el=>el.onclick=()=>{
  $$("#codeChips .cd").forEach(x=>x.classList.remove("on"));
  el.classList.add("on");
  const [c,n,f,d]=CODES[+el.dataset.i];
  const who={2:"it worked",3:"look elsewhere",4:"your fault",5:"their fault"}[f];
  $("#codeOut").innerHTML=`<div class="et">${c} ${n.toUpperCase()} &nbsp;·&nbsp; ${f}xx, ${who}</div><p>${d}</p>`;
});

/* ---- one request or fifty: what request granularity costs ---- */
const G_RTT=38, G_REQ_HDR=700, G_H2_HDR=60, G_ITEM=120, G_RESP_HDR=250, G_CONN=6;
const GRAN={n:50, h2:false};
function granModel(){
  const n=GRAN.n, h2=GRAN.h2;
  const reqs=1+n;
  const rounds=h2?1:Math.ceil(reqs/G_CONN);
  const chatty={
    reqs, rounds, wait:rounds*G_RTT,
    up:G_REQ_HDR + n*(h2?G_H2_HDR:G_REQ_HDR),
    down:reqs*G_RESP_HDR + n*G_ITEM, handlers:reqs
  };
  const bulk={reqs:1, rounds:1, wait:G_RTT, up:G_REQ_HDR,
              down:G_RESP_HDR + n*G_ITEM, handlers:1};
  return {chatty, bulk, n, h2};
}
const kb=b=>b<1024?b+" B":(b/1024).toFixed(1)+" KB";
function renderGran(){
  const m=granModel();
  $("#granN").textContent=m.n;
  const rows=[
    ["Requests", m.chatty.reqs, m.bulk.reqs],
    ["Round trips", m.chatty.rounds, m.bulk.rounds],
    ["Time spent waiting", m.chatty.wait+" ms", m.bulk.wait+" ms"],
    ["Sent up the wire", kb(m.chatty.up), kb(m.bulk.up)],
    ["Came back down", kb(m.chatty.down), kb(m.bulk.down)],
    ["Handler runs on the server", m.chatty.handlers, m.bulk.handlers]
  ];
  $("#granBody").innerHTML=rows.map(([l,a,b])=>{
    const worse=String(a)!==String(b);
    return `<tr><td>${l}</td>
      <td class="${worse?"n":"y"}">${a}</td>
      <td class="y">${b}</td></tr>`;
  }).join("");

  const v=$("#granVerdict");
  const ratio=(m.chatty.up/m.bulk.up).toFixed(0);
  if(m.n<=3){
    v.className="verdict warn";
    v.innerHTML=`<b>At ${m.n} item${m.n===1?"":"s"} it barely matters</b>Both fit in one round trip and the byte difference is noise. This is worth knowing because it is how the chatty version gets written in the first place: it is fine in testing with three rows, and nobody looks again.`;
  } else if(m.h2){
    v.className="verdict warn";
    v.innerHTML=`<b>HTTP/2 fixed the waiting, and nothing else</b>All ${m.chatty.reqs} requests now go down one connection at once, so the wait drops back to a single round trip. But your server still runs <b class="i">${m.chatty.handlers} handlers</b> instead of one, still does ${m.n} database lookups, and still sends ${kb(m.chatty.down)} back where ${kb(m.bulk.down)} would do. The protocol hid the symptom. The N+1 is still there, and panel 15 puts a number on it.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>${m.chatty.rounds} round trips and ${kb(m.chatty.up)} of headers to fetch ${kb(m.n*G_ITEM)} of data</b>The browser will only hold six connections open to one host, so ${m.chatty.reqs} requests queue up in batches of six. That is <b class="i">${m.chatty.wait} ms</b> of waiting before the last course title appears, against ${m.bulk.wait} ms for the same information in one trip. Most of what went up the wire was the same cookie and user-agent, ${m.n} times over.`;
  }
}
$("#sGran").oninput=e=>{GRAN.n=+e.target.value;$("#vGran").textContent=GRAN.n;renderGran()};
$("#tgH2").onclick=()=>{GRAN.h2=!GRAN.h2;$("#tgH2").setAttribute("aria-pressed",GRAN.h2);renderGran()};
$("#sGran").dispatchEvent(new Event("input"));

/* ---- the reverse case: fetching more than anyone reads ---- */
const L_TOTAL=500, L_PAGE=20, L_ITEM=120, L_RTT=38, L_MS_PER_KB=1.6;
const LAZY={viewed:10};
function lazyModel(){
  const v=LAZY.viewed;
  const allB=L_TOTAL*L_ITEM;
  const pages=Math.max(1, Math.ceil(v/L_PAGE));
  const lazyB=pages*L_PAGE*L_ITEM;
  return {
    v,
    bulk:{rt:1, ttfc:L_RTT+allB/1024*L_MS_PER_KB, bytes:allB, waste:(L_TOTAL-v)*L_ITEM},
    lazy:{rt:pages, ttfc:L_RTT+(L_PAGE*L_ITEM)/1024*L_MS_PER_KB, bytes:lazyB,
          waste:(pages*L_PAGE-v)*L_ITEM}
  };
}
function renderLazy(){
  const m=lazyModel(), kb=b=>b<1024?b+" B":(b/1024).toFixed(1)+" KB";
  const rows=[
    ["First screen appears", Math.round(m.bulk.ttfc)+" ms", Math.round(m.lazy.ttfc)+" ms", "lazy"],
    ["Round trips", m.bulk.rt, m.lazy.rt, m.lazy.rt<=m.bulk.rt?"lazy":"bulk"],
    ["Transferred", kb(m.bulk.bytes), kb(m.lazy.bytes), m.lazy.bytes<=m.bulk.bytes?"lazy":"bulk"],
    ["Never looked at", kb(m.bulk.waste), kb(m.lazy.waste), m.lazy.waste<=m.bulk.waste?"lazy":"bulk"]
  ];
  $("#lazyBody").innerHTML=rows.map(([l,a,b,win])=>
    `<tr><td>${l}</td>
      <td class="${win==="bulk"?"y":"n"}">${a}</td>
      <td class="${win==="lazy"?"y":"n"}">${b}</td></tr>`).join("");

  const pct=Math.round(m.v/L_TOTAL*100);
  const v=$("#lazyVerdict");
  if(pct<=25){
    v.className="verdict ok";
    v.innerHTML=`<b>They read ${pct}% of it, and you sent all of it</b>Loading everything up front moved ${( m.bulk.bytes/1024).toFixed(0)} KB so the student could look at ${(m.v*L_ITEM/1024).toFixed(1)} KB of it, and made them wait ${Math.round(m.bulk.ttfc)} ms for the first screen instead of ${Math.round(m.lazy.ttfc)} ms. This is the shape of most catalogs, feeds and search results. Infinite scroll exists because of it.`;
  } else if(pct<80){
    v.className="verdict warn";
    v.innerHTML=`<b>${pct}% read: loading as they scroll still transfers less</b>${(m.lazy.bytes/1024).toFixed(1)} KB against ${(m.bulk.bytes/1024).toFixed(0)} KB, at the cost of ${m.lazy.rt} round trips instead of one. The first screen still arrives three times sooner. Somewhere past here the round trips start to hurt more than the wasted bytes, and where that sits depends on your users, not on a rule.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>They read nearly all of it, and paging cost you ${m.lazy.rt} round trips</b>The bytes are now the same either way, so the only difference left is <b class="i">${m.lazy.rt} trips against one</b>, and every one of those is a wait. For a reader like this, fetching up front is the better call. Look at what did not change: the first screen still appears in ${Math.round(m.lazy.ttfc)} ms rather than ${Math.round(m.bulk.ttfc)} ms, because they can start reading page one while page two is still coming.`;
  }
}
$("#sLazy").oninput=e=>{LAZY.viewed=+e.target.value;$("#vLazy").textContent=LAZY.viewed;renderLazy()};
$("#sLazy").dispatchEvent(new Event("input"));

/* ================= 06 CLIENTS ================= */
const SHARED_RES = `<span class="kw">HTTP/1.1 200 OK</span>
Content-Type: application/json
Content-Length: 118

{<span class="s">"courses"</span>: [
  {<span class="s">"code"</span>: <span class="s">"ITENT 45"</span>, <span class="s">"units"</span>: 3, <span class="s">"slots"</span>: 4},
  {<span class="s">"code"</span>: <span class="s">"CSCI 21"</span>,  <span class="s">"units"</span>: 3, <span class="s">"slots"</span>: 0}
]}`;

const CLIENTS=[
 {id:"web", n:"Web browser", s:"React on a laptop",
  req:`<span class="kw">GET</span> /api/courses HTTP/1.1
Host: enlist.university.edu
Accept: application/json
<span class="kw">Cookie</span>: sessionid=8f2a91c4...
User-Agent: Mozilla/5.0 (Macintosh...)`,
  code:`<span class="kw">const</span> r = <span class="kw">await</span> fetch(<span class="s">"/api/courses"</span>, {
  credentials: <span class="s">"include"</span>   <span class="c">// cookie rides along</span>
});
<span class="kw">const</span> { courses } = <span class="kw">await</span> r.json();`,
  render:`&lt;ul&gt;
  {courses.map(c =&gt;
    &lt;li key={c.code}&gt;{c.code} &amp;middot; {c.units}u&lt;/li&gt;
  )}
&lt;/ul&gt;`,
  note:"The browser attaches the session cookie by itself, because the server set it at login and the browser has been storing it ever since. You never wrote code to send it. That convenience is also why cookies need CSRF protection. The browser will attach them even on a request some other site triggered.",
  cons:["Stable network","Large screen","You control every deploy","Cookie auth, automatic"]},

 {id:"ios", n:"iOS app", s:"Swift, native",
  req:`<span class="kw">GET</span> /api/courses HTTP/1.1
Host: enlist.university.edu
Accept: application/json
<span class="kw">Authorization</span>: Bearer eyJhbGciOiJIUzI1...
User-Agent: EnlistMobile/2.1 (iOS 17.4)`,
  code:`<span class="kw">var</span> req = URLRequest(url: url)
req.setValue(<span class="s">"Bearer \\(token)"</span>,
   forHTTPHeaderField: <span class="s">"Authorization"</span>)
<span class="kw">let</span> (data, _) = <span class="kw">try await</span> URLSession.shared.data(<span class="kw">for</span>: req)
<span class="kw">let</span> result = <span class="kw">try</span> JSONDecoder().decode(CourseList.self, from: data)`,
  render:`List(result.courses, id: \\.code) { c <span class="kw">in</span>
    HStack {
        Text(c.code)
        Spacer()
        Text(<span class="s">"\\(c.units)u"</span>)
    }
}`,
  note:"There is no cookie jar here, so the app stores a token in the Keychain and attaches it deliberately on every request. Note the User-Agent carries your app's version number. That string is how you will later work out how many people are still running old code against your API.",
  cons:["Mobile data, high latency","Small screen","App Store review to ship","Bearer token, manual","Payload size costs battery"]},

 {id:"android", n:"Android app", s:"Kotlin, native",
  req:`<span class="kw">GET</span> /api/courses HTTP/1.1
Host: enlist.university.edu
Accept: application/json
<span class="kw">Authorization</span>: Bearer eyJhbGciOiJIUzI1...
User-Agent: EnlistMobile/2.0 (Android 14)`,
  code:`<span class="kw">val</span> req = Request.Builder()
    .url(<span class="s">"$BASE/api/courses"</span>)
    .header(<span class="s">"Authorization"</span>, <span class="s">"Bearer $token"</span>)
    .build()
<span class="kw">val</span> body = client.newCall(req).execute().body?.string()
<span class="kw">val</span> result = Json.decodeFromString&lt;CourseList&gt;(body!!)`,
  render:`LazyColumn {
    items(result.courses) { c -&gt;
        Row {
            Text(c.code)
            Text(<span class="s">"\${c.units}u"</span>)
        }
    }
}`,
  note:"Structurally identical to iOS, in a different language, against the same endpoint. Android update adoption is typically slower and more spread out than iOS, across far more device and OS combinations. Which matters a great deal once you start changing the API.",
  cons:["Mobile data, high latency","Many device sizes","Store review to ship","Bearer token, manual","Slowest update adoption"]}
];
let clSel=0;
function renderClients(){
  $("#clientPick").innerHTML=CLIENTS.map((c,i)=>`
    <button class="cbox${i===clSel?" on":""}" data-i="${i}">
      <div class="cn">${c.n}</div><div class="cs">${c.s}</div></button>`).join("");
  const c=CLIENTS[clSel];
  $("#clReq").innerHTML=c.req;
  $("#clCode").innerHTML=c.code;
  $("#clRes").innerHTML=SHARED_RES;
  $("#clRender").innerHTML=c.render;
  $("#clNote").textContent=c.note;
  $("#clCons").innerHTML=c.cons.map(x=>`<span>${x}</span>`).join("");
  $$("#clientPick .cbox").forEach(el=>el.onclick=()=>{clSel=+el.dataset.i;renderClients()});
}
renderClients();

/* version drift */
/* the server-rendered counterexample: markup where the data should be */
$("#enlistHtml").innerHTML = `<span class="kw">HTTP/1.1 200 OK</span>
Content-Type: <span class="d">text/html; charset=UTF-8</span>

<span class="d">&lt;table class=</span><span class="s">"gridTable"</span><span class="d"> width=</span><span class="s">"680"</span><span class="d"> cellpadding=</span><span class="s">"2"</span><span class="d">&gt;</span>
 <span class="d">&lt;tr&gt;&lt;td class=</span><span class="s">"hdr"</span><span class="d">&gt;</span>Subject<span class="d">&lt;/td&gt;</span>
     <span class="d">&lt;td class=</span><span class="s">"hdr"</span><span class="d">&gt;</span>Units<span class="d">&lt;/td&gt;&lt;/tr&gt;</span>
 <span class="d">&lt;tr&gt;&lt;td&gt;</span>ITENT 45<span class="d">&lt;/td&gt;&lt;td align=</span><span class="s">"center"</span><span class="d">&gt;</span>3<span class="d">&lt;/td&gt;&lt;/tr&gt;</span>
 <span class="d">&lt;tr&gt;&lt;td&gt;</span>CSCI 21<span class="d">&lt;/td&gt;&lt;td align=</span><span class="s">"center"</span><span class="d">&gt;</span>3<span class="d">&lt;/td&gt;&lt;/tr&gt;</span>
<span class="d">&lt;/table&gt;</span>

<span class="c">// the data is in there. so is the layout,</span>
<span class="c">// the column order and the table width.</span>`;

$("#enlistJson").innerHTML = `<span class="kw">HTTP/1.1 200 OK</span>
Content-Type: <span class="d">application/json</span>

{<span class="s">"enrollments"</span>: [
  {<span class="s">"code"</span>: <span class="s">"ITENT 45"</span>, <span class="s">"units"</span>: 3},
  {<span class="s">"code"</span>: <span class="s">"CSCI 21"</span>,  <span class="s">"units"</span>: 3}
]}

<span class="c">// no opinion about how it looks.</span>
<span class="c">// the browser, the iPhone and the</span>
<span class="c">// Android app each decide that.</span>`;

const DRIFT={days:7, breaking:false};
const PLATFORMS=[
 {n:"Web", f:d=>Math.min(1, d<0.5?d*2:1), note:"next reload"},
 {n:"iOS", f:d=>0.94*(1-Math.exp(-d/11)), note:"App Store"},
 {n:"Android", f:d=>0.86*(1-Math.exp(-d/19)), note:"Play Store"}
];
function renderDrift(){
  const d=DRIFT.days;
  const rows=PLATFORMS.map(p=>{
    const nw=p.f(d), old=1-nw;
    return {n:p.n, note:p.note, nw, old};
  });
  $("#driftBars").innerHTML=rows.map(r=>{
    const broke = DRIFT.breaking && r.old>0.01;
    return `<div class="dr${broke?" bad":""}">
      <span class="dn">${r.n} <span style="color:var(--faint)">· ${r.note}</span></span>
      <div class="dbar">
        <i class="new" style="width:${(r.nw*100).toFixed(1)}%"></i>
        <i class="old" style="width:${(r.old*100).toFixed(1)}%"></i>
      </div>
      <span class="dv">${(r.old*100).toFixed(0)}% old</span>
    </div>`;
  }).join("");

  const worstOld=Math.max(...rows.map(r=>r.old));
  const mobileOld=(rows[1].old+rows[2].old)/2;
  const v=$("#driftVerdict");
  if(!DRIFT.breaking){
    v.className="verdict ok";
    v.innerHTML=`<b>Nothing is broken, on any curve</b>You added a field and removed nothing. Old clients decode the response, ignore the key they have never heard of, and carry on. This is why the rule on a public API is <em>additive changes only</em>. You can add for free, and you can almost never take away.`;
  } else if(d===0){
    v.className="verdict warn";
    v.innerHTML=`<b>You shipped it a moment ago</b>Everyone is still on the old build, which is what you would expect on day zero. Nothing has gone wrong yet. Drag the slider and watch who catches up, and who does not.`;
  } else if(worstOld<0.05){
    v.className="verdict warn";
    v.innerHTML=`<b>Day ${d}. The tail is thin, but it is still there</b>Around ${(mobileOld*100).toFixed(0)}% of mobile users remain on the old build and are still failing. Web went clean within a day. If you must break something, this is roughly how long you wait before switching the old path off, and you keep serving both until then.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>Day ${d}, ${(mobileOld*100).toFixed(0)}% of mobile users are broken right now</b>You renamed or removed a field, and every app copy expecting the old shape fails on it. You cannot patch them; they have to update, and many will not for weeks. Web users were fine within hours. This bug is easy to miss in testing for that reason. Versioning the endpoint (<code>/api/v2/courses</code>) or leaving the old field in place alongside the new one both avoid this entirely.`;
  }
}
$("#sDays").oninput=e=>{DRIFT.days=+e.target.value;$("#vDays").textContent=DRIFT.days+" days";renderDrift()};
function setDrift(breaking){
  DRIFT.breaking=breaking;
  $("#tgBreak").setAttribute("aria-pressed",breaking);
  $("#tgAdd").setAttribute("aria-pressed",!breaking);
  renderDrift();
}
$("#tgBreak").onclick=()=>setDrift(true);
$("#tgAdd").onclick=()=>setDrift(false);
$("#sDays").dispatchEvent(new Event("input"));

/* ================= 07 RENDERING & PAYLOADS ================= */
const DATA_CHARS=49;                 // the eight values, without any packaging
const FMTS=[
 {id:"json", n:"JSON", bytes:144,
  body:`{<span class="s">"courses"</span>:[
  {<span class="s">"code"</span>:<span class="s">"ITENT 45"</span>,<span class="s">"title"</span>:<span class="s">"Application Dev"</span>,<span class="s">"units"</span>:3,<span class="s">"slots"</span>:4},
  {<span class="s">"code"</span>:<span class="s">"CSCI 21"</span>,<span class="s">"title"</span>:<span class="s">"Data Structures"</span>,<span class="s">"units"</span>:3,<span class="s">"slots"</span>:0}
]}`,
  v:`<b>144 bytes, 34% of it your data</b>The lightest of the three, and the only one that maps straight onto the objects a program already has. Look at what it cannot do: there is no way to say that <code>units</code> must be a number between 1 and 6. JSON carries values, not rules.`},
 {id:"xml", n:"XML", bytes:264,
  body:`<span class="d">&lt;?xml version="1.0" encoding="UTF-8"?&gt;</span>
<span class="d">&lt;courses&gt;</span>
  <span class="d">&lt;course&gt;&lt;code&gt;</span>ITENT 45<span class="d">&lt;/code&gt;&lt;title&gt;</span>Application Dev<span class="d">&lt;/title&gt;</span>
          <span class="d">&lt;units&gt;</span>3<span class="d">&lt;/units&gt;&lt;slots&gt;</span>4<span class="d">&lt;/slots&gt;&lt;/course&gt;</span>
  <span class="d">&lt;course&gt;&lt;code&gt;</span>CSCI 21<span class="d">&lt;/code&gt;&lt;title&gt;</span>Data Structures<span class="d">&lt;/title&gt;</span>
          <span class="d">&lt;units&gt;</span>3<span class="d">&lt;/units&gt;&lt;slots&gt;</span>0<span class="d">&lt;/slots&gt;&lt;/course&gt;</span>
<span class="d">&lt;/courses&gt;</span>`,
  v:`<b>264 bytes, 19% of it your data</b>Nearly twice JSON, because every value is wrapped in a name twice over. In exchange you get something JSON has no answer for: an XML schema can state that <code>units</code> is an integer from 1 to 6, and a parser will reject anything else before your code sees it. That is why banks and government systems still run on it.`},
 {id:"html", n:"HTML", bytes:385,
  body:`<span class="d">&lt;table class="gridTable" width="680" cellpadding="2"&gt;</span>
  <span class="d">&lt;tr&gt;&lt;td class="hdr"&gt;</span>Subject<span class="d">&lt;/td&gt;&lt;td class="hdr"&gt;</span>Title<span class="d">&lt;/td&gt;</span>
      <span class="d">&lt;td class="hdr"&gt;</span>Units<span class="d">&lt;/td&gt;&lt;td class="hdr"&gt;</span>Slots<span class="d">&lt;/td&gt;&lt;/tr&gt;</span>
  <span class="d">&lt;tr&gt;&lt;td&gt;</span>ITENT 45<span class="d">&lt;/td&gt;&lt;td&gt;</span>Application Dev<span class="d">&lt;/td&gt;</span>
      <span class="d">&lt;td align="center"&gt;</span>3<span class="d">&lt;/td&gt;&lt;td align="center"&gt;</span>4<span class="d">&lt;/td&gt;&lt;/tr&gt;</span>
  <span class="d">&lt;tr&gt;&lt;td&gt;</span>CSCI 21<span class="d">&lt;/td&gt;&lt;td&gt;</span>Data Structures<span class="d">&lt;/td&gt;</span>
      <span class="d">&lt;td align="center"&gt;</span>3<span class="d">&lt;/td&gt;&lt;td align="center"&gt;</span>0<span class="d">&lt;/td&gt;&lt;/tr&gt;</span>
<span class="d">&lt;/table&gt;</span>`,
  v:`<b>385 bytes, 13% of it your data</b>The heaviest, and the only one carrying decisions that have nothing to do with the courses: a table width, a cell padding, which column comes first. A phone cannot use any of it. This is the server-rendered response from panel 06, measured.`}
];
let fmtSel="json";
function renderFmt(){
  $("#fmtPick").innerHTML=FMTS.map(f=>
    `<button data-f="${f.id}" aria-pressed="${f.id===fmtSel}">${f.n}</button>`).join("");
  $$("#fmtPick button").forEach(el=>el.onclick=()=>{fmtSel=el.dataset.f;renderFmt()});

  const f=FMTS.find(x=>x.id===fmtSel);
  $("#fmtBody").innerHTML=f.body;
  const max=Math.max(...FMTS.map(x=>x.bytes));
  $("#fmtBars").innerHTML=FMTS.map(x=>{
    const w=x.bytes/max*100, dataW=DATA_CHARS/x.bytes*100;
    return `<div class="sb${x.id===fmtSel?" sel":""}">
      <span class="nm">${x.n}</span>
      <div class="lane"><div class="bar" style="width:${w}%">
        <i class="data" style="width:${dataW}%"></i><i class="over" style="width:${100-dataW}%"></i>
      </div></div>
      <span class="amt">${x.bytes} B</span></div>`;
  }).join("");
  $("#fmtVerdict").className="verdict "+(fmtSel==="json"?"ok":fmtSel==="html"?"bad":"warn");
  $("#fmtVerdict").innerHTML=f.v;
}
renderFmt();

/* ---- how much travels over a session ---- */
const NAV={pages:7};
const KB=n=>n>=1024?(n/1024).toFixed(1)+" MB":Math.round(n)+" KB";
function navModel(){
  const n=NAV.pages;
  return {mpa:95+45*(n-1), spa:313+4*(n-1), n};
}
function renderNav(){
  const m=navModel(), max=Math.max(m.mpa,m.spa);
  $("#navBars").innerHTML=[
    ["Server-rendered", m.mpa, "var(--req)"],
    ["Single-page app", m.spa, "var(--res)"]
  ].map(([n,v,c])=>`<div class="sb">
      <span class="nm">${n}</span>
      <div class="lane"><div class="bar" style="width:${v/max*100}%"><i style="width:100%;background:${c}"></i></div></div>
      <span class="amt">${KB(v)}</span></div>`).join("");

  const set=(id,v,hot,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot);g.classList.toggle("good",!!good)};
  set("#ngFirst","95 vs 313 KB",false,false);
  set("#ngTotal",`${KB(m.mpa)} / ${KB(m.spa)}`,false,false);
  const spaWins=m.spa<m.mpa;
  set("#ngWho", spaWins?"single-page":"server-rendered", false, true);

  const v=$("#navVerdict");
  if(m.n<=2){
    v.className="verdict warn";
    v.innerHTML=`<b>At ${m.n} page${m.n===1?"":"s"}, the bundle never pays for itself</b>The single-page app shipped ${KB(m.spa)} to show what the server-rendered version showed in ${KB(m.mpa)}, and it showed it later, because nothing appears until the JavaScript has downloaded and run. Most visitors to most sites look at one or two pages. Check your analytics before you assume otherwise.`;
  } else if(!spaWins){
    v.className="verdict warn";
    v.innerHTML=`<b>Still ahead: server-rendered, by ${KB(m.spa-m.mpa)}</b>The bundle is a fixed cost paid up front and it has not been amortized yet. Keep dragging.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>Single-page app ahead by ${KB(m.mpa-m.spa)}</b>Past about seven pages the 4 KB navigations win, and the gap widens with every click after. This is why the model suits tools people sit inside, and why it suits a brochure site badly. The first screen is still slower, and no amount of clicking fixes that.`;
  }
}
$("#sPages").oninput=e=>{NAV.pages=+e.target.value;$("#vPages").textContent=NAV.pages;renderNav()};
$("#sPages").dispatchEvent(new Event("input"));

/* ================= 07 CHECKOUT ================= */
const PARTIES=[
 {id:"pBrowser", n:"Party 1", h:"The browser", r:"the shopper's device",
  p:"Runs code you wrote but do not control.", card:"sees the card", cls:"see-yes"},
 {id:"pApi", n:"Party 2", h:"Your API", r:"your server process",
  p:"Holds your order data and your secret key.", card:"never sees the card", cls:"see-no"},
 {id:"pGw", n:"Party 3", h:"Payment gateway", r:"PayMongo, Stripe, Xendit",
  p:"Carrying card data safely is their whole business.", card:"sees the card", cls:"see-yes"},
 {id:"pBank", n:"Party 4", h:"Bank / network", r:"outside your system",
  p:"Where money actually moves. Minutes to days.", card:"sees the card", cls:"see-yes"}
];
PARTIES.forEach(p=>{
  const el=$("#"+p.id); if(!el) return;
  el.innerHTML=`
    <div class="pn">${p.n}</div><h4>${p.h}</h4>
    <div class="prole">${p.r}</div><p>${p.p}</p>
    <span class="card-see ${p.cls}">${p.card}</span>`;
});

const PAYFLOW=[
 {k:"browser", hop:"BROWSER → YOUR API", dir:"out", h:"The shopper loads their cart",
  x:"Ordinary request, exactly like panel 04. Nothing about payment yet.",
  l:"nothing new here",
  a:`<span class="kw">GET</span> /api/cart HTTP/1.1
Cookie: sessionid=8f2a...

<span class="kw">200 OK</span>
{<span class="s">"items"</span>: [{<span class="s">"sku"</span>:<span class="s">"SHOE-42"</span>, <span class="s">"price"</span>: 129900}], <span class="s">"total"</span>: 129900}`},

 {k:"gateway", hop:"BROWSER → GATEWAY (your server is not here)", dir:"out", h:"The card goes straight to the gateway",
  x:"This is the step people get wrong. The card number never travels to your server. The browser posts it directly to the gateway, using a publishable key that is safe to ship in your JavaScript.",
  l:"note the host, it is not yours",
  a:`<span class="kw">POST</span> https://api.gateway.com/v1/tokens
Authorization: Bearer <span class="s">pk_live_...</span>   <span class="c">// publishable, public by design</span>

{<span class="s">"number"</span>: <span class="s">"4242 4242 4242 4242"</span>,
 <span class="s">"exp"</span>: <span class="s">"09/28"</span>, <span class="s">"cvc"</span>: <span class="s">"123"</span>}`},

 {k:"browser", hop:"GATEWAY → BROWSER", dir:"in", h:"A token comes back",
  x:"An opaque handle standing in for the card. Stolen on its own it is close to useless: it is single-use and only your secret key can charge it.",
  l:"what your server will actually receive",
  a:`<span class="kw">201 Created</span>
{<span class="s">"id"</span>: <span class="s">"tok_1a2b3c"</span>, <span class="s">"last4"</span>: <span class="s">"4242"</span>, <span class="s">"brand"</span>: <span class="s">"visa"</span>}`},

 {k:"server", hop:"BROWSER → YOUR API", dir:"out", h:"The order request reaches you",
  x:"Now your server joins in. It gets the token and the cart, never the card. Note the idempotency key. The browser generated one UUID for this checkout and will resend the same one on every retry.",
  l:"the request your view handles",
  a:`<span class="kw">POST</span> /api/orders HTTP/1.1
<span class="kw">Idempotency-Key</span>: 7c3f9e1a-4b8d-42f6-9c11-a2d5e8b7f014
Content-Type: application/json

{<span class="s">"token"</span>: <span class="s">"tok_1a2b3c"</span>, <span class="s">"cart_id"</span>: 5512}`},

 {k:"gateway", hop:"YOUR API → GATEWAY", dir:"out", h:"Your server becomes the client",
  x:"Here is the inversion. Your API is now doing what the browser did in panel 04, building a request, setting headers, waiting on a response. Same protocol, same verbs. The secret key never leaves your server.",
  l:"outbound from your view function",
  a:`<span class="kw">POST</span> https://api.gateway.com/v1/charges
Authorization: Bearer <span class="s">sk_live_...</span>   <span class="c">// SECRET. server-side only</span>
<span class="kw">Idempotency-Key</span>: 7c3f9e1a-4b8d-42f6-9c11-a2d5e8b7f014

{<span class="s">"amount"</span>: 129900, <span class="s">"currency"</span>: <span class="s">"PHP"</span>, <span class="s">"source"</span>: <span class="s">"tok_1a2b3c"</span>}`},

 {k:"gateway", hop:"GATEWAY → YOUR API", dir:"in", h:"Pending, not paid",
  x:"Cards authorize in about a second. GCash, Maya and over-the-counter can take minutes or hours. Treating this response as final is one of the most common bugs in student e-commerce projects.",
  l:"read the status field carefully",
  a:`<span class="kw">200 OK</span>
{<span class="s">"id"</span>: <span class="s">"ch_9f8e7d"</span>, <span class="s">"status"</span>: <span class="s">"pending"</span>, <span class="s">"amount"</span>: 129900}`},

 {k:"browser", hop:"YOUR API → BROWSER", dir:"in", h:"You answer the shopper",
  x:"You created an order, so 201 with a Location header, exactly as panel 05 laid out. The status is honest: awaiting payment, not paid.",
  l:"back to the shopper",
  a:`<span class="kw">201 Created</span>
Location: /api/orders/8891

{<span class="s">"id"</span>: 8891, <span class="s">"status"</span>: <span class="s">"awaiting_payment"</span>}`},

 {k:"bank", hop:"GATEWAY → BANK  (nothing to do with you)", dir:"out", h:"Settlement happens out of your sight",
  x:"The gateway now moves real money across bank rails. This is why step 6 said pending rather than paid: cards authorize in about a second, but e-wallets and over-the-counter can take minutes or hours, and none of it is under your control.",
  l:"you have no visibility here at all",
  a:`<span class="c">gateway → acquiring bank → card network → issuing bank</span>\n<span class="c">seconds for cards. minutes to days for everything else.</span>\n\n<span class="c">your process is not waiting on this. it already answered.</span>`},
 {k:"server", hop:"GATEWAY → YOUR API  (roles inverted)", dir:"out", h:"The gateway calls you",
  x:"Minutes later, settlement completes and the gateway posts to an endpoint you published. You are the server in this conversation and they are the client. Anyone on the internet can also post here, so the signature matters.",
  l:"the webhook, and the header that protects it",
  a:`<span class="kw">POST</span> /webhooks/payments HTTP/1.1
<span class="kw">Gateway-Signature</span>: t=1723,v1=5f2c8a91b...

{<span class="s">"type"</span>: <span class="s">"charge.succeeded"</span>, <span class="s">"data"</span>: {<span class="s">"id"</span>: <span class="s">"ch_9f8e7d"</span>}}`},

 {k:"server", hop:"INSIDE YOUR API", dir:"out", h:"Verify, then mark it paid",
  x:"Recompute the signature with your webhook secret and compare. Only then update the order. Skip this check and anyone can mark their own order paid with one curl command.",
  l:"the check that has to be there",
  a:`expected = hmac_sha256(webhook_secret, raw_body)
<span class="kw">if</span> not compare_digest(expected, header_sig):
    <span class="kw">return</span> HttpResponse(status=<span class="s">400</span>)   <span class="c"># forged</span>

order.status = <span class="s">"paid"</span>
order.save()`}
];
let pyI=0, pyTimer=null;

/* which box the payload is at after each step, and which pipe carried it */
const PAY_AT = ["pApi","pGw","pBrowser","pApi","pGw","pApi","pBrowser","pBank","pApi","pApi"];
const PAY_SEG = [
 {lane:"A",dir:"fwd", p:"GET /api/cart"},
 {lane:"X",dir:"fwd", p:"card number"},          // bypass, browser -> gateway
 {lane:"X",dir:"back",p:"tok_1a2b3c"},           // bypass, gateway -> browser
 {lane:"A",dir:"fwd", p:"token + idempotency key"},
 {lane:"B",dir:"fwd", p:"charge tok_1a2b3c"},
 {lane:"B",dir:"back",p:"status: pending"},
 {lane:"A",dir:"back",p:"201 awaiting_payment"},
 {lane:"C",dir:"fwd", p:"settle \u20b11,299"},
 {lane:"C",dir:"back",p:"charge.succeeded"},
 null
];
function layoutBypass(){
  const flow=$("#pflow"), bp=$("#bypass");
  if(!flow||!bp) return;
  const fb=flow.getBoundingClientRect();
  const a=$("#pBrowser").getBoundingClientRect(), b=$("#pGw").getBoundingClientRect();
  if(pflowStacked()){ bp.style.display="none"; return; }
  bp.style.display="block";
  const x1=a.left-fb.left+a.width/2, x2=b.left-fb.left+b.width/2;
  bp.style.left=x1+"px"; bp.style.width=(x2-x1)+"px";
  bp.style.top=(a.bottom-fb.top+26)+"px";
}
// below ~1020px the grid collapses to one column, so every box shares a centre x
function pflowStacked(){
  const a=$("#pBrowser").getBoundingClientRect(), b=$("#pBank").getBoundingClientRect();
  return Math.abs((a.left+a.width/2)-(b.left+b.width/2)) < 20;
}
function placePayBall(i){
  const flow=$("#pflow"), ball=$("#payBall");
  if(!flow||!ball) return;
  const fb=flow.getBoundingClientRect();
  const seg=PAY_SEG[i];
  const target=$("#"+(PAY_AT[i]||"pApi")).getBoundingClientRect();
  ball.style.left=(target.left-fb.left+target.width/2)+"px";
  if(pflowStacked()){
    // stacked: ride the right edge of whichever box currently holds the payload
    ball.style.left=(target.right-fb.left-14)+"px";
    ball.style.top =(target.top-fb.top+target.height/2)+"px";
  } else if(seg && seg.lane==="X"){          // riding the bypass
    ball.style.top=(parseFloat($("#bypass").style.top)||0)+"px";
  } else {
    const back = seg && seg.dir==="back";
    ball.style.top=($(back?"#prailAb":"#prailAf").getBoundingClientRect().top-fb.top+1)+"px";
  }
  ball.classList.toggle("res", !!(seg && seg.dir==="back"));
}
function renderPay(){
  const s=PAYFLOW[pyI];
  $("#pyStep").textContent=`Step ${pyI+1} of ${PAYFLOW.length}`;
  const hop=$("#pyHop"); hop.textContent=s.hop; hop.className="hop "+s.dir;
  $("#pyTitle").textContent=s.h;
  $("#pyText").textContent=s.x;
  $("#pyLbl").textContent=s.l;
  $("#pyArt").innerHTML=s.a;
  const hereId = PAY_AT[pyI] || "pApi";
  $$("#pflow .pty").forEach(el=>el.classList.toggle("lit", el.id===hereId));

  ["prailAf","prailAb","prailBf","prailBb","prailCf","prailCb"]
    .forEach(id=>$("#"+id).classList.remove("on-req","on-res"));
  ["pcapA","pcapB","pcapC"].forEach(id=>{const c=$("#"+id);c.className="pcap";c.textContent=""});
  $("#bypass").classList.remove("on");

  layoutBypass();
  const seg=PAY_SEG[pyI];
  if(seg){
    if(seg.lane==="X"){
      $("#bypass").classList.add("on");
    } else {
      const fwd=seg.dir==="fwd";
      $("#prail"+seg.lane+(fwd?"f":"b")).classList.add(fwd?"on-req":"on-res");
      const cap=$("#pcap"+seg.lane);
      cap.className="pcap on "+(fwd?"req":"res");
      cap.textContent=seg.p;
    }
  }
  placePayBall(pyI);
}
addEventListener("resize",()=>{ if($(".panel.on")?.id==="p-pay"){ layoutBypass(); placePayBall(pyI); } });

$("#pyNext").onclick=()=>{clearInterval(pyTimer);pyI=Math.min(PAYFLOW.length-1,pyI+1);renderPay()};
$("#pyPrev").onclick=()=>{clearInterval(pyTimer);pyI=Math.max(0,pyI-1);renderPay()};
$("#pyRst").onclick=()=>{clearInterval(pyTimer);pyI=0;renderPay();$("#pyPlay").dataset.on="";$("#pyPlay").textContent="▶ Play flow"};
$("#pyPlay").onclick=e=>{
  clearInterval(pyTimer);
  if(e.target.dataset.on==="1"){e.target.dataset.on="";e.target.textContent="▶ Play flow";return}
  e.target.dataset.on="1"; e.target.textContent="❚❚ Pause";
  pyTimer=setInterval(()=>{
    if(pyI>=PAYFLOW.length-1){clearInterval(pyTimer);$("#pyPlay").dataset.on="";$("#pyPlay").textContent="▶ Play flow";return}
    pyI++; renderPay();
  }, REDUCED?900:3000);
};
renderPay();

/* ---- the same charge request, three ways ---- */
const CHG_DATA=37;
const WHYF=[
 {id:"json", n:"JSON", bytes:91,
  body:`{<span class="s">"amount"</span>:129900,<span class="s">"currency"</span>:<span class="s">"PHP"</span>,
 <span class="s">"source"</span>:<span class="s">"tok_1a2b3c"</span>,
 <span class="s">"description"</span>:<span class="s">"ITENT 45 enrolment"</span>}`,
  cls:"ok",
  v:`<b>91 bytes, and it is already an object on both sides</b>Your Python reads <code>data["amount"]</code>, their Node reads <code>data.amount</code>, and neither had to be taught anything. Panel 02 showed a reply this size arrives with 54 bytes of headers on it, so the packaging already costs more than the message. Making it six times larger would be a real decision, not a free one.`},
 {id:"soap", n:"SOAP / XML", bytes:557,
  body:`<span class="d">&lt;?xml version="1.0" encoding="UTF-8"?&gt;</span>
<span class="d">&lt;soap:Envelope xmlns:soap=</span><span class="s">"http://schemas.xmlsoap.org/soap/envelope/"</span>
<span class="d">               xmlns:pay=</span><span class="s">"https://gateway.example.com/schema/payments/v2"</span><span class="d">&gt;</span>
  <span class="d">&lt;soap:Header&gt;</span>
    <span class="d">&lt;pay:Credentials&gt;&lt;pay:MerchantId&gt;</span>M-4471<span class="d">&lt;/pay:MerchantId&gt;&lt;/pay:Credentials&gt;</span>
  <span class="d">&lt;/soap:Header&gt;</span>
  <span class="d">&lt;soap:Body&gt;</span>
    <span class="d">&lt;pay:CreateChargeRequest&gt;</span>
      <span class="d">&lt;pay:Amount currency=</span><span class="s">"PHP"</span><span class="d">&gt;</span>129900<span class="d">&lt;/pay:Amount&gt;</span>
      <span class="d">&lt;pay:Source&gt;</span>tok_1a2b3c<span class="d">&lt;/pay:Source&gt;</span>
      <span class="d">&lt;pay:Description&gt;</span>ITENT 45 enrolment<span class="d">&lt;/pay:Description&gt;</span>
    <span class="d">&lt;/pay:CreateChargeRequest&gt;</span>
  <span class="d">&lt;/soap:Body&gt;</span>
<span class="d">&lt;/soap:Envelope&gt;</span>`,
  cls:"warn",
  v:`<b>557 bytes, six times JSON, and not stupid</b>Only 7% of that is the four values you meant to send. The rest is namespaces, an envelope and a header block. What you get back is a contract a machine can enforce: a schema can reject a negative amount or a made-up currency before your handler ever runs, and the document can be signed as a document. For an integration between two banks that is a fair trade. For a mobile app fetching a course list it is six times the payload for nothing.`},
 {id:"html", n:"HTML", bytes:318,
  body:`<span class="d">&lt;form method=</span><span class="s">"post"</span><span class="d"> action=</span><span class="s">"/charges"</span><span class="d">&gt;</span>
  <span class="d">&lt;input type=</span><span class="s">"hidden"</span><span class="d"> name=</span><span class="s">"amount"</span><span class="d"> value=</span><span class="s">"129900"</span><span class="d">&gt;</span>
  <span class="d">&lt;input type=</span><span class="s">"hidden"</span><span class="d"> name=</span><span class="s">"currency"</span><span class="d"> value=</span><span class="s">"PHP"</span><span class="d">&gt;</span>
  <span class="d">&lt;input type=</span><span class="s">"hidden"</span><span class="d"> name=</span><span class="s">"source"</span><span class="d"> value=</span><span class="s">"tok_1a2b3c"</span><span class="d">&gt;</span>
  <span class="d">&lt;button type=</span><span class="s">"submit"</span><span class="d">&gt;</span>Charge<span class="d">&lt;/button&gt;</span>
<span class="d">&lt;/form&gt;</span>`,
  cls:"bad",
  v:`<b>Wrong shape, not just wrong size</b>This does not state a fact. It describes a control a person could click, which means the gateway would have to parse markup and guess which fields mattered. Now run the flow backwards: at step 9 the gateway sends <em>you</em> a webhook. It has never seen your interface and never will. It has nothing to render into and nothing to render with, so the only thing it can send is data. Panel 06's server-rendered counterexample is this same mistake, made by a system that got away with it for twenty years because it only ever had one client.`}
];
let whySel="json";
function renderWhy(){
  $("#whyPick").innerHTML=WHYF.map(f=>
    `<button data-f="${f.id}" aria-pressed="${f.id===whySel}">${f.n}</button>`).join("");
  $$("#whyPick button").forEach(el=>el.onclick=()=>{whySel=el.dataset.f;renderWhy()});
  const f=WHYF.find(x=>x.id===whySel);
  $("#whyBody").innerHTML=f.body;
  const max=Math.max(...WHYF.map(x=>x.bytes));
  $("#whyBars").innerHTML=WHYF.map(x=>{
    const w=x.bytes/max*100, d=CHG_DATA/x.bytes*100;
    return `<div class="sb${x.id===whySel?" sel":""}">
      <span class="nm">${x.n}</span>
      <div class="lane"><div class="bar" style="width:${w}%">
        <i class="data" style="width:${d}%"></i><i class="over" style="width:${100-d}%"></i>
      </div></div>
      <span class="amt">${x.bytes} B</span></div>`;
  }).join("");
  $("#whyVerdict").className="verdict "+f.cls;
  $("#whyVerdict").innerHTML=f.v;
}
renderWhy();

/* ---- double-charge demo ---- */
const PRICE=1299;
let attempts=[], idemOn=false, idemKey="7c3f9e1a", firstCharge=null, chgSeq=0;
function renderCharges(){
  $("#chgList").innerHTML = attempts.length ? attempts.map((a,i)=>`
    <div class="chg ${a.reused?"reuse":(i>0?"dup":"")}">
      <span>click ${i+1}</span>
      <span class="cid">${a.id}</span>
      <span>${a.reused?"reused":"₱"+PRICE.toLocaleString()+" charged"}</span>
    </div>`).join("")
    : `<div style="font-size:.78em;color:var(--faint);padding:10px 2px">No attempts yet. Press Pay.</div>`;
  const charged = attempts.filter(a=>!a.reused).length*PRICE;
  $("#chgAmt").textContent="₱"+charged.toLocaleString();
  const t=$("#chgTotal");
  t.className="total"+(charged>PRICE?" bad":charged>0?" good":"");

  $("#idemArt").innerHTML = idemOn
    ? `<span class="kw">POST</span> /api/orders
<span class="kw">Idempotency-Key</span>: ${idemKey}-4b8d-42f6-9c11`
    : `<span class="kw">POST</span> /api/orders
<span class="c">// no idempotency key sent</span>`;

  const n=$("#idemNote");
  if(!attempts.length){
    n.innerHTML= idemOn
      ? "The key is generated once, when the checkout page loads, not per click. Guests can be created and destroyed in seconds."
      : "Press Pay a few times, the way an impatient shopper on a slow connection would.";
  } else if(charged>PRICE){
    n.innerHTML=`<b style="color:var(--warn)">${attempts.length} clicks, ${attempts.filter(a=>!a.reused).length} separate charges.</b> The shopper paid ₱${charged.toLocaleString()} for a ₱${PRICE.toLocaleString()} pair of shoes. Every click was a valid, well-formed POST, and the server did exactly what it was told each time. Nothing here is a bug you can find by reading your own code.`;
  } else if(idemOn && attempts.length>1){
    n.innerHTML=`<b style="color:var(--res)">${attempts.length} clicks, one charge.</b> The gateway recognized the repeated key and returned the original charge instead of making a new one. This is how every real payment API solves it, and the reason POST being non-idempotent is worth understanding instead of reciting.`;
  } else {
    n.innerHTML="One click, one charge. Now press it again a few times and watch what happens.";
  }
}
$("#payGo").onclick=()=>{
  if(idemOn && firstCharge){ attempts.push({id:firstCharge, reused:true}); }
  else { chgSeq++; const id="ch_"+Math.random().toString(36).slice(2,8);
         if(idemOn && !firstCharge) firstCharge=id;
         attempts.push({id, reused:false}); }
  renderCharges();
};
$("#payReset").onclick=()=>{
  attempts=[]; firstCharge=null;
  idemKey=Math.random().toString(16).slice(2,10);
  renderCharges();
};
$("#tgIdem").onclick=()=>{
  idemOn=!idemOn; $("#tgIdem").setAttribute("aria-pressed",idemOn);
  attempts=[]; firstCharge=null; renderCharges();
};
renderCharges();

/* ================= 08 MEMORY BUDGET ================= */
const MEM={ram:2048, workers:8, per:90, inflight:8, db:true, preload:false};
const OS_MB=350, NGINX_MB=20, HEADROOM=0.15;

function memModel(){
  const dbMB = MEM.db ? Math.min(1024, Math.max(256, Math.round(MEM.ram*0.2))) : 0;
  // preloading forks after import, so code pages are shared until written to
  const perW = MEM.preload ? Math.round(MEM.per*0.62) : MEM.per;
  const shared = MEM.preload ? Math.round(MEM.per*0.38) : 0;
  const workers = MEM.workers*perW + shared;
  const reqs = MEM.workers*MEM.inflight;      // one in-flight request per worker
  const used = OS_MB + NGINX_MB + dbMB + workers + reqs;
  const safe = MEM.ram*(1-HEADROOM);
  const budget = safe - OS_MB - NGINX_MB - dbMB - shared;
  const maxW = Math.max(0, Math.floor(budget/(perW+MEM.inflight)));
  return {dbMB, perW, shared, workers, reqs, used, safe, maxW,
          free: MEM.ram-used, over: used>MEM.ram, tight: used>safe};
}
function renderMem(){
  try{ renderOff(); }catch(e){}
  const m=memModel();
  const scale=Math.max(MEM.ram, m.used);
  const pct=v=>(v/scale*100);

  const segs=[
    ["s-os","OS &amp; system services",OS_MB],
    ["s-nginx","nginx",NGINX_MB],
    ["s-db","Postgres",m.dbMB],
    ["s-work","Workers",m.workers],
    ["s-req","In-flight requests",m.reqs],
    ["s-free","Free",Math.max(0,m.free)]
  ].filter(x=>x[2]>0);

  $("#ramBar").innerHTML = segs.map(([c,n,v])=>{
    const w=pct(v);
    return `<div class="seg2 ${c}" style="width:${w}%" title="${n}: ${v} MB">${w>9?Math.round(v)+" MB":""}</div>`;
  }).join("");
  const oldLine=$(".ramline"); if(oldLine) oldLine.remove();
  if(m.used>MEM.ram){
    const bar=$("#ramBar").getBoundingClientRect();
    const line=document.createElement("div");
    line.className="ramline";
    line.style.left=`calc(${pct(MEM.ram)}% * ${bar.width/ $(".ramwrap").getBoundingClientRect().width} )`;
    line.style.left=`${pct(MEM.ram)}%`;
    $(".ramwrap").appendChild(line);
  }

  const cols={"s-os":"var(--faint)","s-nginx":"var(--line3)","s-db":"var(--res)",
              "s-work":"var(--req)","s-req":"var(--req-soft)","s-free":"var(--line2)"};
  $("#ramLegend").innerHTML = [
    ["s-os","Operating system",OS_MB],
    ["s-nginx","nginx",NGINX_MB],
    ["s-db","Postgres",m.dbMB],
    ["s-work",`${MEM.workers} workers`,m.workers],
    ["s-req","In-flight requests",m.reqs],
    ["s-free", m.free>=0?"Free":"Over capacity", Math.abs(m.free)]
  ].filter(x=>x[2]>0||x[0]==="s-free").map(([c,n,v])=>
    `<div class="lg"><i style="background:${cols[c]}"></i>${n}<b${m.free<0&&c==="s-free"?' style="color:var(--warn)"':""}>${m.free<0&&c==="s-free"?"−":""}${Math.round(v)} MB</b></div>`
  ).join("");

  $("#maxW").innerHTML = `${m.maxW} worker${m.maxW===1?"":"s"} fit in ${(MEM.ram/1024).toFixed(1)} GB` +
    (MEM.workers>m.maxW ? `. You have set ${MEM.workers}` : "");

  const v=$("#ramVerdict");
  if(m.over){
    v.className="verdict bad";
    v.innerHTML=`<b>Out of memory, ${Math.abs(Math.round(m.free))} MB over</b>The kernel does not politely refuse. It picks a process and kills it, and the process it picks is usually the biggest one, which is one of your workers. Requests in flight on that worker vanish. Drop to ${m.maxW} worker${m.maxW===1?"":"s"}, cut what each one loads, or buy more RAM.`;
  } else if(m.tight){
    v.className="verdict warn";
    v.innerHTML=`<b>Only ${Math.round(m.free)} MB free</b>It fits, but there is nothing left for the disk cache, and every file the system reads now comes off the disk instead of from memory. The box will feel slow long before it runs out. ${m.maxW} worker${m.maxW===1?"":"s"} is the number that leaves proper headroom.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>Comfortable, ${Math.round(m.free)} MB free</b>${MEM.workers} workers, ${m.perW} MB each${MEM.preload?" after preload sharing":""}, on top of ${OS_MB+NGINX_MB+m.dbMB} MB the box was already using before your code existed. You could go to ${m.maxW} worker${m.maxW===1?"":"s"} before headroom disappears.`;
  }
}
let simReady=false;   // panel 18 state is declared later in this script
function syncMemLink(){ if(simReady && typeof updateGauges==="function") updateGauges(); }
const bindM=(sel,key,fmt,lbl)=>{
  $(sel).oninput=e=>{MEM[key]=+e.target.value;$(lbl).textContent=fmt(MEM[key]);renderMem();syncMemLink()};
  $(sel).dispatchEvent(new Event("input"));
};
bindM("#sRam2","ram",v=>v>=1024?(v/1024).toFixed(1).replace(/\.0$/,"")+" GB":v+" MB","#vRam2");
bindM("#sW2","workers",v=>v,"#vW2");
bindM("#sPer","per",v=>v+" MB","#vPer");
bindM("#sInflight","inflight",v=>v+" MB","#vInflight");
$("#tgDb2").onclick=()=>{MEM.db=!MEM.db;$("#tgDb2").setAttribute("aria-pressed",MEM.db);renderMem();syncMemLink()};
$("#tgPre").onclick=()=>{MEM.preload=!MEM.preload;$("#tgPre").setAttribute("aria-pressed",MEM.preload);renderMem();syncMemLink()};
renderMem();

/* ---- moving Postgres onto its own machine ---- */
const OFF_HR_PER_GB=0.75, OFF_MO=720, OFF_Q=2;   // two queries a request
function offModel(){
  const ram=MEM.ram, per=MEM.per+MEM.inflight;
  const dbMB=Math.min(1024, Math.max(256, Math.round(ram*0.2)));

  const oneFree=Math.max(0, ram-OS_MB-NGINX_MB-dbMB);
  const oneW=Math.floor(oneFree/per);
  const oneQ=dbMB<600 ? 8 : 4;                    // a small cache means more disk
  const oneH=24+OFF_Q*oneQ;
  const oneRps=oneW/(oneH/1000);
  const oneCost=ram/1024*OFF_HR_PER_GB*OFF_MO;

  const twoFree=Math.max(0, ram-OS_MB-NGINX_MB);
  const twoW=Math.floor(twoFree/per);
  const cache=ram-OS_MB-200;
  const twoQ=(cache>1200?2.5:4)+0.4;              // better cache, plus a network hop
  const twoH=24+OFF_Q*twoQ;
  const twoRps=twoW/(twoH/1000);
  const twoCost=2*oneCost;

  return {oneW,oneH,oneRps,oneCost,twoW,twoH,twoRps,twoCost,
          gain:twoRps/Math.max(oneRps,0.001),
          onePer:oneCost/Math.max(oneRps,0.001), twoPer:twoCost/Math.max(twoRps,0.001)};
}
function renderOff(){
  const m=offModel(), peso=n=>"\u20b1"+Math.round(n).toLocaleString();
  const rows=[
    ["Workers that fit", m.oneW, m.twoW, m.twoW>m.oneW?"two":"one"],
    ["Handler time", m.oneH.toFixed(1)+" ms", m.twoH.toFixed(1)+" ms", m.twoH<m.oneH?"two":"one"],
    ["Requests a second", Math.round(m.oneRps), Math.round(m.twoRps), m.twoRps>m.oneRps?"two":"one"],
    ["Cost a month", peso(m.oneCost), peso(m.twoCost), "one"],
    ["Cost per request a second", peso(m.onePer), peso(m.twoPer), m.twoPer<m.onePer?"two":"one"]
  ];
  $("#offBody").innerHTML=rows.map(([l,a,b,win])=>
    `<tr><td>${l}</td>
      <td class="${win==="one"?"y":"n"}">${a}</td>
      <td class="${win==="two"?"y":"n"}">${b}</td></tr>`).join("");

  const v=$("#offVerdict"), gain=m.gain.toFixed(2);
  if(m.twoPer<m.onePer){
    v.className="verdict ok";
    v.innerHTML=`<b>${gain}\u00d7 the requests for 2\u00d7 the machines, and it just about pays</b>At ${(MEM.ram/1024).toFixed(MEM.ram%1024?1:0)} GB the database was crowding the workers out, so handing it its own machine buys back real capacity. Cost per request a second falls from ${peso(m.onePer)} to ${peso(m.twoPer)}. This is the size where the split is easiest to justify on capacity alone.`;
  } else {
    v.className="verdict warn";
    v.innerHTML=`<b>${gain}\u00d7 the requests for 2\u00d7 the bill</b>You doubled the machines and got ${((m.gain-1)*100).toFixed(0)}% more throughput. Cost per request a second went <b class="i">up</b>, from ${peso(m.onePer)} to ${peso(m.twoPer)}. At this size the box was not short of memory, so freeing the database's share bought little, and every query now pays 0.8 ms of network it did not pay before.<br><br>Doubling the RAM on one box would be cheaper than this. Splitting is still often right, just not for the reason on this table.`;
  }
}

/* ================= 09 SERVER SIM ================= */
const cv=$("#simCanvas"), cx=cv.getContext("2d");
let W=0,H=0;
function sizeCanvas(){
  const r=cv.getBoundingClientRect(), d=devicePixelRatio||1;
  W=r.width; H=r.height;
  cv.width=W*d; cv.height=H*d; cx.setTransform(d,0,0,d,0,0);
  drawSim();
}
addEventListener("resize",sizeCanvas);

const S={lam:20,svc:50,workers:4,memReq:12,ram:512};
let queue=[],workers=[],flying=[],done=[],lat=[],
    running=false,acc=0,last=0,tDone=0,tWin=0,dropped=0,thr=0;

function initWorkers(){
  workers=Array.from({length:S.workers},()=>({busy:false,rem:0,req:null,tot:1}));
}
function resetSim(){
  queue=[];flying=[];done=[];lat=[];dropped=0;thr=0;acc=0;tDone=0;tWin=0;
  initWorkers();drawSim();updateGauges();
}
const QMAX=60;
function step(dt){
  // arrivals (Poisson-ish)
  acc += S.lam*dt;
  while(acc>=1){
    acc-=1;
    const memNow=64 + (queue.length+workers.filter(w=>w.busy).length)*S.memReq;
    if(queue.length>=QMAX || memNow+S.memReq>S.ram){
      dropped++; flying.push({x:0,y:0,t:0,dead:true});
    } else {
      queue.push({t:0}); flying.push({x:0,y:0,t:0});
    }
  }
  // age queue
  queue.forEach(q=>q.t+=dt*1000);
  // workers
  workers.forEach(w=>{
    if(w.busy){
      w.rem-=dt*1000;
      if(w.rem<=0){
        w.busy=false;
        lat.push(w.req.t + w.tot);
        if(lat.length>150) lat.shift();
        done.push({x:0,t:0}); tDone++;
      }
    }
    if(!w.busy && queue.length){
      w.req=queue.shift(); w.busy=true; w.rem=S.svc; w.tot=S.svc;
    }
  });
  // moving dots
  flying.forEach(f=>f.t+=dt); flying=flying.filter(f=>f.t<1);
  done.forEach(f=>f.t+=dt);   done=done.filter(f=>f.t<1);
  // throughput window
  tWin+=dt;
  if(tWin>=1){ thr=tDone/tWin; tDone=0; tWin=0; }
}
function drawSim(){
  if(!W) return;
  cx.clearRect(0,0,W,H);
  const padL=14, qX=W*0.24, wX=W*0.55, oX=W*0.86, midY=H/2;

  // rails
  cx.strokeStyle=CSSV("--line"); cx.lineWidth=1;
  cx.beginPath(); cx.moveTo(padL,midY); cx.lineTo(qX-10,midY); cx.stroke();
  cx.beginPath(); cx.moveTo(wX+70,midY); cx.lineTo(oX+30,midY); cx.stroke();

  const lab=(t,x,y)=>{cx.fillStyle=CSSV("--faint");cx.font="600 9px 'IBM Plex Mono',monospace";cx.textAlign="center";cx.fillText(t,x,y)};
  lab("ARRIVING",padL+30,20); lab("QUEUE",qX+18,20); lab("WORKERS",wX+34,20); lab("DONE",oX+14,20);

  // in-flight arrivals
  flying.forEach(f=>{
    const x=padL+f.t*(qX-10-padL);
    cx.fillStyle=f.dead?"var(--warn)":"var(--req)";
    cx.globalAlpha=f.dead?1-f.t:1;
    cx.beginPath(); cx.arc(x, midY + (f.dead?f.t*38:0), 4,0,7); cx.fill();
    cx.globalAlpha=1;
  });

  // queue box
  const qw=54, qh=H-56;
  cx.strokeStyle= queue.length>=QMAX?"var(--warn)":"var(--line2)";
  cx.strokeRect(qX,28,qw,qh);
  const cols=4, cell=11;
  queue.slice(0,48).forEach((q,i)=>{
    const c=i%cols, r=Math.floor(i/cols);
    cx.fillStyle=CSSV("--req"); cx.globalAlpha=Math.min(1,.45+q.t/1500);
    cx.fillRect(qX+6+c*cell, 28+qh-14-r*cell, 7,7);
    cx.globalAlpha=1;
  });
  cx.fillStyle= queue.length>=QMAX?"var(--warn)":"var(--dim)";
  cx.font="600 12px 'IBM Plex Mono',monospace"; cx.textAlign="center";
  cx.fillText(queue.length + (queue.length>=QMAX?" FULL":""), qX+qw/2, H-16);

  // workers
  const bw=68, bh=Math.min(24,(H-64)/Math.max(workers.length,1)-3);
  workers.forEach((w,i)=>{
    const y=34+i*(bh+3);
    if(y+bh>H-24) return;
    cx.strokeStyle=CSSV("--line2"); cx.strokeRect(wX,y,bw,bh);
    if(w.busy){
      const p=1-w.rem/w.tot;
      cx.fillStyle="rgba(255,162,58,.85)";
      cx.fillRect(wX+1,y+1,(bw-2)*p,bh-2);
    }
  });
  if(workers.length*(bh+3)>H-64){
    cx.fillStyle=CSSV("--faint"); cx.font="9px 'IBM Plex Mono',monospace"; cx.textAlign="left";
    cx.fillText(workers.length+" workers", wX, H-10);
  }

  // completed
  done.forEach(f=>{
    const x=wX+70+f.t*(oX+30-(wX+70));
    cx.fillStyle=CSSV("--res"); cx.globalAlpha=1-f.t*.5;
    cx.beginPath(); cx.arc(x,midY,4,0,7); cx.fill(); cx.globalAlpha=1;
  });
}
function p95(){
  if(!lat.length) return 0;
  const s=[...lat].sort((a,b)=>a-b);
  return s[Math.min(s.length-1,Math.floor(s.length*.95))];
}
function updateGauges(){
  const busy=workers.filter(w=>w.busy).length;
  const inFlight=queue.length+busy;
  const mem=64+inFlight*S.memReq;
  const util=workers.length?busy/workers.length*100:0;
  const cap=S.workers/(S.svc/1000);
  const p=p95();

  const set=(id,v,hot,good)=>{
    const g=$(id); g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot); g.classList.toggle("good",!!good);
  };
  set("#gThr",Math.round(thr),false,thr>0);
  set("#gQ",queue.length,queue.length>=QMAX,false);
  set("#gP95",Math.round(p),p>1000,p>0&&p<300);
  set("#gCpu",Math.round(util),util>95,util>0&&util<80);
  set("#gMem",Math.round(mem),mem>S.ram*.9,false);
  set("#gDrop",dropped,dropped>0,false);

  $("#capLine").textContent=`${S.workers} ÷ ${(S.svc/1000).toFixed(3)} s = ${Math.round(cap)} rps`;
  const ml=$("#memLink");
  if(ml && typeof memModel==="function"){
    const mm=memModel(), gb=(MEM.ram/1024).toFixed(1).replace(/\.0$/,"");
    ml.innerHTML = S.workers>mm.maxW
      ? `<span style="color:var(--warn)">Panel 17 said only ${mm.maxW} fit in ${gb} GB, these ${S.workers} would not all start.</span>`
      : `Panel 17 said ${mm.maxW} fit in ${gb} GB of RAM.`;
  }

  const v=$("#verdict"); const rho=S.lam/cap;
  v.className="verdict"+(!running?"":rho<.7?" ok":rho<1?" warn":" bad");
  if(!running){ v.innerHTML="<b>Idle</b>Press Start to send traffic at the server."; return; }
  if(mem>S.ram*.9){
    v.className="verdict bad";
    v.innerHTML=`<b>Out of memory</b>${inFlight} requests in flight × ${S.memReq} MB is past the ${S.ram} MB limit. The kernel starts killing the process. More workers will not help. Each one costs RAM. Cut memory per request, or get a bigger box.`;
  } else if(rho>=1){
    v.innerHTML=`<b>Saturated · ρ = ${rho.toFixed(2)}</b>Arrivals (${S.lam} rps) exceed the ceiling (${Math.round(cap)} rps). The queue grows without bound and latency rises forever while throughput stays pinned at the ceiling. Adding workers or making the handler faster are the only two fixes.`;
  } else if(rho>.7){
    v.innerHTML=`<b>Near the knee · ρ = ${rho.toFixed(2)}</b>Still keeping up, but queueing delay is now the main cost. Past about 70% utilization, latency rises much faster than load. This is why you do not size a box for 100%.`;
  } else {
    v.innerHTML=`<b>Healthy · ρ = ${rho.toFixed(2)}</b>Workers drain the queue faster than requests arrive, so waiting time stays near zero and p95 is close to the handler time itself.`;
  }
}
function loop(ts){
  if(!running) return;
  const dt=Math.min(.05,(ts-last)/1000||0); last=ts;
  step(dt); drawSim(); updateGauges();
  requestAnimationFrame(loop);
}
const bind=(sel,key,fmt,el)=>{
  $(sel).oninput=e=>{
    S[key]=+e.target.value; $(el).textContent=fmt(S[key]);
    if(key==="workers") initWorkers();
    updateGauges(); if(!running) drawSim();
  };
  $(sel).dispatchEvent(new Event("input"));
};
bind("#sLam","lam",v=>v+" rps","#vLam");
bind("#sSvc","svc",v=>v+" ms","#vSvc");
bind("#sW","workers",v=>v,"#vW");
// instances in panel 19 are copies of this box, so its numbers move with this slider
$("#sW").addEventListener("input",()=>{ if(typeof renderScale==="function") renderScale(); });
bind("#sMem","memReq",v=>v+" MB","#vMem");
bind("#sRam","ram",v=>v+" MB","#vRam");

$("#simRun").onclick=e=>{
  running=!running; e.target.textContent=running?"❚❚ Pause":"▶ Start";
  if(running){ last=performance.now(); requestAnimationFrame(loop); } else updateGauges();
};
$("#simReset").onclick=()=>{
  running=false; $("#simRun").textContent="▶ Start"; resetSim();
};

$("#srvCode").innerHTML=
`<span class="c"># The whole thing, with no framework. Run it, then: curl -v localhost:8080/courses</span>
<span class="kw">import</span> socket

srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, <span class="s">1</span>)
srv.bind((<span class="s">"127.0.0.1"</span>, <span class="s">8080</span>))   <span class="c"># claim the port</span>
srv.listen(<span class="s">64</span>)                     <span class="c"># 64 = the queue from the simulation above</span>

<span class="kw">while</span> <span class="s">True</span>:
    conn, addr = srv.accept()      <span class="c"># blocks until a client connects</span>
    raw = conn.recv(<span class="s">65536</span>).decode()  <span class="c"># the exact bytes from panel 03</span>
    <span class="kw">print</span>(raw)                    <span class="c"># <-- put this on the projector</span>

    line = raw.split(<span class="s">"\\r\\n"</span>)[<span class="s">0</span>]
    method, path, _ = line.split(<span class="s">" "</span>)

    body = <span class="s">'{"courses":[{"code":"ITENT 45","units":3}]}'</span>
    conn.sendall((
        <span class="s">"HTTP/1.1 200 OK\\r\\n"</span>
        <span class="s">"Content-Type: application/json\\r\\n"</span>
        <span class="s">f"Content-Length: {len(body)}\\r\\n"</span>
        <span class="s">"\\r\\n"</span>
    ).encode() + body.encode())
    conn.close()                   <span class="c"># no keep-alive: pay the handshake every time</span>`;

sizeCanvas(); resetSim(); simReady=true; syncMemLink();

/* ================= 05 SCALE ================= */
const SC={load:400,inst:1,h:50,rep:0,q:3,lb:false,cache:false,queue:false,sess:false};
const DB_BASE=300, REPLICA_QPS=240, HIT=0.70;
// one instance = one copy of the machine from panels 08 and 09, workers and all
const workersPerInst = () => (typeof S!=="undefined" ? S.workers : 4);

function scaleModel(){
  const h = SC.h * (SC.queue?0.65:1);                 // queue offloads slow work
  const active = SC.lb ? SC.inst : 1;                 // no LB = only one box gets traffic
  const appCap = active * workersPerInst() / (h/1000);
  const hit = SC.cache?HIT:0;
  const perReq = SC.q*(1-hit);                        // db queries per request
  const dbCap = DB_BASE + SC.rep*REPLICA_QPS;
  const dbReqCap = perReq>0 ? dbCap/perReq : Infinity;
  const ceiling = Math.min(appCap,dbReqCap);
  const served = Math.min(SC.load,ceiling);
  return {h,active,appCap,hit,perReq,dbCap,dbReqCap,ceiling,served,
          shed:Math.max(0,SC.load-ceiling), dbLoad:served*perReq,
          neck: appCap<=dbReqCap?"app":"db"};
}
function renderScale(){
  const m=scaleModel();
  // topology
  $("#tClientN").textContent=SC.load;
  $("#tLB").classList.toggle("off",!SC.lb);
  $("#tCache").classList.toggle("off",!SC.cache);
  $("#tCacheN").textContent=SC.cache?"70%":"—";
  $("#tRep").classList.toggle("off",SC.rep===0);
  $("#tRepN").textContent=SC.rep;
  $("#tDBN").textContent=Math.round(m.dbCap);
  $("#tAppN").textContent=Math.round(m.appCap);

  const failing = m.shed>0.5;
  const mark = tier => m.neck===tier ? (failing?"neck":"next") : "fine";

  $("#tApp").innerHTML=Array.from({length:SC.inst},(_,i)=>{
    const live = SC.lb || i===0;
    return `<div class="mini${live&&m.neck==="app"?" "+mark("app"):""}" style="${live?"":"opacity:.2;border-style:dashed"}"></div>`;
  }).join("");
  $("#tAppCap").className="nodebox "+mark("app");
  $("#tDB").className="nodebox "+mark("db");

  const set=(id,v,hot,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot);g.classList.toggle("good",!!good)};
  set("#sgServe",Math.round(m.served),m.shed>0,m.shed===0);
  set("#sgCeil",Math.round(m.ceiling),false,false);
  set("#sgDb",Math.round(m.dbLoad),m.dbLoad>m.dbCap*.9,false);
  set("#sgShed",Math.round(m.shed),m.shed>0,m.shed===0);

  $("#sMath").innerHTML=
    `App: ${m.active} machine${m.active>1?"s":""} × ${workersPerInst()} workers ÷ ${(m.h/1000).toFixed(3)}s = <b>${Math.round(m.appCap)} rps</b><br>`+
    `DB: ${Math.round(m.dbCap)} qps ÷ ${m.perReq.toFixed(2)} queries per request = <b>${m.perReq>0?Math.round(m.dbReqCap)+" rps":"unlimited"}</b>`;

  const v=$("#sVerdict");
  if(SC.sess && m.active>1){
    v.className="verdict bad";
    v.innerHTML=`<b>Broken, not just slow</b>Sessions live in one instance's memory, but the load balancer sends each request to whichever box is free. A user logs in on instance 1 and the next click lands on instance 3, which has never heard of them. Capacity is irrelevant until state moves out of the process, into the cache, the database, or a signed cookie. This is what "stateless" buys you.`;
    return;
  }
  if(SC.inst>1 && !SC.lb){
    v.className="verdict warn";
    v.innerHTML=`<b>Instances idle</b>You are running ${SC.inst} instances but nothing is distributing traffic, so ${SC.inst-1} of them sit empty while one absorbs everything. Horizontal scaling starts with the thing in front, not the copies behind it.`;
    return;
  }
  if(m.shed>0){
    v.className="verdict bad";
    v.innerHTML= m.neck==="app"
      ? `<b>Bottleneck: application tier</b>Turning away ${Math.round(m.shed)} rps. The workers cannot drain the queue fast enough. Moves that help: more instances, a faster handler, or the async queue to get slow work off the request path.`
      : `<b>Bottleneck: database</b>Turning away ${Math.round(m.shed)} rps. Each request costs ${m.perReq.toFixed(2)} queries and the database tops out at ${Math.round(m.dbCap)} qps. More app instances will not help. They will only push harder on the same database. Moves that help: cache the reads, add replicas, or make each request ask for less.`;
    return;
  }
  const head=(m.ceiling/SC.load);
  v.className="verdict ok";
  v.innerHTML=`<b>Keeping up · ${head.toFixed(1)}× headroom</b>Serving all ${SC.load} rps, ceiling is ${Math.round(m.ceiling)} rps, and the ${m.neck==="app"?"application tier":"database"} is the thing that will give way first when load grows. That is the next wall, and knowing it beforehand is the point.`;
}
const bindS=(sel,key,fmt,lbl)=>{
  $(sel).oninput=e=>{SC[key]=+e.target.value;$(lbl).textContent=fmt(SC[key]);renderScale()};
  $(sel).dispatchEvent(new Event("input"));
};
bindS("#sLoad","load",v=>v+" rps","#vLoad");
bindS("#sInst","inst",v=>v,"#vInst");
bindS("#sH","h",v=>v+" ms","#vH");
bindS("#sQ","q",v=>v,"#vQ");
bindS("#sRep","rep",v=>v,"#vRep");
[["#tgLB","lb"],["#tgCache","cache"],["#tgQueue","queue"],["#tgSess","sess"]].forEach(([sel,key])=>{
  $(sel).onclick=()=>{SC[key]=!SC[key];$(sel).setAttribute("aria-pressed",SC[key]);renderScale()};
});
renderScale();

/* ---- load balancer distribution ---- */
const LBN=["A","B","C","D","E"], SLOW=[1,1,1,1,4];
const LB={algo:"rr", dead:-1, count:[0,0,0,0,0], flight:[0,0,0,0,0], lost:0, total:0, rr:0, timer:null};
function lbAlive(i){ return i!==LB.dead; }
function lbRender(){
  const max=Math.max(1,...LB.count);
  $("#lbInsts").innerHTML=LBN.map((n,i)=>{
    const h=Math.round(LB.count[i]/max*46);
    return `<div class="inst${i===LB.dead?" dead":""}">
      <div class="iname">${i===LB.dead?"✕ "+n:"machine "+n}</div>
      <div class="ibarwrap"><div class="ibar" style="height:${h}px"></div></div>
      <div class="icount">${LB.count[i]}</div>
      <div class="iflight">${LB.flight[i]} in flight</div>
      ${SLOW[i]>1?'<div class="islow">4× slower</div>':""}
    </div>`;
  }).join("");
  const alive=LB.count.filter((_,i)=>lbAlive(i));
  const spread = alive.length && LB.total ? Math.round((Math.max(...alive)-Math.min(...alive))/Math.max(1,Math.max(...alive))*100) : 0;
  const set=(id,v,hot,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot);g.classList.toggle("good",!!good)};
  set("#lbG1",LB.total,false,false);
  set("#lbG2",LB.total?spread+"%":"—", false, false);
  set("#lbG3",LB.lost,LB.lost>0,LB.lost===0&&LB.total>0);

  const v=$("#lbVerdict"), fl=LB.flight;
  if(!LB.total){ v.className="verdict"; v.innerHTML="<b>Idle</b>Press Send traffic and watch where requests land."; return; }
  if(LB.algo==="sticky" && LB.lost>0){
    v.className="verdict bad";
    v.innerHTML=`<b>${LB.lost} sessions lost</b>Sticky sessions pinned those clients to machine E, and E is gone. The load balancer reroutes them, but whatever was held in E's memory went with it. They are logged out. This is the same failure the in-memory sessions toggle shows below. Horizontal scaling asks you to keep state out of the process for that reason.`;
  } else if(LB.algo==="rr" && fl[4]>=Math.max(fl[0],fl[1],fl[2],fl[3])+2 && lbAlive(4)){
    v.className="verdict warn";
    v.innerHTML=`<b>Even counts, uneven load</b>Round robin gave every machine the same number of requests, which is the problem: E is slower, so its queue is ${fl[4]} deep while the others sit near ${Math.round((fl[0]+fl[1]+fl[2])/3)}. Counting requests is not the same as sharing work. Try least connections.`;
  } else if(LB.algo==="lc"){
    v.className="verdict ok";
    v.innerHTML=`<b>Balanced by actual work</b>Least connections sends fewer requests to E because it can see E is still busy with the last ones. Uneven counts, even queues. Which is the thing that matters.`;
  } else if(LB.dead>=0){
    v.className="verdict ok";
    v.innerHTML=`<b>Machine E removed, nobody noticed</b>The health check stopped answering, so the load balancer took E out of the rotation and split its share among the rest. No user saw an error. This is horizontal scaling buying you availability, not just capacity.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>Spreading evenly</b>Each machine is taking roughly the same number of requests. Now take E down, or switch to sticky sessions and take it down.`;
  }
}
function lbDispatch(){
  const client=Math.floor(Math.random()*8);
  let t;
  if(LB.algo==="sticky"){
    t=client%5;
    if(!lbAlive(t)){ LB.lost++; do{ t=(t+1)%5; }while(!lbAlive(t)); }
  } else if(LB.algo==="lc"){
    t=-1; let best=Infinity;
    for(let i=0;i<5;i++) if(lbAlive(i)&&LB.flight[i]<best){best=LB.flight[i];t=i;}
  } else {
    do{ LB.rr=(LB.rr+1)%5; }while(!lbAlive(LB.rr)); t=LB.rr;
  }
  if(t<0) return;
  LB.count[t]++; LB.flight[t]++; LB.total++;
  setTimeout(()=>{ LB.flight[t]=Math.max(0,LB.flight[t]-1); }, (420+Math.random()*380)*SLOW[t]);
  lbRender();
}
$$("[data-algo]").forEach(b=>b.onclick=()=>{
  $$("[data-algo]").forEach(x=>x.setAttribute("aria-pressed",x===b));
  LB.algo=b.dataset.algo; LB.count=[0,0,0,0,0]; LB.total=0; LB.lost=0; LB.rr=0; lbRender();
});
$("#lbRun").onclick=e=>{
  if(LB.timer){ clearInterval(LB.timer); LB.timer=null; e.target.textContent="▶ Send traffic"; return; }
  e.target.textContent="❚❚ Pause";
  LB.timer=setInterval(lbDispatch, REDUCED?260:110);
};
$("#lbKill").onclick=e=>{
  LB.dead = LB.dead===4 ? -1 : 4;
  e.target.textContent = LB.dead===4 ? "Bring E back" : "Take E down";
  lbRender();
};
$("#lbReset").onclick=()=>{
  clearInterval(LB.timer); LB.timer=null; $("#lbRun").textContent="▶ Send traffic";
  LB.count=[0,0,0,0,0]; LB.flight=[0,0,0,0,0]; LB.total=0; LB.lost=0; LB.rr=0; LB.dead=-1;
  $("#lbKill").textContent="Take E down"; lbRender();
};
lbRender();

/* ================= 08 The enlistment system CASE ================= */
const AI={stu:4000,win:10,stag:false,split:false,era:"onprem"};
const REQ_PER_SESSION=15, WRITES_PER_SESSION=3, DB_CEIL=400;
const WEB_ONPREM=700, WEB_CLOUD=4000;

function enlistModel(){
  const avg = AI.stu*REQ_PER_SESSION/(AI.win*60);
  const burst = AI.stag ? 1.5 : 6;
  const peak = avg*burst;
  const web = AI.era==="cloud" ? WEB_CLOUD : WEB_ONPREM;
  const frac = AI.split ? WRITES_PER_SESSION/REQ_PER_SESSION : 1;
  const dbLoad = peak*frac;
  const webBreaks = peak>web, dbBreaks = dbLoad>DB_CEIL;
  return {avg,burst,peak,web,dbLoad,webBreaks,dbBreaks,
          ceiling:Math.min(web, DB_CEIL/frac)};
}
function renderEnlist(){
  const m=enlistModel();
  const maxScale=Math.max(m.peak,m.web,DB_CEIL,1);
  const pct=v=>Math.min(100,v/maxScale*100).toFixed(1);

  $("#aPeak").textContent=Math.round(m.peak).toLocaleString()+" rps";
  $("#aPeakBar").style.width=pct(m.peak)+"%";
  $("#aPeakBar").className = m.webBreaks||m.dbBreaks ? "over" : "db";

  $("#aWeb").textContent=m.web.toLocaleString()+" rps";
  $("#aWebBar").style.width=pct(m.web)+"%";
  $("#aWebBar").className = m.webBreaks ? "over" : "web";
  $("#aWebNote").textContent = AI.era==="cloud" ? "— autoscaled" : "— 7 fixed servers";

  $("#aDbLoad").textContent=Math.round(m.dbLoad).toLocaleString()+" ops/s";
  $("#aDbLoadBar").style.width=pct(m.dbLoad)+"%";
  $("#aDbLoadBar").className = m.dbBreaks ? "over" : "db";
  $("#aDbBar").style.width=pct(DB_CEIL)+"%";

  const v=$("#aVerdict");
  if(m.webBreaks && m.dbBreaks){
    v.className="verdict bad";
    v.innerHTML=`<b>Both tiers under water</b>${Math.round(m.peak).toLocaleString()} rps arriving against a ${m.web.toLocaleString()} rps web ceiling and a ${DB_CEIL} ops/s database. This is the enlistment morning you remember. One of these you can fix by spending money. The other you cannot.`;
  } else if(m.dbBreaks){
    v.className="verdict bad";
    v.innerHTML=`<b>Web tier fine. Database drowning.</b>The web tier absorbs all ${Math.round(m.peak).toLocaleString()} rps without complaint, and ${Math.round(m.dbLoad).toLocaleString()} ops/s still land on one primary that tops out at ${DB_CEIL}. ${AI.era==="cloud"?"This is exactly why moving to the cloud did not fix enlistment day, autoscaling solved a tier that was not the constraint.":"Adding web servers here would change nothing at all."} Seat reservation cannot be cached and cannot be spread across replicas, because two students must never get the same last slot.`;
  } else if(m.webBreaks){
    v.className="verdict warn";
    v.innerHTML=`<b>Web tier is the wall</b>${Math.round(m.peak).toLocaleString()} rps against ${m.web.toLocaleString()}. This is the constraint the seven-server era hit first, and the one the cloud migration solved. Switch to the cloud era and watch what becomes the new limit.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>Holding · everything fits</b>Peak of ${Math.round(m.peak).toLocaleString()} rps sits under a ${m.web.toLocaleString()} rps web ceiling, and only ${Math.round(m.dbLoad).toLocaleString()} ops/s reach the primary. ${AI.stag&&AI.split?"Both moves together did it: staggering flattened the spike, and splitting reads off the primary left it doing only the work that needs a lock.":AI.stag?"Staggering flattened the arrival spike, which cost nothing in hardware.":"Splitting reads off the primary left it doing only the contended writes."}`;
  }
}
const bindA=(sel,key,fmt,lbl)=>{
  $(sel).oninput=e=>{AI[key]=+e.target.value;$(lbl).textContent=fmt(AI[key]);renderEnlist()};
  $(sel).dispatchEvent(new Event("input"));
};
bindA("#sStu","stu",v=>v.toLocaleString(),"#vStu");
bindA("#sWin","win",v=>v+" min","#vWin");
$("#tgStag").onclick=()=>{AI.stag=!AI.stag;$("#tgStag").setAttribute("aria-pressed",AI.stag);renderEnlist()};
$("#tgSplit").onclick=()=>{AI.split=!AI.split;$("#tgSplit").setAttribute("aria-pressed",AI.split);renderEnlist()};
$("#ecOn").onclick=()=>{AI.era="onprem";$("#ecOn").classList.add("on");$("#ecCloud").classList.remove("on");renderEnlist()};
$("#ecCloud").onclick=()=>{AI.era="cloud";$("#ecCloud").classList.add("on");$("#ecOn").classList.remove("on");renderEnlist()};
renderEnlist();

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
    `<div class="prt hdr"><span>PART</span><span>HANDLER</span><span>RAM EACH</span><span>SHARE</span></div>` +
    m.svc.map(x=>`<div class="prt">
        <span><b>${x.n}</b></span>
        <span class="${x.ms>=1000?"hot":""}">${x.ms} ms</span>
        <span class="${x.perRam>=400?"hot":""}">${x.perRam} MB</span>
        <span>${Math.round(x.share*100)}%</span></div>`).join("");

  const v=$("#splitVerdict"), diff=m.mRam-m.sRam;
  if(diff>0){
    const x=(m.mRam/m.sRam).toFixed(1);
    v.className="verdict ok";
    v.innerHTML=`<b>Splitting wins here, ${gb(diff)} less, ${x}× cheaper in memory</b>At ${SPLIT.load} rps the monolith is paying for ${m.mInst*WPM} workers that could each be asked to build a PDF, so every one of them is sized at ${m.worstRam} MB. Only ${m.svc[2].inst*WPM} of them ever will. That waste is the argument for splitting. Read the four costs below before you do it.`;
  } else if(diff===0){
    v.className="verdict warn";
    v.innerHTML=`<b>Level pegging</b>This is the crossover. Below it the monolith is cheaper; above it the per-part sizing starts to pay. The crossover is about memory only. It says nothing about the operational costs below, which you pay from the first day you split.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>Splitting costs more here, ${gb(-diff)} extra</b>Every service needs at least one machine even when it is nearly idle, so four services means four floors to pay for. At ${SPLIT.load} rps the monolith fits in ${m.mInst} machine${m.mInst===1?"":"s"} and does the same work. This is where most capstone projects live. One app is the sensible default.`;
  }
}
$("#sLoad2").oninput=e=>{SPLIT.load=+e.target.value;$("#vLoad2").textContent=SPLIT.load+" rps";renderSplit()};
$("#sLoad2").dispatchEvent(new Event("input"));

/* ================= 13 VIRTUALIZATION ================= */
const HOST_RAM=256, HYP_OVERHEAD=8;
const VM={guests:8, per:8};
function vmModel(){
  const sold=VM.guests*VM.per, avail=HOST_RAM-HYP_OVERHEAD;
  return {sold, avail, free:avail-sold, over:sold>avail,
          ratio:(sold/avail)};
}
function renderVm(){
  const m=vmModel();
  $("#guestRow").innerHTML=Array.from({length:Math.min(VM.guests,8)},(_,i)=>
    `<div class="guest"><div class="gt">GUEST ${i+1}</div><div>Applications</div><div>Shell</div><div>Kernel</div></div>`
  ).join("") + (VM.guests>8?`<div class="guest" style="border-style:dashed;flex:0 0 46px"><div class="gt">+${VM.guests-8}</div></div>`:"");

  $("#hostSplit").innerHTML=[
    ["var(--req)", `${VM.guests} guests × ${VM.per} GB`, m.sold+" GB"],
    ["var(--res)", "hypervisor and host", HYP_OVERHEAD+" GB"],
    [m.over?"var(--warn)":"var(--line2)", m.over?"oversold":"unsold", Math.abs(m.free)+" GB"]
  ].map(([c,n,v])=>`<div class="lg"><i style="background:${c}"></i>${n}<b>${v}</b></div>`).join("");

  const v=$("#vmVerdict");
  if(m.over){
    v.className="verdict bad";
    v.innerHTML=`<b>Oversold by ${Math.abs(m.free)} GB</b>You have promised ${m.sold} GB out of ${m.avail} GB. Providers do this, betting that guests are rarely all busy together. When the bet loses, your VM does not crash. It just gets slow for reasons nothing in your own code explains. That is the noisy-neighbour problem, and the price of resource pooling.`;
  } else if(m.ratio>0.85){
    v.className="verdict warn";
    v.innerHTML=`<b>${Math.round(m.ratio*100)}% committed</b>${m.free} GB spare on a ${HOST_RAM} GB machine. Efficient for the provider, and tight enough that one greedy neighbour is noticeable.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>${VM.guests} guests, ${m.free} GB spare</b>One physical machine is doing the work of ${VM.guests} servers. Nobody bought ${VM.guests} computers, and any of these can be destroyed and recreated in about a minute. Everything else on this page depends on that.`;
  }
}
const NIST=[
 ["On-demand self-service","You provision capacity yourself, through an API or a console, without talking to a human or raising a purchase order. The seven the enlistment system servers each needed a procurement cycle; a cloud instance needs a credit card and forty seconds. This is the characteristic that changes how fast an organization can be wrong and recover."],
 ["Broad network access","Capabilities are reachable over the network by standard mechanisms, from thin clients and thick ones alike. This is panel 06 stated as an infrastructure property. The same HTTP endpoint served to a browser, an iPhone and an Android app, because the access method is standard rather than special."],
 ["Resource pooling","Physical resources are pooled and assigned to many tenants dynamically, and you generally cannot tell where yours physically are. That is the diagram above. It is why cloud is cheap, and why your instance sometimes slows down for reasons that are not your fault."],
 ["Rapid elasticity","Capacity can be added and released quickly, and to the customer it appears unlimited. This is what panel 19's autoscaling web tier actually rests on, and what changed between the two eras, even though, as panel 20 showed, it changed the tier that was not the constraint."],
 ["Measured service","Usage is metered, reported and billed by the unit, CPU-hours, gigabytes, requests. This is what turns capital expenditure into operational expenditure, and it makes panel 22's graph possible. It also means a resource you forgot about keeps charging you."]
];
$("#nistCards").innerHTML=NIST.map(([t],i)=>
  `<button class="nc" data-i="${i}"><div class="nn">0${i+1}</div><h5>${t}</h5></button>`).join("");
$$("#nistCards .nc").forEach(el=>el.onclick=()=>{
  $$("#nistCards .nc").forEach(x=>x.classList.remove("on"));
  el.classList.add("on");
  const [t,d]=NIST[+el.dataset.i];
  $("#nistOut").innerHTML=`<div class="et">${t.toUpperCase()}</div><p>${d}</p>`;
});
const RESP=[
 ["Your application code", 1,1,1,0],
 ["Your data",            1,1,1,0],
 ["Runtime and libraries",1,1,0,0],
 ["Operating system",     1,1,0,0],
 ["Virtual machine",      1,0,0,0],
 ["Physical servers",     1,0,0,0],
 ["Network and building", 1,0,0,0]
];
$("#respBody").innerHTML=RESP.map(r=>{
  const [n,...cols]=r;
  return `<tr><td>${n}</td>`+cols.map(c=>
    `<td><span class="${c?"you":"them"}">${c?"you":"them"}</span></td>`).join("")+`</tr>`;
}).join("");
const bindV=(sel,key,fmt,lbl)=>{
  $(sel).oninput=e=>{VM[key]=+e.target.value;$(lbl).textContent=fmt(VM[key]);renderVm()};
  $(sel).dispatchEvent(new Event("input"));
};
bindV("#sGuests","guests",v=>v,"#vGuests");
bindV("#sGuestRam","per",v=>v+" GB","#vGuestRam");

/* ---- provisioning console: the five characteristics, demonstrated ---- */
let elasticityShown=false;   // set by the autoscaler below, which is declared later
const PROV={mode:"cloud", servers:[], hours:0, bill:0, seq:0, firstUp:null, timer:null, peak:0};
const MODES={
  cloud:{ readyH:0.02, hourly:3, upfront:0,
    note:"Provisioning takes about a minute and costs nothing to start. You are billed <b>₱3 per running hour</b>, per server, and the meter stops the moment you destroy one.<br><br>Provision three, then destroy two, and watch the bill stop growing for them. Then leave one running and forget about it." },
  onprem:{ readyH:1008, hourly:0, upfront:180000,
    note:"Six weeks: quotation, purchase order, approval, delivery, racking, imaging. <b>₱180,000 charged once</b>, whether or not the machine is ever busy.<br><br>Watch what the Destroy button does to the bill here. You bought it. It is yours. That is what capital expenditure means." }
};
function provFmtClock(){
  const d=Math.floor(PROV.hours/24), h=Math.floor(PROV.hours%24), m=Math.floor((PROV.hours%1)*60);
  return `day ${d}, ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}
function provReady(s){ return PROV.hours>=s.readyAt; }
function renderProv(){
  const M=MODES[PROV.mode];
  $("#provClock").textContent=provFmtClock();
  $("#modeNote").innerHTML=M.note;

  $("#srvList").innerHTML = PROV.servers.length ? PROV.servers.map(s=>{
    const up=provReady(s);
    const left=Math.max(0,s.readyAt-PROV.hours);
    return `<div class="srvrow${up?" up":""}">
      <span class="dotp"></span>
      <span>srv-${String(s.id).padStart(3,"0")} ${up?`<span class="addr">10.0.${s.id}.4</span>`:""}</span>
      <span>${up?`up ${Math.floor(PROV.hours-s.readyAt)}h`:(left>48?`${Math.ceil(left/168)} weeks left`:`${left.toFixed(2)} h left`)}</span>
      <button data-kill="${s.id}">destroy</button></div>`;
  }).join("") : `<div class="emptyc">No servers. Press Provision.</div>`;
  $$("#srvList [data-kill]").forEach(b=>b.onclick=()=>{
    PROV.servers=PROV.servers.filter(x=>x.id!==+b.dataset.kill); renderProv();
  });

  const up=PROV.servers.filter(provReady).length;
  PROV.peak=Math.max(PROV.peak,up);
  const set=(id,v,hot,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot);g.classList.toggle("good",!!good)};
  set("#pgUp",up,false,up>0);
  set("#pgWait", PROV.firstUp===null?"—":(PROV.firstUp<1?`${Math.round(PROV.firstUp*60)} min`:`${Math.round(PROV.firstUp/168)} weeks`),
      PROV.firstUp!==null&&PROV.firstUp>1, PROV.firstUp!==null&&PROV.firstUp<1);
  set("#pgBill","₱"+Math.round(PROV.bill).toLocaleString(), PROV.bill>50000, false);

  // light up what has actually been demonstrated
  const done={
    0: PROV.mode==="cloud" && PROV.servers.length>0,                 // on-demand self-service
    1: up>0,                                                          // broad network access
    2: PROV.servers.length>0,                                         // resource pooling
    3: (PROV.peak>=3 && up<PROV.peak) || elasticityShown,             // rapid elasticity
    4: PROV.bill>0                                                    // measured service
  };
  $$("#nistCards .nc").forEach(el=>{
    const i=+el.dataset.i;
    el.classList.toggle("done",!!done[i]);
    const t=el.querySelector(".tick");
    if(done[i] && !t) el.querySelector(".nn").insertAdjacentHTML("afterbegin",'<span class="tick">✓</span>');
    if(!done[i] && t) t.remove();
  });

  const v=$("#provVerdict");
  if(!PROV.servers.length){
    v.className="verdict";
    v.innerHTML="<b>Idle</b>Press Provision and watch the clock in the corner.";
  } else if(PROV.mode==="onprem"){
    v.className="verdict bad";
    v.innerHTML=`<b>₱${Math.round(PROV.bill).toLocaleString()} spent, ${up} running</b>You committed the money the moment you ordered, and you will be waiting six weeks whatever happens next. Destroying a server here does not give anything back. You still own the metal. This is the era these servers were bought in.`;
  } else if(done[3]){
    v.className="verdict ok";
    v.innerHTML=`<b>You just did the whole thing</b>Provisioned in about a minute without asking anyone, reached them on a public address, scaled up and back down, and paid by the hour for the time they existed. Those are four of the five characteristics, and you did them with a button.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>${up} running · ₱${Math.round(PROV.bill).toLocaleString()} so far</b>The meter runs while they exist, and only while they exist. Now provision up to three and destroy two. That is elasticity, the card that has not lit yet.`;
  }
}
function provTick(){
  const step=0.5;                       // simulated hours per tick
  PROV.hours+=step;
  const M=MODES[PROV.mode];
  PROV.servers.forEach(s=>{
    if(provReady(s)){
      if(PROV.firstUp===null) PROV.firstUp=s.wait;
      PROV.bill += M.hourly*step;
    }
  });
  renderProv();
}
$("#provAdd").onclick=()=>{
  const M=MODES[PROV.mode];
  PROV.seq++;
  PROV.servers.push({id:PROV.seq, readyAt:PROV.hours+M.readyH, wait:M.readyH});
  PROV.bill += M.upfront;
  renderProv();
};
$("#provReset").onclick=()=>{
  PROV.servers=[];PROV.hours=0;PROV.bill=0;PROV.seq=0;PROV.firstUp=null;PROV.peak=0;renderProv();
};
function setProvMode(cloud){
  PROV.mode=cloud?"cloud":"onprem";
  $("#tgCloudMode").setAttribute("aria-pressed",cloud);
  $("#tgPremMode").setAttribute("aria-pressed",!cloud);
  PROV.servers=[];PROV.hours=0;PROV.bill=0;PROV.seq=0;PROV.firstUp=null;PROV.peak=0;
  renderProv();
}
$("#tgCloudMode").onclick=()=>setProvMode(true);
$("#tgPremMode").onclick=()=>setProvMode(false);
PROV.timer=setInterval(provTick, REDUCED?900:420);
renderProv();

/* ---- elasticity in motion: an autoscaler you can watch ---- */
const PER_INST=50, TARGET=0.70, SCALE_EVERY=5, COOLDOWN=25, WINDOW=180;
const EL={shape:"spike", boot:60, auto:true, t:0, inst:[], hist:[],
          served:0, dropped:0, machMin:0, cool:0, lastScale:0, running:false, raf:null, spikeDrop:0, spikeTot:0};
function elDemand(t){
  const c=t%WINDOW;
  if(EL.shape==="steady") return 190+22*Math.sin(c/9)+12*Math.sin(c/2.3);
  if(EL.shape==="ramp")   return 60+Math.min(1,c/110)*420+14*Math.sin(c/3);
  // enlistment: nothing, then everything, in one second
  if(c<40) return 45+10*Math.sin(c/3);
  if(c<95) return 620-(c-40)*4.5+18*Math.sin(c/2);
  return 50+12*Math.sin(c/3);
}
function elCap(){ return EL.inst.filter(i=>i.state==="run").length*PER_INST; }
function elStep(dt){
  EL.t+=dt;
  EL.inst.forEach(i=>{ if(i.state==="boot"){ i.left-=dt; if(i.left<=0) i.state="run"; } });
  const d=elDemand(EL.t), cap=elCap();
  EL.served+=Math.min(d,cap)*dt;
  const drop=Math.max(0,d-cap)*dt;
  EL.dropped+=drop;
  const c=EL.t%WINDOW;
  if(EL.shape==="spike" && c>=40 && c<95){ EL.spikeDrop+=drop; EL.spikeTot+=d*dt; }
  EL.machMin+=EL.inst.length*dt/60;
  EL.cool=Math.max(0,EL.cool-dt);

  if(EL.auto){
    if(EL.t-EL.lastScale>=SCALE_EVERY){
      EL.lastScale=EL.t;
      const want=Math.max(1, Math.ceil(d/(PER_INST*TARGET)));
      const have=EL.inst.length;
      if(want>have){ for(let k=0;k<Math.min(want-have,6);k++) EL.inst.push({state:"boot",left:EL.boot}); }
      else if(want<have && EL.cool<=0){ 
        const i=EL.inst.findIndex(x=>x.state==="run");
        if(i>=0){ EL.inst.splice(i,1); EL.cool=COOLDOWN; }
      }
    }
  } else if(EL.inst.length<4){ EL.inst.push({state:"run",left:0}); }

  EL.hist.push({t:EL.t, d, cap});
  if(EL.hist.length>60 && !elasticityShown){ elasticityShown=true; if(typeof renderProv==="function") renderProv(); }
  if(EL.hist.length>420) EL.hist.shift();
}
function elDraw(){
  const cv=$("#elCanvas"); if(!cv) return;
  const r=cv.getBoundingClientRect(), dpr=devicePixelRatio||1;
  if(cv.width!==r.width*dpr){ cv.width=r.width*dpr; cv.height=r.height*dpr; }
  const g=cv.getContext("2d"); g.setTransform(dpr,0,0,dpr,0,0);
  const W=r.width,H=r.height;
  g.clearRect(0,0,W,H); g.fillStyle=CSSV("--bg"); g.fillRect(0,0,W,H);
  if(EL.hist.length<2) return;
  const span=90, t1=EL.t, t0=t1-span;
  const pts=EL.hist.filter(p=>p.t>=t0);
  const maxY=Math.max(700, ...pts.map(p=>Math.max(p.d,p.cap)))*1.05;
  const X=t=>(t-t0)/span*W, Y=v=>H-8-(v/maxY)*(H-18);

  // turned-away band
  g.beginPath(); g.moveTo(X(pts[0].t),Y(pts[0].d));
  pts.forEach(p=>g.lineTo(X(p.t),Y(p.d)));
  for(let i=pts.length-1;i>=0;i--) g.lineTo(X(pts[i].t),Y(Math.min(pts[i].cap,pts[i].d)));
  g.closePath(); g.fillStyle="rgba(255,95,95,.30)"; g.fill();

  // capacity staircase
  g.beginPath(); pts.forEach((p,i)=> i?g.lineTo(X(p.t),Y(p.cap)):g.moveTo(X(p.t),Y(p.cap)));
  g.strokeStyle=CSSV("--req"); g.lineWidth=2; g.stroke();
  // demand
  g.beginPath(); pts.forEach((p,i)=> i?g.lineTo(X(p.t),Y(p.d)):g.moveTo(X(p.t),Y(p.d)));
  g.strokeStyle=CSSV("--dim"); g.lineWidth=1.6; g.stroke();

  g.fillStyle=CSSV("--faint"); g.font="9px 'IBM Plex Mono',monospace";
  g.fillText(Math.round(elDemand(EL.t))+" rps in", 8, 13);
  g.textAlign="right"; g.fillText(elCap()+" rps capacity", W-8, 13); g.textAlign="left";
}
function elRender(){
  elDraw();
  $("#elStrip").innerHTML=EL.inst.slice(0,26).map(i=>{
    const pct=i.state==="boot"?Math.round((1-i.left/EL.boot)*100):100;
    return `<div class="inb ${i.state}"><i style="height:${pct}%"></i><span>${i.state==="boot"?Math.ceil(i.left)+"s":"up"}</span></div>`;
  }).join("");
  const tot=EL.served+EL.dropped;
  const set=(id,v,hot,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot);g.classList.toggle("good",!!good)};
  const booting=EL.inst.filter(i=>i.state==="boot").length;
  set("#egRun",`${EL.inst.length-booting}${booting?" +"+booting:""}`,false,false);
  set("#egServed", tot?Math.round(EL.served/tot*100)+"%":"—", tot&&EL.served/tot<.9, tot&&EL.served/tot>=.99);
  set("#egDrop", Math.round(EL.dropped).toLocaleString(), EL.dropped>500, EL.dropped<1);
  set("#egCost", Math.round(EL.machMin), false, false);

  const v=$("#elVerdict");
  const spikePct=EL.spikeTot? EL.spikeDrop/EL.spikeTot : 0;
  if(!EL.running && !EL.hist.length){ v.className="verdict"; v.innerHTML="<b>Idle</b>Press Start the day."; return; }
  if(!EL.auto){
    v.className="verdict warn";
    v.innerHTML=`<b>Four machines, all day, no matter what</b>${Math.round(EL.dropped).toLocaleString()} requests turned away so far, and on a quiet stretch most of that capacity does nothing. This is the fixed line from panel 22, drawn one minute at a time.`;
  } else if(EL.shape==="spike" && spikePct>.15){
    v.className="verdict bad";
    v.innerHTML=`<b>The machines arrived after the rush</b>${Math.round(spikePct*100)}% of the enlistment surge was turned away. The autoscaler did nothing wrong. It noticed within seconds and ordered machines immediately. They just took ${EL.boot}s to boot, and the stampede did not wait. <b class="i">Elasticity is fast, not instant.</b><br><br>Drag boot time down and watch how much you claw back. You never get all of it, because a surge that arrives in one second cannot be absorbed by anything that has to react. The things that do work are pre-warmed capacity, a queue in front, or <b class="i">staggering the arrivals</b>. Which is the fix panel 20 found, now with a second reason behind it. This is also an entirely separate reason the cloud migration did not fix enlistment morning, on top of the database ceiling.`;
  } else if(EL.shape==="spike"){
    v.className="verdict ok";
    v.innerHTML=`<b>Caught it, at ${EL.boot}s boot</b>Fast enough that capacity arrived while the surge was still running. Real machines rarely boot this quickly; this is what pre-warmed instances or a queue in front are buying you.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>Following the load</b>Capacity climbs a few steps behind demand and settles back afterwards. Gentle shapes are what autoscaling is good at, note the staircase always lags, and that you pay for the lag and the cooldown tail as well as the work.`;
  }
}
function elLoop(){
  if(!EL.running) return;
  elStep(0.8); elRender();
  EL.raf=setTimeout(elLoop, REDUCED?260:70);
}
$$("[data-shape]").forEach(b=>b.onclick=()=>{
  $$("[data-shape]").forEach(x=>x.setAttribute("aria-pressed",x===b));
  EL.shape=b.dataset.shape; elResetState(); elRender();
});
function elResetState(){
  EL.t=0;EL.inst=[];EL.hist=[];EL.served=0;EL.dropped=0;EL.machMin=0;
  EL.cool=0;EL.lastScale=0;EL.spikeDrop=0;EL.spikeTot=0;
}
$("#sBoot").oninput=e=>{EL.boot=+e.target.value;$("#vBoot").textContent=EL.boot+" s";elResetState();elRender()};
$("#tgAuto").onclick=()=>{EL.auto=!EL.auto;$("#tgAuto").setAttribute("aria-pressed",EL.auto);elResetState();elRender()};
$("#elRun").onclick=e=>{
  EL.running=!EL.running;
  e.target.textContent=EL.running?"❚❚ Pause":"▶ Start the day";
  if(EL.running) elLoop(); else clearTimeout(EL.raf);
};
$("#elReset").onclick=()=>{EL.running=false;clearTimeout(EL.raf);$("#elRun").textContent="▶ Start the day";elResetState();elRender()};
elRender();

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
    v.innerHTML=`<b>Nothing to pay</b>Each request is served by one service and never asks another. This is the shape splitting is actually good for, and it is rarer than it sounds. Drag the slider and watch how quickly it stops being true.`;
  } else if(m.n<=3){
    v.className="verdict warn";
    v.innerHTML=`<b>${m.n} call${m.n===1?"":"s"}, and you can still afford it</b>The handler goes from ${m.mono.toFixed(0)} to ${m.svc.toFixed(0)} ms and combined uptime slips to ${(m.av*100).toFixed(2)}%. Survivable, and worth watching. Every new feature that needs one more lookup moves this slider right, and nobody ever moves it back.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>${m.n} calls: ${m.mult.toFixed(1)}× slower and dark ${m.downMin<60?Math.round(m.downMin)+" minutes":(m.downMin/60).toFixed(1)+" hours"} a month</b>The handler that took ${m.mono.toFixed(0)} ms now takes ${m.svc.toFixed(0)} ms, and the network is fine. The cost is ${m.n} separate round trips where there used to be ${m.n} function calls. Worse, you now need all ${m.n} services healthy at once: ${(SVC_AVAIL*100).toFixed(1)}% each becomes <b class="i">${(m.av*100).toFixed(2)}% together</b>, and there is a <b class="i">${(m.slow*100).toFixed(0)}% chance</b> on any given request that at least one of them is having a slow moment. This is panel 15's N+1 problem again, one layer down, and this time you cannot fix it with <code>select_related</code>.`;
  }
}
$("#sChat").oninput=e=>{CHAT.n=+e.target.value;$("#vChat").textContent=CHAT.n;renderChat()};
$("#sChat").dispatchEvent(new Event("input"));

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

/* ================= 15 REGIONS & FAILOVER ================= */
/* ---- equirectangular world, rotated so Manila sits mid-map (no arcs wrap) ---- */
const MAPW=960, MAPH=470, LAT0=80, LAT1=-58, LON_C=155;   // seam falls in the mid-Atlantic
function projX(lon){ let d=((lon-LON_C+540)%360)-180; return (d+180)/360*MAPW; }
function projY(lat){ return (LAT0-lat)/(LAT0-LAT1)*MAPH; }
const LAND=[
 // North America
 [-168,66,-160,71,-150,71,-140,70,-128,70,-115,73,-100,74,-93,72,-85,70,-80,73,-73,68,
  -65,60,-56,52,-60,47,-66,45,-70,42,-74,40,-76,35,-81,31,-80,25,-83,25,-88,30,-94,29,
  -97,26,-98,22,-105,20,-110,24,-114,31,-117,33,-121,35,-124,40,-124,48,-130,54,-140,60,
  -150,59,-160,55,-166,60],
 // South America
 [-81,8,-77,8,-72,11,-64,11,-60,8,-52,5,-50,0,-44,-2,-38,-5,-35,-8,-38,-13,-39,-18,
  -44,-23,-48,-25,-53,-34,-58,-35,-62,-39,-63,-42,-66,-45,-69,-51,-75,-53,-74,-46,
  -73,-40,-71,-33,-71,-24,-70,-18,-76,-14,-79,-6,-81,0],
 // Africa
 [-17,21,-10,27,0,31,10,34,20,32,25,32,32,31,34,28,35,22,37,18,39,15,43,12,48,11,51,12,
  45,5,41,-2,40,-10,40,-16,35,-20,33,-26,31,-30,27,-34,20,-35,15,-27,12,-18,13,-10,
  9,-2,9,4,3,6,-5,5,-8,4,-13,9],
 // Eurasia
 [-9,43,-9,39,-6,36,0,39,3,42,8,44,13,45,16,42,19,40,24,40,27,37,30,37,36,36,36,33,
  35,31,34,29,38,25,43,20,48,17,52,17,57,22,56,25,51,27,50,30,48,30,50,37,55,42,
  61,42,66,38,70,35,73,33,73,23,72,20,75,15,77,8,80,13,82,17,87,21,90,22,92,21,95,26,
  97,22,99,20,100,14,103,10,105,9,107,11,109,15,108,19,110,21,113,22,117,23,121,25,
  122,30,121,34,119,37,122,40,126,40,128,43,131,43,135,48,141,52,143,54,150,59,158,61,
  163,58,170,60,179,65,170,70,160,70,140,73,120,74,100,76,80,73,70,72,60,70,50,69,
  40,67,33,70,28,70,25,66,21,64,17,62,12,58,10,55,7,53,4,51,0,49,-4,48],
 // Britain & Ireland
 [-5,50,-3,54,-5,58,-2,58,0,54,1,51],
 [-10,52,-6,55,-6,52,-9,51],
 // Japan
 [130,33,135,35,140,38,142,42,145,44,141,45,138,37,133,34],
 // Philippines
 [120,18,122,17,125,12,126,7,123,6,120,10,118,15],
 // Indonesia
 [95,5,105,2,115,-2,119,-5,112,-8,104,-6,97,2],
 [131,-1,140,-3,150,-9,141,-9,134,-6],
 // Australia
 [113,-22,114,-33,118,-35,129,-32,137,-35,141,-38,147,-38,153,-28,153,-25,146,-19,
  142,-11,136,-12,130,-11,125,-14,117,-20],
 // New Zealand & Madagascar
 [173,-35,176,-38,178,-39,174,-41,171,-44,167,-46,170,-43,172,-40],
 [43,-12,50,-15,50,-25,46,-25,43,-18],
 // Greenland
 [-45,60,-33,68,-29,72,-28,78,-38,82,-52,81,-58,74,-55,68,-50,62]
];

function landPaths(){
  return LAND.map(p=>{
    let d="", prev=null;
    for(let i=0;i<p.length;i+=2){
      const x=projX(p[i]), y=projY(p[i+1]);
      d += (prev===null || Math.abs(x-prev)>MAPW/2) ? `M${x.toFixed(1)},${y.toFixed(1)} ` : `L${x.toFixed(1)},${y.toFixed(1)} `;
      prev=x;
    }
    return `<path d="${d}Z" fill="var(--land)" stroke="var(--line2)" stroke-width="1"/>`;
  }).join("");
}
function toVec(lon,lat){const a=lon*Math.PI/180,b=lat*Math.PI/180;
  return [Math.cos(b)*Math.cos(a),Math.cos(b)*Math.sin(a),Math.sin(b)];}
function toLL(v){return [Math.atan2(v[1],v[0])*180/Math.PI, Math.asin(v[2])*180/Math.PI];}
function greatCircle(a,b,n){
  const A=toVec(a[0],a[1]), B=toVec(b[0],b[1]);
  const dot=Math.max(-1,Math.min(1,A[0]*B[0]+A[1]*B[1]+A[2]*B[2])), om=Math.acos(dot);
  const out=[];
  for(let i=0;i<=n;i++){
    const t=i/n;
    if(om<1e-6){ out.push(a); continue; }
    const s1=Math.sin((1-t)*om)/Math.sin(om), s2=Math.sin(t*om)/Math.sin(om);
    out.push(toLL([A[0]*s1+B[0]*s2, A[1]*s1+B[1]*s2, A[2]*s1+B[2]*s2]));
  }
  return out;
}
function arcPath(a,b){
  const pts=greatCircle(a,b,72);
  let d="", prev=null;
  pts.forEach(p=>{
    const x=projX(p[0]), y=projY(p[1]);
    d += (prev===null || Math.abs(x-prev)>MAPW/2) ? `M${x.toFixed(1)},${y.toFixed(1)} ` : `L${x.toFixed(1)},${y.toFixed(1)} `;
    prev=x;
  });
  return d;
}

const MANILA=[121.0,14.6];
const REGIONS=[
 {n:"Metro Manila",      km:20,    ll:[121.0,14.6],  s:"MNL"},
 {n:"Singapore",         km:2400,  ll:[103.8,1.35],  s:"SIN"},
 {n:"Hong Kong",         km:1150,  ll:[114.2,22.3],  s:"HKG"},
 {n:"Tokyo",             km:3000,  ll:[139.7,35.7],  s:"NRT"},
 {n:"Mumbai",            km:5100,  ll:[72.9,19.1],   s:"BOM"},
 {n:"Sydney",            km:6250,  ll:[151.2,-33.9], s:"SYD"},
 {n:"Oregon (US West)",  km:10800, ll:[-119.7,45.8], s:"PDX"},
 {n:"Virginia (US East)",km:13700, ll:[-78.5,38.0],  s:"IAD"}
];
const LIGHT=200000;                                   // km/s in fibre
const POSTURES=[
 {id:"one", n:"One machine, one datacentre",
  d:"The default. Everything in a single availability zone.",
  survives:{srv:false,az:false,reg:false}, rpo:"everything since your last backup", rto:"hours", cost:"1×"},
 {id:"az1", n:"Several machines, one datacentre",
  d:"Panel 19's load balancer. Survives a machine, not the building.",
  survives:{srv:true,az:false,reg:false}, rpo:"everything since your last backup", rto:"hours", cost:"1.3×"},
 {id:"maz", n:"Multi-AZ · two datacentres, one region",
  d:"Replication is synchronous, because the buildings are milliseconds apart.",
  survives:{srv:true,az:true,reg:false}, rpo:"nothing", rto:"under a minute", cost:"2×"},
 {id:"mreg", n:"Multi-region · standby in Tokyo",
  d:"Replication is asynchronous, because Tokyo is 3,000 km away.",
  survives:{srv:true,az:true,reg:true}, rpo:"up to 30 seconds of writes", rto:"10 to 30 minutes", cost:"2.3×"}
];
const REG={idx:1, posture:"maz", dead:{srv:false,az:false,reg:false}};
function latency(km){
  const phys=2*km/LIGHT*1000;
  return {phys, real:Math.max(1.5, phys*1.5+2)};
}
function renderRegion(){
  const r=REGIONS[REG.idx], L=latency(r.km);
  const P=POSTURES.find(p=>p.id===REG.posture);
  $("#vRegion").textContent=r.n;

  const P2=P, dr=REGIONS[3];                       // Tokyo is the standby
  const isMulti = P.id==="mreg";
  const regDead = REG.dead.reg;
  const azCount = (P.id==="one"||P.id==="az1") ? 1 : 2;

  let svg = landPaths();
  // graticule for a bit of depth
  for(let g=-120;g<=180;g+=30) svg+=`<line x1="${projX(g+LON_C)}" y1="0" x2="${projX(g+LON_C)}" y2="${MAPH}" stroke="var(--grid)" stroke-width="1"/>`;
  for(let g=-40;g<=70;g+=20) svg+=`<line x1="0" y1="${projY(g)}" x2="${MAPW}" y2="${projY(g)}" stroke="var(--grid)" stroke-width="1"/>`;

  // faint dots for the regions not chosen
  REGIONS.forEach((q,i)=>{
    if(i===REG.idx || i===0 || (isMulti && q===dr)) return;
    svg+=`<circle cx="${projX(q.ll[0])}" cy="${projY(q.ll[1])}" r="3.5" fill="var(--line3)"/>
          <text x="${projX(q.ll[0])}" y="${projY(q.ll[1])-8}" fill="var(--faint)" font-family="monospace" font-size="10" text-anchor="middle">${q.s}</text>`;
  });

  // replication arc to the standby, when there is one
  if(isMulti){
    svg+=`<path d="${arcPath(r.ll,dr.ll)}" fill="none" stroke="${regDead?"var(--res)":"var(--line3)"}" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    const dcol=regDead?"var(--res)":"var(--faint)";
    svg+=`<circle cx="${projX(dr.ll[0])}" cy="${projY(dr.ll[1])}" r="7" fill="none" stroke="${dcol}" stroke-width="2"/>
          <circle cx="${projX(dr.ll[0])}" cy="${projY(dr.ll[1])}" r="3" fill="${dcol}"/>
          <text x="${projX(dr.ll[0])}" y="${projY(dr.ll[1])-13}" fill="${dcol}" font-family="monospace" font-size="10.5" text-anchor="middle">${regDead?"NRT · now primary":"NRT · standby"}</text>`;
  }

  // the arc that matters: users to primary
  const live = !regDead;
  const acol = live ? "var(--req)" : "var(--warn)";
  svg+=`<path d="${arcPath(MANILA,r.ll)}" fill="none" stroke="${acol}" stroke-width="2.4" ${live?"":'stroke-dasharray="6 5"'} opacity=".95"/>`;

  // primary region marker
  const px=projX(r.ll[0]), py=projY(r.ll[1]);
  svg+=`<circle cx="${px}" cy="${py}" r="11" fill="${acol}" opacity=".18"/>
        <circle cx="${px}" cy="${py}" r="5.5" fill="${acol}"/>
        <text x="${px}" y="${py-15}" fill="${acol}" font-family="monospace" font-size="11.5" font-weight="600" text-anchor="middle">${r.s}${regDead?" ✕":""}</text>`;
  // availability zones as small satellites
  for(let i=0;i<azCount;i++){
    const dead = regDead || (REG.dead.az && i===0);
    const ax=px+(i?12:-12), ay=py+13;
    svg+=`<rect x="${ax-4}" y="${ay-4}" width="8" height="8" rx="1.5"
           fill="${dead?"none":"var(--res)"}" stroke="${dead?"var(--warn)":"var(--res)"}" stroke-width="1.4"/>`;
  }

  // users
  const ux=projX(MANILA[0]), uy=projY(MANILA[1]);
  svg+=`<circle cx="${ux}" cy="${uy}" r="13" fill="var(--res)" opacity=".14"/>
        <circle cx="${ux}" cy="${uy}" r="5" fill="var(--res)"/>`;
  if(REG.idx!==0) svg+=`<text x="${ux}" y="${uy+22}" fill="var(--res)" font-family="monospace" font-size="10.5" text-anchor="middle">MNL · your users</text>`;

  // the number, on the arc
  // fixed readout, so short hops do not stack labels on top of each other
  svg+=`<rect x="14" y="14" width="196" height="62" rx="6" fill="var(--bg)" stroke="${acol}" stroke-width="1" opacity=".95"/>
        <text x="26" y="33" fill="var(--faint)" font-family="monospace" font-size="9.5" letter-spacing="1.4">MANILA \u2192 ${r.s}</text>
        <text x="26" y="53" fill="${acol}" font-family="monospace" font-size="19" font-weight="600">${Math.round(L.real)} ms</text>
        <text x="104" y="53" fill="var(--dim)" font-family="monospace" font-size="11">round trip</text>
        <text x="26" y="69" fill="var(--faint)" font-family="monospace" font-size="10">${r.km.toLocaleString()} km \u00b7 floor ${L.phys.toFixed(0)} ms</text>`;

  // clickable hit areas, last so nothing is drawn over them
  REGIONS.forEach((q,i)=>{
    if(i===0) return;                       // Metro Manila is where the users are
    svg+=`<circle class="pick" data-r="${i}" cx="${projX(q.ll[0])}" cy="${projY(q.ll[1])}"
            r="15" fill="transparent"><title>${q.n} — ${q.km.toLocaleString()} km</title></circle>`;
  });
  $("#worldMap").innerHTML=svg;

  // latency readouts, and what it does to panel 03's five round trips
  const ttfb=L.real*5+40;
  $("#latStats").innerHTML=[
    ["var(--line2)","Distance, one way", r.km.toLocaleString()+" km"],
    ["var(--res)","Physics floor, round trip", L.phys.toFixed(0)+" ms"],
    ["var(--req)","Realistic round trip", L.real.toFixed(0)+" ms"],
    ["var(--req)","Five round trips + 40 ms handler", Math.round(ttfb)+" ms"]
  ].map(([c,n,v])=>`<div class="lg"><i style="background:${c}"></i>${n}<b>${v}</b></div>`).join("");

  const v=$("#latVerdict");
  if(r.km<100){
    v.className="verdict ok";
    v.innerHTML=`<b>Next door, ${L.real.toFixed(0)} ms</b>Latency is effectively free. Almost nobody gets this, and a region inside Metro Manila is not something most providers sell you.`;
  } else if(ttfb<400){
    v.className="verdict ok";
    v.innerHTML=`<b>${Math.round(ttfb)} ms to first byte</b>Comfortable. Your handler is 40 ms of that and the rest is distance you cannot code away. For users in Metro Manila this is about as good as it gets from a real cloud region.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>${Math.round(ttfb)} ms before anything appears</b>${r.n} is ${r.km.toLocaleString()} km away, so every round trip costs ${L.real.toFixed(0)} ms and a page needs five of them. Your code is still 40 ms of that. This is panel 03's Berlin problem, chosen on purpose by picking the wrong region. The only fix is moving closer, or serving reads from a copy that already is.`;
  }

  // posture cards
  $("#postureList").innerHTML=POSTURES.map(p=>`
    <button class="po${p.id===REG.posture?" on":""}" data-p="${p.id}">
      <h5>${p.n}</h5><p>${p.d}</p>
      <div class="tags"><span>cost ${p.cost}</span><span>lose ${p.rpo}</span><span>back in ${p.rto}</span></div>
    </button>`).join("");
  $$("#postureList .po").forEach(el=>el.onclick=()=>{
    REG.posture=el.dataset.p; REG.dead={srv:false,az:false,reg:false}; renderRegion();
  });

  // failure state
  const anyDead=REG.dead.srv||REG.dead.az||REG.dead.reg;
  let up=true, why="";
  if(REG.dead.reg){ up=P.survives.reg; why="the whole region"; }
  else if(REG.dead.az){ up=P.survives.az; why="a datacentre"; }
  else if(REG.dead.srv){ up=P.survives.srv; why="one machine"; }

  $("#foStats").innerHTML=[
    ["var(--res)","Survives a machine", P.survives.srv?"yes":"no"],
    ["var(--res)","Survives a datacentre", P.survives.az?"yes":"no"],
    ["var(--res)","Survives a region", P.survives.reg?"yes":"no"],
    ["var(--req)","Runs at", P.cost+" the cost"]
  ].map(([c,n,val])=>`<div class="lg"><i style="background:${val==="no"?"var(--warn)":c}"></i>${n}<b style="${val==="no"?"color:var(--warn)":""}">${val}</b></div>`).join("");

  const fv=$("#foVerdict");
  if(!anyDead){
    fv.className="verdict";
    fv.innerHTML=`<b>Everything healthy</b>Press one of the buttons and see what this posture protects you from.`;
  } else if(up && REG.dead.reg){
    fv.className="verdict warn";
    fv.innerHTML=`<b>Failed over to Tokyo, and it was not free</b>You survived losing ${why}, but the standby was replicating asynchronously across 3,000 km, so you lost <b class="i">${P.rpo}</b> and were dark for <b class="i">${P.rto}</b>. Every user is now talking to Tokyo, which is further away than Singapore, so the whole site is slower until you fail back.`;
  } else if(up){
    fv.className="verdict ok";
    fv.innerHTML=`<b>Still up</b>You lost ${why} and nobody noticed. Replication here is synchronous. The buildings are close enough that a write can land in both before you answer. So you lost <b class="i">${P.rpo}</b>.`;
  } else {
    fv.className="verdict bad";
    fv.innerHTML=`<b>Down</b>You lost ${why}, and this posture does not survive that. You are restoring from backup: dark for <b class="i">${P.rto}</b>, and losing <b class="i">${P.rpo}</b>. Those two numbers have names. <b class="i">RTO</b> is how long until you are back. <b class="i">RPO</b> is how much data you accept losing. Pick them before the outage, because afterwards they are chosen for you.`;
  }
}
$("#sRegion").oninput=e=>{REG.idx=+e.target.value;renderRegion()};
// pick a region straight off the map, and keep the slider in step
$("#worldMap").addEventListener("click", e=>{
  const t=e.target.closest("[data-r]");
  if(!t) return;
  REG.idx=+t.dataset.r;
  $("#sRegion").value=REG.idx;
  renderRegion();
});
$("#killSrv").onclick=()=>{REG.dead={srv:true,az:false,reg:false};renderRegion()};
$("#killAz").onclick =()=>{REG.dead={srv:false,az:true,reg:false};renderRegion()};
$("#killReg").onclick=()=>{REG.dead={srv:false,az:false,reg:true};renderRegion()};
$("#fixAll").onclick =()=>{REG.dead={srv:false,az:false,reg:false};renderRegion()};
renderRegion();

/* ================= TRANSACTIONS ================= */
/* each step: [who, text, seatsAfter, flag]  who: a | b | db */
const TXN=[
 {id:"none", n:"No transaction", ok:false,
  note:"Four plain statements from each session, interleaved the way the operating system happens to schedule them. Nothing here is wrong on its own. The bug only exists in the gap between reading and writing.",
  steps:[
   ["a","SELECT slots FROM courses  &rarr; 1",1],
   ["b","SELECT slots FROM courses  &rarr; 1",1],
   ["a","slots > 0, so go ahead",1],
   ["b","slots > 0, so go ahead",1],
   ["a","UPDATE courses SET slots = 0",0],
   ["b","UPDATE courses SET slots = 0",0],
   ["a","INSERT INTO enrollments &hellip;",0],
   ["b","INSERT INTO enrollments &hellip;",0]],
  v:`<b>Two enrolments, one seat</b>Both sessions read <code>1</code> before either wrote, so both passed the check. The second UPDATE wrote a value it calculated from a number that was already stale. Nobody made a mistake and the seat is still oversold.<br><br>This is a <b class="i">lost update</b>, the most common concurrency bug in student projects.`},
 {id:"begin", n:"BEGIN … COMMIT", ok:false,
  note:"The same statements, wrapped in a transaction each. This is what most people reach for, and it is worth watching carefully, because the outcome does not change.",
  steps:[
   ["a","BEGIN",1],
   ["b","BEGIN",1],
   ["a","SELECT slots  &rarr; 1",1],
   ["b","SELECT slots  &rarr; 1",1],
   ["a","UPDATE courses SET slots = 0",0],
   ["a","INSERT INTO enrollments &hellip;",0],
   ["a","COMMIT",0],
   ["b","UPDATE courses SET slots = 0",0],
   ["b","INSERT INTO enrollments &hellip;",0],
   ["b","COMMIT",0]],
  v:`<b>Still two enrolments. The transaction did not help.</b>Atomicity means <em>your</em> statements land together or not at all, and both sessions got that. It says nothing about whether the other session read the row while you were deciding.<br><br>At <code>READ COMMITTED</code>, which is the default in Postgres and most others, session B's SELECT was allowed to see the pre-commit value. <b class="i">A transaction is a unit of work, not a lock.</b>`},
 {id:"lock", n:"SELECT … FOR UPDATE", ok:true,
  note:"Session A asks the database to hold the row while it decides. Anyone else reading that row with the same intent waits until A finishes. Watch what B reads when it finally gets in.",
  steps:[
   ["a","BEGIN",1],
   ["a","SELECT slots FOR UPDATE  &rarr; 1",1],
   ["b","BEGIN",1],
   ["b","SELECT slots FOR UPDATE &hellip;",1,"blocked"],
   ["a","UPDATE courses SET slots = 0",0],
   ["a","INSERT INTO enrollments &hellip;",0],
   ["a","COMMIT",0],
   ["b","&hellip; unblocked, reads  &rarr; 0",0],
   ["b","slots is 0, refuse",0,"fail"],
   ["b","ROLLBACK",0]],
  v:`<b>One enrolment, and B was told no</b>The lock made B wait rather than read something about to be wrong. When it finally read, it read the truth. Look at what it cost: B sat there doing nothing while A finished, and on enlistment morning that queue is nine thousand deep.<br><br>Correct, and the reason panel 19's database ceiling does not move when you add web servers.`},
 {id:"atomic", n:"One statement", ok:true,
  note:"No lock, no read-then-write. The decision and the change become a single statement, and the database is free to serialize it however it likes. Check how many rows it says it changed.",
  steps:[
   ["a","UPDATE courses SET slots = slots - 1<br>&nbsp;WHERE code = 'ITENT 45' AND slots > 0",0],
   ["a","&rarr; UPDATE 1, so the seat is mine",0],
   ["b","UPDATE courses SET slots = slots - 1<br>&nbsp;WHERE code = 'ITENT 45' AND slots > 0",0],
   ["b","&rarr; UPDATE 0, nothing matched",0,"fail"],
   ["a","INSERT INTO enrollments &hellip;",0],
   ["b","no seat, no insert",0,"fail"]],
  v:`<b>One enrolment, and nobody waited</b>The check moved into the <code>WHERE</code>, so there is no gap between reading and deciding. The database applied both statements in some order it chose, and the second one simply matched no rows.<br><br><b class="i">The row count is the answer.</b> <code>UPDATE 1</code> means you got it; <code>UPDATE 0</code> means somebody else did. Cheaper than a lock and harder to get wrong, whenever the decision can be written as a condition.`}
];
let txnSel="none", txnAt=0, txnTimer=null;
function renderTxn(){
  const t=TXN.find(x=>x.id===txnSel);
  $("#txnTab").innerHTML=TXN.map(x=>
    `<button data-t="${x.id}" aria-pressed="${x.id===txnSel}">${x.n}</button>`).join("");
  $$("#txnTab button").forEach(el=>el.onclick=()=>{
    clearTimeout(txnTimer); txnSel=el.dataset.t; txnAt=0; renderTxn();
  });

  let h=`<div class="th a">Juan &middot; session A</div><div class="th b">Maria &middot; session B</div><div class="th">seats</div>`;
  t.steps.forEach((st,i)=>{
    const [who,txt,seats,flag]=st;
    const on=i<txnAt, act=i===txnAt-1;
    const cell=`<div class="tstep ${who} ${on?"on":""} ${act?"act":""} ${flag||""}">${txt}</div>`;
    h += who==="a" ? cell+`<div class="tstep"></div>` : `<div class="tstep"></div>`+cell;
    h += `<div class="tstep db ${on?"on":""}">${on?seats:""}</div>`;
  });
  $("#txnLine").innerHTML=h;
  $("#txnNote").innerHTML=t.note;

  const v=$("#txnVerdict");
  if(txnAt<t.steps.length){
    v.className="verdict";
    v.innerHTML=`<b>${txnAt} of ${t.steps.length} steps</b>Press Step, or Run it. Watch the seats column, and watch when each session reads it.`;
  } else {
    v.className="verdict "+(t.ok?"ok":"bad");
    v.innerHTML=t.v;
  }
}
$("#txnStep").onclick=()=>{
  const t=TXN.find(x=>x.id===txnSel);
  if(txnAt<t.steps.length){ txnAt++; renderTxn(); }
};
$("#txnPlay").onclick=()=>{
  clearTimeout(txnTimer);
  const t=TXN.find(x=>x.id===txnSel);
  txnAt=0; renderTxn();
  const tick=()=>{ if(txnAt<t.steps.length){ txnAt++; renderTxn(); txnTimer=setTimeout(tick,620);} };
  txnTimer=setTimeout(tick,300);
};
$("#txnReset").onclick=()=>{ clearTimeout(txnTimer); txnAt=0; renderTxn(); };
renderTxn();

/* ================= SQL CRUD ================= */
const SQL_SEED=[
 {code:"ITENT 45", title:"Application Dev & Emerging Tech", units:3, slots:4},
 {code:"CSCI 21",  title:"Data Structures",                units:3, slots:0},
 {code:"ITMGT 25", title:"Programming Fundamentals",       units:3, slots:12}
];
const STMTS=[
 {id:"sel",  v:"SELECT", danger:false,
  q:`SELECT code, title, slots\n  FROM courses;`,
  note:"Reads and changes nothing. Run it a thousand times and the table is untouched. This is what <b>safe</b> means, and only one of the four qualifies.",
  run:(r)=>({rows:r, out:r.length+" rows returned", mark:null, fx:"nothing changed"})},
 {id:"selw", v:"SELECT", danger:false,
  q:`SELECT *\n  FROM courses\n WHERE code = 'CSCI 21';`,
  note:"The same statement with a <code>WHERE</code>. Get in the habit of writing the filter here first, where it cannot hurt you, before you put it on an UPDATE.",
  run:(r)=>({rows:r, out:"1 row returned", mark:{hit:"CSCI 21"}, fx:"nothing changed"})},
 {id:"ins",  v:"INSERT", danger:false,
  q:`INSERT INTO courses (code, title, units, slots)\nVALUES ('MATH 11', 'Linear Algebra', 3, 25);`,
  note:"Adds a row. Run it twice and you have two courses called MATH 11, exactly as POST gave you two rows in panel 05. Not idempotent, and nothing stops you.",
  run:(r)=>{const n=[...r,{code:"MATH 11",title:"Linear Algebra",units:3,slots:25}];
            return {rows:n, out:"INSERT 0 1", mark:{add:"MATH 11"}, fx:"1 row added"};}},
 {id:"upd",  v:"UPDATE", danger:false,
  q:`UPDATE courses\n   SET slots = 10\n WHERE code = 'CSCI 21';`,
  note:"Changes one row because the filter matched one row. Run it again and slots is still 10, so the end state does not move. Idempotent, and still not safe.",
  run:(r)=>({rows:r.map(x=>x.code==="CSCI 21"?{...x,slots:10}:x),
             out:"UPDATE 1", mark:{chg:["CSCI 21"]}, fx:"1 row changed"})},
 {id:"updall", v:"UPDATE", danger:true,
  q:`UPDATE courses\n   SET slots = 0;`,
  note:"The same statement with the filter left off. Valid SQL, runs without complaint, and touches every row in the table. Nothing in the database knows you meant one of them.",
  run:(r)=>({rows:r.map(x=>({...x,slots:0})), out:"UPDATE "+r.length,
             mark:{chg:r.map(x=>x.code)}, fx:r.length+" rows changed"})},
 {id:"del",  v:"DELETE", danger:false,
  q:`DELETE FROM courses\n WHERE code = 'ITMGT 25';`,
  note:"Removes the matching row. Run it again and it removes nothing, because there is nothing left to match. Same end state, so idempotent, and no undo.",
  run:(r)=>{const had=r.some(x=>x.code==="ITMGT 25");
            return {rows:r.filter(x=>x.code!=="ITMGT 25"),
                    out:"DELETE "+(had?1:0), mark:null, fx:had?"1 row removed":"0 rows matched"};}},
 {id:"delall", v:"DELETE", danger:true,
  q:`DELETE FROM courses;`,
  note:"Every row, no filter, no confirmation, no undo. The number it prints afterwards is the only sign anything happened.",
  run:(r)=>({rows:[], out:"DELETE "+r.length, mark:null, fx:"table emptied"})}
];
const SQ={rows:JSON.parse(JSON.stringify(SQL_SEED)), sel:"sel", last:null, mark:null, ran:0};
function sqlRender(){
  const m=SQ.mark||{};
  $("#sqlBody").innerHTML = SQ.rows.length ? SQ.rows.map(r=>{
    const hit=m.hit===r.code, add=m.add===r.code, chg=(m.chg||[]).includes(r.code);
    const cls=add?"added":hit?"picked":"";
    const c=f=>`<td class="${f==="code"?"k ":""}${chg&&f!=="code"?"hl":""}">${r[f]}</td>`;
    return `<tr class="${cls}">${c("code")}${c("title")}${c("units")}${c("slots")}</tr>`;
  }).join("") : `<tr><td colspan="4" style="color:var(--warn);font-family:var(--mono);font-size:.8em">no rows</td></tr>`;
  $("#sqlCount").textContent=SQ.rows.length+" rows";

  $("#sqlList").innerHTML=STMTS.map(q=>`
    <button class="rq${q.id===SQ.sel?" on":""}" data-s="${q.id}">
      <span class="vb ${q.v==="SELECT"?"GET":q.v==="INSERT"?"POST":q.v==="UPDATE"?"PUT":"DELETE"}">${q.v}</span>
      <span class="pt">${q.q.split("\n")[0].replace(/</g,"&lt;")}<small>${q.danger?"<b style='color:var(--warn)'>no WHERE clause</b>":"filtered"}</small></span>
    </button>`).join("");
  $$("#sqlList .rq").forEach(el=>el.onclick=()=>{SQ.sel=el.dataset.s;SQ.ran=0;sqlRender()});

  const q=STMTS.find(x=>x.id===SQ.sel);
  $("#sqlOut").innerHTML =
    q.q.replace(/</g,"&lt;")
       .replace(/\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|SET|INTO|VALUES)\b/g,
                '<span class="kw">$1</span>')
       .replace(/'([^']*)'/g, "<span class=\"s\">'$1'</span>")
    + (SQ.last ? "\n\n<span class=\"c\">-- " + SQ.last + "</span>" : "");
  $("#sqlNote").innerHTML=q.note;
}
function sqlVerdict(q,res){
  const v=$("#sqlVerdict");
  if(q.danger){
    v.className="verdict bad";
    v.innerHTML=`<b>${res.fx}, and nothing asked whether you were sure</b>The filter was missing, so the statement applied to every row. It did not fail, it did not warn, and there is no undo. <b class="i">This is the most common way a person destroys production data</b>, and it is one forgotten line.<br><br>Write the <code>SELECT</code> with that same <code>WHERE</code> first. Look at what comes back. Then change the verb.`;
  } else if(q.v==="SELECT"){
    v.className="verdict ok";
    v.innerHTML=`<b>${res.out}, and the table is untouched</b>Reading changes nothing, so you can run it against production without asking anyone. The other three you cannot.`;
  } else if(q.id==="ins" && SQ.rows.filter(x=>x.code==="MATH 11").length>1){
    const dup=SQ.rows.filter(x=>x.code==="MATH 11").length;
    v.className="verdict bad";
    v.innerHTML=`<b>${dup} rows now called MATH 11</b>INSERT is not idempotent, exactly like POST in panel 05. Same statement, another row every time. Nothing in SQL stops you creating duplicates unless you asked for a constraint, and the table has no idea these are the same course.`;
  } else {
    v.className="verdict warn";
    v.innerHTML=`<b>${res.out}</b>${SQ.ran>1
      ? `Run ${SQ.ran} times and the table has stopped moving. ${q.v} is <b class="i">idempotent</b>: the end state after ten runs is the end state after one. It still changed your data, so it is not safe. Two separate questions.`
      : `Now press Run again and watch whether anything moves.`}`;
  }
}
$("#sqlRun").onclick=()=>{
  const q=STMTS.find(x=>x.id===SQ.sel);
  const res=q.run(SQ.rows);
  SQ.rows=res.rows; SQ.mark=res.mark; SQ.last=res.out+"   ("+res.fx+")"; SQ.ran++;
  sqlRender(); sqlVerdict(q,res);
};
$("#sqlReset").onclick=()=>{
  SQ.rows=JSON.parse(JSON.stringify(SQL_SEED)); SQ.mark=null; SQ.last=null; SQ.ran=0;
  sqlRender(); $("#sqlVerdict").className="verdict"; $("#sqlVerdict").innerHTML="<b>Back to three rows</b>Pick a statement and press Run.";
};
sqlRender();
$("#sqlVerdict").className="verdict";
$("#sqlVerdict").innerHTML="<b>Pick a statement and press Run</b>Then press Run a second time without changing anything, which is the part that tells you what the statement actually promised.";

/* ================= REA / UNIVERSAL DATA MODELS ================= */
/* ---- crow's feet up and left, and what that sorts ---- */
const ERD_E={
 payment   :{n:"Payment",    vol:"high",  rows:"~40k a term"},
 enrollment:{n:"Enrolment",  vol:"high",  rows:"~30k a term"},
 section   :{n:"Section",    vol:"mid",   rows:"~600 a term"},
 student   :{n:"Student",    vol:"low",   rows:"~9,000, slowly"},
 course    :{n:"Course",     vol:"low",   rows:"~1,200, rarely"},
 room      :{n:"Room",       vol:"low",   rows:"~200, almost never"}
};
// child -> parent. The crow's foot is drawn at the child, the many side.
const ERD_R=[["enrollment","student"],["enrollment","section"],
             ["payment","student"],["section","course"],["section","room"]];
const ERD_POS={
  tidy:{payment:[34,20],enrollment:[214,92],section:[396,166],
        student:[396,292],course:[606,232],room:[606,318]},
  messy:{payment:[430,300],enrollment:[70,180],section:[610,60],
         student:[250,40],course:[440,140],room:[80,320]}
};
let erdMode="messy";
const ERD_W=150, ERD_H=42;
function erdFill(v){ return v==="high"?"var(--req)":v==="mid"?"var(--line3)":"var(--res)"; }
/* where a line from the centre of a box towards (tx,ty) crosses that box's edge */
function edgePt(bx,by,bw,bh,tx,ty){
  const cx=bx+bw/2, cy=by+bh/2, dx=tx-cx, dy=ty-cy;
  if(!dx && !dy) return [cx,cy];
  const s=Math.min(dx?(bw/2)/Math.abs(dx):1e9, dy?(bh/2)/Math.abs(dy):1e9);
  return [cx+dx*s, cy+dy*s];
}
/* the many symbol: three prongs opening onto the entity it touches */
function crow(ex,ey,tx,ty){
  const a=Math.atan2(ty-ey,tx-ex), L=15, SP=7;
  const ax=ex+L*Math.cos(a), ay=ey+L*Math.sin(a);        // apex, out along the line
  const px=-Math.sin(a)*SP, py=Math.cos(a)*SP;            // perpendicular spread
  return `<path d="M${ax},${ay} L${ex},${ey}
                   M${ax},${ay} L${ex+px},${ey+py}
                   M${ax},${ay} L${ex-px},${ey-py}"
           stroke="var(--req)" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
}
function renderErd(){
  const P=ERD_POS[erdMode];
  const c=id=>[P[id][0]+ERD_W/2, P[id][1]+ERD_H/2];
  let svg=`<svg viewBox="0 0 800 380" xmlns="http://www.w3.org/2000/svg">`;
  if(erdMode==="tidy")
    svg+=`<text x="210" y="18" fill="var(--faint)" font-family="monospace" font-size="11">volatile &#8598;</text>
          <text x="330" y="372" fill="var(--faint)" font-family="monospace" font-size="11">&#8600; static</text>
          <line x1="18" y1="30" x2="782" y2="352" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 6"/>`;
  ERD_R.forEach(([ch,pa])=>{
    const [cx1,cy1]=c(ch), [cx2,cy2]=c(pa);
    const [x1,y1]=edgePt(P[ch][0],P[ch][1],ERD_W,ERD_H,cx2,cy2);   // leaves the child's edge
    const [x2,y2]=edgePt(P[pa][0],P[pa][1],ERD_W,ERD_H,cx1,cy1);   // arrives at the parent's
    svg+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--line2)" stroke-width="1.3"/>`;
    svg+=`<circle cx="${x2}" cy="${y2}" r="3" fill="var(--res)"/>`;   // the one end
    svg+=crow(x1,y1,x2,y2);                                          // the many end
  });
  Object.entries(ERD_E).forEach(([id,e])=>{
    const [x,y]=P[id];
    svg+=`<g class="erdBox" transform="translate(${x},${y})">
      <rect width="${ERD_W}" height="${ERD_H}" rx="6" fill="var(--panel2)"
            stroke="${erdFill(e.vol)}" stroke-width="1.6"/>
      <text x="10" y="18" fill="var(--ink)" font-family="var(--sans)" font-size="13" font-weight="600">${e.n}</text>
      <text x="10" y="33" fill="var(--faint)" font-family="monospace" font-size="10">${e.rows}</text>
    </g>`;
  });
  $("#erdDia").innerHTML=svg+`</svg>`;

  $("#erdTab").innerHTML=[["messy","As it usually gets drawn"],["tidy","Crow's feet up and left"]]
    .map(([k,l])=>`<button data-e="${k}" aria-pressed="${k===erdMode}">${l}</button>`).join("");
  $$("#erdTab button").forEach(el=>el.onclick=()=>{erdMode=el.dataset.e;renderErd()});

  const v=$("#erdVerdict");
  if(erdMode==="messy"){
    v.className="verdict warn";
    v.innerHTML=`<b>Same five relationships, no information in the positions</b>Every box is correct and the diagram is still hard to read. Crow's feet point in five directions, lines cross for no reason, and nothing about where a box sits tells you anything about it. Switch modes.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>The diagram sorted itself by volatility</b>Nothing was said about which entities are busy. The only rule applied was <em>point the crow's feet up and left</em>, and because the crow's foot lives on the many side, and the many side is the thing that happens, the events walked to the north-west and the things they refer to walked to the south-east.<br><br>Read the diagonal: <b class="i">Payment and Enrolment</b> at the top left, tens of thousands of rows a term. <b class="i">Student, Course and Room</b> at the bottom right, changing slowly if at all. Section sits in the middle because it is both. Every foreign key now points down and to the right, which is also the direction of <em>depends on</em>.`;
  }
}
renderErd();


const REA=[
 {id:"enrol", n:"Enrolment",
  give:{res:"Class seat", resS:"one of 40 in a section", evt:"Enrolment", evtS:"a row per student per course",
        agtIn:"Registrar", agtOut:"Student"},
  take:{res:"Tuition", resS:"cash, or a promise of it", evt:"Payment", evtS:"a row per amount received",
        agtIn:"Cashier", agtOut:"Student"},
  gap:"A student holding a seat with no matching payment. Every school has a report for this, and it exists because the two events are separate."},
 {id:"shop", n:"Online store",
  give:{res:"Stock item", resS:"what is on the shelf", evt:"Sale", evtS:"a row per line of an order",
        agtIn:"Merchant", agtOut:"Customer"},
  take:{res:"Cash", resS:"what the gateway settles", evt:"Payment", evtS:"a row per charge",
        agtIn:"Merchant", agtOut:"Customer"},
  gap:"Goods shipped with no settled payment. This is panel 08's whole problem, seen from the data side rather than the wire."},
 {id:"lib", n:"Library loan",
  give:{res:"Book copy", resS:"a physical thing, one at a time", evt:"Loan", evtS:"a row per borrowing",
        agtIn:"Librarian", agtOut:"Borrower"},
  take:{res:"Book copy", resS:"the same one, coming back", evt:"Return", evtS:"a row per return",
        agtIn:"Librarian", agtOut:"Borrower"},
  gap:"A loan with no return. That is not a bug report, it is an overdue notice, and it falls out of the model for free."},
 {id:"clinic", n:"Clinic visit",
  give:{res:"Consultation slot", resS:"a doctor's time", evt:"Appointment", evtS:"a row per booking",
        agtIn:"Doctor", agtOut:"Patient"},
  take:{res:"Fee", resS:"cash or an insurance claim", evt:"Billing", evtS:"a row per charge raised",
        agtIn:"Clinic", agtOut:"Patient or insurer"},
  gap:"A consultation given and never billed. Same shape, different words, same missing row."}
];
let reaSel="enrol";
const RB_W=210, RB_H=54;
function reaBox(x,y,kind,label,val,sub){
  const col=kind==="res"?"var(--res)":kind==="evt"?"var(--req)":"var(--line3)";
  const bg =kind==="evt"?"rgba(194,65,12,.08)":"var(--panel2)";
  return `<g transform="translate(${x},${y})">
    <rect width="${RB_W}" height="${RB_H}" rx="7" fill="${bg}" stroke="${col}" stroke-width="1.7"/>
    <text x="11" y="17" fill="${col}" font-family="monospace" font-size="9.5" letter-spacing="1.6">${label}</text>
    <text x="11" y="34" fill="var(--ink)" font-family="var(--sans)" font-size="14" font-weight="600">${val}</text>
    <text x="11" y="47" fill="var(--faint)" font-family="monospace" font-size="9.5">${sub}</text>
  </g>`;
}
function reaSide(d, dir, ox){
  const yR=8, yE=118, yA=228;
  const cE=[ox+RB_W/2, yE+RB_H/2];
  let g=reaBox(ox,yR,"res","RESOURCE",d.res,d.resS)
      + reaBox(ox,yE,"evt","EVENT &middot; "+dir.toUpperCase(),d.evt,d.evtS)
      + reaBox(ox,yA,"agt","AGENTS",d.agtOut+" + "+d.agtIn,"outside, and inside");
  // resource -> event, and agent -> event. The event is the many side of both.
  [[yR, 1],[yA, -1]].forEach(([yB,dirn])=>{
    const cB=[ox+RB_W/2, yB+RB_H/2];
    const [x1,y1]=edgePt(ox,yE,RB_W,RB_H,cB[0],cB[1]);
    const [x2,y2]=edgePt(ox,yB,RB_W,RB_H,cE[0],cE[1]);
    g+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--line2)" stroke-width="1.3"/>`
      +`<circle cx="${x2}" cy="${y2}" r="3" fill="var(--res)"/>`
      +crow(x1,y1,x2,y2);
    g+=`<text x="${ox+RB_W/2+8}" y="${(y1+y2)/2+3}" fill="var(--faint)"
          font-family="monospace" font-size="9.5">${dirn>0?"changes":"acts in"}</text>`;
  });
  return g;
}
function renderRea(){
  const r=REA.find(x=>x.id===reaSel);
  $("#reaTab").innerHTML=REA.map(x=>
    `<button data-r="${x.id}" aria-pressed="${x.id===reaSel}">${x.n}</button>`).join("");
  $$("#reaTab button").forEach(el=>el.onclick=()=>{reaSel=el.dataset.r;renderRea()});

  const L=20, R=470, yE=118;
  const svg=`<svg viewBox="0 0 700 300" xmlns="http://www.w3.org/2000/svg">
    ${reaSide(r.give,"give",L)}
    ${reaSide(r.take,"take",R)}
    <line x1="${L+RB_W}" y1="${yE+RB_H/2}" x2="${R}" y2="${yE+RB_H/2}"
          stroke="var(--req)" stroke-width="1.6" stroke-dasharray="5 4"/>
    <text x="${(L+RB_W+R)/2}" y="${yE+RB_H/2-10}" fill="var(--req)" text-anchor="middle"
          font-family="monospace" font-size="10" letter-spacing="1.6">DUALITY</text>
    <text x="${(L+RB_W+R)/2}" y="${yE+RB_H/2+20}" fill="var(--faint)" text-anchor="middle"
          font-family="monospace" font-size="9.5">one pays for the other</text>
  </svg>`;
  $("#reaDia").innerHTML=svg;

  const v=$("#reaVerdict");
  v.className="verdict ok";
  v.innerHTML=`<b>Six boxes, and only the words changed</b>Switch between the four and watch which parts move. The labels do. The shape does not: something of value, an event that moved it, two parties, and a second event pairing the first.<br><br>Note where the crow's feet sit. One resource is touched by many events, and one agent takes part in many events, so the <b class="i">event carries both foreign keys</b> &mdash; which is panel 10's rule arriving from a different direction.<br><br><b class="i">The question this model answers for free:</b> ${r.gap}`;
}
renderRea();

/* ================= RELATIONSHIPS & CARDINALITY ================= */
const CARDS=[
 {id:"o2o", n:"One to one", sym:"1 &mdash; 1",
  q:"One student has one locker, and one locker belongs to one student.",
  tables:[{n:"students",c:["<b>id</b> pk","name","<i>locker_id</i> fk unique"]},
          {n:"lockers",c:["<b>id</b> pk","location"]}],
  note:"The foreign key can sit on either side, and a <code>unique</code> on it is what actually enforces the <em>one</em>. Without that constraint you have built one-to-many and written 1:1 on the diagram.<br><br>Ask whether you need two tables at all. If a locker has no life of its own, it is a column.",
  v:`<b>Two tables, one of them optional</b>A unique foreign key on either side. The rarest of the three, and often a sign that two entities should have been one.`},
 {id:"o2m", n:"One to many", sym:"1 &mdash; &#8734;",
  q:"One course has many sections, and each section belongs to one course.",
  tables:[{n:"courses",c:["<b>id</b> pk","code","title"]},
          {n:"sections",c:["<b>id</b> pk","letter","<i>course_id</i> fk"]}],
  note:"The foreign key goes on the <em>many</em> side, always. Putting it on the one side would mean a column holding a list, which relational tables do not do.<br><br>This is the shape you will draw most often, and the one that needs no extra table.",
  v:`<b>The key goes on the many side</b>Sections point at their course. Nothing points back, because a course would need room for an unknown number of section ids, and a column cannot hold a list.`},
 {id:"m2m", n:"Many to many", sym:"&#8734; &mdash; &#8734;",
  q:"A student takes many courses, and a course has many students.",
  tables:[{n:"students",c:["<b>id</b> pk","name"]},
          {n:"courses",c:["<b>id</b> pk","code","title"]},
          {n:"enrollments",c:["<b>id</b> pk","<i>student_id</i> fk","<i>course_id</i> fk","enrolled_on","status","grade"],new:true}],
  note:"Neither side can hold the key, so a third table appears whether you planned it or not. It carries one row per pairing.<br><br>Notice the last three columns. A date, a status and a grade have nowhere else to live: they describe the pairing, not the student and not the course. That is why panel 09 called Enrolment an entity.",
  v:`<b>A third table appeared, and it carries the interesting columns</b>Neither side can store the other's key, so the pairing needs a table of its own. <b class="i">enrollments</b> is where enrolled_on, status and grade live, because those facts belong to the pairing rather than to either side.`}
];
let cardSel="o2m";
function renderCard(){
  const c=CARDS.find(x=>x.id===cardSel);
  $("#cardTab").innerHTML=CARDS.map(x=>
    `<button data-c="${x.id}" aria-pressed="${x.id===cardSel}">${x.n}</button>`).join("");
  $$("#cardTab button").forEach(el=>el.onclick=()=>{cardSel=el.dataset.c;renderCard()});

  $("#cardDia").innerHTML=
    `<div style="font-family:var(--mono);font-size:.86em;color:var(--res)">`+
    `${c.tables[0].n.toUpperCase()} &nbsp;<span style="color:var(--req)">${c.sym}</span>&nbsp; ${c.tables[1].n.toUpperCase()}</div>`+
    `<div style="margin-top:9px;font-size:.8em;color:var(--dim)">${c.q}</div>`;

  $("#cardTables").innerHTML=c.tables.map(t=>
    `<div class="tbl3${t.new?" newt":""}"><div class="tname">${t.n}${t.new?" &nbsp;&larr; new":""}</div>
      <div class="cols">${t.c.join("<br>")}</div></div>`).join("");
  $("#cardNote").innerHTML=c.note;
  $("#cardVerdict").className="verdict "+(c.id==="m2m"?"ok":"warn");
  $("#cardVerdict").innerHTML=c.v;
}
renderCard();

/* ================= ENTITY / ATTRIBUTE / INSTANCE ================= */
const TERMS=[
 {t:"Student",           k:"E", why:"A person the school keeps data about, with many specimens. Textbook entity."},
 {t:"Juan dela Cruz",    k:"I", why:"One student. A row, not a box on a diagram."},
 {t:"ID number",         k:"A", why:"A fact that describes a student. On its own it describes nothing."},
 {t:"Course",            k:"E", why:"A concept the school keeps data about. Many specimens, each distinguishable."},
 {t:"ITENT 45",          k:"I", why:"One course. If you drew a box for it you would need 3,000 more."},
 {t:"Units",             k:"A", why:"A property of a course. Three is not a thing, it is a fact about a thing."},
 {t:"Enrolment",         k:"E", why:"An <b class=\"i\">event</b>, and the one students leave out. It has a date, a status and a grade, and none of those belong to the student or to the course alone."},
 {t:"Enrolled on 12 Aug",k:"I", why:"One enrolment. A specimen of the event, not the event type."},
 {t:"Grade",             k:"A", why:"A property of an enrolment. Not of the student, and not of the course."},
 {t:"Section",           k:"E", why:"Arguable, and worth arguing. If it only ever names a letter it is an attribute. The moment it has a room, a schedule and a cap, it is an entity."}
];
const KIND={E:"entity",A:"attribute",I:"instance"};
const ENT={ans:{}};
function renderEnt(){
  $("#entList").innerHTML=TERMS.map((x,i)=>{
    const a=ENT.ans[i], cls=a?(a===x.k?"right":"wrong"):"";
    return `<div class="trm ${cls}">
      <span class="lab">${x.t}${a?`<small>${a===x.k?"":"you said "+KIND[a]+". "}${x.why}</small>`:""}</span>
      <span class="opts">${["E","A","I"].map(k=>
        `<button data-i="${i}" data-k="${k}" aria-pressed="${a===k}">${KIND[k]}</button>`).join("")}</span>
    </div>`;
  }).join("");
  $$("#entList .opts button").forEach(el=>el.onclick=()=>{
    ENT.ans[+el.dataset.i]=el.dataset.k; renderEnt();
  });
  const done=Object.keys(ENT.ans).length, right=TERMS.filter((x,i)=>ENT.ans[i]===x.k).length;
  const v=$("#entVerdict");
  if(!done){ v.className="verdict"; v.innerHTML=`<b>Sort all ten</b>Guess before you read the panel on the right. The ones you get wrong are the interesting ones.`; return; }
  if(done<TERMS.length){ v.className="verdict warn"; v.innerHTML=`<b>${right} of ${done} so far</b>Keep going.`; return; }
  v.className = right===TERMS.length ? "verdict ok" : "verdict warn";
  v.innerHTML = right===TERMS.length
    ? `<b>All ten</b>Now notice what you did: you decided which nouns become tables, which become columns, and which become rows. That is the whole of conceptual modelling, and it happened before you wrote any SQL.`
    : `<b>${right} of ${TERMS.length}</b>The misses are the lesson. Read the reasons under the ones in red, then look at <em>Enrolment</em> and <em>Section</em> in particular, because those two are where real diagrams go wrong.`;
}
renderEnt();

/* ================= 17 NORMALISATION ================= */
const NM={n:40, renamed:false, partial:false, wroteFlat:0, wroteNorm:0};
const NM_OLD="Application Dev & Emerging Tech", NM_NEW="App Development & Emerging Tech";
const nmTitle=i=>{
  if(!NM.renamed) return NM_OLD;
  if(NM.partial && i>=NM.n-2) return NM_OLD;     // the two nobody updated
  return NM_NEW;
};
function nmRender(){
  const show=Math.min(NM.n,5), rows=[];
  for(let i=0;i<show;i++){
    const t=nmTitle(i), stale=NM.renamed&&t===NM_OLD;
    rows.push(`<tr><td class="k">20-${1000+i}</td><td class="${stale?"hlnull":(NM.renamed?"hl":"")}">${t}</td><td>3</td></tr>`);
  }
  if(NM.n>show){
    const tail=[];
    for(let i=show;i<NM.n;i++) if(nmTitle(i)===NM_OLD && NM.renamed) tail.push(i);
    rows.push(`<tr><td class="k" style="color:var(--faint)">…</td><td colspan="2" style="color:var(--faint)">${NM.n-show} more rows, each carrying its own copy${tail.length?` <b style="color:var(--warn)">(${tail.length} still say the old title)</b>`:""}</td></tr>`);
  }
  $("#flatTbl").innerHTML=`<thead><tr><th>student</th><th>course_title</th><th>units</th></tr></thead><tbody>${rows.join("")}</tbody>`;

  const t=nmTitle(0);
  $("#normTbl").innerHTML=`<thead><tr><th>courses.id</th><th>title</th><th>units</th></tr></thead><tbody>
    <tr><td class="k">ITENT45</td><td class="${NM.renamed?"hl":""}">${NM.renamed?NM_NEW:NM_OLD}</td><td>3</td></tr></tbody>`;
  const er=[];
  for(let i=0;i<Math.min(NM.n,3);i++) er.push(`<tr><td class="k">20-${1000+i}</td><td>ITENT45</td></tr>`);
  if(NM.n>3) er.push(`<tr><td class="k" style="color:var(--faint)">…</td><td style="color:var(--faint)">${NM.n-3} more, all pointing at the same row</td></tr>`);
  $("#normTbl2").innerHTML=`<thead><tr><th>enrollments.student</th><th>course_id</th></tr></thead><tbody>${er.join("")}</tbody>`;

  $("#flatVerdict").className="verdict "+(NM.renamed&&NM.partial?"bad":NM.renamed?"warn":"");
  $("#flatVerdict").innerHTML = !NM.renamed
    ? `<b>The title is stored ${NM.n} times</b>Every enrolment carries its own copy. Nothing is wrong yet.`
    : NM.partial
      ? `<b>Two rows disagree with the other ${NM.n-2}</b>There is now no answer to "what is this course called". Both values are in the database, both look valid, and no constraint was broken.`
      : `<b>${NM.n} rows rewritten to change one fact</b>It worked, this time. It has to work every time, forever, in every code path that touches a title.`;

  $("#normVerdict").className="verdict "+(NM.renamed?"ok":"");
  $("#normVerdict").innerHTML = NM.renamed
    ? `<b>One row rewritten</b>The enrolments never held the title, so they had nothing to update. There is no version of this where two rows disagree, because there are not two rows.`
    : `<b>The title is stored once</b>Enrolments point at it by id. Reading a schedule now needs a join, which panel 15 puts a number on.`;

  const set=(id,v,hot,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot);g.classList.toggle("good",!!good)};
  set("#nmFlat", NM.wroteFlat||"—", NM.wroteFlat>1, false);
  set("#nmNorm", NM.wroteNorm||"—", false, NM.wroteNorm===1);

  const v=$("#nmVerdict");
  if(!NM.renamed){ v.className="verdict"; v.innerHTML=`<b>Nothing has changed yet</b>Press one of the buttons.`; }
  else if(NM.partial){
    v.className="verdict bad";
    v.innerHTML=`<b>${NM.n-2} rows updated, 2 missed, and the database is fine with that</b>This is the failure the split shape makes impossible. Not a crash, not an error, just two answers to the same question living side by side until somebody notices. In the split version there was one row to change, so there was nothing to miss.`;
  } else {
    v.className="verdict warn";
    v.innerHTML=`<b>${NM.wroteFlat} writes against 1</b>Both got to the same place. The flat table needed ${NM.wroteFlat} chances to go wrong and took none of them today. Raise the slider to 400 students and ask how you would feel about that number in a migration script at 2am.`;
  }
}
$("#sEnr").oninput=e=>{NM.n=+e.target.value;$("#vEnr").textContent=NM.n;
  NM.renamed=false;NM.partial=false;NM.wroteFlat=0;NM.wroteNorm=0;nmRender()};
$("#nmRename").onclick=()=>{NM.renamed=true;NM.partial=false;NM.wroteFlat=NM.n;NM.wroteNorm=1;nmRender()};
$("#nmPartial").onclick=()=>{NM.renamed=true;NM.partial=true;NM.wroteFlat=NM.n-2;NM.wroteNorm=1;nmRender()};
$("#nmReset").onclick=()=>{NM.renamed=false;NM.partial=false;NM.wroteFlat=0;NM.wroteNorm=0;nmRender()};
nmRender();

/* ================= 18 QUERY COST ================= */
const Q={rows:50, mode:"naive"};
const Q_MS=0.4, Q_BASE=24, Q_WORKERS=8;
const QMODES=[
 {id:"naive", n:"The obvious way", s:"Loop the enrolments, read the title from each one."},
 {id:"join",  n:"Ask for it up front", s:"One join, one trip. Django spells it select_related."},
 {id:"cache", n:"Ask once, remember", s:"Titles change rarely, so hold them in memory."}
];
function qModel(){
  const n=Q.rows;
  const queries = Q.mode==="naive" ? n+1 : Q.mode==="join" ? 1 : 1;
  const dbMs = queries*Q_MS + (Q.mode==="cache" ? 0 : 0);
  const handler = Q_BASE + dbMs;
  return {queries, dbMs, handler, rps: Q_WORKERS/(handler/1000)};
}
function qRender(){
  const m=qModel(), n=Q.rows;
  $("#qMode").innerHTML=QMODES.map(x=>`
    <button class="tg" data-q="${x.id}" aria-pressed="${x.id===Q.mode}">
      <span class="dot"></span><span>${x.n}<small>${x.s}</small></span></button>`).join("");
  $$("#qMode .tg").forEach(el=>el.onclick=()=>{Q.mode=el.dataset.q;qRender()});

  const code = Q.mode==="naive"
   ? `<span class="c"># views.py</span>
rows = Enrollment.objects.filter(student=me)      <span class="c"># 1 query</span>

<span class="c"># templates/schedule.html</span>
{% for e in rows %}
  {{ e.course.title }}   <span class="c">&lt;- one query, every time round the loop</span>
{% endfor %}`
   : Q.mode==="join"
   ? `<span class="c"># views.py</span>
rows = Enrollment.objects.filter(student=me) \\
                 .<span class="kw">select_related</span>(<span class="s">"course"</span>)      <span class="c"># 1 query, joined</span>

<span class="c"># templates/schedule.html</span>
{% for e in rows %}
  {{ e.course.title }}   <span class="c">&lt;- already in memory, costs nothing</span>
{% endfor %}`
   : `<span class="c"># the titles change a few times a year</span>
titles = cache.get(<span class="s">"course_titles"</span>)
<span class="kw">if</span> titles <span class="kw">is</span> <span class="kw">None</span>:
    titles = {c.id: c.title <span class="kw">for</span> c <span class="kw">in</span> Course.objects.all()}
    cache.set(<span class="s">"course_titles"</span>, titles, 3600)   <span class="c"># 1 query an hour</span>

rows = Enrollment.objects.filter(student=me)      <span class="c"># 1 query</span>`;
  $("#qCode").innerHTML=code;
  $("#qNote").textContent = Q.mode==="naive"
    ? `${n} enrolments on the page, ${n+1} times the database was asked something`
    : Q.mode==="join" ? "one trip, however many rows come back"
    : "one trip for the enrolments, and the titles were already here";

  const set=(id,v,hot,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot);g.classList.toggle("good",!!good)};
  set("#qQueries", m.queries, m.queries>10, m.queries<=2);
  set("#qDb", m.dbMs.toFixed(1)+" ms", m.dbMs>10, m.dbMs<2);
  set("#qHandler", m.handler.toFixed(1)+" ms", m.handler>40, m.handler<28);
  set("#qCeil", Math.round(m.rps)+" rps", m.rps<120, m.rps>250);

  const naive=(()=>{const q=n+1,d=q*Q_MS,h=Q_BASE+d;return {q,h,rps:Q_WORKERS/(h/1000)};})();
  const v=$("#qVerdict");
  if(Q.mode==="naive"){
    v.className = n>20 ? "verdict bad" : "verdict warn";
    v.innerHTML=`<b>${n+1} queries for one page</b>One to fetch the enrolments, then one more for every row, because the template asks for <code>e.course.title</code> and the course was never loaded. This is the <b class="i">N+1 query</b>, the most common performance bug in applications built this way.<br><br>At ${n} rows the box tops out at <b class="i">${Math.round(m.rps)} requests a second</b>. Switch to the join and watch that number.`;
  } else if(Q.mode==="join"){
    v.className="verdict ok";
    v.innerHTML=`<b>1 query, and the ceiling went from ${Math.round(naive.rps)} to ${Math.round(m.rps)} rps</b>Same page, same rows, same output. <code>select_related("course")</code> tells the database to bring the courses along in the same trip, so the template finds them already in memory. One line, <b class="i">${(m.rps/naive.rps).toFixed(1)}×</b> the capacity.<br><br>This is the line an agent will not add for you, because the version without it is correct.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>Also 1 query, and it survives the join getting expensive</b>Course titles change a few times a year, so holding them in memory for an hour costs almost nothing and removes them from the request path entirely. Worth it when the joined table is small and static. Not worth it when the data changes under you, because then you have two copies and one of them is wrong, which is panel 14 again wearing a different hat.`;
  }
}
$("#sQRows").oninput=e=>{Q.rows=+e.target.value;$("#vQRows").textContent=Q.rows;qRender()};
qRender();

/* ================= 19 ROWS OR DOCUMENTS ================= */
const SH={shape:"rows", q:"schedule"};
const SH_SHAPES=[{id:"rows",n:"Rows"},{id:"docs",n:"Documents"}];
const SH_QS=[
 {id:"schedule", n:"One student's schedule", s:"Asked on every page load."},
 {id:"roster",   n:"Who is in ITENT 45?",    s:"Asked by the instructor, weekly."},
 {id:"rename",   n:"Rename a course",         s:"Asked twice a year, and it must be complete."}
];
const SH_ANS={
 rows:{
  schedule:{k:"warn", t:"Two tables, one join", d:"<code>SELECT … FROM enrollments JOIN courses</code>. One trip if you remember <code>select_related</code>, fifty-one if you do not. Panel 15 is exactly this query."},
  roster:{k:"ok", t:"The same data read the other way", d:"<code>WHERE course_id = 'ITENT45'</code>. You did not design for this question and it costs nothing extra, because rows do not care which direction you come at them from."},
  rename:{k:"ok", t:"One row", d:"<code>UPDATE courses SET title = … WHERE id = 'ITENT45'</code>. Every enrolment sees the new title immediately, because none of them had a copy."}
 },
 docs:{
  schedule:{k:"ok", t:"One read, no assembly", d:"The student document already holds the enrolments and their titles. One key lookup and the page is ready. This is the case documents are built for, and it is faster here."},
  roster:{k:"bad", t:"Every student document, scanned", d:"Nothing indexes by course unless you built a second structure that does. You either scan everything, or you maintain a course-to-students index yourself and keep it in step by hand."},
  rename:{k:"bad", t:"Every document that mentions it", d:"The title was copied into each student's document, so the rename has to find and rewrite all of them. Panel 14's missed rows, except now there is no single table to check your work against."}
 }
};
function shRender(){
  $("#shPick").innerHTML=SH_SHAPES.map(x=>
    `<button data-s="${x.id}" aria-pressed="${x.id===SH.shape}">${x.n}</button>`).join("");
  $$("#shPick button").forEach(el=>el.onclick=()=>{SH.shape=el.dataset.s;shRender()});
  $("#shQ").innerHTML=SH_QS.map(x=>`
    <button class="tg" data-q="${x.id}" aria-pressed="${x.id===SH.q}">
      <span class="dot"></span><span>${x.n}<small>${x.s}</small></span></button>`).join("");
  $$("#shQ .tg").forEach(el=>el.onclick=()=>{SH.q=el.dataset.q;shRender()});

  $("#shBody").innerHTML = SH.shape==="rows"
   ? `<span class="c">-- courses</span>
id         title                              units
<span class="s">ITENT45</span>    App Development &amp; Emerging Tech   3
<span class="s">CSCI21</span>     Data Structures                    3

<span class="c">-- enrollments</span>
student    course_id
<span class="s">20-1000</span>    <span class="s">ITENT45</span>
<span class="s">20-1000</span>    <span class="s">CSCI21</span>
<span class="s">20-1001</span>    <span class="s">ITENT45</span>`
   : `<span class="c">// students/20-1000</span>
{
  <span class="s">"student"</span>: <span class="s">"20-1000"</span>,
  <span class="s">"enrollments"</span>: [
    {<span class="s">"code"</span>:<span class="s">"ITENT45"</span>, <span class="s">"title"</span>:<span class="s">"App Development &amp; Emerging Tech"</span>, <span class="s">"units"</span>:3},
    {<span class="s">"code"</span>:<span class="s">"CSCI21"</span>,  <span class="s">"title"</span>:<span class="s">"Data Structures"</span>,  <span class="s">"units"</span>:3}
  ]
}
<span class="c">// the title is copied into every student who takes it</span>`;

  const a=SH_ANS[SH.shape][SH.q];
  $("#shVerdict").className="verdict "+a.k;
  $("#shVerdict").innerHTML=`<b>${a.t}</b>${a.d}`;
}
shRender();

/* ================= 09 BREAKOUTS ================= */
const BK={
1:{
 title:"Breakout 1, Read the wire",
 intro:"Groups of three. If the server is not running yet, panel 04 has the setup at the bottom, with the commands ready to copy. The rule for this one: no slides, no notes, and do not ask an AI. Find out by looking.",
 taskT:"Your task, 20 minutes, then report",
 roles:[
  ["Driver","Types. Does not decide what to type."],
  ["Prober","Decides what to try next. Hands stay off the keyboard."],
  ["Scribe","Writes down what surprised the group. Owns the report-back."]],
 task:[
  "Start the server: <code>python3 start.py demo</code>, or <code>python start.py demo</code> on Windows. Leave that terminal visible. It prints every byte a client sends. The commands for the rest of these are at the bottom of panel 04, copyable, in both shells.",
  "Hit it with <code>curl http://localhost:8080/courses</code>, then open the same URL in a browser. <b>Count the headers each one sends.</b> Why does the browser send so many more?",
  "Make it return a 404. Read the <code>Content-Length</code> off the response, then count the body characters yourself. <b>Do the two numbers agree?</b>",
  "POST something: <code>curl -X POST localhost:8080/enrollments -d '{\"code\":\"ITENT 45\"}'</code>. In the server log, find the blank line. <b>What is on each side of it?</b>",
  "Open two terminals. Hit <code>/slow</code> in both at the same time. <b>Time the second one.</b> Now set <code>THREADED = True</code> near the bottom of the file, restart, and do it again. What changed, and what did it cost?",
  "Type a request by hand: <code>nc localhost 8080</code>, then enter <code>GET /courses HTTP/1.1</code>, press Enter twice. Now try it again <b>without</b> the <code>Host:</code> header, and with a nonsense <code>User-Agent</code>. <b>Which single header can you not leave out, and which can you lie about freely?</b>"],
 report:"90 seconds per group, standing, no notes, no screen. Each group states one thing that surprised them and the evidence for it. If another group already said yours, you must give a different one, so keep a spare.",
 listen:[
  "<b>Good sign:</b> a group says the browser sends cookies, cache validators and Accept-Language that curl does not, and connects that to why the same URL can return different bytes to different clients.",
  "<b>Good sign:</b> someone notices <code>Host</code> is the one header that cannot be dropped, and reasons out that one IP serves many sites.",
  "<b>Good sign:</b> on the <code>/slow</code> test, a group describes the second request <em>waiting</em> rather than failing, and names the queue from panel 18 without being prompted.",
  "<span class='bad'>Watch for:</span> a group reporting what they expected rather than what the terminal showed. Ask them to scroll back and point at the line.",
  "<span class='bad'>Watch for:</span> threading described as free. Push once: what did you just spend to get that? (memory per thread, straight back to panel 04)"]},
2:{
 title:"Breakout 2, Defend the architecture",
 intro:"Same groups, rotate roles. Each group gets one scenario. Use panel 19 to size it. You will be asked for numbers, not adjectives. Then another group tries to break your design.",
 taskT:"Your task, 25 minutes build, 10 minutes cross-examination",
 roles:[
  ["Architect","Owns the design and says the numbers out loud during defense."],
  ["Operator","Drives panel 19. Reads out the ceiling and the named bottleneck."],
  ["Sceptic","Writes the two hardest questions you would ask another group, then asks them."]],
 task:[
  "Take your scenario card. <b>Write the load number first</b>, before touching anything else. If the card does not give it to you directly, derive it and show the arithmetic.",
  "Build a configuration in panel 19 that serves that load. Record: instances, handler time, cache, replicas, queue.",
  "State your <b>system ceiling</b> and your <b>headroom multiple</b>. A design with 1.0× headroom is a design that fails on the first busy day.",
  "Name the <b>next bottleneck</b>. The tier that gives way when load doubles. Every design has one. If you cannot name it, you have not finished.",
  "Name <b>one move you deliberately did not make</b>, and why. Cost, complexity, and 'we do not need it yet' are all valid reasons if you can defend them.",
  "Answer your card's curveball. <b>This is the part that is actually being graded.</b>"],
 report:"Each group presents for 2 minutes: load, configuration, ceiling, headroom, next bottleneck, and the move they refused. Then the group to their left gets 90 seconds to attack the design. Attack the design, never the group.",
 listen:[
  "<b>Good sign:</b> a group that adds instances, sees the bottleneck move to the database, and says so out loud before you point at it.",
  "<b>Good sign:</b> refusing a move for cost or complexity reasons and defending it. That is engineering judgement.",
  "<b>Good sign:</b> on the spiky scenarios, someone questions whether the average rate is even the right number to design against.",
  "<span class='bad'>Watch for:</span> maxing every slider. Ask what it costs per month and who pays. The syllabus says they must defend the design, not just produce one.",
  "<span class='bad'>Watch for:</span> a cache proposed for a write-heavy workload. Ask what fraction of their requests the cache actually serves.",
  "<span class='bad'>Watch for:</span> a group that cannot say what breaks next. That is the tell that they tuned sliders until the number went green."]}
};
const SCEN=[
 {n:"Card A",t:"Enlistment morning (The enlistment system)",
  d:[["Load","4,000 students in one enlistment window, all clicking at 8:00:00"],
     ["Shape","One short violent spike, then almost nothing"],
     ["Work","15 requests per session, 3 of them writes. Seat reservation must be correct"]],
  c:"Curveball: your web tier can autoscale, but seat reservation cannot be cached and cannot be spread across read replicas, two students must never get the same last slot. So what do you actually do? Name a move that costs no hardware at all."},
 {n:"Card B",t:"Course catalog",
  d:[["Load","900 rps sustained through the day"],
     ["Shape","Steady. Read-only browsing"],
     ["Work","3 queries per request, 40 ms handler. Most students request the same 20 pages"]],
  c:"Curveball: a third of your users are on mobile data abroad, at 120 ms one-way. Go back to panel 02. Does any amount of server capacity fix their experience? What actually would?"},
 {n:"Card C",t:"Grade upload",
  d:[["Load","Only 40 rps. Faculty, not students"],
     ["Shape","Bursty around deadline week"],
     ["Work","Each upload generates a PDF transcript. 2,000 ms handler, 2 queries"]],
  c:"Curveball: work out the ceiling for one instance before you touch anything. You will find no combination of sliders gets you to 40 rps. The panel's queue toggle only models a 35% saving. So what would you actually change so the handler returns in 20 ms, and what does the faculty member see on screen instead?"},
 {n:"Card D",t:"Campus sensor dashboard",
  d:[["Load","3,000 sensors, each posting every 10 seconds"],
     ["Shape","Perfectly constant, 24/7"],
     ["Work","Tiny payloads. 8 ms handler, 2 writes per request"]],
  c:"Curveball: derive the request rate yourself. The card does not state it. Then note that the panel treats replicas as helping every query equally. These are writes. Does that assumption hold, and what does it mean for your design?"},
 {n:"Card E",t:"Alumni portal, tight budget",
  d:[["Load","Normally 30 rps"],
     ["Shape","Unpredictable. A news story can multiply it by 50× with no warning"],
     ["Work","3 queries per request, 70 ms handler. Read-heavy"]],
  c:"Curveball: you cannot afford to run 50× capacity year-round. Design for the normal day and state exactly what you would do in the first 10 minutes of a spike, and what users would experience meanwhile."},
 {n:"Card F",t:"The dashboard that got slow",
  d:[["Load","120 rps. A Django page listing each student's 50 enrollments"],
     ["Shape","Steady, all day. 40 ms handler"],
     ["Work","The template reads e.course.title inside the loop, and nobody wrote select_related()"]],
  c:"Curveball: work out queries per request before anything else. One for the list, then one more per row. Put that number into panel 19 and read the ceiling. Now set it to 2, which is what select_related() would give you, and read it again. Which is cheaper: the one-line ORM fix, or all the infrastructure you would otherwise have to buy?"},
 {n:"Card G",t:"Flash sale checkout",
  d:[["Load","900 rps for 10 minutes when the sale opens"],
     ["Shape","Hard spike, then nothing. Shoppers refresh and re-click constantly"],
     ["Work","40 ms of your own code, plus an 800 ms call to the payment gateway"]],
  c:"Curveball: put 840 ms into panel 19's handler slider and read the ceiling. That is what a third-party call inside your request costs you. Then answer two things. How do you get the gateway off the request path, and what stops a double-clicking shopper from being charged twice?"}
];
let bk="1";
function renderBk(){
  const d=BK[bk];
  $("#bkTitle").textContent=d.title;
  $("#bkIntro").textContent=d.intro;
  $("#bkTaskT").textContent=d.taskT;
  $("#bkTask").innerHTML=d.task.map(t=>`<li>${t}</li>`).join("");
  $("#bkRoles").innerHTML=d.roles.map(([n,p])=>`<div class="role"><div class="rn">${n}</div><p>${p}</p></div>`).join("");
  $("#bkReport").textContent=d.report;
  $("#bkListen").innerHTML=d.listen.map(l=>`<li>${l}</li>`).join("");
  $("#bkCards").innerHTML = bk==="2"
    ? `<div class="card-t">Scenario cards. One per group</div><div class="cards">`+
      SCEN.map((s,i)=>`<button class="sc" data-i="${i}">
        <div class="sn">${s.n}</div><h4>${s.t}</h4>
        <dl>${s.d.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
        <div class="curve">${s.c}</div></button>`).join("")+`</div>`
    : "";
  $$("#bkCards .sc").forEach(el=>el.onclick=()=>{
    const was=el.classList.contains("pick");
    $$("#bkCards .sc").forEach(x=>x.classList.remove("pick"));
    if(!was) el.classList.add("pick");
  });
}
$$("[data-bk]").forEach(b=>b.onclick=()=>{
  $$("[data-bk]").forEach(x=>x.setAttribute("aria-pressed",x===b));
  bk=b.dataset.bk; renderBk();
  setTimer(bk==="1"?20:25);
});

/* timer */
let tLeft=20*60, tTick=null, tOn=false;
function paint(){
  const m=Math.floor(Math.abs(tLeft)/60), s=Math.abs(tLeft)%60;
  $("#clock").textContent=(tLeft<0?"-":"")+m+":"+String(s).padStart(2,"0");
  const t=$("#timer");
  t.classList.toggle("warn",tLeft<=120&&tLeft>30);
  t.classList.toggle("crit",tLeft<=30);
}
function setTimer(min){ stopTimer(); tLeft=min*60; paint(); }
function stopTimer(){ clearInterval(tTick); tOn=false; $("#tRun").textContent="▶ Start"; }
$("#tRun").onclick=()=>{
  if(tOn){ stopTimer(); return; }
  tOn=true; $("#tRun").textContent="❚❚ Pause";
  tTick=setInterval(()=>{ tLeft--; paint(); },1000);
};
$("#tRst").onclick=()=>setTimer(bk==="1"?20:25);
$$(".presets button").forEach(b=>b.onclick=()=>setTimer(+b.dataset.m));
renderBk(); paint();

/* keyboard */
addEventListener("keydown",e=>{
  if(e.target.matches("input")) return;
  const on=$(".panel.on").id;
  if(on==="p-journey"){
    if(e.key===" "){e.preventDefault();$("#playJ").click()}
    if(e.key==="ArrowRight"){e.preventDefault();$("#stepJ").click()}
  }
  if(on==="p-server" && e.key===" "){e.preventDefault();$("#simRun").click()}
  if(on==="p-break" && e.key===" "){e.preventDefault();$("#tRun").click()}
  if(on==="p-tiers"){
    if(e.key==="ArrowRight"){e.preventDefault();$("#trNext").click()}
    if(e.key==="ArrowLeft"){e.preventDefault();$("#trPrev").click()}
    if(e.key===" "){e.preventDefault();$("#trPlay").click()}
  }
  const kmap={'0':0,'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'c':10,'C':10,'a':11,'A':11,'w':12,'W':12,'t':13,'T':13,'n':14,'N':14,'q':15,'Q':15,'h':16,'H':16,'m':17,'M':17,'s':18,'S':18,'p':19,'P':19,'e':20,'E':20,'v':21,'V':21,'k':22,'K':22,'r':23,'R':23,'o':24,'O':24,'b':25,'B':25};
  if(e.key in kmap) $$("#nav button")[kmap[e.key]].click();
});
