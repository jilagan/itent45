/* Lesson patterns. Widget code for the markup in lesson.html.
   Three widgets: an order pair counter, a repeat shrinker and a bar chart with one outlier.
   All answers are computed from the data below. */

/* ---------- 1. orders ---------- */
const PT_ITEMS=["Notebook","Pens","Charger","Phone case","Screen protector","Flash drive","Backpack"];
const PT_ORDERS=[
  ["Notebook","Pens"],["Notebook","Pens","Charger"],["Phone case","Screen protector"],["Notebook","Pens","Backpack"],
  ["Charger","Phone case"],["Notebook","Pens","Flash drive"],["Backpack","Screen protector"],["Notebook","Pens"],
  ["Charger","Phone case","Screen protector"],["Flash drive","Backpack"],["Notebook","Pens","Charger"],["Phone case","Charger"]];
const ptCount=sel=>PT_ORDERS.filter(r=>sel.every(x=>r.includes(x))).length;
const ptName=sel=>{ const s=[...sel].sort((a,b)=>PT_ITEMS.indexOf(a)-PT_ITEMS.indexOf(b));
  return {pair:s, text:s[0]+" and "+s[1].toLowerCase()}; };
const PT_COUNTS=[]; PT_ITEMS.forEach((a,i)=>PT_ITEMS.forEach((b,j)=>{ if(i<j) PT_COUNTS.push(ptCount([a,b])); }));
const PT_BEST=Math.max(...PT_COUNTS);
const PT_NEXT=Math.max(...PT_COUNTS.filter(n=>n<PT_BEST));
const ptRc={sel:[], tried:new Set(), best:0};

function ptRcDraw(){
  const sel=ptRc.sel, n=sel.length===2?ptCount(sel):null;
  PT_ITEMS.forEach((it,i)=>$("#ptItems").children[i].setAttribute("aria-pressed",String(sel.includes(it))));
  $("#ptLine").textContent = sel.length===0 ? "Press two items."
    : sel.length===1 ? "Press one more item."
    : ptName(sel).text+": "+n+" of "+PT_ORDERS.length+" orders";
  $("#ptRec").innerHTML=PT_ORDERS.map(r=>{
    const hit=sel.length>0 && sel.every(x=>r.includes(x));
    return `<div class="ptr${hit?" hit":""}">`+r.map(x=>sel.includes(x)?`<b>${x}</b>`:x).join("<br>")+`</div>`;
  }).join("");
  $("#ptTried").textContent=ptRc.tried.size;
  $("#ptBest").textContent=ptRc.best+" of "+PT_ORDERS.length;
  $("#ptCheck").disabled = sel.length!==2;
}
function ptRcPress(item){
  const sel=ptRc.sel, k=sel.indexOf(item);
  if(k>=0) sel.splice(k,1);
  else { sel.push(item); if(sel.length>2) sel.shift(); }
  if(sel.length===2){
    const key=ptName(sel).pair.join("|"); ptRc.tried.add(key);
    ptRc.best=Math.max(ptRc.best,ptCount(sel));
  }
  $("#ptVerdict").className="verdict"; $("#ptVerdict").innerHTML="";
  ptRcDraw();
}
function ptRcCheck(){
  const sel=ptRc.sel; if(sel.length!==2) return;
  const n=ptCount(sel), nm=ptName(sel).text, v=$("#ptVerdict");
  if(n===PT_BEST){
    v.className="verdict ok";
    v.innerHTML=`<b>Most common pair</b>${nm} appear together in ${n} of ${PT_ORDERS.length} orders. The next highest pair appears in ${PT_NEXT}, and you tried ${ptRc.tried.size} pair${ptRc.tried.size===1?"":"s"}.`;
  } else {
    v.className="verdict warn";
    v.innerHTML=`<b>Not the highest count</b>${nm} appear together in ${n} of ${PT_ORDERS.length} orders. Another pair appears more often.`;
  }
}
function ptRcReset(){
  ptRc.sel=[]; ptRc.tried=new Set(); ptRc.best=0;
  $("#ptVerdict").className="verdict"; $("#ptVerdict").innerHTML="";
  ptRcDraw();
}
$("#ptItems").innerHTML=PT_ITEMS.map(it=>`<button type="button" aria-pressed="false">${it}</button>`).join("");
PT_ITEMS.forEach((it,i)=>{ $("#ptItems").children[i].onclick=()=>ptRcPress(it); });
$("#ptCheck").onclick=ptRcCheck;
$("#ptReset").onclick=ptRcReset;
ptRcDraw();

/* ---------- 2. repeats ---------- */
const PT_MSGS=["SSSLSSSLSSSL","SSLSSLSSLSSLSSLSSL","SLSSLSSSLS"];
const PT_MAXLEN=9;
function ptBlock(s,L){
  const chunks=[]; for(let i=0;i<s.length;i+=L) chunks.push(s.slice(i,i+L));
  const first=chunks[0], state=chunks.map(c=>c===first&&c.length===L?"same":"diff");
  return {chunks,state,first,reps:chunks.length,
          valid: s.length%L===0 && chunks.length>=2 && state.every(x=>x==="same")};
}
function ptSmallest(s){ for(let L=1;L<=PT_MAXLEN;L++) if(ptBlock(s,L).valid) return L; return null; }
const ptSh={m:0, L:1, tried:PT_MSGS.map(()=>new Set())};

function ptShDraw(){
  const s=PT_MSGS[ptSh.m], L=ptSh.L, b=ptBlock(s,L), small=ptSmallest(s);
  ptSh.tried[ptSh.m].add(L);
  $$("#ptMsgs button").forEach((el,i)=>el.setAttribute("aria-pressed",String(i===ptSh.m)));
  $("#ptMsg").setAttribute("aria-label","Message "+s+", cut into pieces of "+L);
  $("#ptMsg").innerHTML=b.chunks.map((c,i)=>
    `<span class="ptch ${b.state[i]}" aria-hidden="true">`+[...c].map(x=>`<span class="ptt ${x}">${x}</span>`).join("")+`</span>`).join("");
  $("#ptLen").textContent="Block length "+L;
  $("#ptLess").disabled=L<=1; $("#ptMore").disabled=L>=PT_MAXLEN;
  $("#ptOrig").textContent=s.length;
  $("#ptShort").textContent=b.valid ? String(L+1) : "\u2014";
  $("#ptTry").textContent=ptSh.tried[ptSh.m].size+" of "+PT_MAXLEN;
  const v=$("#ptV2");
  if(b.valid){
    const tail = L===small ? ", the shortest possible."
      : ". A shorter block, "+ptBlock(s,small).first+", gives "+(small+1)+".";
    v.className="verdict ok";
    v.innerHTML=`<b>${b.first} repeated ${b.reps} times</b>The message shrinks from ${s.length} symbols to ${L+1}${tail}`;
  } else if(small===null && ptSh.tried[ptSh.m].size===PT_MAXLEN){
    v.className="verdict warn";
    v.innerHTML=`<b>No block works</b>No length from 1 to ${PT_MAXLEN} rebuilds this message. A message with no repeat cannot be shortened this way.`;
  } else {
    const bad=b.state.findIndex(x=>x==="diff");
    const why = bad===b.chunks.length-1 && b.chunks[bad].length<L && b.state.slice(0,bad).every(x=>x==="same")
      ? "The last piece is shorter than the block." : "Piece "+(bad+1)+" differs from piece 1.";
    v.className="verdict warn";
    v.innerHTML=`<b>No match</b>This block does not rebuild the message. ${why}`;
  }
}
$("#ptMsgs").innerHTML=PT_MSGS.map((s,i)=>`<button type="button" aria-pressed="false">Message ${i+1}</button>`).join("");
$$("#ptMsgs button").forEach((el,i)=>el.onclick=()=>{ ptSh.m=i; ptShDraw(); });
$("#ptLess").onclick=()=>{ if(ptSh.L>1){ ptSh.L--; ptShDraw(); } };
$("#ptMore").onclick=()=>{ if(ptSh.L<PT_MAXLEN){ ptSh.L++; ptShDraw(); } };
$("#ptReset2").onclick=()=>{ ptSh.m=0; ptSh.L=1; ptSh.tried=PT_MSGS.map(()=>new Set()); ptShDraw(); };
ptShDraw();

/* ---------- 3. outlier ---------- */
const PT_DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const PT_DAYS_FULL=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const PT_WEEKS=[[30,32,31,33,45,60,40],[31,30,32,33,46,20,41],[29,31,30,34,44,58,39]];
const PT_TOP=60, PT_BARH=50;
const ptMedian=a=>{ const s=[...a].sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
const PT_OUT=(()=>{ let best=null;
  PT_DAYS.forEach((_,d)=>{ const col=PT_WEEKS.map(w=>w[d]), m=ptMedian(col);
    col.forEach((v,w)=>{ const dev=Math.abs(v-m); if(!best||dev>best.dev) best={w,d,dev}; }); });
  return best; })();
const ptBr={pressed:new Set(), cur:[0,0]};

function ptBarBtn(w,d){ return $("#ptWeeks").querySelector(`[data-w="${w}"][data-d="${d}"]`); }
function ptBarBuild(){
  $("#ptDays").innerHTML=PT_DAYS.map(x=>`<span>${x}</span>`).join("");
  $("#ptWeeks").innerHTML=PT_WEEKS.map((wk,w)=>
    `<div class="ptwk"><div class="ptwl">Week ${w+1}</div><div class="ptgrid">`+
    wk.map((v,d)=>`<button type="button" class="ptb" data-w="${w}" data-d="${d}" tabindex="-1" aria-label="Week ${w+1}, ${PT_DAYS_FULL[d]}, ${v} cups"><i></i><span>${v}</span></button>`).join("")+
    `</div></div>`).join("");
  $$("#ptWeeks .ptb").forEach(el=>{
    const w=+el.dataset.w, d=+el.dataset.d;
    el.querySelector("i").style.height=Math.round(PT_WEEKS[w][d]/PT_TOP*PT_BARH)+"px";
    el.onclick=()=>ptBarPress(w,d);
    el.onfocus=()=>ptBarRove(w,d);
    el.onkeydown=e=>{
      const dw={ArrowUp:-1,ArrowDown:1}[e.key]||0, dd={ArrowLeft:-1,ArrowRight:1}[e.key]||0;
      if(!dw&&!dd) return;
      e.preventDefault();
      const nw=Math.min(PT_WEEKS.length-1,Math.max(0,w+dw)), nd=Math.min(PT_DAYS.length-1,Math.max(0,d+dd));
      ptBarBtn(nw,nd).focus();
    };
  });
  ptBarRove(0,0);
}
function ptBarRove(w,d){
  const old=ptBarBtn(ptBr.cur[0],ptBr.cur[1]); if(old) old.tabIndex=-1;
  ptBr.cur=[w,d]; ptBarBtn(w,d).tabIndex=0;
}
function ptBarClear(){ $$("#ptWeeks .ptb").forEach(el=>el.classList.remove("pick","twin","right")); }
function ptBarPress(w,d){
  ptBr.pressed.add(w+"-"+d);
  ptBarClear();
  const col=PT_WEEKS.map(wk=>wk[d]), v=col[w], day=PT_DAYS_FULL[d];
  PT_WEEKS.forEach((_,i)=>{ if(i!==w) ptBarBtn(i,d).classList.add("twin"); });
  ptBarBtn(w,d).classList.add("pick");
  $("#ptPress").textContent=ptBr.pressed.size;
  const others=col.filter((_,i)=>i!==w), vz=$("#ptV3");
  if(w===PT_OUT.w && d===PT_OUT.d){
    ptBarBtn(w,d).classList.remove("pick"); ptBarBtn(w,d).classList.add("right");
    vz.className="verdict ok";
    vz.innerHTML=`<b>Outlier found</b>${day} of week ${w+1} sold ${v} cups, while the other ${day}s sold ${others.join(" and ")}. The team should find out why before changing its order.`;
  } else if(d===PT_OUT.d){
    vz.className="verdict warn";
    vz.innerHTML=`<b>Look again</b>${day}s sold ${col.join(", ").replace(/, (\d+)$/," and $1")} cups. Two of the three are close, so look at the one that stands apart.`;
  } else {
    vz.className="verdict warn";
    vz.innerHTML=`<b>Follows the pattern</b>${day}s sold ${Math.min(...col)} to ${Math.max(...col)} cups in all three weeks. The same level each week is the pattern.`;
  }
}
function ptBarReset(){
  ptBr.pressed=new Set(); ptBarClear(); $("#ptPress").textContent="0";
  const vz=$("#ptV3"); vz.className="verdict";
  vz.innerHTML="Press a bar to compare it with the same day in the other weeks.";
}
$("#ptReset3").onclick=ptBarReset;
ptBarBuild(); ptBarReset();
