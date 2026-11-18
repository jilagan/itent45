#!/usr/bin/env python3
"""Print a table of every lesson, grouped by library area: id, rail label and the heading the lesson opens with.
   python3 tools/panels.py"""
import re, json, html, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
text = lambda h: html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", h))).strip()
lib = json.loads((root / "courses" / "library.json").read_text(encoding="utf-8"))
for a in lib["areas"]:
    print(f"\n### {a['label']}\n\n| Lesson | Label | Opens with the heading |\n|---|---|---|")
    for i in a["lessons"]:
        d = root / "lessons" / i
        m = json.loads((d / "meta.json").read_text(encoding="utf-8"))
        t = re.search(r"<h2[^>]*>(.*?)</h2>", (d / "lesson.html").read_text(encoding="utf-8"), re.S)
        print(f"| {i} | {m['label']} | {text(t.group(1)) if t else ''} |")
