/* Lesson basics. Widget code for the markup in lesson.html. */
/* ================= 00 BASICS ================= */
/* ---- how is this page being read right now? the panel adapts to the answer ---- */
const CTX=(()=>{
  const proto=location.protocol, host=location.hostname, port=location.port;
  if(proto==="file:") return {
    mode:"file",
    line:`Your address bar starts with <code>file://</code>. <b class="i">No server is involved.</b> The browser read this document directly from your disk.`,
    laptop:`The address bar says <code>file://</code>, so no program is listening.`,
    close:`Right now it is not. The address bar shows <code>file://</code>, so the browser opened a file and made no connection. If you run <code>python3 start.py</code> in a terminal (a window where you type commands), Python starts a program that waits on port 8080. Your browser then connects to it, and your laptop is both the server and the client. So <code>localhost:8080</code> means this computer, port 8080, and a classmate who opens that link reaches their own computer. The next topic is <a data-lesson="tiers">Three tiers</a>.`
  };
  if(host==="localhost"||host==="127.0.0.1") return {
    mode:"local",
    line:`<code>${host}${port?":"+port:""}</code>. This page arrived over HTTP from a program running on <b class="i">your own machine</b>, most likely the one you started with <code>python3 start.py</code>. Your laptop is the server and the client at the same time.`,
    laptop:`This page came over HTTP from a program listening on port ${port||"8080"} of this machine.`,
    close:`Yes, it already is. This page came over HTTP from a program listening on port ${port||"8080"} of this computer, which is what <code>${host}${port?":"+port:""}</code> in your address bar means. Your browser connected to it, so the same computer plays both roles. A classmate who opens the same link reaches their own computer, because localhost always means the computer you are typing on. The next topic is <a data-lesson="tiers">Three tiers</a>.`
  };
  return {
    mode:"remote",
    line:`<code>${host}</code>. This page came over the network from a machine you have never seen, and your laptop is <b class="i">the client</b> in that exchange. Nothing on your computer is serving it.`,
    laptop:`This page came from <code>${host}</code>, so your laptop is the client.`,
    close:`Not at this moment. This copy came from <code>${host}</code>, so your laptop is the client. If you download the teaching files and run <code>python3 start.py</code> in a terminal (a window where you type commands), Python starts a program that waits on port 8080. Your browser connects to it, and your laptop is both the server and the client. A classmate who opens <code>localhost:8080</code> reaches their own computer, because localhost always means the computer you are typing on. The next topic is <a data-lesson="tiers">Three tiers</a>.`
  };
})();
{
  const l=$("#ctxLine"), c=$("#ctxClose");
  if(l) l.innerHTML=CTX.line;
  if(c) c.innerHTML=CTX.close;
}


const GUESS=[
 {n:"Your laptop", d:"the one in front of you",
  a:CTX.mode==="local"?"yes, right now":"yes, when a program is listening",
  x:CTX.laptop},
 {n:"A Raspberry Pi", d:"a small, low-cost computer",
  a:"yes",
  x:"Many real websites run on hardware weaker than this."},
 {n:"A rented cloud server", d:"rented by the hour from a company",
  a:"yes",
  x:"It is a share of a larger machine, created by software in about a minute."},
 {n:"Your phone", d:"in your pocket",
  a:"yes, technically",
  x:"Apps exist that turn a phone into a web server."},
 {n:"A rack in a data center", d:"a frame that holds many computers in a server room",
  a:"only if a program is running",
  x:"A powered rack with no program listening serves nothing."}
];
let guessSeen=0;
$("#guessRow").innerHTML=GUESS.map((g,i)=>`
  <button class="gs" data-i="${i}">
    <h5>${g.n}</h5><p>${g.d}</p>
    <div class="ans">${g.a}</div></button>`).join("");
$$("#guessRow .gs").forEach(el=>el.onclick=()=>{
  el.classList.add("on");
  guessSeen=$$("#guessRow .gs.on").length;
  const g=GUESS[+el.dataset.i], v=$("#guessVerdict");
  v.className="verdict ok";
  v.innerHTML=`<b>${g.n}: ${g.a}</b>${g.x}` + (guessSeen>=3
    ? ` <b class="i">Each yes depends on a program waiting for connections.</b>`
    : "");
});
$("#guessVerdict").className="verdict";
$("#guessVerdict").innerHTML="<b>Decide first</b>Say yes or no to yourself for each device, then click it.";

const URLP=[
 {t:"https", c:"scheme", d:"<b>How to talk.</b> <code>https</code> is HTTP with the conversation encrypted, so anyone between you and the server sees scrambled data. <code>http</code> is the same without encryption."},
 {t:"://",  c:"", d:"Punctuation. It separates the scheme from the host."},
 {t:"enlist.university.edu", c:"host", d:"<b>Which machine.</b> A name, which the network turns into an IP address before anything else happens."},
 {t:":443", c:"port", d:"<b>Which program on that machine.</b> One computer can run many listening programs, and <code>443</code> is the usual port for HTTPS."},
 {t:"/api/courses", c:"path", d:"<b>Which thing on that program.</b> The developers of the server decide this part, and a good path names a thing, such as courses."},
 {t:"?sem=1", c:"query", d:"<b>Extra detail.</b> Filters, page numbers and search terms. It is part of the address, so never put a password here."}
];
$("#urlBar").innerHTML=URLP.map((p,i)=>
  p.c ? `<span class="up" data-i="${i}">${p.t}<span class="lab">${p.c}</span></span>`
      : `<span style="color:var(--faint)">${p.t}</span>`).join("");
$$("#urlBar .up").forEach(el=>el.onclick=()=>{
  $$("#urlBar .up").forEach(x=>x.classList.remove("on"));
  el.classList.add("on");
  const p=URLP[+el.dataset.i];
  $("#urlOut").innerHTML=`<div class="et">${p.c.charAt(0).toUpperCase()+p.c.slice(1)}: ${p.t}</div><p>${p.d}</p>`;
});

/* ---- your laptop's several addresses, and how far a packet gets ---- */
const HOPS=["your program","operating system","wifi card","router","internet provider","the internet"];
const IFACES=[
 {dev:"lo0", ip:"127.0.0.1", s:"loopback", reach:2, turn:"turns around here, inside the operating system",
  v:`<b>It never leaves the machine</b>There is no cable, no wifi and no router. If you turn off your wifi, <code>localhost:8080</code> still works.`},
 {dev:"en0", ip:"192.168.1.7", s:"wifi, assigned by your router", reach:4, turn:"stops at your router, the farthest point where this address means anything",
  v:`<b>It reaches your router and goes no further</b>A classmate on the same wifi can reach this address. Outside your network it means nothing, because millions of homes use the same private range.`},
 {dev:"wan", ip:"112.198.44.19", s:"your router's public address", reach:6, turn:"reaches the internet, and belongs to your router",
  v:`<b>This address works on the internet, and it belongs to your router</b>Every device behind the router shares it, so nothing on the internet can start a conversation with your laptop. The router rewrites outgoing packets to use this address, which is called network address translation (NAT).`}
];
let ifSel=0;
function renderIface(){
  $("#ifaceList").innerHTML=IFACES.map((f,i)=>`
    <button class="ifc${i===ifSel?" on":""}" data-i="${i}">
      <span class="dev">${f.dev}</span>
      <span class="ip">${f.ip}<small>${f.s}</small></span></button>`).join("");
  $$("#ifaceList .ifc").forEach(el=>el.onclick=()=>{ifSel=+el.dataset.i;renderIface()});

  const f=IFACES[ifSel];
  $("#hopTrack").innerHTML=HOPS.map((h,i)=>{
    const lit=i<f.reach, last=i===HOPS.length-1;
    return `<div class="hop2 ${lit?"lit":"dead"}">
      <div class="box">${h}</div>${last?"":`<span class="arr">${i===f.reach-1?"&#8630;":"&rarr;"}</span>`}</div>`;
  }).join("");
  $("#hopTurn").textContent=f.turn;
  $("#ifaceVerdict").className="verdict "+(ifSel===2?"ok":"warn");
  $("#ifaceVerdict").innerHTML=f.v;
}
renderIface();

const WHO=[
 {id:"me",   n:"You, on your own laptop", s:"the machine running it",
  r:[true,true,true],
  v:`<b>Everything works</b>All three addresses reach it, because you are on the machine itself. A project that works on your machine can still fail for everyone else.`},
 {id:"lan",  n:"A classmate on the same wifi", s:"same wifi network",
  r:[false,true,true],
  v:`<b>The local network address works. Localhost does not.</b>Their own computer answers to <code>localhost</code>. If you give them <code>192.168.1.7:8080</code>, it works on the same wifi.`},
 {id:"far",  n:"Someone on another network", s:"for example, at home in another city",
  r:[false,false,true],
  v:`<b>Only the public address works</b>The row that works is the university's own public server, which is not your laptop. Your laptop has no address that the wider internet can reach.`}
];
const TARGETS=[
 {a:"127.0.0.1:8080", s:"localhost, this machine"},
 {a:"192.168.1.7:8080", s:"your laptop on the local wifi"},
 {a:"enlist.university.edu:443", s:"a public address on the internet"}
];
let who="me";
function renderReach(){
  const w=WHO.find(x=>x.id===who);
  $("#whoList").innerHTML=WHO.map(x=>`
    <button class="tg" data-w="${x.id}" aria-pressed="${x.id===who}">
      <span class="dot"></span><span>${x.n}<small>${x.s}</small></span></button>`).join("");
  $$("#whoList .tg").forEach(el=>el.onclick=()=>{who=el.dataset.w;renderReach()});
  $("#reachRows").innerHTML=TARGETS.map((t,i)=>`
    <div class="rr"><span class="addr">${t.a}<small>${t.s}</small></span>
      <span class="yn ${w.r[i]?"y":"n"}">${w.r[i]?"reaches":"no"}</span></div>`).join("");
  const v=$("#reachVerdict");
  v.className="verdict "+(w.r[0]?"ok":"warn");
  v.innerHTML=w.v;
}
renderReach();
