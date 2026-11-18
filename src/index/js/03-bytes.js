/* ================= 03 BYTES ================= */
const SCN={
  get:{
    req:[
      ["GET /courses?sem=1 HTTP/1.1","start","Request line","Three things separated by spaces: the <em>method</em> (GET, read something, change nothing), the <em>path</em> including the query string, and the protocol version. Everything after this line is metadata."],
      ["Host: api.example.com","k","Host header","Mandatory in HTTP/1.1. One IP address may serve hundreds of sites, so the server needs to be told which one you meant. This is what makes shared hosting possible."],
      ["User-Agent: Mozilla/5.0","k","User-Agent","Free-text description of the client. Servers use it for analytics and for serving different assets. It is trivially forgeable, never trust it for anything that matters."],
      ["Accept: application/json","k","Accept","Content negotiation. The client states what formats it can handle; the server picks one. The same URL can return JSON to your app and HTML to a browser."],
      ["Accept-Encoding: gzip, br","k","Accept-Encoding","The client is saying it can decompress. If the server honours it, the body goes over the wire 60–80% smaller. Costs CPU on both ends to save bandwidth."],
      ["Connection: keep-alive","k","Connection","Do not close the TCP socket after this response, more requests are coming. This is what avoids paying the handshake cost again on the next call."],
      ["","blank","The blank line","A single empty line marks the end of the headers. Everything after it is the body. Without this delimiter the server would not know where headers stop."]
    ],
    res:[
      ["HTTP/1.1 200 OK","start","Status line","Protocol version, a three-digit status code, and a human-readable reason. 2xx worked, 3xx go elsewhere, 4xx you made a mistake, 5xx the server made a mistake."],
      ["Content-Type: application/json; charset=utf-8","k","Content-Type","How to interpret the bytes in the body. Get this wrong and the browser renders your JSON as plain text, or tries to execute it. The charset matters for anything non-ASCII."],
      ["Content-Length: 51","k","Content-Length","Exactly how many bytes of body follow. This is how the client knows the response is complete without waiting for the socket to close."],
      ["Cache-Control: max-age=60","k","Cache-Control","Permission to reuse this answer for 60 seconds without asking again. The cheapest request is the one never sent."],
      ["","blank","The blank line","Same delimiter as the request. Headers end, body begins."],
      ['{"sem":1,"courses":[{"code":"ITENT 45","units":3}]}',"body","Response body","The payload. Exactly the number of bytes promised by Content-Length, in the format promised by Content-Type. Nothing here is special. It is just the remaining bytes on the socket."]
    ]},
  post:{
    req:[
      ["POST /enrollments HTTP/1.1","start","Request line","POST means create or submit. This request has side effects. Repeating it may create a second enrollment. Buttons get disabled after the first click for that reason."],
      ["Host: api.example.com","k","Host header","Same role as before: which site on this IP."],
      ["Content-Type: application/json","k","Content-Type on a request","Describes the format of what <em>you</em> are sending up. The server needs this to know how to parse the body."],
      ["Content-Length: 41","k","Content-Length","Tells the server how many body bytes to read from the socket. Read fewer and you hang; read more and you eat the next request."],
      ["Authorization: Bearer eyJhbGciOi...","k","Authorization","Proof of who you are. Everything after 'Bearer' is an opaque token the server issued at login. Anyone holding it can act as you. Which is why this must only travel over TLS."],
      ["","blank","The blank line","Headers end here."],
      ['{"studentId":"20-1234","code":"ITENT 45"}',"body","Request body","The data being submitted. Unlike a query string, this is not in the URL, so it does not land in server logs or browser history."]
    ],
    res:[
      ["HTTP/1.1 201 Created","start","201 Created","Not just 'it worked'. A new resource now exists. The client should not resend this request; doing so would create a duplicate."],
      ["Location: /enrollments/8891","k","Location","Where the newly created thing lives. The client can follow this to fetch it. This is the server handing back the ID it just assigned."],
      ["Content-Type: application/json","k","Content-Type","Format of the confirmation body below."],
      ["Content-Length: 49","k","Content-Length","Byte count of the body."],
      ["","blank","The blank line","Headers end here."],
      ['{"id":8891,"code":"ITENT 45","status":"enrolled"}',"body","Response body","Confirmation, including the server-assigned id. Returning the created object saves the client a second round trip to go fetch it."]
    ]},
  miss:{
    req:[
      ["GET /courses/ITENT99 HTTP/1.1","start","Request line","A perfectly well-formed request. Nothing about it is wrong. The syntax is valid, the connection worked. It just names something that does not exist."],
      ["Host: api.example.com","k","Host header","Which site on this IP."],
      ["Accept: application/json","k","Accept","Client wants JSON back, including for errors. A well-built API honours this and does not suddenly return an HTML error page."],
      ["","blank","The blank line","Headers end here."]
    ],
    res:[
      ["HTTP/1.1 404 Not Found","start","404 Not Found","4xx means the client is at fault. The request was understood and the server is working fine. The named resource simply is not there. Compare with 500, which means your code crashed."],
      ["Content-Type: application/json","k","Content-Type","The error is still JSON, because the client asked for JSON. Returning an HTML error page here would break the client's parser."],
      ["Content-Length: 50","k","Content-Length","Errors have bodies and byte counts like any other response."],
      ["","blank","The blank line","Headers end here."],
      ['{"error":"not_found","detail":"No course ITENT99"}',"body","Error body","A machine-readable code plus a human-readable detail. The client branches on the code; the developer reads the detail."]
    ]}
};
let scn="get";
function esc(s){return s.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]))}
function renderBytes(){
  const d=SCN[scn];
  const build=(rows,side)=>rows.map((r,i)=>{
    const [txt,kind]=r;
    if(kind==="blank") return `<span class="seg mt" data-s="${side}" data-i="${i}">↵ (blank line)</span>`;
    let html=esc(txt);
    if(kind==="k"){const c=txt.indexOf(":");html=`<span class="k">${esc(txt.slice(0,c+1))}</span><span class="v">${esc(txt.slice(c+1))}</span>`}
    if(kind==="start") html=`<span class="v">${esc(txt)}</span>`;
    if(kind==="body")  html=`<span class="b">${esc(txt)}</span>`;
    return `<span class="seg" data-s="${side}" data-i="${i}">${html}</span>`;
  }).join("\n");
  $("#rawReq").innerHTML=build(d.req,"req");
  $("#rawRes").innerHTML=build(d.res,"res");
  $$(".raw .seg").forEach(el=>el.onclick=()=>{
    $$(".raw .seg").forEach(x=>x.classList.remove("on"));
    el.classList.add("on");
    const row=SCN[scn][el.dataset.s][+el.dataset.i];
    $("#explain").innerHTML=`<div class="et">${esc(row[2]).toUpperCase()}</div><p>${row[3]}</p>`;
  });
  $("#explain").innerHTML=`<div class="et">SELECT A LINE</div><p class="hint">Click any highlighted part of the request or response above.</p>`;
}
$$("[data-scn]").forEach(b=>b.onclick=()=>{
  $$("[data-scn]").forEach(x=>x.setAttribute("aria-pressed",x===b));
  scn=b.dataset.scn; renderBytes();
});
renderBytes();

