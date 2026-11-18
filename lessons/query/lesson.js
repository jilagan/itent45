/* Lesson query. Widget code for the markup in lesson.html. */
/* ================= QUERY COST ================= */
const Q={rows:50, mode:"naive"};
const Q_MS=0.4, Q_BASE=24, Q_WORKERS=8;
const QMODES=[
 {id:"naive", n:"One query per row", s:"Loop over the enlistments and read the title from each one."},
 {id:"join",  n:"One join", s:"One query fetches each enlistment together with its course."},
 {id:"cache", n:"Cache the titles", s:"Titles change rarely, so keep a copy in memory."}
];
function qModel(){
  const n=Q.rows;
  const queries = Q.mode==="naive" ? n+1 : Q.mode==="join" ? 1 : 1;
  const dbMs = queries*Q_MS + (Q.mode==="cache" ? 0 : 0);
  const handler = Q_BASE + dbMs;
  return {queries, dbMs, handler, rps: Q_WORKERS/(handler/1000)};
}
function qRender(){
  const m=qModel(), n=Q.rows;
  $("#qMode").innerHTML=QMODES.map(x=>`
    <button class="tg" data-q="${x.id}" aria-pressed="${x.id===Q.mode}">
      <span class="dot"></span><span>${x.n}<small>${x.s}</small></span></button>`).join("");
  $$("#qMode .tg").forEach(el=>el.onclick=()=>{Q.mode=el.dataset.q;qRender()});

  const code = Q.mode==="naive"
   ? `<span class="c"># views.py</span>
rows = Enlistment.objects.filter(student=me)      <span class="c"># 1 query</span>

<span class="c"># templates/schedule.html</span>
{% for e in rows %}
  {{ e.course.title }}   <span class="c">&lt;- one more query for every row</span>
{% endfor %}`
   : Q.mode==="join"
   ? `<span class="c"># views.py</span>
rows = Enlistment.objects.filter(student=me) \\
                 .<span class="kw">select_related</span>(<span class="s">"course"</span>)      <span class="c"># 1 query, joined</span>

<span class="c"># templates/schedule.html</span>
{% for e in rows %}
  {{ e.course.title }}   <span class="c">&lt;- already loaded, no extra query</span>
{% endfor %}`
   : `<span class="c"># the titles change a few times a year, so keep a copy</span>
titles = cache.get(<span class="s">"course_titles"</span>)
<span class="kw">if</span> titles <span class="kw">is</span> <span class="kw">None</span>:
    titles = {c.id: c.title <span class="kw">for</span> c <span class="kw">in</span> Course.objects.all()}
    cache.set(<span class="s">"course_titles"</span>, titles, 3600)   <span class="c"># 1 query an hour</span>

rows = Enlistment.objects.filter(student=me)      <span class="c"># 1 query</span>`;
  $("#qCode").innerHTML=code;
  $("#qNote").textContent = Q.mode==="naive"
    ? `${n} enlistments on the page, so the database was queried ${n+1} times`
    : Q.mode==="join" ? "one query, however many rows come back"
    : "one query for the enlistments, and the titles were already in memory";

  const set=(id,v,hot,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot);g.classList.toggle("good",!!good)};
  set("#qQueries", m.queries, m.queries>10, m.queries<=2);
  set("#qDb", m.dbMs.toFixed(1)+" ms", m.dbMs>10, m.dbMs<2);
  set("#qHandler", m.handler.toFixed(1)+" ms", m.handler>40, m.handler<28);
  set("#qCeil", Math.round(m.rps), m.rps<120, m.rps>250);

  const naive=(()=>{const q=n+1,d=q*Q_MS,h=Q_BASE+d;return {q,h,rps:Q_WORKERS/(h/1000)};})();
  const v=$("#qVerdict");
  if(Q.mode==="naive"){
    v.className = n>20 ? "verdict bad" : "verdict warn";
    v.innerHTML=`<b>${n+1} queries: the N+1 query problem</b>The page asks once for the enlistments, then once more for each row's course. At ${n} rows the server tops out at ${Math.round(m.rps)} pages a second, so try One join and compare.`;
  } else if(Q.mode==="join"){
    v.className="verdict ok";
    v.innerHTML=`<b>1 query, and the server now serves up to ${Math.round(m.rps)} pages a second, up from ${Math.round(naive.rps)}</b>The page and its output are the same, and the capacity is ${(m.rps/naive.rps).toFixed(1)}× higher. One line of code asks the database for each enlistment together with its course.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>Also 1 query, with no join</b>Course titles change a few times a year, so a copy kept in memory can serve them for an hour. This works for small tables that rarely change.`;
  }
}
$("#sQRows").oninput=e=>{Q.rows=+e.target.value;$("#vQRows").textContent=Q.rows;qRender()};
qRender();
