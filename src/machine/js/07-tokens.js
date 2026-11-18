/* ================= 03 TOKENS ================= */
/* Hand-checked splits for the demo sentences. */
const TKS=[
 {id:"straw", label:"strawberry", raw:"How many r's are in strawberry?",
  toks:["How"," many"," r","'s"," are"," in"," str","aw","berry","?"],
  v:`<b>The word arrived as three tokens</b><code>str</code>, <code>aw</code> and <code>berry</code>. The model never received the letters one by one, so counting them is hard for it. All three r's are inside chunks: one in <code>str</code> and two in <code>berry</code>.<br><br>If you ask it to <em>spell the word out first</em>, accuracy usually improves, because each letter then becomes a separate token that it can count.`},
 {id:"en", label:"English", raw:"Please enroll me in the data structures class this term.",
  toks:["Please"," en","roll"," me"," in"," the"," data"," structures"," class"," this"," term","."],
  v:`<b>About four characters per token</b>Common English words are usually one token each. The ratio is high because the tokenizer was built mostly from English text.`},
 {id:"tl", label:"Tagalog", raw:"Pakisuyo, i-enroll mo ako sa klase ng data structures ngayong semestre.",
  toks:["Pak","is","uy","o",","," i","-","en","roll"," mo"," ako"," sa"," kl","ase"," ng"," data"," structures"," ngay","ong"," sem","est","re","."],
  v:`<b>The same request takes nearly twice as many tokens</b>Words that were common in the text the tokenizer was built from are single tokens. Rarer words are split into fragments. <code>Pakisuyo</code> takes four tokens, and <code>Please</code> takes one.<br><br>As a result, the same app costs more per message in Filipino and fills its context window sooner. Nobody decided this. It follows from the text the tokenizer was built on.`},
 {id:"code", label:"Code", raw:"if slots > 0:\n    slots -= 1",
  toks:["if"," slots"," >"," 0",":","\n","   "," slots"," -","="," 1"],
  v:`<b>Code has the fewest characters per token</b>Punctuation, operators and indentation can each take a token. This is one reason pasting a large file uses up the context window quickly, and why the same logic costs more to send as code than as prose.`}
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

