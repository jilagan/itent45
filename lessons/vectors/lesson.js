/* Lesson vectors. Widget code for the markup in lesson.html. Shared code it needs: lib/placelabels.js. */
/* ================= VECTORS ================= */
/* Coordinates are hand-placed so the classic relationships hold. A teaching
   model of a real embedding space, not a projection of one. */
const WV={
 king:[62,30], queen:[62,64], man:[24,30], woman:[24,64],
 prince:[44,16], princess:[40,70], France:[20,140], Paris:[74,140],
 Japan:[20,178], Tokyo:[74,178], Italy:[20,200], Rome:[74,200],
 programmer:[128,30], homemaker:[128,64], doctor:[156,26], nurse:[156,68]
};
const SUMS=[
 {id:"queen", a:"king", b:"man", c:"woman",
  v:`<b>Man to king is the same step as woman to queen</b>A relationship between words shows up as a direction on the plot. Nobody told the model what royalty is, and the pattern comes from which words appear near which across a very large amount of text.`},
 {id:"tokyo", a:"Paris", b:"France", c:"Japan",
  v:`<b>France to Paris is the same step as Japan to Tokyo</b>That step stands for <em>capital of</em>, and nobody named it. Italy and Rome on the plot follow the same step.`},
 {id:"bias", a:"programmer", b:"man", c:"woman", lbl:"programmer &minus; man + woman (disputed)",
  v:`<b>This example is disputed</b>A 2016 paper reported this analogy in a real model, and these positions were set by hand to reproduce it. Later work showed that the method of searching for the answer produces part of the result.`}
];
const VS={sel:"queen", exclude:true};
function vecRender(){
  const q=SUMS.find(x=>x.id===VS.sel);
  $("#vcPick").innerHTML=SUMS.map(x=>
    `<button data-v="${x.id}" aria-pressed="${x.id===VS.sel}">${x.lbl||(x.a+" &minus; "+x.b+" + "+x.c)}</button>`).join("");
  $$("#vcPick button").forEach(el=>el.onclick=()=>{VS.sel=el.dataset.v;vecRender()});

  const A=WV[q.a],B=WV[q.b],C=WV[q.c];
  const K=0.4;   // the result keeps much of the source vector, so the inputs have to be excluded
  const R=[A[0]-K*B[0]+K*C[0], A[1]-K*B[1]+K*C[1]];
  const inputs=[q.a,q.b,q.c];
  /* rank everything, always. Exclusion decides which ranked word may be the answer,
     so the skipped ones stay on screen with a line through them. */
  const ranked=Object.entries(WV)
    .map(([w,p])=>[w, Math.hypot(p[0]-R[0], p[1]-R[1]), inputs.includes(w)])
    .sort((a,b)=>a[1]-b[1]);
  const best=(VS.exclude ? ranked.find(r=>!r[2]) : ranked[0])[0];
  const topOverall=ranked[0][0];

  const X=w=>30+(WV[w][0]-14)*3.7, Y=w=>24+(WV[w][1]-16)*1.4;
  const RX=30+(R[0]-14)*3.7, RY=24+(R[1]-16)*1.4;
  let svg=`<svg viewBox="0 0 640 300" xmlns="http://www.w3.org/2000/svg">`;
  svg+=`<line x1="${X(q.b)}" y1="${Y(q.b)}" x2="${X(q.a)}" y2="${Y(q.a)}" stroke="var(--req)" stroke-width="1.8" stroke-dasharray="4 3"/>`;
  svg+=`<line x1="${X(q.c)}" y1="${Y(q.c)}" x2="${RX}" y2="${RY}" stroke="var(--req)" stroke-width="1.8" stroke-dasharray="4 3"/>`;
  const ws=Object.keys(WV);
  const rank=w=>w===best?0:inputs.includes(w)?1:2;
  const items=ws.map(w=>({w,text:w,cx:X(w),cy:Y(w),r:inputs.includes(w)||w===best?5:3}));
  items.push({w:"\u0000result",text:"result",cx:RX,cy:RY,r:7});
  const order=items.map((it,i)=>i).sort((p,q)=>(items[p].w==="\u0000result"?-1:rank(items[p].w))-(items[q].w==="\u0000result"?-1:rank(items[q].w)));
  const pl=placeLabels(order.map(i=>items[i]),13.5,640,300,[[X(q.b),Y(q.b),X(q.a),Y(q.a)],[X(q.c),Y(q.c),RX,RY]]);
  order.forEach((i,k)=>{
    const it=items[i], L=pl[k], w=it.w;
    if(w==="\u0000result"){
      svg+=`<text x="${L.x.toFixed(1)}" y="${L.y.toFixed(1)}" text-anchor="${L.an}" font-family="monospace" font-size="13.5" fill="var(--res)" font-weight="600">result</text>`;
      return;
    }
    const isIn=inputs.includes(w), isBest=w===best, skipped=isIn&&VS.exclude;
    svg+=`<text x="${L.x.toFixed(1)}" y="${L.y.toFixed(1)}" text-anchor="${L.an}" font-family="monospace" font-size="13.5"
       fill="${isBest?"var(--res)":isIn?"var(--req)":"var(--faint)"}" opacity="${skipped?.55:1}"
       text-decoration="${skipped?"line-through":"none"}"
       font-weight="${isIn||isBest?"600":"400"}">${w}</text>`;
  });
  for(const w of ws){
    const isIn=inputs.includes(w), isBest=w===best, skipped=isIn&&VS.exclude;
    svg+=`<circle cx="${X(w)}" cy="${Y(w)}" r="${isIn||isBest?5:3}"
       fill="${isBest?"var(--res)":isIn?"var(--req)":"var(--line3)"}" opacity="${skipped?.4:1}"/>`;
  }
  svg+=`<circle cx="${RX}" cy="${RY}" r="7" fill="none" stroke="var(--res)" stroke-width="2"/>`;
  $("#vcMap").innerHTML=svg+`</svg>`;

  $("#vcSum").innerHTML=`<span class="kw">${q.a}</span> &minus; <span class="kw">${q.b}</span> + <span class="kw">${q.c}</span>`+
    `\n\n<span class="c">The five words nearest the result, closest first</span>\n`+
    ranked.slice(0,5).map(([w,d,isIn])=>{
      const skipped=isIn&&VS.exclude, chosen=w===best;
      const mark=chosen?`<span style="color:var(--res)">&rarr;</span>`:"&nbsp;";
      const name=skipped
        ? `<span style="opacity:.45;text-decoration:line-through">${w.padEnd(12)}</span>`
        : `<span style="color:${chosen?"var(--res)":"inherit"}">${w.padEnd(12)}</span>`;
      const tail=skipped?`<span style="color:var(--faint)">   one of the three input words</span>`:"";
      return `${mark} ${name} ${d.toFixed(1).padStart(5)}${tail}`;
    }).join("\n");

  $("#tgExcl").setAttribute("aria-pressed", VS.exclude);
  $("#tgExcl").innerHTML=`<span class="dot"></span>Do not answer with ${q.a}, ${q.b} or ${q.c}`;
  const v=$("#vcVerdict");
  if(!VS.exclude && inputs.includes(best)){
    v.className="verdict warn";
    v.innerHTML=`<b>The nearest word is ${best}, one of the three input words</b>Taking away ${q.b} and adding ${q.c} moves the point only part of the way, so most of ${q.a} is still there. The well-known demonstration rules out the input words.`;
  } else { v.className="verdict ok"; v.innerHTML=q.v; }
}
$("#tgExcl").onclick=()=>{VS.exclude=!VS.exclude;vecRender()};
vecRender();

/* ---- sentence similarity, as an angle ---- */
const SIMS=[
 {id:"a", t:"How do I sign up for a class?",              deg:8},
 {id:"b", t:"What is the process for course enrollment?",  deg:22},
 {id:"c", t:"How do I drop a class?",                     deg:80},
 {id:"d", t:"How do I withdraw from a subject?",          deg:92}
];
const SIM={pick:["a","c"]};
const simTok=t=>new Set((t.toLowerCase().match(/[a-z]+/g)||[]));
function simRender(){
  const [p1,p2]=SIM.pick.map(id=>SIMS.find(x=>x.id===id));
  $("#simList").innerHTML=SIMS.map(x=>{
    const on=SIM.pick.includes(x.id), slot=SIM.pick.indexOf(x.id);
    return `<button class="rq${on?" on":""}" data-s="${x.id}">
      <span class="vb ${slot===0?"POST":slot===1?"PUT":"GET"}">${on?(slot===0?"One":"Two"):"&nbsp;&nbsp;&nbsp;"}</span>
      <span class="pt">${x.t}</span></button>`;
  }).join("");
  $$("#simList .rq").forEach(el=>el.onclick=()=>{
    const id=el.dataset.s;
    if(SIM.pick.includes(id)) return;
    SIM.pick=[SIM.pick[1], id];
    simRender();
  });

  const R=140, ox=48, oy=214;
  const pt=d=>[ox+R*Math.cos(d*Math.PI/180), oy-R*Math.sin(d*Math.PI/180)];
  let svg=`<svg viewBox="0 0 470 250" xmlns="http://www.w3.org/2000/svg">`;
  const lo=Math.min(p1.deg,p2.deg), hi=Math.max(p1.deg,p2.deg);
  const [ax,ay]=pt(lo), [bx,by]=pt(hi);
  svg+=`<path d="M${ox},${oy} L${ox+56*Math.cos(lo*Math.PI/180)},${oy-56*Math.sin(lo*Math.PI/180)}
        A56,56 0 0,0 ${ox+56*Math.cos(hi*Math.PI/180)},${oy-56*Math.sin(hi*Math.PI/180)} Z"
        fill="var(--req)" opacity=".13"/>`;
  SIMS.forEach(x=>{
    const on=SIM.pick.includes(x.id);
    const [px,py]=pt(x.deg);
    svg+=`<line x1="${ox}" y1="${oy}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}"
       stroke="${on?"var(--req)":"var(--line2)"}" stroke-width="${on?2.6:1.2}" opacity="${on?1:.5}"/>
      <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${on?5:3}" fill="${on?"var(--req)":"var(--line3)"}"/>
      <text x="${(px+ (x.deg>60?4:10)).toFixed(1)}" y="${(py-7).toFixed(1)}"
       font-family="monospace" font-size="13" fill="${on?"var(--req)":"var(--faint)"}"
       font-weight="${on?"600":"400"}">${x.id.toUpperCase()}</text>`;
  });
  const mid=(lo+hi)/2;
  svg+=`<text x="${ox+72*Math.cos(mid*Math.PI/180)}" y="${oy-72*Math.sin(mid*Math.PI/180)}"
     font-family="monospace" font-size="13" fill="var(--req)">${(hi-lo)}&deg;</text>`;
  svg+=`<line x1="${ox}" y1="${oy}" x2="${ox+R+14}" y2="${oy}" stroke="var(--line2)"/>
        <line x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy-R-14}" stroke="var(--line2)"/>`;
  SIMS.forEach((x,i)=>{
    const on=SIM.pick.includes(x.id);
    svg+=`<text x="250" y="${34+i*26}" font-family="monospace" font-size="12"
       fill="${on?"var(--req)":"var(--faint)"}" font-weight="${on?"600":"400"}">${x.id.toUpperCase()}  ${x.t.length>27?x.t.slice(0,26)+"\u2026":x.t}</text>`;
  });
  $("#simMap").innerHTML=svg+`</svg>`;

  const cos=Math.cos((hi-lo)*Math.PI/180);
  const shared=[...simTok(p1.t)].filter(w=>simTok(p2.t).has(w));
  const set=(id,v,hot,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot);g.classList.toggle("good",!!good)};
  set("#simScore", cos.toFixed(2), cos<.4, cos>.85);
  set("#simWords", shared.length, false, false);

  const v=$("#simVerdict");
  const names=`<code>${p1.id.toUpperCase()}</code> and <code>${p2.id.toUpperCase()}</code>`;
  if(cos>.85 && shared.length<=1){
    v.className="verdict ok";
    v.innerHTML=`<b>${cos.toFixed(2)} with ${shared.length} shared word${shared.length===1?"":"s"}</b>${names} ask the same thing in different words, so a keyword search would miss the match. Their arrows are only ${(hi-lo)}&deg; apart.`;
  } else if(cos<.45 && shared.length>=4){
    v.className="verdict bad";
    v.innerHTML=`<b>${cos.toFixed(2)} with ${shared.length} words in common</b>${names} share <em>${shared.slice(0,5).join(", ")}</em> and mean opposite things, so counting shared words would rank them as a close pair. Their arrows are ${(hi-lo)}&deg; apart.`;
  } else {
    v.className="verdict warn";
    v.innerHTML=`<b>${cos.toFixed(2)} with ${shared.length} shared word${shared.length===1?"":"s"}</b>${names} are ${(hi-lo)}&deg; apart. Try A with B, then A with C, and compare the scores with the shared words.`;
  }
}
simRender();

/* called by the platform after a theme change */
PAGE_HOOKS.redraw=()=>{ try{ vecRender(); }catch(e){} };
