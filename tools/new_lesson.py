#!/usr/bin/env python3
"""Start a new lesson. Python 3 standard library only.

    python3 tools/new_lesson.py ID --area web --title "Heading of the lesson" --label "Short rail label" [--desc "..."]

Makes lessons/ID/ with a commented template for lesson.html, lesson.js, cyu.json and meta.json, and adds ID to
the end of its area in courses/library.json. Then write the lesson (docs/AUTHORING.md), run python3 build.py and
open lessons/ID.html."""
import sys, re, json, pathlib, argparse

ROOT = pathlib.Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
ap.add_argument("id", help="letters, digits, - and _ (it becomes lessons/ID.html and the p-ID panel id)")
ap.add_argument("--area", required=True, help="an area id from courses/library.json")
ap.add_argument("--title", default="Title of the lesson")
ap.add_argument("--label", default="Short label")
ap.add_argument("--desc", default="One sentence, under 12 words, saying what the lesson shows.")
a = ap.parse_args()
if not re.fullmatch(r"[A-Za-z0-9_-]+", a.id): sys.exit("The id may use letters, digits, - and _ only.")
d = ROOT / "lessons" / a.id
if d.exists(): sys.exit(f"lessons/{a.id} exists already.")
libf = ROOT / "courses" / "library.json"
lib = json.loads(libf.read_text(encoding="utf-8"))
area = next((x for x in lib["areas"] if x["id"] == a.area), None)
if not area: sys.exit("Unknown area. Choose one of: " + ", ".join(x["id"] for x in lib["areas"]))
d.mkdir(parents=True)
I = a.id
(d / "lesson.html").write_text(f'''<section class="panel" id="p-{I}">
  <!-- The head: one h2 that names the topic like a textbook section, and one lede of at most 2 sentences and 35 words.
       Mark each new term once: <dfn title="definition, under 15 words">term</dfn>. At most 3 per step. -->
  <div class="head">
    <h2>{a.title}</h2>
    <p>One or two sentences that say what this lesson explains.</p>
  </div>

  <!-- Step 1: a real moment seen on a screen, at most 60 words, a .scene of the real parts (icon figures), a Think first box of at most 30 words.
       No widget, no comparison. Then ask what happens behind the screen. -->
  <div class="sec" data-sec="start" data-title="Start with a real moment">
    <p>Describe what the user sees and does in software students already use, in 1 to 3 short sentences.</p>
    <div class="scene" role="group" aria-label="What the picture shows" data-art="" data-art-desc="">
      <figure><div class="sic"><svg class="ico " aria-hidden="true" focusable="false"><use href="#i-user"/></svg></div><figcaption><b>Plain label</b><span>Technical name</span></figcaption></figure>
    </div>
    <div class="ask"><b>Think first.</b> One question of at most 30 words. Write down a guess.</div>
  </div>

  <!-- Later steps: at most 70 words, at most one widget, and one sentence that says what to do with it, placed before the widget.
       Keep 3 to 5 steps. Put depth in <details class="more"><summary>More detail</summary> ... </details>.
       A link to another lesson is an a element with a data-lesson attribute that holds the lesson id (see docs/AUTHORING.md). The words "capstone project" are written
       <span data-var="project">project</span> so each course can name its own. -->
  <div class="sec" data-sec="try" data-title="Try it">
    <p>Do one thing with the widget below, then read what changes.</p>
    <div class="card" id="{I}Widget"></div>
  </div>

  <!-- The platform adds the last step ("Check your understanding", slug check) with the key terms and the questions from cyu.json. -->
</section>
''', encoding="utf-8")
(d / "lesson.js").write_text(f'''/* Lesson {I}. Widget code for the markup in lesson.html.
   This file and the libs named in meta.json "needs" are the only scripts on the page, so it may use $, $$, ICO, REDUCED, CSSV and PAGE_HOOKS from lib/core.js.
   Top-level names are global to the page. Give them a prefix of your own (for example {I[:3]}) so they cannot clash with a lib.
   Code that two lessons need goes in lib/<name>.js, and both lessons list the name in "needs". */

/* Layout that needs measuring (a canvas size, a diagram position) runs here. The platform calls it when a step or a More detail opens. */
PAGE_HOOKS.show = () => {{ }};
/* Canvases repaint here after the theme changes. */
PAGE_HOOKS.redraw = () => {{ }};

const {I[:3]}Root = $("#{I}Widget");
if ({I[:3]}Root) {{
  {I[:3]}Root.textContent = "The widget goes here.";
}}
''', encoding="utf-8")
(d / "cyu.json").write_text(json.dumps({"lesson": I, "items": [
    {"id": f"{I}-1", "sec": None, "type": "predict", "stem": "A question of one or two sentences that can be answered from the lesson.",
     "options": [{"text": "The correct answer", "correct": True, "feedback": "Why it is correct, in one or two sentences."},
                 {"text": "A plausible wrong answer", "feedback": "What this answer gets wrong."},
                 {"text": "Another plausible wrong answer", "feedback": "What this answer gets wrong."}]}]}, indent=1) + "\n", encoding="utf-8")
(d / "meta.json").write_text(json.dumps({"id": I, "title": a.title, "label": a.label, "desc": a.desc,
    "outcomes": ["After this lesson you can do a first thing", "After this lesson you can do a second thing", "After this lesson you can do a third thing"],
    "tags": [], "area": a.area, "needs": [], "video": None}, indent=1) + "\n", encoding="utf-8")
area["lessons"].append(I)
libf.write_text(json.dumps(lib, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Made lessons/{I}/ and listed it in the {a.area} area of courses/library.json.")
print("Next: write the four files, run python3 build.py, open lessons/%s.html, then python3 tools/check.py . %s" % (I, I))
