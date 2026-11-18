/* ================= 00 BASICS ================= */
/* ---- how is this page being read right now? the panel adapts to the answer ---- */
const CTX=(()=>{
  const proto=location.protocol, host=location.hostname, port=location.port;
  if(proto==="file:") return {
    mode:"file",
    line:`Your address bar starts with <code>file://</code>. There is <b class="i">no server involved at all</b>. The browser opened this document straight off your disk, the way it would open a photo. Nothing is listening, no port is in use, and no network was involved.`,
    laptop:`Not at this moment. Look at your address bar: it says <code>file://</code>, so the browser read this file off the disk and no program is listening. Run <code>python3 start.py</code> from the repo and the address becomes <code>localhost:8080</code>. At that point, and not before, your laptop is a server.`,
    close:`Right now it is not one, and the address bar is the evidence: <code>file://</code> means the browser opened a file, not a connection. Run <code>python3 start.py</code> and Python starts a program that sits in a loop on port 8080 waiting for connections. Your browser then connects to it and the two of them speak HTTP, on the same machine, both roles at once. That is what <code>localhost:8080</code> means. Sending that link to a classmate gets them nothing. Panel 01 picks up from there.`
  };
  if(host==="localhost"||host==="127.0.0.1") return {
    mode:"local",
    line:`<code>${host}${port?":"+port:""}</code>. This page arrived over HTTP from a program running on <b class="i">your own machine</b>, almost certainly the one you started with <code>python3 start.py</code>. Your laptop is the server and the client at the same time.`,
    laptop:`It is one right now, and this page is the proof. It did not come off your disk; it came over HTTP from a program listening on port ${port||"8080"} of this machine. Stop that process and this page stops loading.`,
    close:`It already is one. This page came over HTTP from a program listening on port ${port||"8080"} of this very machine, which is what <code>${host}${port?":"+port:""}</code> in your address bar means. Python started that program, it sits in a loop waiting for connections, your browser connected to it, and the two of them spoke HTTP. Same machine, both roles at once, which is also why sending that link to a classmate does not work. Panel 01 picks up from there.`
  };
  return {
    mode:"remote",
    line:`<code>${host}</code>. This page came over the network from a machine you have never seen and will never touch, and your laptop is <b class="i">the client</b> in that exchange. Nothing on your computer is serving it.`,
    laptop:`Not at this moment. This page came from <code>${host}</code>, a machine somewhere else. But clone the repo and run <code>python3 start.py</code> and your laptop starts listening on port 8080, and for as long as that runs it is a server, on exactly the same terms.`,
    close:`Not at this moment, because this copy came from <code>${host}</code> and your laptop is the client. Clone the repo and run <code>python3 start.py</code> and that reverses: Python starts a program that sits in a loop on port 8080 waiting for connections, your browser connects to it, and the two of them speak HTTP on the same machine, both roles at once. That is what <code>localhost:8080</code> means. Sending that link to a classmate gets them nothing. Panel 01 picks up from there.`
  };
})();
{
  const l=$("#ctxLine"), c=$("#ctxClose");
  if(l) l.innerHTML=CTX.line;
  if(c) c.innerHTML=CTX.close;
}


const GUESS=[
 {n:"Your laptop", d:"the one in front of you",
  a:CTX.mode==="local"?"yes \u2014 right now, in fact":"yes, when something listens",
  x:CTX.laptop},
 {n:"A Raspberry Pi", d:"costs about \u20b12,000",
  a:"yes",
  x:"Plenty of real websites run on hardware weaker than this. Nothing about being a server requires expensive equipment. It requires a program that waits and a network that can reach it."},
 {n:"A rented cloud box", d:"the usual answer",
  a:"yes",
  x:"This is what most people picture, and panel 21 shows it is a slice of a machine, shared with strangers, created by software in about a minute."},
 {n:"Your phone", d:"surely not",
  a:"yes, technically",
  x:"A phone has a processor, memory and a network connection. Apps exist that turn one into a web server. It is a bad idea for other reasons, but nothing about the definition rules it out."},
 {n:"A rack in a data centre", d:"the classic image",
  a:"only if something is running",
  x:"A powered rack with no program listening serves nothing. It is an expensive space heater. The rack is not what makes it a server."}
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
  v.innerHTML=`<b>${g.n}, ${g.a}</b>${g.x}` + (guessSeen>=3
    ? ` <br><br><b class="i">The pattern:</b> every answer is yes, and every answer has the same condition attached. A server is a computer running a program that waits for connections. Nothing more specific than that is true.`
    : "");
});
$("#guessVerdict").className="verdict";
$("#guessVerdict").innerHTML="<b>Have a guess first</b>Click one and see whether you were right.";

const URLP=[
 {t:"https", c:"scheme", d:"<b>How to talk.</b> <code>https</code> means HTTP with the conversation encrypted, so anyone sitting between you and the server sees noise instead of your password. <code>http</code> is the same conversation in the open. Panel 03 shows what the encryption costs you in round trips."},
 {t:"://",  c:"", d:"Punctuation. It separates how from where, and carries no meaning of its own."},
 {t:"enlist.university.edu", c:"host", d:"<b>Which machine.</b> A name, because <code>18.141.62.7</code> is hard to remember and hard to change. Something has to turn this name into a number before anything can happen. That is DNS, and it is a lookup that costs a round trip of its own the first time."},
 {t:":443", c:"port", d:"<b>Which program on that machine.</b> One computer can run many programs that listen, so the port says which one you want. <code>443</code> is the convention for HTTPS and <code>80</code> for HTTP, so browsers add it for you and hide it. Your starter API uses <code>8000</code>, which is a convention for nothing at all."},
 {t:"/api/courses", c:"path", d:"<b>Which thing on that program.</b> This is the part you design. Panel 05 is about doing it well, and the short rule is that it should name a noun."},
 {t:"?sem=1", c:"query", d:"<b>Extra detail.</b> Filters, page numbers, search terms. It is part of the address, which means it is visible in logs and browser history. Never put a password here."}
];
$("#urlBar").innerHTML=URLP.map((p,i)=>
  p.c ? `<span class="up" data-i="${i}">${p.t}<span class="lab">${p.c}</span></span>`
      : `<span style="color:var(--faint)">${p.t}</span>`).join("");
$$("#urlBar .up").forEach(el=>el.onclick=()=>{
  $$("#urlBar .up").forEach(x=>x.classList.remove("on"));
  el.classList.add("on");
  const p=URLP[+el.dataset.i];
  $("#urlOut").innerHTML=`<div class="et">${p.c.toUpperCase()} &nbsp;&middot;&nbsp; ${p.t}</div><p>${p.d}</p>`;
});

/* ---- your laptop's several addresses, and how far a packet gets ---- */
const HOPS=["your program","the OS network code","the wifi card","your home router","your ISP","the internet"];
const IFACES=[
 {dev:"lo0", ip:"127.0.0.1", s:"loopback", reach:2, turn:"turns around here, inside the operating system",
  v:`<b>It never leaves the machine</b>There is no cable, no wifi, no router. The packet goes down as far as the operating system's network code and comes straight back up into a program on the same computer. Turn off your wifi entirely and <code>localhost:8080</code> still works. That is the test that proves it, and it surprises people every time.`},
 {dev:"en0", ip:"192.168.1.7", s:"wifi, handed out by your router", reach:4, turn:"stops at your router, which is as far as this address means anything",
  v:`<b>As far as your router, and no further</b>This one is real, in the sense that a classmate on the same wifi can reach it. It is also meaningless outside this building: <code>192.168.x.x</code> is a private range that millions of homes use simultaneously, so no router on the internet knows which one you meant. Your router hands these out and remembers who asked for what.`},
 {dev:"wan", ip:"112.198.44.19", s:"your router's public address", reach:6, turn:"reaches the internet, but it is the router's address, not your laptop's",
  v:`<b>This one is routable, and it is not yours</b>It belongs to your router, and everyone in the building shares it. When your laptop talks out, the router rewrites the packet to look like it came from here, and remembers the swap so the reply finds its way back. That machinery works beautifully outward and not at all inward. Nothing on the internet can start a conversation with your laptop.`}
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
  v:`<b>Everything works</b>All three addresses reach it, because you are already on the machine and on the network. This is why "it works on my machine" is such a famously useless sentence.`},
 {id:"lan",  n:"A classmate on the same wifi", s:"same room, same network",
  r:[false,true,true],
  v:`<b>Your LAN address works, localhost does not</b>When they type <code>localhost</code> their own computer answers, not yours, because localhost always means <em>this machine</em>. Give them <code>192.168.1.7:8080</code> instead and it works, as long as you are both on the same wifi.`},
 {id:"far",  n:"Someone at home in Cebu", s:"a different network entirely",
  r:[false,false,true],
  v:`<b>Only the public address works</b>Your laptop has no address the wider internet can route to. <code>192.168.x.x</code> is a private range that exists inside thousands of networks at once, so it is meaningless from outside. To let them in you would need a public address and something willing to forward the traffic. Renting one of those is the entire business panel 21 describes.`}
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

