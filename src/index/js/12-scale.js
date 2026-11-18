/* ================= SCALING OUT ================= */
const SC={load:400,inst:1,h:50,rep:0,q:3,lb:false,cache:false,queue:false,sess:false};
const DB_BASE=300, REPLICA_QPS=240, HIT=0.70;
// one instance = one copy of the machine from the memory and server capacity panels, workers and all
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
    `Application: ${m.active} machine${m.active>1?"s":""} × ${workersPerInst()} workers ÷ ${(m.h/1000).toFixed(3)} s = <b>${Math.round(m.appCap)} rps</b><br>`+
    `Database: ${Math.round(m.dbCap)} qps ÷ ${m.perReq.toFixed(2)} queries per request = <b>${m.perReq>0?Math.round(m.dbReqCap)+" rps":"unlimited"}</b>`;

  const v=$("#sVerdict");
  if(SC.sess && m.active>1){
    v.className="verdict bad";
    v.innerHTML=`<b>Users are logged out at random</b>Each machine keeps its sessions in its own memory, but the load balancer sends every request to whichever machine is free. A user logs in on machine 1 and the next click goes to machine 3, which has no record of that user. Adding capacity does not help until the session data moves out of the application machine, into the cache, the database or a signed cookie (a cookie the server can check has not been altered). An application that keeps no user data in the machine is called stateless, and scaling out depends on that.`;
    return;
  }
  if(SC.inst>1 && !SC.lb){
    v.className="verdict warn";
    v.innerHTML=`<b>Machines idle</b>You are running ${SC.inst} machines, but nothing distributes traffic to them. ${SC.inst-1} of them sit idle while one machine handles everything. Turn on the load balancer first.`;
    return;
  }
  if(m.shed>0){
    v.className="verdict bad";
    v.innerHTML= m.neck==="app"
      ? `<b>Bottleneck: application machines</b>Turning away ${Math.round(m.shed)} rps. The workers cannot finish requests fast enough. Options that help: more machines, a faster handler, or the background job queue to move slow work out of the request.`
      : `<b>Bottleneck: database</b>Turning away ${Math.round(m.shed)} rps. Each request needs ${m.perReq.toFixed(2)} queries and the database can handle at most ${Math.round(m.dbCap)} qps. More application machines would send even more queries to the same database, so they would not help. Options that help: a cache for reads, read replicas, or fewer queries per request.`;
    return;
  }
  const head=(m.ceiling/SC.load);
  v.className="verdict ok";
  v.innerHTML=`<b>Keeping up, ${head.toFixed(1)}× headroom</b>All ${SC.load} rps are served. Headroom is spare capacity: the system could handle ${head.toFixed(1)} times the current load. The maximum is ${Math.round(m.ceiling)} rps, and the ${m.neck==="app"?"application machines":"database"} will reach their limit first when the load grows. That is the next bottleneck.`;
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
      <div class="iflight">${LB.flight[i]} in progress</div>
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
  if(!LB.total){ v.className="verdict"; v.innerHTML="<b>Idle</b>Press Send traffic and watch which machine each request goes to."; return; }
  if(LB.algo==="sticky" && LB.lost>0){
    v.className="verdict bad";
    v.innerHTML=`<b>${LB.lost} session${LB.lost===1?"":"s"} lost</b>Sticky sessions tied those clients to machine E, and E went down. The load balancer sends them to another machine, but the session data held in E's memory is gone, so those users are logged out. The switch "Sessions stored in machine memory" further down shows the same failure. To avoid it, keep session data outside the application machines.`;
  } else if(LB.algo==="rr" && fl[4]>=Math.max(fl[0],fl[1],fl[2],fl[3])+2 && lbAlive(4)){
    v.className="verdict warn";
    v.innerHTML=`<b>Equal counts, unequal load</b>Round robin gave every machine the same number of requests. E is slower, so it has ${fl[4]} requests in progress while the others have about ${Math.round((fl[0]+fl[1]+fl[2])/3)}. Equal request counts do not mean equal work. Try least connections.`;
  } else if(LB.algo==="lc"){
    v.className="verdict ok";
    v.innerHTML=`<b>Balanced by current work</b>Least connections sends fewer requests to E because E is still busy with its earlier ones. The counts differ, but the number of requests in progress is about equal on every machine, and that number is what users wait behind.`;
  } else if(LB.dead>=0){
    v.className="verdict ok";
    v.innerHTML=`<b>Machine E removed, no user affected</b>E stopped answering the health check, so the load balancer took E out of the rotation and shared its requests among the other machines. No user saw an error. Scaling out improves availability, which means the site keeps working when a machine fails, as well as capacity.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>Spreading evenly</b>Each machine is receiving about the same number of requests. Now take E down, or switch to sticky sessions and then take E down.`;
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

