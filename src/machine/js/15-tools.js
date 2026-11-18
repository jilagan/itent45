/* ================= 09 TOOLS AND MCP ================= */
const TLC=[
 {id:"read", label:"A harmless one", danger:false,
  def:`<span class="c">// the tool description the model is given</span>
{
  <span class="s">"name"</span>: <span class="s">"query_courses"</span>,
  <span class="s">"description"</span>: <span class="s">"Run a read-only SQL query against the course catalog."</span>,
  <span class="s">"input_schema"</span>: {
    <span class="s">"sql"</span>: { <span class="s">"type"</span>: <span class="s">"string"</span> }
  }
}`,
  steps:[
   ["th","You","How many students are enrolled in ITENT 45?"],
   ["ac","Model emits",'{"tool":"query_courses","sql":"SELECT COUNT(*) FROM enrollments WHERE course=\'ITENT45\'"}'],
   ["gap","Nothing has run yet","the request is text. The client now decides whether to carry it out"],
   ["ob","Client runs it, returns",'{"rows":[{"count":38}]}'],
   ["th","Model answers","38 students are enrolled in ITENT 45."]],
  ok:`<b>The model asked. Something else acted.</b>Step 2 produced text, exactly like every other thing it produces. It is a request written in a shape the client knows how to read.<br><br>Step 3 is the one worth remembering. Between the request and the result there is a program that could log it, rewrite it, ask you first, or refuse. <b class="i">That gap is where every safety control on an agent lives.</b>`},
 {id:"drop", label:"One you should read", danger:true,
  def:`<span class="c">// a second tool, offered by the same server</span>
{
  <span class="s">"name"</span>: <span class="s">"run_sql"</span>,
  <span class="s">"description"</span>: <span class="s">"Execute any SQL statement. Writes are permitted."</span>,
  <span class="s">"input_schema"</span>: {
    <span class="s">"sql"</span>: { <span class="s">"type"</span>: <span class="s">"string"</span> }
  }
}`,
  steps:[
   ["th","You","The test data is stale, clean it up before the demo."],
   ["ac","Model emits",'{"tool":"run_sql","sql":"DELETE FROM enrollments"}'],
   ["gap","Nothing has run yet","this one has no WHERE clause. You have four seconds to notice"],
   ["ob","Client runs it, returns",'{"rows_affected":11482}'],
   ["th","Model answers","Cleaned up the stale test data."]],
  ok:`<b>11,482 rows, and it reported success</b>The model did what it was asked, as it understood the asking. "Clean it up" has no precise meaning, so it chose a statement that certainly cleans, and the tool description said writes were permitted.<br><br>Nothing here malfunctioned. The request was carried faithfully and the answer is accurate. This is panel 04's missing WHERE clause arriving through an agent, at machine speed, with a cheerful summary at the end.`,
  denied:`<b>Refused, and nothing happened</b>You stopped it at the only point where stopping was possible. The model is not offended and does not retry behind your back; it simply gets told the call failed and carries on from there.<br><br>Notice how little time you had. In a loop running twenty steps, requests like this go past faster than you can read them. So people set standing rules and stop reading every call: read-only tools by default, writes behind approval, destructive statements refused outright.`}
];
const TL={sel:"read", at:0, denied:false};
function tlRender(){
  const c=TLC.find(x=>x.id===TL.sel);
  $("#tlPick").innerHTML=TLC.map(x=>
    `<button data-c="${x.id}" aria-pressed="${x.id===TL.sel}">${x.label}</button>`).join("");
  $$("#tlPick button").forEach(el=>el.onclick=()=>{TL.sel=el.dataset.c;TL.at=0;TL.denied=false;tlRender()});
  $("#tlDef").innerHTML=c.def;
  $("#tlDeny").style.display = (c.danger && TL.at===3 && !TL.denied) ? "" : "none";

  const shown = TL.denied ? 3 : TL.at;
  $("#tlTrace").innerHTML=c.steps.map((s,i)=>{
    const [kind,lb,txt]=s;
    if(TL.denied && i>=3){
      if(i===3) return `<div class="tr ob on" style="border-color:var(--warn)">
        <span class="lb" style="color:var(--warn)">Refused</span><span>you declined the call, nothing was executed</span></div>`;
      return "";
    }
    const cls = kind==="gap" ? "tr ac" : "tr "+kind;
    const extra = kind==="gap" ? ' style="border-style:dashed;border-color:var(--req)"' : "";
    return `<div class="${cls} ${i<shown?"on":""}"${extra}>
      <span class="lb">${lb}</span><span>${txt.replace(/</g,"&lt;")}</span></div>`;
  }).join("");

  const v=$("#tlVerdict");
  if(TL.denied){ v.className="verdict ok"; v.innerHTML=c.denied; return; }
  if(TL.at===0){ v.className="verdict";
    v.innerHTML=`<b>Five steps</b>Press Step and watch which of them the model is responsible for.`; return; }
  if(TL.at===3){ v.className="verdict warn";
    v.innerHTML=`<b>Stop here for a moment</b>The model has produced its request and is now waiting. Nothing has touched the database. Everything that happens next is the client's decision${c.danger?", and this is the last moment at which it is still undone":""}.`; return; }
  if(TL.at<c.steps.length){ v.className="verdict";
    v.innerHTML=`<b>Step ${TL.at} of ${c.steps.length}</b>Keep going.`; return; }
  v.className="verdict "+(c.danger?"bad":"ok"); v.innerHTML=c.ok;
}
$("#tlStep").onclick=()=>{const c=TLC.find(x=>x.id===TL.sel); if(TL.at<c.steps.length){TL.at++;tlRender();}};
$("#tlReset").onclick=()=>{TL.at=0;TL.denied=false;tlRender()};
$("#tlDeny").onclick=()=>{TL.denied=true;tlRender()};

/* the N by M count, before and after a shared format */
function tlCounts(){
  const hosts=["Claude Code","Cursor","an in-house agent","Copilot"];
  const sys=["your files","Postgres","Jira","Google Drive","Slack"];
  $("#tlBefore").innerHTML=
    `<span class="c">// ${hosts.length} applications x ${sys.length} systems</span>\n`+
    `${hosts.length} \u00d7 ${sys.length} = <span style="color:var(--warn);font-weight:600">${hosts.length*sys.length} adapters</span>\n`+
    `<span class="c">// each written, tested and maintained separately</span>\n`+
    `<span class="c">// add one more system and you write ${hosts.length} more</span>`;
  $("#tlAfter").innerHTML=
    `<span class="c">// each side implements the protocol once</span>\n`+
    `${hosts.length} + ${sys.length} = <span style="color:var(--res);font-weight:600">${hosts.length+sys.length} pieces</span>\n`+
    `<span class="c">// add one more system and you write 1 more</span>\n`+
    `<span class="c">// it then works in all ${hosts.length} applications</span>`;
}
tlCounts(); tlRender();

