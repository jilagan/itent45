/* Lesson mem. Widget code for the markup in lesson.html. Shared code it needs: lib/memmodel.js. */
/* ================= MEMORY BUDGET ================= */
const OFF_HR_PER_GB=0.75, OFF_MO=720, OFF_Q=2;   // two queries a request

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
    ["s-req","Requests being handled",m.reqs],
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
    ["s-req","Requests being handled",m.reqs],
    ["s-free", m.free>=0?"Free":"Over capacity", Math.abs(m.free)]
  ].filter(x=>x[2]>0||x[0]==="s-free").map(([c,n,v])=>
    `<div class="lg"><i style="background:${cols[c]}"></i>${n}<b${m.free<0&&c==="s-free"?' style="color:var(--warn)"':""}>${m.free<0&&c==="s-free"?"−":""}${Math.round(v)} MB</b></div>`
  ).join("");

  $("#maxW").innerHTML = `${m.maxW} worker${m.maxW===1?"":"s"} fit in ${(MEM.ram/1024).toFixed(1)} GB` +
    (MEM.workers>m.maxW ? `. You have set ${MEM.workers}.` : "");

  const v=$("#ramVerdict");
  if(m.over){
    v.className="verdict bad";
    v.innerHTML=`<b>Out of memory, ${Math.abs(Math.round(m.free))} MB over</b>The operating system stops a process, usually one of your workers, and the requests it was handling are lost. Reduce the workers to ${m.maxW} or add RAM.`;
  } else if(m.tight){
    v.className="verdict warn";
    v.innerHTML=`<b>Only ${Math.round(m.free)} MB free</b>Everything fits, but no memory is left for recently read files, so the machine will feel slow. ${m.maxW} worker${m.maxW===1?"":"s"} is the most that keeps 15% of the RAM free.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>Comfortable, ${Math.round(m.free)} MB free</b>${MEM.workers} worker${MEM.workers===1?"":"s"} at ${m.perW} MB each${MEM.preload?" after preload sharing":""} fit with room to spare. You could add workers up to ${m.maxW} before less than 15% of the RAM is free.`;
  }
}
const bindM=(sel,key,fmt,lbl)=>{
  $(sel).oninput=e=>{MEM[key]=+e.target.value;$(lbl).textContent=fmt(MEM[key]);renderMem()};
  $(sel).dispatchEvent(new Event("input"));
};
const ramText=v=>v>=1024?(v/1024).toFixed(1).replace(/\.0$/,"")+" GB":v+" MB";
const setRam=v=>{MEM.ram=+v;[["#sRam2","#vRam2"],["#sRam3","#vRam3"]].forEach(([a,b])=>{$(a).value=MEM.ram;$(b).textContent=ramText(MEM.ram)});renderMem()};
$("#sRam2").oninput=e=>setRam(e.target.value);
$("#sRam3").oninput=e=>setRam(e.target.value);
setRam(MEM.ram);
bindM("#sW2","workers",v=>v,"#vW2");
bindM("#sPer","per",v=>v+" MB","#vPer");
bindM("#sInflight","inflight",v=>v+" MB","#vInflight");
$("#tgDb2").onclick=()=>{MEM.db=!MEM.db;$("#tgDb2").setAttribute("aria-pressed",MEM.db);renderMem()};
$("#tgPre").onclick=()=>{MEM.preload=!MEM.preload;$("#tgPre").setAttribute("aria-pressed",MEM.preload);renderMem()};
renderMem();

/* ---- moving Postgres onto its own machine ---- */
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
  const m=offModel(), peso=n=>"\u20b1"+Math.round(n).toLocaleString(), peso2=n=>"\u20b1"+n.toFixed(2);
  const rows=[
    ["Workers that fit", m.oneW, m.twoW, m.twoW>m.oneW?"two":"one"],
    ["Time to handle one request", m.oneH.toFixed(1)+" ms", m.twoH.toFixed(1)+" ms", m.twoH<m.oneH?"two":"one"],
    ["Requests per second", Math.round(m.oneRps), Math.round(m.twoRps), m.twoRps>m.oneRps?"two":"one"],
    ["Cost per month", peso(m.oneCost), peso(m.twoCost), "one"],
    ["Cost per request per second", peso2(m.onePer), peso2(m.twoPer), m.twoPer<m.onePer?"two":"one"]
  ];
  $("#offBody").innerHTML=rows.map(([l,a,b,win])=>
    `<tr><td>${l}</td>
      <td class="${win==="one"?"y":"n"}">${a}</td>
      <td class="${win==="two"?"y":"n"}">${b}</td></tr>`).join("");

  const v=$("#offVerdict"), gain=m.gain.toFixed(2);
  if(m.twoPer<m.onePer){
    v.className="verdict ok";
    v.innerHTML=`<b>${gain}\u00d7 the requests for 2\u00d7 the machines, and it roughly pays for itself</b>At this size the database was taking memory the workers needed. Cost per request per second falls from ${peso2(m.onePer)} to ${peso2(m.twoPer)}.`;
  } else {
    v.className="verdict warn";
    v.innerHTML=`<b>${gain}\u00d7 the requests for 2\u00d7 the cost</b>Throughput rose ${((m.gain-1)*100).toFixed(0)}%, and cost per request per second went <b class="i">up</b> from ${peso2(m.onePer)} to ${peso2(m.twoPer)}. Splitting can still be justified by backups and fault isolation.`;
  }
}
