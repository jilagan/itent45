/* Lesson deep. Widget code for the markup in lesson.html. */
/* ================= 03 STACKING LINES ================= */
/* Who drops the course: barely engaged, or carrying far too much. The stayers
   sit in the middle, so no single straight line separates them. */
const NND=[[0.53,0.413,1],[0.437,0.781,1],[0.565,0.437,1],[0.617,0.418,1],[0.652,0.462,1],[0.344,0.588,1],[0.285,0.58,1],[0.431,0.726,1],[0.664,0.595,1],[0.567,0.485,1],[0.478,0.651,1],[0.131,0.681,0],[0.624,0.914,0],[0.77,0.348,0],[0.099,0.489,0],[0.13,0.735,0],[0.189,0.318,0],[0.148,0.479,0],[0.768,0.811,0],[0.228,0.306,0],[0.083,0.455,0],[0.881,0.672,0],[0.836,0.744,0],[0.815,0.758,0],[0.167,0.627,0],[0.255,0.25,0]];
const NNC=[0.5,0.58];
/* phase and radius each unit count settles on, found by search the way training would */
const NNB={1:[3.1416,0.2295],2:[0.0,0.2295],3:[0.5236,0.2295],4:[0.0,0.2295],6:[0.0,0.2295],8:[0.0,0.2295]};
const NN={units:1, lines:true, act:true, pick:null};
function nnFit(k){ const b=NNB[k]||NNB[8]; return {ph:b[0], r:b[1]}; }
function nnInside(x,y,k){
  const {ph,r}=nnFit(k);
  if(!NN.act){
    /* No nonlinearity: the layer can only add its units up, and a sum of straight
       lines is another straight line. Depth buys nothing at all. */
    let sx=0, sy=0;
    for(let i=0;i<k;i++){ const t=2*Math.PI*i/k+ph; sx+=Math.cos(t); sy+=Math.sin(t); }
    return (x-NNC[0])*sx + (y-NNC[1])*sy < r*k*0.34;
  }
  for(let i=0;i<k;i++){
    const t=2*Math.PI*i/k+ph;
    if((x-NNC[0])*Math.cos(t)+(y-NNC[1])*Math.sin(t) >= r) return false;
  }
  return true;
}
const nx=x=>54+x*416, ny=y=>250-y*216;
function nnDiagram(){
  const k=NN.units, W=460, H=Math.max(150, 40+k*26);
  const iy=[H*0.38,H*0.62], hy=[...Array(k)].map((_,i)=>(H/(k+1))*(i+1));
  let g=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  // edges in, edges out
  for(let i=0;i<k;i++){
    const on = NN.pick===i;
    iy.forEach(y=>{ g+=`<line x1="86" y1="${y}" x2="${W/2}" y2="${hy[i]}"
      stroke="${on?"var(--req)":"var(--line2)"}" stroke-width="${on?1.8:0.9}" opacity="${on?1:.5}"/>`; });
    g+=`<line x1="${W/2}" y1="${hy[i]}" x2="${W-110}" y2="${H/2}"
      stroke="${on?"var(--req)":"var(--line2)"}" stroke-width="${on?1.8:0.9}" opacity="${on?1:.5}"/>`;
  }
  ["hours","attendance"].forEach((lb,i)=>{
    g+=`<circle cx="86" cy="${iy[i]}" r="9" fill="var(--panel2)" stroke="var(--res)" stroke-width="1.6"/>
        <text x="70" y="${iy[i]+4}" text-anchor="end" font-size="12.5" fill="var(--dim)">${lb}</text>`;
  });
  for(let i=0;i<k;i++){
    const on=NN.pick===i;
    g+=`<circle class="hu" data-u="${i}" cx="${W/2}" cy="${hy[i]}" r="10"
        fill="${on?"var(--req)":"var(--panel2)"}" fill-opacity="${on?.25:1}"
        stroke="${on?"var(--req)":"var(--line3)"}" stroke-width="${on?2.2:1.6}" style="cursor:pointer"/>`;
  }
  g+=`<circle cx="${W-110}" cy="${H/2}" r="10" fill="var(--panel2)" stroke="var(--res)" stroke-width="1.8"/>
      <text x="${W-94}" y="${H/2+4}" font-size="12.5" fill="var(--dim)">stays or drops</text>
      <text x="86" y="14" text-anchor="middle" font-size="12.5" fill="var(--faint)">Input</text>
      <text x="${W/2}" y="14" text-anchor="middle" font-size="12.5" fill="var(--req)">Hidden layer</text>
      <text x="${W-110}" y="14" text-anchor="middle" font-size="12.5" fill="var(--faint)">Output</text>`;
  $("#nnDiag").innerHTML=g+`</svg>`;
  $$("#nnDiag .hu").forEach(el=>{
    el.onclick=()=>{ NN.pick = NN.pick===+el.dataset.u ? null : +el.dataset.u; nnRender(); };
    el.onmouseenter=()=>{ NN.pick=+el.dataset.u; nnRender(); };
  });
  $("#nnDiagCap").innerHTML = NN.pick===null
    ? `The diagram and the plot show the same network. <b style="color:var(--ink)">Point at any circle in the middle row</b> to see which line on the plot belongs to it.`
    : `That circle is one unit. Its two input weights and a bias set the angle and position of <b style="color:var(--req)">the highlighted line</b> on the plot.`;
}
function nnRender(){
  const k=NN.units, {ph,r}=nnFit(k);
  if(NN.pick!==null && NN.pick>=k) NN.pick=null;
  let svg=`<svg viewBox="0 0 500 290" xmlns="http://www.w3.org/2000/svg">
    <clipPath id="np"><rect x="54" y="26" width="416" height="224"/></clipPath><g clip-path="url(#np)">`;
  // the region the layer as a whole accepts
  let d="";
  for(let gx=0; gx<=100; gx++) for(let gy=0; gy<=54; gy++){
    const x=gx/100, y=gy/54;
    if(nnInside(x,y,k)) d+=`M${nx(x).toFixed(1)},${ny(y).toFixed(1)}h4.2v4.1h-4.2z `;
  }
  svg+=`<path d="${d}" fill="var(--res)" opacity=".13"/>`;
  if(NN.lines){
    for(let i=0;i<k;i++){
      const t=2*Math.PI*i/k+ph, cx=Math.cos(t), cy=Math.sin(t);
      // the line where this unit flips: (p-C)·n = r
      const px=NNC[0]+cx*r, py=NNC[1]+cy*r;
      const dx=-cy, dy=cx, L=2.2;
      const hot = NN.pick===i;
      svg+=`<line x1="${nx(px-dx*L).toFixed(1)}" y1="${ny(py-dy*L).toFixed(1)}"
              x2="${nx(px+dx*L).toFixed(1)}" y2="${ny(py+dy*L).toFixed(1)}"
              stroke="var(--req)" stroke-width="${hot?3:1.5}" opacity="${hot?1:(NN.pick===null?.55:.2)}"/>`;
    }
  }
  svg+=`</g>
    <line x1="54" y1="250" x2="470" y2="250" stroke="var(--line2)"/>
    <line x1="54" y1="26" x2="54" y2="250" stroke="var(--line2)"/>
    <text x="262" y="276" fill="var(--faint)" font-size="13" text-anchor="middle">hours studied</text>
    <text x="18" y="140" fill="var(--faint)" font-size="13" text-anchor="middle" transform="rotate(-90 18 140)">other commitments</text>`;
  let ok=0;
  for(const [x,y,p] of NND){
    const pred=nnInside(x,y,k), right=pred===!!p; if(right) ok++;
    const X=nx(x), Y=ny(y), col=p?"var(--res)":"var(--warn)";
    svg += p
      ? `<circle cx="${X}" cy="${Y}" r="5.5" fill="none" stroke="${col}" stroke-width="2.1"/>`
      : `<path d="M${X-4.6},${Y-4.6} L${X+4.6},${Y+4.6} M${X+4.6},${Y-4.6} L${X-4.6},${Y+4.6}" stroke="${col}" stroke-width="2.2"/>`;
    if(!right) svg+=`<circle cx="${X}" cy="${Y}" r="11" fill="none" stroke="var(--warn)" stroke-width="1.7"/>`;
  }
  $("#nnPlot").innerHTML=svg+`</svg>`;
  nnDiagram();

  const pct=Math.round(ok/NND.length*100);
  const set=(id,v,good)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;g.classList.toggle("good",!!good)};
  set("#nnAcc", pct+"%", pct===100);
  set("#nnUnits", k);
  set("#nnParams", k*3);
  $("#tgLines").setAttribute("aria-pressed", NN.lines);
  $("#tgAct").setAttribute("aria-pressed", NN.act);

  const v=$("#nnVerdict");
  if(!NN.act){
    v.className="verdict bad";
    v.innerHTML=`<b>${pct}% with ${k} units, and the boundary is straight again</b>With the nonlinearity off, a layer can only add its units together, and adding straight lines gives one more straight line. Move the slider from 2 to 8 and nothing changes.`;
  } else if(k===1){
    v.className="verdict bad";
    v.innerHTML=`<b>${pct}%, and no straight line does better</b>One unit is one line, and the students who stay are surrounded, so some always land on the dropouts' side. Add a second unit.`;
  } else if(pct<100){
    v.className="verdict warn";
    v.innerHTML=`<b>${pct}% with ${k} lines</b>A second layer takes all ${k} answers and says <em>stays</em> only when they all agree. The overlap is a shape none of the lines could draw alone.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>100% with ${k} straight lines</b>The boundary is a curve made entirely of straight pieces. A layer cuts the space several times and the next layer combines the cuts, which is the basic idea of a neural network.`;
  }
}
$("#sUnits").oninput=e=>{NN.units=+e.target.value;$("#vUnits").textContent=NN.units;nnRender()};
$("#tgLines").onclick=()=>{NN.lines=!NN.lines;nnRender()};
$("#tgAct").onclick=()=>{NN.act=!NN.act;nnRender()};
nnRender();

/* called by the platform after a theme change */
PAGE_HOOKS.redraw=()=>{ try{ nnRender(); }catch(e){} };
