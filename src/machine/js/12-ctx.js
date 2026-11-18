/* ================= CONTEXT WINDOW ================= */
const CTX={win:16, sys:2, files:0, turns:0};
function ctxRender(){
  const used=CTX.sys+CTX.files+CTX.turns, over=Math.max(0,used-CTX.win);
  const seg=(v,c,l)=>v>0?`<i style="width:${(v/Math.max(used,CTX.win)*100).toFixed(1)}%;background:${c}" title="${l}"></i>`:"";
  let lostTurns=0, t=CTX.turns;
  if(over>0){ lostTurns=Math.min(CTX.turns, over); }
  $("#ctxBar").innerHTML =
    seg(CTX.sys,"var(--faint)","system prompt")+
    seg(CTX.files,"var(--line3)","your files")+
    seg(CTX.turns-lostTurns,"var(--res)","conversation still visible")+
    seg(lostTurns,"var(--warn)","dropped out");
  const set=(id,v,hot)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;g.classList.toggle("hot",!!hot)};
  set("#ctxUsed", (used*4)+"k of "+(CTX.win*4)+"k", over>0);
  set("#ctxLost", lostTurns? (lostTurns*4)+"k" : "none", lostTurns>0);
  const v=$("#ctxVerdict");
  if(!over){
    v.className="verdict ok";
    v.innerHTML=`<b>Everything still fits</b>The system prompt and your files were in the window before the conversation started, as the operating system uses part of a server's memory before your code does. This is the same budget idea as in the Module 1 site, "What a server holds". The conversation can use the space that is left.`;
  } else if(CTX.files >= CTX.win*0.5){
    v.className="verdict bad";
    v.innerHTML=`<b>Your files take up much of the window</b>You pasted at least half the window before saying anything. Everything after that shares the space that is left, and the earliest turns are already dropping out.<br><br>This is why pasting a whole code repository into a chat stops working, and it fails without any warning.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>The oldest turns have dropped out</b>The instruction you gave at the start is no longer in the window, so the model cannot see it. It answers from what remains.<br><br>When a long session starts to drift, this is usually the reason. Asking the model to concentrate does not bring the text back.`;
  }
}
["sWin","sFiles","sTurns"].forEach(id=>{
  const el=$("#"+id); if(!el) return;
  el.oninput=e=>{
    const k=id==="sWin"?"win":id==="sFiles"?"files":"turns";
    CTX[k]=+e.target.value;
    $("#v"+id.slice(1)).textContent = k==="win" ? (CTX.win*4)+"k tokens"
      : k==="files" ? (CTX.files*4)+"k tokens" : CTX.turns+" turns";
    ctxRender();
  };
  el.dispatchEvent(new Event("input"));
});

