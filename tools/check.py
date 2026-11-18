#!/usr/bin/env python3
"""Click through built pages and report console/page errors.
   python3 tools/check.py DIR [panel ids...]            click through every panel and section
   python3 tools/check.py DIR --embed [panel ids...]    also load every panel and section in embed mode
                                                        at 700 px wide (zero-size canvases, overflow, errors)"""
import sys,pathlib
from playwright.sync_api import sync_playwright
args=[a for a in sys.argv[1:] if not a.startswith("--")]
EMBED="--embed" in sys.argv
d=pathlib.Path(args[0]).resolve(); only=set(args[1:]); bad=0
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
        if EMBED:
            ep=b.new_page(viewport={'width':700,'height':900}); eerr=[]; cur=["load"]
            ep.on("pageerror",lambda e:eerr.append((cur[0],"pageerror",str(e)[:200])))
            ep.on("console",lambda m:eerr.append((cur[0],"console",m.text[:200])) if m.type=="error" else None)
            ep.goto(f"file://{d}/{page}.html"); ids=ep.evaluate("""[...document.querySelectorAll('.panel')].map(p=>[p.id.slice(2),
              [...p.querySelectorAll(':scope > .sec')].map(s=>s.dataset.sec)])""")
            n=0
            for pid,secs in ids:
                if only and pid not in only: continue
                targets=[pid]+([f"{pid}/{s}" for s in secs] if len(secs)>=2 else [])
                for t in targets:
                    cur[0]="embed "+t; n+=1
                    ep.goto(f"file://{d}/{page}.html?embed=1#{t}"); ep.wait_for_timeout(250)
                    r=ep.evaluate("""t=>{const pid=t.split('/')[0],out=[];
                      const on=document.querySelector('.panel.on'); if(!on||on.id!=='p-'+pid) out.push('wrong panel open');
                      if(getComputedStyle(document.querySelector('.rail')).display!=='none') out.push('rail visible');
                      if(t.includes('/')){ const s=on&&on.querySelector(':scope > .sec.on'); if(!s||s.dataset.sec!==t.split('/')[1]) out.push('wrong section open');
                        if(on.querySelector('.sectabs')&&getComputedStyle(on.querySelector('.sectabs')).display!=='none') out.push('tab strip visible in section view'); }
                      document.querySelectorAll('canvas').forEach(c=>{ if(c.offsetParent!==null){ const r=c.getBoundingClientRect(); if(r.width<2||r.height<2||!c.width||!c.height) out.push('zero-size canvas #'+(c.id||'?')); }});
                      if(document.documentElement.scrollWidth>document.documentElement.clientWidth+1) out.push('horizontal overflow '+document.documentElement.scrollWidth+'px');
                      return out;}""",t)
                    for m in r: eerr.append((cur[0],"embed",m))
            print(f"{page} embed: {n} views checked, {len(eerr)} problems")
            for e in eerr: print("  ",*e); bad+=1
            ep.close()
    b.close()
sys.exit(1 if bad else 0)
