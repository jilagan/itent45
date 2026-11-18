/* Lesson decompose. Widget code for the markup in lesson.html.
   Two widgets: a task splitter (#dcSplit) and a dependency planner (#dcPlan). Both are plain buttons, so mouse, touch and keyboard all work.
   The shortest time and the longest chain are computed from the job data, not typed in. */

const DC_NUM=["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"];
const dcEsc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
const dcCap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const dcList=a=>a.length<2?a.join(""):a.slice(0,-1).join(", ")+" and "+a[a.length-1];
const dcPlural=(n,w)=>n+" "+w+(n===1?"":"s");
function dcFocus(root,k){ if(!k) return; const el=root.querySelector(`[data-k="${k}"]`); if(el) el.focus({preventScroll:true}); }

/* ---------- task splitter ---------- */
const DC_LIMIT=4;
/* leaves carry hours (h); every other node carries its children (k), and its hours are the sum */
const DC_TREE={id:"top",n:"Run the org fair booth",k:[
 {id:"prep",n:"Prepare the booth",k:[
   {id:"layout",n:"Design layout",h:2},
   {id:"mats",n:"Materials and signs",k:[
     {id:"buy",n:"Buy materials",h:4},
     {id:"signs",n:"Make signs",h:4}]}]},
 {id:"staff",n:"Staff the booth",k:[
   {id:"sched",n:"Make shift schedule",h:2},
   {id:"brief",n:"Brief volunteers",h:2},
   {id:"shift",n:"Run the morning shift",h:2}]},
 {id:"follow",n:"Follow up with visitors",k:[
   {id:"sheet",n:"Design sign-up sheet",h:4},
   {id:"record",n:"Record sign-ups",h:2}]}
]};
/* the plan below counts days; one day is one work session of DC_HPD hours, so the eight pieces keep the same hours in both steps */
const DC_HPD=2;
const dcHours=n=>n.k?n.k.reduce((a,c)=>a+dcHours(c),0):n.h;
function dcFind(n,id){ if(n.id===id) return n; for(const c of (n.k||[])){ const r=dcFind(c,id); if(r) return r; } return null; }

const dcSplitRoot=$("#dcSplit");
const dcA={open:new Set(["top"]), v:null};

/* the pieces now on the table: nodes that are not split */
function dcPieces(n,out=[]){ if(dcA.open.has(n.id)) n.k.forEach(c=>dcPieces(c,out)); else out.push(n); return out; }
function dcRows(n,d,out){
  if(dcA.open.has(n.id)){
    if(n.id!=="top") out.push(`<li class="wrow dcgroup d${d}"><span>${dcEsc(n.n)}</span><span class="dch">${dcHours(n)} h</span></li>`);
    n.k.forEach(c=>dcRows(c,n.id==="top"?d:d+1,out));
  } else {
    const h=dcHours(n);
    out.push(`<li class="wrow d${d}"><span>${dcEsc(n.n)}</span><span class="dcend"><span class="dch">${h} h</span>`
      +(h>DC_LIMIT
        ? `<button type="button" class="btn" data-k="s:${n.id}" data-split="${n.id}" aria-label="Split ${dcEsc(n.n)}, ${h} hours">Split</button>`
        : `<span class="dcok" role="img" aria-label="${h} hours, small enough">${ICO("check-circle")}</span>`)
      +`</span></li>`);
  }
}
function dcSplitStart(){
  const p=dcPieces(DC_TREE), big=p.filter(x=>dcHours(x)>DC_LIMIT).length;
  return {cls:"",h:`<b>${dcCap(DC_NUM[p.length])} pieces to start</b>${big===p.length?"All of them are":dcCap(DC_NUM[big])+" of them are"} longer than 4 hours and have a Split button.`};
}
function dcSplitRender(focusKey){
  const p=dcPieces(DC_TREE), mx=Math.max(...p.map(dcHours));
  if(!dcA.v) dcA.v=dcSplitStart();
  const rows=[]; dcRows(DC_TREE,0,rows);
  dcSplitRoot.innerHTML=
    `<div class="meter"><div class="g"><div class="gl">Pieces</div><div class="gv">${p.length}</div></div><div class="g"><div class="gl">Largest piece</div><div class="gv">${mx} h</div></div></div>`
   +`<div class="verdict ${dcA.v.cls}" role="status">${dcA.v.h}</div>`
   +`<p class="dctop">${dcEsc(DC_TREE.n)}: ${dcHours(DC_TREE)} hours</p>`
   +`<ul class="wlist">${rows.join("")}</ul>`
   +`<div class="ctrls"><button type="button" class="btn" data-k="reset" data-reset>Reset</button></div>`;
  const nxt=dcSplitRoot.querySelector("[data-split]");
  dcFocus(dcSplitRoot, focusKey==="next" ? (nxt?nxt.dataset.k:"reset") : focusKey);
}
dcSplitRoot.addEventListener("click",e=>{
  const s=e.target.closest("[data-split]"), r=e.target.closest("[data-reset]");
  if(r){ dcA.open=new Set(["top"]); dcA.v=null; dcSplitRender("reset"); return; }
  if(!s) return;
  const n=dcFind(DC_TREE,s.dataset.split);
  dcA.open.add(n.id);
  const over=n.k.filter(c=>dcHours(c)>DC_LIMIT);
  const p=dcPieces(DC_TREE), mx=Math.max(...p.map(dcHours));
  if(mx<=DC_LIMIT){
    dcA.v={cls:"ok",h:`<b>Every piece is 4 hours or less</b>${dcCap(DC_NUM[p.length])} pieces, none over 4 hours. Each has one owner and a clear point where it is done.`};
  } else {
    dcA.v={cls:"",h:`<b>${dcEsc(n.n)} is now ${DC_NUM[n.k.length]} pieces</b>`
      +(over.length?`${dcEsc(dcList(over.map(c=>c.n+" ("+dcHours(c)+" hours)")))} still ${over.length===1?"needs":"need"} a split.`
                   :`Each of them is 4 hours or less.`)};
  }
  dcSplitRender("next");
});
dcSplitRender();

/* ---------- dependency planner ---------- */
const DC_PEOPLE=["Mika","Paolo","Bea"];
const DC_JOBS=[
 {id:"L",t:"layout",needs:[]},
 {id:"M",t:"buy",needs:["L"]},
 {id:"S",t:"signs",needs:[]},
 {id:"T",t:"sched",needs:[]},
 {id:"V",t:"brief",needs:["T"]},
 {id:"R",t:"shift",needs:["M","S","V"]},
 {id:"F",t:"sheet",needs:[]},
 {id:"X",t:"record",needs:["F","R"]}
].map(j=>{ const leaf=dcFind(DC_TREE,j.t); return Object.assign(j,{n:leaf.n,h:leaf.h,d:leaf.h/DC_HPD}); });
const dcJob=id=>DC_JOBS.find(j=>j.id===id);
/* earliest finish of every job with unlimited people: the longest chain ending at it */
const DC_CP=(()=>{
  const f={}, prev={};
  const fin=id=>{ if(id in f) return f[id]; let best=0, bp=null;
    dcJob(id).needs.forEach(n=>{ const v=fin(n); if(v>best){best=v; bp=n;} });
    prev[id]=bp; return f[id]=best+dcJob(id).d; };
  DC_JOBS.forEach(j=>fin(j.id));
  let end=DC_JOBS[0].id; DC_JOBS.forEach(j=>{ if(f[j.id]>f[end]) end=j.id; });
  const chain=[]; for(let c=end;c;c=prev[c]) chain.unshift(dcJob(c).n);
  return {days:f[end], chain};
})();

const dcPlanRoot=$("#dcPlan");
const dcP={day:1, run:{}, done:[], finished:false, v:null};
const dcPlanStart=()=>({cls:"",h:`<b>Pick a job</b>Press a ready job to give it to a free person. Press End day when everyone has a job.`});
const dcIsReady=j=>!dcP.done.includes(j.id)&&!(j.id in dcP.run)&&j.needs.every(n=>dcP.done.includes(n));
const dcFreePeople=()=>DC_PEOPLE.map((_,i)=>i).filter(i=>!Object.values(dcP.run).some(r=>r.p===i));
const dcUnmet=j=>j.needs.filter(n=>!dcP.done.includes(n)).map(n=>dcJob(n).n);

function dcPlanRender(focusKey){
  if(!dcP.v) dcP.v=dcPlanStart();
  const running=Object.keys(dcP.run).length;
  const free=dcFreePeople().map(i=>DC_PEOPLE[i]);
  let h=`<div class="dcbar"><span class="dcday">${dcP.finished?"Days used":"Day"} <b>${dcP.day}</b></span>`
       +`<button type="button" class="btn primary" data-k="end" data-end${(!running||dcP.finished)?" disabled":""}>End day</button></div>`
       +`<div class="meter"><div class="g"><div class="gl">Free people</div><div class="gv">${free.length?dcEsc(free.join(", ")):"Nobody"}</div></div><div class="g"><div class="gl">Jobs done</div><div class="gv">${dcP.done.length} of ${DC_JOBS.length}</div></div></div>`
       +`<div class="verdict ${dcP.v.cls}" role="status">${dcP.v.h}</div>`;
  h+=`<div class="wopts dcjobs">`+DC_JOBS.map(j=>{
      const dur=dcPlural(j.d,"day")+" ("+j.h+" h)";
      let cls,meta,st,dis=false;
      if(dcP.done.includes(j.id)){ cls="done"; meta=dur; st=ICO("check-circle")+"Done"; dis=true; }
      else if(j.id in dcP.run){ const r=dcP.run[j.id]; cls="run"; meta=dur+" · "+dcPlural(r.left,"day")+" left"; st=DC_PEOPLE[r.p]; }
      else if(dcIsReady(j)){ cls="ready"; meta=dur+" · ready"; st="Start"; }
      else { cls="wait"; meta=dur+" · waits for "+dcList(dcUnmet(j)); st="Waiting"; dis=true; }
      return `<button type="button" class="wopt ${cls==="run"?"sel":cls==="done"?"right":cls}" data-k="j:${j.id}" data-job="${j.id}" aria-disabled="${dis}"><span><b>${dcEsc(j.n)}</b><span class="dcm">${dcEsc(meta)}</span></span><span class="dcst">${st}</span></button>`;
    }).join("")+`</div>`
    +`<div class="ctrls"><button type="button" class="btn" data-k="reset" data-reset>Reset</button></div>`;
  dcPlanRoot.innerHTML=h;
  dcFocus(dcPlanRoot,focusKey);
}

dcPlanRoot.addEventListener("click",e=>{
  const jb=e.target.closest("[data-job]"), en=e.target.closest("[data-end]"), rs=e.target.closest("[data-reset]");
  if(rs){ Object.assign(dcP,{day:1,run:{},done:[],finished:false,v:null}); dcPlanRender("reset"); return; }
  if(dcP.finished) return;
  if(jb){
    const j=dcJob(jb.dataset.job), k="j:"+j.id;
    if(dcP.done.includes(j.id)){
      const after=DC_JOBS.some(x=>x.needs.includes(j.id));
      dcP.v={cls:"",h:`<b>${dcEsc(j.n)} is finished</b>${after?"Jobs that needed it can start.":"No other job waits for it."}`};
    } else if(j.id in dcP.run){
      const r=dcP.run[j.id];
      if(r.start===dcP.day){ delete dcP.run[j.id]; dcP.v={cls:"",h:`<b>${dcEsc(j.n)} is back in the list</b>Pick another job or press End day.`}; }
      else dcP.v={cls:"",h:`<b>${dcEsc(j.n)} is in progress</b>${dcPlural(r.left,"more day")} to finish.`};
    } else if(dcIsReady(j)){
      const free=dcFreePeople();
      if(!free.length) dcP.v={cls:"",h:`<b>Everyone has a job</b>Press End day to move to the next day.`};
      else { dcP.run[j.id]={left:j.d,p:free[0],start:dcP.day}; dcP.v={cls:"",h:`<b>${DC_PEOPLE[free[0]]} started ${dcEsc(j.n)}</b>Press it again to take it back.`}; }
    } else {
      dcP.v={cls:"",h:`<b>${dcEsc(j.n)} has to wait</b>It needs ${dcEsc(dcList(dcUnmet(j)))} to finish first.`};
    }
    dcPlanRender(k); return;
  }
  if(en && Object.keys(dcP.run).length){
    /* people who could have worked today: free people, and jobs that were ready but not started */
    const idle=Math.min(dcFreePeople().length, DC_JOBS.filter(dcIsReady).length);
    const idleNames=DC_JOBS.filter(dcIsReady).map(j=>j.n);
    const fin=[];
    Object.keys(dcP.run).forEach(id=>{ const r=dcP.run[id]; r.left--; if(r.left===0){ fin.push(dcJob(id).n); dcP.done.push(id); delete dcP.run[id]; } });
    if(dcP.done.length===DC_JOBS.length){
      dcP.finished=true;
      const best=DC_CP.days, ch=dcList(DC_CP.chain);
      dcP.v = dcP.day===best
        ? {cls:"ok",h:`<b>Finished in ${dcPlural(dcP.day,"day")}, the shortest possible</b>The chain ${dcEsc(ch)} sets that limit. Each job in it waits for the one before.`}
        : {cls:"",h:`<b>Finished in ${dcPlural(dcP.day,"day")}</b>The shortest possible is ${best}. The chain ${dcEsc(ch)} sets that limit, so each of those jobs should start as soon as it can.`};
    } else {
      const was=dcP.day; dcP.day++;
      dcP.v={cls:"",h:`<b>Day ${was} is over</b>`+(fin.length?`Finished today: ${dcEsc(dcList(fin))}.`:`Nothing finished today.`)
        +(idle?` ${idle===1?"One person had":dcCap(DC_NUM[idle])+" people had"} no job while ${dcEsc(dcList(idleNames))} could have started.`:"")};
    }
    const nextReady=DC_JOBS.find(dcIsReady);
    dcPlanRender(!dcP.finished&&Object.keys(dcP.run).length?"end":(!dcP.finished&&nextReady?"j:"+nextReady.id:"reset"));
  }
});
dcPlanRender();
