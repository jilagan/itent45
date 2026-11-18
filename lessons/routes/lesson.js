/* Lesson routes. Two widgets share one map: the route builder (step "build") and the road closure (step "close"). */
(()=>{

/* ---------- data ---------- */
const FARE=13;
const EDGES=[["Home","Marikina",8],["Home","Katipunan",15],["Marikina","Ortigas",12],["Katipunan","Ortigas",6],
  ["Katipunan","Cubao",20],["Ortigas","Loyola",12],["Ortigas","Cubao",10],["Cubao","Loyola",5],
  ["Loyola","School",6],["Cubao","School",18],["Ortigas","School",23]];
const LAYOUT={
 narrow:{N:{Home:[50,5],Marikina:[21,23],Katipunan:[79,23],Ortigas:[21,48],Cubao:[79,48],Loyola:[50,66],School:[50,95]},
  T:{"Home-Marikina":.5,"Home-Katipunan":.55,"Marikina-Ortigas":.35,"Katipunan-Ortigas":.35,"Katipunan-Cubao":.55,"Ortigas-Loyola":.45,
     "Ortigas-Cubao":.35,"Cubao-Loyola":.45,"Loyola-School":.7,"Cubao-School":.6,"Ortigas-School":.6}},
 wide:{N:{Home:[9,50],Marikina:[28,12],Katipunan:[28,88],Ortigas:[57,12],Cubao:[57,88],Loyola:[68,50],School:[92,50]},
  T:{"Home-Marikina":.4,"Home-Katipunan":.65,"Marikina-Ortigas":.45,"Katipunan-Ortigas":.75,"Katipunan-Cubao":.5,"Ortigas-Loyola":.5,
     "Ortigas-Cubao":.5,"Cubao-Loyola":.65,"Loyola-School":.45,"Cubao-School":.3,"Ortigas-School":.65}}
};
const NODES=Object.keys(LAYOUT.wide.N);
const ekey=(a,b)=>EDGES.findIndex(e=>(e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a));
const minutesOf=(a,b)=>EDGES[ekey(a,b)][2];

/* every simple route from Home to School over the open lines */
function allRoutes(closed){
  const adj={}; EDGES.forEach((e,i)=>{ if(closed&&closed[i]) return; (adj[e[0]]=adj[e[0]]||[]).push([e[1],e[2]]); (adj[e[1]]=adj[e[1]]||[]).push([e[0],e[2]]); });
  const out=[];
  (function go(path,min){ const u=path[path.length-1];
    if(u==="School"){ out.push({path:path.slice(),min,rides:path.length-1}); return; }
    (adj[u]||[]).forEach(([v,w])=>{ if(!path.includes(v)){ path.push(v); go(path,min+w); path.pop(); } });
  })(["Home"],0);
  return out;
}
const fastest=closed=>allRoutes(closed).sort((a,b)=>a.min-b.min)[0]||null;
const fewest=()=>allRoutes().sort((a,b)=>a.rides-b.rides||a.min-b.min)[0];
const sameRoute=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
const total=path=>path.slice(1).reduce((s,n,i)=>s+minutesOf(path[i],n),0);

/* ---------- the map ---------- */
function makeMap(host,mode,onLabel){
  host.innerHTML="";
  const svgNS="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(svgNS,"svg"); svg.setAttribute("class","rt-svg"); svg.setAttribute("viewBox","0 0 100 100");
  svg.setAttribute("preserveAspectRatio","none"); svg.setAttribute("aria-hidden","true");
  const lines=EDGES.map(()=>{ const l=document.createElementNS(svgNS,"line"); svg.appendChild(l); return l; });
  host.appendChild(svg);
  const labs=EDGES.map((e,i)=>{
    const el=document.createElement(mode==="close"?"button":"span"); el.className="rt-lab";
    if(mode==="close") el.onclick=()=>onLabel(i); else el.textContent=String(e[2]);
    host.appendChild(el); return el; });
  const nodes={};
  NODES.forEach(n=>{
    const el=document.createElement(mode==="build"?"button":"span"); el.className="rt-node"; el.textContent=n; el.dataset.n=n;
    host.appendChild(el); nodes[n]=el; });
  const M={host,lines,labs,nodes,layout:null};
  M.place=()=>{
    const w=host.parentElement.clientWidth; if(!w) return;
    const key=w>=640?"wide":"narrow";
    host.className="rt-map "+key; M.layout=key;
    const L=LAYOUT[key];
    EDGES.forEach((e,i)=>{
      const a=L.N[e[0]], b=L.N[e[1]], t=L.T[e[0]+"-"+e[1]];
      lines[i].setAttribute("x1",a[0]); lines[i].setAttribute("y1",a[1]); lines[i].setAttribute("x2",b[0]); lines[i].setAttribute("y2",b[1]);
      labs[i].style.left=(a[0]+(b[0]-a[0])*t)+"%"; labs[i].style.top=(a[1]+(b[1]-a[1])*t)+"%";
    });
    NODES.forEach(n=>{ nodes[n].style.left=L.N[n][0]+"%"; nodes[n].style.top=L.N[n][1]+"%"; });
  };
  M.place();
  return M;
}
function markLines(M,paths){           /* paths: {cls: [route, ...]} */
  M.lines.forEach((l,i)=>{ l.setAttribute("class",""); });
  Object.entries(paths).forEach(([cls,route])=>{
    if(!route) return;
    route.slice(1).forEach((n,k)=>{ const i=ekey(route[k],n); const c=M.lines[i].getAttribute("class"); M.lines[i].setAttribute("class",(c?c+" ":"")+cls); });
  });
}

/* ---------- widget 1: build a route ---------- */
const A={route:["Home"],msg:""};
let MA;
const fareOf=r=>(r.length-1)*FARE;
function aDraw(){
  const r=A.route, last=r[r.length-1], atEnd=last==="School";
  const minutes=total(r);
  $("#rtAMin").textContent=minutes; $("#rtARides").textContent=r.length-1; $("#rtAFare").textContent=fareOf(r);
  $("#rtACompare").disabled=!atEnd;
  $("#rtAUndo").disabled=r.length<2;
  NODES.forEach(n=>{
    const el=MA.nodes[n]; el.classList.toggle("on",r.includes(n)); el.classList.toggle("here",n===last);
    const adj=ekey(last,n)>=0 && !r.includes(n) && !atEnd;
    el.setAttribute("aria-label", n+(r.includes(n)?(n===last?", you are here":", already on your route"):adj?", ride available from "+last:", no direct ride from "+last));
  });
  const shown=A.compared||{};
  markLines(MA,{mine:r, fast:shown.fast, few:shown.few});
  $("#rtALine").textContent=A.msg||(atEnd?`You reached School in ${minutes} minutes. Press Compare.`:`You are at ${last}. Press the next stop.`);
}
function aPress(n){
  const r=A.route, last=r[r.length-1];
  if(A.compared) A.compared=null, $("#rtAVerdict").hidden=true;
  if(last==="School"){ A.msg="You are at School. Press Compare, or Undo to change the route."; }
  else if(n===last){ A.msg=`You are at ${n}. Press the next stop.`; }
  else if(r.includes(n)){ A.msg=`You have already been to ${n}.`; }
  else if(ekey(last,n)<0){ A.msg=`No direct ride from ${last} to ${n}.`; }
  else { r.push(n); A.msg=""; }
  aDraw();
}
function aCompare(){
  const r=A.route, mine=total(r), fa=fastest(), fe=fewest();
  A.compared={fast:fa.path, few:fe.path};
  const v=$("#rtAVerdict"); v.hidden=false;
  const pe=x=>`${x.min} minutes and ${x.rides*FARE} pesos`;
  if(sameRoute(r,fa.path)){
    v.className="verdict ok";
    v.innerHTML=`<b>You found the fastest route: ${pe(fa)}.</b>The route with the fewest rides takes ${pe(fe)}.`;
  } else if(sameRoute(r,fe.path)){
    v.className="verdict warn";
    v.innerHTML=`<b>Your route has the fewest rides: ${pe(fe)}.</b>The fastest route takes ${pe(fa)}.`;
  } else {
    v.className="verdict "+(mine<40?"ok":"warn");
    v.innerHTML=`<b>Your route: ${mine} minutes, ${fareOf(r)} pesos.</b>The fastest route takes ${pe(fa)}. The route with the fewest rides takes ${pe(fe)}.`;
  }
  A.msg="Blue shows the fastest route. The dotted line shows the fewest rides.";
  aDraw();
}
/* ---------- widget 2: close a line ---------- */
let MB; const B={closed:EDGES.map(()=>false)};
const open0=()=>fastest().min;
function bDraw(){
  const best=fastest(B.closed), base=open0(), nClosed=B.closed.filter(Boolean).length;
  MB.labs.forEach((el,i)=>{
    const e=EDGES[i], c=B.closed[i];
    el.classList.toggle("closed",c);
    el.innerHTML=c?ICO("waves"):String(e[2]);
    el.setAttribute("aria-label",`${e[0]} to ${e[1]}, ${e[2]} minutes, ${c?"closed. Press to open":"open. Press to close"}`);
    el.setAttribute("aria-pressed",String(c));
  });
  markLines(MB,{fast:best&&best.path});
  MB.lines.forEach((l,i)=>{ if(B.closed[i]) l.setAttribute("class","closed"); });
  const v=$("#rtBVerdict");
  if(!best){
    $("#rtBMin").textContent="none"; $("#rtBExtra").textContent="none";
    v.className="verdict bad"; v.innerHTML=`<b>No route is left.</b>Home cannot reach School with these lines closed. Press a flood sign to open that line again.`;
    return;
  }
  const extra=best.min-base;
  $("#rtBMin").textContent=best.min; $("#rtBExtra").textContent=extra;
  const names=best.path.join(", ");
  if(!nClosed){ v.className="verdict"; v.innerHTML=`<b>Best route: ${best.min} minutes.</b>${names}.`; }
  else if(!extra){ v.className="verdict ok"; v.innerHTML=`<b>Best route: ${best.min} minutes.</b>${names}. The closed ${nClosed>1?"lines are":"line is"} not on it, so nothing changes.`; }
  else { v.className="verdict warn"; v.innerHTML=`<b>Best route: ${best.min} minutes.</b>${names}. That is ${extra} ${extra===1?"minute":"minutes"} more than with every line open.`; }
}
/* ---------- wiring ---------- */
function start(){
  MA=makeMap($("#rtMapA"),"build");
  NODES.forEach(n=>MA.nodes[n].onclick=()=>aPress(n));
  MB=makeMap($("#rtMapB"),"close",i=>{ B.closed[i]=!B.closed[i]; bDraw(); const el=MB.labs[i]; if(el) el.focus(); });
  aDraw(); bDraw();
}
$("#rtAUndo").onclick=()=>{ if(A.route.length>1){ A.route.pop(); A.compared=null; A.msg=""; $("#rtAVerdict").hidden=true; aDraw(); } };
$("#rtACompare").onclick=aCompare;
$("#rtAReset").onclick=()=>{ A.route=["Home"]; A.compared=null; A.msg=""; $("#rtAVerdict").hidden=true; aDraw(); $("#rtAReset").focus(); };
$("#rtBReset").onclick=()=>{ B.closed=EDGES.map(()=>false); bDraw(); $("#rtBReset").focus(); };
start();
const replace=()=>{ if(MA){ MA.place(); } if(MB){ MB.place(); } };
PAGE_HOOKS.show=replace;
window.addEventListener("resize",replace);
})();
