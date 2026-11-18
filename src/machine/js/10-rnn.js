/* ================= 06 RECURRENT ================= */
/* Same two sentences as the attention panel, so the comparison is exact.
   The last stage is the point: the words are discarded and only the note remains. */
const RNS=[
 {id:"tired", adj:"tired", ref:"animal", wrong:"street",
  w:["The","animal","didn't","cross","the","street","because","it","was","too","tired"]},
 {id:"wide",  adj:"wide",  ref:"street", wrong:"animal",
  w:["The","animal","didn't","cross","the","street","because","it","was","too","wide"]}
];
const RNDECAY=0.72;
const RN={sel:"tired", at:0};
function rnRender(){
  const q=RNS.find(x=>x.id===RN.sel), W=q.w;
  const N=W.length, at=Math.min(RN.at,N), asking=RN.at>N;
  $("#rnPick").innerHTML=RNS.map(x=>
    `<button data-r="${x.id}" aria-pressed="${x.id===RN.sel}">&hellip;too ${x.adj}</button>`).join("");
  $$("#rnPick button").forEach(el=>el.onclick=()=>{RN.sel=el.dataset.r;RN.at=0;rnRender()});

  if(asking){
    $("#rnSent").innerHTML=
      `<div style="opacity:.22;text-decoration:line-through">${W.join(" ")} .</div>
       <div style="margin-top:12px;font-family:var(--sans);color:var(--warn)">
         The sentence is gone. Each word was read once and then discarded.</div>
       <div style="margin-top:14px;padding-top:13px;border-top:1px solid var(--line);
                   font-family:var(--sans);color:var(--ink)">
         <b style="color:var(--req)">Question:</b> in that sentence, what did <code>it</code> refer to?</div>`;
  } else {
    $("#rnSent").innerHTML=W.map((w,k)=>{
      const read=k<at, now=k===at-1;
      return `<span class="wd" style="opacity:${read?1:.25};${now?"background:rgba(194,65,12,.18);color:var(--req);font-weight:600":""}">${w}</span>`;
    }).join(" ")+' <span style="opacity:.25">.</span>';
  }
  $("#rnCaption").innerHTML = asking ? "" : at===0
    ? "Nothing read yet. The note is blank."
    : at===N ? "Whole sentence read. Now press the button once more."
             : `Read ${at} of ${N} words. The word read most recently is the strongest item on the note.`;

  const share={};
  for(let k=0;k<at;k++) share[W[k]+"_"+k]=Math.pow(RNDECAY, at-1-k);
  let rows=Object.entries(share).sort((a,b)=>b[1]-a[1]).slice(0,6);
  if(asking){                       // keep the two words the question turns on
    [q.adj,q.ref].forEach(w=>{
      if(!rows.some(([k])=>k.split("_")[0]===w)){
        const hit=Object.entries(share).find(([k])=>k.split("_")[0]===w);
        if(hit){ rows=rows.slice(0,5); rows.push(hit); }
      }
    });
    rows.sort((a,b)=>b[1]-a[1]);
  }
  const mx=rows.length?rows[0][1]:1;
  $("#rnBars").innerHTML = rows.length ? rows.map(([k,v])=>{
    const w=k.split("_")[0], key=asking&&(w===q.adj||w===q.ref);
    return `<div class="pr"><span class="tok" style="color:${key?"var(--req)":"inherit"};opacity:${v<0.2&&!key?.5:1}">${w}</span>
      <div class="lane"><div class="bar" style="width:${(v/mx*100).toFixed(0)}%;background:${v<0.2?"var(--line3)":"var(--res)"}"></div></div>
      <span class="pc">${(v*100).toFixed(0)}%</span></div>`;
  }).join("") : `<p style="margin:0;color:var(--faint)">The note is empty.</p>`;

  const idxOf=w=>W.indexOf(w);
  const surv=w=>at>idxOf(w) ? Math.pow(RNDECAY, at-1-idxOf(w))*100 : 0;
  const NOUNS=["animal","street"];
  $("#rnAnsBox").style.display = asking ? "" : "none";
  if(asking){
    const cand=NOUNS.map(w=>[w,surv(w)]).sort((a,b)=>b[1]-a[1]);
    const mxc=cand[0][1];
    $("#rnCand").innerHTML=cand.map(([w,v],i)=>
      `<div class="pr"><span class="tok" style="color:${i===0?"var(--req)":"var(--faint)"};font-weight:${i===0?600:400}">${w}</span>
        <div class="lane"><div class="bar" style="width:${(v/mxc*100).toFixed(0)}%;background:${i===0?"var(--req)":"var(--line3)"}"></div></div>
        <span class="pc">${v.toFixed(0)}%</span></div>`).join("");
    const picked=cand[0][0], right=picked===q.ref;
    $("#rnAnswer").innerHTML=
      `<span class="c">The model has to choose. It only knows how strong each word is on the note, so it takes the stronger one.</span>\n`+
      `it  &rarr;  <span class="kw">${picked}</span>\n`+
      `<span class="c">The sentence meant ${q.ref}.</span>\n`+
      `<span style="color:${right?"var(--res)":"var(--warn)"};font-weight:600">${right?"correct" : "wrong"}</span>`;
  }
  $("#rnStep").textContent = asking ? "Asked" : at<N ? "Read the next word" : "Ask the question";
  $("#rnStep").disabled = asking;
  $("#rnStep").style.opacity = asking ? .45 : 1;

  const v=$("#rnVerdict");
  if(at===0 && !asking){ v.className="verdict";
    v.innerHTML=`<b>The note is empty</b>The model reads one word at a time. After each word it rewrites a single fixed-size note and throws the word away. Read the sentence, then ask a question about what was read.`; return; }
  if(!asking && at<N){ v.className="verdict";
    v.innerHTML=`<b>${at} of ${N} words read</b>Each new word goes onto the note at full strength, and everything already on the note becomes weaker. The model is only reading at this stage and has not decided anything.`; return; }
  if(!asking){ v.className="verdict warn";
    v.innerHTML=`<b>The whole sentence has been read</b>The note is all that remains. Press the button once more to see what the model has to work with.`; return; }
  const picked = surv("street")>surv("animal") ? "street" : "animal";
  const right = picked===q.ref;
  v.className="verdict "+(right?"warn":"bad");
  v.innerHTML = right
    ? `<b>It answered <code>street</code>, and street is correct this time</b>This is luck. The model picked street because street was read four words after animal, so more of it was still on the note: ${surv("street").toFixed(0)}% against ${surv("animal").toFixed(0)}%. The meaning of <em>wide</em> played no part.<br><br>The note would give the answer <code>street</code> whatever the last word said. Switch to the other sentence and the answer stays the same, although the question has changed.`
    : `<b>It answered <code>street</code>, but the sentence meant <code>animal</code></b>Either of two nouns could be what <code>it</code> stands for. To choose between them, the model needs both nouns to be clear on the note, and one of them is not: <code>street</code> is at ${surv("street").toFixed(0)}% and <code>animal</code> is at ${surv("animal").toFixed(0)}%.<br><br>So it takes the stronger one. Choosing the noun that fits <em>tired</em> needs both candidates in view, and <code>animal</code> has faded. The model chose street because street is the noun still strong on the note.<br><br>The model cannot read the sentence again to check, because the sentence is gone. Switch to the other version. The answer stays street, which shows that meaning played no part.`
}
$("#rnStep").onclick=()=>{ const q=RNS.find(x=>x.id===RN.sel); if(RN.at<=q.w.length){RN.at++;rnRender();} };
$("#rnAll").onclick=()=>{ RN.at=RNS.find(x=>x.id===RN.sel).w.length+1; rnRender(); };
$("#rnReset").onclick=()=>{ RN.at=0; rnRender(); };
rnRender();

