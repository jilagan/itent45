/* Lesson server. Widget code for the markup in lesson.html. Shared code it needs: lib/memmodel.js. */
/* ================= SERVER SIMULATION ================= */
const cv=$("#simCanvas"), cx=cv.getContext("2d");
let W=0,H=0;
function sizeCanvas(){
  const r=cv.getBoundingClientRect(), d=devicePixelRatio||1;
  W=r.width; H=r.height;
  cv.width=W*d; cv.height=H*d; cx.setTransform(d,0,0,d,0,0);
  drawSim();
}
addEventListener("resize",sizeCanvas);

const S={lam:20,svc:50,workers:4,memReq:12,ram:4096};
let queue=[],workers=[],flying=[],done=[],lat=[],
    running=false,acc=0,last=0,tDone=0,tWin=0,dropped=0,thr=0;

function initWorkers(){
  workers=Array.from({length:S.workers},()=>({busy:false,rem:0,req:null,tot:1}));
}
function resetSim(){
  queue=[];flying=[];done=[];lat=[];dropped=0;thr=0;acc=0;tDone=0;tWin=0;
  initWorkers();drawSim();updateGauges();
}
const QMAX=60;
function step(dt){
  // arrivals (Poisson-ish)
  acc += S.lam*dt;
  while(acc>=1){
    acc-=1;
    const memNow=64 + (queue.length+workers.filter(w=>w.busy).length)*S.memReq;
    if(queue.length>=QMAX || memNow+S.memReq>S.ram){
      dropped++; flying.push({x:0,y:0,t:0,dead:true});
    } else {
      queue.push({t:0}); flying.push({x:0,y:0,t:0});
    }
  }
  // age queue
  queue.forEach(q=>q.t+=dt*1000);
  // workers
  workers.forEach(w=>{
    if(w.busy){
      w.rem-=dt*1000;
      if(w.rem<=0){
        w.busy=false;
        lat.push(w.req.t + w.tot);
        if(lat.length>150) lat.shift();
        done.push({x:0,t:0}); tDone++;
      }
    }
    if(!w.busy && queue.length){
      w.req=queue.shift(); w.busy=true; w.rem=S.svc; w.tot=S.svc;
    }
  });
  // moving dots
  flying.forEach(f=>f.t+=dt); flying=flying.filter(f=>f.t<1);
  done.forEach(f=>f.t+=dt);   done=done.filter(f=>f.t<1);
  // throughput window
  tWin+=dt;
  if(tWin>=1){ thr=tDone/tWin; tDone=0; tWin=0; }
}
function drawSim(){
  if(!W) return;
  cx.clearRect(0,0,W,H);
  const padL=14, qX=W*0.24, wX=W*0.55, oX=W*0.86, midY=H/2;

  // rails
  cx.strokeStyle=CSSV("--line"); cx.lineWidth=1;
  cx.beginPath(); cx.moveTo(padL,midY); cx.lineTo(qX-10,midY); cx.stroke();
  cx.beginPath(); cx.moveTo(wX+70,midY); cx.lineTo(oX+30,midY); cx.stroke();

  const lab=(t,x,y)=>{cx.fillStyle=CSSV("--faint");cx.font="600 14px system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";cx.textAlign="center";cx.fillText(t,x,y)};
  lab("Arriving",padL+30,20); lab("Queue",qX+18,20); lab("Workers",wX+34,20); lab("Done",oX+14,20);

  // in-flight arrivals
  flying.forEach(f=>{
    const x=padL+f.t*(qX-10-padL);
    cx.fillStyle=f.dead?"var(--warn)":"var(--req)";
    cx.globalAlpha=f.dead?1-f.t:1;
    cx.beginPath(); cx.arc(x, midY + (f.dead?f.t*38:0), 4,0,7); cx.fill();
    cx.globalAlpha=1;
  });

  // queue box
  const qw=54, qh=H-56;
  cx.strokeStyle= queue.length>=QMAX?"var(--warn)":"var(--line2)";
  cx.strokeRect(qX,28,qw,qh);
  const cols=4, cell=11;
  queue.slice(0,48).forEach((q,i)=>{
    const c=i%cols, r=Math.floor(i/cols);
    cx.fillStyle=CSSV("--req"); cx.globalAlpha=Math.min(1,.45+q.t/1500);
    cx.fillRect(qX+6+c*cell, 28+qh-14-r*cell, 7,7);
    cx.globalAlpha=1;
  });
  cx.fillStyle= queue.length>=QMAX?"var(--warn)":"var(--dim)";
  cx.font="600 14px system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"; cx.textAlign="center";
  cx.fillText(queue.length + (queue.length>=QMAX?" (full)":""), qX+qw/2, H-16);

  // workers
  const bw=68, bh=Math.min(24,(H-64)/Math.max(workers.length,1)-3);
  workers.forEach((w,i)=>{
    const y=34+i*(bh+3);
    if(y+bh>H-24) return;
    cx.strokeStyle=CSSV("--line2"); cx.strokeRect(wX,y,bw,bh);
    if(w.busy){
      const p=1-w.rem/w.tot;
      cx.fillStyle="rgba(255,162,58,.85)";
      cx.fillRect(wX+1,y+1,(bw-2)*p,bh-2);
    }
  });
  if(workers.length*(bh+3)>H-64){
    cx.fillStyle=CSSV("--faint"); cx.font="14px system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"; cx.textAlign="left";
    cx.fillText(workers.length+" workers", wX, H-10);
  }

  // completed
  done.forEach(f=>{
    const x=wX+70+f.t*(oX+30-(wX+70));
    cx.fillStyle=CSSV("--res"); cx.globalAlpha=1-f.t*.5;
    cx.beginPath(); cx.arc(x,midY,4,0,7); cx.fill(); cx.globalAlpha=1;
  });
}
function p95(){
  if(!lat.length) return 0;
  const s=[...lat].sort((a,b)=>a-b);
  return s[Math.min(s.length-1,Math.floor(s.length*.95))];
}
function updateGauges(){
  const busy=workers.filter(w=>w.busy).length;
  const inFlight=queue.length+busy;
  const mem=64+inFlight*S.memReq;
  const util=workers.length?busy/workers.length*100:0;
  const cap=S.workers/(S.svc/1000);
  const p=p95();

  const set=(id,v,hot,good)=>{
    const g=$(id); g.querySelector(".gv").firstChild.nodeValue=v;
    g.classList.toggle("hot",!!hot); g.classList.toggle("good",!!good);
  };
  set("#gThr",Math.round(thr),false,thr>0);
  set("#gQ",queue.length,queue.length>=QMAX,false);
  set("#gP95",Math.round(p),p>1000,p>0&&p<300);
  set("#gCpu",Math.round(util),util>95,util>0&&util<80);
  set("#gMem",Math.round(mem),mem>S.ram*.9,false);
  set("#gDrop",dropped,dropped>0,false);

  $("#capLine").textContent=`${S.workers} ÷ ${(S.svc/1000).toFixed(3)} s = ${Math.round(cap)} rps`;
  const ml=$("#memLink");
  if(ml && typeof memModel==="function"){
    const mm=memModel(), gb=(MEM.ram/1024).toFixed(1).replace(/\.0$/,"");
    ml.innerHTML = S.workers>mm.maxW
      ? `<span style="color:var(--warn)">In <a data-lesson="mem">Server memory</a> only ${mm.maxW} workers fit in ${gb} GB, so these ${S.workers} would not all start.</span>`
      : `In <a data-lesson="mem">Server memory</a>, ${mm.maxW} workers fit in ${gb} GB of RAM.`;
  }

  const v=$("#verdict"); const rho=S.lam/cap;
  v.className="verdict"+(!running?"":rho<.7?" ok":rho<1?" warn":" bad");
  if(!running){ v.innerHTML="<b>Idle</b>Press Play to send requests to the server."; return; }
  if(mem>S.ram*.9){
    v.className="verdict bad";
    v.innerHTML=`<b>Out of memory</b>${inFlight} requests being handled or waiting at ${S.memReq} MB each is over the ${S.ram} MB limit. The operating system starts stopping processes, and more workers would not help because each one needs RAM too.`;
  } else if(rho>=1){
    v.innerHTML=`<b>Saturated, utilization ${rho.toFixed(2)}</b>Requests arrive at ${S.lam} per second, but the workers finish at most ${Math.round(cap)}. The queue fills and new requests are rejected, p95 latency stays high, and throughput stays at the maximum.`;
  } else if(rho>.7){
    v.innerHTML=`<b>Approaching the limit, utilization ${rho.toFixed(2)}</b>The workers keep up, but time in the queue is now the main part of latency. Above about 70% utilization, latency rises much faster than the load, so a machine is not sized to run at 100%.`;
  } else {
    v.innerHTML=`<b>Healthy, utilization ${rho.toFixed(2)}</b>The workers finish requests faster than they arrive, so waiting time stays near zero. p95 latency is close to the handler time.`;
  }
}
function loop(ts){
  if(!running) return;
  const dt=Math.min(.05,(ts-last)/1000||0); last=ts;
  step(dt); drawSim(); updateGauges();
  requestAnimationFrame(loop);
}
const bind=(sel,key,fmt,el)=>{
  $(sel).oninput=e=>{
    S[key]=+e.target.value; $(el).textContent=fmt(S[key]);
    if(key==="workers") initWorkers();
    updateGauges(); if(!running) drawSim();
  };
  $(sel).dispatchEvent(new Event("input"));
};
bind("#sLam","lam",v=>v+" rps","#vLam");
bind("#sSvc","svc",v=>v+" ms","#vSvc");
bind("#sW","workers",v=>v,"#vW");
// the machines in the scaling panel are copies of this one, so its numbers move with this slider
$("#sW").addEventListener("input",()=>{ if(typeof renderScale==="function") renderScale(); });
bind("#sMem","memReq",v=>v+" MB","#vMem");
bind("#sRam","ram",v=>v+" MB","#vRam");

$("#simRun").onclick=e=>{
  running=!running; e.target.textContent=running?"Pause":"Play";
  if(running){ last=performance.now(); requestAnimationFrame(loop); } else updateGauges();
};
$("#simReset").onclick=()=>{
  running=false; $("#simRun").textContent="Play"; resetSim();
};

$("#srvCode").innerHTML=
`<span class="c"># A complete web server with no framework. Run it, then in a second terminal: curl -v localhost:8080/courses</span>
<span class="kw">import</span> socket

srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, <span class="s">1</span>)
srv.bind((<span class="s">"127.0.0.1"</span>, <span class="s">8080</span>))   <span class="c"># reserve port 8080 for this program</span>
srv.listen(<span class="s">64</span>)                     <span class="c"># allow up to 64 connections to wait their turn</span>

<span class="kw">while</span> <span class="s">True</span>:
    conn, addr = srv.accept()      <span class="c"># wait here until a client connects</span>
    raw = conn.recv(<span class="s">65536</span>).decode()  <span class="c"># the raw request text, as in <a data-lesson="bytes">HTTP messages</a></span>
    <span class="kw">print</span>(raw)                    <span class="c"># show the raw request on screen</span>

    line = raw.split(<span class="s">"\\r\\n"</span>)[<span class="s">0</span>]
    method, path, _ = line.split(<span class="s">" "</span>)

    body = <span class="s">'{"courses":[{"code":"MGT 45","units":3}]}'</span>
    conn.sendall((
        <span class="s">"HTTP/1.1 200 OK\\r\\n"</span>
        <span class="s">"Content-Type: application/json\\r\\n"</span>
        <span class="s">f"Content-Length: {len(body)}\\r\\n"</span>
        <span class="s">"\\r\\n"</span>
    ).encode() + body.encode())
    conn.close()                   <span class="c"># close the connection after each response</span>`;

sizeCanvas(); resetSim();

/* keyboard: Space starts and stops the simulation */
addEventListener("keydown",e=>{
  if(e.key===" "){e.preventDefault();$("#simRun").click()}
});

/* called by the platform when this lesson or a step or More detail becomes visible */
PAGE_HOOKS.show=()=>{ sizeCanvas(); };

/* called by the platform after a theme change */
PAGE_HOOKS.redraw=()=>{ try{ drawSim(); }catch(e){} };
