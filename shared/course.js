/* Course helpers, shared by lesson pages, course home pages and the library page.
   A course is a small generated script (courses/<id>.js) that fills window.COURSES[<id>] with its rail, titles and vars.
   This file turns that data into the rail, fills <span data-var="..."> placeholders, turns <a data-lesson="id"> into real links
   and remembers which lessons a student has opened in this browser tab (sessionStorage, one key per course). */
(function(){
"use strict";
const HTML = document.documentElement;
const Q = new URLSearchParams(location.search);
const EMBED = Q.get("embed")==="1";
const COURSES = window.COURSES = window.COURSES || {};
const q  = (s,r)=>(r||document).querySelector(s);
const qa = (s,r)=>Array.from((r||document).querySelectorAll(s));
function el(tag, cls, text){ const e=document.createElement(tag); if(cls) e.className=cls; if(text!=null) e.textContent=text; return e; }
const idOK = s => /^[A-Za-z0-9_-]+$/.test(String(s||""));

/* ---------- visited lessons, per course, per browser tab ---------- */
const SEEN_PREFIX = "lessons-seen-";
function seenMap(cid){ try{ return JSON.parse(sessionStorage.getItem(SEEN_PREFIX+(cid||"library"))||"{}")||{}; }catch(e){ return {}; } }
function markSeen(cid, id){
  const m=seenMap(cid); if(m[id]) return false;
  m[id]=1; try{ sessionStorage.setItem(SEEN_PREFIX+(cid||"library"),JSON.stringify(m)); }catch(e){}
  return true;
}

/* ---------- vars: <span data-var="project">project</span> and {{project}} in titles and questions ---------- */
const DEFAULT_VARS = {project:"project"};
const varsOf = course => Object.assign({}, DEFAULT_VARS, (course&&course.vars)||{});
function T(str, course){
  const v=varsOf(course);
  return String(str==null?"":str).replace(/\{\{\s*([\w-]+)\s*\}\}/g,(m,k)=>k in v ? v[k] : m);
}
function fillVars(root, course){
  const v=varsOf(course);
  qa("[data-var]",root).forEach(s=>{ const k=s.getAttribute("data-var"); if(k in v && s.textContent!==v[k]) s.textContent=v[k]; });
}

/* ---------- addresses ---------- */
/* Query parameters that follow a student from page to page. embed does not: a link in an embed opens the page in a tab. */
const KEEP = ["c","instructor","theme","cyu","video","notrack","gadebug"];
function keepQuery(extra){
  const p=new URLSearchParams();
  KEEP.forEach(k=>{ if(Q.has(k)) p.set(k,Q.get(k)); });
  Object.keys(extra||{}).forEach(k=>{ if(extra[k]==null) p.delete(k); else p.set(k,extra[k]); });
  const s=p.toString(); return s ? "?"+s : "";
}
/* base: the path from this page to the folder that holds the lesson pages ("" inside lessons/, "lessons/" at the site root) */
function lessonUrl(base, id, step, extra){ return base+id+".html"+keepQuery(extra)+(step?"#"+step:""); }

/* ---------- lesson links: <a data-lesson="mem">Server memory</a> ---------- */
function linkOne(a, ctx){
  const id=a.getAttribute("data-lesson"); if(!idOK(id)) return;
  a.setAttribute("href", lessonUrl(ctx.base, id, a.getAttribute("data-step")||""));
  if(ctx.embed){ a.setAttribute("target","_blank"); a.setAttribute("rel","noopener"); }
}
function linkLessons(root, ctx){
  qa("a[data-lesson]",root).forEach(a=>linkOne(a,ctx));
}
/* anything a lesson script writes later (innerHTML) is fixed as it appears */
function watch(ctx, course){
  if(!window.MutationObserver) return;
  const mo=new MutationObserver(muts=>{
    for(const m of muts) m.addedNodes.forEach(n=>{
      if(n.nodeType!==1) return;
      if(n.matches && n.matches("a[data-lesson]")) linkOne(n,ctx);
      if(n.matches && n.matches("[data-var]")) fillVars(n.parentNode||n, course);
      if(n.querySelector){ linkLessons(n,ctx); if(n.querySelector("[data-var]")) fillVars(n,course); }
    });
  });
  mo.observe(document.body,{childList:true,subtree:true});
}

/* ---------- course structure ---------- */
function homeOf(course, id){
  if(!course) return null;
  const homes=course.homes||[];
  for(const h of homes) for(const g of h.groups) if(g.lessons.indexOf(id)>=0) return h;
  return null;
}
const orderOf = home => (home.groups||[]).reduce((a,g)=>a.concat(g.lessons),[]);
function lessonInfo(course, id){ return (course.lessons&&course.lessons[id]) || {label:id,title:id,desc:""}; }

/* ---------- display (text size, theme) ---------- */
function displayHtml(cls){
  return '<div class="zoom'+(cls?" "+cls:"")+'" role="group" aria-label="Display"><button type="button" data-display="zout" title="Smaller text" aria-label="Smaller text">A&minus;</button>'+
         '<button type="button" data-display="zin" title="Bigger text" aria-label="Bigger text">A+</button>'+
         '<button type="button" data-display="theme" title="Switch theme">Dark</button></div>';
}

/* ---------- rail ---------- */
function paintSeen(rail, cid){
  const m=seenMap(cid);
  qa(".navitem[data-p]",rail).forEach(a=>a.classList.toggle("seen",!!m[a.dataset.p]));
  qa(".home-group li[data-p]").forEach(li=>li.classList.toggle("seen",!!m[li.dataset.p]));
}
/* The contents list is part of the rail on wide screens. On a phone it is a full-screen panel that the Contents button opens
   (the button reads Close while it is open). Opening closes every group except the one with the current lesson and scrolls to it. */
const PHONE = window.matchMedia ? window.matchMedia("(max-width:820px)") : {matches:false};
function scrollToCurrent(panel){
  const cur=q(".navitem[aria-current=page]",panel); if(!cur) return;
  const sum=cur.parentNode.querySelector("summary");
  const pr=panel.getBoundingClientRect(), pad=parseFloat(getComputedStyle(panel).paddingTop)||0;
  if(sum) panel.scrollTop += sum.getBoundingClientRect().top-(pr.top+pad);
  const ir=cur.getBoundingClientRect();
  if(ir.bottom>pr.bottom-24) panel.scrollTop += ir.bottom-(pr.bottom-24);
}
function navIsOpen(){ return HTML.classList.contains("nav-open"); }
function setNavOpen(open, focus){
  const tg=q(".navtoggle"), panel=q("#navpanel"); if(!tg||!panel) return;
  if(open===navIsOpen()) return;
  HTML.classList.toggle("nav-open",open);
  tg.setAttribute("aria-expanded",String(open)); tg.textContent=open?"Close":"Contents";
  if(open){
    qa("details.navset",panel).forEach(d=>{ d.open=d.classList.contains("cur"); });
    scrollToCurrent(panel);
    if(focus!==false){
      const cur=q(".navitem[aria-current=page]",panel)||q("summary",panel);
      if(cur) try{ cur.focus({preventScroll:true}); }catch(e){}
    }
  } else if(focus!==false) tg.focus();
}
function setupNavToggle(rail){
  const tg=q(".navtoggle",rail), panel=q("#navpanel",rail); if(!tg||!panel) return;
  tg.addEventListener("click",()=>setNavOpen(!navIsOpen()));
  document.addEventListener("keydown",e=>{ if(e.key==="Escape" && navIsOpen()) setNavOpen(false); });
  /* choosing a lesson leaves the page, but a link to this same lesson or step only changes the address */
  panel.addEventListener("click",e=>{ const a=e.target.closest&&e.target.closest("a.navitem"); if(a && a.getAttribute("aria-current")==="page") setNavOpen(false,false); });
  const leave=()=>{ if(navIsOpen() && !PHONE.matches) setNavOpen(false,false); };
  if(PHONE.addEventListener) PHONE.addEventListener("change",leave);
  /* the page behind does not scroll: touches outside the panel, or in a panel with nothing to scroll, do nothing */
  document.addEventListener("touchmove",e=>{
    if(!navIsOpen()) return;
    if(!panel.contains(e.target) || panel.scrollHeight<=panel.clientHeight+1) e.preventDefault();
  },{passive:false});
  window.addEventListener("pageshow",()=>setNavOpen(false,false));
}
/* opts: course, home, current (lesson id or null), lessonBase (path to the lesson pages), homeBase (path to the home pages) */
function buildRail(rail, opts){
  const C=opts.course, H=opts.home, cur=opts.current;
  rail.textContent="";
  const brand=el("div","brand");
  brand.appendChild(el("div","kicker",H.kicker||C.code));
  const h1=el("h1"), a=el("a","homelink"); a.href=opts.homeBase+H.file+keepQuery();
  a.appendChild(el("span","t-full",H.title));
  if(H.short){ a.appendChild(el("span","t-short",H.short)); a.classList.add("has-short"); }
  h1.appendChild(a); brand.appendChild(h1);
  const tg=el("button","navtoggle","Contents"); tg.type="button"; tg.setAttribute("aria-expanded","false"); tg.setAttribute("aria-controls","navpanel"); brand.appendChild(tg);
  if(H.subtitle) brand.appendChild(el("div","sub",H.subtitle));
  if(C.org) brand.appendChild(el("div","org",C.org));
  rail.appendChild(brand);
  const panel=el("div","navpanel"); panel.id="navpanel";
  const nav=el("nav","nav"); nav.id="nav"; nav.setAttribute("aria-label","Lessons");
  H.groups.forEach(g=>{
    const d=el("details","navset"), s=el("summary","navgrp");
    s.appendChild(el("span","gname",g.label));
    s.appendChild(el("span","gcount",g.lessons.length+(g.lessons.length===1?" lesson":" lessons")));
    d.appendChild(s);
    (g.items||g.lessons).forEach(item=>{
      if(typeof item!=="string"){ d.appendChild(el("div","navsub",item.heading)); return; }
      const id=item, info=lessonInfo(C,id);
      const b=el("a","navitem"); b.href=lessonUrl(opts.lessonBase,id); b.dataset.p=id;
      b.appendChild(el("span","lbl",info.label));
      b.appendChild(el("span","tick")).setAttribute("aria-hidden","true");
      b.appendChild(el("span","sr",", visited"));
      if(id===cur){ b.setAttribute("aria-current","page"); d.open=true; d.classList.add("cur"); }
      d.appendChild(b);
    });
    nav.appendChild(d);
  });
  panel.appendChild(nav);
  const foot=el("div","navfoot");
  const links=el("div","navlinks");
  (H.links||[]).forEach(l=>{
    const r=el("a",null,l.label);
    if(l.home){ r.href=opts.homeBase+l.home+keepQuery(); } else { r.href=l.href; r.target="_blank"; r.rel="noopener"; }
    links.appendChild(r);
  });
  if(links.children.length) foot.appendChild(links);
  foot.insertAdjacentHTML("beforeend",displayHtml());
  panel.appendChild(foot);
  rail.appendChild(panel);
  setupNavToggle(rail);
  if(window.Display) window.Display.bind(rail);
  paintSeen(rail, C.id);
  if(!PHONE.matches) scrollToCurrent(nav);
}

/* ---------- course home pages (index.html, machine.html) ---------- */
function initHome(){
  const body=document.body, cid=body.dataset.course, file=body.dataset.home;
  const C=COURSES[cid]; if(!C) return;
  const H=(C.homes||[]).find(h=>h.file===file); if(!H) return;
  const rail=q("#rail"); if(rail) buildRail(rail,{course:C,home:H,current:null,lessonBase:"lessons/",homeBase:""});
  fillVars(document,C);
  qa(".home a[data-lesson]").forEach(a=>{ a.href=lessonUrl("lessons/",a.getAttribute("data-lesson"),"",{c:cid}); });
  paintSeen(document,cid);
}

window.CourseUI = {COURSES, el, qa, q, idOK, seenMap, markSeen, T, fillVars, varsOf, keepQuery, lessonUrl, linkLessons, watch,
                   homeOf, orderOf, lessonInfo, buildRail, paintSeen, displayHtml, initHome, closeNav:()=>setNavOpen(false,false), EMBED};
})();
