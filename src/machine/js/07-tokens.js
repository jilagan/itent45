/* ================= 03 TOKENS ================= */
/* Hand-checked splits for the demo sentences. Arbitrary text falls back to a
   rough BPE-shaped splitter, and the panel says so rather than pretending. */
const TKS=[
 {id:"straw", label:"strawberry", raw:"How many r's are in strawberry?",
  toks:["How"," many"," r","'s"," are"," in"," str","aw","berry","?"],
  v:`<b>The word arrived in three pieces</b><code>str</code>, <code>aw</code>, <code>berry</code>. The model is not being careless when it miscounts; it never received the letters. Two of the three r's are buried inside chunks it treats as single symbols.<br><br>Ask it to <em>spell the word out first</em> and accuracy jumps, because now the letters exist as separate tokens it can count.`},
 {id:"en", label:"English", raw:"Please enrol me in the data structures class this term.",
  toks:["Please"," en","rol"," me"," in"," the"," data"," structures"," class"," this"," term","."],
  v:`<b>About four characters a token</b>Common English words are usually one token each. That ratio comes from what the tokenizer was fitted to, and most of that was English.`},
 {id:"tl", label:"Tagalog", raw:"Pakisuyo, i-enrol mo ako sa klase ng data structures ngayong semestre.",
  toks:["Pak","is","uy","o",","," i","-","en","rol"," mo"," ako"," sa"," kl","ase"," ng"," data"," structures"," ngay","ong"," sem","est","re","."],
  v:`<b>Same sentence, nearly twice the tokens</b>Words that were common in the training text became single tokens. Words that were not get shattered into fragments. <code>Pakisuyo</code> takes four tokens; <code>Please</code> takes one.<br><br>The consequence is not academic: the same app costs more per message in Filipino, fills its context window faster, and hits the size limit sooner. That was never a decision anyone made. It fell out of the training mix.`},
 {id:"code", label:"Code", raw:"if slots > 0:\n    slots -= 1",
  toks:["if"," slots"," >"," 0",":","\n","   "," slots"," -","="," 1"],
  v:`<b>Code fragments hardest of all</b>Punctuation, operators and indentation each cost a token. That is part of why pasting a large file eats the window so quickly, and why the same logic costs more to send as code than as prose.`}
];
let tkSel="straw";
function roughSplit(s){
  return s.match(/\s*\w+|\s*[^\w\s]|\s+/g)?.flatMap(t=>
    t.trim().length>6 ? [t.slice(0,4),t.slice(4)] : [t]) || [];
}
function tkRender(){
  const t=TKS.find(x=>x.id===tkSel);
  $("#tkPick").innerHTML=TKS.map(x=>
    `<button data-t="${x.id}" aria-pressed="${x.id===tkSel}">${x.label}</button>`).join("");
  $$("#tkPick button").forEach(el=>el.onclick=()=>{tkSel=el.dataset.t;tkRender()});
  $("#tkRaw").textContent=t.raw;
  $("#tkChips").innerHTML=t.toks.map((k,i)=>
    `<span class="chip ${i%2?"b":"a"}">${k.replace(/ /g,"·").replace(/\n/g,"⏎").replace(/</g,"&lt;")}</span>`).join("");
  const set=(id,v)=>{$(id).querySelector(".gv").firstChild.nodeValue=v;};
  set("#tkChars", t.raw.length);
  set("#tkToks", t.toks.length);
  set("#tkRatio", (t.raw.length/t.toks.length).toFixed(1));
  $("#tkVerdict").className="verdict "+(t.id==="tl"||t.id==="straw"?"bad":"ok");
  $("#tkVerdict").innerHTML=t.v;
}
tkRender();

