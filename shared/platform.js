/* Lesson platform: one lesson per page. Steps, routing, rail from course data, terms, embed mode,
   Check Your Understanding and video slots. Runs after the lesson's own script and lib scripts.
   A lesson page holds one <section class="panel" id="p-ID">. Its .sec blocks are steps shown one at a time.
   A generated last step (slug "check") holds the key terms (<dfn title>) and the questions.
   Address forms:
     lessons/rest.html                    the lesson, step 1, no rail
     lessons/rest.html#status-codes       one step of the lesson
     lessons/rest.html?c=itent45          with that course's rail, home link, visited ticks and next lesson
     lessons/rest.html?embed=1            for Canvas: no rail, steps with their strip
     lessons/rest.html?embed=1#status-codes   one step, no strip
     ...&cyu=0  &video=0  &instructor=1  &theme=dark
   window.LESSON is written by build.py: id, title, label, area, areaLabel, root, library, next, cyu, videos, analytics, art, artBase. */
(function(){
"use strict";
const L = window.LESSON;
const HTML = document.documentElement;
const Q = new URLSearchParams(location.search);
const UI = window.CourseUI;
const EMBED = Q.get("embed")==="1";
const SHOW_CYU = Q.get("cyu")!=="0", SHOW_VIDEO = Q.get("video")!=="0";
if(EMBED) HTML.classList.add("embed");
if(Q.get("instructor")==="1") HTML.classList.add("instructor");

const q  = (s,r)=>(r||document).querySelector(s);
const qa = (s,r)=>Array.from((r||document).querySelectorAll(s));
const el = UI.el;
let COURSE = null, HOME = null;           // set when ?c= names a course that loads and contains this lesson
const T = s => UI.T(s, COURSE);

/* Backticks become <code>. Everything else is text. {{project}} style tokens take the course's words. */
function frag(text){
  const f=document.createDocumentFragment();
  T(text).split("`").forEach((part,i)=>{
    if(i%2){ const c=document.createElement("code"); c.textContent=part; f.appendChild(c); }
    else if(part) f.appendChild(document.createTextNode(part));
  });
  return f;
}
const slugOK = s => String(s||"").replace(/[^A-Za-z0-9_-]/g,"-");

/* ---------- the lesson ---------- */
const panelEl = q(".panel");
const P = {el:panelEl, id:L.id, secs:[], tabs:null, head:q(":scope > .head",panelEl)};
const fullBase = location.href.split("#")[0].split("?")[0];

/* ---------- address helpers ---------- */
function nextLesson(){
  if(EMBED) return null;
  if(COURSE && HOME){
    const order=UI.orderOf(HOME), i=order.indexOf(L.id);
    if(i>=0 && order[i+1]) return {id:order[i+1], label:UI.lessonInfo(COURSE,order[i+1]).label};
    return null;
  }
  return L.next || null;
}
const lessonHref = id => UI.lessonUrl("", id);

/* ---------- course: rail, header, home link, visited ticks ---------- */
function setupCourse(){
  const rail=q("#rail");
  if(COURSE && HOME && !EMBED && rail){
    HTML.classList.add("has-course");
    UI.buildRail(rail,{course:COURSE, home:HOME, current:L.id, lessonBase:"", homeBase:L.root});
    document.title = L.title+" · "+HOME.title+" · "+COURSE.code;
  } else {
    HTML.classList.remove("has-course");
    if(rail) rail.remove();
    document.title = L.title;
  }
  setupHeader();
  UI.fillVars(document,COURSE);
  UI.linkLessons(document,{base:"",embed:EMBED});
  UI.watch({base:"",embed:EMBED},COURSE);
}
/* the minimal header shown when there is no rail: library link, area, Display */
function setupHeader(){
  const bar=q("#lbar"); if(!bar || EMBED) return;
  bar.textContent="";
  const a=el("a","lbar-lib","Lesson library"); a.href=L.library+UI.keepQuery({c:null}); bar.appendChild(a);
  bar.appendChild(el("span","lbar-area",L.areaLabel||""));
  const d=el("details","lbar-display"); d.appendChild(el("summary",null,"Display"));
  d.insertAdjacentHTML("beforeend",UI.displayHtml());
  bar.appendChild(d);
  if(window.Display) window.Display.bind(bar);
  document.addEventListener("click",e=>{ if(d.open && !d.contains(e.target)) d.open=false; });
  document.addEventListener("keydown",e=>{ if(e.key==="Escape" && d.open){ d.open=false; q("summary",d).focus(); } });
}
function markSeen(){
  if(EMBED) return;
  const cid = COURSE ? COURSE.id : null;
  if(UI.markSeen(cid,L.id)){ const r=q("#rail"); if(r && cid) UI.paintSeen(r,cid); }
}

/* ---------- terms: <dfn title="definition"> ---------- */
let pop=null, popFor=null;
function dfnReady(d){
  if(d.hasAttribute("title")){ d.dataset.def=d.getAttribute("title"); d.removeAttribute("title"); }
  if(d.dataset.def && !d.hasAttribute("tabindex")) d.tabIndex=0;
  return !!d.dataset.def;
}
function showPop(d){
  if(!dfnReady(d)) return;
  if(!pop){ pop=el("div","dfnpop"); pop.id="dfnpop"; pop.setAttribute("role","tooltip"); pop.hidden=true; document.body.appendChild(pop); }
  pop.textContent=d.dataset.def; pop.hidden=false;
  const r=d.getBoundingClientRect(), pw=pop.offsetWidth, ph=pop.offsetHeight;
  let top=r.bottom+8; if(top+ph>window.innerHeight-8 && r.top-ph-8>8) top=r.top-ph-8;
  const left=Math.max(8,Math.min(window.innerWidth-pw-8, r.left+r.width/2-pw/2));
  pop.style.left=left+"px"; pop.style.top=top+"px";
  d.setAttribute("aria-describedby","dfnpop"); popFor=d;
}
function hidePop(){ if(pop) pop.hidden=true; if(popFor) popFor.removeAttribute("aria-describedby"); popFor=null; }
function setupDfn(){
  qa("dfn[title]").forEach(dfnReady);
  const of=e=>{ const d=e.target && e.target.closest ? e.target.closest("dfn") : null; return d; };
  document.addEventListener("mouseover",e=>{ const d=of(e); if(d && d!==popFor) showPop(d); });
  document.addEventListener("mouseout",e=>{ const d=of(e); if(d && d===popFor && !(e.relatedTarget && d.contains(e.relatedTarget))) hidePop(); });
  document.addEventListener("focusin",e=>{ const d=of(e); if(d) showPop(d); });
  document.addEventListener("focusout",e=>{ const d=of(e); if(d && d===popFor) hidePop(); });
  document.addEventListener("click",e=>{ const d=of(e); if(d) showPop(d); else hidePop(); });
  document.addEventListener("keydown",e=>{ if(e.key==="Escape") hidePop(); });
  window.addEventListener("scroll",hidePop,true);
  window.addEventListener("resize",hidePop);
}
function termsOf(){
  const out=[], seenT={};
  qa("dfn",P.el).forEach(d=>{
    dfnReady(d);
    const t=d.textContent.trim(), k=t.toLowerCase();
    if(!d.dataset.def || seenT[k]) return;
    seenT[k]=1; out.push({term:t, def:d.dataset.def});
  });
  return out;
}
function buildTerms(list){
  const box=el("details","keyterms more");
  box.appendChild(el("summary",null,"Key terms ("+list.length+")"));
  const dl=el("dl");
  list.forEach(t=>{ dl.appendChild(el("dt",null,t.term)); dl.appendChild(el("dd",null,t.def)); });
  box.appendChild(dl);
  return box;
}

/* ---------- scene pictures ---------- */
/* A step-1 .scene with data-art="slug" gets its picture when build.py found shared/art/<slug>.webp
   (the slugs that exist are listed in LESSON.art, so a missing file never causes a request). */
function setupArt(){
  const have = new Set(Array.isArray(L.art) ? L.art : []);
  if(!have.size) return;
  qa(".scene[data-art]").forEach(sc=>{
    const slug = sc.dataset.art;
    if(!have.has(slug) || q(":scope > img.scene-art",sc)) return;
    const img = el("img","scene-art");
    img.src = L.artBase+slug+".webp";
    img.alt = sc.dataset.artDesc || "";
    img.loading = "lazy"; img.decoding = "async";
    img.width = 1200; img.height = 800;
    sc.insertBefore(img, sc.firstChild);
    sc.classList.add("has-art");
  });
}

/* ---------- steps ---------- */
function collectSections(){
  const found = Array.from(P.el.children).filter(c=>c.classList.contains("sec"));
  if(found.length<2) return;                       // zero or one .sec: the lesson is a single step
  const seenSlug={};
  P.secs = found.map((s,i)=>{
    let slug = slugOK(s.dataset.sec) || "s"+(i+1);
    while(seenSlug[slug]) slug += "-"+(i+1);
    seenSlug[slug]=1;
    return {el:s, slug, title:T(s.dataset.title || slug), tab:null};
  });
  P.el.classList.add("hassecs");
}
function addCheckStep(children){
  const S={el:el("div","sec check-step"), slug:"check", title:"Check your understanding", tab:null};
  S.el.dataset.sec="check"; S.el.dataset.title=S.title;
  children.forEach(c=>S.el.appendChild(c));
  P.el.appendChild(S.el);
  P.secs.push(S);
}
function nextLessonButton(nl){
  const nb=el("a","secbtn secnext primary"); nb.href=lessonHref(nl.id);
  nb.appendChild(el("span","secbtn-t","Next lesson: "+nl.label));
  return nb;
}
function buildSteps(){
  const N=P.secs.length;
  const nl=nextLesson();
  if(!N){                                           // unsectioned lesson: one step, only the next-lesson button
    if(nl){
      const pg=el("nav","secpager lessononly"); pg.setAttribute("aria-label","Lesson navigation");
      pg.appendChild(nextLessonButton(nl)); P.el.appendChild(pg);
    }
    return;
  }
  const strip=el("div","sectabs"); strip.setAttribute("aria-label","Steps in this lesson");
  const meta=el("p","stepmeta"); meta.setAttribute("aria-live","polite");
  P.numEl=el("span","stepnum"); P.nameEl=el("span","stepname");
  meta.appendChild(P.numEl); meta.appendChild(P.nameEl);
  const dots=el("div","stepdots");
  P.secs.forEach((S,i)=>{
    const base="sec-"+P.id+"-"+S.slug;
    const b=el("button","sectab",String(i+1));
    b.type="button"; b.id="tab-"+base; b.dataset.sectab=S.slug; b.dataset.title=S.title;
    b.title=S.title; b.setAttribute("aria-label","Step "+(i+1)+" of "+N+": "+S.title);
    b.addEventListener("click",()=>userShow(S.slug,true));
    dots.appendChild(b); S.tab=b;
    S.el.id = S.el.id || base;
    S.el.setAttribute("role","group"); S.el.setAttribute("aria-label","Step "+(i+1)+": "+S.title);
    const t=el("h3","sec-title",S.title); t.tabIndex=-1; S.el.insertBefore(t,S.el.firstChild);
    /* back and next buttons */
    const pg=el("nav","secpager"); pg.setAttribute("aria-label","Lesson navigation");
    if(i>0){
      const bb=el("button","secbtn secprev"); bb.type="button"; bb.appendChild(el("span","secbtn-t","Back"));
      bb.addEventListener("click",()=>userShow(P.secs[i-1].slug,false,true));
      pg.appendChild(bb);
    } else pg.appendChild(el("span","secgap"));
    if(i<N-1){
      const nb=el("button","secbtn secnext primary"); nb.type="button";
      nb.appendChild(el("span","secbtn-t","Next: "+P.secs[i+1].title));
      nb.addEventListener("click",()=>userShow(P.secs[i+1].slug,false,true));
      pg.appendChild(nb);
    } else if(nl) pg.appendChild(nextLessonButton(nl));
    S.el.appendChild(pg);
  });
  strip.appendChild(meta); strip.appendChild(dots);
  P.tabs=strip;
  if(P.head) P.head.after(strip); else P.el.insertBefore(strip,P.el.firstChild);
}

/* ---------- routing: the address names a step ---------- */
const state = {idx:-1, sec:null};
function runShowHook(){ try{ if(window.PAGE_HOOKS && typeof PAGE_HOOKS.show==="function") PAGE_HOOKS.show(); }catch(e){} }
function parseHash(){
  let h=location.hash.replace(/^#/,"");
  try{ h=decodeURIComponent(h); }catch(e){}
  if(!h && Q.get("s")) h=Q.get("s");
  if(h===L.id && !P.secs.some(S=>S.slug===h)) return null;      // #lesson alone means step 1, unless a step has that name
  if(h.indexOf(L.id+"/")===0) h=h.slice(L.id.length+1);     // older addresses: #lesson/step
  return h||null;
}
function showStep(sec, o){
  o=o||{};
  const multi=P.secs.length>=2;
  let idx=0;
  if(multi && sec){ const f=P.secs.findIndex(S=>S.slug===sec); idx = f<0 ? 0 : f; if(f<0) sec=null; }
  else sec=null;
  const embedSec = EMBED && multi && !!sec;
  const changed = idx!==state.idx;
  P.el.classList.add("on");
  P.secs.forEach((S,i)=>{
    const on=i===idx;
    S.el.classList.toggle("on",on);
    if(S.tab){ if(on) S.tab.setAttribute("aria-current","step"); else S.tab.removeAttribute("aria-current"); }
  });
  if(multi && P.numEl){
    P.numEl.textContent="Step "+(idx+1)+" of "+P.secs.length;
    P.nameEl.textContent=P.secs[idx].title;
  }
  P.el.classList.toggle("later", multi && idx>0);
  markSeen();
  HTML.classList.toggle("embed-sec", embedSec);
  P.el.classList.toggle("embed-sec", embedSec);
  P.el.classList.toggle("embed-first", embedSec && idx===0);
  /* embed step view: the introduction shows only with the first step */
  const intro = P.head ? Array.from(P.head.children) : [];
  qa(":scope > .vid",P.el).forEach(v=>intro.push(v));
  intro.forEach(c=>{
    const hide = embedSec && c.tagName!=="H2" && idx!==0;
    c.classList.toggle("pf-hide", hide);
  });
  state.idx=idx; state.sec = multi ? P.secs[idx].slug : null;
  /* address bar (not in an embed) */
  if(!EMBED && !o.nohash){
    const hash = multi && idx>0 ? "#"+P.secs[idx].slug : "";
    if(location.hash!==hash && !(hash==="" && location.hash==="")){
      try{ history.replaceState(null,"",location.pathname+location.search+hash); }catch(e){}
    }
  }
  /* mobile contents list closes when a step is chosen */
  UI.closeNav();
  /* relayout hooks need the lesson and step to be visible already */
  runShowHook();
  if(changed && !o.keepScroll){
    const st=q(".stage"); if(st) st.scrollTop=0;
    if(!EMBED) window.scrollTo(0,0);
  }
  const foot=q(".embed-foot a");
  if(foot) foot.href = fullBase+UI.keepQuery({c:Q.get("c")})+(state.sec && state.idx>0 ? "#"+state.sec : "");
  requestAnimationFrame(()=>{
    runShowHook();
    window.dispatchEvent(new Event("resize"));
    P.el.dispatchEvent(new CustomEvent("panelshow",{bubbles:true,detail:{id:L.id, sec:state.sec}}));
    postHeight();
  });
}
function userShow(sec, fromTab, focusHead){
  showStep(sec);
  if(focusHead){ const S=P.secs.find(s=>s.slug===sec); const t=S&&q(":scope > .sec-title",S.el); if(t) try{ t.focus({preventScroll:true}); }catch(e){} }
}
function routeFromHash(){ showStep(parseHash(), {nohash:true}); }
window.showStep = showStep;
window.addEventListener("hashchange",routeFromHash);

/* links to a step of this lesson: <a href="#check"> */
document.addEventListener("click",e=>{
  const a=e.target.closest && e.target.closest("a[href^='#']");
  if(!a) return;
  let t=(a.getAttribute("href")||"").slice(1);
  try{ t=decodeURIComponent(t); }catch(x){}
  if(t.indexOf(L.id+"/")===0) t=t.slice(L.id.length+1);
  if(!P.secs.some(S=>S.slug===t)) return;
  e.preventDefault(); showStep(t);
});

/* ---------- Check Your Understanding ---------- */
function shuffle(a){
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; }
  return a;
}
/* feedback text must not repeat the verdict: drop a leading "Correct." "Wrong." and the like */
function cleanFb(t){
  let s=String(t==null?"":t).trim(), r=/^(?:Correct|Right|Yes|Incorrect|Wrong|No)[.!]\s+/i;
  while(r.test(s)) s=s.replace(r,"");
  return s.charAt(0).toUpperCase()+s.slice(1);
}
function buildItem(item, onChange){
  const multi=item.type==="multi";
  const uid="cyu-"+slugOK(item.id||Math.random().toString(36).slice(2));
  const card=el("div","cyu-item"); card.dataset.state="open";
  const fs=el("fieldset","cyu-fs");
  const lg=el("legend","cyu-q"); lg.appendChild(frag(item.stem)); fs.appendChild(lg);
  const list=el("div","cyu-opts");
  const rows=shuffle((item.options||[]).map((o,i)=>({o,i})));
  const inputs=[];
  rows.forEach(({o},k)=>{
    const lab=el("label","cyu-opt");
    const inp=document.createElement("input");
    inp.type = multi?"checkbox":"radio"; inp.name=uid; inp.id=uid+"-"+k;
    const tx=el("span","cyu-txt"); tx.appendChild(frag(o.text));
    const res=el("span","cyu-mark");
    lab.appendChild(inp); lab.appendChild(tx); lab.appendChild(res);
    list.appendChild(lab); inputs.push({inp,o,lab,res});
    inp.addEventListener("change",()=>{ if(card.dataset.state!=="open") reset(false); });
  });
  fs.appendChild(list);
  card.appendChild(fs);
  const bar=el("div","cyu-bar");
  const check=el("button","cyu-btn cyu-check","Check"); check.type="button";
  const again=el("button","cyu-btn cyu-again","Try again"); again.type="button"; again.hidden=true;
  bar.appendChild(check); bar.appendChild(again);
  const out=el("div","cyu-out"); out.setAttribute("role","status"); out.setAttribute("aria-live","polite");
  card.appendChild(bar); card.appendChild(out);
  let correct=false;
  function reset(clear){
    inputs.forEach(x=>{ if(clear) x.inp.checked=false; x.lab.classList.remove("right","wrong"); x.res.textContent=""; });
    out.textContent=""; correct=false; card.dataset.state="open";
    check.hidden=false; again.hidden=true; onChange();
  }
  check.addEventListener("click",()=>{
    const chosen=inputs.filter(x=>x.inp.checked);
    out.textContent="";
    if(!chosen.length){ out.appendChild(el("p","cyu-hint","Choose an answer first.")); return; }
    const wantAll=inputs.filter(x=>x.o.correct);
    const missed=wantAll.filter(x=>!x.inp.checked).length;
    const wrongPicked=chosen.filter(x=>!x.o.correct).length;
    correct = missed===0 && wrongPicked===0;
    inputs.forEach(x=>{
      x.lab.classList.remove("right","wrong");
      if(x.inp.checked){
        x.lab.classList.add(x.o.correct?"right":"wrong");
        x.res.textContent = x.o.correct ? "✓ Correct" : "✗ Not quite";
      }
    });
    const verdict=el("p","cyu-verdict "+(correct?"right":"wrong"));
    verdict.appendChild(el("span","cyu-ic",correct?"✓":"✗"));
    let vt = correct ? "Correct" : "Not quite";
    if(multi && !correct){
      if(missed && !wrongPicked) vt="Not yet. "+(missed===1?"One correct option is missing.":missed+" correct options are missing.");
      else if(wrongPicked && !missed) vt="Not yet. "+(wrongPicked===1?"One selected option is wrong.":wrongPicked+" selected options are wrong.");
      else vt="Not yet. Some selected options are wrong and some correct ones are missing.";
    }
    verdict.appendChild(document.createTextNode(" "+vt));
    out.appendChild(verdict);
    chosen.forEach(x=>{
      const p=el("p","cyu-fb "+(x.o.correct?"right":"wrong"));
      if(multi){ const b=el("strong",null); b.appendChild(frag(x.o.text)); p.appendChild(b); p.appendChild(document.createTextNode(" ")); }
      p.appendChild(frag(cleanFb(x.o.feedback)));
      out.appendChild(p);
    });
    if(item.type==="predict" && item.try){
      const t=el("p","cyu-try"); t.appendChild(el("strong",null,"Try it. ")); t.appendChild(frag(item.try)); out.appendChild(t);
    }
    card.dataset.state = correct?"right":"wrong";
    check.hidden=true; again.hidden=false; again.focus();
    onChange();
  });
  again.addEventListener("click",()=>{ reset(true); if(inputs[0]) inputs[0].inp.focus(); });
  card.isRight=()=>correct;
  return card;
}
function buildBlock(items, title){
  const blk=el("section","cyu"+(title?"":" cyu-final"));
  const tid="cyu-t-"+slugOK(L.id)+"-"+Math.random().toString(36).slice(2,7);
  if(title){ const h=el("h4","cyu-title",title); h.id=tid; blk.setAttribute("aria-labelledby",tid); blk.appendChild(h); }
  const score=el("p","cyu-score");
  const cards=[];
  const upd=()=>{ const n=cards.filter(c=>c.isRight()).length; score.textContent=n+" of "+cards.length+" answered correctly"; };
  items.forEach(it=>{ const c=buildItem(it,upd); cards.push(c); blk.appendChild(c); });
  upd(); if(items.length>1) blk.appendChild(score);
  return blk;
}
/* Items with a sec go at the end of that step, one per step. The rest form the last step, "Check your understanding". */
function setupCyu(){
  const items=SHOW_CYU ? (L.cyu||[]) : [];
  const terms=termsOf();
  const bySec={}, rest=[];
  items.forEach(it=>{
    if(P.secs.length && it.sec && it.sec!=="check" && P.secs.some(S=>S.slug===it.sec) && !bySec[it.sec]) bySec[it.sec]=it;
    else rest.push(it);
  });
  P.secs.forEach(S=>{ if(bySec[S.slug]) S.el.appendChild(buildBlock([bySec[S.slug]],"Quick check")); });
  if(P.secs.length){
    if(rest.length || terms.length){
      const kids=[];
      if(terms.length) kids.push(buildTerms(terms));
      if(rest.length) kids.push(buildBlock(rest));
      addCheckStep(kids);
    }
  } else {
    if(terms.length) P.el.appendChild(buildTerms(terms));
    if(rest.length) P.el.appendChild(buildBlock(rest,"Check your understanding"));
  }
}
/* analytics asks for the stem as shown, with the course's words in it */
L.t = T;

/* ---------- video slots ---------- */
const YT=/^[A-Za-z0-9_-]{11}$/;
function buildVideo(v){
  const fig=el("figure","vid"); fig.dataset.slot=(v.sec||"");
  const box=el("div","vid-frame");
  const btn=el("button","vid-go"); btn.type="button";
  btn.setAttribute("aria-label","Play video: "+(v.title||""));
  const img=new Image(); img.alt=""; img.loading="lazy"; img.decoding="async";
  img.src="https://i.ytimg.com/vi/"+v.youtube+"/hqdefault.jpg";
  img.addEventListener("error",()=>img.remove());
  const play=el("span","vid-play","▶"); play.setAttribute("aria-hidden","true");
  btn.appendChild(img); btn.appendChild(play);
  box.appendChild(btn); fig.appendChild(box);
  fig.appendChild(el("figcaption","vid-cap",v.title||"Video"));
  btn.addEventListener("click",()=>{
    const f=document.createElement("iframe");
    f.src="https://www.youtube-nocookie.com/embed/"+v.youtube+"?autoplay=1&rel=0&playsinline=1&cc_load_policy=1";
    f.title=v.title||"Video"; f.loading="lazy";
    f.setAttribute("allow","autoplay; encrypted-media; picture-in-picture; fullscreen");
    f.setAttribute("referrerpolicy","strict-origin-when-cross-origin");
    f.allowFullscreen=true;
    box.replaceChild(f,btn); f.focus();
  });
  return fig;
}
function setupVideos(){
  if(!SHOW_VIDEO) return;
  (L.videos||[]).forEach(v=>{
    if(!v || !YT.test(String(v.youtube||""))) return;
    const fig=buildVideo(v);
    const S = v.sec ? P.secs.find(s=>s.slug===v.sec) : null;
    if(S){
      const t=q(":scope > .sec-title",S.el);
      if(t) t.after(fig); else S.el.insertBefore(fig,S.el.firstChild);
    } else if(P.head) P.head.after(fig);
    else P.el.insertBefore(fig,P.el.firstChild);
  });
}

/* ---------- embed extras ---------- */
let lastH=0;
function postHeight(force){
  if(!EMBED || window.parent===window) return;
  const r=q(".rig")||document.body;
  const h=Math.ceil(r.getBoundingClientRect().height);
  if(!force && h===lastH) return;
  lastH=h;
  const fid=Q.get("fid")||"";
  try{
    window.parent.postMessage({type:"lesson:height", lesson:L.id, height:h, fid},"*");
    window.parent.postMessage({type:"itent45:height", height:h, fid},"*");      // older embeds listen for this name
  }catch(e){}
}
function setupEmbed(){
  if(!EMBED) return;
  const foot=el("p","embed-foot"); const a=el("a",null,"Open full lesson");
  a.href=fullBase; a.target="_blank"; a.rel="noopener"; foot.appendChild(a);
  (q(".stage")||document.body).appendChild(foot);
  if(window.ResizeObserver){
    const ro=new ResizeObserver(()=>postHeight());
    ro.observe(q(".rig")||document.body);
  }
  window.addEventListener("resize",()=>postHeight());
  window.addEventListener("load",()=>postHeight(true));
}

/* ---------- details.more: opening one changes the layout, so run the relayout hook ---------- */
function setupDetails(){
  document.addEventListener("toggle",e=>{
    const d=e.target;
    if(!d || !d.matches || !d.matches("details")) return;
    if(!d.closest(".panel")) return;
    runShowHook();
    requestAnimationFrame(()=>{ runShowHook(); window.dispatchEvent(new Event("resize")); postHeight(); });
  },true);
}

/* ---------- start ---------- */
function start(){
  setupCourse();
  setupDfn();
  setupArt();
  collectSections();
  setupCyu();
  buildSteps();
  setupVideos();
  setupDetails();
  setupEmbed();
  routeFromHash();
  postHeight(true);
  window.__lessonReady = true;
}
/* ?c=<course> loads ../courses/<course>.js, a small script that fills window.COURSES. A missing course is ignored. */
function courseLoaded(cid){
  const c=(window.COURSES||{})[cid];
  if(c){ COURSE=c; HOME=UI.homeOf(c,L.id); }
}
const cid=Q.get("c");
if(cid && UI.idOK(cid)){
  const s=document.createElement("script");
  s.src=L.root+"courses/"+cid+".js";
  s.onload=()=>{ courseLoaded(cid); start(); };
  s.onerror=()=>{ start(); };
  document.head.appendChild(s);
} else start();
})();
