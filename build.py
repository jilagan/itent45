#!/usr/bin/env python3
"""Assemble index.html and machine.html from src/. No dependencies.
   python3 build.py   python3 build.py --out /tmp/preview   (write somewhere else)"""
import json,pathlib,sys,re,html,math,shutil
root=pathlib.Path(__file__).resolve().parent
out_dir=pathlib.Path(sys.argv[sys.argv.index("--out")+1]) if "--out" in sys.argv else root
out_dir.mkdir(parents=True,exist_ok=True)
SITE="https://jilagan.github.io/itent45/"
def attrs(tag):
    return {k:html.unescape(v) for k,v in re.findall(r'([\w-]+)="([^"]*)"',tag)}
def text(h):
    return html.unescape(re.sub(r"\s+"," ",re.sub(r"<[^>]+>","",h))).strip()
def heights():
    """px at 700 wide, by (module, panel), from the structure audit table."""
    out={}
    f=root/"docs"/"audit-structure.md"
    if f.exists():
        for m in re.finditer(r"^\| (M[12]) \| (\w+) \| (\d+) \| (\d+) \| (\d+) \|",f.read_text(encoding="utf-8"),re.M):
            out[(m.group(1),m.group(2))]=int(m.group(5))
    return out
def embed_index(out_dir):
    hts=heights(); rows=[]
    for page,mod,label in (("index","M1","Module 1 (index.html)"),("machine","M2","Module 2 (machine.html)")):
        d=root/"src"/page
        shell=(d/"shell.html").read_text(encoding="utf-8")
        nav=re.findall(r'<button[^>]*data-p="(\w+)"[^>]*>.*?<span class="lbl">(.*?)</span>',shell,re.S)
        files={}
        for f in json.loads((d/"order.json").read_text(encoding="utf-8")):
            h=(d/"panels"/f).read_text(encoding="utf-8")
            m=re.search(r'<section[^>]*id="p-(\w+)"',h)
            if m: files[m.group(1)]=h
        rows.append(f"<h2>{html.escape(label)}</h2>")
        rows.append("<table><thead><tr><th>Panel or section</th><th>Embed URL</th><th>Snippet</th></tr></thead><tbody>")
        def row(title,url,h,kind):
            url=url.replace(SITE,"@@BASE@@")
            snip=(f'<iframe src="{url}" width="100%" height="{h}" style="border:0" loading="lazy" title="{html.escape(title,quote=True)}"></iframe>')
            rows.append(f'<tr class="{kind}"><td>{html.escape(title)}</td><td><a class="lnk" data-path="{html.escape(url.replace("@@BASE@@",""),quote=True)}" href="#" target="_blank" rel="noopener">{html.escape(url.replace("@@BASE@@",""))}</a><br><small>height {h}</small></td>'
                        f'<td><textarea readonly rows="3" class="snip" data-tpl="{html.escape(snip,quote=True)}" aria-label="Snippet for {html.escape(title,quote=True)}"></textarea> <button type="button" class="cp">Copy</button></td></tr>')
        for pid,lbl in nav:
            h=files.get(pid)
            if h is None: continue
            m=re.search(r"<h2[^>]*>(.*?)</h2>",h,re.S); title=text(m.group(1)) if m else text(lbl)
            secs=[attrs(t) for t in re.findall(r'<div[^>]*class="sec"[^>]*>',h)]
            base=f"@@BASE@@{page}.html?embed=1"
            if len(secs)>=2:
                row(title+" (whole panel, with section tabs)",f"{base}#{pid}",900,"panel")
                for a in secs:
                    row(f"{title}: {a.get('data-title',a.get('data-sec',''))}",f"{base}#{pid}/{a.get('data-sec','')}",900,"sec")
            else:
                px=hts.get((mod,pid)); ht=int(math.ceil((px+80)/50.0)*50) if px else 900
                row(title,f"{base}#{pid}",ht,"panel")
        rows.append("</tbody></table>")
    page=f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>ITENT 45 embed index</title>
<style>
body{{font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:#1a1d23;margin:0;padding:24px;max-width:1200px}}
h1{{font-size:1.5em;margin:0 0 8px}} h2{{font-size:1.2em;margin:32px 0 8px}}
table{{border-collapse:collapse;width:100%}} th,td{{text-align:left;vertical-align:top;padding:8px 10px;border-top:1px solid #d8dce3;font-size:15px}}
th{{border-top:0;border-bottom:1px solid #c4cad4}} tr.sec td:first-child{{padding-left:28px}} tr.panel td:first-child{{font-weight:600}}
td:nth-child(2){{width:28%;word-break:break-all}} td:nth-child(3){{width:44%}}
textarea{{width:100%;font:13px/1.4 ui-monospace,Menlo,Consolas,monospace;padding:6px;border:1px solid #c4cad4;border-radius:4px;resize:vertical}}
button{{font:inherit;font-size:15px;min-height:36px;padding:4px 14px;margin-top:4px;border:1px solid #1f5fbf;background:#fff;color:#1f5fbf;border-radius:6px;cursor:pointer}}
input{{font:inherit;width:100%;max-width:520px;padding:6px 8px;border:1px solid #c4cad4;border-radius:4px}}
a{{color:#1f5fbf}} small{{color:#5b6270}} code{{font:14px ui-monospace,Menlo,Consolas,monospace}}
</style></head><body>
<h1>ITENT 45 embed index</h1>
<p><label for="base"><b>Base URL of the published site</b></label><br><input id="base" type="url" value="{SITE}" spellcheck="false"></p>
<p>The snippets and links below use this address and change as you edit it. The links work after the branch is published.</p>
<p>For the instructor. Paste a snippet into the HTML view of a Canvas page. Add a plain link to the full site under each frame in case the frame is blocked.</p>
<p>Options on any URL: <code>&amp;cyu=0</code> hides the questions, <code>&amp;video=0</code> hides the video, <code>&amp;theme=dark</code> uses the dark theme. <code>?instructor=1</code> on the full site shows the instructor notes.
Heights for panels without sections come from the layout audit at 700 px wide. Check them against the live panel.</p>
{''.join(rows)}
<script>
const baseEl=document.getElementById("base");
function fill(){{let b=baseEl.value.trim();if(b&&!b.endsWith("/"))b+="/";
 document.querySelectorAll(".snip").forEach(t=>t.value=t.dataset.tpl.split("@@BASE@@").join(b));
 document.querySelectorAll(".lnk").forEach(a=>a.href=b+a.dataset.path);}}
baseEl.addEventListener("input",fill);fill();
document.querySelectorAll(".cp").forEach(b=>b.onclick=()=>{{const t=b.previousElementSibling;t.select();
 (navigator.clipboard?navigator.clipboard.writeText(t.value):Promise.reject()).catch(()=>document.execCommand("copy")).finally(()=>{{b.textContent="Copied";setTimeout(()=>b.textContent="Copy",1500)}});}});
</script>
</body></html>"""
    (out_dir/"embed.html").write_text(page,encoding="utf-8")
    print(f"built embed.html  {len(page):,} bytes")
def copy_art(out_dir):
    """Copy src/shared/art/*.webp to <out>/art/ and return the sorted list of slugs that exist.
       platform.js only inserts a picture for slugs in this list (window.COURSE.art), so there are no 404 requests."""
    src=root/"src"/"shared"/"art"
    files=sorted(src.glob("*.webp")) if src.is_dir() else []
    dst=out_dir/"art"
    if dst.is_dir():
        for old in dst.glob("*.webp"):
            if old.name not in {f.name for f in files}: old.unlink()
    if files:
        dst.mkdir(parents=True,exist_ok=True)
        for f in files: shutil.copyfile(f,dst/f.name)
    print(f"art: {len(files)} picture(s)")
    return [f.stem for f in files]
ART=copy_art(out_dir)
for page in ("index","machine"):
    d=root/"src"/page
    rd=lambda p:(d/p).read_text(encoding="utf-8")
    panels="".join(rd("panels/"+f) for f in json.loads(rd("order.json")))
    sh=root/"src"/"shared"
    opt=lambda p:p.read_text(encoding="utf-8") if p.exists() else ""
    cyu={}
    for f in sorted((d/"cyu").glob("*.json")):
        j=json.loads(f.read_text(encoding="utf-8")); cyu[j["panel"]]=j["items"]
    vids=json.loads(opt(d/"videos.json") or "[]")
    ga=json.loads(opt(sh/"analytics.json") or "{}")
    data="window.COURSE="+json.dumps({"page":page,"cyu":cyu,"videos":vids,"analytics":ga,"art":ART},ensure_ascii=False).replace("</","<\\/")+";\n"
    css=rd("style.css")+opt(sh/"theme.css")+opt(sh/"platform.css")
    js=data+"".join(rd("js/"+f) for f in json.loads(rd("js-order.json")))+opt(sh/"platform.js")+opt(sh/"analytics.js")
    sprite="".join('<symbol id="i-%s" viewBox="0 0 256 256">%s</symbol>'%(f.stem,re.search(r"<svg[^>]*>(.*)</svg>",f.read_text(encoding="utf-8"),re.S).group(1)) for f in sorted((sh/"icons").glob("*.svg")))
    sprite='<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">'+sprite+'</svg>'
    out=(rd("shell.html").replace("<body>","<body>\n"+sprite,1).replace("/*@@STYLE@@*/\n",css,1)
         .replace("<!--@@PANELS@@-->\n",panels,1)
         .replace("/*@@SCRIPT@@*/\n",js,1))
    (out_dir/f"{page}.html").write_text(out,encoding="utf-8")
    print(f"built {page}.html  {len(out):,} bytes")
embed_index(out_dir)
