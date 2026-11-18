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
 {id:"one", n:"One machine, one data center",
  d:"The default. Everything runs in a single availability zone.",
  survives:{srv:false,az:false,reg:false}, rpo:"everything since your last backup", rto:"hours", cost:"1×"},
 {id:"az1", n:"Several machines, one data center",
  d:"A load balancer shares traffic between the machines. This survives a machine failure but not a data center failure.",
  survives:{srv:true,az:false,reg:false}, rpo:"everything since your last backup", rto:"hours", cost:"1.3×"},
 {id:"maz", n:"Multi-AZ: two data centers, one region",
  d:"Each write is copied to both data centers before it is confirmed (synchronous replication). This works because the buildings are milliseconds apart.",
  survives:{srv:true,az:true,reg:false}, rpo:"nothing", rto:"under a minute", cost:"2×"},
 {id:"mreg", n:"Multi-region: standby in Tokyo",
  d:"Writes are copied to Tokyo after they are confirmed (asynchronous replication), because Tokyo is 3,000 km away.",
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
          <text x="${projX(q.ll[0])}" y="${projY(q.ll[1])-8}" fill="var(--faint)" font-size="10" text-anchor="middle">${q.s}</text>`;
  });

  // replication arc to the standby, when there is one
  if(isMulti){
    svg+=`<path d="${arcPath(r.ll,dr.ll)}" fill="none" stroke="${regDead?"var(--res)":"var(--line3)"}" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    const dcol=regDead?"var(--res)":"var(--faint)";
    svg+=`<circle cx="${projX(dr.ll[0])}" cy="${projY(dr.ll[1])}" r="7" fill="none" stroke="${dcol}" stroke-width="2"/>
          <circle cx="${projX(dr.ll[0])}" cy="${projY(dr.ll[1])}" r="3" fill="${dcol}"/>
          <text x="${projX(dr.ll[0])}" y="${projY(dr.ll[1])-13}" fill="${dcol}" font-size="10.5" text-anchor="middle">${regDead?"NRT: now primary":"NRT: standby"}</text>`;
  }

  // the arc that matters: users to primary
  const live = !regDead;
  const acol = live ? "var(--req)" : "var(--warn)";
  svg+=`<path d="${arcPath(MANILA,r.ll)}" fill="none" stroke="${acol}" stroke-width="2.4" ${live?"":'stroke-dasharray="6 5"'} opacity=".95"/>`;

  // primary region marker
  const px=projX(r.ll[0]), py=projY(r.ll[1]);
  svg+=`<circle cx="${px}" cy="${py}" r="11" fill="${acol}" opacity=".18"/>
        <circle cx="${px}" cy="${py}" r="5.5" fill="${acol}"/>
        <text x="${px}" y="${py-15}" fill="${acol}" font-size="11.5" font-weight="600" text-anchor="middle">${r.s}${regDead?" ✕":""}</text>`;
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
  if(REG.idx!==0) svg+=`<text x="${ux}" y="${uy+22}" fill="var(--res)" font-size="10.5" text-anchor="middle">MNL: your users</text>`;

  // the number, on the arc
  // fixed readout, so short hops do not stack labels on top of each other
  svg+=`<rect x="14" y="14" width="196" height="62" rx="6" fill="var(--bg)" stroke="${acol}" stroke-width="1" opacity=".95"/>
        <text x="26" y="33" fill="var(--faint)" font-size="9.5">Manila \u2192 ${r.s}</text>
        <text x="26" y="53" fill="${acol}" font-size="19" font-weight="600">${Math.round(L.real)} ms</text>
        <text x="104" y="53" fill="var(--dim)" font-size="11">round trip</text>
        <text x="26" y="69" fill="var(--faint)" font-size="10">${r.km.toLocaleString()} km, physics floor ${L.phys.toFixed(0)} ms</text>`;

  // clickable hit areas, last so nothing is drawn over them
  REGIONS.forEach((q,i)=>{
    if(i===0) return;                       // Metro Manila is where the users are
    svg+=`<circle class="pick" data-r="${i}" cx="${projX(q.ll[0])}" cy="${projY(q.ll[1])}"
            r="15" fill="transparent"><title>${q.n}: ${q.km.toLocaleString()} km</title></circle>`;
  });
  $("#worldMap").innerHTML=svg;

  // latency readouts, and what it does to five round trips
  const ttfb=L.real*5+40;
  $("#latStats").innerHTML=[
    ["var(--line2)","Distance, one way", r.km.toLocaleString()+" km"],
    ["var(--res)","Physics floor, round trip", L.phys.toFixed(0)+" ms"],
    ["var(--req)","Realistic round trip", L.real.toFixed(0)+" ms"],
    ["var(--req)","Time to first byte: 5 round trips + 40 ms handler", Math.round(ttfb)+" ms"]
  ].map(([c,n,v])=>`<div class="lg"><i style="background:${c}"></i>${n}<b>${v}</b></div>`).join("");

  const v=$("#latVerdict");
  if(r.km<100){
    v.className="verdict ok";
    v.innerHTML=`<b>Next door, ${L.real.toFixed(0)} ms</b>Latency is close to zero. Most providers do not offer a region inside Metro Manila.`;
  } else if(ttfb<400){
    v.className="verdict ok";
    v.innerHTML=`<b>${Math.round(ttfb)} ms to first byte</b>This is comfortable. Your handler (the code that processes the request) accounts for 40 ms, and the rest is distance, which code cannot reduce. For users in Metro Manila this is about as good as a real cloud region gets.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>${Math.round(ttfb)} ms before anything appears</b>${r.n} is ${r.km.toLocaleString()} km away, so every round trip costs ${L.real.toFixed(0)} ms and a page needs five of them. Your code is only 40 ms of that. This is the Berlin example from "Why loading a page takes several round trips", caused here by choosing a distant region. The fix is to move the servers closer, or to serve reads from a copy that is already close.`;
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
  else if(REG.dead.az){ up=P.survives.az; why="a data center"; }
  else if(REG.dead.srv){ up=P.survives.srv; why="one machine"; }

  $("#foStats").innerHTML=[
    ["var(--res)","Survives a machine", P.survives.srv?"yes":"no"],
    ["var(--res)","Survives a data center", P.survives.az?"yes":"no"],
    ["var(--res)","Survives a region", P.survives.reg?"yes":"no"],
    ["var(--req)","Runs at", P.cost+" the cost"]
  ].map(([c,n,val])=>`<div class="lg"><i style="background:${val==="no"?"var(--warn)":c}"></i>${n}<b style="${val==="no"?"color:var(--warn)":""}">${val}</b></div>`).join("");

  const fv=$("#foVerdict");
  if(!anyDead){
    fv.className="verdict";
    fv.innerHTML=`<b>Everything is running</b>Press one of the buttons to see what this option protects against.`;
  } else if(up && REG.dead.reg){
    fv.className="verdict warn";
    fv.innerHTML=`<b>Failed over to Tokyo, with a cost</b>You survived losing ${why}. The standby in Tokyo was updated asynchronously across 3,000 km, so you lost ${P.rpo} and the site was unavailable for ${P.rto}. All users now connect to Tokyo, which is farther away than Singapore, so the whole site is slower until you switch back.`;
  } else if(up){
    fv.className="verdict ok";
    fv.innerHTML=`<b>Still running</b>You lost ${why} and users noticed nothing, because another machine or data center kept serving requests. With two data centers in one region, the buildings are close enough that each write is saved in both before the user gets a reply.`;
  } else {
    fv.className="verdict bad";
    const dRto=P.id==="maz"?"hours":P.rto, dRpo=P.id==="maz"?"everything since your last backup":P.rpo;   // multi-AZ is only down when the whole region fails, so it restores from backup
    fv.innerHTML=`<b>Down</b>You lost ${why}, and this option does not survive that. You restore from backup. The site is unavailable for ${dRto}, and you lose ${dRpo}. These two numbers have names. The recovery time objective (RTO) is how long until you are back. The recovery point objective (RPO) is how much data you accept losing. Choose both before an outage, because afterward they are chosen for you.`;
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

