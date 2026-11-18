/* ================= 01 NEXT TOKEN ================= */
const NX=[
 {id:"fr", pre:"The capital of France is",
  d:[["Paris",.89],["the",.04],["a",.02],["located",.02],["home",.01],["known",.01],["one",.01]],
  v:`<b>One word has almost all the probability</b>Paris has a probability of 0.89 because almost every sentence in the training data that began this way ended that way. The model has no separate fact about French geography to consult.`},
 {id:"mito", pre:"The mitochondrion is the",
  d:[["powerhouse",.71],["site",.09],["organelle",.06],["main",.04],["only",.03],["primary",.03],["structure",.02]],
  v:`<b>The most common phrasing has the highest probability</b>Powerhouse comes first because that phrasing appears everywhere in text. You probably chose the same word for the same reason.`},
 {id:"code", pre:"def get_user(request):\n    user = User.objects.",
  d:[["get",.42],["filter",.31],["all",.09],["create",.06],["exclude",.04],["first",.04],["none",.02]],
  v:`<b>Two plausible words that behave differently</b>Both <code>get</code> and <code>filter</code> are plausible, but <code>get</code> raises an error when there is no match and <code>filter</code> returns an empty result. The model picks whichever word usually comes next and does not know what your program needs.`},
 {id:"risky", pre:"To stop the double enrollment, add an",
  d:[["idempotency",.22],["index",.19],["if",.17],["assert",.14],["extra",.12],["email",.09],["alert",.07]],
  v:`<b>A flat list means the model is unsure</b>No word is above 0.25, so the model is closer to guessing than deciding. The sentence it writes will still read as confidently as the France one did.`}
];
const NXS={sel:"fr", temp:1, tally:{}, last:null};
function softmax(d,T){
  if(T<=0.01){ const m=Math.max(...d.map(x=>x[1])); return d.map(x=>x[1]===m?1:0); }
  const lp=d.map(x=>Math.log(Math.max(x[1],1e-6))/T);
  const mx=Math.max(...lp), ex=lp.map(v=>Math.exp(v-mx)), s=ex.reduce((a,b)=>a+b,0);
  return ex.map(v=>v/s);
}
function nxRender(){
  const q=NX.find(x=>x.id===NXS.sel), p=softmax(q.d,NXS.temp), mx=Math.max(...p);
  $("#nxPick").innerHTML=NX.map(x=>
    `<button data-n="${x.id}" aria-pressed="${x.id===NXS.sel}">${x.pre.split("\n")[0].slice(0,26)}…</button>`).join("");
  $$("#nxPick button").forEach(el=>el.onclick=()=>{NXS.sel=el.dataset.n;NXS.tally={};NXS.last=null;nxRender()});
  $("#nxPrompt").innerHTML=q.pre.replace(/</g,"&lt;")+`<span style="color:var(--req)">▏</span>`;
  $("#nxProbs").innerHTML=q.d.map((x,i)=>
    `<div class="pr ${NXS.last===x[0]?"picked":""}">
       <span class="tok">${x[0]}</span>
       <div class="lane"><div class="bar" style="width:${(p[i]/mx*100).toFixed(1)}%"></div></div>
       <span class="pc">${(p[i]*100).toFixed(1)}%</span></div>`).join("");
  const n=Object.values(NXS.tally).reduce((a,b)=>a+b,0);
  $("#nxTally").innerHTML = n
    ? `<span class="c">${n} samples at temperature ${NXS.temp.toFixed(2)}</span>\n`+
      Object.entries(NXS.tally).sort((a,b)=>b[1]-a[1])
        .map(([k,v])=>`${k.padEnd(14)} ${"█".repeat(v)} ${v}`).join("\n")
    : `<span class="c">Press Pick one, or Do it ten times.</span>`;
  const v=$("#nxVerdict");
  if(NXS.temp<0.05){
    v.className="verdict warn";
    v.innerHTML=`<b>At temperature 0 the model always takes the top word</b>The same prompt gives the same answer every time, even when that top word is wrong.`;
  } else { v.className="verdict ok"; v.innerHTML=q.v; }
}
function nxSample(k=1){
  const q=NX.find(x=>x.id===NXS.sel), p=softmax(q.d,NXS.temp);
  for(let i=0;i<k;i++){
    let r=Math.random(), acc=0, pick=q.d[0][0];
    for(let j=0;j<p.length;j++){ acc+=p[j]; if(r<=acc){ pick=q.d[j][0]; break; } }
    NXS.tally[pick]=(NXS.tally[pick]||0)+1; NXS.last=pick;
  }
  nxRender();
}
$("#sTemp").oninput=e=>{NXS.temp=+e.target.value/100;$("#vTemp").textContent=NXS.temp.toFixed(2);nxRender()};
$("#nxSample").onclick=()=>nxSample(1);
$("#nxTen").onclick=()=>nxSample(10);
$("#nxReset").onclick=()=>{NXS.tally={};NXS.last=null;nxRender()};
$("#sTemp").dispatchEvent(new Event("input"));


/* ---- generation is the same step, run on its own output ---- */
const GEN_SEED="The enrollment ran twice because the request";
/* Two fully written paths. The fork is at the first word, and every path
   below runs to a complete clause, so nothing ends mid-phrase. */
const GEN_TREE={
 "":  [["was",.44],["arrived",.31],["hit",.13],["came",.12]],

 "was":                                   [["retried",.52],["sent",.28],["slow",.20]],
 "was retried":                           [["automatically",.61],["once",.22],["by",.17]],
 "was retried automatically":             [["and",.55],["after",.26],["without",.19]],
 "was retried automatically and":         [["nobody",.47],["both",.31],["the",.22]],
 "was retried automatically and nobody":  [["noticed",.74],["checked",.26]],
 "was retried automatically and both":    [["were",.68],["got",.32]],
 "was retried automatically and the":     [["second",.71],["handler",.29]],

 "arrived":                               [["twice",.58],["late",.24],["early",.18]],
 "arrived twice":                         [["and",.49],["before",.28],["within",.23]],
 "arrived twice and":                     [["both",.51],["nobody",.30],["neither",.19]],
 "arrived twice and both":                [["were",.66],["got",.34]],
 "arrived twice and nobody":              [["checked",.72],["noticed",.28]],
 "arrived twice and neither":             [["was",.63],["got",.37]],

 "hit":                                   [["two",.54],["the",.46]],
 "hit two":                               [["workers",.58],["handlers",.42]],
 "hit two workers":                       [["at",.71],["in",.29]],
 "hit two handlers":                      [["at",.69],["in",.31]],
 "hit the":                               [["endpoint",.57],["server",.43]],
 "hit the endpoint":                      [["twice",.78],["again",.22]],
 "hit the server":                        [["twice",.76],["again",.24]],

 "came":                                  [["back",.55],["in",.45]],
 "came back":                             [["twice",.62],["as",.38]],
 "came in":                               [["twice",.66],["late",.34]],

 "was retried by":                        [["the",.62],["a",.38]],
 "was retried by the":                    [["browser",.71],["gateway",.29]],
 "was retried by a":                      [["proxy",.66],["client",.34]],
 "hit two workers at":                    [["once",1]],
 "hit two workers in":                    [["parallel",1]],
 "hit two handlers at":                   [["once",1]],
 "hit two handlers in":                   [["parallel",1]],
 "arrived twice and both were":           [["saved",.72],["written",.28]],
 "arrived twice and both got":            [["saved",.69],["through",.31]],
 "arrived twice and neither was":         [["rejected",.64],["caught",.36]],
 "arrived twice and neither got":         [["caught",.61],["rejected",.39]],
 "was retried automatically and both were":[["saved",.73],["written",.27]],
 "was retried automatically and both got": [["saved",.68],["through",.32]],
 "was retried automatically and the second":[["succeeded",.74],["worked",.26]],
 "was retried automatically and the handler":[["ran",.67],["fired",.33]]
};
/* leaves, so a run always ends on something readable */
const GEN_END=new Set([
 "noticed","checked","were","got","second","handler","after","without","once","by",
 "at","in","twice","again","as","late","early","was","before","within","sent","slow",
 "endpoint","server","workers","handlers","the"
]);
const GN={toks:[], done:false};
function gnKey(){ return GN.toks.join(" "); }
function gnDist(){ return GEN_TREE[gnKey()] || null; }
function gnRender(){
  const d=gnDist();
  const txt=GEN_SEED+(GN.toks.length?" "+GN.toks.join(" "):"");
  $("#gnOut").innerHTML =
    `<span class="d">${GEN_SEED}</span>`+
    GN.toks.map((t,i)=>` <span style="color:var(--req)${i===GN.toks.length-1?";font-weight:600":""}">${t}</span>`).join("")+
    (GN.done||!d ? `<span class="c"> .</span>` : `<span style="color:var(--req)">▏</span>`);
  if(d && !GN.done){
    const p=softmax(d, NXS.temp), mx=Math.max(...p);
    $("#gnProbs").innerHTML=d.map((x,i)=>
      `<div class="pr"><span class="tok">${x[0]}</span>
        <div class="lane"><div class="bar" style="width:${(p[i]/mx*100).toFixed(0)}%"></div></div>
        <span class="pc">${(p[i]*100).toFixed(0)}%</span></div>`).join("");
  } else $("#gnProbs").innerHTML=`<span class="c">No more words to choose.</span>`;

  const v=$("#gnVerdict");
  if(!GN.toks.length){
    v.className="verdict";
    v.innerHTML=`<b>The sentence so far has seven words</b>Press <em>Next word</em>. Each press runs the same step on a prompt that is one word longer.`;
  } else if(!GN.done && d){
    v.className="verdict warn";
    v.innerHTML=`<b>${GN.toks.length} word${GN.toks.length>1?"s":""} added</b>The list is different from last time, because the word you added is now part of the prompt.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>The sentence is finished</b>Each word was picked as a likely continuation of the words before it, and none could be taken back. Press <em>Start again</em> for a different sentence.`;
  }
}
$("#gnStep").onclick=()=>{
  const d=gnDist(); if(!d||GN.done){GN.done=true;gnRender();return;}
  const p=softmax(d,NXS.temp); let r=Math.random(),acc=0,pick=d[0][0];
  for(let j=0;j<p.length;j++){acc+=p[j]; if(r<=acc){pick=d[j][0];break;}}
  GN.toks.push(pick);
  if(!gnDist()) GN.done=true;
  gnRender();
};
$("#gnRun").onclick=()=>{ let n=0; while(!GN.done && n++<12) $("#gnStep").click(); };
$("#gnReset").onclick=()=>{GN.toks=[];GN.done=false;gnRender()};
gnRender();

