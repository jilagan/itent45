/* Lesson attn. Widget code for the markup in lesson.html. */
/* ================= ATTENTION ================= */
/* Weights are hand-set to show what attention does, not read from a model. */
/* The plain-word descriptions below stand in for vectors. The model holds no
   sentences about what a word means, only a position, and the weight is how close
   two positions are. The embedding panels show where those positions come from. */
const ATT=[
 {id:"tired", asks:{it:"a noun that can be tired", tired:"a thing this could describe"},
  offers:{animal:"a living thing that acts, and gets tired",
          street:"a place, a surface, something with width",
          cross:"an action",
          tired:"a state a living thing can be in",
          was:"a grammar word with little meaning of its own"},
  words:["The","animal","didn't","cross","the","street","because","it","was","too","tired","."],
  w:{it:{animal:.62,street:.09,cross:.05,tired:.14,The:.02,didn_t:.03,because:.04,was:.01},
     tired:{animal:.41,it:.28,street:.06,was:.12,too:.09,cross:.04}},
  v:`<b><code>it</code> is looking hardest at <code>animal</code></b>The weight is 0.62 for animal and 0.09 for street, although street is the nearer word. Switch the last word to wide and see what changes.`},
 {id:"wide", asks:{it:"a noun that can be wide", wide:"a thing this could describe"},
  offers:{animal:"a living thing that acts, and gets tired",
          street:"a place, a surface, something with width",
          cross:"an action",
          wide:"a measurement of a surface",
          was:"a grammar word with little meaning of its own"},
  words:["The","animal","didn't","cross","the","street","because","it","was","too","wide","."],
  w:{it:{animal:.11,street:.58,cross:.08,wide:.16,The:.02,didn_t:.02,because:.02,was:.01},
     wide:{street:.47,it:.26,animal:.07,was:.11,too:.06,cross:.03}},
  v:`<b>One word changed and <code>it</code> now points at <code>street</code></b>The weight is 0.58 for street and 0.11 for animal. Each word builds its question from the words around it, so a new last word gives a new question.`}
];
const AS={sel:"tired", word:"it", n:1000};
function attRender(){
  const a=ATT.find(x=>x.id===AS.sel);
  $("#atPick").innerHTML=ATT.map(x=>
    `<button data-a="${x.id}" aria-pressed="${x.id===AS.sel}">…too ${x.id}</button>`).join("");
  $$("#atPick button").forEach(el=>el.onclick=()=>{
    AS.sel=el.dataset.a;
    if(!ATT.find(x=>x.id===AS.sel).w[AS.word]) AS.word="it";
    attRender();
  });
  $("#atSent").innerHTML=a.words.map(w=>{
    const key=w.replace(/'/g,"_").replace(/\./,"");
    const sel=key===AS.word;
    const wt=(a.w[AS.word]||{})[key];
    const op=wt?Math.min(.92,.12+wt*1.3):0;
    return `<span class="wd ${sel?"q":""}" data-w="${key}"
      style="${!sel&&wt?`background:rgba(16,6,159,${op.toFixed(2)});color:${wt>.35?"#fff":"var(--ink)"}`:""}">${w}</span>`;
  }).join(" ");
  $$("#atSent .wd").forEach(el=>el.onclick=()=>{
    if(a.w[el.dataset.w]){ AS.word=el.dataset.w; attRender(); }
  });
  const src=a.w[AS.word]||{};
  $("#atBars").innerHTML=Object.entries(src).sort((x,y)=>y[1]-x[1]).slice(0,6).map(([w,v])=>
    `<div class="pr"><span class="tok">${w.replace(/_/g,"'")}</span>
      <div class="lane"><div class="bar" style="width:${(v/Math.max(...Object.values(src))*100).toFixed(0)}%"></div></div>
      <span class="pc">${v.toFixed(2)}</span></div>`).join("");
  $("#atWho").innerHTML=`Showing what <b style="color:var(--req)">${AS.word.replace(/_/g,"'")}</b> is looking at. Click any highlighted word to switch.`;
  const ask=(a.asks||{})[AS.word];
  if(ask){
    const top=Object.entries(src).sort((x,y)=>y[1]-x[1]).slice(0,3);
    $("#atWhy").innerHTML =
      `<div style="font-size:max(14px,.8em);font-weight:600;color:var(--req);margin-bottom:7px">What ${AS.word.replace(/_/g,"'")} is asking for</div>`+
      `<div style="font-size:.95em;color:var(--ink);margin-bottom:11px">&ldquo;${ask}&rdquo;</div>`+
      `<div style="font-size:max(14px,.8em);font-weight:600;color:var(--res);margin-bottom:7px">What the others offer</div>`+
      top.map(([w,v])=>{
        const off=(a.offers||{})[w] || "no strong meaning of its own";
        const strong=v>.3;
        return `<div style="display:grid;grid-template-columns:96px 1fr 48px;gap:9px;align-items:baseline;
                 padding:5px 0;border-top:1px solid var(--line)">
          <span style="font-family:var(--mono);font-size:.9em;color:${strong?"var(--res)":"var(--faint)"};font-weight:${strong?600:400}">${w.replace(/_/g,"'")}</span>
          <span style="font-size:.9em;color:var(--dim)">${off}</span>
          <span style="font-family:var(--mono);font-size:.9em;text-align:right;color:${strong?"var(--res)":"var(--faint)"}">${v.toFixed(2)}</span></div>`;
      }).join("");
  } else $("#atWhy").innerHTML=`<span style="font-size:.9em;color:var(--faint)">Click <b>it</b> or the last word to see what it is asking for.</span>`;
  $("#atVerdict").className="verdict ok"; $("#atVerdict").innerHTML=a.v;
  attCost();
}
function attCost(){
  const n=AS.n, c=n*n;
  $("#vCtxN").textContent=n.toLocaleString();
  const set=(id,v)=>{$(id).querySelector(".gv").firstChild.nodeValue=v;};
  set("#atComp", c>=1e6 ? (c/1e6).toFixed(1)+" M" : (c/1e3).toFixed(0)+" K");
  set("#atRel", "×"+(c/(1000*1000)).toFixed(c/1e6<10?1:0));
  $("#atCostNote").innerHTML = n<=1000
    ? `A thousand tokens needs a million comparisons. This is the baseline.`
    : `${n.toLocaleString()} tokens needs ${(c/1e6).toFixed(1)} million comparisons. That is <b>${(c/1e6).toFixed(0)}×</b> the work of a thousand-token prompt for ${(n/1000).toFixed(0)}× the text.`;
}
$("#sCtxN").oninput=e=>{AS.n=+e.target.value;attCost()};
attRender();

/* called by the platform after a theme change */
PAGE_HOOKS.redraw=()=>{ try{ attRender(); }catch(e){} };
