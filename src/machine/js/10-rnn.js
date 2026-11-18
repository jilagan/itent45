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
       <div style="margin-top:12px;font-family:var(--sans);font-size:.82em;color:var(--warn)">
         The words have been thrown away. They were read once and discarded, one at a time.</div>
       <div style="margin-top:14px;padding-top:13px;border-top:1px solid var(--line);
                   font-family:var(--sans);font-size:.95em;color:var(--ink)">
         <b style="color:var(--req)">The question:</b> in that sentence, what did <code>it</code> refer to?</div>`;
  } else {
    $("#rnSent").innerHTML=W.map((w,k)=>{
      const read=k<at, now=k===at-1;
      return `<span class="wd" style="opacity:${read?1:.25};${now?"background:rgba(194,65,12,.18);color:var(--req);font-weight:600":""}">${w}</span>`;
    }).join(" ")+' <span style="opacity:.25">.</span>';
  }
  $("#rnCaption").innerHTML = asking ? "" : at===0
    ? "Nothing read yet. The note is blank."
    : at===N ? "Whole sentence read. Now press the button once more."
             : `Read ${at} of ${N} words. The word just read is the loudest thing on the note.`;

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
  }).join("") : `<p style="margin:0;font-size:.8em;color:var(--faint)">The note is empty.</p>`;

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
      `<span class="c">// it has to choose, and all it can do is take the louder one</span>\n`+
      `it  &rarr;  <span class="kw">${picked}</span>\n`+
      `<span class="c">// the sentence actually meant ${q.ref}</span>\n`+
      `<span style="color:${right?"var(--res)":"var(--warn)"};font-weight:600">${right?"correct" : "wrong"}</span>`;
  }
  $("#rnStep").textContent = asking ? "Asked" : at<N ? "Read the next word" : "Now ask it the question";
  $("#rnStep").disabled = asking;
  $("#rnStep").style.opacity = asking ? .45 : 1;

  const v=$("#rnVerdict");
  if(at===0 && !asking){ v.className="verdict";
    v.innerHTML=`<b>An empty note</b>The model reads one word at a time. After each word it rewrites a single fixed-size note and <b class="i">throws the word away</b>. Read the sentence, then ask it a question about what it read.`; return; }
  if(!asking && at<N){ v.className="verdict";
    v.innerHTML=`<b>${at} of ${N} words</b>Each new word goes onto the note at full strength and pushes everything already there down. Nothing is being decided yet; it is only reading.`; return; }
  if(!asking){ v.className="verdict warn";
    v.innerHTML=`<b>Read to the end, and the note is all that survived</b>The sentence is about to become unavailable. Press the button once more and see what the model has to work with.`; return; }
  const picked = surv("street")>surv("animal") ? "street" : "animal";
  const right = picked===q.ref;
  v.className="verdict "+(right?"warn":"bad");
  v.innerHTML = right
    ? `<b>It answered <code>street</code>, and this time street was right</b>Do not be reassured. It did not pick street because <em>wide</em> fits a road. It picked street because street was read four words later than animal and so survived at ${surv("street").toFixed(0)}% against ${surv("animal").toFixed(0)}%.<br><br>The same note, on the same two candidates, would answer <code>street</code> whatever the last word said. Switch to the other sentence and watch it give the identical answer to a different question.`
    : `<b>It answered <code>street</code>. The sentence meant <code>animal</code>.</b>Two nouns could be what <code>it</code> stood for. Choosing between them needs both of them still legible on the note, and one of them is not: <code>street</code> is at ${surv("street").toFixed(0)}%, <code>animal</code> at ${surv("animal").toFixed(0)}%.<br><br>So it takes the louder one. Not the one that fits <em>tired</em>, because fitting requires holding both candidates side by side and it can no longer see one of them. <b class="i">Street was never chosen. It was the only one still audible.</b><br><br>And it cannot re-read the sentence to check, because the sentence is gone. Now switch to the other version: the answer does not change, which is the clearest sign that nothing about meaning was involved.`
}
$("#rnStep").onclick=()=>{ const q=RNS.find(x=>x.id===RN.sel); if(RN.at<=q.w.length){RN.at++;rnRender();} };
$("#rnAll").onclick=()=>{ RN.at=RNS.find(x=>x.id===RN.sel).w.length+1; rnRender(); };
$("#rnReset").onclick=()=>{ RN.at=0; rnRender(); };
rnRender();

