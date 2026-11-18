#!/usr/bin/env python3
"""Screenshots of lessons for a look-over. Needs Playwright and Chrome.
    python3 tools/shots.py DIR OUTDIR [lesson ids...]
For each lesson: alone, with ?c=<first course>, and the Canvas view (?embed=1), at 1440x900 and 390x800.
Also the home pages and library.html. Default lessons: one or two from each area."""
import sys, pathlib
from playwright.sync_api import sync_playwright
D = pathlib.Path(sys.argv[1]).resolve(); O = pathlib.Path(sys.argv[2]); O.mkdir(parents=True, exist_ok=True)
ids = sys.argv[3:] or "tiers rest sql norm server vm split break tokens attn".split()
modes = {"alone": "", "course": "?c=itent45", "embed": "?embed=1"}
sizes = {"d": (1440, 900), "m": (390, 800)}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    for i in ids:
        for mn, q in modes.items():
            for sn, (w, h) in sizes.items():
                pg = b.new_page(viewport={"width": w, "height": h})
                pg.goto(f"file://{D}/lessons/{i}.html{q}")
                try: pg.wait_for_function("window.__lessonReady===true", timeout=6000)
                except Exception: pass
                pg.wait_for_timeout(500); pg.screenshot(path=str(O / f"{i}-{mn}-{sn}.png")); pg.close()
    for f in ("index", "machine", "library"):
        for sn, (w, h) in sizes.items():
            pg = b.new_page(viewport={"width": w, "height": h}); pg.goto(f"file://{D}/{f}.html"); pg.wait_for_timeout(500)
            pg.screenshot(path=str(O / f"{f}-{sn}.png")); pg.close()
    b.close()
print("done")
