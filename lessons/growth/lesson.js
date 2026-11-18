/* Lesson growth. Widget code for the markup in lesson.html. */
/* ---------- step 2: count the steps ---------- */
const GC_MAX_N=64;
const GC_JOBS=[
 {id:"A", steps:n=>n},
 {id:"B", steps:n=>n*n},
 {id:"C", steps:n=>31-Math.clz32(n)+1}   /* floor(log2 n) + 1 */
];
const GC_SCALE=GC_JOBS[1].steps(GC_MAX_N);   /* the bars share one scale: Job B at 64 items */
const GC={n:4, prev:null};
const gcFmt=x=>x.toLocaleString("en-US");
const gcSteps=s=>gcFmt(s)+(s===1?" step":" steps");
function gcTimes(r){
  const w={2:"twice as many",3:"three times as many",4:"four times as many"}[r];
  if(w) return w;
  return Number.isInteger(r) ? r+" times as many" : "about "+r.toFixed(1).replace(/\.0$/,"")+" times as many";
}
function gcRender(){
  const n=GC.n, p=GC.prev;
  $("#gcN").value=n;
  $("#gcN").setAttribute("aria-valuetext", n+(n===1?" item":" items"));
  $("#gcNv").textContent=n+(n===1?" item":" items")+(n===GC_MAX_N?" (largest)":"");
  $("#gcDbl").disabled = n*2>GC_MAX_N;
  GC_JOBS.forEach(j=>{
    const s=j.steps(n), row=$("#gc"+j.id);
    row.querySelector(".gb-n").textContent=gcSteps(s);
    row.querySelector(".gb-f").style.width=(s/GC_SCALE*100)+"%";
  });
  const v=$("#gcVerdict"), a=GC_JOBS[0], b=GC_JOBS[1], c=GC_JOBS[2];
  if(p===null || n<=p){
    v.innerHTML="<b>"+n+(n===1?" item":" items")+"</b>Job A takes "+gcSteps(a.steps(n))+", Job B takes "+gcFmt(b.steps(n))+" and Job C takes "+gcFmt(c.steps(n))+"."+(p===null?" Press Double the list.":"");
    return;
  }
  const a0=a.steps(p), a1=a.steps(n), b0=b.steps(p), b1=b.steps(n), c0=c.steps(p), c1=c.steps(n), d=c1-c0;
  const cText = d===0 ? "Job C stayed at "+gcSteps(c1) : "Job C went from "+c0+" to "+c1+", "+(d===1?"one more step":d+" more steps");
  v.innerHTML="<b>"+(n===p*2?"Doubling from ":"From ")+gcFmt(p)+" to "+gcFmt(n)+" items</b>"+
    "Job A went from "+gcFmt(a0)+" to "+gcFmt(a1)+" steps, "+gcTimes(a1/a0)+", and Job B went from "+gcFmt(b0)+" to "+gcFmt(b1)+", "+gcTimes(b1/b0)+". "+cText+".";
}
$("#gcN").oninput=e=>{GC.prev=GC.n; GC.n=+e.target.value; gcRender();};
$("#gcDbl").onclick=()=>{GC.prev=GC.n; GC.n=Math.min(GC_MAX_N, GC.n*2); gcRender();};
$("#gcReset").onclick=()=>{GC.n=4; GC.prev=null; gcRender();};
gcRender();

/* ---------- step 3: page load time ---------- */
const GP_STOPS=[10,20,40,100,200,500,1000,2000,5000];
const GP_Q_MS=0.4, GP_ROW_MS=0.01, GP_SLOW_MS=1000;
const GP={i:2};
const gpMs=t=>t<10?t.toFixed(1):gcFmt(Math.round(t));
function gpWords(ms){
  if(ms<1000) return gpMs(ms)+" milliseconds";
  const s=ms/1000;
  const t = s<10 ? s.toFixed(1).replace(/\.0$/,"") : String(Math.round(s));
  return t+(t==="1"?" second":" seconds");
}
function gpRender(){
  const n=GP_STOPS[GP.i];
  const q1=n+1, t1=q1*GP_Q_MS;                 /* one question per course */
  const q2=1,   t2=GP_Q_MS+n*GP_ROW_MS;        /* one question for everything */
  $("#gpN").value=GP.i;
  $("#gpN").setAttribute("aria-valuetext", gcFmt(n)+" courses");
  $("#gpNv").textContent=gcFmt(n);
  [["#gpA",q1,t1],["#gpB",q2,t2]].forEach(([id,q,t])=>{
    const g=$(id), slow=t>GP_SLOW_MS;
    g.querySelector(".gq").textContent=gcFmt(q);
    g.querySelector(".gm").textContent=gpMs(t)+" ms";
    g.classList.toggle("slow",slow);
    g.querySelector(".gf").textContent = slow ? "Over 1 second" : "";
  });
  const v=$("#gpV");
  v.className="verdict"+(t1>GP_SLOW_MS?" warn":"");
  v.innerHTML="<b>"+gcFmt(n)+" courses</b>One question per course makes "+gcFmt(q1)+" questions and takes about "+gpWords(t1)+". One question for everything takes about "+gpWords(t2)+".";
}
$("#gpN").oninput=e=>{GP.i=+e.target.value; gpRender();};
$("#gpReset").onclick=()=>{GP.i=2; gpRender();};
gpRender();
