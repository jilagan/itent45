/* Lesson analytics: Google Analytics 4, loaded only when shared/analytics.json holds a measurement ID.
   Runs after platform.js. It reads the page through DOM events and never changes platform behaviour.
   With an empty ID, or when tracking is switched off, this file does nothing at all.
   Every event carries: module (the lesson's area), course (the ?c= course, or "none"), lesson_id, panel_id (the same value as
   lesson_id, kept so the dimension registered in GA4 keeps working), embedded and instructor. */
(function(){
"use strict";
const L = window.LESSON || {};
const CFG = L.analytics || {};
const ID = String(CFG.ga4 || "").trim();
if(!/^G-[A-Z0-9]{4,}$/i.test(ID)) return;                       // no ID: do nothing

const Q = new URLSearchParams(location.search);
const HTML = document.documentElement;

/* ---------- do not track ---------- */
if(location.protocol==="file:") return;
let off = Q.get("notrack")==="1";
try{
  if(off) sessionStorage.setItem("lessons-notrack","1");
  else if(sessionStorage.getItem("lessons-notrack")==="1" || sessionStorage.getItem("itent45-notrack")==="1") off = true;
}catch(e){}
if(off) return;
if(navigator.doNotTrack==="1" || window.doNotTrack==="1" || navigator.msDoNotTrack==="1") return;

const DEBUG = CFG.debug===true || Q.get("gadebug")==="1";
const MODULE = L.area || "lesson";
const COURSE_ID = /^[A-Za-z0-9_-]+$/.test(Q.get("c")||"") ? Q.get("c") : "none";
const LESSON_ID = L.id || "";
const q  = (s,r)=>(r||document).querySelector(s);
const qa = (s,r)=>Array.from((r||document).querySelectorAll(s));
const squash = (s,n)=>String(s==null?"":s).replace(/\s+/g," ").trim().slice(0,n);

/* ---------- gtag ---------- */
window.dataLayer = window.dataLayer || [];
function gtag(){ window.dataLayer.push(arguments); }
gtag("js", new Date());
const conf = {
  send_page_view:false,
  cookie_flags:"SameSite=None;Secure",        // the pages run as third-party iframes in Canvas
  transport_type:"beacon",
  allow_google_signals:false,
  allow_ad_personalization_signals:false
};
if(DEBUG) conf.debug_mode = true;
gtag("config", ID, conf);
const tag = document.createElement("script");
tag.async = true;
tag.src = "https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(ID);
document.head.appendChild(tag);

function send(name, params){
  const p = {
    module:MODULE,
    course:COURSE_ID,
    lesson_id:LESSON_ID,
    panel_id:LESSON_ID,
    embedded:HTML.classList.contains("embed"),
    instructor:HTML.classList.contains("instructor")
  };
  Object.keys(params||{}).forEach(k=>{
    let v = params[k];
    if(v==null || v==="") return;
    if(typeof v==="string") v = v.slice(0,100);
    p[k] = v;
  });
  gtag("event", name, p);
  if(DEBUG){ try{ console.table([Object.assign({event:name}, p)]); }catch(e){} }
}

/* ---------- where the reader is ---------- */
const panelOf = n => n && n.closest ? n.closest(".panel") : null;
const pid = () => LESSON_ID;
function secOf(P){
  if(!P) return "";
  const t = q('.sectab[aria-current="step"]', P);
  return t ? (t.dataset.sectab||"") : "";
}
function here(){ const P=q(".panel.on"); return P ? {panel_id:LESSON_ID, section_id:secOf(P)} : {panel_id:"", section_id:""}; }

/* ---------- time on panel (visible time only) ---------- */
let cur = null, acc = 0, visStart = document.hidden ? null : Date.now();
function tick(){ if(visStart!=null){ const n=Date.now(); acc += n-visStart; visStart=n; } }
function flushTime(){
  tick();
  const s = Math.round(acc/1000); acc = 0;
  if(cur && s>=1) send("panel_time", {panel_id:cur.panel_id, section_id:cur.section_id, seconds:s});
}
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){ tick(); visStart=null; flushTime(); }
  else visStart = Date.now();
});
window.addEventListener("pagehide",()=>{ flushTime(); });

/* ---------- page_view for every distinct panel or section ---------- */
let timer = null;
function viewNow(){
  const h = here(); if(!h.panel_id) return;
  if(cur && cur.panel_id===h.panel_id && cur.section_id===h.section_id) return;
  flushTime();
  cur = h;
  const P = q(".panel.on");
  const st = q('.sectab[aria-current="step"]', P);
  const secTitle = st ? squash(st.dataset.title||"", 60) : "";
  send("page_view", {
    page_title: squash(L.title+(secTitle?" / "+secTitle:""), 100),
    page_location: location.origin+location.pathname+(HTML.classList.contains("embed")?"?embed=1":"")+
                   (h.section_id?"#"+h.section_id:""),
    panel_id:h.panel_id, section_id:h.section_id
  });
}
document.addEventListener("panelshow",()=>{ clearTimeout(timer); timer=setTimeout(viewNow,200); });

/* ---------- Check Your Understanding ---------- */
const attempts = {}, completed = {};
function itemFor(card, P){
  const stem = squash((q(".cyu-q",card)||{}).textContent, 1000);
  const items = L.cyu || [];
  const tt = L.t || (x=>x);
  const hit = items.find(it=>squash(tt(String(it.stem||"")).replace(/`/g,""),1000)===stem);
  if(hit) return {id:hit.id, type:hit.type};
  return {id:pid(P)+"-"+(qa(".cyu-item",P).indexOf(card)+1), type:"unknown"};
}
function afterCheck(btn){
  const card = btn.closest(".cyu-item"), P = panelOf(card);
  if(!card || !P) return;
  const st = card.dataset.state;
  if(st!=="right" && st!=="wrong") return;                       // nothing was chosen
  const it = itemFor(card,P);
  attempts[it.id] = (attempts[it.id]||0)+1;
  send("cyu_answer", {panel_id:pid(P), section_id:secOf(P), item_id:it.id, item_type:it.type,
                      correct:st==="right", attempt:attempts[it.id]});
  const all = qa(".cyu-item",P);
  if(all.length && all.every(c=>c.dataset.state==="right") && !completed[pid(P)]){
    completed[pid(P)] = true;
    let n=0; all.forEach(c=>{ n += attempts[itemFor(c,P).id]||0; });
    send("cyu_complete", {panel_id:pid(P), item_count:all.length, attempts:n});
  }
}

/* ---------- clicks ---------- */
function label(e){
  if(e.id) return squash(e.id,40);
  let t = squash(e.getAttribute("aria-label")||"",40);
  if(!t) t = squash(((e.innerText||e.textContent||"").split("\n").find(l=>l.trim())||""),40);
  if(!t) t = squash(e.title||"",40);
  if(!t && e.labels && e.labels[0]) t = squash(e.labels[0].textContent,40);
  if(!t){ const l=e.closest("label"); if(l) t=squash(l.textContent,40); }
  return t || squash(e.name||e.type||e.tagName.toLowerCase(),40);
}
function widgetEvent(el, type){
  const P = panelOf(el);
  if(!P || el.closest(".cyu,.sectabs,.secpager,.vid,.embed-foot,.keyterms")) return;
  send("widget_click", {panel_id:pid(P), section_id:secOf(P), control:label(el), control_type:type});
}
function outbound(a, P){
  let u; try{ u = new URL(a.href, location.href); }catch(e){ return false; }
  if(u.protocol!=="http:" && u.protocol!=="https:") return false;
  const foot = !!a.closest(".embed-foot");
  let leaves = foot || u.host!==location.host;
  if(!leaves && HTML.classList.contains("embed") && a.hasAttribute("data-lesson")){
    leaves = true;                       // in an embed, a link to another lesson opens that lesson in a new tab
  }
  if(!leaves) return false;
  send("click", {outbound:true, link_url:u.origin+u.pathname+(foot?u.hash:""), link_domain:u.host,
                 link_text:squash(a.textContent,40), panel_id:pid(P||q(".panel.on"))});
  return true;
}
document.addEventListener("click", e=>{                           // capture: before page handlers change the DOM
  const t = e.target; if(!t || !t.closest) return;
  const nav = t.closest("a.navitem[data-p]");
  if(nav){ send("select_content", {content_type:"lesson", item_id:nav.dataset.p}); return; }
  const st = t.closest(".sectab");
  if(st){ send("select_content", {content_type:"section", item_id:pid(panelOf(st))+"/"+(st.dataset.sectab||"")}); return; }
  const vg = t.closest(".vid-go");
  if(vg){
    const fig = vg.closest(".vid"), slot = fig ? fig.dataset.slot : "";
    const v = (L.videos||[]).find(x=>(x.sec||"")===slot);
    send("video_start", {panel_id:pid(panelOf(vg)), section_id:secOf(panelOf(vg)), video_id:v?v.youtube:""});
    return;
  }
  const a = t.closest("a[href]");
  if(a){ outbound(a, panelOf(a)); return; }
  const b = t.closest("button");
  if(b) widgetEvent(b, "button");
}, true);
document.addEventListener("click", e=>{                           // bubble: after the question widget has judged the answer
  const b = e.target && e.target.closest ? e.target.closest(".cyu-check") : null;
  if(b) afterCheck(b);
});
const lastRange = {};
document.addEventListener("input", e=>{
  const t = e.target;
  if(!t || t.type!=="range") return;
  const k = pid(panelOf(t))+"|"+(t.id||label(t)), n = Date.now();
  if(lastRange[k] && n-lastRange[k]<2000) return;
  lastRange[k] = n;
  widgetEvent(t, "range");
}, true);
document.addEventListener("change", e=>{
  const t = e.target; if(!t) return;
  if(t.tagName==="SELECT") widgetEvent(t, "select");
  else if(t.type==="checkbox") widgetEvent(t, "checkbox");
}, true);

/* ---------- footer note ---------- */
const sty = document.createElement("style");
sty.textContent = ".ga-note{margin:28px 0 0;font-size:14px;line-height:1.5;color:var(--dim2,#566070)}";
document.head.appendChild(sty);
const note = document.createElement("p");
note.className = "ga-note";
note.textContent = "This site uses Google Analytics to count visits and clicks. No names or answers you type are collected.";
(q(".stage")||document.body).appendChild(note);
})();
