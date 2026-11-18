/* ================= 18 QUERY COST ================= */
const Q={rows:50, mode:"naive"};
const Q_MS=0.4, Q_BASE=24, Q_WORKERS=8;
const QMODES=[
 {id:"naive", n:"The obvious way", s:"Loop the enrolments, read the title from each one."},
 {id:"join",  n:"Ask for it up front", s:"One join, one trip. Django spells it select_related."},
 {id:"cache", n:"Ask once, remember", s:"Titles change rarely, so hold them in memory."}
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
  {{ e.course.title }}   <span class="c">&lt;- one query, every time round the loop</span>
{% endfor %}`
   : Q.mode==="join"
   ? `<span class="c"># views.py</span>
rows = Enrollment.objects.filter(student=me) \\
                 .<span class="kw">select_related</span>(<span class="s">"course"</span>)      <span class="c"># 1 query, joined</span>

<span class="c"># templates/schedule.html</span>
{% for e in rows %}
  {{ e.course.title }}   <span class="c">&lt;- already in memory, costs nothing</span>
{% endfor %}`
   : `<span class="c"># the titles change a few times a year</span>
titles = cache.get(<span class="s">"course_titles"</span>)
<span class="kw">if</span> titles <span class="kw">is</span> <span class="kw">None</span>:
    titles = {c.id: c.title <span class="kw">for</span> c <span class="kw">in</span> Course.objects.all()}
    cache.set(<span class="s">"course_titles"</span>, titles, 3600)   <span class="c"># 1 query an hour</span>

rows = Enrollment.objects.filter(student=me)      <span class="c"># 1 query</span>`;
  $("#qCode").innerHTML=code;
  $("#qNote").textContent = Q.mode==="naive"
    ? `${n} enrolments on the page, ${n+1} times the database was asked something`
    : Q.mode==="join" ? "one trip, however many rows come back"
    : "one trip for the enrolments, and the titles were already here";

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
    v.innerHTML=`<b>${n+1} queries for one page</b>One to fetch the enrolments, then one more for every row, because the template asks for <code>e.course.title</code> and the course was never loaded. This is the <b class="i">N+1 query</b>, the most common performance bug in applications built this way.<br><br>At ${n} rows the box tops out at <b class="i">${Math.round(m.rps)} requests a second</b>. Switch to the join and watch that number.`;
  } else if(Q.mode==="join"){
    v.className="verdict ok";
    v.innerHTML=`<b>1 query, and the ceiling went from ${Math.round(naive.rps)} to ${Math.round(m.rps)} rps</b>Same page, same rows, same output. <code>select_related("course")</code> tells the database to bring the courses along in the same trip, so the template finds them already in memory. One line, <b class="i">${(m.rps/naive.rps).toFixed(1)}×</b> the capacity.<br><br>This is the line an agent will not add for you, because the version without it is correct.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>Also 1 query, and it survives the join getting expensive</b>Course titles change a few times a year, so holding them in memory for an hour costs almost nothing and removes them from the request path entirely. Worth it when the joined table is small and static. Not worth it when the data changes under you, because then you have two copies and one of them is wrong, which is panel 14 again wearing a different hat.`;
  }
}
$("#sQRows").oninput=e=>{Q.rows=+e.target.value;$("#vQRows").textContent=Q.rows;qRender()};
qRender();

