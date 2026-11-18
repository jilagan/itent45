const CSSV=(()=>{ const c={};
  const f=n=>{ if(!(n in c)) c[n]=getComputedStyle(document.documentElement).getPropertyValue(n).trim();
               return c[n]||"#888"; };
  f.cache=c; return f; })();
"use strict";
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const REDUCED = matchMedia("(prefers-reduced-motion:reduce)").matches;

/* ================= shell ================= */
$$("#nav button").forEach(b=>b.addEventListener("click",()=>{
  $$("#nav button").forEach(x=>x.setAttribute("aria-selected", x===b));
  $$(".panel").forEach(p=>p.classList.remove("on"));
  $("#p-"+b.dataset.p).classList.add("on");
  if(b.dataset.p==="server") sizeCanvas();
  // rect measurements are all zero while a panel is display:none
  if(b.dataset.p==="pay"   && typeof layoutBypass==="function"){ layoutBypass(); placePayBall(pyI); }
  if(b.dataset.p==="tiers" && typeof placeBall==="function")   { placeBall(trI); }
}));
let scale=1;
const applyScale=()=>document.documentElement.style.setProperty("--scale",scale);
/* dark reads better on a projector, light screenshots better. Keys: t */
function setTheme(t){
  document.documentElement.setAttribute("data-theme", t);
  if(typeof CSSV==="function" && CSSV.cache) for(const k in CSSV.cache) delete CSSV.cache[k];
  // anything drawn to a canvas has to be repainted with the new palette
  ["renderScale","renderQueue","renderCost","elRender","drawQueue"].forEach(f=>{
    try{ if(typeof window[f]==="function") window[f](); }catch(e){}
  });
}
$("#thBtn").onclick=()=>{
  const now=document.documentElement.getAttribute("data-theme")==="light" ? "dark" : "light";
  setTheme(now);
  $("#thBtn").textContent = now==="light" ? "Dark" : "Light";
};
$("#zIn").onclick =()=>{scale=Math.min(1.5,scale+.1);applyScale();sizeCanvas()};
$("#zOut").onclick=()=>{scale=Math.max(.75,scale-.1);applyScale();sizeCanvas()};

