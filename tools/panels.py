#!/usr/bin/env python3
"""Print the panel tables for README.md from the nav in each shell.html and the h2 of each panel.
   python3 tools/panels.py"""
import re,json,html,pathlib
root=pathlib.Path(__file__).resolve().parent.parent
text=lambda h:html.unescape(re.sub(r"\s+"," ",re.sub(r"<[^>]+>","",h))).strip()
for page,title in (("index","Module 1 and related modules (index.html)"),("machine","Module 2 (machine.html)")):
    d=root/"src"/page
    shell=(d/"shell.html").read_text(encoding="utf-8")
    h2={}
    for f in json.loads((d/"order.json").read_text(encoding="utf-8")):
        s=(d/"panels"/f).read_text(encoding="utf-8")
        m=re.search(r'id="p-(\w+)"',s); t=re.search(r"<h2[^>]*>(.*?)</h2>",s,re.S)
        if m and t: h2[m.group(1)]=text(t.group(1))
    print(f"\n### {title}\n\n| Group | Panel | Opens with the heading |\n|---|---|---|")
    grp=""
    for m in re.finditer(r'<div class="navgrp">(.*?)</div>|<button[^>]*data-p="(\w+)"[^>]*>.*?<span class="lbl">(.*?)</span>',shell,re.S):
        if m.group(1): grp=text(m.group(1)); continue
        print(f"| {grp} | {text(m.group(3))} | {h2.get(m.group(2),'')} |")
