#!/usr/bin/env python3
"""Compare the new lesson pages with the old bundles, step by step. Needs Playwright and Chrome.

    python3 tools/equiv.py OLD_DIR NEW_DIR [lesson ids...]

OLD_DIR holds index.html and machine.html as they were before the restructure.
NEW_DIR holds the build output. For every lesson and every step it loads both with a fixed clock and a fixed random
seed, compares the visible text of the lesson, clicks the same controls in the same order in both pages and compares
the text again. Differences that come from the planned copy edits (wording that named the course, the capstone variable,
links in place of quoted titles) are listed too, so read them. Prints a summary and writes /tmp/work/equiv.json."""
import sys, json, re, difflib, pathlib, os
from concurrent.futures import ProcessPoolExecutor
from playwright.sync_api import sync_playwright

OLD, NEW = [pathlib.Path(a).resolve() for a in sys.argv[1:3]]
ONLY = set(sys.argv[3:])
SEED = "Math.random=function(){return 0.37};"   # a constant, so the answer-order shuffle in the questions is the same in both pages
CONTROLS = """()=>{
  const root=document.querySelector('.panel.on .sec.on')||document.querySelector('.panel.on')||document.querySelector('.panel');
  const out=[];
  root.querySelectorAll('button,input,select').forEach(e=>{
    if(e.closest('a[href]')||e.offsetParent===null||e.disabled) return;
    if(e.matches('.secbtn,.sectab,.navtoggle,.vid-go,.cyu-btn')||e.closest('.cyu')) return;
    out.push(e);
  });
  window.__ctl=out; return out.length;}"""
CLICK = """async i=>{
  const e=window.__ctl[i]; if(!e) return;
  if(e.tagName==='BUTTON') e.click();
  else if(e.type==='range'){ e.value=e.max; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); }
  else if(e.type==='checkbox'||e.type==='radio') e.click();
  else if(e.tagName==='SELECT'&&e.options.length>1){ e.selectedIndex=e.options.length-1; e.dispatchEvent(new Event('change',{bubbles:true})); }
}"""
TEXT = "()=>{const p=document.querySelector('.panel.on')||document.querySelector('.panel');document.querySelectorAll('details').forEach(d=>d.open=true);return p.innerText}"

def norm(s):
    s = re.sub(r"[\"“”]", "", s)
    s = s.replace("capstone project", "capstone")
    return re.sub(r"\s+", " ", s).strip()

def load(b, url, new):
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.add_init_script(SEED)
    pg.clock.install(time=1700000000000)
    pg.on("dialog", lambda d: d.dismiss())
    pg.goto(url)
    if new: pg.wait_for_function("window.__lessonReady===true", timeout=8000, polling=50)
    pg.clock.run_for(600)
    return pg

def shard(ids):
    res = {}
    old_pages = {}
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for i in ids:
            page = "machine" if i in AI else "index"
            # steps come from the new page
            pg = load(b, f"file://{NEW}/lessons/{i}.html?c=itent45", True)
            steps = pg.evaluate("[...document.querySelectorAll('.panel > .sec')].map(s=>s.dataset.sec)") or [""]
            pg.close()
            res[i] = []
            for s in steps:
                row = {"step": s}
                for phase in ("text", "clicked"):
                    texts = {}
                    for side in ("old", "new"):
                        url = f"file://{OLD}/{page}.html#{i}/{s}" if side == "old" else f"file://{NEW}/lessons/{i}.html?c=itent45#{s}"
                        try:
                            pg = load(b, url, side == "new")
                            if phase == "clicked":
                                n = pg.evaluate(CONTROLS)
                                for k in range(min(n, 40)):
                                    try: pg.evaluate(CLICK, k)
                                    except Exception: pass
                                    pg.clock.run_for(40)
                                pg.clock.run_for(3000)
                                row["controls"] = n
                            texts[side] = norm(pg.evaluate(TEXT))
                            pg.close()
                        except Exception as e:
                            texts[side] = "ERROR " + str(e)[:100]
                    row[phase] = texts
                res[i].append(row)
        b.close()
    return res

AI = set()
if __name__ == "__main__":
    course = json.loads((pathlib.Path(__file__).resolve().parent.parent / "courses" / "itent45.json").read_text(encoding="utf-8"))
    AI = {i for g in course["homes"][1]["groups"] for i in g["lessons"]}
    ids = sorted(f.stem for f in (NEW / "lessons").glob("*.html"))
    if ONLY: ids = [i for i in ids if i in ONLY]
    import multiprocessing as mp
    halves = [ids[0::2], ids[1::2]]
    with ProcessPoolExecutor(2, mp_context=mp.get_context("fork")) as ex:
        parts = list(ex.map(shard, halves))
    res = {}
    for r in parts: res.update(r)
    json.dump(res, open("/tmp/work/equiv.json", "w"), indent=1)
    same = diff = 0; lines = []
    for i in sorted(res):
        for row in res[i]:
            for phase in ("text", "clicked"):
                o, n = row[phase]["old"], row[phase]["new"]
                if o == n: same += 1; continue
                diff += 1
                sm = difflib.SequenceMatcher(None, o.split(" "), n.split(" "), autojunk=False)
                ch = []
                ow, nw = o.split(" "), n.split(" ")
                for tag, a, b2, c, d in sm.get_opcodes():
                    if tag != "equal": ch.append(f"[{' '.join(ow[a:b2])[:90]}] -> [{' '.join(nw[c:d])[:90]}]")
                lines.append(f"{i}/{row['step']} ({phase}): " + " | ".join(ch[:4]) + (f" (+{len(ch)-4} more)" if len(ch) > 4 else ""))
    print("\n".join(lines))
    print(f"{len(res)} lessons, {sum(len(v) for v in res.values())} steps, {same} identical comparisons, {diff} different")
