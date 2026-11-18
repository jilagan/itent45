/* ================= 06 CLIENTS ================= */
const SHARED_RES = `<span class="kw">HTTP/1.1 200 OK</span>
Content-Type: application/json
Content-Length: 118

{<span class="s">"courses"</span>: [
  {<span class="s">"code"</span>: <span class="s">"ITENT 45"</span>, <span class="s">"units"</span>: 3, <span class="s">"slots"</span>: 4},
  {<span class="s">"code"</span>: <span class="s">"CSCI 21"</span>,  <span class="s">"units"</span>: 3, <span class="s">"slots"</span>: 0}
]}`;

const CLIENTS=[
 {id:"web", n:"Web browser", s:"Runs in a browser on a laptop",
  req:`<span class="kw">GET</span> /api/courses HTTP/1.1
Host: enlist.university.edu
Accept: application/json
<span class="kw">Cookie</span>: sessionid=8f2a91c4...
User-Agent: Mozilla/5.0 (Macintosh...)`,
  code:`<span class="kw">const</span> r = <span class="kw">await</span> fetch(<span class="s">"/api/courses"</span>, {
  credentials: <span class="s">"include"</span>   <span class="c">// sends the cookie with the request</span>
});
<span class="kw">const</span> { courses } = <span class="kw">await</span> r.json();`,
  render:`&lt;ul&gt;
  {courses.map(c =&gt;
    &lt;li key={c.code}&gt;{c.code} &amp;middot; {c.units}u&lt;/li&gt;
  )}
&lt;/ul&gt;`,
  note:"The browser attaches the session cookie by itself. The server set the cookie at login and the browser has stored it since then, so you never wrote code to send it. The same convenience is why cookies need protection against CSRF (cross-site request forgery): the browser also attaches them to a request that another website triggers.",
  cons:["Stable network","Large screen","You control every deploy","Cookie login, automatic"]},

 {id:"ios", n:"iOS app", s:"Native app written in Swift",
  req:`<span class="kw">GET</span> /api/courses HTTP/1.1
Host: enlist.university.edu
Accept: application/json
<span class="kw">Authorization</span>: Bearer eyJhbGciOiJIUzI1...
User-Agent: EnlistMobile/2.1 (iOS 17.4)`,
  code:`<span class="kw">var</span> req = URLRequest(url: url)
req.setValue(<span class="s">"Bearer \\(token)"</span>,
   forHTTPHeaderField: <span class="s">"Authorization"</span>)
<span class="kw">let</span> (data, _) = <span class="kw">try await</span> URLSession.shared.data(<span class="kw">for</span>: req)
<span class="kw">let</span> result = <span class="kw">try</span> JSONDecoder().decode(CourseList.self, from: data)`,
  render:`List(result.courses, id: \\.code) { c <span class="kw">in</span>
    HStack {
        Text(c.code)
        Spacer()
        Text(<span class="s">"\\(c.units)u"</span>)
    }
}`,
  note:"A native app is built for one phone system. This app has no cookie storage, so it keeps a token (a long code that proves who the user is) in the Keychain, the phone's secure storage, and attaches the token to every request on purpose. The User-Agent line carries the app's version number. You will use it later to find out how many people still run old versions against your API.",
  cons:["Mobile data, high latency","Small screen","App Store review to ship","Bearer token, manual","Payload size costs battery"]},

 {id:"android", n:"Android app", s:"Native app written in Kotlin",
  req:`<span class="kw">GET</span> /api/courses HTTP/1.1
Host: enlist.university.edu
Accept: application/json
<span class="kw">Authorization</span>: Bearer eyJhbGciOiJIUzI1...
User-Agent: EnlistMobile/2.0 (Android 14)`,
  code:`<span class="kw">val</span> req = Request.Builder()
    .url(<span class="s">"$BASE/api/courses"</span>)
    .header(<span class="s">"Authorization"</span>, <span class="s">"Bearer $token"</span>)
    .build()
<span class="kw">val</span> body = client.newCall(req).execute().body?.string()
<span class="kw">val</span> result = Json.decodeFromString&lt;CourseList&gt;(body!!)`,
  render:`LazyColumn {
    items(result.courses) { c -&gt;
        Row {
            Text(c.code)
            Text(<span class="s">"\${c.units}u"</span>)
        }
    }
}`,
  note:"This is the same as iOS, written in a different language and calling the same URL. Android users typically update more slowly and over a wider range of devices and system versions than iOS users. This matters once you start changing the API.",
  cons:["Mobile data, high latency","Many device sizes","Store review to ship","Bearer token, manual","Slowest update adoption"]}
];
let clSel=0;
function renderClients(){
  $("#clientPick").innerHTML=CLIENTS.map((c,i)=>`
    <button class="cbox${i===clSel?" on":""}" data-i="${i}">
      <div class="cn">${c.n}</div><div class="cs">${c.s}</div></button>`).join("");
  const c=CLIENTS[clSel];
  $("#clReq").innerHTML=c.req;
  $("#clCode").innerHTML=c.code;
  $("#clRes").innerHTML=SHARED_RES;
  $("#clRender").innerHTML=c.render;
  $("#clNote").textContent=c.note;
  $("#clCons").innerHTML=c.cons.map(x=>`<span>${x}</span>`).join("");
  $$("#clientPick .cbox").forEach(el=>el.onclick=()=>{clSel=+el.dataset.i;renderClients()});
}
renderClients();

/* version drift */
/* the server-rendered counterexample: markup where the data should be */
$("#enlistHtml").innerHTML = `<span class="kw">HTTP/1.1 200 OK</span>
Content-Type: <span class="d">text/html; charset=UTF-8</span>

<span class="d">&lt;table class=</span><span class="s">"gridTable"</span><span class="d"> width=</span><span class="s">"680"</span><span class="d"> cellpadding=</span><span class="s">"2"</span><span class="d">&gt;</span>
 <span class="d">&lt;tr&gt;&lt;td class=</span><span class="s">"hdr"</span><span class="d">&gt;</span>Subject<span class="d">&lt;/td&gt;</span>
     <span class="d">&lt;td class=</span><span class="s">"hdr"</span><span class="d">&gt;</span>Units<span class="d">&lt;/td&gt;&lt;/tr&gt;</span>
 <span class="d">&lt;tr&gt;&lt;td&gt;</span>ITENT 45<span class="d">&lt;/td&gt;&lt;td align=</span><span class="s">"center"</span><span class="d">&gt;</span>3<span class="d">&lt;/td&gt;&lt;/tr&gt;</span>
 <span class="d">&lt;tr&gt;&lt;td&gt;</span>CSCI 21<span class="d">&lt;/td&gt;&lt;td align=</span><span class="s">"center"</span><span class="d">&gt;</span>3<span class="d">&lt;/td&gt;&lt;/tr&gt;</span>
<span class="d">&lt;/table&gt;</span>

<span class="c">// The data is in there, mixed with the layout,</span>
<span class="c">// the column order and the table width.</span>`;

$("#enlistJson").innerHTML = `<span class="kw">HTTP/1.1 200 OK</span>
Content-Type: <span class="d">application/json</span>

{<span class="s">"enrollments"</span>: [
  {<span class="s">"code"</span>: <span class="s">"ITENT 45"</span>, <span class="s">"units"</span>: 3},
  {<span class="s">"code"</span>: <span class="s">"CSCI 21"</span>,  <span class="s">"units"</span>: 3}
]}

<span class="c">// This says nothing about how it looks.</span>
<span class="c">// Each client decides that for itself.</span>`;

const DRIFT={days:7, breaking:false};
const PLATFORMS=[
 {n:"Web", f:d=>Math.min(1, d<0.5?d*2:1), note:"next reload"},
 {n:"iOS", f:d=>0.94*(1-Math.exp(-d/11)), note:"App Store"},
 {n:"Android", f:d=>0.86*(1-Math.exp(-d/19)), note:"Play Store"}
];
function renderDrift(){
  const d=DRIFT.days;
  const rows=PLATFORMS.map(p=>{
    const nw=p.f(d), old=1-nw;
    return {n:p.n, note:p.note, nw, old};
  });
  $("#driftBars").innerHTML=rows.map(r=>{
    const broke = DRIFT.breaking && r.old>0.01;
    return `<div class="dr${broke?" bad":""}">
      <span class="dn">${r.n} <span style="color:var(--faint)">· ${r.note}</span></span>
      <div class="dbar">
        <i class="new" style="width:${(r.nw*100).toFixed(1)}%"></i>
        <i class="old" style="width:${(r.old*100).toFixed(1)}%"></i>
      </div>
      <span class="dv">${(r.old*100).toFixed(0)}% old</span>
    </div>`;
  }).join("");

  const worstOld=Math.max(...rows.map(r=>r.old));
  const mobileOld=(rows[1].old+rows[2].old)/2;
  const v=$("#driftVerdict");
  if(!DRIFT.breaking){
    v.className="verdict ok";
    v.innerHTML=`<b>Nothing breaks on any platform</b>You added a field and removed nothing. Old clients read the response, ignore the field they do not know, and carry on. This is why the rule for a public API is <em>additive changes only</em>: adding is free, and removing is almost never safe.`;
  } else if(d===0){
    v.className="verdict warn";
    v.innerHTML=`<b>You shipped the change a moment ago</b>Everyone is still on the old version, as expected on day zero. Nothing has failed yet. Drag the slider to see who updates and who does not.`;
  } else if(worstOld<0.05){
    v.className="verdict warn";
    v.innerHTML=`<b>Day ${d}: a small group is still affected</b>About ${(mobileOld*100).toFixed(0)}% of mobile users are still on the old version and still failing. Web users were clean within a day. If you must break something, wait about this long before switching the old path off, and keep serving both until then.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>Day ${d}: ${(mobileOld*100).toFixed(0)}% of mobile users are broken right now</b>You renamed or removed a field, and every app copy that expects the old shape fails. You cannot fix those copies. The users have to update, and many will not for weeks. Web users were fine within hours, so this bug is easy to miss in testing. Versioning the endpoint (publishing the new version at a new URL such as <code>/api/v2/courses</code>) or keeping the old field next to the new one avoids the problem.`;
  }
}
$("#sDays").oninput=e=>{DRIFT.days=+e.target.value;$("#vDays").textContent=DRIFT.days+" days";renderDrift()};
function setDrift(breaking){
  DRIFT.breaking=breaking;
  $("#tgBreak").setAttribute("aria-pressed",breaking);
  $("#tgAdd").setAttribute("aria-pressed",!breaking);
  renderDrift();
}
$("#tgBreak").onclick=()=>setDrift(true);
$("#tgAdd").onclick=()=>setDrift(false);
$("#sDays").dispatchEvent(new Event("input"));

