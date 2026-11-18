/* ================= 17 NORMALISATION ================= */
const NM={n:40, renamed:false, partial:false, wroteFlat:0, wroteNorm:0};
const NM_OLD="Application Dev & Emerging Tech", NM_NEW="App Development & Emerging Tech";
const nmTitle=i=>{
  if(!NM.renamed) return NM_OLD;
  if(NM.partial && i>=NM.n-2) return NM_OLD;     // the two nobody updated
  return NM_NEW;
};
function nmRender(){
  const show=Math.min(NM.n,5), rows=[];
  for(let i=0;i<show;i++){
    const t=nmTitle(i), stale=NM.renamed&&t===NM_OLD;
    rows.push(`<tr><td class="k">20-${1000+i}</td><td class="${stale?"hlnull":(NM.renamed?"hl":"")}">${t}</td><td>3</td></tr>`);
  }
  if(NM.n>show){
    const tail=[];
    for(let i=show;i<NM.n;i++) if(nmTitle(i)===NM_OLD && NM.renamed) tail.push(i);
    rows.push(`<tr><td class="k" style="color:var(--faint)">…</td><td colspan="2" style="color:var(--faint)">${NM.n-show} more rows, each carrying its own copy${tail.length?` <b style="color:var(--warn)">(${tail.length} still say the old title)</b>`:""}</td></tr>`);
  }
  $("#flatTbl").innerHTML=`<thead><tr><th>student</th><th>course_title</th><th>units</th></tr></thead><tbody>${rows.join("")}</tbody>`;

  const t=nmTitle(0);
  $("#normTbl").innerHTML=`<thead><tr><th>courses.id</th><th>title</th><th>units</th></tr></thead><tbody>
    <tr><td class="k">ITENT45</td><td class="${NM.renamed?"hl":""}">${NM.renamed?NM_NEW:NM_OLD}</td><td>3</td></tr></tbody>`;
  const er=[];
  for(let i=0;i<Math.min(NM.n,3);i++) er.push(`<tr><td class="k">20-${1000+i}</td><td>ITENT45</td></tr>`);
  if(NM.n>3) er.push(`<tr><td class="k" style="color:var(--faint)">…</td><td style="color:var(--faint)">${NM.n-3} more, all pointing at the same row</td></tr>`);
  $("#normTbl2").innerHTML=`<thead><tr><th>enrollments.student</th><th>course_id</th></tr></thead><tbody>${er.join("")}</tbody>`;

  $("#flatVerdict").className="verdict "+(NM.renamed&&NM.partial?"bad":NM.renamed?"warn":"");
  $("#flatVerdict").innerHTML = !NM.renamed
    ? `<b>The title is stored ${NM.n} times</b>Every enrolment carries its own copy. Nothing is wrong yet.`
    : NM.partial
      ? `<b>Two rows disagree with the other ${NM.n-2}</b>There is now no answer to "what is this course called". Both values are in the database, both look valid, and no constraint was broken.`
      : `<b>${NM.n} rows rewritten to change one fact</b>It worked, this time. It has to work every time, forever, in every code path that touches a title.`;

  $("#normVerdict").className="verdict "+(NM.renamed?"ok":"");
  $("#normVerdict").innerHTML = NM.renamed
    ? `<b>One row rewritten</b>The enrolments never held the title, so they had nothing to update. There is no version of this where two rows disagree, because there are not two rows.`
    : `<b>The title is stored once</b>Enrolments point at it by id. Reading a schedule now needs a join, which panel 15 puts a number on.`;

  const set=(id,v,hot,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot);g.classList.toggle("good",!!good)};
  set("#nmFlat", NM.wroteFlat||"—", NM.wroteFlat>1, false);
  set("#nmNorm", NM.wroteNorm||"—", false, NM.wroteNorm===1);

  const v=$("#nmVerdict");
  if(!NM.renamed){ v.className="verdict"; v.innerHTML=`<b>Nothing has changed yet</b>Press one of the buttons.`; }
  else if(NM.partial){
    v.className="verdict bad";
    v.innerHTML=`<b>${NM.n-2} rows updated, 2 missed, and the database is fine with that</b>This is the failure the split shape makes impossible. Not a crash, not an error, just two answers to the same question living side by side until somebody notices. In the split version there was one row to change, so there was nothing to miss.`;
  } else {
    v.className="verdict warn";
    v.innerHTML=`<b>${NM.wroteFlat} writes against 1</b>Both got to the same place. The flat table needed ${NM.wroteFlat} chances to go wrong and took none of them today. Raise the slider to 400 students and ask how you would feel about that number in a migration script at 2am.`;
  }
}
$("#sEnr").oninput=e=>{NM.n=+e.target.value;$("#vEnr").textContent=NM.n;
  NM.renamed=false;NM.partial=false;NM.wroteFlat=0;NM.wroteNorm=0;nmRender()};
$("#nmRename").onclick=()=>{NM.renamed=true;NM.partial=false;NM.wroteFlat=NM.n;NM.wroteNorm=1;nmRender()};
$("#nmPartial").onclick=()=>{NM.renamed=true;NM.partial=true;NM.wroteFlat=NM.n-2;NM.wroteNorm=1;nmRender()};
$("#nmReset").onclick=()=>{NM.renamed=false;NM.partial=false;NM.wroteFlat=0;NM.wroteNorm=0;nmRender()};
nmRender();

