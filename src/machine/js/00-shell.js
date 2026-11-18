const $=(q,r=document)=>r.querySelector(q);
const $$=(q,r=document)=>[...r.querySelectorAll(q)];
const REDUCED=matchMedia("(prefers-reduced-motion: reduce)").matches;
const CSSV=(()=>{const c={};const f=n=>{if(!(n in c))c[n]=getComputedStyle(document.documentElement).getPropertyValue(n).trim();return c[n]||"#888";};f.cache=c;return f;})();
/* Routing, sections, embed mode and the nav click handler live in shared/platform.js.
   This file gives it the page-specific parts. */
{ const q=new URLSearchParams(location.search), h=document.documentElement;
  if(q.get("embed")==="1") h.classList.add("embed");
  if(q.get("instructor")==="1") h.classList.add("instructor");
  if(q.get("theme")==="dark"||q.get("theme")==="light"){ h.setAttribute("data-theme",q.get("theme"));
    const tb=document.getElementById("thBtn"); if(tb) tb.textContent = q.get("theme")==="light" ? "Dark" : "Light"; }
}
/* Single-key shortcuts must not fire with Ctrl, Cmd or Alt held, inside form fields,
   or in embed mode. Every keydown listener added to window or document is wrapped once. */
(()=>{ const add=EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener=function(t,fn,o){
    if(t==="keydown" && (this===window||this===document) && typeof fn==="function" && !fn.__guarded){
      const g=function(e){
        if(e.ctrlKey||e.metaKey||e.altKey) return;
        if(document.documentElement.classList.contains("embed")) return;
        const t=e.target;
        if(t && t.closest && t.closest("input,textarea,select,[contenteditable],[contenteditable=true]")) return;
        return fn.call(this,e); };
      g.__guarded=true; return add.call(this,t,g,o);
    }
    return add.call(this,t,fn,o); };
})();
/* Called by platform.js whenever a panel or a section becomes visible. This page is all SVG
   with a viewBox, so no panel needs a relayout hook. */
window.PAGE_HOOKS={ panel:{}, redraw(){ if(typeof redrawAll==="function") redrawAll(); } };
