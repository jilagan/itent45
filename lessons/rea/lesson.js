/* Lesson rea. Widget code for the markup in lesson.html. */
/* ================= REA / UNIVERSAL DATA MODELS ================= */
/* ---- crow's feet up and left, and what that sorts ---- */
const ERD_E={
 payment   :{n:"Payment",    vol:"high",  rows:"~40k a term"},
 enlistment:{n:"Enlistment",  vol:"high",  rows:"~30k a term"},
 section   :{n:"Section",    vol:"mid",   rows:"~600 a term"},
 student   :{n:"Student",    vol:"low",   rows:"~9,000, slowly"},
 course    :{n:"Course",     vol:"low",   rows:"~1,200, rarely"},
 room      :{n:"Room",       vol:"low",   rows:"~200, almost never"}
};
// child -> parent. The crow's foot is drawn at the child, the many side.
const ERD_R=[["enlistment","student"],["enlistment","section"],
             ["payment","student"],["section","course"],["section","room"]];
const ERD_POS={
  tidy:{payment:[30,30],enlistment:[250,110],section:[470,190],
        student:[470,326],course:[680,262],room:[680,350]},
  messy:{payment:[473,330],enlistment:[77,198],section:[671,66],
         student:[275,44],course:[484,154],room:[88,352]}
};
Object.values(ERD_POS).forEach(m=>Object.values(m).forEach(q=>{q[0]=Math.round(q[0]*0.83);}));   // fit a 760 px column
let erdMode="messy";
const ERD_W=180, ERD_H=54;
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
  let svg=`<svg viewBox="0 0 760 430" style="min-width:760px" xmlns="http://www.w3.org/2000/svg">`;
  if(erdMode==="tidy")
    svg+=`<text x="208" y="22" fill="var(--faint)" font-family="var(--sans)" font-size="14">changes often &#8598;</text>
          <text x="332" y="420" fill="var(--faint)" font-family="var(--sans)" font-size="14">&#8600; changes rarely</text>
          <line x1="18" y1="34" x2="742" y2="398" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 6"/>`;
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
      <text x="12" y="22" fill="var(--ink)" font-family="var(--sans)" font-size="15" font-weight="600">${e.n}</text>
      <text x="12" y="43" fill="var(--faint)" font-family="var(--sans)" font-size="14">${e.rows}</text>
    </g>`;
  });
  $("#erdDia").innerHTML=svg+`</svg>`;

  $("#erdTab").innerHTML=[["messy","Boxes placed anywhere"],["tidy","Crow's feet up and left"]]
    .map(([k,l])=>`<button data-e="${k}" aria-pressed="${k===erdMode}">${l}</button>`).join("");
  $$("#erdTab button").forEach(el=>el.onclick=()=>{erdMode=el.dataset.e;renderErd()});

  const v=$("#erdVerdict");
  if(erdMode==="messy"){
    v.className="verdict warn";
    v.innerHTML=`<b>Same diagram, harder to read</b>Every box is correct, but the lines cross and where a box sits tells you nothing. Switch to "Crow's feet up and left" to compare.`;
  } else {
    v.className="verdict ok";
    v.innerHTML=`<b>The busy tables moved to the top left</b>Payment and Enlistment have tens of thousands of rows a term and sit at the top left. Student, Course and Room change slowly and sit at the bottom right.`;
  }
}
renderErd();


const REA=[
 {id:"enlist", n:"Enlistment",
  give:{res:"Class seat", resS:"one of 40 in a section", evt:"Enlistment", evtS:"a row per student per course",
        agtIn:"Registrar", agtOut:"Student"},
  take:{res:"Tuition", resS:"cash, or a promise of it", evt:"Payment", evtS:"a row per amount received",
        agtIn:"Finance office", agtOut:"Student"},
  gap:"The gap to look for is a seat with no matching payment."},
 {id:"shop", n:"Online store",
  give:{res:"Stock item", resS:"goods available to sell", evt:"Sale", evtS:"a row per line of an order",
        agtIn:"Merchant", agtOut:"Customer"},
  take:{res:"Cash", resS:"what the gateway settles", evt:"Payment", evtS:"a row per charge",
        agtIn:"Merchant", agtOut:"Customer"},
  gap:"The gap to look for is goods shipped with no settled payment."},
 {id:"lib", n:"Library loan",
  give:{res:"Book copy", resS:"a physical thing, one at a time", evt:"Loan", evtS:"a row per borrowing",
        agtIn:"Librarian", agtOut:"Borrower"},
  take:{res:"Book copy", resS:"the same one, coming back", evt:"Return", evtS:"a row per return",
        agtIn:"Librarian", agtOut:"Borrower"},
  gap:"The gap to look for is a loan with no matching return, which is an overdue notice."},
 {id:"clinic", n:"Clinic visit",
  give:{res:"Consultation slot", resS:"a doctor's time", evt:"Appointment", evtS:"a row per booking",
        agtIn:"Doctor", agtOut:"Patient"},
  take:{res:"Fee", resS:"cash or an insurance claim", evt:"Billing", evtS:"a row per charge raised",
        agtIn:"Clinic", agtOut:"Patient or insurer"},
  gap:"The gap to look for is a consultation that was given and never billed."}
];
let reaSel="enlist";
const RB_W=240, RB_H=60;
function reaBox(x,y,kind,label,val,sub){
  const col=kind==="res"?"var(--res)":kind==="evt"?"var(--req)":"var(--line3)";
  const bg =kind==="evt"?"rgba(194,65,12,.08)":"var(--panel2)";
  return `<g transform="translate(${x},${y})">
    <rect width="${RB_W}" height="${RB_H}" rx="7" fill="${bg}" stroke="${col}" stroke-width="1.7"/>
    <text x="12" y="18" fill="${col}" font-family="var(--sans)" font-size="14" font-weight="600">${label}</text>
    <text x="12" y="37" fill="var(--ink)" font-family="var(--sans)" font-size="15" font-weight="600">${val}</text>
    <text x="12" y="54" fill="var(--faint)" font-family="var(--sans)" font-size="14">${sub}</text>
  </g>`;
}
function reaSide(d, dir, ox){
  const yR=8, yE=118, yA=228;
  const cE=[ox+RB_W/2, yE+RB_H/2];
  let g=reaBox(ox,yR,"res","Resource",d.res,d.resS)
      + reaBox(ox,yE,"evt","Event ("+dir+")",d.evt,d.evtS)
      + reaBox(ox,yA,"agt","Agents",d.agtOut+" + "+d.agtIn,"one outside, one inside");
  // resource -> event, and agent -> event. The event is the many side of both.
  [[yR, 1],[yA, -1]].forEach(([yB,dirn])=>{
    const cB=[ox+RB_W/2, yB+RB_H/2];
    const [x1,y1]=edgePt(ox,yE,RB_W,RB_H,cB[0],cB[1]);
    const [x2,y2]=edgePt(ox,yB,RB_W,RB_H,cE[0],cE[1]);
    g+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--line2)" stroke-width="1.3"/>`
      +`<circle cx="${x2}" cy="${y2}" r="3" fill="var(--res)"/>`
      +crow(x1,y1,x2,y2);
    g+=`<text x="${ox+RB_W/2+8}" y="${(y1+y2)/2+3}" fill="var(--faint)"
          font-family="var(--sans)" font-size="14">${dirn>0?"changes":"acts in"}</text>`;
  });
  return g;
}
function renderRea(){
  const r=REA.find(x=>x.id===reaSel);
  $("#reaTab").innerHTML=REA.map(x=>
    `<button data-r="${x.id}" aria-pressed="${x.id===reaSel}">${x.n}</button>`).join("");
  $$("#reaTab button").forEach(el=>el.onclick=()=>{reaSel=el.dataset.r;renderRea()});

  const L=10, R=510, yE=118;
  const svg=`<svg viewBox="0 0 760 300" style="min-width:760px" xmlns="http://www.w3.org/2000/svg">
    ${reaSide(r.give,"give",L)}
    ${reaSide(r.take,"take",R)}
    <line x1="${L+RB_W}" y1="${yE+RB_H/2}" x2="${R}" y2="${yE+RB_H/2}"
          stroke="var(--req)" stroke-width="1.6" stroke-dasharray="5 4"/>
    <text x="${(L+RB_W+R)/2}" y="${yE+RB_H/2-10}" fill="var(--req)" text-anchor="middle"
          font-family="var(--sans)" font-size="14" font-weight="600">Duality</text>
    <text x="${(L+RB_W+R)/2}" y="${yE+RB_H/2+20}" fill="var(--faint)" text-anchor="middle"
          font-family="var(--sans)" font-size="14">one pays for the other</text>
  </svg>`;
  $("#reaDia").innerHTML=svg;

  const v=$("#reaVerdict");
  v.className="verdict ok";
  v.innerHTML=`<b>The same structure in every case</b>The labels change and the six boxes stay the same. ${r.gap}`;
}
renderRea();
