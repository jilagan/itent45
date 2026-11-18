/* ================= 05 CONTEXT WINDOW ================= */
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
    seg(lostTurns,"var(--warn)","fallen out");
  const set=(id,v,hot)=>{const g=$(id);g.querySelector(".gv").firstChild.nodeValue=v;g.classList.toggle("hot",!!hot)};
  set("#ctxUsed", (used*4)+"k of "+(CTX.win*4)+"k", over>0);
  set("#ctxLost", lostTurns? (lostTurns*4)+"k" : "none", lostTurns>0);
  const v=$("#ctxVerdict");
  if(!over){
    v.className="verdict ok";
    v.innerHTML=`<b>Everything still fits</b>The system prompt and your files were there before the conversation started, exactly like the operating system in panel 12 of the Module 1 tool. What is left over is what the conversation gets to use.`;
  } else if(CTX.files >= CTX.win*0.5){
    v.className="verdict bad";
    v.innerHTML=`<b>Your files are eating the conversation</b>You pasted more than half the window before saying anything. Everything after this competes for what is left, and the earliest turns are already going.<br><br>This is why "just paste the whole repo" stops working, and it stops working quietly.`;
  } else {
    v.className="verdict bad";
    v.innerHTML=`<b>The oldest turns are gone</b>The instruction you gave at the start is no longer in front of it. The text is no longer there. It is answering from what remains.<br><br>When a long session starts drifting, this is usually the reason, and no amount of asking it to concentrate will help.`;
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

