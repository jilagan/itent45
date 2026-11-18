/* ITENT 45 platform: routing, sections, embed mode, mobile nav, Check Your Understanding, video slots.
   Runs last on both pages. Page-specific hooks come from window.PAGE_HOOKS (see js/00-shell.js).
   URL forms: #rest  #rest/status-codes  ?embed=1  &cyu=0  &video=0  ?instructor=1  ?theme=dark */
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
const firstId = navButtons.length ? navButtons[0].dataset.p : (panelList[0] ? panelList[0].id : "");
const fullBase = location.href.split("#")[0].split("?")[0];

/* ---------- sections ---------- */
function setupSections(){
  panelList.forEach(P=>{
    const found = Array.from(P.el.children).filter(c=>c.classList.contains("sec"));
    if(found.length<2) return;                     // zero or one .sec: panel untouched
    const seen={};
    P.secs = found.map((s,i)=>{
      let slug = slugOK(s.dataset.sec) || "s"+(i+1);
      while(seen[slug]) slug += "-"+(i+1);
      seen[slug]=1;
      const title = s.dataset.title || slug;
      return {el:s, slug, title, tab:null};
    });
    P.el.classList.add("hassecs");
    const strip = el("div","sectabs"); strip.setAttribute("role","tablist"); strip.setAttribute("aria-label","Sections of this topic");
    P.secs.forEach((S,i)=>{
      const base = "sec-"+P.id+"-"+S.slug;
      const b = el("button","sectab",S.title);
      b.type="button"; b.id="tab-"+base; b.dataset.sectab=S.slug;
      b.setAttribute("role","tab"); b.setAttribute("aria-selected","false"); b.setAttribute("aria-controls",base); b.tabIndex=-1;
      b.addEventListener("click",()=>userShow(P.id,S.slug,true));
      strip.appendChild(b); S.tab=b;
      S.el.id = S.el.id || base;
      S.el.setAttribute("role","tabpanel"); S.el.setAttribute("aria-labelledby",b.id);
      const t = el("h3","sec-title",S.title); S.el.insertBefore(t,S.el.firstChild);
    });
    strip.addEventListener("keydown",e=>{
      const k=e.key; if(k!=="ArrowRight"&&k!=="ArrowLeft"&&k!=="Home"&&k!=="End") return;
      const i = P.secs.findIndex(S=>S.tab===document.activeElement); if(i<0) return;
      let n = k==="ArrowRight"?i+1 : k==="ArrowLeft"?i-1 : k==="Home"?0 : P.secs.length-1;
      n=(n+P.secs.length)%P.secs.length;
      e.preventDefault(); e.stopPropagation();
      userShow(P.id,P.secs[n].slug,false); P.secs[n].tab.focus();
    });
    P.tabs=strip;
    if(P.head) P.head.after(strip); else P.el.insertBefore(strip,P.el.firstChild);
  });
}
function addPagers(){
  panelList.forEach(P=>{
    P.secs.forEach((S,i)=>{
      const pg=el("nav","secpager"); pg.setAttribute("aria-label","Sections");
      const mk=(cls,label,title,slug)=>{
        const b=el("button","secbtn "+cls); b.type="button";
        b.appendChild(el("span","secbtn-k",label));
        b.appendChild(el("span","secbtn-t",title));
        b.addEventListener("click",()=>userShow(P.id,slug,false,true));
        return b;
      };
      if(i>0) pg.appendChild(mk("secprev","Previous",P.secs[i-1].title,P.secs[i-1].slug));
      else pg.appendChild(el("span","secgap"));
      if(i<P.secs.length-1) pg.appendChild(mk("secnext","Next",P.secs[i+1].title,P.secs[i+1].slug));
      S.el.appendChild(pg);
    });
  });
}
function appendInSec(container, node){
  const pg = q(":scope > .secpager", container);
  if(pg) container.insertBefore(node,pg); else container.appendChild(node);
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
function showPanel(id, sec, o){
  o=o||{};
  if(!panels[id]) { id=firstId; sec=null; }
  const P=panels[id];
  const multi=P.secs.length>=2;
  let idx=0;
  if(multi && sec){ const f=P.secs.findIndex(S=>S.slug===sec); idx = f<0 ? 0 : f; if(f<0) sec=null; }
  else sec=null;
  const embedSec = EMBED && multi && !!sec;
  const changedPanel = id!==state.id, changedSec = !changedPanel && idx!==(state.idx||0);
  panelList.forEach(p=>{
    p.el.classList.toggle("on", p===P);
    if(p!==P) p.el.classList.remove("embed-sec","embed-first");
  });
  navButtons.forEach(b=>b.setAttribute("aria-selected", String(b.dataset.p===id)));
  P.secs.forEach((S,i)=>{
    const on=i===idx;
    S.el.classList.toggle("on",on);
    if(S.tab){ S.tab.setAttribute("aria-selected",String(on)); S.tab.tabIndex = on?0:-1; }
  });
  if(P.tabs && P.secs[idx] && P.secs[idx].tab){
    const st=P.tabs, tb=P.secs[idx].tab;
    const fit=()=>{ if(st.scrollWidth>st.clientWidth) st.scrollLeft=Math.max(0,tb.offsetLeft-(st.clientWidth-tb.offsetWidth)/2); };
    fit(); requestAnimationFrame(fit);
  }
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
function userShow(id, sec, fromTab, focusTab){
  showPanel(id, sec);
  if(focusTab){ const P=panels[id], S=P.secs.find(s=>s.slug===sec); if(S&&S.tab) try{ S.tab.focus({preventScroll:true}); }catch(e){} }
}
function routeFromHash(){
  const h=parseHash();
  showPanel(h.id||firstId, h.sec, {nohash:true});
}
window.showPanel = showPanel;

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
function buildBlock(items, panelId){
  const blk=el("section","cyu");
  const tid="cyu-t-"+slugOK(panelId)+"-"+Math.random().toString(36).slice(2,7);
  const h=el("h3","cyu-title","Check your understanding"); h.id=tid; blk.setAttribute("aria-labelledby",tid);
  blk.appendChild(h);
  const score=el("p","cyu-score");
  const cards=[];
  const upd=()=>{ const n=cards.filter(c=>c.isRight()).length; score.textContent=n+" of "+cards.length+" answered correctly"; };
  items.forEach(it=>{ const c=buildItem(it,upd); cards.push(c); blk.appendChild(c); });
  upd(); blk.appendChild(score);
  return blk;
}
function setupCyu(){
  if(!SHOW_CYU) return;
  panelList.forEach(P=>{
    const items=(C.cyu||{})[P.id]; if(!items||!items.length) return;
    const bySec={}, rest=[];
    items.forEach(it=>{
      if(it.sec && P.secs.some(S=>S.slug===it.sec)) (bySec[it.sec]=bySec[it.sec]||[]).push(it);
      else rest.push(it);
    });
    P.secs.forEach(S=>{ if(bySec[S.slug]) appendInSec(S.el, buildBlock(bySec[S.slug],P.id)); });
    if(rest.length){
      const blk=buildBlock(rest,P.id);
      if(P.secs.length) appendInSec(P.secs[P.secs.length-1].el, blk); else P.el.appendChild(blk);
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

/* ---------- start ---------- */
setupNavToggle();
setupSections();
setupVideos();
setupCyu();
addPagers();
setupEmbed();
routeFromHash();
postHeight(true);
})();
