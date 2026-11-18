/* Lesson abstract. Widget code for the markup in lesson.html.
   Two widgets: a detail switcher for three questions, and a level zoom with three people.
   Answers are computed from the data below. */

/* ---------- 1. keep the details a question needs ---------- */
const AB_DETAILS=["Stop names","Order of stops","Fare","Road distance","Traffic","Jeepney color","Building shapes"];
const AB_QS=[
  {q:"Which jeepney do I ride from Katipunan to Cubao?", needs:["Stop names","Order of stops"]},
  {q:"How much is the fare from Katipunan to Cubao?",    needs:["Stop names","Fare"]},
  {q:"How long will the ride from Katipunan to Cubao take at 5 PM?", needs:["Stop names","Road distance","Traffic"]}];
const abK={q:0, on:new Set(AB_DETAILS), solved:new Set()};

function abKDraw(){
  const need=AB_QS[abK.q].needs, on=[...abK.on];
  $$("#abQs button").forEach((el,i)=>el.setAttribute("aria-pressed",String(i===abK.q)));
  $$("#abDs button").forEach((el,i)=>{
    const k=abK.on.has(AB_DETAILS[i]);
    el.setAttribute("aria-pressed",String(k)); el.classList.toggle("off",!k);
  });
  const missing=need.filter(n=>!abK.on.has(n)), extra=on.filter(n=>!need.includes(n));
  const smallest = missing.length===0 && extra.length===0;
  if(smallest) abK.solved.add(abK.q);
  $("#abKept").textContent=on.length+" of "+AB_DETAILS.length;
  $("#abSolved").textContent=abK.solved.size+" of "+AB_QS.length;
  $$("#abQs button").forEach((el,i)=>el.querySelector("small").textContent = abK.solved.has(i) ? "Solved" : "");
  const v=$("#abV1");
  if(missing.length){
    v.className="verdict warn";
    v.innerHTML=`<b>Cannot answer yet</b>Missing: ${missing.map(x=>x.toLowerCase()).join(", ")}. Switch ${missing.length===1?"it":"them"} back on.`;
  } else if(!smallest){
    v.className="verdict";
    v.innerHTML=`<b>Can answer</b>This model has ${extra.length} detail${extra.length===1?"":"s"} the question does not need. Switch ${extra.length===1?"it":"them"} off.`;
  } else if(abK.solved.size===AB_QS.length){
    v.className="verdict ok";
    v.innerHTML=`<b>All three solved</b>The three questions needed ${AB_QS.map(x=>x.needs.length).slice(0,-1).join(", ")} and ${AB_QS[AB_QS.length-1].needs.length} of the ${AB_DETAILS.length} details. Each question needs its own set.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>Smallest model</b>It answers with ${on.length} of ${AB_DETAILS.length} details. The other ${AB_DETAILS.length-on.length} did not matter for this question.`;
  }
}
$("#abQs").innerHTML=AB_QS.map(x=>`<button type="button" class="tg" aria-pressed="false"><span class="dot"></span><span>${x.q}<small></small></span></button>`).join("");
$$("#abQs button").forEach((el,i)=>el.onclick=()=>{ abK.q=i; abKDraw(); });
$("#abDs").innerHTML=AB_DETAILS.map(x=>`<button type="button" class="tg" aria-pressed="true"><span class="dot"></span><span>${x}</span></button>`).join("");
$$("#abDs button").forEach((el,i)=>el.onclick=()=>{
  const d=AB_DETAILS[i]; if(abK.on.has(d)) abK.on.delete(d); else abK.on.add(d); abKDraw(); });
$("#abReset1").onclick=()=>{ abK.q=0; abK.on=new Set(AB_DETAILS); abK.solved=new Set(); abKDraw(); };
abKDraw();

/* ---------- 2. zoom ---------- */
const AB_LEVELS=["Tap Order","The app sends the order to the server","The server saves the order in the database","The database writes a row to disk"];
const AB_PEOPLE=[
  {name:"Customer", the:"the customer", icon:"user", job:"Wants the order to go through.", level:1},
  {name:"App developer", the:"the app developer", icon:"device-mobile", job:"Checks what the app sends to the server.", level:2},
  {name:"Database administrator", the:"the database administrator", icon:"database", job:"Checks how each order is written to disk.", level:4}];
const abZ={lvl:1, done:new Set()};

function abZDraw(){
  const n=AB_LEVELS.length;
  $("#abStack").innerHTML=AB_LEVELS.slice(0,abZ.lvl).map((t,i)=>
    `<div class="abl${i===abZ.lvl-1?" now":""}"><span class="n">${i+1}</span><span>${t}</span></div>`).join("");
  const hidden=n-abZ.lvl;
  $("#abHid").textContent = hidden>0 ? hidden+(hidden===1?" level is":" levels are")+" hidden below." : "No levels are hidden.";
  $("#abOut").disabled=abZ.lvl<=1; $("#abIn").disabled=abZ.lvl>=n;
  $("#abLvl").textContent=abZ.lvl+" of "+n;
  $("#abMatched").textContent=abZ.done.size+" of "+AB_PEOPLE.length;
  $$("#abPeople button").forEach((el,i)=>{
    const d=abZ.done.has(i);
    el.classList.toggle("right",d); el.setAttribute("aria-pressed",String(d));
    el.querySelector("small.lv").textContent = d ? "Level "+AB_PEOPLE[i].level : "";
  });
}
function abZPress(i){
  const p=AB_PEOPLE[i], v=$("#abV2");
  if(abZ.done.has(i)) return;
  if(abZ.lvl===p.level){
    abZ.done.add(i); abZDraw();
    if(abZ.done.size===AB_PEOPLE.length){
      v.className="verdict ok";
      v.innerHTML=`<b>All three matched</b>The customer needs level 1, the app developer level 2 and the database administrator level 4. Each can ignore the levels they do not work on.`;
    } else {
      v.className="verdict ok";
      v.innerHTML=`<b>Level ${p.level} fits</b>${p.the[0].toUpperCase()+p.the.slice(1)} works at level ${p.level}. The other levels are detail that this job can ignore.`;
    }
  } else if(abZ.lvl<p.level){
    v.className="verdict warn";
    v.innerHTML=`<b>Too little detail</b>Level ${abZ.lvl} shows too little for ${p.the}. Zoom in.`;
  } else {
    v.className="verdict warn";
    v.innerHTML=`<b>Too much detail</b>Level ${abZ.lvl} shows more than ${p.the} needs. Zoom out.`;
  }
}
$("#abPeople").innerHTML=AB_PEOPLE.map(p=>
  `<button type="button" class="wopt abp" aria-pressed="false">${ICO(p.icon)}<span><b>${p.name}</b><small>${p.job}</small><small class="lv"></small></span></button>`).join("");
$$("#abPeople button").forEach((el,i)=>el.onclick=()=>abZPress(i));
$("#abIn").onclick=()=>{ if(abZ.lvl<AB_LEVELS.length){ abZ.lvl++; $("#abV2").className="verdict"; $("#abV2").innerHTML=""; abZDraw(); } };
$("#abOut").onclick=()=>{ if(abZ.lvl>1){ abZ.lvl--; $("#abV2").className="verdict"; $("#abV2").innerHTML=""; abZDraw(); } };
$("#abReset2").onclick=()=>{ abZ.lvl=1; abZ.done=new Set(); $("#abV2").className="verdict"; $("#abV2").innerHTML=""; abZDraw(); };
abZDraw();
