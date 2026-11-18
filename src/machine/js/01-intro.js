/* ================= 00 WHAT THE WORDS MEAN ================= */
const RINGS=[
 {k:"ai",  label:"Artificial intelligence", r:132},
 {k:"ml",  label:"Machine learning",        r:106},
 {k:"dl",  label:"Deep learning",           r:80},
 {k:"gen", label:"Generative AI",           r:54}
];
const SYSTEMS=[
 {id:"chess", n:"A chess engine", sub:"searches millions of positions ahead", ring:"ai",
  v:`<b>Artificial intelligence without machine learning</b>Deep Blue beat the world champion, Garry Kasparov, in 1997. It searched through far more chess positions than a person can, and it scored each position with a formula that grandmasters helped write. The program did not learn from its games. Its developers adjusted it by hand between games.<br><br>This is the case people forget: <b class="i">intelligent behavior without any learning</b>.`},
 {id:"route", n:"Route finding in a map app", sub:"shortest path across a road network", ring:"ai",
  v:`<b>Artificial intelligence without machine learning</b>The core is an algorithm (a fixed set of steps) from the 1950s that finds the cheapest path through a road network. Someone wrote the rule down completely, and it gives the correct answer every time, which you could check by hand.<br><br>The live traffic prediction added on top of it is machine learning. The route finding underneath is not.`},
 {id:"spam", n:"A spam filter", sub:"trained on a million labeled emails", ring:"ml",
  v:`<b>Machine learning without deep learning</b>The rule was never written down. People supplied a large pile of emails already marked spam or not spam, and the program worked out the dividing line itself. How that works is covered later in "Training and test data".<br><br>A person still chose what to measure: how many links, whether the sender is known, which words appear. Each of those measurements is a feature. Choosing features is the job that deep learning takes over.`},
 {id:"credit", n:"A credit scoring model", sub:"predicts who will miss a payment", ring:"ml",
  v:`<b>Machine learning without deep learning</b>The model is fitted to past borrowers and what happened to them. It is often kept simple on purpose, because a lender may have to explain a refusal to a regulator, and simple models can be explained.<br><br>Sometimes a more powerful method is ruled out for reasons that have nothing to do with accuracy.`},
 {id:"face", n:"Face grouping in your photos", sub:"sorts ten years of pictures by person", ring:"dl",
  v:`<b>Deep learning</b>Nobody wrote down what a face looks like or which features matter. Stacked layers worked out on their own that edges matter, then that certain arrangements of edges matter, and so on until the layers could tell faces apart. Stacked layers are covered later in "Neural networks".<br><br>This can also run on a phone, with no internet connection.`},
 {id:"speech", n:"Speech to text", sub:"dictation on your phone", ring:"dl",
  v:`<b>Deep learning</b>For decades this was built by hand, using the basic sounds of a language, pronunciation dictionaries, and rules for how sounds run together. Deep learning replaced nearly all of that by learning directly from audio paired with written transcripts.<br><br>Accuracy improved so much that the older approach is now rarely used.`},
 {id:"llm", n:"A model drafting an email", sub:"you describe it, a paragraph comes back", ring:"gen",
  v:`<b>Generative AI, the innermost circle</b>It is deep learning, so everything in the two circles outside it still applies. The addition is the output, which is new content and not a yes or no answer.<br><br>A spam filter answers with one of two labels. This writes something that did not exist before, and a person has to read it and judge it. The rest of this module is about this circle.`},
 {id:"code", n:"A coding assistant", sub:"writes the function you asked for", ring:"gen",
  v:`<b>Generative AI, the innermost circle</b>It uses the same machinery as the email example, applied to code. The later panels on agents, tool calls and AI-written code cover what happens when a tool like this takes actions as well as making suggestions.`}
];
const RINGTAG={ai:"AI",ml:"ML",dl:"Deep",gen:"Gen AI"};
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
    svg+=`<text x="210" y="${i===3?162:158-r.r+19}" text-anchor="middle"
       font-size="12" paint-order="stroke" stroke="var(--bg)" stroke-width="4" stroke-linejoin="round" fill="${isTarget?"var(--req)":on?"var(--res)":"var(--faint)"}"
       font-weight="${isTarget?"700":"400"}">${r.label}</text>`;
  });
  if(sel) svg+=`<circle cx="210" cy="${158+RINGS[idx(sel.ring)].r-13}" r="5" fill="var(--req)"/>`;
  $("#inRings").innerHTML=svg+`</svg>`;

  $("#inList").innerHTML=SYSTEMS.map(x=>`
    <button class="rq${x.id===inSel?" on":""}" data-i="${x.id}">
      <span class="vb ${x.ring==="gen"?"POST":x.ring==="dl"?"PUT":x.ring==="ml"?"PATCH":"GET"}">${RINGTAG[x.ring]}</span>
      <span class="pt">${x.n}<small>${x.sub}</small></span>
    </button>`).join("");
  $$("#inList .rq").forEach(el=>el.onclick=()=>{inSel=el.dataset.i;inRender()});

  const v=$("#inVerdict");
  if(!sel){ v.className="verdict";
    v.innerHTML=`<b>Four circles, each inside the last</b>A system in an inner circle also belongs to every circle around it. A coding assistant is generative AI, deep learning, machine learning and artificial intelligence all at once.<br><br>Select a system on the right to see which circles it falls inside.`;
  } else { v.className="verdict ok"; v.innerHTML=sel.v; }
}
inRender();

