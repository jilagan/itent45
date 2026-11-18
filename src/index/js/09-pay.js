/* ================= 07 CHECKOUT ================= */
const PARTIES=[
 {id:"pBrowser", n:"Party 1", h:"The browser", r:"the shopper's device",
  p:"Runs your code, on a device you do not control.", card:"sees the card", cls:"see-yes"},
 {id:"pApi", n:"Party 2", h:"Your API", r:"your server process",
  p:"Holds your order data and your secret key.", card:"never sees the card", cls:"see-no"},
 {id:"pGw", n:"Party 3", h:"Payment gateway", r:"PayMongo, Stripe, Xendit",
  p:"Carrying card data safely is their whole business.", card:"sees the card", cls:"see-yes"},
 {id:"pBank", n:"Party 4", h:"Bank / network", r:"outside your system",
  p:"Where money moves. Minutes to days.", card:"sees the card", cls:"see-yes"}
];
PARTIES.forEach(p=>{
  const el=$("#"+p.id); if(!el) return;
  el.innerHTML=`
    <div class="pn">${p.n}</div><h4>${p.h}</h4>
    <div class="prole">${p.r}</div><p>${p.p}</p>
    <span class="card-see ${p.cls}">${p.card}</span>`;
});

const PAYFLOW=[
 {k:"browser", hop:"Browser → your API", dir:"out", h:"The shopper loads their cart",
  x:"This is an ordinary request, like the ones in \"The actual bytes\". Nothing about payment yet.",
  l:"Nothing new in this step",
  a:`<span class="kw">GET</span> /api/cart HTTP/1.1
Cookie: sessionid=8f2a...

<span class="kw">200 OK</span>
{<span class="s">"items"</span>: [{<span class="s">"sku"</span>:<span class="s">"SHOE-42"</span>, <span class="s">"price"</span>: 129900}], <span class="s">"total"</span>: 129900}`},

 {k:"gateway", hop:"Browser → gateway (your server is not involved)", dir:"out", h:"The card goes straight to the gateway",
  x:"Many people get this step wrong. The card number never travels to your server. The browser sends it directly to the gateway, using a publishable key, which is a key that is safe to include in your page's JavaScript.",
  l:"Check the host name. It is not yours.",
  a:`<span class="kw">POST</span> https://api.gateway.com/v1/tokens
Authorization: Bearer <span class="s">pk_live_...</span>   <span class="c">// publishable key, safe to make public</span>

{<span class="s">"number"</span>: <span class="s">"4242 4242 4242 4242"</span>,
 <span class="s">"exp"</span>: <span class="s">"09/28"</span>, <span class="s">"cvc"</span>: <span class="s">"123"</span>}`},

 {k:"browser", hop:"Gateway → browser", dir:"in", h:"A token comes back",
  x:"The token is an opaque code that stands in for the card. On its own it is close to useless to a thief, because it can be used once and only your secret key can charge it.",
  l:"What your server will receive",
  a:`<span class="kw">201 Created</span>
{<span class="s">"id"</span>: <span class="s">"tok_1a2b3c"</span>, <span class="s">"last4"</span>: <span class="s">"4242"</span>, <span class="s">"brand"</span>: <span class="s">"visa"</span>}`},

 {k:"server", hop:"Browser → your API", dir:"out", h:"The order request reaches your server",
  x:"Now your server joins in. It receives the token and the cart, never the card. The request includes an idempotency key: the browser generated one UUID (a random unique code) for this checkout and resends the same one on every retry.",
  l:"The request your server code handles",
  a:`<span class="kw">POST</span> /api/orders HTTP/1.1
<span class="kw">Idempotency-Key</span>: 7c3f9e1a-4b8d-42f6-9c11-a2d5e8b7f014
Content-Type: application/json

{<span class="s">"token"</span>: <span class="s">"tok_1a2b3c"</span>, <span class="s">"cart_id"</span>: 5512}`},

 {k:"gateway", hop:"Your API → gateway", dir:"out", h:"Your server becomes the client",
  x:"Your API now does what the browser did in \"The actual bytes\": it builds a request, sets headers and waits for a response. The protocol and verbs are the same. The secret key never leaves your server.",
  l:"Sent from your server code",
  a:`<span class="kw">POST</span> https://api.gateway.com/v1/charges
Authorization: Bearer <span class="s">sk_live_...</span>   <span class="c">// secret key, server only</span>
<span class="kw">Idempotency-Key</span>: 7c3f9e1a-4b8d-42f6-9c11-a2d5e8b7f014

{<span class="s">"amount"</span>: 129900, <span class="s">"currency"</span>: <span class="s">"PHP"</span>, <span class="s">"source"</span>: <span class="s">"tok_1a2b3c"</span>}`},

 {k:"gateway", hop:"Gateway → your API", dir:"in", h:"Pending, not paid",
  x:"Cards are authorized in about a second. GCash, Maya and over-the-counter payments can take minutes or hours. Treating this response as final is one of the most common bugs in student e-commerce projects.",
  l:"Read the status field.",
  a:`<span class="kw">200 OK</span>
{<span class="s">"id"</span>: <span class="s">"ch_9f8e7d"</span>, <span class="s">"status"</span>: <span class="s">"pending"</span>, <span class="s">"amount"</span>: 129900}`},

 {k:"browser", hop:"Your API → browser", dir:"in", h:"You answer the shopper",
  x:"You created an order, so you return 201 with a Location header, as described in \"HTTP verbs, URLs and status codes (REST)\". The status says awaiting payment, which is accurate.",
  l:"Back to the shopper",
  a:`<span class="kw">201 Created</span>
Location: /api/orders/8891

{<span class="s">"id"</span>: 8891, <span class="s">"status"</span>: <span class="s">"awaiting_payment"</span>}`},

 {k:"bank", hop:"Gateway → bank (outside your system)", dir:"out", h:"Settlement happens out of your sight",
  x:"The gateway now moves real money through the banking system. This is why step 6 said pending: cards are authorized in about a second, but e-wallets and over-the-counter payments can take minutes or hours, and none of it is under your control.",
  l:"You cannot see this part",
  a:`<span class="c">gateway → acquiring bank → card network → issuing bank</span>\n<span class="c">Seconds for cards. Minutes to days for everything else.</span>\n\n<span class="c">Your server is not waiting for this. It already replied.</span>`},
 {k:"server", hop:"Gateway → your API (roles reversed)", dir:"out", h:"The gateway calls your server",
  x:"Minutes later, settlement completes and the gateway sends a request to an endpoint you published. This is called a webhook. Your API is the server in this exchange and the gateway is the client. Anyone on the internet can also send requests to this URL, so the signature matters.",
  l:"The webhook, and the header that protects it",
  a:`<span class="kw">POST</span> /webhooks/payments HTTP/1.1
<span class="kw">Gateway-Signature</span>: t=1723,v1=5f2c8a91b...

{<span class="s">"type"</span>: <span class="s">"charge.succeeded"</span>, <span class="s">"data"</span>: {<span class="s">"id"</span>: <span class="s">"ch_9f8e7d"</span>}}`},

 {k:"server", hop:"Inside your API", dir:"out", h:"Verify, then mark the order paid",
  x:"Recompute the signature with your webhook secret and compare it with the one in the header. Only then update the order. If you skip this check, anyone can mark their own order paid by sending a forged request.",
  l:"The check that must be there",
  a:`expected = hmac_sha256(webhook_secret, raw_body)
<span class="kw">if</span> not compare_digest(expected, header_sig):
    <span class="kw">return</span> HttpResponse(status=<span class="s">400</span>)   <span class="c"># forged</span>

order.status = <span class="s">"paid"</span>
order.save()`}
];
let pyI=0, pyTimer=null;

/* which box the payload is at after each step, and which pipe carried it */
const PAY_AT = ["pApi","pGw","pBrowser","pApi","pGw","pApi","pBrowser","pBank","pApi","pApi"];
const PAY_SEG = [
 {lane:"A",dir:"fwd", p:"GET /api/cart"},
 {lane:"X",dir:"fwd", p:"card number"},          // bypass, browser -> gateway
 {lane:"X",dir:"back",p:"tok_1a2b3c"},           // bypass, gateway -> browser
 {lane:"A",dir:"fwd", p:"token + idempotency key"},
 {lane:"B",dir:"fwd", p:"charge tok_1a2b3c"},
 {lane:"B",dir:"back",p:"status: pending"},
 {lane:"A",dir:"back",p:"201 awaiting_payment"},
 {lane:"C",dir:"fwd", p:"settle \u20b11,299"},
 {lane:"C",dir:"back",p:"charge.succeeded"},
 null
];
function layoutBypass(){
  const flow=$("#pflow"), bp=$("#bypass");
  if(!flow||!bp) return;
  const fb=flow.getBoundingClientRect();
  const a=$("#pBrowser").getBoundingClientRect(), b=$("#pGw").getBoundingClientRect();
  if(pflowStacked()){ bp.style.display="none"; return; }
  bp.style.display="block";
  const x1=a.left-fb.left+a.width/2, x2=b.left-fb.left+b.width/2;
  bp.style.left=x1+"px"; bp.style.width=(x2-x1)+"px";
  bp.style.top=(a.bottom-fb.top+26)+"px";
}
// below ~1020px the grid collapses to one column, so every box shares a centre x
function pflowStacked(){
  const a=$("#pBrowser").getBoundingClientRect(), b=$("#pBank").getBoundingClientRect();
  return Math.abs((a.left+a.width/2)-(b.left+b.width/2)) < 20;
}
function placePayBall(i){
  const flow=$("#pflow"), ball=$("#payBall");
  if(!flow||!ball) return;
  const fb=flow.getBoundingClientRect();
  const seg=PAY_SEG[i];
  const target=$("#"+(PAY_AT[i]||"pApi")).getBoundingClientRect();
  ball.style.left=(target.left-fb.left+target.width/2)+"px";
  if(pflowStacked()){
    // stacked: ride the right edge of whichever box currently holds the payload
    ball.style.left=(target.right-fb.left-14)+"px";
    ball.style.top =(target.top-fb.top+target.height/2)+"px";
  } else if(seg && seg.lane==="X"){          // riding the bypass
    ball.style.top=(parseFloat($("#bypass").style.top)||0)+"px";
  } else {
    const back = seg && seg.dir==="back";
    ball.style.top=($(back?"#prailAb":"#prailAf").getBoundingClientRect().top-fb.top+1)+"px";
  }
  ball.classList.toggle("res", !!(seg && seg.dir==="back"));
}
function renderPay(){
  const s=PAYFLOW[pyI];
  $("#pyStep").textContent=`Step ${pyI+1} of ${PAYFLOW.length}`;
  const hop=$("#pyHop"); hop.textContent=s.hop; hop.className="hop "+s.dir;
  $("#pyTitle").textContent=s.h;
  $("#pyText").textContent=s.x;
  $("#pyLbl").textContent=s.l;
  $("#pyArt").innerHTML=s.a;
  const hereId = PAY_AT[pyI] || "pApi";
  $$("#pflow .pty").forEach(el=>el.classList.toggle("lit", el.id===hereId));

  ["prailAf","prailAb","prailBf","prailBb","prailCf","prailCb"]
    .forEach(id=>$("#"+id).classList.remove("on-req","on-res"));
  ["pcapA","pcapB","pcapC"].forEach(id=>{const c=$("#"+id);c.className="pcap";c.textContent=""});
  $("#bypass").classList.remove("on");

  layoutBypass();
  const seg=PAY_SEG[pyI];
  if(seg){
    if(seg.lane==="X"){
      $("#bypass").classList.add("on");
    } else {
      const fwd=seg.dir==="fwd";
      $("#prail"+seg.lane+(fwd?"f":"b")).classList.add(fwd?"on-req":"on-res");
      const cap=$("#pcap"+seg.lane);
      cap.className="pcap on "+(fwd?"req":"res");
      cap.textContent=seg.p;
    }
  }
  placePayBall(pyI);
}
addEventListener("resize",()=>{ if($(".panel.on")?.id==="p-pay"){ layoutBypass(); placePayBall(pyI); } });

$("#pyNext").onclick=()=>{clearInterval(pyTimer);pyI=Math.min(PAYFLOW.length-1,pyI+1);renderPay()};
$("#pyPrev").onclick=()=>{clearInterval(pyTimer);pyI=Math.max(0,pyI-1);renderPay()};
$("#pyRst").onclick=()=>{clearInterval(pyTimer);pyI=0;renderPay();$("#pyPlay").dataset.on="";$("#pyPlay").textContent="▶ Play flow"};
$("#pyPlay").onclick=e=>{
  clearInterval(pyTimer);
  if(e.target.dataset.on==="1"){e.target.dataset.on="";e.target.textContent="▶ Play flow";return}
  e.target.dataset.on="1"; e.target.textContent="❚❚ Pause";
  pyTimer=setInterval(()=>{
    if(pyI>=PAYFLOW.length-1){clearInterval(pyTimer);$("#pyPlay").dataset.on="";$("#pyPlay").textContent="▶ Play flow";return}
    pyI++; renderPay();
  }, REDUCED?900:3000);
};
renderPay();

/* ---- the same charge request, three ways ---- */
const CHG_DATA=37;
const WHYF=[
 {id:"json", n:"JSON", bytes:91,
  body:`{<span class="s">"amount"</span>:129900,<span class="s">"currency"</span>:<span class="s">"PHP"</span>,
 <span class="s">"source"</span>:<span class="s">"tok_1a2b3c"</span>,
 <span class="s">"description"</span>:<span class="s">"ITENT 45 enrolment"</span>}`,
  cls:"ok",
  v:`<b>91 bytes, and it already matches the data structures that programs use</b>Python code reads <code>data["amount"]</code> and Node code reads <code>data.amount</code>, and neither side has to convert it first. "Layers &amp; envelopes" showed that a reply this size travels with 54 bytes of headers, so the packaging already costs more than the message. Making the message six times larger would be a real cost.`},
 {id:"soap", n:"SOAP / XML", bytes:557,
  body:`<span class="d">&lt;?xml version="1.0" encoding="UTF-8"?&gt;</span>
<span class="d">&lt;soap:Envelope xmlns:soap=</span><span class="s">"http://schemas.xmlsoap.org/soap/envelope/"</span>
<span class="d">               xmlns:pay=</span><span class="s">"https://gateway.example.com/schema/payments/v2"</span><span class="d">&gt;</span>
  <span class="d">&lt;soap:Header&gt;</span>
    <span class="d">&lt;pay:Credentials&gt;&lt;pay:MerchantId&gt;</span>M-4471<span class="d">&lt;/pay:MerchantId&gt;&lt;/pay:Credentials&gt;</span>
  <span class="d">&lt;/soap:Header&gt;</span>
  <span class="d">&lt;soap:Body&gt;</span>
    <span class="d">&lt;pay:CreateChargeRequest&gt;</span>
      <span class="d">&lt;pay:Amount currency=</span><span class="s">"PHP"</span><span class="d">&gt;</span>129900<span class="d">&lt;/pay:Amount&gt;</span>
      <span class="d">&lt;pay:Source&gt;</span>tok_1a2b3c<span class="d">&lt;/pay:Source&gt;</span>
      <span class="d">&lt;pay:Description&gt;</span>ITENT 45 enrolment<span class="d">&lt;/pay:Description&gt;</span>
    <span class="d">&lt;/pay:CreateChargeRequest&gt;</span>
  <span class="d">&lt;/soap:Body&gt;</span>
<span class="d">&lt;/soap:Envelope&gt;</span>`,
  cls:"warn",
  v:`<b>557 bytes, six times the size of JSON</b>Only 7% of it is the four values you meant to send. The rest is namespaces, an envelope and a header block. In return you get a contract that a machine can enforce: a schema can reject a negative amount or an invalid currency before your code runs, and the document can be signed as a document. Between two banks that is a fair trade. For a mobile app fetching a course list it is six times the data for no benefit.`},
 {id:"html", n:"HTML", bytes:318,
  body:`<span class="d">&lt;form method=</span><span class="s">"post"</span><span class="d"> action=</span><span class="s">"/charges"</span><span class="d">&gt;</span>
  <span class="d">&lt;input type=</span><span class="s">"hidden"</span><span class="d"> name=</span><span class="s">"amount"</span><span class="d"> value=</span><span class="s">"129900"</span><span class="d">&gt;</span>
  <span class="d">&lt;input type=</span><span class="s">"hidden"</span><span class="d"> name=</span><span class="s">"currency"</span><span class="d"> value=</span><span class="s">"PHP"</span><span class="d">&gt;</span>
  <span class="d">&lt;input type=</span><span class="s">"hidden"</span><span class="d"> name=</span><span class="s">"source"</span><span class="d"> value=</span><span class="s">"tok_1a2b3c"</span><span class="d">&gt;</span>
  <span class="d">&lt;button type=</span><span class="s">"submit"</span><span class="d">&gt;</span>Charge<span class="d">&lt;/button&gt;</span>
<span class="d">&lt;/form&gt;</span>`,
  cls:"bad",
  v:`<b>318 bytes, and the wrong kind of message</b>HTML does not state facts. It describes a form that a person could click, so the gateway would have to read the markup and guess which fields matter. Now consider step 9, where the gateway sends <em>you</em> a webhook. The gateway has never seen your interface, so it has nothing to display. The only thing it can send is data. The server-rendered example in "One API for the web, iOS and Android" is the same mistake, made by a system that worked for twenty years because it only ever had one client.`}
];
let whySel="json";
function renderWhy(){
  $("#whyPick").innerHTML=WHYF.map(f=>
    `<button data-f="${f.id}" aria-pressed="${f.id===whySel}">${f.n}</button>`).join("");
  $$("#whyPick button").forEach(el=>el.onclick=()=>{whySel=el.dataset.f;renderWhy()});
  const f=WHYF.find(x=>x.id===whySel);
  $("#whyBody").innerHTML=f.body;
  const max=Math.max(...WHYF.map(x=>x.bytes));
  $("#whyBars").innerHTML=WHYF.map(x=>{
    const w=x.bytes/max*100, d=CHG_DATA/x.bytes*100;
    return `<div class="sb${x.id===whySel?" sel":""}">
      <span class="nm">${x.n}</span>
      <div class="lane"><div class="bar" style="width:${w}%">
        <i class="data" style="width:${d}%"></i><i class="over" style="width:${100-d}%"></i>
      </div></div>
      <span class="amt">${x.bytes} B</span></div>`;
  }).join("");
  $("#whyVerdict").className="verdict "+f.cls;
  $("#whyVerdict").innerHTML=f.v;
}
renderWhy();

/* ---- double-charge demo ---- */
const PRICE=1299;
let attempts=[], idemOn=false, idemKey="7c3f9e1a", firstCharge=null, chgSeq=0;
function renderCharges(){
  $("#chgList").innerHTML = attempts.length ? attempts.map((a,i)=>`
    <div class="chg ${a.reused?"reuse":(i>0?"dup":"")}">
      <span>click ${i+1}</span>
      <span class="cid">${a.id}</span>
      <span>${a.reused?"same charge":"₱"+PRICE.toLocaleString()+" charged"}</span>
    </div>`).join("")
    : `<div style="font-size:.78em;color:var(--faint);padding:10px 2px">No attempts yet. Press Pay.</div>`;
  const charged = attempts.filter(a=>!a.reused).length*PRICE;
  $("#chgAmt").textContent="₱"+charged.toLocaleString();
  const t=$("#chgTotal");
  t.className="total"+(charged>PRICE?" bad":charged>0?" good":"");

  $("#idemArt").innerHTML = idemOn
    ? `<span class="kw">POST</span> /api/orders
<span class="kw">Idempotency-Key</span>: ${idemKey}-4b8d-42f6-9c11`
    : `<span class="kw">POST</span> /api/orders
<span class="c">// no idempotency key sent</span>`;

  const n=$("#idemNote");
  if(!attempts.length){
    n.innerHTML= idemOn
      ? "The key is generated once, when the checkout page loads, and not on each click."
      : "Press Pay a few times, as an impatient shopper on a slow connection would.";
  } else if(charged>PRICE){
    n.innerHTML=`<b style="color:var(--warn)">${attempts.length} clicks, ${attempts.filter(a=>!a.reused).length} separate charges.</b> The shopper paid ₱${charged.toLocaleString()} for a ₱${PRICE.toLocaleString()} pair of shoes. Every click was a valid POST, and the server did what it was told each time. Reading your own code will not reveal a bug here.`;
  } else if(idemOn && attempts.length>1){
    n.innerHTML=`<b style="color:var(--res)">${attempts.length} clicks, one charge.</b> The gateway recognized the repeated key and returned the original charge without creating a new one. Real payment APIs use this method to prevent double charges.`;
  } else {
    n.innerHTML="One click, one charge. Press it again a few times and watch what happens.";
  }
}
$("#payGo").onclick=()=>{
  if(idemOn && firstCharge){ attempts.push({id:firstCharge, reused:true}); }
  else { chgSeq++; const id="ch_"+Math.random().toString(36).slice(2,8);
         if(idemOn && !firstCharge) firstCharge=id;
         attempts.push({id, reused:false}); }
  renderCharges();
};
$("#payReset").onclick=()=>{
  attempts=[]; firstCharge=null;
  idemKey=Math.random().toString(16).slice(2,10);
  renderCharges();
};
$("#tgIdem").onclick=()=>{
  idemOn=!idemOn; $("#tgIdem").setAttribute("aria-pressed",idemOn);
  attempts=[]; firstCharge=null; renderCharges();
};
renderCharges();

