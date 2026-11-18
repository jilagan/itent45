#!/usr/bin/env python3
"""Assemble index.html and machine.html from src/. No dependencies.
   python3 build.py"""
import json,pathlib
root=pathlib.Path(__file__).resolve().parent
for page in ("index","machine"):
    d=root/"src"/page
    rd=lambda p:(d/p).read_text(encoding="utf-8")
    panels="".join(rd("panels/"+f) for f in json.loads(rd("order.json")))
    out=(rd("shell.html").replace("/*@@STYLE@@*/\n",rd("style.css"),1)
         .replace("<!--@@PANELS@@-->\n",panels,1)
         .replace("/*@@SCRIPT@@*/\n",rd("app.js"),1))
    (root/f"{page}.html").write_text(out,encoding="utf-8")
    print(f"built {page}.html  {len(out):,} bytes")
