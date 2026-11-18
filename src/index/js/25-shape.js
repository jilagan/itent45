/* ================= 19 ROWS OR DOCUMENTS ================= */
const SH={shape:"rows", q:"schedule"};
const SH_SHAPES=[{id:"rows",n:"Rows"},{id:"docs",n:"Documents"}];
const SH_QS=[
 {id:"schedule", n:"One student's schedule", s:"Asked on every page load."},
 {id:"roster",   n:"Who is in ITENT 45?",    s:"Asked by the instructor, weekly."},
 {id:"rename",   n:"Rename a course",         s:"Asked twice a year, and every copy must change."}
];
const SH_ANS={
 rows:{
  schedule:{k:"warn", t:"Two tables, one join", d:"<code>SELECT … FROM enrollments JOIN courses</code>. A join combines rows from two tables. With <code>select_related</code> it takes one query. Without it, a page of 50 rows takes 51 queries, as in \"The N+1 query problem\"."},
  roster:{k:"ok", t:"The same data, read from the other side", d:"<code>WHERE course_id = 'ITENT45'</code>. The schema was not designed for this question, and it costs nothing extra, because any column can be used as a filter."},
  rename:{k:"ok", t:"One row", d:"<code>UPDATE courses SET title = … WHERE id = 'ITENT45'</code>. Every enrollment shows the new title immediately, because none of them stores a copy."}
 },
 docs:{
  schedule:{k:"ok", t:"One read, no join", d:"The student document already contains the enrollments and their titles. One lookup by key returns the whole page. Documents are designed for this case, and it is faster here than in the relational version."},
  roster:{k:"bad", t:"Every student document is scanned", d:"Nothing is indexed by course unless you build a second structure for it. Without one, the database must scan every student document. With one, you must keep it up to date yourself."},
  rename:{k:"bad", t:"Every document that contains the title", d:"The title was copied into each student's document, so a rename must find and rewrite all of them. This is the missed-rows problem from \"Normalization\", with no single table to check your work against."}
 }
};
function shRender(){
  $("#shPick").innerHTML=SH_SHAPES.map(x=>
    `<button data-s="${x.id}" aria-pressed="${x.id===SH.shape}">${x.n}</button>`).join("");
  $$("#shPick button").forEach(el=>el.onclick=()=>{SH.shape=el.dataset.s;shRender()});
  $("#shQ").innerHTML=SH_QS.map(x=>`
    <button class="tg" data-q="${x.id}" aria-pressed="${x.id===SH.q}">
      <span class="dot"></span><span>${x.n}<small>${x.s}</small></span></button>`).join("");
  $$("#shQ .tg").forEach(el=>el.onclick=()=>{SH.q=el.dataset.q;shRender()});

  $("#shBody").innerHTML = SH.shape==="rows"
   ? `<span class="c">-- courses</span>
id         title                              units
<span class="s">ITENT45</span>    App Development &amp; Emerging Tech   3
<span class="s">CSCI21</span>     Data Structures                    3

<span class="c">-- enrollments</span>
student    course_id
<span class="s">20-1000</span>    <span class="s">ITENT45</span>
<span class="s">20-1000</span>    <span class="s">CSCI21</span>
<span class="s">20-1001</span>    <span class="s">ITENT45</span>`
   : `<span class="c">// students/20-1000</span>
{
  <span class="s">"student"</span>: <span class="s">"20-1000"</span>,
  <span class="s">"enrollments"</span>: [
    {<span class="s">"code"</span>:<span class="s">"ITENT45"</span>, <span class="s">"title"</span>:<span class="s">"App Development &amp; Emerging Tech"</span>, <span class="s">"units"</span>:3},
    {<span class="s">"code"</span>:<span class="s">"CSCI21"</span>,  <span class="s">"title"</span>:<span class="s">"Data Structures"</span>,  <span class="s">"units"</span>:3}
  ]
}
<span class="c">// the title is copied into the document of every student who takes it</span>`;

  const a=SH_ANS[SH.shape][SH.q];
  $("#shVerdict").className="verdict "+a.k;
  $("#shVerdict").innerHTML=`<b>${a.t}</b>${a.d}`;
}
shRender();

