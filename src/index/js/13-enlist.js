/* ================= ENLISTMENT CASE ================= */
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
  $("#aWebNote").textContent = AI.era==="cloud" ? "(autoscaled)" : "(7 fixed servers)";

  $("#aDbLoad").textContent=Math.round(m.dbLoad).toLocaleString()+" ops/s";
  $("#aDbLoadBar").style.width=pct(m.dbLoad)+"%";
  $("#aDbLoadBar").className = m.dbBreaks ? "over" : "db";
  $("#aDbBar").style.width=pct(DB_CEIL)+"%";

  const v=$("#aVerdict");
  if(m.webBreaks && m.dbBreaks){
    v.className="verdict bad";
    v.innerHTML=`<b>Both tiers overloaded</b>${Math.round(m.peak).toLocaleString()} rps are arriving, against a web tier maximum of ${m.web.toLocaleString()} rps and a database maximum of ${DB_CEIL} ops/s. This is the enlistment morning many students remember. Adding servers fixes the web tier. The database needs the staggering or separating switches.`;
  } else if(m.dbBreaks){
    v.className="verdict bad";
    v.innerHTML=`<b>Web tier coping, database overloaded</b>The web tier handles all ${Math.round(m.peak).toLocaleString()} rps, and ${Math.round(m.dbLoad).toLocaleString()} ops/s still reach one primary database whose maximum is ${DB_CEIL}. ${AI.era==="cloud"?"Moving to the cloud did not fix enlistment day. Autoscaling fixed the web tier, and the web tier was not the limit.":"Adding web servers here would change nothing."} Seat reservations cannot be cached and cannot be spread across replicas, because two students must never get the same last slot.`;
  } else if(m.webBreaks){
    v.className="verdict warn";
    v.innerHTML=`<b>Web tier is the limit</b>${Math.round(m.peak).toLocaleString()} rps against a maximum of ${m.web.toLocaleString()}. The seven-server setup reached this limit first, and moving to the cloud removed it. Switch to the cloud case to see what limits the system next.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>Holding, everything fits</b>The peak of ${Math.round(m.peak).toLocaleString()} rps is under the web tier maximum of ${m.web.toLocaleString()} rps, and only ${Math.round(m.dbLoad).toLocaleString()} ops/s reach the primary. ${AI.stag&&AI.split?"Both changes were needed: staggering flattened the peak, and moving reads off the primary left it with only the reservations.":AI.stag?"Staggering flattened the peak and needed no extra hardware.":AI.split?"Moving reads off the primary left it with only the reservations.":"The load is low enough that no changes are needed."}`;
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

