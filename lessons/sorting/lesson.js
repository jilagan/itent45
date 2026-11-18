/* Lesson sorting. Two widgets: the card sorter (step "sort") and the halving search (step "halve"). */
(()=>{
const css=document.createElement("style");
css.textContent=`
#p-sorting .srt-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 12px}
@media(min-width:640px){#p-sorting .srt-row{grid-template-columns:repeat(8,minmax(0,1fr))}}
#p-sorting .srt-cell{display:flex;flex-direction:column;gap:4px;text-align:center;min-width:0}
#p-sorting .srt-pos{font-size:14px;color:var(--dim)}
#p-sorting .srt-card{min-height:64px;min-width:44px;border:1px solid var(--line2);border-radius:6px;background:var(--bg2);color:var(--ink);font-size:1.15em;font-weight:600;cursor:pointer}
#p-sorting .srt-card[aria-pressed="true"]{border:2px solid var(--req);background:color-mix(in srgb,var(--req) 10%,var(--panel))}
#p-sorting .srt-card.up{background:var(--panel);color:var(--res);border-color:var(--res);cursor:default}
#p-sorting .srt-tag{font-size:14px;min-height:20px;color:var(--dim)}
#p-sorting .srt-tag.hi{color:var(--req);font-weight:600}
#p-sorting .srt-line{min-height:3em;margin:0 0 12px;color:var(--ink)}
#p-sorting .srt-meter{display:flex;flex-wrap:wrap;gap:8px 28px;margin:0 0 14px}
#p-sorting .srt-meter .g{min-width:120px}
#p-sorting .hv-top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;margin:0 0 12px}
#p-sorting .hv-goal{font-size:1.1em}
#p-sorting .hv-goal b{font-family:var(--mono);color:var(--res)}
#p-sorting .hv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(44px,1fr));gap:6px;margin:0 0 12px}
#p-sorting .hv-cell{min-height:44px;padding:0 2px;border:1px solid var(--line2);border-radius:6px;background:var(--bg2);color:var(--dim);font-size:14px;font-weight:600;cursor:pointer}
#p-sorting .hv-cell.seen{background:var(--panel);color:var(--ink);border-color:var(--ink);cursor:default}
#p-sorting .hv-cell.off{background:var(--bg);border:1px dashed var(--line);color:var(--faint);cursor:default;font-weight:400}
#p-sorting .hv-cell.hit{background:var(--res);border-color:var(--res);color:var(--bg);cursor:default}
`;
document.head.appendChild(css);

/* ---------- card sorter ---------- */
const VALS=[47,12,89,33,65,5,71,24];          /* fixed deck, so the text stays true */
const L="ABCDEFGH";
let S;
function srtReset(){
  S={order:VALS.map((_,i)=>i), sel:[], cmp:0, done:false, line:"Press two cards to compare them.", tag:{}};
  srtDraw();
  const v=$("#srtVerdict"); v.hidden=true; v.textContent="";
}
function srtDraw(focusId){
  const row=$("#srtRow");
  row.innerHTML=S.order.map((id,pos)=>{
    const sel=S.sel.includes(id), t=S.tag[id]||"";
    const face=S.done?VALS[id]:L[id];
    const lab=S.done?`Card ${L[id]}, value ${VALS[id]}, position ${pos+1}`:`Card ${L[id]}, position ${pos+1}${sel?", selected":""}`;
    return `<div class="srt-cell"><span class="srt-pos">${pos+1}</span>
      <button class="srt-card${S.done?" up":""}" data-id="${id}" aria-pressed="${sel}" aria-label="${lab}"${S.done?" disabled":""}>${face}</button>
      <span class="srt-tag${t?" hi":""}">${sel&&t?t:""}</span></div>`;}).join("");
  $$(".srt-card",row).forEach(b=>b.onclick=()=>srtPress(+b.dataset.id));
  $("#srtLine").textContent=S.line;
  $("#srtCount").textContent=S.cmp;
  $("#srtSwap").disabled = S.done || S.sel.length!==2;
  $("#srtCheck").disabled = S.done;
  if(focusId!==undefined){ const b=$(`.srt-card[data-id="${focusId}"]`,row); if(b) b.focus(); }
}
function srtPress(id){
  if(S.done) return;
  $("#srtVerdict").hidden=true;
  if(S.sel.length===1 && S.sel[0]===id){ S.sel=[]; S.tag={}; S.line="Press two cards to compare them."; }
  else{
    if(S.sel.length===2){ S.sel=[]; S.tag={}; }
    S.sel.push(id);
    if(S.sel.length===2){
      const [a,b]=S.sel; S.cmp++;
      const big=VALS[a]>VALS[b]?a:b, small=big===a?b:a;
      S.tag={}; S.tag[big]="larger"; S.tag[small]="smaller";
      S.line=`Card ${L[big]} is larger than card ${L[small]}.`;
    } else { S.tag={}; S.line=`Card ${L[id]} is selected. Press a second card.`; }
  }
  srtDraw(id);
}
$("#srtSwap").onclick=()=>{
  if(S.sel.length!==2) return;
  $("#srtVerdict").hidden=true;
  const [a,b]=S.sel, i=S.order.indexOf(a), j=S.order.indexOf(b);
  S.order[i]=b; S.order[j]=a;
  S.line=`Cards ${L[a]} and ${L[b]} swapped places.`;
  srtDraw();
  $("#srtSwap").focus();
};
$("#srtCheck").onclick=()=>{
  const ok=S.order.every((id,k)=>k===0||VALS[S.order[k-1]]<VALS[id]);
  const v=$("#srtVerdict"); v.hidden=false;
  if(ok){
    S.done=true; S.sel=[]; S.tag={}; S.line="The cards are face up and in order.";
    const n=S.cmp;
    v.className="verdict ok";
    v.innerHTML = n<16
      ? `<b>Sorted in ${n} comparisons.</b>That beats the 16 that a careful method needs on any deck, so luck helped. Comparing every pair takes 28.`
      : n>28
      ? `<b>Sorted in ${n} comparisons.</b>That is more than the 28 it takes to compare every pair. Good methods need about 16 for eight cards.`
      : `<b>Sorted in ${n} comparisons.</b>Comparing every pair takes 28. Good methods need about 16 for eight cards.`;
    srtDraw();
  } else {
    v.className="verdict warn";
    v.innerHTML=`<b>Not in order yet.</b>Compare more cards and swap the ones that are out of place.`;
  }
};
$("#srtReset").onclick=()=>{ srtReset(); $("#srtReset").focus(); };
srtReset();

/* ---------- halving search ---------- */
const SIZES=[15,31,63];
const TARGETS={15:[10,2,13], 31:[19,6,28,0], 63:[41,9,60]};   /* fixed cell numbers, counted from 0 */
const val=k=>2100+11*k+((k*k)%7);                              /* rising IDs */
const maxGuesses=n=>Math.floor(Math.log2(n))+1;
let H={n:31, round:{15:0,31:0,63:0}};
function hvStart(){
  const t=TARGETS[H.n][H.round[H.n]%TARGETS[H.n].length];
  Object.assign(H,{t, lo:0, hi:H.n-1, seen:{}, guesses:0, done:false,
    line:"Press any cell to start. The middle cell is a good first guess."});
  $("#hvVerdict").hidden=true;
  hvDraw();
}
function hvDraw(){
  $("#hvTarget").textContent=val(H.t);
  $("#hvSizes").innerHTML=SIZES.map(n=>`<button aria-pressed="${n===H.n}" data-n="${n}">${n} cards</button>`).join("");
  $$("#hvSizes button").forEach(b=>b.onclick=()=>{ H.n=+b.dataset.n; if(b.getAttribute("aria-pressed")==="true") H.round[H.n]++; hvStart(); });
  let html="";
  for(let k=0;k<H.n;k++){
    const open=k>=H.lo&&k<=H.hi, seen=k in H.seen;
    const cls=k===H.t&&H.done?"hit":seen?"seen":open?"":"off";
    const txt=seen||(H.done&&k===H.t)?val(k):open?"?":"";
    const lab=seen?`Cell ${k+1}, ID ${val(k)}`:open?`Cell ${k+1}, not yet pressed`:`Cell ${k+1}, ruled out`;
    html+=`<button class="hv-cell ${cls}" data-k="${k}" tabindex="${k===(H.focus||0)?0:-1}" aria-label="${lab}"${open&&!seen&&!H.done?"":' aria-disabled="true"'}>${txt}</button>`;
  }
  $("#hvGrid").innerHTML=html;
  $$("#hvGrid .hv-cell").forEach(b=>{ b.onclick=()=>hvPress(+b.dataset.k); b.onkeydown=hvKey; });
  $("#hvLine").textContent=H.line;
  $("#hvGuesses").textContent=H.guesses;
  $("#hvOpen").textContent=H.done?1:H.hi-H.lo+1;
}
function hvKey(e){
  const cells=$$("#hvGrid .hv-cell"), k=+e.target.dataset.k;
  const cols=Math.max(1,Math.floor($("#hvGrid").clientWidth/50));
  const mv={ArrowRight:1,ArrowLeft:-1,ArrowDown:cols,ArrowUp:-cols}[e.key];
  let to=mv!==undefined?k+mv:e.key==="Home"?0:e.key==="End"?cells.length-1:null;
  if(to===null) return;
  e.preventDefault(); to=Math.max(0,Math.min(cells.length-1,to));
  cells[k].tabIndex=-1; cells[to].tabIndex=0; cells[to].focus(); H.focus=to;
}
function hvPress(k){
  if(H.done||k<H.lo||k>H.hi||k in H.seen) return;
  H.seen[k]=1; H.guesses++; H.focus=k;
  const v=val(k), t=val(H.t);
  if(k===H.t){
    H.done=true; H.line=`ID ${v} is the one you want.`;
    const g=H.guesses, mx=maxGuesses(H.n), vd=$("#hvVerdict"); vd.hidden=false;
    vd.className="verdict "+(g<=mx?"ok":"warn");
    vd.innerHTML = g<=mx
      ? `<b>Found in ${g} ${g===1?"guess":"guesses"}.</b>Checking from the left would have taken ${H.t+1}. Halving needs at most ${mx} for ${H.n} cards.`
      : `<b>Found in ${g} guesses.</b>Guessing the middle of the open cells every time needs at most ${mx} for ${H.n} cards.`;
  } else if(v<t){ H.lo=k+1; H.line=`ID ${v} is lower than ${t}. Every cell to its left is ruled out.`; }
  else { H.hi=k-1; H.line=`ID ${v} is higher than ${t}. Every cell to its right is ruled out.`; }
  hvDraw();
  const b=$(`#hvGrid .hv-cell[data-k="${k}"]`); if(b) b.focus();
}
$("#hvReset").onclick=()=>{ H.round[H.n]++; H.focus=0; hvStart(); $("#hvReset").focus(); };
hvStart();
})();
