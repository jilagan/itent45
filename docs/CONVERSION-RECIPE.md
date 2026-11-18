# Converting a panel to the lesson layout

Worked example: index `tiers`. Rules are in docs/OVERHAUL-SPEC.md, "Simplicity rules (round 2)". The platform (src/shared/platform.js and platform.css) turns `.sec` blocks into steps, adds the last step "Check your understanding" (slug `check`), lists `<dfn>` terms as "Key terms" at its top, and adds Back, "Next: <title>" and "Next lesson: <rail label>" buttons. Panels you have not converted still work: their `.sec` blocks are steps, and a panel with no `.sec` is one step. From step 2 on, only the h2 of the head shows, so a long old head appears on step 1 only.

## Before and after (tiers)
Before: one panel with no steps. `.head` held h2, 3 paragraphs, a "Think first" box and an instructor note. Then a framework switch, a flow diagram with three cards of about 45 words each plus "Runs on / You write / In practice" rows, a 12-step trace with 3 view toggles, a "why not" note and a framework note. About 350 words were visible in the first 900 px.

After (about 110 visible words on screen 1):
- `.head`: h2 and one lede of 28 words. One `<dfn>`.
- Step 1 `restaurant`: analogy paragraph, a `.scene` (icons and labels), the Think first box, instructor note (hidden). No widget.
- Step 2 `tiers`: one instruction sentence, three static `.tcard` cards of at most 20 words. `<details class="more">` holds the Django/Express/Laravel switch (`#stackTog`), the "Runs on / You write / In practice / Stack" table (`#tierMeta`) and the framework note.
- Step 3 `trace`: one instruction line, the widget (Play, Previous part, Next part, Reset, flow diagram, trace card). More detail holds the element-tree and "what the user sees" views.
- Step 4 `why`: the "question worth asking" as 59 words of prose. More detail holds the AI note.
- Generated step 5: Key terms, then the CYU items.

## Steps
1. Keep the `<section class="panel" id="p-x">` and every id the JS uses.
2. `.head`: h2 and one `<p>` of at most 2 sentences and 35 words. Delete everything else from the head (move it into step 1 or More detail).
3. Wrap each step in `<div class="sec" data-sec="slug" data-title="Plain title">`, directly inside the panel. 3 to 5 authored steps. Step 1 is the everyday picture (`.scene`, analogy at most 60 words, Think first at most 30 words, no widget). Each later step has at most 70 words, at most one widget, and a sentence saying what to do with it, placed before the widget.
4. Mark each new term once: `<dfn title="definition, under 15 words">term</dfn>`. At most 3 per step.
5. Move depth into `<details class="more"><summary>More detail</summary>...</details>` (closed). Controls that JS reaches by id can live inside it. Use `<h4>` for sub-headings inside. Cross-references go here.
6. JS: shorten verdict and caption strings to 2 sentences. Remove cross-references to other panels from widget text. If a keyboard shortcut acts on a widget, test that the widget's step is showing (see 26-break.js, tiers). Widgets that measure layout need a hook in `PAGE_HOOKS.panel`; the platform calls it when a step opens and when a More detail opens.
7. CYU: 3 to 4 items. At most one item per step gets `"sec":"slug"`; the others use `"sec":null` and sit in the last step. Remove "before you try it" and "above" wording, since the question may sit away from the widget. Drop `try` lines or point them at a named step.
8. Rail: each nav button has `data-desc` (under 12 words) for the home view.

## Icons (Phosphor Icons, MIT, regular weight)
Icons live in src/shared/icons/<name>.svg. build.py inlines them into every page as a hidden sprite. Use `<svg class="ico big" aria-hidden="true"><use href="#i-NAME"/></svg>` in HTML, or `ICO("name","big")` in JS. To add one, copy it from `@phosphor-icons/core/assets/regular/` (install in /tmp, not in the repo). Colour is currentColor. Orange (`--req`) and blue (`--res`) are only for the active request and response. Step 1 uses `.scene` with `<figure><div class="sic">icons</div><figcaption><b>Analogy role</b><span>Technical name</span></figcaption></figure>`. Cards and machines carry their icon at the top (`.ico.big`). The travelling marker in the tiers flow switches icon: receipt (request and query), table (rows), bowl-food (response).

Use the same icon for the same role in every lesson. All names below exist in the package.

| Role | Icon name |
|---|---|
| Customer, user, browser as a person | `user` |
| Waiter, application server (service bell) | `bell-simple` |
| Kitchen, database | `cooking-pot` (database as a technical card: `database`) |
| Request going out (order slip) | `receipt` or `note-pencil` |
| Response coming back (the food) | `bowl-food` |
| Rows of data | `table` |
| Restaurant (whole) | `fork-knife` |
| Fast-food branch | `hamburger` (branch building: `storefront`) |
| Cashier, counter, worker | `cash-register` |
| Queue of customers | `users-three` |
| Guard, load balancer | `traffic-signal` (the split on a card: `arrows-split`) |
| Server, application machine | `hard-drives` |
| Condo building, virtual machines | `building-apartment` |
| Buying a jeepney (CapEx) | `bus` (there is no jeepney icon) |
| Booking a Grab (OpEx) | `taxi` |
| Bank branches (regions) | `bank` |
| Class list, spreadsheet | `list-bullets` (row of students: `student`) |
| Sari-sari store sale | `storefront` |
| LBC parcel, packet, layers | `package` |
| Cashier and claim stub | `cash-register` plus `ticket` |
| Phone, keyboard suggestions | `device-mobile`, `keyboard` |
| Message so far (context) | `chat-text` |
| Browser window | `browser` |
