/* Lesson embed. Widget code for the markup in lesson.html. Shared code it needs: lib/placelabels.js. */
/* ================= 06 LEARNING POSITIONS ================= */
/* A small word2vec: co-occurring words attract, everything repels. The layout
   below is computed live from the corpus, not placed. */

const EMC=[["king","queen","palace"],["king","prince","crown"],["queen","princess","crown"],
           ["prince","princess","palace"],["king","queen","crown"],
           ["Paris","France","capital"],["Tokyo","Japan","capital"],["Paris","France","city"],
           ["Tokyo","Japan","city"],["Paris","Tokyo","city"],
           ["doctor","nurse","hospital"],["doctor","patient","hospital"],
           ["nurse","patient","hospital"],["doctor","nurse","patient"]];
const EMV=[...new Set(EMC.flat())].sort();
const EMG={royal:["king","queen","prince","princess","crown","palace"],
           places:["Paris","France","Tokyo","Japan","capital","city"],
           medical:["doctor","nurse","patient","hospital"]};
const emGroupOf=w=>Object.keys(EMG).find(g=>EMG[g].includes(w));
const EMCOL={royal:"var(--res)", places:"var(--req)", medical:"var(--line3)"};
const EM={pos:{}, seen:0, last:null, timer:null};
function emScatter(){
  let s=7;
  const rnd=()=>{ s=(s*16807)%2147483647; return s/2147483647*2-1; };
  EMV.forEach(w=>EM.pos[w]=[rnd()*0.9, rnd()*0.9]);
  EM.seen=0; EM.last=null;
}
function emOne(sent){
  const lr=0.12;
  for(let i=0;i<sent.length;i++) for(let j=i+1;j<sent.length;j++){
    const a=EM.pos[sent[i]], b=EM.pos[sent[j]];
    for(let d=0;d<2;d++){ const g=(a[d]-b[d])*lr; a[d]-=g; b[d]+=g; }
  }
  for(let x=0;x<EMV.length;x++) for(let y=x+1;y<EMV.length;y++){
    const a=EM.pos[EMV[x]], b=EM.pos[EMV[y]];
    const dx=a[0]-b[0], dy=a[1]-b[1], d2=dx*dx+dy*dy+0.02, f=lr*0.04/d2;
    a[0]+=dx*f; a[1]+=dy*f; b[0]-=dx*f; b[1]-=dy*f;
  }
  EM.seen++; EM.last=sent;
}
function emSep(){
  const dist=(a,b)=>Math.hypot(EM.pos[a][0]-EM.pos[b][0], EM.pos[a][1]-EM.pos[b][1]);
  let inn=[], out=[];
  for(const g of Object.keys(EMG)){
    const ws=EMG[g];
    for(let i=0;i<ws.length;i++){
      for(let j=i+1;j<ws.length;j++) inn.push(dist(ws[i],ws[j]));
      for(const g2 of Object.keys(EMG)) if(g2!==g) for(const b of EMG[g2]) out.push(dist(ws[i],b));
    }
  }
  const m=a=>a.reduce((x,y)=>x+y,0)/a.length;
  return m(out)/Math.max(m(inn),1e-6);
}
function emRender(){
  const xs=EMV.map(w=>EM.pos[w][0]), ys=EMV.map(w=>EM.pos[w][1]);
  const pad=0.6, x0=Math.min(...xs)-pad, x1=Math.max(...xs)+pad;
  const y0=Math.min(...ys)-pad, y1=Math.max(...ys)+pad;
  const X=v=>30+((v-x0)/(x1-x0||1))*580, Y=v=>26+((v-y0)/(y1-y0||1))*248;
  let svg=`<svg viewBox="0 0 640 300" xmlns="http://www.w3.org/2000/svg">`;
  if(EM.last) for(let i=0;i<EM.last.length;i++) for(let j=i+1;j<EM.last.length;j++)
    svg+=`<line x1="${X(EM.pos[EM.last[i]][0])}" y1="${Y(EM.pos[EM.last[i]][1])}"
            x2="${X(EM.pos[EM.last[j]][0])}" y2="${Y(EM.pos[EM.last[j]][1])}"
            stroke="var(--req)" stroke-width="1.5" opacity=".55" stroke-dasharray="3 3"/>`;
  const hotOf=w=>EM.last&&EM.last.includes(w);
  const order=[...EMV].sort((p,q)=>(hotOf(q)?1:0)-(hotOf(p)?1:0));
  const pl=placeLabels(order.map(w=>({text:w,cx:X(EM.pos[w][0]),cy:Y(EM.pos[w][1]),r:hotOf(w)?5:3.5})),13.5,640,300);
  order.forEach(w=>{
    const g=emGroupOf(w);
    svg+=`<circle cx="${X(EM.pos[w][0])}" cy="${Y(EM.pos[w][1])}" r="${hotOf(w)?5:3.5}" fill="${EMCOL[g]}"/>`;
  });
  order.forEach((w,k)=>{
    const g=emGroupOf(w), L=pl[k];
    svg+=`<text x="${L.x.toFixed(1)}" y="${L.y.toFixed(1)}" text-anchor="${L.an}" font-family="monospace" font-size="13.5"
        fill="${EMCOL[g]}" font-weight="${hotOf(w)?700:400}">${w}</text>`;
  });
  $("#emMap").innerHTML=svg+`</svg>`;
  $("#emFeed").innerHTML = EM.last
    ? `<span class="c">Sentence ${EM.seen}</span>\n<span class="kw">${EM.last.join("  ")}</span>\n<span class="c">These three words have moved closer together. All other words drifted slightly apart.</span>`
    : `<span class="c">No sentences read yet. Every word is still at its starting position.</span>`;
  const sep=EM.seen?emSep():null;
  const set=(id,v,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;g.classList.toggle("good",!!good)};
  set("#emSeen", EM.seen);
  set("#emSep", sep===null?"\u2014":sep.toFixed(1)+"\u00d7", sep!==null&&sep>6);
  const v=$("#emVerdict");
  if(EM.seen===0){ v.className="verdict";
    v.innerHTML=`<b>Sixteen words at random positions</b>The words have no grouping yet. Press <em>Run the training</em>.`;
  } else if(sep<5){ v.className="verdict warn";
    v.innerHTML=`<b>${EM.seen} sentences in, groups ${sep.toFixed(1)}× apart</b>Words are starting to move toward the words they appear with. Keep going.`;
  } else { v.className="verdict ok";
    v.innerHTML=`<b>Three clusters have formed</b>Words from different groups are now <strong>${sep.toFixed(1)}×</strong> further apart than words in the same group. Nobody named the groups.`;
  }
}
$("#emStep").onclick=()=>{ emOne(EMC[EM.seen % EMC.length]); emRender(); };
$("#emRun").onclick=()=>{
  clearInterval(EM.timer); emScatter(); emRender();
  let n=0;
  EM.timer=setInterval(()=>{
    for(let i=0;i<16;i++) emOne(EMC[(n*16+i) % EMC.length]);
    n++; emRender();
    if(n>=50){ clearInterval(EM.timer); }
  }, REDUCED?0:60);
};
$("#emReset").onclick=()=>{ clearInterval(EM.timer); emScatter(); emRender(); };
emScatter();
$("#emCorpus").innerHTML=EMC.map((s,i)=>`<span class="c">${String(i+1).padStart(2)}</span>  ${s.join("  ")}`).join("\n");
emRender();

/* called by the platform after a theme change */
PAGE_HOOKS.redraw=()=>{ try{ emRender(); }catch(e){} };
