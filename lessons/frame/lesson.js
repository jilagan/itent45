/* Lesson frame. Widget code for the markup in lesson.html.
   Two widgets: a fact sorter (#frSort) and a test chooser (#frTest). Both are plain buttons, so mouse, touch and keyboard all work. */

/* ---------- fact sorter ---------- */
const FR_BOXES=[["input","Input"],["output","Output"],["limit","Limit"],["unknown","Still unknown"]];
const FR_FACTS=[
 {id:"budget",  t:"Budget: 5,000 pesos",              box:"limit",   why:"A budget is a ceiling the plan cannot cross."},
 {id:"size",    t:"Booth size: 2 by 3 meters",        box:"limit",   why:"The booth size caps what fits inside."},
 {id:"hours",   t:"Fair hours: 9 AM to 5 PM",         box:"limit",   why:"The hours cap when anything can happen."},
 {id:"roster",  t:"Roster of 24 members",             box:"input",   why:"The roster is what the team starts with."},
 {id:"photos",  t:"Photos from last year's fair",     box:"input",   why:"Old photos are material the team starts with."},
 {id:"sheet",   t:"A sign-up sheet with 100 names",   box:"output",  why:"The sheet is something the team must produce."},
 {id:"plan",    t:"Booth layout and shift plan",      box:"output",  why:"The plan is a product of the work."},
 {id:"visitors",t:"How many visitors will come",      box:"unknown", why:"Nobody has stated this number yet."},
 {id:"power",   t:"Whether the booth has electricity",box:"unknown", why:"The brief does not say, so the team must ask."},
 {id:"beside",  t:"Which orgs sit beside us",         box:"unknown", why:"The map is not published yet."}
];
/* fixed display order, so the cards do not arrive grouped by box */
const FR_ORDER=["roster","power","budget","sheet","beside","hours","photos","plan","visitors","size"];
const FR_WORDS=["zero","one","two","three","four","five","six","seven","eight","nine","ten"];
const frFact=id=>FR_FACTS.find(f=>f.id===id);
const frBoxName=id=>FR_BOXES.find(b=>b[0]===id)[1];
const frEsc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
const FR_START=`<b>Ten fact cards</b>Press a card to select it.`;

const frSortRoot=$("#frSort");
const frS={sel:null, placed:{}, wrong:0, fx:null, v:{cls:"",h:FR_START}};

function frFocus(root,k){ if(!k) return; const el=root.querySelector(`[data-k="${k}"]`); if(el) el.focus({preventScroll:true}); }

function frSortRender(focusKey){
  const left=FR_ORDER.filter(id=>!(id in frS.placed));
  const n=FR_FACTS.length;
  let h=`<p class="frstat"><span><b>${n-left.length}</b> of ${n} placed</span><span><b>${frS.wrong}</b> wrong ${frS.wrong===1?"try":"tries"}</span></p>`
       +`<div class="verdict ${frS.v.cls}" role="status">${frS.v.h}</div>`;
  if(left.length){
    h+=`<div class="frcards" role="group" aria-label="Fact cards">`
      +left.map(id=>`<button type="button" class="frcard${frS.fx===id?" frno":""}" data-k="c:${id}" data-card="${id}" aria-pressed="${frS.sel===id}">${frEsc(frFact(id).t)}</button>`).join("")
      +`</div>`;
  }
  h+=`<div class="frboxes">`+FR_BOXES.map(([bid,bn])=>{
    const inb=FR_ORDER.filter(id=>frS.placed[id]===bid);
    return `<div class="frbox${frS.sel?" armed":""}">`
      +`<button type="button" class="frbox-h" data-k="b:${bid}" data-box="${bid}" aria-label="${bn}, ${inb.length} placed. ${frS.sel?"Press to put the selected card here.":"Select a card first."}">${bn}<span class="frn">${inb.length}</span></button>`
      +`<div class="frchips">`+inb.map(id=>`<button type="button" class="frchip" data-k="p:${id}" data-chip="${id}" aria-label="${frEsc(frFact(id).t)}, in ${bn}. Press to send it back.">${frEsc(frFact(id).t)}</button>`).join("")+`</div></div>`;
  }).join("")+`</div>`
    +`<div class="ctrls"><button type="button" class="btn" data-reset>Reset</button></div>`;
  frSortRoot.innerHTML=h;
  frFocus(frSortRoot,focusKey);
  frS.fx=null;
}

frSortRoot.addEventListener("click",e=>{
  const c=e.target.closest("[data-card]"), b=e.target.closest("[data-box]"), p=e.target.closest("[data-chip]"), r=e.target.closest("[data-reset]");
  if(r){ frS.sel=null; frS.placed={}; frS.wrong=0; frS.v={cls:"",h:FR_START}; frSortRender("c:"+FR_ORDER[0]); return; }
  if(c){
    const id=c.dataset.card;
    frS.sel = frS.sel===id ? null : id;
    frS.v = frS.sel ? {cls:"",h:`<b>${frEsc(frFact(id).t)}</b>Now press the box where it belongs.`} : {cls:"",h:FR_START};
    frSortRender("c:"+id); return;
  }
  if(p){
    const id=p.dataset.chip; delete frS.placed[id];
    frS.v={cls:"",h:`<b>${frEsc(frFact(id).t)}</b>Back in the row. Press it to try another box.`};
    frSortRender("c:"+id); return;
  }
  if(b){
    const bid=b.dataset.box;
    if(!frS.sel){ frS.v={cls:"",h:`<b>Select a card first</b>Press one of the fact cards, then press a box.`}; frSortRender("b:"+bid); return; }
    const f=frFact(frS.sel);
    if(f.box===bid){
      frS.placed[f.id]=bid; frS.sel=null;
      if(Object.keys(frS.placed).length===FR_FACTS.length){
        const u=FR_FACTS.filter(x=>x.box==="unknown").length;
        frS.v={cls:"ok",h:`<b>All ${FR_WORDS[FR_FACTS.length]} facts are sorted</b>The ${FR_WORDS[u]} unknown facts are questions for the organizers, and the team asks them before buying anything.`};
      } else frS.v={cls:"ok",h:`<b>${frBoxName(bid)}</b>${f.why}`};
    } else {
      frS.wrong++; frS.fx=f.id; frS.sel=null;
      frS.v={cls:"bad",h:`<b>Try another box</b>${f.why}`};
    }
    frSortRender(frS.v.cls==="bad" ? "c:"+f.id : "b:"+bid);
  }
});
frSortRender();

/* ---------- test chooser ---------- */
/* each option: [text, isCheckable, reason] */
const FR_TESTS=[
 {goal:"Make the booth popular", o:[
   ["Visitors enjoy the booth",false,"Enjoyment is an opinion, so two people can disagree."],
   ["At least 100 visitors sign up by 5 PM",true,"A count and a time give one answer."],
   ["The booth looks lively",false,"Liveliness depends on who is looking."]]},
 {goal:"Stay within budget", o:[
   ["Receipts add up to 5,000 pesos or less",true,"Adding up receipts gives one answer."],
   ["Spend the money wisely",false,"Wise is a judgment with no number."],
   ["Avoid overspending by much",false,"\"By much\" leaves the limit open."]]},
 {goal:"Volunteers are prepared", o:[
   ["Volunteers feel ready",false,"Feeling ready varies by person."],
   ["Volunteers know the org well",false,"Knowing well has no measure."],
   ["Every volunteer attends the 30-minute briefing",true,"Attendance is a yes or no for each person."]]},
 {goal:"Setup finishes on time", o:[
   ["Setup goes smoothly",false,"Smooth is an impression."],
   ["Banner and tables are in place at 9 AM",true,"Anyone can look at the booth at 9 AM and answer yes or no."],
   ["Setup finishes early enough",false,"\"Early enough\" names no time."]]}
];
const frTestRoot=$("#frTest");
const frT={r:0, solved:false, tried:[], right:-1, wrong:0, v:null};
const frTStart=()=>({cls:"",h:`<b>Round ${frT.r+1} of ${FR_TESTS.length}</b>Press the test that anyone could check the same way.`});

function frTestRender(focusKey){
  const t=FR_TESTS[frT.r], last=frT.r===FR_TESTS.length-1;
  if(!frT.v) frT.v=frTStart();
  let h=`<p class="frstat"><span>Round <b>${frT.r+1}</b> of ${FR_TESTS.length}</span><span><b>${frT.wrong}</b> wrong ${frT.wrong===1?"try":"tries"}</span></p>`
       +`<p class="frgoal">Goal: ${frEsc(t.goal)}</p>`
       +`<div class="fropts" role="group" aria-label="Candidate tests">`
       +t.o.map((o,i)=>{
          const cls=(frT.right===i?" right":"")+(frT.tried.includes(i)?" tried":"");
          return `<button type="button" class="fropt${cls}" data-k="o:${i}" data-opt="${i}" aria-disabled="${frT.solved}">${frEsc(o[0])}</button>`;
        }).join("")+`</div>`
       +`<div class="verdict ${frT.v.cls}" role="status">${frT.v.h}</div>`
       +`<div class="ctrls">`+(frT.solved&&!last?`<button type="button" class="btn primary" data-k="next" data-next>Next round</button>`:"")
       +`<button type="button" class="btn" data-reset>Reset</button></div>`;
  frTestRoot.innerHTML=h;
  frFocus(frTestRoot,focusKey);
}

frTestRoot.addEventListener("click",e=>{
  const o=e.target.closest("[data-opt]"), n=e.target.closest("[data-next]"), r=e.target.closest("[data-reset]");
  if(r){ Object.assign(frT,{r:0,solved:false,tried:[],right:-1,wrong:0,v:null}); frTestRender("o:0"); return; }
  if(n){ frT.r++; Object.assign(frT,{solved:false,tried:[],right:-1,v:null}); frTestRender("o:0"); return; }
  if(o){
    if(frT.solved) return;
    const i=+o.dataset.opt, opt=FR_TESTS[frT.r].o[i], last=frT.r===FR_TESTS.length-1;
    if(opt[1]){
      frT.solved=true; frT.right=i;
      frT.v = last
        ? {cls:"ok",h:`<b>${FR_WORDS[FR_TESTS.length].replace(/^./,m=>m.toUpperCase())} checkable tests</b>Anyone who counts the names at 5 PM or adds up the receipts reaches the same result.`}
        : {cls:"ok",h:`<b>Anyone can check it</b>${opt[2]}`};
      frTestRender(last?"o:"+i:"next");
    } else {
      frT.wrong++; if(!frT.tried.includes(i)) frT.tried.push(i);
      frT.v={cls:"bad",h:`<b>Try another test</b>${opt[2]}`};
      frTestRender("o:"+i);
    }
  }
});
frTestRender();
