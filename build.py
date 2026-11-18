#!/usr/bin/env python3
"""Build the lesson library. Python 3 standard library only.

    python3 build.py                 write the site into this folder
    python3 build.py --out /tmp/x    write it somewhere else

Sources
    lessons/<id>/{lesson.html, lesson.js, cyu.json, meta.json}   one folder per lesson
    lib/<name>.js                                                shared code, named in a lesson's meta "needs"
    courses/<course>.json                                        a course: homes, groups, vars
    courses/library.json                                         the library page: areas and their lessons
    shared/                                                      look, platform, icons, art
Output
    lessons/<id>.html      one standalone page per lesson
    courses/<course>.js    course data that a lesson page loads for ?c=<course>
    <home>.html            the home page of each course home (index.html, machine.html)
    library.html, embed.html, art/
See docs/AUTHORING.md."""
import json, pathlib, sys, re, html, math, shutil

ROOT = pathlib.Path(__file__).resolve().parent
OUT = pathlib.Path(sys.argv[sys.argv.index("--out") + 1]).resolve() if "--out" in sys.argv else ROOT
SITE = "https://jilagan.github.io/itent45/"
LIMIT = 300 * 1024
ERR = []

def err(msg): ERR.append(msg)
def rd(p): return pathlib.Path(p).read_text(encoding="utf-8")
def wr(p, s):
    p = pathlib.Path(p); p.parent.mkdir(parents=True, exist_ok=True); p.write_text(s, encoding="utf-8")
def esc(s): return html.escape(str(s), quote=True)
def jsn(o): return json.dumps(o, ensure_ascii=False).replace("</", "<\\/")
def text(h): return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", h))).strip()
def attrs(tag): return {k: html.unescape(v) for k, v in re.findall(r'([\w-]+)="([^"]*)"', tag)}
DEFAULT_VARS = {"project": "project"}
def fill(s, vars_=DEFAULT_VARS): return re.sub(r"\{\{\s*([\w-]+)\s*\}\}", lambda m: vars_.get(m.group(1), m.group(0)), s)

# ------------------------------------------------------------------ load
def load():
    L = {}
    for d in sorted((ROOT / "lessons").iterdir()):
        if not d.is_dir() or not (d / "meta.json").exists(): continue
        try: m = json.loads(rd(d / "meta.json"))
        except ValueError as e: err(f"{d.name}/meta.json: {e}"); continue
        m.setdefault("needs", []); m.setdefault("tags", []); m.setdefault("video", None)
        for k in ("id", "title", "label", "desc", "outcomes", "area"):
            if not m.get(k): err(f"{d.name}/meta.json: missing {k}")
        if m.get("id") != d.name: err(f"{d.name}/meta.json: id is {m.get('id')!r}, the folder is {d.name!r}")
        if not re.fullmatch(r"[A-Za-z0-9_-]+", d.name): err(f"{d.name}: the id may use letters, digits, - and _ only")
        if len(m.get("outcomes", [])) != 3: err(f"{d.name}/meta.json: outcomes must have 3 items")
        for f in ("lesson.html", "lesson.js", "cyu.json"):
            if not (d / f).exists(): err(f"{d.name}: missing {f}")
        if not all((d / f).exists() for f in ("lesson.html", "lesson.js", "cyu.json")): continue
        m["_html"] = rd(d / "lesson.html"); m["_js"] = rd(d / "lesson.js")
        try: m["_cyu"] = json.loads(rd(d / "cyu.json")).get("items", [])
        except ValueError as e: err(f"{d.name}/cyu.json: {e}"); m["_cyu"] = []
        v = m["video"]
        m["_videos"] = [] if not v else (v if isinstance(v, list) else [v])
        if not re.search(r'<section[^>]*class="panel"[^>]*id="p-%s"' % re.escape(d.name), m["_html"]) and \
           not re.search(r'<section[^>]*id="p-%s"[^>]*class="panel"' % re.escape(d.name), m["_html"]):
            err(f"{d.name}/lesson.html: needs <section class=\"panel\" id=\"p-{d.name}\">")
        L[d.name] = m
    return L

def load_courses():
    C = {}
    for f in sorted((ROOT / "courses").glob("*.json")):
        if f.stem == "library": continue
        try: C[f.stem] = json.loads(rd(f))
        except ValueError as e: err(f"courses/{f.name}: {e}"); continue
        if C[f.stem].get("id") != f.stem: err(f"courses/{f.name}: id must be {f.stem!r}")
    return C

# ------------------------------------------------------------------ validate
def validate(L, C, lib):
    libs = {p.stem for p in (ROOT / "lib").glob("*.js")}
    areas = {a["id"]: a for a in lib["areas"]}
    listed = {}
    for a in lib["areas"]:
        for i in a["lessons"]:
            if i not in L: err(f"library.json: {a['id']} lists {i}, which has no folder in lessons/")
            if i in listed: err(f"library.json: {i} is listed twice")
            listed[i] = a["id"]
    for i, m in L.items():
        if i not in listed: err(f"{i}: not listed in courses/library.json")
        elif m["area"] != listed[i]: err(f"{i}: meta area is {m['area']!r}, library.json lists it under {listed[i]!r}")
        if m["area"] not in areas: err(f"{i}: unknown area {m['area']!r}")
        for n in m["needs"]:
            if n not in libs: err(f"{i}: needs lib/{n}.js, which does not exist")
        found = set(re.findall(r'data-lesson="([^"]+)"', m["_html"]))
        found |= set(re.findall(r'data-lesson=\\?"([\w-]+)\\?"', m["_js"]))
        for t in found:
            if t not in L: err(f"{i}: data-lesson={t!r} points at a lesson that does not exist")
        for s in re.findall(r'<div[^>]*class="sec"[^>]*>', m["_html"]):
            if not attrs(s).get("data-sec"): err(f"{i}: a step has no data-sec")
    files = {}
    for cid, c in C.items():
        for h in c.get("homes", []):
            if h["file"] in files: err(f"course {cid}: home file {h['file']} is also used by course {files[h['file']]}")
            files[h["file"]] = cid
            if h["file"] in ("library.html", "embed.html"): err(f"course {cid}: {h['file']} is reserved")
            for g in h["groups"]:
                for i in g["lessons"]:
                    if i not in L: err(f"course {cid}: {h['file']} lists {i}, which has no folder in lessons/")
            for lk in h.get("links", []):
                if "home" in lk and lk["home"] not in {x["file"] for cc in C.values() for x in cc.get("homes", [])}:
                    err(f"course {cid}: link to home {lk['home']}, which does not exist")
        seen = {}
        for h in c.get("homes", []):
            for g in h["groups"]:
                for i in g["lessons"]:
                    if i in seen: err(f"course {cid}: {i} appears in {seen[i]} and {h['file']}")
                    seen[i] = h["file"]
    return libs

# ------------------------------------------------------------------ pieces
def sprite():
    parts = []
    for f in sorted((ROOT / "shared" / "icons").glob("*.svg")):
        m = re.search(r"<svg[^>]*>(.*)</svg>", rd(f), re.S)
        parts.append('<symbol id="i-%s" viewBox="0 0 256 256">%s</symbol>' % (f.stem, m.group(1)))
    return '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">' + "".join(parts) + "</svg>"

HEAD_JS = ('(function(){var d=document.documentElement,q=location.search;'
           'if(/[?&]embed=1(&|$)/.test(q))d.classList.add("embed");'
           'else if(/[?&]c=[\\w-]+(&|$)/.test(q))d.classList.add("has-course");'
           'if(/[?&]instructor=1(&|$)/.test(q))d.classList.add("instructor");'
           'var t=q.match(/[?&]theme=(dark|light)/);if(t)d.setAttribute("data-theme",t[1]);})();')

def css_all():
    sh = ROOT / "shared"
    return rd(sh / "lessons.css") + rd(sh / "theme.css") + rd(sh / "platform.css")
def css_basic():
    sh = ROOT / "shared"
    return rd(sh / "theme.css") + rd(sh / "platform.css")

def copy_art():
    src = ROOT / "shared" / "art"
    files = sorted(src.glob("*.webp")) if src.is_dir() else []
    dst = OUT / "art"
    if dst.is_dir():
        keep = {f.name for f in files}
        for old in dst.glob("*.webp"):
            if old.name not in keep: old.unlink()
    if files:
        dst.mkdir(parents=True, exist_ok=True)
        for f in files:
            if dst.resolve() != src.resolve(): shutil.copyfile(f, dst / f.name)
    print(f"art: {len(files)} picture(s)")
    return [f.stem for f in files]

def lesson_page(m, lib, L, ctx):
    i = m["id"]
    area = next(a for a in lib["areas"] if a["id"] == m["area"])
    order = area["lessons"]; k = order.index(i) if i in order else -1
    nxt = {"id": order[k + 1], "label": L[order[k + 1]]["label"]} if 0 <= k < len(order) - 1 and order[k + 1] in L else None
    data = {"id": i, "title": m["title"], "label": m["label"], "area": m["area"], "areaLabel": area["label"],
            "root": "../", "library": "../library.html", "next": nxt, "cyu": m["_cyu"], "videos": m["_videos"],
            "analytics": ctx["ga"], "art": ctx["art"], "artBase": "../art/"}
    libs = ["core"] + [n for n in m["needs"] if n != "core"]
    libjs = "".join(f"/* lib/{n}.js */\n" + rd(ROOT / "lib" / f"{n}.js") + "\n" for n in libs)
    sh = ROOT / "shared"
    platform = rd(sh / "course.js") + "\n" + rd(sh / "platform.js") + "\n" + rd(sh / "analytics.js")
    return f"""<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(m['title'])}</title>
<meta name="description" content="{esc(m['desc'])}">
<script>{HEAD_JS}</script>
<style>
{ctx['css']}</style>
</head>
<body>
{ctx['sprite']}
<div class="rig">
<aside class="rail" id="rail"></aside>
<main class="stage">
<header class="lbar" id="lbar"></header>
{m['_html']}
</main>
</div>
<script>window.LESSON={jsn(data)};</script>
<script>
{libjs}
/* lessons/{i}/lesson.js */
{m['_js']}
</script>
<script>
{platform}
</script>
</body>
</html>
"""

def course_script(cid, c, L):
    ids = [i for h in c.get("homes", []) for g in h["groups"] for i in g["lessons"]]
    data = dict(c); data["lessons"] = {i: {"label": L[i]["label"], "title": L[i]["title"], "desc": L[i]["desc"]} for i in ids if i in L}
    return ("window.COURSES=window.COURSES||{};\nwindow.COURSES[%s]=%s;\n" % (json.dumps(cid), jsn(data)))

def home_page(cid, c, h, L, all_ids):
    first = h["groups"][0]["lessons"][0]
    q = f"?c={cid}"
    groups = []
    for g in h["groups"]:
        lis = "".join(f'<li data-p="{i}"><a data-lesson="{i}" href="lessons/{i}.html{q}">{esc(L[i]["label"])}</a><span class="d">{esc(L[i]["desc"])}</span></li>' for i in g["lessons"])
        groups.append(f'<section class="home-group"><h3>{esc(g["label"])}</h3><ul>{lis}</ul></section>')
    redirect = ('(function(){var h=location.hash.slice(1);if(!h)return;var p=h.split("/"),ids=%s;if(ids.indexOf(p[0])<0)return;'
                'var s=new URLSearchParams(location.search);if(s.get("embed")!=="1"&&!s.has("c"))s.set("c",%s);'
                'var q=s.toString();location.replace("lessons/"+p[0]+".html"+(q?"?"+q:"")+(p[1]?"#"+p[1]:""));})();') % (json.dumps(all_ids), json.dumps(cid))
    sh = ROOT / "shared"
    return f"""<!DOCTYPE html>
<html lang="en" data-theme="light" class="is-home has-course">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(h['title'])} · {esc(c['code'])}</title>
<meta name="description" content="{esc(h['intro'])}">
<script>{redirect}</script>
<script>{HEAD_JS}</script>
<style>
{css_all()}</style>
</head>
<body data-course="{esc(cid)}" data-home="{esc(h['file'])}">
{sprite()}
<div class="rig">
<aside class="rail" id="rail"></aside>
<main class="stage">
<section class="home" id="home" aria-label="Lessons">
<h2>{esc(h['title'])}</h2>
<p class="lede">{esc(h['intro'])}</p>
<p class="home-start"><a class="startbtn" data-lesson="{first}" href="lessons/{first}.html{q}">Start: {esc(L[first]['label'])}</a></p>
<div class="home-groups">{''.join(groups)}</div>
</section>
</main>
</div>
<script src="courses/{esc(cid)}.js"></script>
<script>
{rd(ROOT / 'lib' / 'core.js')}
{rd(sh / 'course.js')}
window.CourseUI.initHome();
</script>
</body>
</html>
"""

def library_page(lib, L, C):
    areas = []
    for a in lib["areas"]:
        cards = []
        for i in a["lessons"]:
            m = L[i]
            outs = "".join(f"<li>{esc(o)}</li>" for o in m["outcomes"])
            tags = ", ".join(esc(t) for t in m["tags"])
            cards.append(f'<article class="libcard" id="{i}"><h3><a href="lessons/{i}.html">{esc(m["title"])}</a></h3><p>{esc(m["desc"])}</p>'
                         f'<ul>{outs}</ul><p class="tags">Topics: {tags}</p></article>')
        areas.append(f'<section class="libarea" id="area-{a["id"]}"><h2>{esc(a["label"])}</h2><p>{esc(a["about"])}</p>{"".join(cards)}</section>')
    courses = "".join(f'<li><a href="{esc(h["file"])}">{esc(h["title"])}</a> ({esc(c["code"])})</li>' for c in C.values() for h in c.get("homes", []))
    return f"""<!DOCTYPE html>
<html lang="en" data-theme="light" class="libpage">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(lib['title'])}</title>
<script>{HEAD_JS}</script>
<style>
{css_basic()}</style>
</head>
<body style="height:auto;overflow:auto">
<div class="libwrap">
<h1>{esc(lib['title'])}</h1>
<p class="lede">{esc(lib['intro'])}</p>
<p>Courses that use these lessons: </p><ul>{courses}</ul>
{''.join(areas)}
<section class="libhow">
<h2>Assemble a course</h2>
<p>A course is one small file in <code>courses/</code>. It gives the course a title, an intro and groups of lesson ids, and it can set words such as the name of the final project. Run <code>python3 build.py</code> and the course gets a home page, a lesson list on every lesson page and a Next lesson button.</p>
<p>A lesson needs no course. Every lesson page opens by itself, and every lesson can go into Canvas from <a href="embed.html">the embed page</a>. A link to a lesson inside a course ends in <code>?c=</code> and the course id. A link without it shows the lesson alone.</p>
<p>To write a new lesson, run <code>python3 tools/new_lesson.py</code> and read <code>docs/AUTHORING.md</code>.</p>
</section>
</div>
</body>
</html>
"""

def heights():
    out = {}
    f = ROOT / "docs" / "audit-structure.md"
    if f.exists():
        for m in re.finditer(r"^\| (M[12]) \| (\w+) \| (\d+) \| (\d+) \| (\d+) \|", rd(f), re.M):
            out[m.group(2)] = int(m.group(5))
    return out

def embed_page(lib, L, C):
    hts = heights(); rows = []
    for a in lib["areas"]:
        rows.append(f"<h2>{esc(a['label'])}</h2>")
        rows.append("<table><thead><tr><th>Lesson or step</th><th>Embed URL</th><th>Snippet</th></tr></thead><tbody>")
        def row(title, path, h, kind):
            snip = f'<iframe src="@@BASE@@{path}" width="100%" height="{h}" style="border:0" loading="lazy" title="{esc(title)}"></iframe>'
            rows.append(f'<tr class="{kind}"><td>{esc(title)}</td><td><a class="lnk" data-path="{esc(path)}" href="#" target="_blank" rel="noopener">{esc(path)}</a></td>'
                        f'<td><textarea readonly rows="3" class="snip" data-tpl="{esc(snip)}" aria-label="Snippet for {esc(title)}"></textarea> <button type="button" class="cp">Copy</button></td></tr>')
        for i in a["lessons"]:
            m = L[i]
            secs = [attrs(t) for t in re.findall(r'<div[^>]*class="sec"[^>]*>', m["_html"])]
            base = f"lessons/{i}.html?embed=1"
            if len(secs) >= 2:
                row(m["title"] + " (whole lesson, with step strip)", base, 900, "panel")
                for s in secs:
                    row(f"{m['title']}: {fill(s.get('data-title', s.get('data-sec', '')))}", f"{base}#{s.get('data-sec', '')}", 900, "sec")
                if m["_cyu"]: row(f"{m['title']}: Check your understanding", f"{base}#check", 900, "sec")
            else:
                px = hts.get(i); ht = int(math.ceil((px + 80) / 50.0) * 50) if px else 900
                row(m["title"], base, ht, "panel")
        rows.append("</tbody></table>")
    opts = '<option value="">No course (the lesson alone)</option>' + "".join(f'<option value="{esc(cid)}">{esc(c["code"])}</option>' for cid, c in C.items())
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Embed index</title>
<style>
body{{font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:#1a1d23;margin:0;padding:24px;max-width:1200px}}
h1{{font-size:1.5em;margin:0 0 8px}} h2{{font-size:1.2em;margin:32px 0 8px}}
table{{border-collapse:collapse;width:100%}} th,td{{text-align:left;vertical-align:top;padding:8px 10px;border-top:1px solid #d8dce3;font-size:15px}}
th{{border-top:0;border-bottom:1px solid #c4cad4}} tr.sec td:first-child{{padding-left:28px}} tr.panel td:first-child{{font-weight:600}}
td:nth-child(2){{width:28%;word-break:break-all}} td:nth-child(3){{width:44%}}
textarea{{width:100%;font:13px/1.4 ui-monospace,Menlo,Consolas,monospace;padding:6px;border:1px solid #c4cad4;border-radius:4px;resize:vertical}}
button{{font:inherit;font-size:15px;min-height:36px;padding:4px 14px;margin-top:4px;border:1px solid #1f5fbf;background:#fff;color:#1f5fbf;border-radius:6px;cursor:pointer}}
input,select{{font:inherit;width:100%;max-width:520px;padding:6px 8px;border:1px solid #c4cad4;border-radius:4px}}
a{{color:#1f5fbf}} small{{color:#5b6270}} code{{font:14px ui-monospace,Menlo,Consolas,monospace}}
</style></head><body>
<h1>Embed index</h1>
<p><label for="base"><b>Base URL of the published site</b></label><br><input id="base" type="url" value="{SITE}" spellcheck="false"></p>
<p><label for="course"><b>Course</b></label><br><select id="course">{opts}</select><br><small>With a course chosen, the page that opens from "Open full lesson" shows that course's lesson list. The embedded view itself looks the same.</small></p>
<p>The snippets and links below use these settings and change as you edit them. The links work after the site is published.</p>
<p>For the instructor. Paste a snippet into the HTML view of a Canvas page. Add a plain link to the full lesson under each frame in case the frame is blocked.</p>
<p>Options on any URL: <code>&amp;cyu=0</code> hides the questions, <code>&amp;video=0</code> hides the video, <code>&amp;theme=dark</code> uses the dark theme. <code>&amp;instructor=1</code> shows instructor notes. The lesson library is at <a href="library.html">library.html</a>.</p>
<p>Heights for lessons without steps come from the layout audit at 700 px wide. Check them against the live lesson.</p>
{''.join(rows)}
<script>
const baseEl=document.getElementById("base"), courseEl=document.getElementById("course");
function url(b,p){{const c=courseEl.value;if(!c)return b+p;const [pa,hash]=p.split("#");return b+pa+"&c="+c+(hash!==undefined?"#"+hash:"");}}
function fill(){{let b=baseEl.value.trim();if(b&&!b.endsWith("/"))b+="/";
 document.querySelectorAll(".snip").forEach(t=>{{const d=document.createElement("div");d.innerHTML=t.dataset.tpl;
   const f=d.firstChild;const p=f.getAttribute("src").replace("@@BASE@@","");f.setAttribute("src",url(b,p));t.value=f.outerHTML;}});
 document.querySelectorAll(".lnk").forEach(a=>{{a.href=url(b,a.dataset.path);a.textContent=a.href.replace(b,"");}});}}
baseEl.addEventListener("input",fill);courseEl.addEventListener("change",fill);fill();
document.querySelectorAll(".cp").forEach(b=>b.onclick=()=>{{const t=b.previousElementSibling;t.select();
 (navigator.clipboard?navigator.clipboard.writeText(t.value):Promise.reject()).catch(()=>document.execCommand("copy")).finally(()=>{{b.textContent="Copied";setTimeout(()=>b.textContent="Copy",1500)}})}});
</script>
</body></html>
"""

# ------------------------------------------------------------------ main
def main():
    L = load(); C = load_courses()
    try: lib = json.loads(rd(ROOT / "courses" / "library.json"))
    except (OSError, ValueError) as e: print(f"courses/library.json: {e}"); sys.exit(1)
    validate(L, C, lib)
    if ERR:
        print("Build stopped. Fix these first:")
        for e in ERR: print("  " + e)
        sys.exit(1)
    OUT.mkdir(parents=True, exist_ok=True)
    for d, pat in (("lessons", "*.html"), ("courses", "*.js")):
        if (OUT / d).is_dir():
            for f in (OUT / d).glob(pat): f.unlink()
    ga = json.loads(rd(ROOT / "shared" / "analytics.json")) if (ROOT / "shared" / "analytics.json").exists() else {}
    ctx = {"css": css_all(), "sprite": sprite(), "ga": ga, "art": copy_art()}
    sizes = {}
    for i, m in L.items():
        page = lesson_page(m, lib, L, ctx); wr(OUT / "lessons" / f"{i}.html", page); sizes[i] = len(page.encode("utf-8"))
    for cid, c in C.items():
        wr(OUT / "courses" / f"{cid}.js", course_script(cid, c, L))
        ids = [i for h in c.get("homes", []) for g in h["groups"] for i in g["lessons"]]
        for h in c.get("homes", []):
            wr(OUT / h["file"], home_page(cid, c, h, L, ids))
    wr(OUT / "library.html", library_page(lib, L, C))
    wr(OUT / "embed.html", embed_page(lib, L, C))
    big = max(sizes.values())
    print(f"built {len(L)} lesson pages in {OUT / 'lessons'}  (smallest {min(sizes.values()) / 1024:.0f} KB, largest {big / 1024:.0f} KB: {max(sizes, key=sizes.get)})")
    over = [i for i, s in sizes.items() if s > LIMIT]
    if over: print("over 300 KB: " + ", ".join(over)); sys.exit(1)
    print(f"courses: {', '.join(C)}; homes: {', '.join(h['file'] for c in C.values() for h in c.get('homes', []))}; library.html, embed.html")

main()
