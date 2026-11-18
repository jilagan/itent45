#!/usr/bin/env python3
"""One-time, repeatable migration: src/index and src/machine (two page bundles) -> the lesson library.

    python3 tools/migrate_to_library.py            # reads src/, writes lessons/, lib/, courses/*.json, shared/lessons.css
    python3 tools/migrate_to_library.py --check    # only parse and report, write nothing

It needs the old layout (src/index, src/machine and src/shared) and docs/audit-structure.md.
src/ was removed after the new build passed. Check out the commit before that to run this again.

What it does, per lesson id (ids do not change):
  lessons/<id>/lesson.html   the panel markup, with the course wording of item 4 of the brief edited out
  lessons/<id>/lesson.js     the widget code from the old js file, plus code that sat in another lesson's file,
                             minus the globals that now live in lib/
  lessons/<id>/cyu.json      the questions
  lessons/<id>/meta.json     id, title, label, desc, outcomes, tags, area, needs, video
  lib/*.js                   core (what each 00-shell.js defined) and code shared by two lessons
  courses/itent45.json       the two old sites as one course with two homes
  courses/library.json       every lesson grouped by area
  shared/lessons.css         the two style.css files merged
The copy edits are listed in COPY_EDITS below. Each one must match exactly once, so a changed source stops the run."""
import json, re, sys, html, pathlib, shutil, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
CHECK = "--check" in sys.argv

def rd(p): return pathlib.Path(p).read_text(encoding="utf-8")
def wr(p, s):
    p = pathlib.Path(p); p.parent.mkdir(parents=True, exist_ok=True)
    if not CHECK: p.write_text(s, encoding="utf-8")
def strip_tags(h): return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", h))).strip()

# ---------------------------------------------------------------- 1. the two sites: order, labels, groups
PAGES = ("index", "machine")
nav = {}        # page -> [ (group label, [ids]) ]
info = {}       # id -> dict(page, label, desc)
for page in PAGES:
    shell = rd(SRC / page / "shell.html")
    groups = []
    for m in re.finditer(r'<div class="navgrp">(.*?)</div>|<button[^>]*data-p="(\w+)"[^>]*?data-desc="([^"]*)"[^>]*>.*?<span class="lbl">(.*?)</span>', shell, re.S):
        if m.group(1) is not None:
            groups.append([strip_tags(m.group(1)), []])
        else:
            pid = m.group(2)
            groups[-1][1].append(pid)
            info[pid] = {"page": page, "desc": html.unescape(m.group(3)).strip(), "label": strip_tags(m.group(4))}
    nav[page] = groups
ids_all = [i for p in PAGES for g in nav[p] for i in g[1]]
assert len(ids_all) == len(set(ids_all)), "an id is used on both pages"

panels = {}
for page in PAGES:
    d = SRC / page
    for f in json.loads(rd(d / "order.json")):
        h = rd(d / "panels" / f)
        pid = re.search(r'<section[^>]*id="p-(\w+)"', h).group(1)
        panels[pid] = h.rstrip() + "\n"
assert set(panels) == set(ids_all), (set(panels) ^ set(ids_all))

JSFILE = {  # id -> (page, file)
    "layers": ("index", "01-layers.js"), "journey": ("index", "02-journey.js"), "bytes": ("index", "03-bytes.js"),
    "basics": ("index", "04-basics.js"), "tiers": ("index", "05-tiers.js"), "rest": ("index", "06-rest.js"),
    "clients": ("index", "07-clients.js"), "render": ("index", "08-render.js"), "pay": ("index", "09-pay.js"),
    "mem": ("index", "10-mem.js"), "server": ("index", "11-server.js"), "scale": ("index", "12-scale.js"),
    "enlist": ("index", "13-enlist.js"), "split": ("index", "14-split.js"), "vm": ("index", "15-vm.js"),
    "cost": ("index", "16-cost.js"), "region": ("index", "17-region.js"), "txn": ("index", "18-txn.js"),
    "sql": ("index", "19-sql.js"), "rea": ("index", "20-rea.js"), "card": ("index", "21-card.js"),
    "entity": ("index", "22-entity.js"), "norm": ("index", "23-norm.js"), "query": ("index", "24-query.js"),
    "shape": ("index", "25-shape.js"), "break": ("index", "26-break.js"),
    "intro": ("machine", "01-intro.js"), "next": ("machine", "02-next.js"), "learn": ("machine", "03-learn.js"),
    "train": ("machine", "04-train.js"), "deep": ("machine", "05-deep.js"), "backprop": ("machine", "06-backprop.js"),
    "tokens": ("machine", "07-tokens.js"), "embed": ("machine", "08-embed.js"), "vectors": ("machine", "09-vectors.js"),
    "rnn": ("machine", "10-rnn.js"), "attn": ("machine", "11-attn.js"), "ctx": ("machine", "12-ctx.js"),
    "prompt": ("machine", "13-prompt.js"), "loop": ("machine", "14-loop.js"), "tools": ("machine", "15-tools.js"),
    "math": ("machine", "16-math.js"), "vibe": ("machine", "17-vibe.js"),
}
assert set(JSFILE) == set(ids_all)
js = {k: rd(SRC / v[0] / "js" / v[1]) for k, v in JSFILE.items()}

# ---------------------------------------------------------------- 2. areas
AREAS = [
    ("web", "Web applications", "How a request travels from a browser to a server and back, and what the messages contain.",
     ["basics", "tiers", "layers", "journey", "bytes", "rest", "clients", "render", "pay"]),
    ("data", "Data and databases", "How to describe data as tables, change it safely and choose a database.",
     ["entity", "card", "rea", "sql", "txn", "norm", "query", "shape"]),
    ("capacity-cloud", "Capacity and cloud", "How much a server can handle, how to add machines and what the cloud costs.",
     ["mem", "server", "scale", "enlist", "vm", "cost", "region"]),
    ("architecture", "Architecture", "How to divide an application into parts and what each division costs.",
     ["split"]),
    ("ai", "Language models and AI", "How a language model learns, reads and writes, and how to use one with care.",
     [i for g in nav["machine"] for i in g[1]]),
    ("practice", "Practice", "Group work that uses what the other lessons teach.",
     ["break"]),
]
area_of = {i: a[0] for a in AREAS for i in a[3]}
assert set(area_of) == set(ids_all)

# ---------------------------------------------------------------- 3. outcomes from docs/audit-structure.md D2
audit = rd(ROOT / "docs" / "audit-structure.md")
d2 = audit[audit.index("### D2."):audit.index("### D3.")]
outcomes = {}
for m in re.finditer(r"^- \d\d (\w+)\. \(1\) (.*?)\. \(2\) (.*?)\. \(3\) (.*?)\.\s+(?:Tests:|This panel)", d2, re.M):
    outcomes[m.group(1)] = [m.group(2).strip(), m.group(3).strip(), m.group(4).strip()]
OUTCOME_FIX = {  # the audit wording, adjusted to read as plain statements and to name no course
    "txn": ["Explain how two sessions both book the last seat", "Say which fix works (a lock or one statement) and why checking first fails", "Say what atomicity, consistency, isolation and durability each guarantee"],
    "rest": None, "render": ["Compare server-rendered pages with single-page apps", "Compare the size of JSON, XML and HTML for the same data", "Choose one for a project and give a reason"],
    "shape": ["Say that relational against document depends on which questions you ask", "Say where the schema is enforced in each", "Choose one for a project and justify the choice"],
    "mem": ["Work out how many workers fit in RAM after the operating system, web server and database", "Explain process-per-worker and threads", "Predict what moving the database to its own machine changes"],
    "region": None, "break": ["Read the wire on a real request", "Size and defend an architecture with numbers", "Report back with evidence"],
    "next": None,
}
for k, v in OUTCOME_FIX.items():
    if v: outcomes[k] = v
for k in outcomes:
    outcomes[k] = [re.sub(r"\bcapstone\b", "project", o).replace("Choose for a project", "Choose a setup for a project") for o in outcomes[k]]
OUTCOME_TWEAK = {  # audit wording to US spelling, plain statements, no contrast framing
    "attn": {0: "Describe how each word looks at all the other words", 1: "Say that cost grows with the square of the prompt length", 2: "Say why attention fixed the single-note problem"},
    "embed": {1: "Predict neighbors (king and queen, king and hospital)", 2: "Say that no one labels the words"},
    "enlist": {0: "Separate read-heavy browsing from reserving, where every write must be correct"},
    "entity": {2: "Recognize a pairing as an entity (Enrollment)"},
    "next": {1: "Explain that temperature changes how spread out the choices are"},
    "rea": {1: "Explain why payment and enrollment are many-to-many"},
    "region": {0: "Compute the minimum latency that physics allows for a distance", 1: "Match each failure type (machine, data center, region) to the setup that survives it"},
    "deep": {0: "Say why one line cannot separate a case that rises and then falls", 2: "State the trade: no hand-picked features, and no explanation of results"},
    "tools": {0: "Say that the model only emits a request and another program runs it", 2: "Say what MCP standardizes (N x M adapters become N + M)"},
    "intro": {0: "Order AI, ML, deep learning and generative AI"},
    "train": {2: "Say that nobody writes the rule"},
    "tokens": {0: "Say that the model reads token IDs", 1: "Explain why a model miscounts the letters in a word"},
    "shape": {0: "Say that choosing relational or document depends on which questions you ask"},
    "layers": {0: "Explain encapsulation: each layer wraps the message and talks only to its twin"},
    "ctx": {0: "Say that the model has no memory outside the window"},
    "learn": {2: "Spot leakage (splitting the data after fitting)"},
    "vectors": {1: "Read an analogy result and say where it stops working"},
}
for k, d in OUTCOME_TWEAK.items():
    for n, v in d.items(): outcomes[k][n] = v
missing = [i for i in ids_all if i not in outcomes]
assert not missing, "no outcomes in D2 for " + ",".join(missing)

TAGS = {
    "basics": ["server", "client", "URL", "port", "localhost"], "tiers": ["three tiers", "browser", "application server", "database"],
    "layers": ["protocol layers", "packets", "TCP", "headers"], "journey": ["latency", "round trip", "DNS", "TLS"],
    "bytes": ["HTTP", "request", "response", "headers", "curl"], "rest": ["REST", "HTTP verbs", "status codes", "idempotent", "API"],
    "clients": ["API", "JSON", "mobile", "versioning"], "render": ["server rendering", "single-page app", "JSON", "XML"],
    "pay": ["payments", "gateway", "idempotency key", "tokens"],
    "entity": ["entity", "attribute", "instance", "tables"], "card": ["relationships", "cardinality", "foreign key", "many-to-many"],
    "rea": ["REA", "resources", "events", "agents", "schema"], "sql": ["SQL", "SELECT", "UPDATE", "WHERE"],
    "txn": ["transactions", "ACID", "locks", "concurrency"], "norm": ["normalization", "redundancy", "tables"],
    "query": ["N+1", "queries", "join", "ORM"], "shape": ["relational", "document database", "schema"],
    "mem": ["memory", "RAM", "workers", "capacity"], "server": ["capacity", "queue", "throughput", "utilization"],
    "scale": ["scaling", "load balancer", "availability", "bottleneck"], "enlist": ["case study", "peak load", "caching", "database"],
    "vm": ["virtual machines", "cloud", "IaaS", "PaaS", "SaaS"], "cost": ["CapEx", "OpEx", "TCO", "capacity planning"],
    "region": ["regions", "availability zones", "failover", "latency"],
    "split": ["monolith", "microservices", "services", "network calls"],
    "break": ["exercises", "group work", "HTTP", "capacity"],
    "intro": ["AI", "machine learning", "deep learning", "generative AI"], "next": ["language model", "next word", "probability", "temperature"],
    "learn": ["training data", "test data", "overfitting", "classifier"], "train": ["training", "loss", "gradient descent", "learning rate"],
    "deep": ["neural network", "hidden units", "nonlinearity"], "backprop": ["backpropagation", "weights", "gradient"],
    "tokens": ["tokens", "tokenizer", "cost", "language"], "embed": ["embeddings", "word positions", "co-occurrence"],
    "vectors": ["vectors", "similarity", "semantic search"], "rnn": ["recurrent network", "hidden state", "long inputs"],
    "attn": ["attention", "transformer", "context"], "ctx": ["context window", "tokens", "memory"],
    "prompt": ["prompts", "constraints", "prompt engineering"], "loop": ["agents", "tools", "observations", "loop"],
    "tools": ["tool calls", "MCP", "permissions"], "vibe": ["vibe coding", "code review", "AI-written code"],
    "math": ["dot product", "slope", "probability", "loss"],
}
assert set(TAGS) == set(ids_all)

NEEDS = {"mem": ["memmodel"], "server": ["memmodel"], "embed": ["placelabels"], "vectors": ["placelabels"],
         "learn": ["students"], "train": ["students"]}

# ---------------------------------------------------------------- 4. js: splitting, moving, hooks
def split_at(text, marker):
    i = text.index(marker)
    assert text.count(marker) == 1, marker
    return text[:i], text[i:]
def line_range(text, a, b):
    L = text.splitlines(keepends=True)
    return "".join(L[a - 1:b]), "".join(L[:a - 1] + L[b:])
def sub1(text, old, new, n=1, what=""):
    c = text.count(old)
    assert c == n, f"{what or old[:50]!r}: expected {n} match(es), found {c}"
    return text.replace(old, new)

lib = {}
jsout = {k: v for k, v in js.items()}

# journey / layers: the packet widget sits in the journey file but its markup is in the layers lesson
j1, j2 = split_at(js["journey"], "/* ---- a round trip where the cutting happens on the wire")
jsout["journey"] = j1
jsout["layers"] = js["layers"].rstrip() + "\n\n" + j2
# tiers / bytes: the run-it-yourself code sits in the tiers file, its markup is in the bytes lesson
t1, t2 = split_at(js["tiers"], "/* ---- run-it-yourself, with commands you can copy")
t2 = sub1(t2, 'function esc(t){ return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }\n', "", what="duplicate esc")
t2 = sub1(t2, "Download the course files.", "Download the teaching files.")
jsout["tiers"] = t1
jsout["bytes"] = js["bytes"].rstrip() + "\n\n" + t2
# vm / split: the chatter widget sits in the vm file, its markup is in the split lesson
v1, v2 = split_at(js["vm"], "/* ---- what inter-service chatter costs")
jsout["vm"] = v1
jsout["split"] = js["split"].rstrip() + "\n\n" + v2
# memory model: shared by mem and server
mem = js["mem"]
mem_a, mem = line_range(mem, 2, 3)
mem_b, mem = line_range(mem, 6 - 2, 19 - 2)  # lines shifted by the 2 removed above
assert mem_a.startswith("const MEM=") and mem_b.startswith("function memModel()"), (mem_a[:20], mem_b[:20])
lib["memmodel"] = ("/* Memory budget model shared by the Server memory and Server capacity lessons.\n"
                   "   MEM is the state the sliders change. memModel() turns it into MB used and workers that fit. */\n" + mem_a + mem_b)
mem = sub1(mem, "let simReady=false;   // the server capacity state is declared later in this script\n", "", what="simReady")
mem = sub1(mem, 'function syncMemLink(){ if(simReady && typeof updateGauges==="function") updateGauges(); }\n', "", what="syncMemLink")
mem = mem.replace(";syncMemLink()", "")
assert "syncMemLink" not in mem
jsout["mem"] = mem
srv = js["server"]
srv = sub1(srv, "sizeCanvas(); resetSim(); simReady=true; syncMemLink();", "sizeCanvas(); resetSim();", what="server init")
jsout["server"] = srv
# placeLabels: shared by embed and vectors
emb = js["embed"]
pl, emb = line_range(emb, 4, 30)
assert pl.startswith("/* Label placement") and pl.rstrip().endswith("}"), pl[-40:]
lib["placelabels"] = pl
jsout["embed"] = emb
# student data: shared by learn and train
lrn = js["learn"]
st, lrn = line_range(lrn, 4, 5)
assert st.startswith("const STUD=")
lib["students"] = "/* The seventeen students of the training and test lessons: [hours studied per week, attendance, finished (1) or not (0)]. */\n" + st
jsout["learn"] = lrn
# break: the keyboard block moves into the lessons it acts on
brk, kb = split_at(js["break"], "/* keyboard */")
brk = sub1(brk, '$("#bkIntro"+n).textContent=d.intro;', '$("#bkIntro"+n).innerHTML=d.intro;', what="break intro")   # intro holds lesson links
brk = sub1(brk, '$("#bkReport"+n).textContent=d.report;', '$("#bkReport"+n).innerHTML=d.report;', what="break report")
jsout["break"] = brk
# vibe: nav, zoom and theme code belongs to the shell
vb, _ = split_at(js["vibe"], "function redrawAll()")
jsout["vibe"] = vb

# copy edits that remove course wording (item 4) in js strings
jsout["basics"] = sub1(jsout["basics"], "If you download the course files and run", "If you download the teaching files and run")
jsout["vibe"] = sub1(jsout["vibe"], 'This is the problem in the Module 1 site, "Transactions".', 'This is the problem in <a data-lesson="txn">Transactions</a>.', what="vibe txn")

KEYBOARD = {
    "journey": '''/* keyboard: Space plays and Right arrow steps (shortcuts that act inside this lesson only) */
addEventListener("keydown",e=>{
  if(e.key===" "){e.preventDefault();$("#playJ").click()}
  if(e.key==="ArrowRight"){e.preventDefault();$("#stepJ").click()}
});
''',
    "server": '''/* keyboard: Space starts and stops the simulation */
addEventListener("keydown",e=>{
  if(e.key===" "){e.preventDefault();$("#simRun").click()}
});
''',
    "break": '''/* keyboard: Space starts the timer of the step that is showing */
addEventListener("keydown",e=>{
  const run=document.querySelector("#p-break .sec.on [data-run]");
  if(run && e.key===" "){e.preventDefault();run.click()}
});
''',
    "tiers": '''/* keyboard: arrows and Space drive the trace while that step is showing */
addEventListener("keydown",e=>{
  if(document.querySelector('#p-tiers .sec.on[data-sec="trace"]')){
    if(e.key==="ArrowRight"){e.preventDefault();$("#trNext").click()}
    if(e.key==="ArrowLeft"){e.preventDefault();$("#trPrev").click()}
    if(e.key===" "){e.preventDefault();$("#trPlay").click()}
  }
});
''',
}
SHOW = {  # relayout when the lesson or a More detail opens (the platform calls PAGE_HOOKS.show)
    "server": "sizeCanvas();", "pay": "layoutBypass(); placePayBall(pyI);", "tiers": "placeBall(trI);", "vm": "elDraw();",
}
REDRAW = {  # repaint canvases after a theme change (the platform calls PAGE_HOOKS.redraw)
    "scale": ["renderScale"], "cost": ["renderCost"], "vm": ["elRender"], "server": ["drawSim"],
    "learn": ["lnRender"], "train": ["trRender"], "deep": ["nnRender"], "embed": ["emRender"], "vectors": ["vecRender"], "attn": ["attRender"],
}
def hooks(i):
    out = ""
    if i in SHOW:
        out += f'\n/* called by the platform when this lesson or a step or More detail becomes visible */\nPAGE_HOOKS.show=()=>{{ {SHOW[i]} }};\n'
    if i in REDRAW:
        calls = " ".join(f"{f}();" for f in REDRAW[i])
        out += f'\n/* called by the platform after a theme change */\nPAGE_HOOKS.redraw=()=>{{ try{{ {calls} }}catch(e){{}} }};\n'
    return out

# ---------------------------------------------------------------- 5. copy edits on markup, questions
def edit(text, pairs, who):
    for old, new in pairs:
        c = text.count(old)
        assert c >= 1, f"{who}: no match for {old[:60]!r}"
        text = text.replace(old, new)
    return text
PROJECT = '<span data-var="project">project</span>'
COPY_EDITS = {
    "basics": [("This course also uses a twenty-line program, <code>teaching_server.py</code>.", "A twenty-line program, <code>teaching_server.py</code>, is another example."),
               ("The starter project for this course uses <code>8000</code>", "A typical starter project uses <code>8000</code>")],
    "split": [('data-title="What to do in your capstone"', 'data-title="What to do in your {{project}}"'),
              ("<h4>Why most capstones stay as one application</h4>", "<h4>Why most small projects stay as one application</h4>"),
              ("most capstone projects run at low load", "most small projects run at low load")],
    "render": [('Decide which kind of <dfn title="Your final course project">capstone</dfn> project yours is.', f"Decide which kind of {PROJECT} yours is.")],
    "pay": [("If your capstone connects to a real bank", f"If your {PROJECT} connects to a real bank")],
    "sql": [("the Python web framework used in this course,", "a Python web framework,")],
    "vm": [("Your capstone is a PaaS customer, and it is a SaaS provider", f"Your {PROJECT} is a PaaS customer, and it is a SaaS provider")],
    "region": [('data-title="Choose for your capstone"', 'data-title="Choose for your {{project}}"'),
               ("Every user of your capstone is in Metro Manila", f"Every user of your {PROJECT} is in Metro Manila")],
    "shape": [('data-title="Choosing for your capstone"', 'data-title="Choosing for your {{project}}"')],
    "intro": [("matters most for the rest of the module, because later lessons assume", "matters most for the lessons that follow, because they assume"),
              ("<h4>Where this module goes</h4>", "<h4>Where the lessons go from here</h4>"),
              ("<p>The rest of the module is about the innermost circle.", "<p>The lessons that follow are about the innermost circle.")],
    "loop": [(" Module 3 covers how to decide.", "")],
    "vibe": [(" In Module 3 you practice finding that point on purpose.", ""),
             ('The first three appear in the Module 1 site, in "The N+1 query problem", "SQL basics" and "Transactions".',
              'The first three appear in <a data-lesson="query">The N+1 query problem</a>, <a data-lesson="sql">SQL basics</a> and <a data-lesson="txn">Transactions</a>.')],
    "tools": [('This is the missing WHERE clause from the Module 1 site, "SQL basics", this time', 'This is the missing WHERE clause from <a data-lesson="sql">SQL basics</a>, this time'),
              ('The Module 1 site uses the word "server" for a different thing, in "What a server is".', 'The lesson <a data-lesson="basics">What a server is</a> uses the word "server" for a different thing.')],
    "ctx": [('This works like the memory budget in the Module 1 site, "Server memory".', 'This works like the memory budget in <a data-lesson="mem">Server memory</a>.')],
    "prompt": [('See the Module 1 site, "Transactions", and later "Reviewing AI-written code".', 'See <a data-lesson="txn">Transactions</a> and <a data-lesson="vibe">Reviewing AI-written code</a>.')],
}
CYU_EDITS = {
    "region": [("Every user of your capstone is in Metro Manila", "Every user of your {{project}} is in Metro Manila")],
    "shape": [("Your capstone team is not sure", "Your {{project}} team is not sure"),
              ("At capstone data volumes you will not notice", "At student project data volumes you will not notice"),
              ("Most capstones need ordinary filtering", "Most student projects need ordinary filtering")],
    "split": [("in the capstone project.", "in the {{project}}."), ("A capstone rarely has a scaling problem", "A small project rarely has a scaling problem")],
    "vm": [("Your capstone team forgets", "Your {{project}} team forgets")],
    "prompt": [("Your capstone has a checkout page.", "Your {{project}} has a checkout page.")],
}

# cross references by name: "Server memory" -> <a data-lesson="mem">Server memory</a>
titles = {}
for i in ids_all:
    titles[info[i]["label"]] = i
    titles[strip_tags(re.search(r"<h2[^>]*>(.*?)</h2>", panels[i], re.S).group(1))] = i
def link(i, text, q):  # q is the quote used for the attribute
    return f"<a data-lesson={q}{i}{q}>{text}</a>"
def link_html(h, me):
    parts = re.split(r"(<[^>]+>)", h)
    n = 0
    for k in range(0, len(parts), 2):          # text outside tags only
        s = parts[k]
        for t, i in sorted(titles.items(), key=lambda x: -len(x[0])):
            if i == me: continue
            q = f'"{t}"'
            if q in s:
                n += s.count(q); s = s.replace(q, link(i, t, '"'))
        parts[k] = s
    return "".join(parts), n
def delim_before(text, pos):
    """The string delimiter that encloses text[pos] when the lines before it are plain code. ' " or `."""
    st = None; k = 0
    line_start = text.rfind("\n", 0, pos) + 1
    # scan from the start of the file so multi-line template literals are known
    esc = False; depth = []
    i = 0
    while i < pos:
        c = text[i]
        if st is None:
            if c == "/" and text[i + 1:i + 2] == "/": i = text.index("\n", i); continue
            if c == "/" and text[i + 1:i + 2] == "*": i = text.index("*/", i) + 2; continue
            if c in "'\"`": st = c
        else:
            if c == "\\": i += 2; continue
            if c == st: st = None
        i += 1
    return st
def link_js(text, me):
    n = 0
    for t, i in sorted(titles.items(), key=lambda x: -len(x[0])):
        if i == me: continue
        for form in (f'\\"{t}\\"', f'"{t}"'):
            pos = 0
            while True:
                p = text.find(form, pos)
                if p < 0: break
                d = delim_before(text, p)
                if d is None:               # not inside a string: leave it
                    pos = p + 1; continue
                if form.startswith("\\"):
                    rep = link(i, t, "\\'" if d == "'" else "'") if d == '"' else None
                    if rep is None: pos = p + 1; continue
                else:
                    if d == '"': pos = p + 1; continue   # a bare " would have ended the string, so this is not a quoted title
                    rep = link(i, t, '"')
                text = text[:p] + rep + text[p + len(form):]; n += 1; pos = p + len(rep)
    return text, n

# ---------------------------------------------------------------- 6. write the lessons
videos = {}
for page in PAGES:
    for v in json.loads(rd(SRC / page / "videos.json") or "[]"):
        videos.setdefault(v["panel"], []).append({"sec": v["sec"], "youtube": v["youtube"], "title": v["title"], "about": v["about"]})

if not CHECK:
    for sub in ("lessons", "lib"):
        if (ROOT / sub).exists(): shutil.rmtree(ROOT / sub)
stats = {"links_html": 0, "links_js": 0}
for i in ids_all:
    h = panels[i]
    h = edit(h, COPY_EDITS.get(i, []), i)
    h, n = link_html(h, i); stats["links_html"] += n
    code = jsout[i]
    code, n = link_js(code, i); stats["links_js"] += n
    kb_code = KEYBOARD.get(i, "")
    banner = f"/* Lesson {i}. Widget code for the markup in lesson.html."
    if i in NEEDS: banner += " Shared code it needs: " + ", ".join(f"lib/{n}.js" for n in NEEDS[i]) + "."
    banner += " */\n"
    code = banner + code.strip("\n") + "\n" + ("\n" + kb_code if kb_code else "") + hooks(i)
    cy = json.loads(rd(SRC / JSFILE[i][0] / "cyu" / f"{i}.json")) if (SRC / JSFILE[i][0] / "cyu" / f"{i}.json").exists() else {"panel": i, "items": []}
    cyraw = json.dumps({"lesson": i, "items": cy["items"]}, ensure_ascii=False, indent=1)
    cyraw = edit(cyraw, CYU_EDITS.get(i, []), "cyu " + i)
    meta = {"id": i, "title": strip_tags(re.search(r"<h2[^>]*>(.*?)</h2>", h, re.S).group(1)), "label": info[i]["label"], "desc": info[i]["desc"],
            "outcomes": outcomes[i], "tags": TAGS[i], "area": area_of[i], "needs": NEEDS.get(i, []),
            "video": (videos[i][0] if len(videos.get(i, [])) == 1 else videos.get(i)) if i in videos else None}
    d = ROOT / "lessons" / i
    h = h.replace('class="panel on"', 'class="panel"', 1)
    wr(d / "lesson.html", h)
    wr(d / "lesson.js", code)
    wr(d / "cyu.json", cyraw + "\n")
    wr(d / "meta.json", json.dumps(meta, ensure_ascii=False, indent=1) + "\n")
print(f"{len(ids_all)} lessons; cross references turned into links: {stats['links_html']} in markup, {stats['links_js']} in scripts")

# ---------------------------------------------------------------- 7. lib/
CORE = '''/* lib/core.js: the globals every lesson page has. Always loaded first.
   $ and $$ select, ICO builds an icon from the sprite, REDUCED is the reduced-motion preference,
   CSSV reads a CSS variable (cached; the cache is cleared when the theme changes).
   PAGE_HOOKS lets a lesson tell the platform what to do when it becomes visible or the theme changes:
     PAGE_HOOKS.show   = () => { ... }   called when the lesson, a step or a More detail is shown (measure layout here)
     PAGE_HOOKS.redraw = () => { ... }   called after the theme changes (repaint canvases here)
   Display.setTheme, Display.toggleTheme and Display.zoom are used by the Display buttons that the platform builds. */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const ICO=(n,c)=>`<svg class="ico ${c||""}" aria-hidden="true" focusable="false"><use href="#i-${n}"/></svg>`;
const REDUCED = matchMedia("(prefers-reduced-motion:reduce)").matches;
const CSSV=(()=>{ const c={};
  const f=n=>{ if(!(n in c)) c[n]=getComputedStyle(document.documentElement).getPropertyValue(n).trim();
               return c[n]||"#888"; };
  f.cache=c; return f; })();

/* html classes and the theme, from the address: ?embed=1  ?instructor=1  ?theme=dark */
{ const q=new URLSearchParams(location.search), h=document.documentElement;
  if(q.get("embed")==="1") h.classList.add("embed");
  if(q.get("instructor")==="1") h.classList.add("instructor");
  if(q.get("theme")==="dark"||q.get("theme")==="light") h.setAttribute("data-theme",q.get("theme"));
}

/* Single-key shortcuts must not fire with Ctrl, Cmd or Alt held, inside form fields, or in embed mode.
   Every keydown listener added to window or document is wrapped once. */
(()=>{ const add=EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener=function(t,fn,o){
    if(t==="keydown" && (this===window||this===document) && typeof fn==="function" && !fn.__guarded){
      const g=function(e){
        if(e.ctrlKey||e.metaKey||e.altKey) return;
        if(document.documentElement.classList.contains("embed")) return;
        const t=e.target;
        if(t && t.closest && t.closest("input,textarea,select,[contenteditable],[contenteditable=true]")) return;
        return fn.call(this,e); };
      g.__guarded=true; return add.call(this,t,g,o);
    }
    return add.call(this,t,fn,o); };
})();

window.PAGE_HOOKS={show:null, redraw:null};

/* theme and text size (the Display buttons) */
window.Display=(()=>{
  let scale=1;
  const html=document.documentElement;
  const hooks=()=>{ try{ if(PAGE_HOOKS.show) PAGE_HOOKS.show(); }catch(e){} window.dispatchEvent(new Event("resize")); };
  function setTheme(t){
    html.setAttribute("data-theme", t);
    for(const k in CSSV.cache) delete CSSV.cache[k];
    try{ if(PAGE_HOOKS.redraw) PAGE_HOOKS.redraw(); }catch(e){}   // canvases repaint with the new palette
    $$("[data-display=theme]").forEach(b=>b.textContent = t==="light" ? "Dark" : "Light");
  }
  const toggleTheme=()=>setTheme(html.getAttribute("data-theme")==="light" ? "dark" : "light");
  function zoom(d){ scale=Math.max(.75,Math.min(1.5,Math.round((scale+d)*100)/100)); html.style.setProperty("--scale",scale); hooks(); }
  /* the buttons are made by the platform; this wires any that are on the page */
  function bind(root){
    $$("[data-display=theme]",root).forEach(b=>{ b.onclick=toggleTheme; b.textContent = html.getAttribute("data-theme")==="light" ? "Dark" : "Light"; });
    $$("[data-display=zin]",root).forEach(b=>b.onclick=()=>zoom(.1));
    $$("[data-display=zout]",root).forEach(b=>b.onclick=()=>zoom(-.1));
  }
  return {setTheme, toggleTheme, zoom, bind};
})();
'''
lib["core"] = CORE
if not CHECK:
    for k, v in lib.items(): wr(ROOT / "lib" / f"{k}.js", v)

# ---------------------------------------------------------------- 8. courses
def home(page, file, title, subtitle, kicker, links):
    shell = rd(SRC / page / "shell.html")
    intro = html.unescape(re.search(r'<p class="lede">(.*?)</p>', shell, re.S).group(1)).strip()
    return {"file": file, "title": title, "subtitle": subtitle, "kicker": kicker, "intro": intro,
            "links": links, "groups": [{"label": g[0], "lessons": g[1]} for g in nav[page]]}
GROUP_LABELS = {"Module 1 · Anatomy": "Module 1 · Anatomy"}
course = {
    "id": "itent45", "code": "ITENT 45", "title": "Application Development and Emerging Technologies",
    "org": "BS Information Technology Entrepreneurship · Ateneo de Manila University",
    "homes": [
        home("index", "index.html", "Under the Hood", "What happens when you load a page", "ITENT 45 · Module 1",
             [{"label": "Next: Module 2", "home": "machine.html"}, {"label": "Course code on GitHub", "href": "https://github.com/jilagan/itent45"}]),
        home("machine", "machine.html", "What the Machine Is Doing", "Before you let it write your code", "ITENT 45 · Module 2",
             [{"label": "Module 1", "home": "index.html"}]),
    ],
    "vars": {"project": "capstone project"},
}
wr(ROOT / "courses" / "itent45.json", json.dumps(course, ensure_ascii=False, indent=1) + "\n")
library = {"id": "library", "title": "Lesson library",
           "intro": "Short interactive lessons on how software works. Each lesson stands alone, so a course can use any of them in any order.",
           "areas": [{"id": a[0], "label": a[1], "about": a[2], "lessons": a[3]} for a in AREAS]}
wr(ROOT / "courses" / "library.json", json.dumps(library, ensure_ascii=False, indent=1) + "\n")

# ---------------------------------------------------------------- 9. css: the two style.css files in one
sys.path.insert(0, str(ROOT / "tools"))
def css_rules(s):
    """Top level rules of a stylesheet as (wrapper, selector, body, raw). Comments are dropped."""
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S); out = []; i = 0; n = len(s)
    def block(j):
        d = 1; k = j + 1
        while k < n and d:
            d += (s[k] == "{") - (s[k] == "}"); k += 1
        return k
    while i < n:
        j = s.find("{", i)
        if j < 0: break
        sel = s[i:j].strip(); k = block(j); body = s[j + 1:k - 1]
        if sel.startswith("@media") or sel.startswith("@supports"):
            for w, a, b, r in css_rules(body): out.append((sel + "|" + w if w else sel, a, b, r))
        else:
            out.append(("", re.sub(r"\s+", " ", sel), re.sub(r"\s+", "", body), f"{sel}{{{body.strip()}}}"))
        i = k
    return out
ci = rd(SRC / "index" / "style.css"); cm = rd(SRC / "machine" / "style.css")
have = {}
for w, sel, body, raw in css_rules(ci): have.setdefault((w, sel), []).append(body)
mrules = css_rules(cm)
mhave = {(w, sel) for w, sel, body, raw in mrules}
conflict = {sel for w, sel, body, raw in mrules if (w, sel) in have and body not in have[(w, sel)]}   # same selector, different body
MACHINE_IDS = [i for i in ids_all if info[i]["page"] == "machine"]
INDEX_IDS = [i for i in ids_all if info[i]["page"] == "index"]
def class_tokens(t):
    toks = set()
    for m in re.finditer(r'class\s*=\s*\\?["\']([^"\'\\]+)', t): toks |= set(m.group(1).split())
    for m in re.finditer(r'classList\.(?:add|toggle|remove|contains)\(([^)]*)\)', t): toks |= set(re.findall(r'["\']([\w-]+)["\']', m.group(1)))
    for m in re.finditer(r'className\s*[+]?=\s*["\']([^"\']+)', t): toks |= set(m.group(1).split())
    for m in re.finditer(r'(?:class|cls)\s*[:=]\s*["\']([^"\']+)', t): toks |= set(m.group(1).split())
    return {x for x in toks if re.match(r"^[A-Za-z_][\w-]*$", x)}
use = {i: class_tokens(panels[i] + jsout[i]) for i in ids_all}
idx_used = set().union(*[use[i] for i in INDEX_IDS]); mac_used = set().union(*[use[i] for i in MACHINE_IDS])
def parts_of(sel): return [x.strip() for x in sel.split(",")]
def classes(x): return set(re.findall(r"\.([A-Za-z_][\w-]*)", x))
def flagged(sel, used): return any(classes(x) and classes(x) <= used for x in parts_of(sel))
def scope_part(x, ids_): return ":where(" + ",".join("#p-" + y for y in ids_) + ") " + x
def lessons_using(sel, ids_):
    cl = set().union(*[classes(x) for x in parts_of(sel)])
    return [i for i in ids_ if use[i] & cl]
def emit(w, raw): return f"{w}{{{raw}}}" if w else raw
extra = []; scoped = []
for w, sel, body, raw in mrules:
    if sel in conflict:                                   # same selector, other body: keep it for the lessons that had it
        ids_ = lessons_using(sel, MACHINE_IDS) or MACHINE_IDS
    elif (w, sel) not in have and flagged(sel, idx_used):  # a new rule whose classes the index lessons also use: keep it away from them
        ids_ = lessons_using(sel, MACHINE_IDS) or MACHINE_IDS
    elif (w, sel) not in have:
        extra.append(emit(w, raw)); continue
    else: continue
    inner = re.search(r"\{(.*)\}", raw, re.S).group(1).strip()
    scoped.append(emit(w, ",".join(scope_part(x, ids_) for x in parts_of(sel)) + "{" + inner + "}"))
# index rules for classes that the machine lessons also use, with different meaning (checked by comparing screenshots):
# keep them for the index lessons. ".lane" is the lane of the tiers diagram and ".vb" is a verb card.
RESCOPE_BARE = ("lane", "vb")
rescoped = []
def rescope(m):
    lead, sel = re.match(r"^((?:\s*/\*.*?\*/)*\s*)(.*)$", m.group(1), re.S).groups()
    sel = sel.strip()
    if not sel or sel.startswith("@"): return m.group(0)
    hit = [x for x in parts_of(sel) if re.match(r"^\.(%s)(?![\w-])" % "|".join(RESCOPE_BARE), x)]
    if not hit: return m.group(0)
    ids_ = lessons_using(sel, INDEX_IDS)
    new = ",".join(scope_part(x, ids_) if x in hit else x for x in parts_of(sel))
    rescoped.append(sel)
    return f"{lead}{new}{{{m.group(2)}}}"
ci_scoped = re.sub(r"([^{}]+)\{([^{}]*)\}", rescope, ci)
parts = [ci_scoped.rstrip(), "\n\n/* ---------- rules that were only in the second site's style.css ---------- */"] + extra
parts.append("\n/* ---------- rules the two old sites shared by class name: each version is kept for the lessons that used it ---------- */")
parts += scoped
differ = scoped
css = "\n".join(parts) + "\n"
# the rail items are links now: every rule for ".nav button" also applies to ".nav a.navitem"
def railify(text):
    def rule(m):
        sel, body = m.group(1), m.group(2)
        if ".nav button" in sel or ".navset button" in sel:
            new = ",".join(s.strip().replace(".navset button", ".navset .navitem").replace(".nav button", ".nav .navitem").replace('[aria-selected="true"]', '[aria-current="page"]') for s in sel.split(","))
            return f"{m.group(0)}\n{new}{{{body}}}"
        return m.group(0)
    return re.sub(r"([^{}@]*\.nav(?:set)? button[^{}]*)\{([^{}]*)\}", rule, text)
css = railify(css)
wr(ROOT / "shared" / "lessons.css", css)
for name in ("theme.css", "platform.css"):          # shared/ was copied from src/shared; its rail rules get the same treatment once
    f = ROOT / "shared" / name
    t = rd(f)
    if ".navitem" not in t and ".nav button" in t: wr(f, railify(t))
print(f"css: {len(extra)} rules added from the second site, {len(scoped)} second-site rules and {len(rescoped)} first-site rules scoped by lesson id")
if CHECK: print("rescoped:", rescoped)
print("lib:", ", ".join(sorted(lib)))

# ---------------------------------------------------------------- 10. syntax check of every script
node = shutil.which("node")
if node and not CHECK:
    bad = 0
    for i in ids_all:
        r = subprocess.run([node, "--check", str(ROOT / "lessons" / i / "lesson.js")], capture_output=True, text=True)
        if r.returncode: bad += 1; print("SYNTAX", i, r.stderr[:300])
    for k in lib:
        r = subprocess.run([node, "--check", str(ROOT / "lib" / f"{k}.js")], capture_output=True, text=True)
        if r.returncode: bad += 1; print("SYNTAX lib", k, r.stderr[:300])
    print("syntax errors:", bad)
