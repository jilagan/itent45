# ITENT 45 site overhaul: shared spec

Every agent follows this file. Audits are in docs/audit-copy.md, docs/audit-design.md, docs/audit-structure.md.

## Audience
Business undergraduates. Not CS, not MIS. Many have never opened a terminal. They read this on Canvas (laptop or phone) and the instructor also projects it.

## Source layout
The library layout replaced the page layout. See README.md and docs/AUTHORING.md.
    lessons/<id>/lesson.html, lesson.js, cyu.json, meta.json     one folder per lesson
    lib/<name>.js                                                shared code a lesson names in meta "needs"
    courses/<course>.json, courses/library.json                  courses and the library page
    shared/                                                      theme.css, platform.css|js, course.js, analytics, icons, art
    python3 build.py [--out DIR]                                 writes lessons/<id>.html, courses/<course>.js, the home pages, library.html, embed.html
    python3 tools/check.py DIR [lesson ids...]                   clicks through every lesson page
Never edit the built pages. Do not run git.

## Writing rules (all on-screen text, in HTML and in JS strings)
1. Short declarative sentences. Ordinary spoken English. Would a lecturer say it out loud to a class?
2. Headings name the topic like a textbook section: "How a web app is divided", "HTTP verbs". No verdicts, no jokes, no full-sentence claims. Proposed replacements are in docs/audit-copy.md section 3. Use them or improve them.
3. Banned: contrast framing ("not X but Y", "rather than", "instead of", "X is not the same as Y"); two-sentence antithesis ("The verb says X. The URL says Y."); cleft sentences ("What X does is", "That is why", "That is what"); rhetorical setups ("Here is the thing"); quotable closing lines; em dashes and en dashes used as asides; triads for rhythm; metaphor verbs where a plain verb exists ("earns an afternoon", "ruin your afternoon", "physics gets a vote", "wearing different words"); personifying machines for drama; "land/lands/landed"; "actually", "just", "simply", "honestly".
4. Bold lead-in verdict lines become plain sentences or plain labels ("What changed", "Why it matters").
5. Explain every technical term at first use in the panel, in one plain clause. Do not assume Django, SQL, terminal, or any programming experience. Where code appears, say in one line what the reader is looking at.
6. Analogy first. Each panel's intro starts with an everyday situation (1 to 3 sentences), then names the technical term. Write it as ordinary prose in the intro paragraph. No "Analogy:" label, no special box. Philippine settings are welcome where natural. Use these anchors so panels agree with each other:
   - Module 1 anatomy (basics, tiers, layers, journey, bytes, rest, clients, render, pay): a restaurant. Customer = browser, waiter = application server, kitchen = database. The customer never walks into the kitchen. Envelopes/LBC parcels for layers. Order slip for HTTP. Paying at a cashier and getting a claim stub for payments.
   - Module 4 capacity and cloud (mem, server, scale, enlist, vm, cost, region): a fast-food branch. Cashiers = workers, the line = queue, opening more branches = scaling out, the guard directing people to counters = load balancer. Condo units for virtual machines. Buying a jeepney versus booking a Grab for CapEx versus OpEx. Bank branches in Manila and Cebu for regions.
   - Module 5 data (entity, card, rea, sql, txn, norm, query, shape): a class list in a spreadsheet and enlistment. Sari-sari store sale for REA. Last seat with two cashiers for transactions.
   - Module 6 (split): one cook versus a food court.
   - Module 2 (machine): use the per-panel suggestions in docs/audit-copy.md section 4.
   An analogy must be true to the mechanism. Say where it stops matching if that matters. One analogy per idea, reused, is better than many.
7. "Ask the room" becomes a `.ask` block labelled "Think first". It must be a question the student can attempt alone. It must not answer itself. Notes meant for the instructor ("Push them past...", "say this out loud", "what to listen for") go in an element with class `instructor`, which is hidden from students.
8. No panel numbers anywhere in text. Refer to other panels by name: 'see "HTTP verbs"'. Fix every wrong cross-reference listed in the copy audit. Module 2 referring to Module 1: 'the Module 1 site, "What a server holds"'.
9. Labels and captions: sentence case, no ALL CAPS typed in source, no cute voice. US spelling throughout.
10. Fix the bugs listed in docs/audit-copy.md section 5 that fall in your files (broken "the enlistment system" replacements, lowercase sentence starts, typos).
11. Keep the facts. Do not change numbers, technical claims, widget behaviour or data unless they are wrong. Do not add new widgets. Cut text that only adds tone. Shorter is fine.

## Markup rules for panel files
- Keep every id, class, data-* attribute and element that JS uses. If unsure, grep the js/ files before changing an element.
- Delete the `.eyebrow` line in each panel head.
- Remove `font-family:var(--mono)`, `letter-spacing` and `text-transform` from inline styles on labels (HTML and JS-generated). Monospace is for code, URLs, bytes and data values only. Do not add new inline styles.
- Sections. Long panels (list in docs/audit-structure.md A2, "firm" and "optional") are divided into sections. Wrap each section's content in
      <div class="sec" data-sec="short-slug" data-title="Section title">...</div>
  directly inside the `<section class="panel">`, after the `.head` block. Everything after `.head` must be inside some `.sec`. Slugs are lowercase words joined by hyphens, unique in the panel. Section titles follow the heading rules. Short panels get no `.sec` wrappers. The platform script turns `.sec` blocks into a tab strip with Previous/Next and shows one at a time. Do not write any tab or pager markup yourself. Each section should make sense on its own in a Canvas page: give it a one or two sentence opening.

## Check Your Understanding
One file per panel: lessons/<id>/cyu.json (id is the lesson id, e.g. "rest").
    {"panel":"rest","items":[
      {"id":"rest-1","sec":"verbs","type":"mc",
       "stem":"A student presses Submit twice on a payment form. Which request type makes the second press harmless?",
       "options":[
         {"text":"...", "correct":true,  "feedback":"Why this is right, in one or two sentences."},
         {"text":"...", "correct":false, "feedback":"Why this is wrong, and what idea it confuses."}]},
      {"id":"rest-2","sec":null,"type":"predict",
       "stem":"Before you try it: ... what will the table show?",
       "options":[...],
       "try":"Now do X in the widget above and compare."}]}
- `type`: "mc" (one correct), "multi" (several correct, say "Select all that apply" in the stem), "predict" (mc plus a `try` line pointing at a widget in that panel).
- `sec`: the data-sec slug the item belongs to, or null for the whole panel.
- 3 to 5 items per panel, at least one per section in sectioned panels. 3 or 4 options each. Every option has feedback. Wrong options are mistakes a business student would plausibly make. Test the outcomes in docs/audit-structure.md D2. Ask about situations and consequences, not definitions to recite. No trick wording, no "all of the above". Plain text only (no HTML) except `code` in backticks.
- Follow the writing rules. Breakouts panel gets no items.

## Look (owned by the design agent; others just avoid fighting it)
System fonts only. White page, one blue, orange only for request/change/warning. No uppercase letter-spaced labels. Monospace only for code. One hairline frame per widget, no boxes inside boxes. Body 17px, nothing under 14px. Prose lines at most about 70 characters.

## Verify before you report
Build to /tmp/<your-name>, run tools/check.py on it for your panels, and fix any console error. Open at least two of your panels with Playwright (executable_path='/usr/bin/google-chrome', args=['--no-sandbox']), screenshot, and look at them with the Read tool. Then grep your files for the banned patterns in rule 3.

Final report: under 20 lines. Files changed, anything you could not do, facts you doubted, and any change to ids/classes.

## Videos
Videos go on the Ateneo BUILD YouTube channel and are embedded through the "video" field of lessons/<id>/meta.json. The BUILD logo must be prominent in every video: on the opening card, as a persistent corner mark through the video, and on the end card. Videos are scripted from the final panel copy, so they are made after the rewrite is merged.

## Simplicity rules (round 2, overrides anything above that conflicts)
The owner's verdict on round 1: "still too complex and intimidating. Too many things going on in each page." A first screen held three paragraphs, a question, a framework switch, three dense cards, a trace and a 26-item rail. The rule now is one idea and one thing to do per screen.

A panel is a lesson. A lesson is a short run of steps shown one at a time.
- Lesson head: the h2 and one lede of at most 2 sentences and 35 words. Nothing else in `.head`.
- Every panel is divided into `.sec` steps (`<div class="sec" data-sec="slug" data-title="Short title">`), 3 to 5 of them. More than 5 means something moves to "More detail" or is cut.
- Step 1 is the everyday picture: the analogy in at most 60 words, one line or small picture mapping it to the technical terms, then the "Think first" question (one sentence, at most 30 words). No widget in step 1 unless the widget is the picture.
- Each later step: at most 70 words of visible prose, at most ONE widget, and one sentence saying what to do with it ("Press Play and watch where the request goes."). The prose comes before the widget. What the widget shows after use (its verdict text) is at most 2 sentences.
- At most 3 new terms per step. Mark each new term once as `<dfn title="plain definition in under 15 words">term</dfn>`.
- Depth goes in `<details class="more"><summary>More detail</summary>...</details>`, closed by default: second-order facts, framework variants (Django/Express/Laravel switches), tables of options, byte counts, edge cases, caveats, code listings, extra comparisons, cross-references. A student who never opens one must still meet the lesson's three outcomes (docs/audit-structure.md D2). When in doubt, it goes in More detail. Cutting is allowed when the text only repeats.
- Inside widgets: card text at most 20 words per card; secondary rows ("Runs on", "You write", "In practice", "Stack") go inside More detail or appear only when the card is active. Secondary controls that a business student does not need to meet the outcomes are moved into More detail or removed from view.
- Questions: at most one Check Your Understanding item at the end of a step (set its "sec"); the remaining items (sec null) form the final step, which the platform adds itself, titled "Check your understanding". Keep 3 to 4 items per lesson in total.
- Keep widgets working and keep ids. Moving a widget's secondary control into a `<details>` is fine; test that the widget still initialises when the details is closed.
- Plain words on buttons and step titles ("See the three tiers", "Follow one request", "Check your understanding").
