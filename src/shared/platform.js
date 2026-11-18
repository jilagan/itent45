/* ITENT 45 platform: routing, lesson steps, home view, rail, terms, embed mode, Check Your Understanding, video slots.
   Runs last on both pages. Page-specific hooks come from window.PAGE_HOOKS (see js/00-shell.js).
   A lesson is a panel. Its .sec blocks are steps shown one at a time. A generated last step (slug "check")
   holds the key terms (<dfn title>) and the Check Your Understanding items.
   URL forms: #home  #rest  #rest/status-codes  #rest/check  ?embed=1  &cyu=0  &video=0  ?instructor=1  ?theme=dark */
(function(){
"use strict";
const C = window.COURSE || {page:"index", cyu:{}, videos:[]};
const HTML = document.documentElement;
const Q = new URLSearchParams(location.search);
const EMBED = Q.get("embed")==="1";
const SHOW_CYU = Q.get("cyu")!=="0", SHOW_VIDEO = Q.get("video")!=="0";
if(EMBED) HTML.classList.add("embed");
if(Q.get("instructor")==="1") HTML.classList.add("instructor");

const q  = (s,r)=>(r||document).querySelector(s);
const qa = (s,r)=>Array.from((r||document).querySelectorAll(s));
function el(tag, cls, text){
  const e=document.createElement(tag);
  if(cls) e.className=cls;
  if(text!=null) e.textContent=text;
  return e;
}
/* Backticks become <code>. Everything else is text. */
function frag(text){
  const f=document.createDocumentFragment();
  String(text==null?"":text).split("`").forEach((part,i)=>{
    if(i%2){ const c=document.createElement("code"); c.textContent=part; f.appendChild(c); }
    else if(part) f.appendChild(document.createTextNode(part));
  });
  return f;
}
const slugOK = s => String(s||"").replace(/[^A-Za-z0-9_-]/g,"-");

/* ---------- panels and nav ---------- */
const navButtons = qa('[role="tab"][data-p]');
const nav = q(".nav");
if(nav && !nav.id) nav.id="nav";
const stage = q(".stage");
const panels = {};              // id -> {el, id, secs:[{el,slug,title,tab}], tabs}
const panelList = [];
qa(".panel").forEach(p=>{
  const id=p.id.replace(/^p-/,"");
  const o={el:p, id, secs:[], tabs:null, head:q(":scope > .head",p)};
  panels[id]=o; panelList.push(o);
});
navButtons.forEach(b=>{ const o=panels[b.dataset.p]; if(o){ const l=q(".lbl",b); o.label=(l?l.textContent:b.textContent).trim(); o.btn=b; } });
const homeEl = q("#home");
const firstId = navButtons.length ? navButtons[0].dataset.p : (panelList[0] ? panelList[0].id : "");
const fullBase = location.href.split("#")[0].split("?")[0];

/* ---------- rail: collapsible groups, visited marks ---------- */
const SEEN_KEY="itent45-seen-"+(C.page||"index");
let seen={};
try{ seen=JSON.parse(sessionStorage.getItem(SEEN_KEY)||"{}")||{}; }catch(e){ seen={}; }
let railGroups=[];
function setupRail(){
  if(!nav) return;
  const groups=[]; let cur=null;
  Array.from(nav.children).forEach(k=>{
    if(k.classList.contains("navgrp")){ cur={name:k.textContent.trim(), btns:[], title:k}; groups.push(cur); }
    else if(cur && k.matches("button[data-p]")) cur.btns.push(k);
  });
  groups.forEach(g=>{
    const d=el("details","navset"), s=el("summary","navgrp");
    s.appendChild(el("span","gname",g.name));
    s.appendChild(el("span","gcount",g.btns.length+(g.btns.length===1?" lesson":" lessons")));
    d.appendChild(s);
    g.title.replaceWith(d);
    g.btns.forEach(b=>d.appendChild(b));
    g.el=d;
  });
  railGroups=groups;
  navButtons.forEach(b=>{
    b.appendChild(el("span","tick")).setAttribute("aria-hidden","true");
    b.appendChild(el("span","sr",", visited"));
  });
  const h1=q(".brand h1");
  if(h1 && homeEl){ const a=el("a","homelink",h1.textContent); a.href="#home"; h1.textContent=""; h1.appendChild(a); }
  paintSeen();
}
function paintSeen(){
  navButtons.forEach(b=>b.classList.toggle("seen",!!seen[b.dataset.p]));
  qa(".home-group li").forEach(li=>li.classList.toggle("seen",!!seen[li.dataset.p]));
}
function markSeen(id){
  if(EMBED || seen[id]) return;
  seen[id]=1;
  try{ sessionStorage.setItem(SEEN_KEY,JSON.stringify(seen)); }catch(e){}
  paintSeen();
}
function syncRail(id){
  railGroups.forEach(g=>{ g.el.open = !!id && g.btns.some(b=>b.dataset.p===id); });
}
function nextLessonOf(id){
  const i=navButtons.findIndex(b=>b.dataset.p===id);
  return i>=0 && navButtons[i+1] ? panels[navButtons[i+1].dataset.p] : null;
}

/* ---------- home view ---------- */
function setupHome(){
  if(!homeEl || EMBED) return;
  const first = navButtons[0] && panels[navButtons[0].dataset.p];
  if(first){
    const p=el("p","home-start"), a=el("a","startbtn","Start: "+first.label);
    a.href="#"+first.id; p.appendChild(a);
    const lede=q(".lede",homeEl);
    if(lede) lede.after(p); else homeEl.appendChild(p);
  }
  const wrap=el("div","home-groups");
  railGroups.forEach(g=>{
    const sec=el("section","home-group");
    sec.appendChild(el("h3",null,g.name));
    const ul=el("ul");
    g.btns.forEach(b=>{
      const P=panels[b.dataset.p]; if(!P) return;
      const li=el("li"); li.dataset.p=P.id;
      const a=el("a",null,P.label); a.href="#"+P.id;
      li.appendChild(a);
      const d=b.dataset.desc; if(d) li.appendChild(el("span","d",d));
      ul.appendChild(li);
    });
    sec.appendChild(ul); wrap.appendChild(sec);
  });
  homeEl.appendChild(wrap);
  paintSeen();
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
function termsOf(P){
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
  const box=el("section","keyterms");
  box.appendChild(el("h4",null,"Key terms"));
  const dl=el("dl");
  list.forEach(t=>{ dl.appendChild(el("dt",null,t.term)); dl.appendChild(el("dd",null,t.def)); });
  box.appendChild(dl);
  return box;
}

/* ---------- steps ---------- */
function collectSections(){
  panelList.forEach(P=>{
    const found = Array.from(P.el.children).filter(c=>c.classList.contains("sec"));
    if(found.length<2) return;                     // zero or one .sec: the lesson is a single step
    const seenSlug={};
    P.secs = found.map((s,i)=>{
      let slug = slugOK(s.dataset.sec) || "s"+(i+1);
      while(seenSlug[slug]) slug += "-"+(i+1);
      seenSlug[slug]=1;
      return {el:s, slug, title:s.dataset.title || slug, tab:null};
    });
    P.el.classList.add("hassecs");
  });
}
function addCheckStep(P, children){
  const S={el:el("div","sec check-step"), slug:"check", title:"Check your understanding", tab:null};
  S.el.dataset.sec="check"; S.el.dataset.title=S.title;
  children.forEach(c=>S.el.appendChild(c));
  P.el.appendChild(S.el);
  P.secs.push(S);
}
function buildSteps(){
  panelList.forEach(P=>{
    const N=P.secs.length;
    const nextL = EMBED ? null : nextLessonOf(P.id);
    if(!N){                                         // unsectioned lesson: one step, only the next-lesson button
      if(nextL && !EMBED){
        const pg=el("nav","secpager lessononly"); pg.setAttribute("aria-label","Lesson navigation");
        const b=el("button","secbtn secnext primary"); b.type="button";
        b.appendChild(el("span","secbtn-t","Next lesson: "+nextL.label));
        b.addEventListener("click",()=>showPanel(nextL.id,null));
        pg.appendChild(b); P.el.appendChild(pg);
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
      b.addEventListener("click",()=>userShow(P.id,S.slug,true));
      dots.appendChild(b); S.tab=b;
      S.el.id = S.el.id || base;
      S.el.setAttribute("role","group"); S.el.setAttribute("aria-label","Step "+(i+1)+": "+S.title);
      const t=el("h3","sec-title",S.title); t.tabIndex=-1; S.el.insertBefore(t,S.el.firstChild);
      /* back and next buttons */
      const pg=el("nav","secpager"); pg.setAttribute("aria-label","Lesson navigation");
      if(i>0){
        const bb=el("button","secbtn secprev"); bb.type="button"; bb.appendChild(el("span","secbtn-t","Back"));
        bb.addEventListener("click",()=>userShow(P.id,P.secs[i-1].slug,false,true));
        pg.appendChild(bb);
      } else pg.appendChild(el("span","secgap"));
      if(i<N-1){
        const nb=el("button","secbtn secnext primary"); nb.type="button";
        nb.appendChild(el("span","secbtn-t","Next: "+P.secs[i+1].title));
        nb.addEventListener("click",()=>userShow(P.id,P.secs[i+1].slug,false,true));
        pg.appendChild(nb);
      } else if(nextL){
        const nb=el("button","secbtn secnext primary"); nb.type="button";
        nb.appendChild(el("span","secbtn-t","Next lesson: "+nextL.label));
        nb.addEventListener("click",()=>showPanel(nextL.id,null));
        pg.appendChild(nb);
      }
      S.el.appendChild(pg);
    });
    strip.appendChild(meta); strip.appendChild(dots);
    P.tabs=strip;
    if(P.head) P.head.after(strip); else P.el.insertBefore(strip,P.el.firstChild);
  });
}

/* ---------- routing ---------- */
const state = {id:null, sec:null};
const hooksFor = id => {
  const H = window.PAGE_HOOKS; if(!H) return;
  try{ if(H.panel && typeof H.panel[id]==="function") H.panel[id](); }catch(e){}
};
function parseHash(){
  let h=location.hash.replace(/^#/,"");
  try{ h=decodeURIComponent(h); }catch(e){}
  if(!h && Q.get("p")) h = Q.get("p")+(Q.get("s")?"/"+Q.get("s"):"");
  const i=h.indexOf("/");
  return i<0 ? {id:h, sec:null} : {id:h.slice(0,i), sec:h.slice(i+1)||null};
}
function showHome(o){
  o=o||{};
  if(!homeEl || EMBED){ showPanel(firstId,null,o); return; }
  panelList.forEach(p=>p.el.classList.remove("on","embed-sec","embed-first","later"));
  navButtons.forEach(b=>b.setAttribute("aria-selected","false"));
  HTML.classList.remove("embed-sec"); HTML.classList.add("is-home");
  syncRail(null);
  const changed = state.id!=="home";
  state.id="home"; state.idx=0; state.sec=null;
  if(!o.nohash && location.hash!=="#home"){
    try{ (changed ? history.pushState : history.replaceState).call(history,null,"","#home"); }catch(e){}
  }
  HTML.classList.remove("nav-open");
  const tg=q(".navtoggle"); if(tg) tg.setAttribute("aria-expanded","false");
  if(stage) stage.scrollTop=0;
  window.scrollTo(0,0);
}
function showPanel(id, sec, o){
  o=o||{};
  if(!panels[id]) { if(!EMBED && homeEl){ showHome(o); return; } id=firstId; sec=null; }
  HTML.classList.remove("is-home");
  const P=panels[id];
  const multi=P.secs.length>=2;
  let idx=0;
  if(multi && sec){ const f=P.secs.findIndex(S=>S.slug===sec); idx = f<0 ? 0 : f; if(f<0) sec=null; }
  else sec=null;
  const embedSec = EMBED && multi && !!sec;
  const changedPanel = id!==state.id, changedSec = !changedPanel && idx!==(state.idx||0);
  panelList.forEach(p=>{
    p.el.classList.toggle("on", p===P);
    if(p!==P) p.el.classList.remove("embed-sec","embed-first","later");
  });
  navButtons.forEach(b=>b.setAttribute("aria-selected", String(b.dataset.p===id)));
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
  syncRail(id); markSeen(id);
  HTML.classList.toggle("embed-sec", embedSec);
  P.el.classList.toggle("embed-sec", embedSec);
  P.el.classList.toggle("embed-first", embedSec && idx===0);
  /* embed section view: the intro shows only with the first section */
  const intro = P.head ? Array.from(P.head.children) : [];
  qa(":scope > .vid",P.el).forEach(v=>intro.push(v));
  intro.forEach(c=>{
    const hide = embedSec && c.tagName!=="H2" && !(idx===0 && !c.classList.contains("eyebrow"));
    c.classList.toggle("pf-hide", hide);
  });
  state.id=id; state.idx=idx; state.sec = multi ? P.secs[idx].slug : null;
  /* address bar (full site only) */
  if(!EMBED && !o.nohash){
    const hash = "#"+id+(multi && idx>0 ? "/"+P.secs[idx].slug : "");
    if(location.hash!==hash){
      try{ (changedPanel ? history.pushState : history.replaceState).call(history,null,"",hash); }catch(e){}
    }
  }
  /* mobile contents list closes when a panel is chosen */
  HTML.classList.remove("nav-open");
  const tg=q(".navtoggle"); if(tg) tg.setAttribute("aria-expanded","false");
  /* relayout hooks need the panel and section to be visible already */
  hooksFor(id);
  if(!o.keepScroll && (changedPanel||changedSec)){
    if(stage) stage.scrollTop=0;
    if(!EMBED) window.scrollTo(0,0);
  }
  const foot=q(".embed-foot a");
  if(foot) foot.href = fullBase+"#"+id+(state.sec && state.idx>0 ? "/"+state.sec : "");
  requestAnimationFrame(()=>{
    hooksFor(id);
    window.dispatchEvent(new Event("resize"));
    P.el.dispatchEvent(new CustomEvent("panelshow",{bubbles:true,detail:{id, sec:state.sec}}));
    postHeight();
  });
}
function userShow(id, sec, fromTab, focusHead){
  showPanel(id, sec);
  if(focusHead){ const P=panels[id], S=P.secs.find(s=>s.slug===sec); const t=S&&q(":scope > .sec-title",S.el); if(t) try{ t.focus({preventScroll:true}); }catch(e){} }
}
function routeFromHash(){
  const h=parseHash();
  if(!EMBED && homeEl && (!h.id || h.id==="home")){ showHome({nohash:true}); return; }
  showPanel(h.id||firstId, h.sec, {nohash:true});
}
window.showPanel = showPanel;
window.showHome = showHome;

navButtons.forEach(b=>{
  b.onclick=null;                                // older page handlers are replaced by showPanel
  b.addEventListener("click",()=>showPanel(b.dataset.p,null));
});
window.addEventListener("hashchange",routeFromHash);

/* links that name a panel: <a data-goto="mem"> or <a href="#mem/slug"> */
document.addEventListener("click",e=>{
  const a=e.target.closest && e.target.closest("a[data-goto], a[href^='#']");
  if(!a) return;
  let t=a.getAttribute("data-goto") || (a.getAttribute("href")||"").slice(1);
  try{ t=decodeURIComponent(t); }catch(x){}
  const i=t.indexOf("/"), pid = i<0?t:t.slice(0,i), ps = i<0?null:t.slice(i+1);
  if(pid==="home" && homeEl && !EMBED){ e.preventDefault(); showHome(); return; }
  if(!panels[pid]) return;
  e.preventDefault();
  if(EMBED){
    if(pid===state.id && (!ps || panels[pid].secs.some(S=>S.slug===ps))) showPanel(pid,ps);
    else window.open(fullBase+"#"+t,"_blank","noopener");
  } else showPanel(pid,ps);
});

/* ---------- mobile nav ---------- */
function setupNavToggle(){
  const brand=q(".brand"); if(!brand) return;
  let tg=q(".navtoggle");
  if(!tg){ tg=el("button","navtoggle","Contents"); tg.type="button"; brand.appendChild(tg); }
  tg.setAttribute("aria-expanded","false");
  tg.setAttribute("aria-controls","nav");
  tg.addEventListener("click",()=>{
    const open=!HTML.classList.contains("nav-open");
    HTML.classList.toggle("nav-open",open);
    tg.setAttribute("aria-expanded",String(open));
  });
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape" && HTML.classList.contains("nav-open")){
      HTML.classList.remove("nav-open"); tg.setAttribute("aria-expanded","false"); tg.focus();
    }
  });
}

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
function buildBlock(items, panelId, title){
  const blk=el("section","cyu"+(title?"":" cyu-final"));
  const tid="cyu-t-"+slugOK(panelId)+"-"+Math.random().toString(36).slice(2,7);
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
  panelList.forEach(P=>{
    const items=SHOW_CYU ? ((C.cyu||{})[P.id]||[]) : [];
    const terms=termsOf(P);
    const bySec={}, rest=[];
    items.forEach(it=>{
      if(P.secs.length && it.sec && it.sec!=="check" && P.secs.some(S=>S.slug===it.sec) && !bySec[it.sec]) bySec[it.sec]=it;
      else rest.push(it);
    });
    P.secs.forEach(S=>{ if(bySec[S.slug]) S.el.appendChild(buildBlock([bySec[S.slug]],P.id,"Quick check")); });
    if(P.secs.length){
      if(rest.length || terms.length){
        const kids=[];
        if(terms.length) kids.push(buildTerms(terms));
        if(rest.length) kids.push(buildBlock(rest,P.id));
        addCheckStep(P,kids);
      }
    } else {
      if(terms.length) P.el.appendChild(buildTerms(terms));
      if(rest.length) P.el.appendChild(buildBlock(rest,P.id,"Check your understanding"));
    }
  });
}

/* ---------- video slots ---------- */
const YT=/^[A-Za-z0-9_-]{11}$/;
function buildVideo(v){
  const fig=el("figure","vid"); fig.dataset.slot=(v.panel||"")+"/"+(v.sec||"");
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
  (C.videos||[]).forEach(v=>{
    if(!v || !YT.test(String(v.youtube||""))) return;
    const P=panels[v.panel]; if(!P) return;
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
  try{ window.parent.postMessage({type:"itent45:height", height:h, fid:Q.get("fid")||""},"*"); }catch(e){}
}
function setupEmbed(){
  if(!EMBED) return;
  const foot=el("p","embed-foot"); const a=el("a",null,"Open full site");
  a.href=fullBase; a.target="_blank"; a.rel="noopener"; foot.appendChild(a);
  (stage||document.body).appendChild(foot);
  if(window.ResizeObserver){
    const ro=new ResizeObserver(()=>postHeight());
    ro.observe(q(".rig")||document.body);
  }
  window.addEventListener("resize",()=>postHeight());
  window.addEventListener("load",()=>postHeight(true));
}

/* ---------- details.more: opening one changes the layout, so run the relayout hooks ---------- */
function setupDetails(){
  document.addEventListener("toggle",e=>{
    const d=e.target;
    if(!d || !d.matches || !d.matches("details")) return;
    const pn=d.closest(".panel"); if(!pn) return;
    const id=pn.id.replace(/^p-/,"");
    hooksFor(id);
    requestAnimationFrame(()=>{ hooksFor(id); window.dispatchEvent(new Event("resize")); postHeight(); });
  },true);
}

/* ---------- start ---------- */
setupNavToggle();
setupRail();
setupHome();
setupDfn();
collectSections();
setupCyu();
buildSteps();
setupVideos();
setupDetails();
setupEmbed();
routeFromHash();
postHeight(true);
})();
