/* ================= 18 QUERY COST ================= */
const Q={rows:50, mode:"naive"};
const Q_MS=0.4, Q_BASE=24, Q_WORKERS=8;
const QMODES=[
 {id:"naive", n:"One query per row", s:"Loop over the enrollments and read the title from each one."},
 {id:"join",  n:"One join", s:"One query fetches each enrollment together with its course. Django calls this select_related."},
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
rows = Enrollment.objects.filter(student=me)      <span class="c"># 1 query</span>

<span class="c"># templates/schedule.html</span>
{% for e in rows %}
  {{ e.course.title }}   <span class="c">&lt;- one more query for every row</span>
{% endfor %}`
   : Q.mode==="join"
   ? `<span class="c"># views.py</span>
rows = Enrollment.objects.filter(student=me) \\
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

rows = Enrollment.objects.filter(student=me)      <span class="c"># 1 query</span>`;
  $("#qCode").innerHTML=code;
  $("#qNote").textContent = Q.mode==="naive"
    ? `${n} enrollments on the page, so the database was queried ${n+1} times`
    : Q.mode==="join" ? "one query, however many rows come back"
    : "one query for the enrollments, and the titles were already in memory";

  const set=(id,v,hot,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot);g.classList.toggle("good",!!good)};
  set("#qQueries", m.queries, m.queries>10, m.queries<=2);
  set("#qDb", m.dbMs.toFixed(1)+" ms", m.dbMs>10, m.dbMs<2);
  set("#qHandler", m.handler.toFixed(1)+" ms", m.handler>40, m.handler<28);
  set("#qCeil", Math.round(m.rps)+" rps", m.rps<120, m.rps>250);

  const naive=(()=>{const q=n+1,d=q*Q_MS,h=Q_BASE+d;return {q,h,rps:Q_WORKERS/(h/1000)};})();
  const v=$("#qVerdict");
  if(Q.mode==="naive"){
    v.className = n>20 ? "verdict bad" : "verdict warn";
    v.innerHTML=`<b>${n+1} queries for one page</b>The view runs one query to fetch the enrollments. The template then runs one more query for each row, because it asks for <code>e.course.title</code> and the course was never loaded. This is the <b class="i">N+1 query problem</b>, and it is a common performance bug in applications built this way.<br><br>At ${n} rows the server tops out at <b class="i">${Math.round(m.rps)} requests a second</b>. Switch to "One join" and compare that number.`;
  } else if(Q.mode==="join"){
    v.className="verdict ok";
    v.innerHTML=`<b>1 query, and the ceiling rose from ${Math.round(naive.rps)} to ${Math.round(m.rps)} rps</b>The page, the rows and the output are the same. <code>select_related("course")</code> tells the database to return the courses together with the enrollments in one query, so the template finds them already loaded. One line of code gives <b class="i">${(m.rps/naive.rps).toFixed(1)}×</b> the capacity.<br><br>AI tools often leave this line out, because the version without it also produces a correct page.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>Also 1 query, with no join needed</b>Course titles change a few times a year, so a cache, which is a copy kept in memory, can hold them for an hour at almost no cost. The title lookups then leave the request entirely. This works well when the table is small and rarely changes. It works badly when the data changes often, because then you hold two copies of the same fact and one of them is out of date. "Normalization" describes the same problem.`;
  }
}
$("#sQRows").oninput=e=>{Q.rows=+e.target.value;$("#vQRows").textContent=Q.rows;qRender()};
qRender();

