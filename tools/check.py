#!/usr/bin/env python3
"""Click through built pages and report console/page errors.
   python3 tools/check.py DIR [panel ids...]"""
import sys,pathlib
from playwright.sync_api import sync_playwright
d=pathlib.Path(sys.argv[1]).resolve(); only=set(sys.argv[2:]); bad=0
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for page in ("index","machine"):
        pg=b.new_page(viewport={'width':1280,'height':900}); errs=[]; cur=["load"]
        pg.on("pageerror",lambda e:errs.append((cur[0],"pageerror",str(e)[:200])))
        pg.on("console",lambda m:errs.append((cur[0],"console",m.text[:200])) if m.type=="error" else None)
        pg.on("dialog",lambda dl:dl.dismiss())
        pg.goto(f"file://{d}/{page}.html"); pg.wait_for_timeout(600)
        ids=pg.evaluate("[...document.querySelectorAll('.panel')].map(p=>p.id.slice(2))")
        n=0
        for pid in ids:
            if only and pid not in only: continue
            cur[0]=pid; n+=1
            nb=pg.query_selector(f'[data-p="{pid}"]')
            if not nb: errs.append((pid,"check","no nav button")); continue
            pg.evaluate("b=>b.click()",nb); pg.wait_for_timeout(150)
            if not pg.evaluate(f"document.getElementById('p-{pid}').classList.contains('on')"): errs.append((pid,"check","panel did not open"))
            k=pg.evaluate(f"""async()=>{{const P=document.getElementById('p-{pid}');let k=0;
              for(const s of [null,...P.querySelectorAll('.sectab,[data-sectab]')]){{ if(s) s.click();
                for(const e of P.querySelectorAll('button,input[type=range],input[type=checkbox],select')){{
                  if(e.closest('a[href]')||e.offsetParent===null) continue;
                  try{{ if(e.tagName==='BUTTON') e.click(); else {{ if(e.type==='range') e.value=e.max; e.dispatchEvent(new Event('input',{{bubbles:true}})); e.dispatchEvent(new Event('change',{{bubbles:true}})); }} k++; }}catch(x){{}}
                  await new Promise(r=>setTimeout(r,15)); }} }} return k;}}""")
            pg.wait_for_timeout(250)
            raw=pg.evaluate(f"(document.getElementById('p-{pid}').innerText.match(/<\\/?(code|b|i|em|strong|span)>|&[a-z]+;|’|â€/g)||[]).slice(0,5)")
            if raw and pid not in ("clients","render","bytes"): errs.append((pid,"rawtext",str(raw)))
        print(f"{page}: {n} panels checked, {len(errs)} problems")
        for e in errs: print("  ",*e); bad+=1
        pg.close()
    b.close()
sys.exit(1 if bad else 0)
