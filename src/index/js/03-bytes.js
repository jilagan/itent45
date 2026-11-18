/* ================= 03 BYTES ================= */
const SCN={
  get:{
    req:[
      ["GET /courses?sem=1 HTTP/1.1","start","Request line","The method (GET means read something and change nothing), the path with its query string (the part after the ?), and the protocol version. Every later line adds detail."],
      ["Host: api.example.com","k","Host header","One IP address can serve hundreds of websites, so the request says which one you want."],
      ["Accept: application/json","k","Accept","The client says which formats it can read. The same address can return JSON (a text format for data) to an app and HTML (the page format) to a browser."],
      ["","blank","The blank line","A single empty line marks the end of the headers. Everything after it is the body."]
    ],
    res:[
      ["HTTP/1.1 200 OK","start","Status line","The protocol version, a three-digit status code and a short reason. Codes starting with 2 mean success, 3 means go somewhere else, 4 means the request was wrong, and 5 means the server failed."],
      ["Content-Type: application/json; charset=utf-8","k","Content-Type","How to interpret the bytes in the body. If this is wrong, the browser may show your JSON as plain text."],
      ["Content-Length: 51","k","Content-Length","How many bytes of body follow. The client knows the response is complete without waiting for the connection to close."],
      ["","blank","The blank line","The same marker as in the request. The headers end and the body begins."],
      ['{"sem":1,"courses":[{"code":"ITENT 45","units":3}]}',"body","Response body","The data itself, with exactly the number of bytes promised by Content-Length."]
    ]},
  post:{
    req:[
      ["POST /enrollments HTTP/1.1","start","Request line","POST means create or submit, so repeating it may create a second enrollment. Buttons are often disabled after the first click for this reason."],
      ["Host: api.example.com","k","Host header","Which website on this IP address, as before."],
      ["Content-Type: application/json","k","Content-Type on a request","The format of the data you are sending. The server needs it to read the body."],
      ["Content-Length: 41","k","Content-Length","How many bytes of body the server should read. With the wrong number, it waits forever or reads into the next request."],
      ["","blank","The blank line","The headers end here."],
      ['{"studentId":"20-1234","code":"ITENT 45"}',"body","Request body","The data being submitted. It is not part of the address, so it stays out of server logs and browser history."]
    ],
    res:[
      ["HTTP/1.1 201 Created","start","201 Created","A new resource now exists on the server. The client should not send this request again, because that would create a duplicate."],
      ["Location: /enrollments/8891","k","Location","Where the new resource lives. The server returns the ID it assigned, and the client can follow this address to fetch it."],
      ["Content-Type: application/json","k","Content-Type","The format of the confirmation in the body below."],
      ["","blank","The blank line","The headers end here."],
      ['{"id":8891,"code":"ITENT 45","status":"enrolled"}',"body","Response body","A confirmation that includes the new ID. This saves the client a second round trip to fetch it."]
    ]},
  miss:{
    req:[
      ["GET /courses/ITENT99 HTTP/1.1","start","Request line","A correctly formed request for something that does not exist. The syntax is valid and the connection worked."],
      ["Host: api.example.com","k","Host header","Which website on this IP address."],
      ["Accept: application/json","k","Accept","The client wants JSON back, including for errors."],
      ["","blank","The blank line","The headers end here."]
    ],
    res:[
      ["HTTP/1.1 404 Not Found","start","404 Not Found","A 4xx code means the request was wrong. The server understood it and works normally, and the named resource is not there. A 500 code means the server's own code crashed."],
      ["Content-Type: application/json","k","Content-Type","The error is still JSON, because the client asked for JSON. An HTML error page would break the code that reads JSON."],
      ["Content-Length: 50","k","Content-Length","Error responses have a body and a byte count like any other response."],
      ["","blank","The blank line","The headers end here."],
      ['{"error":"not_found","detail":"No course ITENT99"}',"body","Error body","A machine-readable code and a human-readable detail. The client program acts on the code, and the developer reads the detail."]
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
  $("#explain").innerHTML=`<div class="et">Select a line</div><p class="hint">Click any highlighted part of the request or response.</p>`;
}
$$("[data-scn]").forEach(b=>b.onclick=()=>{
  $$("[data-scn]").forEach(x=>x.setAttribute("aria-pressed",x===b));
  scn=b.dataset.scn; renderBytes();
});
renderBytes();

