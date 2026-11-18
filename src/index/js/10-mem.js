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

