/* ================= REA / UNIVERSAL DATA MODELS ================= */
/* ---- crow's feet up and left, and what that sorts ---- */
const ERD_E={
 payment   :{n:"Payment",    vol:"high",  rows:"~40k a term"},
 enrollment:{n:"Enrolment",  vol:"high",  rows:"~30k a term"},
 section   :{n:"Section",    vol:"mid",   rows:"~600 a term"},
 student   :{n:"Student",    vol:"low",   rows:"~9,000, slowly"},
 course    :{n:"Course",     vol:"low",   rows:"~1,200, rarely"},
 room      :{n:"Room",       vol:"low",   rows:"~200, almost never"}
};
// child -> parent. The crow's foot is drawn at the child, the many side.
const ERD_R=[["enrollment","student"],["enrollment","section"],
             ["payment","student"],["section","course"],["section","room"]];
const ERD_POS={
  tidy:{payment:[34,20],enrollment:[214,92],section:[396,166],
        student:[396,292],course:[606,232],room:[606,318]},
  messy:{payment:[430,300],enrollment:[70,180],section:[610,60],
         student:[250,40],course:[440,140],room:[80,320]}
};
let erdMode="messy";
const ERD_W=150, ERD_H=42;
function erdFill(v){ return v==="high"?"var(--req)":v==="mid"?"var(--line3)":"var(--res)"; }
/* where a line from the centre of a box towards (tx,ty) crosses that box's edge */
function edgePt(bx,by,bw,bh,tx,ty){
  const cx=bx+bw/2, cy=by+bh/2, dx=tx-cx, dy=ty-cy;
  if(!dx && !dy) return [cx,cy];
  const s=Math.min(dx?(bw/2)/Math.abs(dx):1e9, dy?(bh/2)/Math.abs(dy):1e9);
  return [cx+dx*s, cy+dy*s];
}
/* the many symbol: three prongs opening onto the entity it touches */
function crow(ex,ey,tx,ty){
  const a=Math.atan2(ty-ey,tx-ex), L=15, SP=7;
  const ax=ex+L*Math.cos(a), ay=ey+L*Math.sin(a);        // apex, out along the line
  const px=-Math.sin(a)*SP, py=Math.cos(a)*SP;            // perpendicular spread
  return `<path d="M${ax},${ay} L${ex},${ey}
                   M${ax},${ay} L${ex+px},${ey+py}
                   M${ax},${ay} L${ex-px},${ey-py}"
           stroke="var(--req)" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
}
function renderErd(){
  const P=ERD_POS[erdMode];
  const c=id=>[P[id][0]+ERD_W/2, P[id][1]+ERD_H/2];
  let svg=`<svg viewBox="0 0 800 380" xmlns="http://www.w3.org/2000/svg">`;
  if(erdMode==="tidy")
    svg+=`<text x="210" y="18" fill="var(--faint)" font-family="monospace" font-size="11">volatile &#8598;</text>
          <text x="330" y="372" fill="var(--faint)" font-family="monospace" font-size="11">&#8600; static</text>
          <line x1="18" y1="30" x2="782" y2="352" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 6"/>`;
  ERD_R.forEach(([ch,pa])=>{
    const [cx1,cy1]=c(ch), [cx2,cy2]=c(pa);
    const [x1,y1]=edgePt(P[ch][0],P[ch][1],ERD_W,ERD_H,cx2,cy2);   // leaves the child's edge
    const [x2,y2]=edgePt(P[pa][0],P[pa][1],ERD_W,ERD_H,cx1,cy1);   // arrives at the parent's
    svg+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--line2)" stroke-width="1.3"/>`;
    svg+=`<circle cx="${x2}" cy="${y2}" r="3" fill="var(--res)"/>`;   // the one end
    svg+=crow(x1,y1,x2,y2);                                          // the many end
  });
  Object.entries(ERD_E).forEach(([id,e])=>{
    const [x,y]=P[id];
    svg+=`<g class="erdBox" transform="translate(${x},${y})">
      <rect width="${ERD_W}" height="${ERD_H}" rx="6" fill="var(--panel2)"
            stroke="${erdFill(e.vol)}" stroke-width="1.6"/>
      <text x="10" y="18" fill="var(--ink)" font-family="var(--sans)" font-size="13" font-weight="600">${e.n}</text>
      <text x="10" y="33" fill="var(--faint)" font-family="monospace" font-size="10">${e.rows}</text>
    </g>`;
  });
  $("#erdDia").innerHTML=svg+`</svg>`;

  $("#erdTab").innerHTML=[["messy","As it usually gets drawn"],["tidy","Crow's feet up and left"]]
    .map(([k,l])=>`<button data-e="${k}" aria-pressed="${k===erdMode}">${l}</button>`).join("");
  $$("#erdTab button").forEach(el=>el.onclick=()=>{erdMode=el.dataset.e;renderErd()});

  const v=$("#erdVerdict");
  if(erdMode==="messy"){
    v.className="verdict warn";
    v.innerHTML=`<b>Same five relationships, no information in the positions</b>Every box is correct and the diagram is still hard to read. Crow's feet point in five directions, lines cross for no reason, and nothing about where a box sits tells you anything about it. Switch modes.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>The diagram sorted itself by volatility</b>Nothing was said about which entities are busy. The only rule applied was <em>point the crow's feet up and left</em>, and because the crow's foot lives on the many side, and the many side is the thing that happens, the events walked to the north-west and the things they refer to walked to the south-east.<br><br>Read the diagonal: <b class="i">Payment and Enrolment</b> at the top left, tens of thousands of rows a term. <b class="i">Student, Course and Room</b> at the bottom right, changing slowly if at all. Section sits in the middle because it is both. Every foreign key now points down and to the right, which is also the direction of <em>depends on</em>.`;
  }
}
renderErd();


const REA=[
 {id:"enrol", n:"Enrolment",
  give:{res:"Class seat", resS:"one of 40 in a section", evt:"Enrolment", evtS:"a row per student per course",
        agtIn:"Registrar", agtOut:"Student"},
  take:{res:"Tuition", resS:"cash, or a promise of it", evt:"Payment", evtS:"a row per amount received",
        agtIn:"Cashier", agtOut:"Student"},
  gap:"A student holding a seat with no matching payment. Every school has a report for this, and it exists because the two events are separate."},
 {id:"shop", n:"Online store",
  give:{res:"Stock item", resS:"what is on the shelf", evt:"Sale", evtS:"a row per line of an order",
        agtIn:"Merchant", agtOut:"Customer"},
  take:{res:"Cash", resS:"what the gateway settles", evt:"Payment", evtS:"a row per charge",
        agtIn:"Merchant", agtOut:"Customer"},
  gap:"Goods shipped with no settled payment. This is panel 08's whole problem, seen from the data side rather than the wire."},
 {id:"lib", n:"Library loan",
  give:{res:"Book copy", resS:"a physical thing, one at a time", evt:"Loan", evtS:"a row per borrowing",
        agtIn:"Librarian", agtOut:"Borrower"},
  take:{res:"Book copy", resS:"the same one, coming back", evt:"Return", evtS:"a row per return",
        agtIn:"Librarian", agtOut:"Borrower"},
  gap:"A loan with no return. That is not a bug report, it is an overdue notice, and it falls out of the model for free."},
 {id:"clinic", n:"Clinic visit",
  give:{res:"Consultation slot", resS:"a doctor's time", evt:"Appointment", evtS:"a row per booking",
        agtIn:"Doctor", agtOut:"Patient"},
  take:{res:"Fee", resS:"cash or an insurance claim", evt:"Billing", evtS:"a row per charge raised",
        agtIn:"Clinic", agtOut:"Patient or insurer"},
  gap:"A consultation given and never billed. Same shape, different words, same missing row."}
];
let reaSel="enrol";
const RB_W=210, RB_H=54;
function reaBox(x,y,kind,label,val,sub){
  const col=kind==="res"?"var(--res)":kind==="evt"?"var(--req)":"var(--line3)";
  const bg =kind==="evt"?"rgba(194,65,12,.08)":"var(--panel2)";
  return `<g transform="translate(${x},${y})">
    <rect width="${RB_W}" height="${RB_H}" rx="7" fill="${bg}" stroke="${col}" stroke-width="1.7"/>
    <text x="11" y="17" fill="${col}" font-family="monospace" font-size="9.5" letter-spacing="1.6">${label}</text>
    <text x="11" y="34" fill="var(--ink)" font-family="var(--sans)" font-size="14" font-weight="600">${val}</text>
    <text x="11" y="47" fill="var(--faint)" font-family="monospace" font-size="9.5">${sub}</text>
  </g>`;
}
function reaSide(d, dir, ox){
  const yR=8, yE=118, yA=228;
  const cE=[ox+RB_W/2, yE+RB_H/2];
  let g=reaBox(ox,yR,"res","RESOURCE",d.res,d.resS)
      + reaBox(ox,yE,"evt","EVENT &middot; "+dir.toUpperCase(),d.evt,d.evtS)
      + reaBox(ox,yA,"agt","AGENTS",d.agtOut+" + "+d.agtIn,"outside, and inside");
  // resource -> event, and agent -> event. The event is the many side of both.
  [[yR, 1],[yA, -1]].forEach(([yB,dirn])=>{
    const cB=[ox+RB_W/2, yB+RB_H/2];
    const [x1,y1]=edgePt(ox,yE,RB_W,RB_H,cB[0],cB[1]);
    const [x2,y2]=edgePt(ox,yB,RB_W,RB_H,cE[0],cE[1]);
    g+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--line2)" stroke-width="1.3"/>`
      +`<circle cx="${x2}" cy="${y2}" r="3" fill="var(--res)"/>`
      +crow(x1,y1,x2,y2);
    g+=`<text x="${ox+RB_W/2+8}" y="${(y1+y2)/2+3}" fill="var(--faint)"
          font-family="monospace" font-size="9.5">${dirn>0?"changes":"acts in"}</text>`;
  });
  return g;
}
function renderRea(){
  const r=REA.find(x=>x.id===reaSel);
  $("#reaTab").innerHTML=REA.map(x=>
    `<button data-r="${x.id}" aria-pressed="${x.id===reaSel}">${x.n}</button>`).join("");
  $$("#reaTab button").forEach(el=>el.onclick=()=>{reaSel=el.dataset.r;renderRea()});

  const L=20, R=470, yE=118;
  const svg=`<svg viewBox="0 0 700 300" xmlns="http://www.w3.org/2000/svg">
    ${reaSide(r.give,"give",L)}
    ${reaSide(r.take,"take",R)}
    <line x1="${L+RB_W}" y1="${yE+RB_H/2}" x2="${R}" y2="${yE+RB_H/2}"
          stroke="var(--req)" stroke-width="1.6" stroke-dasharray="5 4"/>
    <text x="${(L+RB_W+R)/2}" y="${yE+RB_H/2-10}" fill="var(--req)" text-anchor="middle"
          font-family="monospace" font-size="10" letter-spacing="1.6">DUALITY</text>
    <text x="${(L+RB_W+R)/2}" y="${yE+RB_H/2+20}" fill="var(--faint)" text-anchor="middle"
          font-family="monospace" font-size="9.5">one pays for the other</text>
  </svg>`;
  $("#reaDia").innerHTML=svg;

  const v=$("#reaVerdict");
  v.className="verdict ok";
  v.innerHTML=`<b>Six boxes, and only the words changed</b>Switch between the four and watch which parts move. The labels do. The shape does not: something of value, an event that moved it, two parties, and a second event pairing the first.<br><br>Note where the crow's feet sit. One resource is touched by many events, and one agent takes part in many events, so the <b class="i">event carries both foreign keys</b> &mdash; which is panel 10's rule arriving from a different direction.<br><br><b class="i">The question this model answers for free:</b> ${r.gap}`;
}
renderRea();

