const CSSV=(()=>{ const c={};
  const f=n=>{ if(!(n in c)) c[n]=getComputedStyle(document.documentElement).getPropertyValue(n).trim();
               return c[n]||"#888"; };
  f.cache=c; return f; })();
"use strict";
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const REDUCED = matchMedia("(prefers-reduced-motion:reduce)").matches;

/* ================= shell ================= */
/* Routing, sections, embed mode and the nav click handler live in shared/platform.js.
   This file gives it the page-specific parts: relayout hooks and the theme repaint. */
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
/* Called by platform.js whenever a panel or a section becomes visible.
   Rect measurements are all zero while an element is display:none. */
window.PAGE_HOOKS={
  panel:{
    server(){ if(typeof sizeCanvas==="function") sizeCanvas(); },
    pay(){ if(typeof layoutBypass==="function"){ layoutBypass(); placePayBall(pyI); } },
    tiers(){ if(typeof placeBall==="function") placeBall(trI); },
    vm(){ if(typeof elDraw==="function") elDraw(); }
  },
  redraw(){
    ["renderScale","renderQueue","renderCost","elRender","drawQueue","drawSim"].forEach(f=>{
      try{ if(typeof window[f]==="function") window[f](); }catch(e){}
    });
  }
};
let scale=1;
const applyScale=()=>document.documentElement.style.setProperty("--scale",scale);
/* dark reads better on a projector, light screenshots better. */
function setTheme(t){
  document.documentElement.setAttribute("data-theme", t);
  if(typeof CSSV==="function" && CSSV.cache) for(const k in CSSV.cache) delete CSSV.cache[k];
  // anything drawn to a canvas has to be repainted with the new palette
  PAGE_HOOKS.redraw();
}
$("#thBtn").onclick=()=>{
  const now=document.documentElement.getAttribute("data-theme")==="light" ? "dark" : "light";
  setTheme(now);
  $("#thBtn").textContent = now==="light" ? "Dark" : "Light";
};
$("#zIn").onclick =()=>{scale=Math.min(1.5,scale+.1);applyScale();sizeCanvas()};
$("#zOut").onclick=()=>{scale=Math.max(.75,scale-.1);applyScale();sizeCanvas()};

