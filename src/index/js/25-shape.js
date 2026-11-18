/* ================= 19 ROWS OR DOCUMENTS ================= */
const SH={shape:"rows", q:"schedule"};
const SH_SHAPES=[{id:"rows",n:"Rows"},{id:"docs",n:"Documents"}];
const SH_QS=[
 {id:"schedule", n:"One student's schedule", s:"Asked on every page load."},
 {id:"roster",   n:"Who is in ITENT 45?",    s:"Asked by the instructor, weekly."},
 {id:"rename",   n:"Rename a course",         s:"Asked twice a year, and it must be complete."}
];
const SH_ANS={
 rows:{
  schedule:{k:"warn", t:"Two tables, one join", d:"<code>SELECT … FROM enrollments JOIN courses</code>. One trip if you remember <code>select_related</code>, fifty-one if you do not. Panel 15 is exactly this query."},
  roster:{k:"ok", t:"The same data read the other way", d:"<code>WHERE course_id = 'ITENT45'</code>. You did not design for this question and it costs nothing extra, because rows do not care which direction you come at them from."},
  rename:{k:"ok", t:"One row", d:"<code>UPDATE courses SET title = … WHERE id = 'ITENT45'</code>. Every enrolment sees the new title immediately, because none of them had a copy."}
 },
 docs:{
  schedule:{k:"ok", t:"One read, no assembly", d:"The student document already holds the enrolments and their titles. One key lookup and the page is ready. This is the case documents are built for, and it is faster here."},
  roster:{k:"bad", t:"Every student document, scanned", d:"Nothing indexes by course unless you built a second structure that does. You either scan everything, or you maintain a course-to-students index yourself and keep it in step by hand."},
  rename:{k:"bad", t:"Every document that mentions it", d:"The title was copied into each student's document, so the rename has to find and rewrite all of them. Panel 14's missed rows, except now there is no single table to check your work against."}
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
<span class="c">// the title is copied into every student who takes it</span>`;

  const a=SH_ANS[SH.shape][SH.q];
  $("#shVerdict").className="verdict "+a.k;
  $("#shVerdict").innerHTML=`<b>${a.t}</b>${a.d}`;
}
shRender();

