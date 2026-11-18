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
    `<div class="guest"><div class="gt">Guest ${i+1}</div><div>Applications</div><div>Shell</div><div>Kernel</div></div>`
  ).join("") + (VM.guests>8?`<div class="guest" style="border-style:dashed;flex:0 0 46px"><div class="gt">+${VM.guests-8}</div></div>`:"");

  $("#hostSplit").innerHTML=[
    ["var(--req)", `${VM.guests} guests × ${VM.per} GB each`, m.sold+" GB"],
    ["var(--res)", "Hypervisor and host", HYP_OVERHEAD+" GB"],
    [m.over?"var(--warn)":"var(--line2)", m.over?"Oversold":"Unsold", Math.abs(m.free)+" GB"]
  ].map(([c,n,v])=>`<div class="lg"><i style="background:${c}"></i>${n}<b>${v}</b></div>`).join("");

  const v=$("#vmVerdict");
  if(m.over){
    v.className="verdict bad";
    v.innerHTML=`<b>Oversold by ${Math.abs(m.free)} GB</b>The guests have been promised ${m.sold} GB, and the host has ${m.avail} GB available. Providers do this on purpose, because guests are rarely all busy at the same time. When they are, your VM slows down without crashing, and nothing in your own code explains why. This is called the noisy-neighbor problem. It is a cost of resource pooling, which means many customers sharing the same hardware.`;
  } else if(m.ratio>0.85){
    v.className="verdict warn";
    v.innerHTML=`<b>${Math.round(m.ratio*100)}% committed</b>${m.free} GB is spare on a ${HOST_RAM} GB machine. This is efficient for the provider. It leaves little room if one guest suddenly uses much more memory.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>${VM.guests} guest${VM.guests===1?"":"s"}, ${m.free} GB spare</b>One physical machine is running ${VM.guests} virtual server${VM.guests===1?"":"s"}. Nobody bought a separate computer for each one, and any guest can be deleted and recreated in about a minute. The rest of this panel depends on that.`;
  }
}
const NIST=[
 ["On-demand self-service","You create capacity yourself, through an API (a way for programs to send commands to the provider) or a web console, without talking to a person or raising a purchase order. Each of the seven servers for the enlistment system needed a procurement cycle, which means a quotation, a purchase order and a delivery. A cloud server needs a credit card and about a minute. This changes how quickly an organization can fix a wrong decision."],
 ["Broad network access","Capabilities are reachable over the network through standard methods, from phones, laptops and other devices. In \"One API, many clients\", the same HTTP endpoint served a browser, an iPhone and an Android app. Standard access methods make that possible."],
 ["Resource pooling","Physical resources are pooled and assigned to many customers as needed, and you generally cannot tell where yours physically run. The diagram at the start of this panel shows this. Pooling keeps cloud prices low. It also means your server sometimes slows down for reasons that are not your fault."],
 ["Rapid elasticity","Capacity can be added and released quickly, and to the customer it looks unlimited. The autoscaling web tier in \"Case study: enlistment\" depends on it. Elasticity changed what is possible for the web tier, but the case study showed that the web tier was not the limit. The database was."],
 ["Measured service","Usage is metered and billed by the unit, such as CPU-hours, gigabytes or requests. Metering turns capital expenditure into operational expenditure, and it produces the cost chart covered later in \"CapEx and OpEx\". It also means a resource you forgot about keeps charging you."]
];
$("#nistCards").innerHTML=NIST.map(([t],i)=>
  `<button class="nc" data-i="${i}"><div class="nn">0${i+1}</div><h5>${t}</h5></button>`).join("");
$$("#nistCards .nc").forEach(el=>el.onclick=()=>{
  $$("#nistCards .nc").forEach(x=>x.classList.remove("on"));
  el.classList.add("on");
  const [t,d]=NIST[+el.dataset.i];
  $("#nistOut").innerHTML=`<div class="et">${t}</div><p>${d}</p>`;
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
    note:"Provisioning takes about a minute and costs nothing to start. You are billed <b>₱3 per running hour</b> for each server, and the meter stops when you delete one.<br><br>Provision three, then delete two, and watch the bill stop growing for those two. Then leave one running and forget about it." },
  onprem:{ readyH:1008, hourly:0, upfront:180000,
    note:"Six weeks: quotation, purchase order, approval, delivery, racking (mounting the server in a cabinet) and imaging (installing the operating system). <b>₱180,000 is charged once</b>, whether or not the machine is ever busy.<br><br>Press delete on a server here and look at the bill. You bought the machine, so it is yours and the money does not come back. This is capital expenditure." }
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
      <button data-kill="${s.id}">delete</button></div>`;
  }).join("") : `<div class="emptyc">No servers yet. Press "Provision a server".</div>`;
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

  // light up what has been demonstrated
  const done={
    0: PROV.mode==="cloud" && PROV.servers.length>0,                 // on-demand self-service
    1: up>0,                                                          // broad network access
    2: false,                                                         // resource pooling is shown by the host diagram in the first section
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
    v.innerHTML="<b>Nothing running</b>Press \"Provision a server\" and watch the clock in the corner.";
  } else if(PROV.mode==="onprem"){
    v.className="verdict bad";
    v.innerHTML=`<b>₱${Math.round(PROV.bill).toLocaleString()} spent, ${up} running</b>You committed the money when you placed the order, and you wait six weeks whatever happens next. Deleting a server here gives nothing back, because you still own the hardware. This is how the servers for the enlistment system were bought.`;
  } else if(done[3]){
    v.className="verdict ok";
    v.innerHTML=`<b>You have demonstrated four of the five characteristics</b>You created servers in about a minute without asking anyone, reached them over the network, scaled up and back down, and paid by the hour for the time the servers existed.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>${up} running, ₱${Math.round(PROV.bill).toLocaleString()} so far</b>The meter runs while the servers exist, and only then. Now provision three and delete two. That demonstrates elasticity, the card that has not lit yet.`;
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
  g.fillText(Math.round(elDemand(EL.t))+" rps demand", 8, 13);
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
  if(!EL.running && !EL.hist.length){ v.className="verdict"; v.innerHTML="<b>Not started</b>Press \"Start the day\"."; return; }
  if(!EL.auto){
    v.className="verdict warn";
    v.innerHTML=`<b>Four machines all day, whatever the load</b>${Math.round(EL.dropped).toLocaleString()} requests have been turned away so far, and in quiet periods most of that capacity sits idle. This is the fixed capacity line covered later in "CapEx and OpEx", drawn one minute at a time.`;
  } else if(EL.shape==="spike" && spikePct>.15){
    v.className="verdict bad";
    v.innerHTML=`<b>The machines arrived after the rush</b>${Math.round(spikePct*100)}% of the enlistment surge was turned away. The autoscaler noticed within seconds and ordered machines at once. Each machine took ${EL.boot}s to boot, and the students did not wait. Elasticity is fast, but it is not instant.<br><br>Drag the boot time down to see how much you recover. You never recover all of it, because a surge that arrives in one second cannot be absorbed by anything that has to react first. Three things help: capacity that is already running, a queue in front, or spreading out the arrival times. Spreading out the arrivals is the fix from "Case study: enlistment". The slow boot is a second reason why the cloud migration did not fix enlistment morning, in addition to the database limit.`;
  } else if(EL.shape==="spike"){
    v.className="verdict ok";
    v.innerHTML=`<b>Caught it, at ${EL.boot}s boot</b>Capacity arrived while the surge was still running. Real machines rarely boot this quickly. Pre-warmed instances (machines that are already running and waiting) or a queue in front give the same effect.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>Following the load</b>Capacity climbs a few steps behind demand and settles back afterward. Gradual changes suit autoscaling. Capacity always lags demand, and you pay for the lag and for the cooldown period (the wait before a machine is removed) as well as for the work.`;
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
    v.innerHTML=`<b>No extra calls</b>Each request is served by one service and never asks another. Splitting works best in this case, and the case is rare. Drag the slider to see how quickly it stops being true.`;
  } else if(m.n<=3){
    v.className="verdict warn";
    v.innerHTML=`<b>${m.n} call${m.n===1?"":"s"}, still affordable</b>The handler goes from ${m.mono.toFixed(0)} to ${m.svc.toFixed(0)} ms, and combined uptime drops to ${(m.av*100).toFixed(2)}%. This is manageable, and worth watching. Every new feature that needs one more lookup moves this slider to the right, and it rarely moves back.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>${m.n} calls: ${m.mult.toFixed(1)}× slower and unavailable ${m.downMin<60?Math.round(m.downMin)+" minutes":(m.downMin/60).toFixed(1)+" hours"} a month</b>The handler that took ${m.mono.toFixed(0)} ms now takes ${m.svc.toFixed(0)} ms, even though the network is working normally. The extra time comes from ${m.n} separate network round trips where there used to be ${m.n} function calls. You also need all ${m.n} services running at the same time. Each is up ${(SVC_AVAIL*100).toFixed(1)}% of the time, and together they are up ${(m.av*100).toFixed(2)}% of the time. On any request there is a ${(m.slow*100).toFixed(0)}% chance that at least one of them is slow. The problem covered later in "The N+1 query problem" has the same pattern one layer down: many small requests where one would do. A database option such as <code>select_related</code> cannot fix it here.`;
  }
}
$("#sChat").oninput=e=>{CHAT.n=+e.target.value;$("#vChat").textContent=CHAT.n;renderChat()};
$("#sChat").dispatchEvent(new Event("input"));

