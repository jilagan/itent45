/* ================= 00 WHAT THE WORDS MEAN ================= */
const RINGS=[
 {k:"ai",  label:"Artificial intelligence", r:132},
 {k:"ml",  label:"Machine learning",        r:100},
 {k:"dl",  label:"Deep learning",           r:70},
 {k:"gen", label:"Generative AI",           r:42}
];
const SYSTEMS=[
 {id:"chess", n:"A chess engine", sub:"searches millions of positions ahead", ring:"ai",
  v:`<b>Artificial intelligence, and nothing further in</b>Deep Blue beat Kasparov in 1997 by searching further and faster than a person can, using an evaluation function that grandmasters helped write. It learned nothing during the match and nothing between matches.<br><br>This is the case people forget. <b class="i">Intelligent behavior without any learning at all</b>, and it held the world championship.`},
 {id:"route", n:"Route finding in a map app", sub:"shortest path across a road network", ring:"ai",
  v:`<b>Artificial intelligence, and nothing further in</b>The core is an algorithm from 1956 that finds the cheapest path through a graph. Somebody wrote the rule down completely, and it is correct every time for reasons you could check by hand.<br><br>Live traffic prediction sitting on top of it is machine learning. The route finding underneath it is not.`},
 {id:"spam", n:"A spam filter", sub:"trained on a million labelled emails", ring:"ml",
  v:`<b>Machine learning, but not deep learning</b>The rule was never written down. Somebody supplied a large pile of emails already marked spam or not, and the program worked out the boundary itself. That is panel 02.<br><br>A person still chose what to measure: how many links, whether the sender is known, which words appear. That choosing is the job deep learning takes over.`},
 {id:"credit", n:"A credit scoring model", sub:"predicts who will miss a payment", ring:"ml",
  v:`<b>Machine learning, but not deep learning</b>Fitted to past borrowers and what happened to them. Often deliberately kept simple, because a lender may have to explain a refusal to a regulator, and simple models can be explained.<br><br>That constraint is worth noticing: sometimes the more powerful method is ruled out for reasons that have nothing to do with accuracy.`},
 {id:"face", n:"Face grouping in your photos", sub:"sorts ten years of pictures by person", ring:"dl",
  v:`<b>Deep learning</b>The definition of a face appears nowhere, and neither does a list of features. Stacked layers worked out on their own that edges matter, then that certain arrangements of edges matter, and so on until faces fell out. That is panel 05.<br><br>It also runs on your phone, offline, in the time it takes to open the app.`},
 {id:"speech", n:"Speech to text", sub:"dictation on your phone", ring:"dl",
  v:`<b>Deep learning</b>For decades this was hand-built: phonemes, pronunciation dictionaries, rules for how sounds run together. Deep learning replaced nearly all of that by learning directly from audio paired with transcripts.<br><br>The accuracy jump was large enough that the older approach is effectively gone.`},
 {id:"llm", n:"A model drafting an email", sub:"you describe it, a paragraph comes back", ring:"gen",
  v:`<b>Generative AI, the innermost circle</b>It is deep learning, so everything in the two rings outside it still applies. What is added is the output: an artifact rather than a verdict.<br><br>A spam filter answers with one bit. This answers with something previously unwritten, which has to be read and judged. Everything from panel 02 onwards is about this circle.`},
 {id:"code", n:"A coding assistant", sub:"writes the function you asked for", ring:"gen",
  v:`<b>Generative AI, the innermost circle</b>The same machinery as the email, pointed at code. That is what puts it in this course, and the last three panels are about what happens when one of these takes actions instead of only making suggestions.`}
];
let inSel=null;
function inRender(){
  const sel=SYSTEMS.find(x=>x.id===inSel);
  const active=sel?sel.ring:null;
  const idx=k=>RINGS.findIndex(r=>r.k===k);
  let svg=`<svg viewBox="0 0 420 300" xmlns="http://www.w3.org/2000/svg">`;
  RINGS.forEach((r,i)=>{
    const on = active && idx(active)>=i;
    const isTarget = active===r.k;
    svg+=`<circle cx="210" cy="158" r="${r.r}" fill="${on?"var(--res)":"var(--line3)"}"
       fill-opacity="${isTarget?.16:on?.07:.04}"
       stroke="${isTarget?"var(--req)":on?"var(--res)":"var(--line2)"}"
       stroke-width="${isTarget?2.4:1.2}"/>`;
    svg+=`<text x="210" y="${158-r.r+15}" text-anchor="middle" font-family="monospace"
       font-size="${i===0?11:10}" fill="${isTarget?"var(--req)":on?"var(--res)":"var(--faint)"}"
       font-weight="${isTarget?"700":"400"}">${r.label}</text>`;
  });
  if(sel) svg+=`<circle cx="210" cy="${158+RINGS[idx(sel.ring)].r-24}" r="5" fill="var(--req)"/>`;
  $("#inRings").innerHTML=svg+`</svg>`;

  $("#inList").innerHTML=SYSTEMS.map(x=>`
    <button class="rq${x.id===inSel?" on":""}" data-i="${x.id}">
      <span class="vb ${x.ring==="gen"?"POST":x.ring==="dl"?"PUT":x.ring==="ml"?"PATCH":"GET"}">${x.ring.toUpperCase()}</span>
      <span class="pt">${x.n}<small>${x.sub}</small></span>
    </button>`).join("");
  $$("#inList .rq").forEach(el=>el.onclick=()=>{inSel=el.dataset.i;inRender()});

  const v=$("#inVerdict");
  if(!sel){ v.className="verdict";
    v.innerHTML=`<b>Four rings, each inside the last</b>Everything in an inner circle is also everything outside it. A coding assistant is generative, and deep, and machine learning, and artificial intelligence, all at once.<br><br>Click any system on the right and see how far in it goes.`;
  } else { v.className="verdict ok"; v.innerHTML=sel.v; }
}
inRender();

