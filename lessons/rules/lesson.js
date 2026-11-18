/* Lesson rules. Widget code for the markup in lesson.html.
   Two widgets: the decision table (#rtTable) and the rule tester (#rtTester). All data is fixed.
   Styles are added here and scoped to #p-rules. */

(() => {

const peso = n => (Math.round(n * 100) / 100).toLocaleString("en-US", {maximumFractionDigits: 2});
const EDGE = 1000, STUDENT_PCT = 10, LARGE_PCT = 5;
const inside = (id, f) => { const e = $(id); if (e) f(e); };

/* ================= decision table ================= */
const ROWS = [[false, false], [false, true], [true, false], [true, true]].map(([student, over]) => {
  const pcts = [student ? STUDENT_PCT : 0, over ? LARGE_PCT : 0].filter(x => x > 0);
  const answer = pcts.length ? Math.max(...pcts) : 0;
  const why = pcts.length === 0 ? "Neither rule applies." : pcts.length === 1
    ? "Only the " + (student ? "student" : "large-order") + " rule applies."
    : "Both rules apply, and the store takes the larger discount.";
  return {student, over, answer, why};
});
const T = {pick: ROWS.map(() => ""), checked: false, solved: false};

function rtBuild() {
  let h = `<div class="rtrow hd"><span>Row</span><span>Student</span><span>Over 1,000 pesos</span><span>Discount</span></div>`;
  ROWS.forEach((r, i) => {
    h += `<div class="rtrow" data-r="${i}"><span>${i + 1}</span><span>${r.student ? "Yes" : "No"}</span><span>${r.over ? "Yes" : "No"}</span>
      <span><select data-r="${i}" aria-label="Discount for row ${i + 1}: student ${r.student ? "yes" : "no"}, over 1,000 pesos ${r.over ? "yes" : "no"}">
        <option value="">Choose</option><option value="0">0 percent</option><option value="5">5 percent</option><option value="10">10 percent</option><option value="15">15 percent</option></select></span>
      <span class="rtnote" hidden></span></div>`;
  });
  $("#rtRows").innerHTML = h;
  $$("#rtRows select").forEach(s => s.onchange = () => {
    T.pick[+s.dataset.r] = s.value; T.checked = false; T.solved = false; rtRender();
  });
}
function rtRender() {
  const rows = $$("#rtRows .rtrow:not(.hd)");
  let right = 0;
  rows.forEach((row, i) => {
    const note = row.querySelector(".rtnote");
    row.classList.remove("ok", "no");
    note.hidden = true; note.innerHTML = "";
    if (!T.checked) return;
    const good = T.pick[i] !== "" && +T.pick[i] === ROWS[i].answer;
    if (good) right++;
    row.classList.add(good ? "ok" : "no");
    note.hidden = false;
    note.innerHTML = good ? `${ICO("check")}${ROWS[i].why}` : `Not yet. ${ROWS[i].why}`;
  });
  $("#rtRight .gv").textContent = T.checked ? right + " of " + ROWS.length : "None yet";
  $("#rtRight").classList.toggle("good", T.checked && right === ROWS.length);
  T.solved = T.checked && right === ROWS.length;
  $("#rtTry").hidden = !T.solved;
  rtVerdict();
  if (!T.solved) $("#rtTryVerdict").innerHTML = "";
  $$("#rtRows .rtrow").forEach(r => r.classList.remove("on"));
}
function rtVerdict(cls, head, body) {
  const v = $("#rtVerdict");
  if (head === undefined) {
    if (!T.checked) { cls = ""; head = "Fill the table"; body = "Choose a discount for every row, then press Check."; }
    else if (T.solved) { cls = "ok"; head = "Four rows, four results"; body = "A student with an order over 1,000 pesos gets 10 percent, the larger of the two."; }
    else {
      const n = ROWS.filter((r, i) => T.pick[i] !== "" && +T.pick[i] === r.answer).length;
      cls = "warn"; head = n + " of " + ROWS.length + " rows right"; body = "Read the note under each marked row and change your choice.";
    }
  }
  v.className = "verdict" + (cls ? " " + cls : "");
  v.innerHTML = `<b>${head}</b>${body}`;
}
$("#rtCheck").onclick = () => {
  if (T.pick.some(p => p === "")) { rtVerdict("warn", "Choose every discount", "Each row needs a discount before the table can be checked."); return; }
  T.checked = true; rtRender();
};
$("#rtReset").onclick = () => { T.pick = ROWS.map(() => ""); T.checked = false; T.solved = false; $$("#rtRows select").forEach(s => s.value = ""); $("#rtStudent").checked = true; $("#rtAmount").value = 1200; rtRender(); };
$("#rtTryBtn").onclick = () => {
  const student = $("#rtStudent").checked, amt = parseFloat($("#rtAmount").value);
  const v = $("#rtTryVerdict");
  if (!(amt >= 0)) { v.className = "verdict warn"; v.innerHTML = "<b>Enter an amount</b>Type the order amount in pesos."; return; }
  const over = amt > EDGE, i = ROWS.findIndex(r => r.student === student && r.over === over);
  $$("#rtRows .rtrow:not(.hd)").forEach((r, k) => r.classList.toggle("on", k === i));
  const d = ROWS[i].answer;
  v.className = "verdict ok";
  v.innerHTML = `<b>Row ${i + 1} applies</b>Discount ${d} percent, price ${peso(amt * (100 - d) / 100)} pesos.` + (amt === EDGE ? " An order of exactly 1,000 is not over 1,000." : "");
};
rtBuild(); rtRender();

/* ================= rule tester ================= */
const RULES = [
  {text: "Students get 10 percent off.", kind: "discount", pct: STUDENT_PCT, fires: o => o.student},
  {text: "Orders over 1,000 pesos get 5 percent off.", kind: "discount", pct: LARGE_PCT, fires: o => o.amount > EDGE},
  {text: "Members get free shipping.", kind: "shipping", fires: o => o.member}
];
const ORDERS = [
  {student: true, member: false, amount: 500},
  {student: false, member: false, amount: 1001},
  {student: true, member: false, amount: 1200},
  {student: false, member: false, amount: 1000},
  {student: false, member: true, amount: 1500},
  {student: true, member: true, amount: 1500},
  {student: false, member: false, amount: 200},
  {student: false, member: false, amount: 999}
];
const who = o => o.student && o.member ? "Student and member" : o.student ? "Student" : o.member ? "Member" : "Regular customer";
const label = o => `${who(o)}, ${peso(o.amount)} pesos`;
/* The problems come from the rules and the data, so the answer key follows the rules. */
const problem = o => {
  const d = RULES.filter(r => r.kind === "discount" && r.fires(o));
  if (d.length > 1) return "Two discounts compete: " + d.map(r => r.pct + " percent").join(" and ") + ".";
  if (o.amount === EDGE) return "The amount is exactly 1,000, the edge of \"over 1,000.\"";
  return null;
};
const F = {sel: -1, tested: new Set(), flags: new Set(), checked: false};

function ftBuild() {
  $("#rtOrders").innerHTML = ORDERS.map((o, i) =>
    `<div class="rtord" data-i="${i}"><button type="button" class="pick" data-i="${i}">${label(o)}</button>
     <button type="button" class="btn flag" data-i="${i}" aria-pressed="false" aria-label="Flag order: ${label(o)}">${ICO("flag")}Flag</button><span class="why" hidden></span></div>`).join("");
  $$("#rtOrders .pick").forEach(b => b.onclick = () => { F.sel = +b.dataset.i; F.tested.add(F.sel); ftRender(); });
  $$("#rtOrders .flag").forEach(b => b.onclick = () => {
    const i = +b.dataset.i;
    F.flags.has(i) ? F.flags.delete(i) : F.flags.add(i);
    F.tested.add(i); F.sel = i; F.checked = false; ftRender();
  });
}
function ftRender() {
  const o = ORDERS[F.sel];
  $("#rtRulesBox").innerHTML = RULES.map(r => {
    const f = o && r.fires(o);
    return `<div class="wrow rtrule${f ? " on" : ""}"><span>${r.text}</span><span class="f">${o ? (f ? "Fires" : "Does not fire") : ""}</span></div>`;
  }).join("");
  if (o) {
    const d = RULES.filter(r => r.kind === "discount" && r.fires(o));
    const parts = [d.length === 0 ? "No discount." : d.length === 1 ? "Discount: " + d[0].pct + " percent." : "Two discounts fire: " + d.map(r => r.pct + " percent").join(" and ") + "."];
    if (o.member) parts.push("Shipping: free.");
    $("#rtResult").innerHTML = `<b>${label(o)}.</b> ${parts.join(" ")}`;
  } else $("#rtResult").textContent = "Press an order to run the rules on it.";
  $$("#rtOrders .rtord").forEach((row, i) => {
    row.classList.remove("sel", "right", "wrong");
    row.classList.toggle("sel", i === F.sel);
    const fb = row.querySelector(".flag"), why = row.querySelector(".why");
    fb.setAttribute("aria-pressed", F.flags.has(i));
    why.hidden = true; why.textContent = "";
    if (F.checked) {
      const p = problem(ORDERS[i]), fl = F.flags.has(i);
      if (p && fl) { row.classList.add("right"); why.hidden = false; why.textContent = "Problem found. " + p; }
      else if (p && !fl) { row.classList.add("wrong"); why.hidden = false; why.textContent = "Missed. " + p; }
      else if (!p && fl) { row.classList.add("wrong"); why.hidden = false; why.textContent = "No problem here. One rule or none applies, and the amount is not on an edge."; }
    }
  });
  const need = ORDERS.map((x, i) => problem(x) ? i : -1).filter(i => i >= 0);
  const found = need.filter(i => F.flags.has(i)).length;
  const extra = [...F.flags].filter(i => !need.includes(i)).length;
  $("#rtTested .gv").textContent = F.tested.size + " of " + ORDERS.length;
  $("#rtFlagged .gv").textContent = F.flags.size;
  $("#rtFound .gv").textContent = F.checked ? found + " of " + need.length : "None yet";
  $("#rtFound").classList.toggle("good", F.checked && found === need.length && !extra);
  const v = $("#rtFlagVerdict");
  if (!F.checked) { v.className = "verdict"; v.innerHTML = "<b>Test the orders</b>Press each order, flag the ones with a problem, then press Check my flags."; return; }
  if (found === need.length && !extra) {
    v.className = "verdict ok";
    v.innerHTML = `<b>All ${need.length} problems found</b>Two student orders over 1,000 pesos fire two discount rules. The 1,000 peso order sits on the edge of "over 1,000."`;
  } else {
    v.className = "verdict warn";
    v.innerHTML = `<b>${found} of ${need.length} problems found</b>` + (extra ? `${extra} flagged ${extra === 1 ? "order has" : "orders have"} no problem. ` : "") + "Read the note under each marked order and change your flags.";
  }
}
$("#rtFlagCheck").onclick = () => { F.checked = true; ftRender(); };
$("#rtFlagReset").onclick = () => { F.sel = -1; F.tested = new Set(); F.flags = new Set(); F.checked = false; ftRender(); };
ftBuild(); ftRender();
})();
