/* ================= 07 VECTORS ================= */
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
  v:`<b>The direction from man to king is the same as woman to queen</b>Royalty was never encoded anywhere. It fell out of counting which words appear near which other words, across a very large amount of text.`},
 {id:"tokyo", a:"Paris", b:"France", c:"Japan",
  v:`<b>This one is the more impressive of the two</b>The step from France to Paris and the step from Japan to Tokyo are the same movement through the space. That direction means <em>capital of</em>, and it exists without anyone naming it. Try Italy as well.`},
 {id:"bias", a:"programmer", b:"man", c:"woman", lbl:"the contested one",
  v:`<b>This one is a reproduction, and it comes with an argument attached</b>A 2016 paper by Bolukbasi and colleagues reported this analogy from word2vec trained on Google News, and it became the standard illustration of bias in embeddings. The positions here were set by hand to reproduce it.<br><br><b class="i">Then it got complicated.</b> Nissim and colleagues showed in 2020 that the analogy method itself manufactures part of the result. Forcing the search to exclude the input words means it <em>must</em> return something other than <code>programmer</code>, so a gendered-looking answer is partly an artifact of the setup. Turn the toggle off and you can watch that happen.<br><br>What survives the argument is smaller and more useful: an embedding is fitted to a corpus, and regularities in that corpus become geometry. Measuring how much, and how fairly, is harder than the party trick suggests, and the party trick is what everybody repeats.`}
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

  const X=w=>60+WV[w][0]*3.1, Y=w=>28+WV[w][1]*1.28;
  const RX=60+R[0]*3.1, RY=28+R[1]*1.28;
  let svg=`<svg viewBox="0 0 640 300" xmlns="http://www.w3.org/2000/svg">`;
  svg+=`<line x1="${X(q.b)}" y1="${Y(q.b)}" x2="${X(q.a)}" y2="${Y(q.a)}" stroke="var(--req)" stroke-width="1.8" stroke-dasharray="4 3"/>`;
  svg+=`<line x1="${X(q.c)}" y1="${Y(q.c)}" x2="${RX}" y2="${RY}" stroke="var(--req)" stroke-width="1.8" stroke-dasharray="4 3"/>`;
  for(const [w,p] of Object.entries(WV)){
    const isIn=inputs.includes(w), isBest=w===best, skipped=isIn&&VS.exclude;
    svg+=`<circle cx="${X(w)}" cy="${Y(w)}" r="${isIn||isBest?5:3}"
       fill="${isBest?"var(--res)":isIn?"var(--req)":"var(--line3)"}" opacity="${skipped?.4:1}"/>
      <text x="${X(w)+8}" y="${Y(w)+4}" font-family="monospace" font-size="11"
       fill="${isBest?"var(--res)":isIn?"var(--req)":"var(--faint)"}" opacity="${skipped?.5:1}"
       text-decoration="${skipped?"line-through":"none"}"
       font-weight="${isIn||isBest?"600":"400"}">${w}</text>`;

  }
  svg+=`<circle cx="${RX}" cy="${RY}" r="7" fill="none" stroke="var(--res)" stroke-width="2"/>
        <text x="${RX+10}" y="${RY-8}" font-family="monospace" font-size="10" fill="var(--res)">result</text>`;
  $("#vcMap").innerHTML=svg+`</svg>`;

  $("#vcSum").innerHTML=`<span class="kw">${q.a}</span> &minus; <span class="kw">${q.b}</span> + <span class="kw">${q.c}</span>`+
    `\n\n<span class="c">// every word, ranked by distance from the result</span>\n`+
    ranked.slice(0,5).map(([w,d,isIn])=>{
      const skipped=isIn&&VS.exclude, chosen=w===best;
      const mark=chosen?`<span style="color:var(--res)">&rarr;</span>`:"&nbsp;";
      const name=skipped
        ? `<span style="opacity:.45;text-decoration:line-through">${w.padEnd(12)}</span>`
        : `<span style="color:${chosen?"var(--res)":"inherit"}">${w.padEnd(12)}</span>`;
      const tail=skipped?`<span style="color:var(--faint)">   one of your three</span>`:"";
      return `${mark} ${name} ${d.toFixed(1).padStart(5)}${tail}`;
    }).join("\n");

  $("#tgExcl").setAttribute("aria-pressed", VS.exclude);
  $("#tgExcl").innerHTML=`<span class="dot"></span>Do not answer with ${q.a}, ${q.b} or ${q.c}`;
  const v=$("#vcVerdict");
  if(!VS.exclude && inputs.includes(best)){
    v.className="verdict warn";
    v.innerHTML=`<b>The nearest word is ${best}, which is one of the three you started with</b>Read the ranking above. <code>${q.a}</code> sits closer to the result than anything else, because taking away ${q.b} and adding ${q.c} moved the point only part of the way. Most of <code>${q.a}</code> is still in there.<br><br>So the famous demonstration carries a rule nobody mentions: <b class="i">the answer may not be one of the three words you typed</b>. Turn the toggle back on and watch those three get struck out of the list.`;
  } else if(VS.exclude && topOverall!==best){
    v.className="verdict ok";
    v.innerHTML=`<b>${best}, once ${topOverall} is ruled out</b><code>${topOverall}</code> is nearer, and it is struck out above because you started with it. Of the words that remain, <code>${best}</code> is closest.<br><br>${q.v.replace(/^<b>.*?<\/b>/,"")}`;
  } else { v.className="verdict ok"; v.innerHTML=q.v; }
}
$("#tgExcl").onclick=()=>{VS.exclude=!VS.exclude;vecRender()};
vecRender();

/* ---- sentence similarity, as an angle ---- */
const SIMS=[
 {id:"a", t:"How do I sign up for a class?",              deg:8},
 {id:"b", t:"What is the process for course enrolment?",  deg:22},
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
      <span class="vb ${slot===0?"POST":slot===1?"PUT":"GET"}">${on?(slot===0?"ONE":"TWO"):"&nbsp;&nbsp;&nbsp;"}</span>
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
       font-family="monospace" font-size="10.5" fill="${on?"var(--req)":"var(--faint)"}"
       font-weight="${on?"600":"400"}">${x.id.toUpperCase()}</text>`;
  });
  const mid=(lo+hi)/2;
  svg+=`<text x="${ox+72*Math.cos(mid*Math.PI/180)}" y="${oy-72*Math.sin(mid*Math.PI/180)}"
     font-family="monospace" font-size="11" fill="var(--req)">${(hi-lo)}&deg;</text>`;
  svg+=`<line x1="${ox}" y1="${oy}" x2="${ox+R+14}" y2="${oy}" stroke="var(--line2)"/>
        <line x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy-R-14}" stroke="var(--line2)"/>`;
  SIMS.forEach((x,i)=>{
    const on=SIM.pick.includes(x.id);
    svg+=`<text x="250" y="${34+i*26}" font-family="monospace" font-size="10.5"
       fill="${on?"var(--req)":"var(--faint)"}" font-weight="${on?"600":"400"}">${x.id.toUpperCase()}  ${x.t.length>30?x.t.slice(0,29)+"\u2026":x.t}</text>`;
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
    v.innerHTML=`<b>${cos.toFixed(2)}, on ${shared.length} shared word${shared.length===1?"":"s"}</b>${names} are asking the same thing in different vocabulary. As text they barely overlap; as directions they are ${(hi-lo)}&deg; apart, which is almost none.<br><br>A keyword search would connect these two badly or not at all.`;
  } else if(cos<.45 && shared.length>=4){
    v.className="verdict bad";
    v.innerHTML=`<b>${cos.toFixed(2)}, and yet ${shared.length} words in common</b>${names} share <em>${shared.slice(0,5).join(", ")}</em> and mean opposite things. One is joining a class, the other is leaving one.<br><br>A search that counts matching words would rank these as a close pair. The angle says ${(hi-lo)}&deg;, which is most of a right angle. <b class="i">This is the case that makes overlap useless as a measure of meaning.</b>`;
  } else {
    v.className="verdict warn";
    v.innerHTML=`<b>${cos.toFixed(2)} on ${shared.length} shared word${shared.length===1?"":"s"}</b>${names} sit ${(hi-lo)}&deg; apart. Try A against B, then A against C, and compare the two numbers with how much text they have in common.`;
  }
}
simRender();

