/* lib/core.js: the globals every lesson page has. Always loaded first.
   $ and $$ select, ICO builds an icon from the sprite, REDUCED is the reduced-motion preference,
   CSSV reads a CSS variable (cached; the cache is cleared when the theme changes).
   PAGE_HOOKS lets a lesson tell the platform what to do when it becomes visible or the theme changes:
     PAGE_HOOKS.show   = () => { ... }   called when the lesson, a step or a More detail is shown (measure layout here)
     PAGE_HOOKS.redraw = () => { ... }   called after the theme changes (repaint canvases here)
   Display.setTheme, Display.toggleTheme and Display.zoom are used by the Display buttons that the platform builds. */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const ICO=(n,c)=>`<svg class="ico ${c||""}" aria-hidden="true" focusable="false"><use href="#i-${n}"/></svg>`;
const REDUCED = matchMedia("(prefers-reduced-motion:reduce)").matches;
const CSSV=(()=>{ const c={};
  const f=n=>{ if(!(n in c)) c[n]=getComputedStyle(document.documentElement).getPropertyValue(n).trim();
               return c[n]||"#888"; };
  f.cache=c; return f; })();

/* html classes and the theme, from the address: ?embed=1  ?instructor=1  ?theme=dark */
{ const q=new URLSearchParams(location.search), h=document.documentElement;
  if(q.get("embed")==="1") h.classList.add("embed");
  if(q.get("instructor")==="1") h.classList.add("instructor");
  if(q.get("theme")==="dark"||q.get("theme")==="light") h.setAttribute("data-theme",q.get("theme"));
}

/* Single-key shortcuts must not fire with Ctrl, Cmd or Alt held, inside form fields, or in embed mode.
   Every keydown listener added to window or document is wrapped once. */
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

window.PAGE_HOOKS={show:null, redraw:null};

/* theme and text size (the Display buttons) */
window.Display=(()=>{
  let scale=1;
  const html=document.documentElement;
  const hooks=()=>{ try{ if(PAGE_HOOKS.show) PAGE_HOOKS.show(); }catch(e){} window.dispatchEvent(new Event("resize")); };
  function setTheme(t){
    html.setAttribute("data-theme", t);
    for(const k in CSSV.cache) delete CSSV.cache[k];
    try{ if(PAGE_HOOKS.redraw) PAGE_HOOKS.redraw(); }catch(e){}   // canvases repaint with the new palette
    $$("[data-display=theme]").forEach(b=>b.textContent = t==="light" ? "Dark" : "Light");
  }
  const toggleTheme=()=>setTheme(html.getAttribute("data-theme")==="light" ? "dark" : "light");
  function zoom(d){ scale=Math.max(.75,Math.min(1.5,Math.round((scale+d)*100)/100)); html.style.setProperty("--scale",scale); hooks(); }
  /* the buttons are made by the platform; this wires any that are on the page */
  function bind(root){
    $$("[data-display=theme]",root).forEach(b=>{ b.onclick=toggleTheme; b.textContent = html.getAttribute("data-theme")==="light" ? "Dark" : "Light"; });
    $$("[data-display=zin]",root).forEach(b=>b.onclick=()=>zoom(.1));
    $$("[data-display=zout]",root).forEach(b=>b.onclick=()=>zoom(-.1));
  }
  return {setTheme, toggleTheme, zoom, bind};
})();
