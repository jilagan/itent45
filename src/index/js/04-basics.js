/* ================= 00 BASICS ================= */
/* ---- how is this page being read right now? the panel adapts to the answer ---- */
const CTX=(()=>{
  const proto=location.protocol, host=location.hostname, port=location.port;
  if(proto==="file:") return {
    mode:"file",
    line:`Your address bar starts with <code>file://</code>. <b class="i">No server is involved.</b> The browser opened this document straight from your disk, the way it opens a photo. No program is listening and no network was used.`,
    laptop:`Not at this moment. Your address bar says <code>file://</code>, so the browser read this file from the disk and no program is listening. If you run <code>python3 start.py</code> in a terminal (a window where you type commands) from the course folder, the address becomes <code>localhost:8080</code>. From that point your laptop is a server.`,
    close:`Right now it is not. The address bar shows <code>file://</code>, which means the browser opened a file and did not make a connection. If you run <code>python3 start.py</code> in a terminal (a window where you type commands), Python starts a program that waits in a loop on port 8080, a number that identifies one program on your computer. Your browser then connects to it, and the two exchange HTTP messages, the request and reply format of the web. The same computer plays both roles. So <code>localhost:8080</code> means this computer, port 8080. A classmate who opens that link reaches their own computer, because localhost always means the computer you are typing on. The next topic is "Three tiers".`
  };
  if(host==="localhost"||host==="127.0.0.1") return {
    mode:"local",
    line:`<code>${host}${port?":"+port:""}</code>. This page arrived over HTTP from a program running on <b class="i">your own machine</b>, most likely the one you started with <code>python3 start.py</code>. Your laptop is the server and the client at the same time.`,
    laptop:`Yes, right now, and this page is the proof. It did not come from your disk. It came over HTTP from a program listening on port ${port||"8080"} of this machine. If you stop that program, this page can no longer be reloaded.`,
    close:`Yes, it already is. This page came over HTTP from a program listening on port ${port||"8080"} of this computer, which is what <code>${host}${port?":"+port:""}</code> in your address bar means. Python started that program, and it waits in a loop for connections. Your browser connected to it and the two exchanged HTTP messages, the request and reply format of the web. The same computer plays both roles. A classmate who opens the same link reaches their own computer, because localhost always means the computer you are typing on. The next topic is "Three tiers".`
  };
  return {
    mode:"remote",
    line:`<code>${host}</code>. This page came over the network from a machine you have never seen, and your laptop is <b class="i">the client</b> in that exchange. Nothing on your computer is serving it.`,
    laptop:`Not at this moment. This page came from <code>${host}</code>, a machine somewhere else. If you download the course files and run <code>python3 start.py</code>, your laptop starts listening on port 8080 and is a server for as long as that program runs.`,
    close:`Not at this moment. This copy came from <code>${host}</code>, so your laptop is the client. If you download the course files and run <code>python3 start.py</code> in a terminal (a window where you type commands), that changes. Python starts a program that waits in a loop on port 8080, a number that identifies one program on your computer. Your browser connects to it and the two exchange HTTP messages, the request and reply format of the web. The same computer plays both roles. So <code>localhost:8080</code> means this computer, port 8080. A classmate who opens that link reaches their own computer, because localhost always means the computer you are typing on. The next topic is "Three tiers".`
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
 {n:"A Raspberry Pi", d:"a credit-card-sized computer, about ₱2,000",
  a:"yes",
  x:"Many real websites run on hardware weaker than this. A server needs a program that waits and a network that can reach it. It does not need expensive equipment."},
 {n:"A rented cloud server", d:"rented by the hour from a company",
  a:"yes",
  x:"Most people picture this one. It is a share of a larger machine, used by several customers at once and created by software in about a minute. This is covered later in \"Virtual machines and the cloud\"."},
 {n:"Your phone", d:"in your pocket",
  a:"yes, technically",
  x:"A phone has a processor, memory and a network connection. Apps exist that turn one into a web server. It is a bad idea for other reasons, but nothing in the definition rules it out."},
 {n:"A rack in a data center", d:"a shelf of computers in a server room",
  a:"only if a program is running",
  x:"A powered rack with no program listening serves nothing. It becomes a server when a program starts waiting for requests."}
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
    ? ` <br><br><b class="i">What the answers have in common:</b> each one is yes, as long as a program is running and waiting for connections. That is the whole definition of a server.`
    : "");
});
$("#guessVerdict").className="verdict";
$("#guessVerdict").innerHTML="<b>Decide first</b>Say yes or no to yourself, then click a device to check.";

const URLP=[
 {t:"https", c:"scheme", d:"<b>How to talk.</b> <code>https</code> means HTTP with the conversation encrypted (scrambled so only the two ends can read it), so anyone between you and the server sees scrambled data and never your password. <code>http</code> is the same conversation without encryption. The cost in waiting time is covered later in \"Round trips and latency\"."},
 {t:"://",  c:"", d:"Punctuation. It separates the scheme from the host and has no meaning of its own."},
 {t:"enlist.university.edu", c:"host", d:"<b>Which machine.</b> A name, because a number such as <code>18.141.62.7</code> is hard to remember and hard to change. Before anything else happens, the name has to be turned into an IP address, which is the number that identifies a machine on the network. That lookup is called DNS (the Domain Name System). The first lookup costs a round trip of its own, a message out and the reply back."},
 {t:":443", c:"port", d:"<b>Which program on that machine.</b> One computer can run many programs that listen, so the port number says which one you want. By convention <code>443</code> is for HTTPS and <code>80</code> is for HTTP, so browsers add them for you and hide them. The starter project for this course uses <code>8000</code>, which has no special meaning."},
 {t:"/api/courses", c:"path", d:"<b>Which thing on that program.</b> The developers of the server decide this part. How to design it well is covered later in \"HTTP verbs and status codes\". The short rule is that a path should name a thing, such as courses."},
 {t:"?sem=1", c:"query", d:"<b>Extra detail.</b> Filters, page numbers and search terms. It is part of the address, so it appears in server logs and browser history. Never put a password here."}
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
const HOPS=["your program","operating system","wifi card","home router","internet provider","the internet"];
const IFACES=[
 {dev:"lo0", ip:"127.0.0.1", s:"loopback", reach:2, turn:"turns around here, inside the operating system",
  v:`<b>It never leaves the machine</b>There is no cable, no wifi and no router. The packet goes down as far as the operating system's network code, then comes straight back up to a program on the same computer. If you turn off your wifi, <code>localhost:8080</code> still works, which shows the packet never needed the network.`},
 {dev:"en0", ip:"192.168.1.7", s:"wifi, assigned by your router", reach:4, turn:"stops at your router, the farthest point where this address means anything",
  v:`<b>It reaches your router and goes no further</b>A classmate on the same wifi can reach this address. Outside your building it means nothing: <code>192.168.x.x</code> is a private range that millions of homes use at the same time, so no router on the internet knows which one you mean. Your router assigns these addresses and keeps track of who asked for what.`},
 {dev:"wan", ip:"112.198.44.19", s:"your router's public address", reach:6, turn:"reaches the internet, and belongs to your router",
  v:`<b>This address works on the internet, and it belongs to your router</b>Everyone in the building shares it. When your laptop sends something out, the router rewrites the packet so it appears to come from this address, and it remembers the change so the reply finds its way back. This is called network address translation (NAT). It works for traffic going out and does not work for traffic coming in. Nothing on the internet can start a conversation with your laptop.`}
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
  v:`<b>Everything works</b>All three addresses reach it, because you are on the machine itself. A project that "works on my machine" can still fail for everyone else.`},
 {id:"lan",  n:"A classmate on the same wifi", s:"same room, same network",
  r:[false,true,true],
  v:`<b>The local network address works. Localhost does not.</b>When your classmate types <code>localhost</code>, their own computer answers, because localhost always means the computer you type it on. If you give them <code>192.168.1.7:8080</code>, it works as long as you are both on the same wifi.`},
 {id:"far",  n:"Someone at home in Cebu", s:"a different network entirely",
  r:[false,false,true],
  v:`<b>Only the public address works</b>The row that works is the university's own public server, which is not your laptop. Your laptop has no address that the wider internet can reach. <code>192.168.x.x</code> is a private range used inside thousands of networks at once, so it means nothing from outside. To let this person in, you would need a public address and something that forwards the traffic to your laptop. Cloud providers sell machines with public addresses. This is covered later in "Virtual machines and the cloud".`}
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
