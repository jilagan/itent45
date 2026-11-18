/* ================= 01 LAYERS ================= */
const LAYERS=[
  {n:"L7",name:"HTTP",unit:"message",hdr:38,pay:24,
   adds:"A request line, then <code>Header: value</code> pairs, a blank line, and an optional body.",
   solves:"Agreeing on what a request <em>means</em>: which resource, which method (such as GET), and what format the answer should have.",
   peer:"The web server program (nginx, or your Node or Python app).",
   note:"This is the only layer you normally write code for."},
  {n:"L6/5",name:"TLS",unit:"record",hdr:29,pay:62,
   adds:"A record header plus an authentication tag, which lets the receiver detect tampering. Everything inside is now encrypted, meaning scrambled so only the two ends can read it.",
   solves:"Anyone who can see the wire, such as the café router or the internet provider, must not be able to read or change the message.",
   peer:"The TLS software on the server, which holds the matching session key.",
   note:"Setting up these keys (the handshake) costs one or two extra round trips, so HTTPS can feel slower on the first load. A round trip is a message out and the reply back."},
  {n:"L4",name:"TCP",unit:"segment",hdr:20,pay:91,
   adds:"Source and destination <em>ports</em> (numbers that identify programs), a sequence number, an acknowledgment number and flags.",
   solves:"Networks lose, duplicate and reorder data. TCP numbers every byte and resends whatever was not acknowledged, so the application receives a clean, ordered stream.",
   peer:"The TCP software in the server's operating system, listening on port 443.",
   note:"Port 443 tells the operating system which of the many running programs should receive this data."},
  {n:"L3",name:"IP",unit:"packet",hdr:20,pay:111,
   adds:"Source and destination IP addresses, plus a hop limit (TTL), a counter that stops lost packets from circulating forever.",
   solves:"Getting data across networks it has never seen, one hop at a time, with no single machine knowing the whole route.",
   peer:"The IP software on the destination computer.",
   note:"Routers, the devices that forward packets between networks, read only this layer and the one below it. They do not know that HTTP is inside."},
  {n:"L2",name:"Ethernet / Wi-Fi",unit:"frame",hdr:14,pay:131,
   adds:"MAC addresses (the hardware addresses of network cards) for <em>this hop only</em>, such as your laptop to the router next to you.",
   solves:"Moving bits between two devices that share one physical link.",
   peer:"The next device on the link. This header is rewritten at every hop.",
   note:"The IP addresses stay the same the whole way. The MAC addresses change at every router."},
  {n:"L1",name:"Physical",unit:"bits",hdr:0,pay:145,
   adds:"Nothing. The bits become voltage on copper, light in fiber, or radio waves.",
   solves:"Moving a 1 or a 0 across physical space.",
   peer:"The transceiver at the other end of the cable.",
   note:"Light in fiber travels about 200,000 km/s. Manila to Frankfurt and back is about 20,000 km, so the signal alone needs at least 100 ms. Real connections measure closer to 190 ms."}
];
function drawLayers(){
  $("#nest").innerHTML = LAYERS.map((l,i)=>{
    const tot=l.hdr+l.pay, hp=(l.hdr/tot*100).toFixed(1);
    return `<div class="lyr${i===0?" sel":""}" data-i="${i}">
      <div class="lyr-h">
        <span class="lyr-n">${l.n}</span>
        <span class="lyr-name">${l.name}</span>
        <span class="lyr-unit">${l.unit} · ${tot} B</span>
      </div>
      <div class="lyr-inner">
        <div class="lyr-bar">
          ${l.hdr?`<div class="hdr" style="width:${hp}%">+${l.hdr}B</div>`:""}
          <div class="pay" style="width:${100-hp}%">${l.hdr?(i===0?"app message":"everything above"):"the whole message, as bits"}</div>
        </div>
      </div></div>`;
  }).join("");
  $$(".lyr").forEach(el=>el.onclick=()=>{
    $$(".lyr").forEach(x=>x.classList.remove("sel"));
    el.classList.add("sel"); showLayer(+el.dataset.i);
  });
  showLayer(0);
}
function showLayer(i){
  const l=LAYERS[i], tot=l.hdr+l.pay;
  $("#lyrDetail").innerHTML=`
    <dt>Unit of transmission</dt><dd>One <code>${l.unit}</code>: ${tot} bytes in total, of which ${l.hdr} are this layer's own header.</dd>
    <dt>What this layer adds</dt><dd>${l.adds}</dd>
    <dt>Problem it solves</dt><dd>${l.solves}</dd>
    <dt>Who it talks to</dt><dd>${l.peer}</dd>
    <dt>Worth knowing</dt><dd>${l.note}</dd>`;
}
drawLayers();

