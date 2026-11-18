/* ================= SQL CRUD ================= */
const SQL_SEED=[
 {code:"ITENT 45", title:"Application Dev & Emerging Tech", units:3, slots:4},
 {code:"CSCI 21",  title:"Data Structures",                units:3, slots:0},
 {code:"ITMGT 25", title:"Programming Fundamentals",       units:3, slots:12}
];
const STMTS=[
 {id:"sel",  v:"SELECT", danger:false,
  q:`SELECT code, title, slots\n  FROM courses;`,
  note:"Reads and changes nothing. Run it a thousand times and the table is untouched. This is what <b>safe</b> means, and only one of the four qualifies.",
  run:(r)=>({rows:r, out:r.length+" rows returned", mark:null, fx:"nothing changed"})},
 {id:"selw", v:"SELECT", danger:false,
  q:`SELECT *\n  FROM courses\n WHERE code = 'CSCI 21';`,
  note:"The same statement with a <code>WHERE</code>. Get in the habit of writing the filter here first, where it cannot hurt you, before you put it on an UPDATE.",
  run:(r)=>({rows:r, out:"1 row returned", mark:{hit:"CSCI 21"}, fx:"nothing changed"})},
 {id:"ins",  v:"INSERT", danger:false,
  q:`INSERT INTO courses (code, title, units, slots)\nVALUES ('MATH 11', 'Linear Algebra', 3, 25);`,
  note:"Adds a row. Run it twice and you have two courses called MATH 11, exactly as POST gave you two rows in panel 05. Not idempotent, and nothing stops you.",
  run:(r)=>{const n=[...r,{code:"MATH 11",title:"Linear Algebra",units:3,slots:25}];
            return {rows:n, out:"INSERT 0 1", mark:{add:"MATH 11"}, fx:"1 row added"};}},
 {id:"upd",  v:"UPDATE", danger:false,
  q:`UPDATE courses\n   SET slots = 10\n WHERE code = 'CSCI 21';`,
  note:"Changes one row because the filter matched one row. Run it again and slots is still 10, so the end state does not move. Idempotent, and still not safe.",
  run:(r)=>({rows:r.map(x=>x.code==="CSCI 21"?{...x,slots:10}:x),
             out:"UPDATE 1", mark:{chg:["CSCI 21"]}, fx:"1 row changed"})},
 {id:"updall", v:"UPDATE", danger:true,
  q:`UPDATE courses\n   SET slots = 0;`,
  note:"The same statement with the filter left off. Valid SQL, runs without complaint, and touches every row in the table. Nothing in the database knows you meant one of them.",
  run:(r)=>({rows:r.map(x=>({...x,slots:0})), out:"UPDATE "+r.length,
             mark:{chg:r.map(x=>x.code)}, fx:r.length+" rows changed"})},
 {id:"del",  v:"DELETE", danger:false,
  q:`DELETE FROM courses\n WHERE code = 'ITMGT 25';`,
  note:"Removes the matching row. Run it again and it removes nothing, because there is nothing left to match. Same end state, so idempotent, and no undo.",
  run:(r)=>{const had=r.some(x=>x.code==="ITMGT 25");
            return {rows:r.filter(x=>x.code!=="ITMGT 25"),
                    out:"DELETE "+(had?1:0), mark:null, fx:had?"1 row removed":"0 rows matched"};}},
 {id:"delall", v:"DELETE", danger:true,
  q:`DELETE FROM courses;`,
  note:"Every row, no filter, no confirmation, no undo. The number it prints afterwards is the only sign anything happened.",
  run:(r)=>({rows:[], out:"DELETE "+r.length, mark:null, fx:"table emptied"})}
];
const SQ={rows:JSON.parse(JSON.stringify(SQL_SEED)), sel:"sel", last:null, mark:null, ran:0};
function sqlRender(){
  const m=SQ.mark||{};
  $("#sqlBody").innerHTML = SQ.rows.length ? SQ.rows.map(r=>{
    const hit=m.hit===r.code, add=m.add===r.code, chg=(m.chg||[]).includes(r.code);
    const cls=add?"added":hit?"picked":"";
    const c=f=>`<td class="${f==="code"?"k ":""}${chg&&f!=="code"?"hl":""}">${r[f]}</td>`;
    return `<tr class="${cls}">${c("code")}${c("title")}${c("units")}${c("slots")}</tr>`;
  }).join("") : `<tr><td colspan="4" style="color:var(--warn);font-family:var(--mono);font-size:.8em">no rows</td></tr>`;
  $("#sqlCount").textContent=SQ.rows.length+" rows";

  $("#sqlList").innerHTML=STMTS.map(q=>`
    <button class="rq${q.id===SQ.sel?" on":""}" data-s="${q.id}">
      <span class="vb ${q.v==="SELECT"?"GET":q.v==="INSERT"?"POST":q.v==="UPDATE"?"PUT":"DELETE"}">${q.v}</span>
      <span class="pt">${q.q.split("\n")[0].replace(/</g,"&lt;")}<small>${q.danger?"<b style='color:var(--warn)'>no WHERE clause</b>":"filtered"}</small></span>
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
    v.innerHTML=`<b>${res.fx}, and nothing asked whether you were sure</b>The filter was missing, so the statement applied to every row. It did not fail, it did not warn, and there is no undo. <b class="i">This is the most common way a person destroys production data</b>, and it is one forgotten line.<br><br>Write the <code>SELECT</code> with that same <code>WHERE</code> first. Look at what comes back. Then change the verb.`;
  } else if(q.v==="SELECT"){
    v.className="verdict ok";
    v.innerHTML=`<b>${res.out}, and the table is untouched</b>Reading changes nothing, so you can run it against production without asking anyone. The other three you cannot.`;
  } else if(q.id==="ins" && SQ.rows.filter(x=>x.code==="MATH 11").length>1){
    const dup=SQ.rows.filter(x=>x.code==="MATH 11").length;
    v.className="verdict bad";
    v.innerHTML=`<b>${dup} rows now called MATH 11</b>INSERT is not idempotent, exactly like POST in panel 05. Same statement, another row every time. Nothing in SQL stops you creating duplicates unless you asked for a constraint, and the table has no idea these are the same course.`;
  } else {
    v.className="verdict warn";
    v.innerHTML=`<b>${res.out}</b>${SQ.ran>1
      ? `Run ${SQ.ran} times and the table has stopped moving. ${q.v} is <b class="i">idempotent</b>: the end state after ten runs is the end state after one. It still changed your data, so it is not safe. Two separate questions.`
      : `Now press Run again and watch whether anything moves.`}`;
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
  sqlRender(); $("#sqlVerdict").className="verdict"; $("#sqlVerdict").innerHTML="<b>Back to three rows</b>Pick a statement and press Run.";
};
sqlRender();
$("#sqlVerdict").className="verdict";
$("#sqlVerdict").innerHTML="<b>Pick a statement and press Run</b>Then press Run a second time without changing anything, which is the part that tells you what the statement actually promised.";

