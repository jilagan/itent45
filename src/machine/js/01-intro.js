/* ================= 00 WHAT THE WORDS MEAN ================= */
const RINGS=[
 {k:"ai",  label:"Artificial intelligence", r:132},
 {k:"ml",  label:"Machine learning",        r:106},
 {k:"dl",  label:"Deep learning",           r:80},
 {k:"gen", label:"Generative AI",           r:54}
];
const SYSTEMS=[
 {id:"chess", n:"A chess engine", sub:"searches millions of positions ahead", ring:"ai",
  v:`<b>Artificial intelligence without machine learning</b>Deep Blue beat the world champion, Garry Kasparov, in 1997 by searching far more positions than a person can. Its developers adjusted it by hand between games, and it learned nothing from them.`},
 {id:"route", n:"Route finding in a map app", sub:"shortest path across a road network", ring:"ai",
  v:`<b>Artificial intelligence without machine learning</b>The core is a fixed set of steps from the 1950s that finds the cheapest path through a road network. The live traffic prediction on top is machine learning, and the route finding underneath is not.`},
 {id:"spam", n:"A spam filter", sub:"trained on a million labeled emails", ring:"ml",
  v:`<b>Machine learning without deep learning</b>People supplied emails already marked spam or not spam, and the program worked out the dividing line itself. A person still chose what to measure, such as how many links an email has, and each measurement is called a feature.`},
 {id:"credit", n:"A credit scoring model", sub:"predicts who will miss a payment", ring:"ml",
  v:`<b>Machine learning without deep learning</b>The model is fitted to past borrowers and what happened to them. It is often kept simple because a lender may have to explain a refusal to a regulator.`},
 {id:"face", n:"Face grouping in your photos", sub:"sorts ten years of pictures by person", ring:"dl",
  v:`<b>Deep learning</b>Nobody wrote down what a face looks like. Stacked layers worked out for themselves which patterns matter, from edges up to whole faces.`},
 {id:"speech", n:"Speech to text", sub:"dictation on your phone", ring:"dl",
  v:`<b>Deep learning</b>For decades this was built by hand from pronunciation dictionaries and sound rules. Deep learning replaced most of that by learning from audio paired with written transcripts.`},
 {id:"llm", n:"A model drafting an email", sub:"you describe it, a paragraph comes back", ring:"gen",
  v:`<b>Generative AI, the innermost circle</b>It is deep learning whose output is new content. A person has to read the draft and judge it.`},
 {id:"code", n:"A coding assistant", sub:"writes the function you asked for", ring:"gen",
  v:`<b>Generative AI, the innermost circle</b>It uses the same machinery as the email example, applied to code. A person has to review what it writes.`}
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
    v.innerHTML=`<b>Four circles, each inside the last</b>A system in an inner circle also belongs to every circle around it. Select a system in the list to see where it falls.`;
  } else { v.className="verdict ok"; v.innerHTML=sel.v; }
}
inRender();

