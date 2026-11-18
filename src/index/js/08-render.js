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

