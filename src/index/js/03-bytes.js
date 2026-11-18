/* ================= 03 BYTES ================= */
const SCN={
  get:{
    req:[
      ["GET /courses?sem=1 HTTP/1.1","start","Request line","The first line has three parts separated by spaces: the <em>method</em> (GET means read something and change nothing), the <em>path</em> with its query string (the part after the ?, here <code>sem=1</code>), and the protocol version. Every line after this one adds detail about the request."],
      ["Host: api.example.com","k","Host header","Required in HTTP/1.1. One IP address can serve hundreds of websites, so the request has to say which one you want. This is what makes shared hosting possible."],
      ["User-Agent: Mozilla/5.0","k","User-Agent","A free-text description of the client program. Servers use it for statistics and to decide which files to send. Anyone can fake it, so never trust it for anything that matters."],
      ["Accept: application/json","k","Accept","The client says which formats it can read, and the server picks one. The same URL can return JSON (a text format for data) to an app and HTML (the page format) to a browser."],
      ["Accept-Encoding: gzip, br","k","Accept-Encoding","The client says it can decompress, meaning unpack, the reply. If the server agrees, the body is sent 60 to 80 percent smaller. Compressing takes processing time on both ends and saves transfer time."],
      ["Connection: keep-alive","k","Connection","Do not close the connection after this response, because more requests are coming. This avoids paying the setup cost again on the next request."],
      ["","blank","The blank line","A single empty line marks the end of the headers. Everything after it is the body. Without it, the server could not tell where the headers stop."]
    ],
    res:[
      ["HTTP/1.1 200 OK","start","Status line","The first line holds the protocol version, a three-digit status code and a short reason in words. Codes starting with 2 mean success, 3 means go somewhere else, 4 means the request was wrong, and 5 means the server failed."],
      ["Content-Type: application/json; charset=utf-8","k","Content-Type","How to interpret the bytes in the body. If this is wrong, the browser may show your JSON as plain text or try to run it. The charset (character set) matters for any text beyond basic English letters."],
      ["Content-Length: 51","k","Content-Length","How many bytes of body follow. This tells the client the response is complete without waiting for the connection to close."],
      ["Cache-Control: max-age=60","k","Cache-Control","Permission to reuse this answer for 60 seconds without asking again. A reused answer saves a whole round trip."],
      ["","blank","The blank line","The same marker as in the request. The headers end and the body begins."],
      ['{"sem":1,"courses":[{"code":"ITENT 45","units":3}]}',"body","Response body","The data itself. It has exactly the number of bytes promised by Content-Length, in the format promised by Content-Type. Nothing special marks it. It is the remaining bytes."]
    ]},
  post:{
    req:[
      ["POST /enrollments HTTP/1.1","start","Request line","POST means create or submit. The request has side effects, so repeating it may create a second enrollment. Buttons are often disabled after the first click to prevent this."],
      ["Host: api.example.com","k","Host header","Same role as before: which website on this IP address."],
      ["Content-Type: application/json","k","Content-Type on a request","Describes the format of the data you are sending. The server needs this to read the body correctly."],
      ["Content-Length: 41","k","Content-Length","Tells the server how many bytes of body to read. If it reads fewer, it waits forever. If it reads more, it consumes part of the next request."],
      ["Authorization: Bearer eyJhbGciOi...","k","Authorization","Proof of who you are. The text after Bearer is a token, a long random string that the server issued at login. Anyone who holds it can act as you, so it must only travel over TLS (encrypted connections)."],
      ["","blank","The blank line","The headers end here."],
      ['{"studentId":"20-1234","code":"ITENT 45"}',"body","Request body","The data being submitted. It travels after the headers and is not part of the URL, so it does not appear in server logs or browser history the way a query string does."]
    ],
    res:[
      ["HTTP/1.1 201 Created","start","201 Created","A new resource now exists on the server. The client should not send this request again, because doing so would create a duplicate."],
      ["Location: /enrollments/8891","k","Location","Where the new resource lives. The client can follow this address to fetch it. The server is returning the ID it assigned."],
      ["Content-Type: application/json","k","Content-Type","The format of the confirmation in the body below."],
      ["Content-Length: 49","k","Content-Length","The number of bytes in the body."],
      ["","blank","The blank line","The headers end here."],
      ['{"id":8891,"code":"ITENT 45","status":"enrolled"}',"body","Response body","A confirmation that includes the ID the server assigned. Returning the created object saves the client a second round trip to fetch it."]
    ]},
  miss:{
    req:[
      ["GET /courses/ITENT99 HTTP/1.1","start","Request line","A correctly formed request. The syntax is valid and the connection worked. The request asks for something that does not exist."],
      ["Host: api.example.com","k","Host header","Which website on this IP address."],
      ["Accept: application/json","k","Accept","The client wants JSON back, including for errors. A well-built server honors this and does not return an HTML error page."],
      ["","blank","The blank line","The headers end here."]
    ],
    res:[
      ["HTTP/1.1 404 Not Found","start","404 Not Found","A 4xx code means the request was wrong. The server understood the request and is working normally. The named resource is not there. A 500 code means the server's own code crashed."],
      ["Content-Type: application/json","k","Content-Type","The error is still JSON, because the client asked for JSON. An HTML error page here would break the client's JSON parser, the code that reads JSON."],
      ["Content-Length: 50","k","Content-Length","Error responses have a body and a byte count like any other response."],
      ["","blank","The blank line","The headers end here."],
      ['{"error":"not_found","detail":"No course ITENT99"}',"body","Error body","A machine-readable code and a human-readable detail. The client program acts on the code. The developer reads the detail."]
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
    $("#explain").innerHTML=`<div class="et">${esc(row[2])}</div><p>${row[3]}</p>`;
  });
  $("#explain").innerHTML=`<div class="et">Select a line</div><p class="hint">Click any highlighted part of the request or response above.</p>`;
}
$$("[data-scn]").forEach(b=>b.onclick=()=>{
  $$("[data-scn]").forEach(x=>x.setAttribute("aria-pressed",x===b));
  scn=b.dataset.scn; renderBytes();
});
renderBytes();

