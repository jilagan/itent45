/* Lesson debug. Widget code for the markup in lesson.html. */
/* The shop program, step by step. The same steps run in the tracer and in the test runner. */
const DB_TEXT=[
 "Set price to 120",
 "Set quantity to 3",
 "Set subtotal to price + quantity",
 "If subtotal is over 300, set discount to 10 percent of subtotal. Otherwise set discount to 0.",
 "Set total to subtotal minus discount"
];
const DB_OPS={plus:(p,q)=>p+q, times:(p,q)=>p*q, minus:(p,q)=>p-q};
const DB_CMPS={over:s=>s>300, atleast:s=>s>=300, equal:s=>s===300};
const DB_RIGHT={op:"times", cmp:"atleast"};   /* the rule: 10 percent off orders of 300 pesos or more */
const DB_ORDER=[["price",1],["quantity",2],["subtotal",3],["discount",4],["total",5]];
const dbMoney=x=>Math.round(x*100)/100;
/* Run step k with the values so far. Returns the value the step sets. */
function dbStep(k,v,op,cmp){
  if(k===1) return 120;
  if(k===2) return 3;
  if(k===3) return DB_OPS[op](v.price,v.quantity);
  if(k===4) return DB_CMPS[cmp](v.subtotal) ? v.subtotal/10 : 0;
  return v.subtotal-v.discount;
}
/* A whole order, used by the tests. */
function dbOrder(price,qty,op,cmp){
  const v={price:price, quantity:qty};
  v.subtotal=dbStep(3,v,op,cmp); v.discount=dbStep(4,v,op,cmp); v.total=dbStep(5,v,op,cmp);
  return dbMoney(v.total);
}

/* ---------- step 2: the tracer ---------- */
const DBT={ran:0, vals:{}, found:false, msg:null};
const DBT_START={cls:"verdict", html:"<b>Run the steps one at a time</b>Press Wrong on the first step that gives a wrong result."};
function dbTrRender(){
  $("#dbSteps").innerHTML=DB_TEXT.map((t,i)=>{
    const k=i+1, done=k<=DBT.ran, name=DB_ORDER[i][0];
    const cause=DBT.found===k;
    return `<li class="dbs${done?"":" todo"}${cause?" cause":""}" data-k="${k}">
      <span class="dbn">${k}</span><span class="dbt">${t}</span>
      <span class="dbr">${done?name+" = "+DBT.vals[name]+(cause?"   (wrong)":""):""}</span>
      ${done?`<button class="btn dbw" type="button" data-k="${k}" aria-label="Step ${k} gave a wrong result">Wrong</button>`:""}
    </li>`;
  }).join("");
  $$("#dbSteps .dbw").forEach(b=>b.onclick=()=>dbFlag(+b.dataset.k));
  $("#dbCount").textContent="Steps run: "+DBT.ran+" of 5";
  $("#dbRun").disabled = DBT.ran>=5;
  const m=DBT.msg||DBT_START;
  const v=$("#dbTrV"); v.className=m.cls; v.innerHTML=m.html;
}
function dbTrRun(){
  if(DBT.ran>=5) return;
  const k=DBT.ran+1, name=DB_ORDER[k-1][0];
  DBT.vals[name]=dbStep(k,DBT.vals,"plus","over");   /* the program as written */
  DBT.ran=k;
  if(k===5 && !DBT.found){
    DBT.msg={cls:"verdict warn", html:"<b>All five steps ran</b>The total is "+DBT.vals.total+" pesos, and 3 teas at 120 pesos with the discount should come to 324. Which step gave the first wrong value?"};
  }
  dbTrRender();
}
function dbFlag(k){
  const name=DB_ORDER[k-1][0];
  /* the step is wrong when the correct operation, given the same inputs, gives another value */
  const upTo={}; for(let i=1;i<k;i++) upTo[DB_ORDER[i-1][0]]=DBT.vals[DB_ORDER[i-1][0]];
  const actual=DBT.vals[name], should=dbStep(k,upTo,DB_RIGHT.op,DB_RIGHT.cmp);
  if(actual!==should){
    DBT.found=k;
    DBT.msg={cls:"verdict ok", html:"<b>Step "+k+" is the first wrong step</b>Step "+k+" added price and quantity: "+upTo.price+" + "+upTo.quantity+" = "+actual+". It should multiply them: "+upTo.price+" times "+upTo.quantity+" is "+should+"."};
  } else {
    DBT.msg={cls:"verdict warn", html:"<b>Step "+k+" gave the right result</b>Step "+k+" set "+name+" to "+actual+", which is right for the values it received."+(k>3?" Look back for the first value that went wrong.":"")};
  }
  dbTrRender();
}
$("#dbRun").onclick=dbTrRun;
$("#dbTrReset").onclick=()=>{DBT.ran=0; DBT.vals={}; DBT.found=false; DBT.msg=null; dbTrRender();};
dbTrRender();

/* ---------- step 3: the test runner ---------- */
const DB_TESTS=[[120,1,120],[120,3,324],[150,2,270],[100,0,0],[50,10,450],[200,1,200]];   /* price, teas, expected total */
const DB_OPT_OP=[["plus","plus"],["times","times"],["minus","minus"]];
const DB_OPT_CMP=[["over","over 300"],["atleast","300 or more"],["equal","equal to 300"]];
const DBX={op:"plus", cmp:"over", ran:false};
const DBX_START={cls:"verdict", html:"<b>Press Run tests</b>The choices start as the program was written in the trace."};
function dbTeRender(){
  const grp=(id,opts,key)=>{
    $(id).innerHTML=opts.map(([k,l])=>`<button type="button" data-k="${k}" aria-pressed="${DBX[key]===k}">${l}</button>`).join("");
    $$(id+" button").forEach(b=>b.onclick=()=>{DBX[key]=b.dataset.k; DBX.ran=false; dbTeRender();});
  };
  grp("#dbOp",DB_OPT_OP,"op"); grp("#dbCmp",DB_OPT_CMP,"cmp");
  const res=DB_TESTS.map(([p,q,e])=>{const g=dbOrder(p,q,DBX.op,DBX.cmp); return {p,q,e,g,ok:g===e};});
  $("#dbRows").innerHTML=res.map(r=>
    `<tr class="${DBX.ran?(r.ok?"pass":"fail"):""}"><td>${r.p}</td><td>${r.q}</td><td>${r.e}</td><td>${DBX.ran?r.g:"-"}</td><td>${DBX.ran?(r.ok?"Pass":"Fail"):"-"}</td></tr>`).join("");
  const v=$("#dbTeV");
  if(!DBX.ran){ v.className=DBX_START.cls+" dbv"; v.innerHTML=DBX_START.html; return; }
  const bad=res.filter(r=>!r.ok), n=res.length-bad.length;
  if(!bad.length){
    v.className="verdict ok dbv";
    v.innerHTML="<b>6 of 6 tests pass</b>Every order gives the expected total, including the order of exactly 300 pesos.";
    return;
  }
  const f=bad[0];
  let why = DBX.op!=="times" ? "Step 3 gives the wrong subtotal."
          : DBX.cmp==="over" ? "The subtotal is exactly 300, so the comparison in step 4 decides the result."
          : "Step 4 gives the discount only when the subtotal is exactly 300.";
  v.className="verdict warn dbv";
  v.innerHTML="<b>"+n+" of 6 tests pass</b>The order of "+f.q+(f.q===1?" tea":" teas")+" at "+f.p+" pesos fails: expected "+f.e+", got "+f.g+". "+why;
}
$("#dbRunT").onclick=()=>{DBX.ran=true; dbTeRender();};
$("#dbTeReset").onclick=()=>{DBX.op="plus"; DBX.cmp="over"; DBX.ran=false; dbTeRender();};
dbTeRender();
