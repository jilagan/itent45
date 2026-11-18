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

