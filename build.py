#!/usr/bin/env python3
"""Assemble index.html and machine.html from src/. No dependencies.
   python3 build.py   python3 build.py --out /tmp/preview   (write somewhere else)"""
import json,pathlib,sys
root=pathlib.Path(__file__).resolve().parent
out_dir=pathlib.Path(sys.argv[sys.argv.index("--out")+1]) if "--out" in sys.argv else root
out_dir.mkdir(parents=True,exist_ok=True)
for page in ("index","machine"):
    d=root/"src"/page
    rd=lambda p:(d/p).read_text(encoding="utf-8")
    panels="".join(rd("panels/"+f) for f in json.loads(rd("order.json")))
    out=(rd("shell.html").replace("/*@@STYLE@@*/\n",rd("style.css"),1)
         .replace("<!--@@PANELS@@-->\n",panels,1)
         .replace("/*@@SCRIPT@@*/\n","".join(rd("js/"+f) for f in json.loads(rd("js-order.json"))),1))
    (out_dir/f"{page}.html").write_text(out,encoding="utf-8")
    print(f"built {page}.html  {len(out):,} bytes")
