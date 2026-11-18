/* Lesson shape. Widget code for the markup in lesson.html. */
/* ================= ROWS OR DOCUMENTS ================= */
const SH={shape:"rows", q:"schedule"};
const SH_SHAPES=[{id:"rows",n:"Rows",i:"table"},{id:"docs",n:"Documents",i:"brackets-curly"}];
const SH_QS=[
 {id:"schedule", n:"One student's schedule", s:"Asked on every page load."},
 {id:"roster",   n:"Who is in MGT 45?",    s:"Asked by the instructor, weekly."},
 {id:"rename",   n:"Rename a course",         s:"Asked twice a year, and every copy must change."}
];
const SH_ANS={
 rows:{
  schedule:{k:"warn", t:"Two tables, one join", d:"The database combines the enlistment rows with the course rows. Written well, this takes one query."},
  roster:{k:"ok", t:"The same data, read from the other side", d:"Filter the enlistments by course, which costs nothing extra. Any column can be a filter, even if nobody planned for this question."},
  rename:{k:"ok", t:"One row", d:"Change the title in the courses table. Every enlistment shows the new title, because none of them stores a copy."}
 },
 docs:{
  schedule:{k:"ok", t:"One read, no join", d:"The student's document already holds the enlistments and their titles. One lookup returns the whole page, which is faster than the relational version."},
  roster:{k:"bad", t:"Every student document is scanned", d:"Documents are organized by student, so nothing points from a course to its students. The database scans every document unless you build and maintain a second structure."},
  rename:{k:"bad", t:"Every copy must be found and rewritten", d:"The title was copied into each student's document. A rename must find and rewrite every copy, with no single table to check your work."}
 }
};
function shRender(){
  $("#shPick").innerHTML=SH_SHAPES.map(x=>
    `<button data-s="${x.id}" aria-pressed="${x.id===SH.shape}">${ICO(x.i)} ${x.n}</button>`).join("");
  $$("#shPick button").forEach(el=>el.onclick=()=>{SH.shape=el.dataset.s;shRender()});
  $("#shQ").innerHTML=SH_QS.map(x=>`
    <button class="tg" data-q="${x.id}" aria-pressed="${x.id===SH.q}">
      <span class="dot"></span><span>${x.n}<small>${x.s}</small></span></button>`).join("");
  $$("#shQ .tg").forEach(el=>el.onclick=()=>{SH.q=el.dataset.q;shRender()});

  $("#shBody").innerHTML = SH.shape==="rows"
   ? `<span class="c">-- courses</span>
id         title                    units
<span class="s">MGT 45</span>     Operations Management    3
<span class="s">CSCI 21</span>    Data Structures          3

<span class="c">-- enlistments</span>
student    course_id
<span class="s">20-1000</span>    <span class="s">MGT 45</span>
<span class="s">20-1000</span>    <span class="s">CSCI 21</span>
<span class="s">20-1001</span>    <span class="s">MGT 45</span>`
   : `<span class="c">// students/20-1000</span>
{
  <span class="s">"student"</span>: <span class="s">"20-1000"</span>,
  <span class="s">"enlistments"</span>: [
    {<span class="s">"code"</span>:<span class="s">"MGT 45"</span>, <span class="s">"title"</span>:<span class="s">"Operations Management"</span>, <span class="s">"units"</span>:3},
    {<span class="s">"code"</span>:<span class="s">"CSCI 21"</span>, <span class="s">"title"</span>:<span class="s">"Data Structures"</span>,       <span class="s">"units"</span>:3}
  ]
}
<span class="c">// the title is copied into the document of every student who takes it</span>`;

  const a=SH_ANS[SH.shape][SH.q];
  $("#shVerdict").className="verdict "+a.k;
  $("#shVerdict").innerHTML=`<b>${a.t}</b>${a.d}`;
}
shRender();
