/* ================= 01 LAYERS ================= */
const LAYERS=[
  {n:"L7",name:"HTTP",unit:"message",hdr:38,pay:24,
   adds:"A request line, then <code>Header: value</code> pairs, a blank line, and an optional body.",
   solves:"Agreeing on what a request even <em>means</em>. Which resource, which verb, what format the answer should take.",
   peer:"The web server process (nginx, your Node/Python app).",
   note:"This is the only layer you normally write code against."},
  {n:"L6/5",name:"TLS",unit:"record",hdr:29,pay:62,
   adds:"A record header plus a message authentication tag. The payload is now ciphertext.",
   solves:"Anyone who can see the wire, the café router, the ISP, must not be able to read or alter the message.",
   peer:"The TLS stack on the server, holding the matching session key.",
   note:"The handshake that sets up these keys costs 1–2 extra round trips. That is why HTTPS 'feels' slower on first load."},
  {n:"L4",name:"TCP",unit:"segment",hdr:20,pay:91,
   adds:"Source and destination <em>ports</em>, a sequence number, an acknowledgement number, flags.",
   solves:"The network loses, duplicates, and reorders things. TCP numbers every byte and re-sends what was not acknowledged, so the app sees a clean ordered stream.",
   peer:"The TCP stack in the server's kernel, listening on port 443.",
   note:"Port 443 is how the kernel knows which of the hundred running programs gets this data."},
  {n:"L3",name:"IP",unit:"packet",hdr:20,pay:111,
   adds:"Source and destination IP addresses, plus a hop limit (TTL).",
   solves:"Getting the thing across networks it has never seen, hop by hop, with no single machine knowing the whole route.",
   peer:"The IP stack on the destination host.",
   note:"Routers only read this layer. They neither know nor care that it is HTTP inside."},
  {n:"L2",name:"Ethernet / Wi-Fi",unit:"frame",hdr:14,pay:131,
   adds:"MAC addresses of <em>this hop only</em>. Your laptop to the router next to you.",
   solves:"Moving bits between two devices that share one physical link.",
   peer:"The next device on the link. Rewritten at every single hop.",
   note:"The IP addresses stay the same the whole way. The MAC addresses change at every router."},
  {n:"L1",name:"Physical",unit:"bits",hdr:0,pay:145,
   adds:"Nothing. It becomes voltage on copper, light in fibre, or radio.",
   solves:"Actually moving a 1 or a 0 across physical space.",
   peer:"The transceiver at the other end of the cable.",
   note:"Speed of light in fibre is about 200,000 km/s. Manila to Frankfurt and back is roughly 190 ms of pure physics, before any equipment touches it."}
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
          ${l.hdr?`<div class="hdr" style="width:${hp}%">${hp<14?`+${l.hdr}B`:`+${l.hdr}B header`}</div>`:""}
          <div class="pay" style="width:${100-hp}%">${l.hdr?"everything above":"the whole thing, as bits"}</div>
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
    <dt>Unit of transmission</dt><dd>One <code>${l.unit}</code>, ${tot} bytes total, of which ${l.hdr} are this layer's own header.</dd>
    <dt>What this layer adds</dt><dd>${l.adds}</dd>
    <dt>Problem it solves</dt><dd>${l.solves}</dd>
    <dt>Who it talks to</dt><dd>${l.peer}</dd>
    <dt>The part that bites</dt><dd>${l.note}</dd>`;
}
drawLayers();

