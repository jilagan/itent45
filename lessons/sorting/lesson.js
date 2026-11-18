/* Lesson sorting. Two widgets: the card sorter (step "sort") and the halving search (step "halve"). */
(()=>{

/* ---------- card sorter ---------- */
const VALS=[47,12,89,33,65,5,71,24];          /* fixed deck, so the text stays true */
const L="ABCDEFGH";
let S;
function srtReset(){
  S={order:VALS.map((_,i)=>i), sel:[], cmp:0, done:false, line:"No items selected.", tag:{}};
  srtDraw();
  const v=$("#srtVerdict"); v.hidden=true; v.textContent="";
}
function srtDraw(focusId){
  const row=$("#srtRow");
  row.innerHTML=S.order.map((id,pos)=>{
    const sel=S.sel.includes(id), t=S.tag[id]||"";
    const face=S.done?VALS[id]:L[id];
    const lab=S.done?`Item ${L[id]}, value ${VALS[id]}, position ${pos+1}`:`Item ${L[id]}, position ${pos+1}${sel?", selected":""}`;
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
  if(S.sel.length===1 && S.sel[0]===id){ S.sel=[]; S.tag={}; S.line="No items selected."; }
  else{
    if(S.sel.length===2){ S.sel=[]; S.tag={}; }
    S.sel.push(id);
    if(S.sel.length===2){
      const [a,b]=S.sel; S.cmp++;
      const big=VALS[a]>VALS[b]?a:b, small=big===a?b:a;
      S.tag={}; S.tag[big]="larger"; S.tag[small]="smaller";
      S.line=`Item ${L[big]} has a larger value than item ${L[small]}.`;
    } else { S.tag={}; S.line=`Item ${L[id]} is selected. Press a second item.`; }
  }
  srtDraw(id);
}
$("#srtSwap").onclick=()=>{
  if(S.sel.length!==2) return;
  $("#srtVerdict").hidden=true;
  const [a,b]=S.sel, i=S.order.indexOf(a), j=S.order.indexOf(b);
  S.order[i]=b; S.order[j]=a;
  S.line=`Items ${L[a]} and ${L[b]} swapped places.`;
  srtDraw();
  $("#srtSwap").focus();
};
$("#srtCheck").onclick=()=>{
  const ok=S.order.every((id,k)=>k===0||VALS[S.order[k-1]]<VALS[id]);
  const v=$("#srtVerdict"); v.hidden=false;
  if(ok){
    S.done=true; S.sel=[]; S.tag={}; S.line="The values are shown and the items are in order.";
    const n=S.cmp;
    v.className="verdict ok";
    v.innerHTML = n<16
      ? `<b>Sorted in ${n} comparisons.</b>That is fewer than the 16 that always work for eight items, so luck helped. Comparing every pair takes 28.`
      : n>28
      ? `<b>Sorted in ${n} comparisons.</b>That is more than the 28 it takes to compare every pair. The fewest that always work for eight items is 16.`
      : `<b>Sorted in ${n} comparisons.</b>Comparing every pair takes 28. The fewest that always work for eight items is 16.`;
    srtDraw();
  } else {
    v.className="verdict warn";
    v.innerHTML=`<b>Not in order yet.</b>Compare more items and swap the ones that are out of place.`;
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
  $("#hvSizes").innerHTML=SIZES.map(n=>`<button aria-pressed="${n===H.n}" data-n="${n}">${n} entries</button>`).join("");
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
      ? `<b>Found in ${g} ${g===1?"guess":"guesses"}.</b>Checking from the left would have taken ${H.t+1}. Halving needs at most ${mx} for ${H.n} entries.`
      : `<b>Found in ${g} guesses.</b>Guessing the middle of the open cells every time needs at most ${mx} for ${H.n} entries.`;
  } else if(v<t){ H.lo=k+1; H.line=`ID ${v} is lower than ${t}. Every cell to its left is ruled out.`; }
  else { H.hi=k-1; H.line=`ID ${v} is higher than ${t}. Every cell to its right is ruled out.`; }
  hvDraw();
  const b=$(`#hvGrid .hv-cell[data-k="${k}"]`); if(b) b.focus();
}
$("#hvReset").onclick=()=>{ H.round[H.n]++; H.focus=0; hvStart(); $("#hvReset").focus(); };
hvStart();
})();
