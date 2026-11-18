#!/usr/bin/env python3
"""Open every built lesson page, click through it and report problems. Needs Playwright and Chrome.

    python3 tools/check.py DIR                 DIR is the folder that build.py wrote (the repo root by default)
    python3 tools/check.py DIR --embed         also open every step in the Canvas view (?embed=1#step) at 700 px
    python3 tools/check.py DIR attn rest       only these lessons
    python3 tools/check.py DIR --no-http       skip the pass over http://localhost

For each lesson it does this:
  1. The lesson alone (file://): every step, every control clicked, More details opened.
  2. The lesson with ?c=<course>: the rail, the current item, the home link and the Next lesson link.
  3. With --embed: every step in the Canvas view.
  4. Over http (one load per lesson, with and without ?c=).
It reports console errors, page errors, raw tag text, zero-size or blank canvases, files that do not load,
links to lessons that do not exist, and sideways scrolling in the Canvas view.
It also loads the course home pages, library.html and embed.html and tests the old index.html#lesson/step links."""
import sys, pathlib, json, re, threading, functools, http.server, socketserver, urllib.parse
from playwright.sync_api import sync_playwright

args = [a for a in sys.argv[1:] if not a.startswith("--")]
EMBED = "--embed" in sys.argv
HTTP = "--no-http" not in sys.argv
D = pathlib.Path(args[0] if args else ".").resolve()
only = set(args[1:])
CHROME = "/usr/bin/google-chrome"
PROBLEMS = []

def bad(where, kind, msg):
    PROBLEMS.append((where, kind, str(msg)[:220]))

IDS = sorted(f.stem for f in (D / "lessons").glob("*.html"))
COURSES = sorted(f.stem for f in (D / "courses").glob("*.js"))
def course_of(i):
    """first course whose data lists the lesson"""
    for c in COURSES:
        if re.search(r'"%s":\{"label"' % re.escape(i), (D / "courses" / f"{c}.js").read_text(encoding="utf-8")): return c
    return None

CLICK_ALL = """async()=>{
  const P=document.querySelector('.panel'); let n=0;
  P.querySelectorAll('details').forEach(d=>{ d.open=true; });
  await new Promise(r=>setTimeout(r,30));
  for(const e of P.querySelectorAll('.sec.on button, .sec.on input, .sec.on select, .sec.on summary')){
    if(e.closest('a[href]')||e.offsetParent===null||e.disabled||e.classList.contains('vid-go')) continue;
    try{
      if(e.tagName==='BUTTON'||e.tagName==='SUMMARY') e.click();
      else if(e.type==='range'){ e.value=e.max; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); }
      else if(e.type==='checkbox'||e.type==='radio'){ e.click(); }
      else if(e.tagName==='SELECT'){ if(e.options.length>1){ e.selectedIndex=e.options.length-1; e.dispatchEvent(new Event('change',{bubbles:true})); } }
      n++; await new Promise(r=>setTimeout(r,15));
    }catch(x){ }
  }
  return n;}"""

PAGE_FACTS = """()=>{
  const out={raw:[],canvas:[],links:[],over:document.documentElement.scrollWidth>window.innerWidth+2};
  const on=document.querySelector('.panel .sec.on')||document.querySelector('.panel');
  const m=(on.innerText.match(/<\\/?(code|b|i|em|strong|span|a|dfn)\\b[^>]*>|&[a-z]+;|\\{\\{\\s*project\\s*\\}\\}|data-lesson=/g)||[]); out.raw=m.slice(0,4);
  document.querySelectorAll('canvas').forEach(c=>{
    if(c.offsetParent===null) return;
    const r=c.getBoundingClientRect();
    if(r.width<2||r.height<2||!c.width||!c.height){ out.canvas.push('zero size '+(c.id||c.className)); return; }
    try{ const x=c.getContext('2d'); if(!x) return;
      const d=x.getImageData(0,0,c.width,c.height).data; let any=false;
      for(let i=3;i<d.length;i+=4*37){ if(d[i]){ any=true; break; } }
      if(!any) out.canvas.push('blank '+(c.id||c.className));
    }catch(e){}
  });
  document.querySelectorAll('a[data-lesson]').forEach(a=>out.links.push(a.getAttribute('href')));
  return out;}"""

def local(url):
    return url.startswith("file://") or url.startswith("http://127.0.0.1")

def watch(pg, where_ref, errs):
    pg.on("pageerror", lambda e: errs.append((where_ref[0], "pageerror", str(e))))
    pg.on("console", lambda m: errs.append((where_ref[0], "console", m.text)) if m.type == "error" and "Failed to load resource" not in m.text else None)
    pg.on("requestfailed", lambda r: errs.append((where_ref[0], "file", f"{r.url} {r.failure}")) if local(r.url) else None)
    pg.on("response", lambda r: errs.append((where_ref[0], "404", f"{r.status} {r.url}")) if local(r.url) and r.status >= 400 else None)
    pg.on("dialog", lambda d: d.dismiss())

def resolves(base_url, href):
    """does a link on the page point at a file in D?"""
    u = urllib.parse.urlparse(urllib.parse.urljoin(base_url, href))
    p = urllib.parse.unquote(u.path)
    if u.scheme == "file": f = pathlib.Path(p)
    else: f = D / p.lstrip("/")
    return f.exists()

def ready(pg):
    try: pg.wait_for_function("window.__lessonReady===true", timeout=6000)
    except Exception: return False
    pg.wait_for_timeout(120)
    return True

def steps_of(pg):
    return pg.evaluate("[...document.querySelectorAll('.panel > .sec')].map(s=>s.dataset.sec)")

def facts(pg, where, base_url, embed=False):
    f = pg.evaluate(PAGE_FACTS)
    if f["raw"] and where.split()[0] not in ("clients", "render", "bytes"): bad(where, "rawtext", f["raw"])   # these three show markup on purpose
    for c in f["canvas"]: bad(where, "canvas", c)
    for h in f["links"]:
        if not resolves(base_url, h): bad(where, "link", f"lesson link {h} does not resolve")
    if embed and f["over"]: bad(where, "overflow", "page scrolls sideways at 700 px")

def run():
    n_steps = n_embed = 0
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        for i in IDS:
            if only and i not in only: continue
            errs = []; cur = [i]
            # 1. alone
            pg = b.new_page(viewport={"width": 1280, "height": 900}); watch(pg, cur, errs)
            url = f"file://{D}/lessons/{i}.html"
            cur[0] = i + " alone"; pg.goto(url)
            if not ready(pg): bad(cur[0], "load", "the lesson did not finish starting")
            else:
                if pg.evaluate("!!document.querySelector('#rail')"): bad(cur[0], "layout", "rail present with no course")
                if not pg.evaluate("document.querySelector('#lbar') && getComputedStyle(document.querySelector('#lbar')).display!=='none'"): bad(cur[0], "layout", "no header with no course")
                lib = pg.evaluate("document.querySelector('.lbar-lib')&&document.querySelector('.lbar-lib').getAttribute('href')")
                if not lib or not resolves(url, lib): bad(cur[0], "link", f"library link {lib}")
                steps = steps_of(pg)
                for k, s in enumerate(steps):
                    cur[0] = f"{i} alone, step {s}"; n_steps += 1
                    pg.evaluate("s=>window.showStep(s)", s); pg.wait_for_timeout(120)
                    if pg.evaluate("document.querySelector('.panel .sec.on')&&document.querySelector('.panel .sec.on').dataset.sec") != s:
                        bad(cur[0], "step", "step did not open"); continue
                    pg.evaluate(CLICK_ALL); pg.wait_for_timeout(200)
                    facts(pg, cur[0], url)
                # the generated last step, then the Next lesson link
                nxt = pg.evaluate("(()=>{const a=document.querySelector('.secnext[href]');return a&&a.getAttribute('href')})()")
                cur[0] = i + " alone, last step"
                pg.evaluate("s=>window.showStep(s)", steps[-1]); pg.wait_for_timeout(100)
                nxt = pg.evaluate("(()=>{const a=document.querySelector('.sec.on a.secnext[href]');return a&&a.getAttribute('href')})()")
                if nxt and not resolves(url, nxt): bad(cur[0], "link", f"Next lesson {nxt}")
            for e in errs: bad(*e)
            pg.close(); errs.clear()
            # 2. with a course
            c = course_of(i)
            if c:
                pg = b.new_page(viewport={"width": 1280, "height": 900}); watch(pg, cur, errs)
                cur[0] = f"{i} ?c={c}"; url = f"file://{D}/lessons/{i}.html?c={c}"; pg.goto(url)
                if not ready(pg): bad(cur[0], "load", "did not start")
                else:
                    r = pg.evaluate("""()=>({cur:(document.querySelector('.navitem[aria-current=page]')||{dataset:{}}).dataset.p,
                      items:document.querySelectorAll('.navitem').length, rail:getComputedStyle(document.querySelector('#rail')).display,
                      home:(document.querySelector('.homelink')||{getAttribute(){}}).getAttribute('href'),
                      links:[...document.querySelectorAll('.navitem')].map(a=>a.getAttribute('href')),
                      next:(()=>{const a=document.querySelector('.sec.on a.secnext[href]');return a&&a.getAttribute('href')})(),
                      seen:document.querySelectorAll('.navitem.seen').length})""")
                    if r["cur"] != i: bad(cur[0], "rail", f"current item is {r['cur']}")
                    if r["rail"] == "none": bad(cur[0], "rail", "rail hidden")
                    if not r["home"] or not resolves(url, r["home"]): bad(cur[0], "link", f"home link {r['home']}")
                    for h in r["links"]:
                        if not resolves(url, h): bad(cur[0], "link", f"rail link {h}")
                        elif "c=" + c not in h: bad(cur[0], "link", f"rail link lost the course: {h}")
                    if r["seen"] < 1: bad(cur[0], "rail", "no visited tick on the open lesson")
                    pg.evaluate("s=>window.showStep(s)", steps_of(pg)[-1]); pg.wait_for_timeout(100)
                    nx = pg.evaluate("(()=>{const a=document.querySelector('.sec.on a.secnext[href]');return a&&a.getAttribute('href')})()")
                    if nx and (not resolves(url, nx) or "c=" + c not in nx): bad(cur[0], "link", f"Next lesson {nx}")
                for e in errs: bad(*e)
                pg.close(); errs.clear()
            # 3. Canvas view
            if EMBED:
                pg = b.new_page(viewport={"width": 700, "height": 900}); watch(pg, cur, errs)
                pg.goto(f"file://{D}/lessons/{i}.html?embed=1"); ready(pg)
                steps = steps_of(pg)
                targets = [""] + ([s for s in steps] if len(steps) >= 2 else [])
                for t in targets:
                    cur[0] = f"{i} embed #{t}"; n_embed += 1
                    u = f"file://{D}/lessons/{i}.html?embed=1" + (f"#{t}" if t else "")
                    pg.goto(u); pg.reload(); ready(pg); pg.wait_for_timeout(200)
                    r = pg.evaluate("""t=>{const out=[];
                      const on=document.querySelector('.panel.on'); if(!on) out.push('lesson not shown');
                      if(document.querySelector('#rail')) out.push('rail present');
                      if(t){ const s=on&&on.querySelector(':scope > .sec.on'); if(!s||s.dataset.sec!==t) out.push('wrong step open');
                        const st=on.querySelector('.sectabs'); if(st&&getComputedStyle(st).display!=='none') out.push('step strip visible in a single-step view'); }
                      return out;}""", t)
                    for m in r: bad(cur[0], "embed", m)
                    facts(pg, cur[0], u, embed=True)
                for e in errs: bad(*e)
                pg.close(); errs.clear()
        # pages that are not lessons
        pg = b.new_page(viewport={"width": 1280, "height": 900}); errs = []; cur = [""]; watch(pg, cur, errs)
        for f in sorted(x.name for x in D.glob("*.html")):
            cur[0] = f; u = f"file://{D}/{f}"; pg.goto(u); pg.wait_for_timeout(500)
            for h in pg.evaluate("[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(h=>h&&!/^(https?:|#|mailto:)/.test(h))"):
                if not resolves(u, h.split("#")[0] or f): bad(f, "link", h)
            if pg.evaluate("document.documentElement.scrollWidth>window.innerWidth+2"): bad(f, "overflow", "scrolls sideways")
        for e in errs: bad(*e)
        # old links
        homes = {}
        for c in COURSES:
            for m in re.finditer(r'"file":"([^"]+\.html)"', (D / "courses" / f"{c}.js").read_text(encoding="utf-8")): homes[m.group(1)] = c
        for f, c in homes.items():
            ids = [m for m in IDS if course_of(m) == c]
            first = ids[0]
            cases = [(f"{f}#{first}", f"lessons/{first}.html?c={c}"),
                     (f"{f}#{first}/check", f"lessons/{first}.html?c={c}#check"),
                     (f"{f}?embed=1#{first}/check", f"lessons/{first}.html?embed=1#check"),
                     (f"{f}?instructor=1&cyu=0&video=0&notrack=1&gadebug=1#{first}", f"lessons/{first}.html?instructor=1&cyu=0&video=0&notrack=1&gadebug=1&c={c}")]
            for old, want in cases:
                cur[0] = "redirect " + old; errs.clear()
                pg.goto(f"file://{D}/{old}"); ready(pg)
                got = pg.url.replace(f"file://{D}/", "")
                if got != want: bad(cur[0], "redirect", f"went to {got}, expected {want}")
        for e in errs: bad(*e)
        pg.close()
        # over http
        if HTTP:
            class Q(http.server.SimpleHTTPRequestHandler):
                def log_message(self, *a): pass
            h = functools.partial(Q, directory=str(D))
            srv = socketserver.TCPServer(("127.0.0.1", 0), h); port = srv.server_address[1]
            threading.Thread(target=srv.serve_forever, daemon=True).start()
            pg = b.new_page(viewport={"width": 1280, "height": 900}); errs = []; cur = [""]; watch(pg, cur, errs)
            for i in IDS:
                if only and i not in only: continue
                for q in ("", f"?c={course_of(i)}" if course_of(i) else ""):
                    cur[0] = f"http {i}{q}"; pg.goto(f"http://127.0.0.1:{port}/lessons/{i}.html{q}")
                    if not ready(pg): bad(cur[0], "load", "did not start")
            for e in errs: bad(*e)
            pg.close(); srv.shutdown()
        b.close()
    return n_steps, n_embed

n_steps, n_embed = run()
seen = set()
for w, k, m in PROBLEMS:
    if (w, k, m) in seen: continue
    seen.add((w, k, m)); print(f"  {w}: {k}: {m}")
print(f"{len(IDS) if not only else len(only)} lessons, {n_steps} steps clicked alone, {n_embed} embed views, {len(seen)} problems")
sys.exit(1 if seen else 0)
