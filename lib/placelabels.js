/* Label placement for word maps. Each item has a dot at (cx,cy) and a text.
   Tries positions around the dot and keeps the first one that overlaps no other label or dot. */
function placeLabels(items, fs, W, H, lines){
  const cw=fs*0.62, boxes=[], dots=items.map(i=>({x:i.cx-(i.r||4)-2,y:i.cy-(i.r||4)-2,w:2*(i.r||4)+4,h:2*(i.r||4)+4}));
  const hit=(a,b)=>a.x<b.x+b.w && b.x<a.x+a.w && a.y<b.y+b.h && b.y<a.y+a.h;
  const out=[];
  (lines||[]).forEach(([x1,y1,x2,y2])=>{ const n=Math.max(2,Math.round(Math.hypot(x2-x1,y2-y1)/6));
    for(let i=0;i<=n;i++) boxes.push({x:x1+(x2-x1)*i/n-3,y:y1+(y2-y1)*i/n-3,w:6,h:6}); });
  items.forEach((it,k)=>{
    const w=it.text.length*cw, r=(it.r||4)+5, h=fs;
    const cand=[[r,fs*.35,"start"],[-r,fs*.35,"end"],[0,-r-2,"middle"],[0,r+fs*.8,"middle"],
                [r,-r,"start"],[-r,-r,"end"],[r,r+fs*.6,"start"],[-r,r+fs*.6,"end"],
                [r+14,fs*.35,"start"],[-r-14,fs*.35,"end"],[0,-r-fs-4,"middle"],[0,r+fs*1.8,"middle"]];
    let best=null, bestScore=1e9;
    for(const [dx,dy,an] of cand){
      const x=it.cx+dx, y=it.cy+dy, bx=an==="start"?x:an==="end"?x-w:x-w/2;
      const box={x:bx-1,y:y-h*.8,w:w+2,h:h};
      let score=0;
      if(box.x<0||box.x+box.w>W||box.y<0||box.y+box.h>H) score+=1000;
      boxes.forEach(b=>{ if(hit(box,b)) score+=100; });
      dots.forEach((d,j)=>{ if(j!==k && hit(box,d)) score+=100; });
      if(score<bestScore){ bestScore=score; best={x,y,an,box}; if(score===0) break; }
    }
    boxes.push(best.box); out[k]=best;
  });
  return out;
}
