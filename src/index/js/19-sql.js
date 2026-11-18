/* ================= SQL CRUD ================= */
const SQL_SEED=[
 {code:"ITENT 45", title:"Application Dev & Emerging Tech", units:3, slots:4},
 {code:"CSCI 21",  title:"Data Structures",                units:3, slots:0},
 {code:"ITMGT 25", title:"Programming Fundamentals",       units:3, slots:12}
];
const STMTS=[
 {id:"sel",  v:"SELECT", danger:false,
  q:`SELECT code, title, slots\n  FROM courses;`,
  note:"Reads rows and changes nothing, so it can be run any number of times. A command like this is called <b>safe</b>, and SELECT is the only one of the four that is.",
  run:(r)=>({rows:r, out:r.length+" rows returned", mark:null, fx:"nothing changed"})},
 {id:"selw", v:"SELECT", danger:false,
  q:`SELECT *\n  FROM courses\n WHERE code = 'CSCI 21';`,
  note:"The same statement with a <code>WHERE</code> clause, which limits it to the rows that match. Write the filter here first, where it cannot change any data, before you use it on an UPDATE.",
  run:(r)=>({rows:r, out:"1 row returned", mark:{hit:"CSCI 21"}, fx:"nothing changed"})},
 {id:"ins",  v:"INSERT", danger:false,
  q:`INSERT INTO courses (code, title, units, slots)\nVALUES ('MATH 11', 'Linear Algebra', 3, 25);`,
  note:"Adds a row, and running it twice adds a second MATH 11. INSERT is not idempotent, and nothing stops the duplicate.",
  run:(r)=>{const n=[...r,{code:"MATH 11",title:"Linear Algebra",units:3,slots:25}];
            return {rows:n, out:"INSERT 0 1", mark:{add:"MATH 11"}, fx:"1 row added"};}},
 {id:"upd",  v:"UPDATE", danger:false,
  q:`UPDATE courses\n   SET slots = 10\n WHERE code = 'CSCI 21';`,
  note:"Changes one row. Run it again and slots is still 10, so it is idempotent, but it still changes data and is not safe.",
  run:(r)=>({rows:r.map(x=>x.code==="CSCI 21"?{...x,slots:10}:x),
             out:"UPDATE 1", mark:{chg:["CSCI 21"]}, fx:"1 row changed"})},
 {id:"updall", v:"UPDATE", danger:true,
  q:`UPDATE courses\n   SET slots = 0;`,
  note:"The same statement with the WHERE clause left off. It runs without complaint and changes every row in the table.",
  run:(r)=>({rows:r.map(x=>({...x,slots:0})), out:"UPDATE "+r.length,
             mark:{chg:r.map(x=>x.code)}, fx:r.length+" rows changed"})},
 {id:"del",  v:"DELETE", danger:false,
  q:`DELETE FROM courses\n WHERE code = 'ITMGT 25';`,
  note:"Removes the matching row. Run it again and nothing matches, so it is idempotent, and there is no undo.",
  run:(r)=>{const had=r.some(x=>x.code==="ITMGT 25");
            return {rows:r.filter(x=>x.code!=="ITMGT 25"),
                    out:"DELETE "+(had?1:0), mark:null, fx:had?"1 row removed":"0 rows matched"};}},
 {id:"delall", v:"DELETE", danger:true,
  q:`DELETE FROM courses;`,
  note:"Removes every row, with no filter, no confirmation and no undo. The printed count is the only sign that anything happened.",
  run:(r)=>({rows:[], out:"DELETE "+r.length, mark:null, fx:"table emptied"})}
];
const SQ={rows:JSON.parse(JSON.stringify(SQL_SEED)), sel:"sel", last:null, mark:null, ran:0};
function sqlRender(){
  const m=SQ.mark||{};
  $("#sqlBody").innerHTML = SQ.rows.length ? SQ.rows.map(r=>{
    const hit=m.hit===r.code, add=m.add===r.code, chg=(m.chg||[]).includes(r.code);
    const cls=add?"added":hit?"picked":"";
    const c=f=>`<td class="${f==="code"?"k ":""}${chg&&f==="slots"?"hl":""}">${r[f]}</td>`;
    return `<tr class="${cls}">${c("code")}${c("title")}${c("units")}${c("slots")}</tr>`;
  }).join("") : `<tr><td colspan="4" style="color:var(--warn);font-size:.85em">no rows</td></tr>`;
  $("#sqlCount").textContent=SQ.rows.length+" rows";

  $("#sqlList").innerHTML=STMTS.map(q=>`
    <button class="rq${q.id===SQ.sel?" on":""}" data-s="${q.id}">
      <span class="vb ${q.v==="SELECT"?"GET":q.v==="INSERT"?"POST":q.v==="UPDATE"?"PUT":"DELETE"}">${q.v}</span>
      <span class="pt">${q.q.split("\n")[0].replace(/</g,"&lt;")}<small>${q.danger?"<b style='color:var(--warn)'>no WHERE clause</b>":""}</small></span>
    </button>`).join("");
  $$("#sqlList .rq").forEach(el=>el.onclick=()=>{SQ.sel=el.dataset.s;SQ.ran=0;sqlRender()});

  const q=STMTS.find(x=>x.id===SQ.sel);
  $("#sqlOut").innerHTML =
    q.q.replace(/</g,"&lt;")
       .replace(/\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|SET|INTO|VALUES)\b/g,
                '<span class="kw">$1</span>')
       .replace(/'([^']*)'/g, "<span class=\"s\">'$1'</span>")
    + (SQ.last ? "\n\n<span class=\"c\">-- " + SQ.last + "</span>" : "");
  $("#sqlNote").innerHTML=q.note;
}
function sqlVerdict(q,res){
  const v=$("#sqlVerdict");
  if(q.danger){
    v.className="verdict bad";
    v.innerHTML=`<b>${res.fx}</b>The database did not ask for confirmation, and there is no undo. Write the <code>SELECT</code> with the same <code>WHERE</code> first and look at the rows it returns.`;
  } else if(q.v==="SELECT"){
    v.className="verdict ok";
    v.innerHTML=`<b>${res.out}, and the table is unchanged</b>Reading changes nothing, so you can run a SELECT against production without asking anyone.`;
  } else if(q.id==="ins" && SQ.rows.filter(x=>x.code==="MATH 11").length>1){
    const dup=SQ.rows.filter(x=>x.code==="MATH 11").length;
    v.className="verdict bad";
    v.innerHTML=`<b>${dup} rows are now called MATH 11</b>INSERT is not idempotent, so each run adds another row. Only a rule called a constraint can stop duplicates, and this table has none.`;
  } else {
    v.className="verdict warn";
    v.innerHTML=`<b>${res.out}</b>${SQ.ran>1
      ? `You have run it ${SQ.ran} times and the table has stopped changing. It is idempotent, but it still changed your data, so it is not safe.`
      : `Press Run again and watch whether anything changes.`}`;
  }
}
$("#sqlRun").onclick=()=>{
  const q=STMTS.find(x=>x.id===SQ.sel);
  const res=q.run(SQ.rows);
  SQ.rows=res.rows; SQ.mark=res.mark; SQ.last=res.out+"   ("+res.fx+")"; SQ.ran++;
  sqlRender(); sqlVerdict(q,res);
};
$("#sqlReset").onclick=()=>{
  SQ.rows=JSON.parse(JSON.stringify(SQL_SEED)); SQ.mark=null; SQ.last=null; SQ.ran=0;
  sqlRender(); $("#sqlVerdict").className="verdict"; $("#sqlVerdict").innerHTML="<b>The table is back to three rows</b>Pick a statement and press Run.";
};
sqlRender();
$("#sqlVerdict").className="verdict";
$("#sqlVerdict").innerHTML="<b>Pick a statement and press Run</b>Then press Run a second time to see what a repeat does.";

