const $=(q,r=document)=>r.querySelector(q);
const $$=(q,r=document)=>[...r.querySelectorAll(q)];
const REDUCED=matchMedia("(prefers-reduced-motion: reduce)").matches;
const CSSV=(()=>{const c={};const f=n=>{if(!(n in c))c[n]=getComputedStyle(document.documentElement).getPropertyValue(n).trim();return c[n]||"#888";};f.cache=c;return f;})();
