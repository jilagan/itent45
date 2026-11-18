# Converting a panel to the lesson layout

Worked example: lesson `tiers`. Rules are in docs/OVERHAUL-SPEC.md, "Simplicity rules (round 2)". The platform (shared/platform.js and platform.css) turns `.sec` blocks into steps, adds the last step "Check your understanding" (slug `check`), lists `<dfn>` terms as "Key terms" at its top, and adds Back, "Next: <title>" and "Next lesson: <rail label>" buttons. Panels you have not converted still work: their `.sec` blocks are steps, and a panel with no `.sec` is one step. From step 2 on, only the h2 of the head shows, so a long old head appears on step 1 only.

## Before and after (tiers)
Before: one panel with no steps. `.head` held h2, 3 paragraphs, a "Think first" box and an instructor note. Then a framework switch, a flow diagram with three cards of about 45 words each plus "Runs on / You write / In practice" rows, a 12-step trace with 3 view toggles, a "why not" note and a framework note. About 350 words were visible in the first 900 px.

After (about 110 visible words on screen 1):
- `.head`: h2 and one lede of 28 words. One `<dfn>`.
- Step 1 `start`: a real moment seen on a screen (at most 60 words), a `.scene` of the real parts (icons and plain labels), the Think first box, instructor note (hidden). No widget.
- Step 2 `tiers`: one instruction sentence, three static `.tcard` cards of at most 20 words. `<details class="more">` holds the Django/Express/Laravel switch (`#stackTog`), the "Runs on / You write / In practice / Stack" table (`#tierMeta`) and the framework note.
- Step 3 `trace`: one instruction line, the widget (Play, Previous part, Next part, Reset, flow diagram, trace card). More detail holds the element-tree and "what the user sees" views.
- Step 4 `why`: the "question worth asking" as 59 words of prose. More detail holds the AI note.
- Generated step 5: Key terms, then the CYU items.

## Steps
1. Keep the `<section class="panel" id="p-x">` and every id the JS uses.
2. `.head`: h2 and one `<p>` of at most 2 sentences and 35 words. Delete everything else from the head (move it into step 1 or More detail).
3. Wrap each step in `<div class="sec" data-sec="slug" data-title="Plain title">`, directly inside the panel. 3 to 5 authored steps. Step 1 is a real moment from software the students use (`.scene` of the real parts, at most 60 words, Think first at most 30 words, no widget; title starts "Start with"). Each later step has at most 70 words, at most one widget, and a sentence saying what to do with it, placed before the widget.
4. Mark each new term once: `<dfn title="definition, under 15 words">term</dfn>`. At most 3 per step.
5. Move depth into `<details class="more"><summary>More detail</summary>...</details>` (closed). Controls that JS reaches by id can live inside it. Use `<h4>` for sub-headings inside. Cross-references go here, written as `<a data-lesson="id">Title</a>`.
6. JS: shorten verdict and caption strings to 2 sentences. Remove cross-references to other panels from widget text. If a keyboard shortcut acts on a widget, test that the widget's step is showing (see lessons/break/lesson.js and lessons/tiers/lesson.js). Widgets that measure layout need `PAGE_HOOKS.show`, set in the lesson's lesson.js. The platform calls it when a step opens and when a More detail opens. Canvases that must repaint after a theme change set `PAGE_HOOKS.redraw`.
7. CYU: 3 to 4 items. At most one item per step gets `"sec":"slug"`; the others use `"sec":null` and sit in the last step. Remove "before you try it" and "above" wording, since the question may sit away from the widget. Drop `try` lines or point them at a named step.
8. Each lesson has a `meta.json` with id, title, label, desc (under 12 words), 3 outcomes, tags, area and needs. The rail and the home view read it.

## Icons (Phosphor Icons, MIT, regular weight)
Icons live in shared/icons/<name>.svg. build.py inlines them into every page as a hidden sprite. Use `<svg class="ico big" aria-hidden="true"><use href="#i-NAME"/></svg>` in HTML, or `ICO("name","big")` in JS. To add one, copy it from `@phosphor-icons/core/assets/regular/` (install in /tmp, not in the repo). Colour is currentColor. Orange (`--req`) and blue (`--res`) are only for the active request and response. Step 1 uses `.scene` with `<figure><div class="sic">icons</div><figcaption><b>Plain label</b><span>Technical name</span></figcaption></figure>`. Cards and machines carry their icon at the top (`.ico.big`). The travelling marker in the tiers flow switches icon: receipt (request and query), table (rows), envelope-simple-open (response).

Use literal icons only: each icon shows the real part it labels. Use the same icon for the same part in every lesson. All names below exist in the package.

| Role | Icon name |
|---|---|
| User, browser as a person | `user` |
| Application server, machine | `hard-drives` |
| Database | `database` |
| Request going out | `envelope-simple` or `note-pencil` |
| Response coming back | `envelope-simple-open` |
| Rows of data | `table` |
| Many users at once | `users-three` |
| Split between servers | `arrows-split` |
| Bank, payment | `bank`, `credit-card` |
| Class list, student | `list-bullets`, `student` |
| Phone, keyboard suggestions | `device-mobile`, `keyboard` |
| Message so far (context) | `chat-text` |
| Browser window | `browser` |
