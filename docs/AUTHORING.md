# Writing a lesson

A lesson is one folder, `lessons/<id>/`. It builds into one page, `lessons/<id>.html`, that works alone, inside a course and in Canvas. This file is the full recipe. `docs/CONVERSION-RECIPE.md` has a worked example (tiers) and the icon table. `docs/ART-STYLE.md` has the picture rules.

## Quick path

    python3 tools/new_lesson.py ID --area web --title "Heading of the lesson" --label "Short rail label"
    (edit lessons/ID/lesson.html, lesson.js, cyu.json, meta.json)
    python3 build.py
    python3 tools/check.py . ID
    open lessons/ID.html

`new_lesson.py` makes the four files with comments and lists the lesson in `courses/library.json`. To put it in a course, add its id to a group in `courses/<course>.json`.

## The four files

| File | Content |
|---|---|
| `lesson.html` | One `<section class="panel" id="p-ID">`. A `.head`, then 3 to 5 `<div class="sec" data-sec="slug" data-title="Title">` steps. |
| `lesson.js` | The widget code. Plain script, no modules. It runs on the page after the libs it needs. |
| `cyu.json` | `{"lesson":"ID","items":[...]}`. 3 to 4 questions. |
| `meta.json` | `id`, `title`, `label` (rail text), `desc` (under 12 words), `outcomes` (exactly 3), `tags`, `area`, `needs`, `video`. |

`id` is the folder name. It may use letters, digits, `-` and `_`, and it should say what the lesson is about. Generic ids such as `intro`, `next`, `math` and `loop` exist already. A new lesson in another library may clash with them, so prefer a specific id.

`area` is an area id from `courses/library.json`. `needs` lists the `lib/<name>.js` files the lesson uses. `video` is `null`, one slot or a list of slots (`sec`, `youtube`, `title`, `about`).

## Rules for the code

- A lesson page holds `lib/core.js`, the libs in `needs`, and this lesson's `lesson.js`. Nothing else. It cannot call another lesson's code.
- `lib/core.js` gives `$`, `$$`, `ICO`, `REDUCED`, `CSSV` and `PAGE_HOOKS`. It also handles the theme and text size.
- Code that two lessons use goes in `lib/<name>.js`. Both lessons name it in `needs`. Code that one lesson uses stays in that lesson's `lesson.js`.
- Top-level names are global to the page. Give yours a prefix so they cannot clash with a lib.
- `PAGE_HOOKS.show = () => {...}` runs when the lesson, a step or a More detail becomes visible. Measure layout and size canvases there.
- `PAGE_HOOKS.redraw = () => {...}` runs after a theme change. Repaint canvases there.
- Keyboard shortcuts act inside the lesson only. A shortcut that acts on a widget first tests that the widget's step is showing. No shortcut jumps to another lesson.
- Every widget must start and work with the lesson page alone. Do not read state that another lesson sets.
- Do not mention a course, a module number or a week. Write `<span data-var="project">project</span>` where the text names the final project, so each course can fill in its own words. In questions and step titles write `{{project}}`.
- Link to another lesson with an `a` element that has a `data-lesson` attribute holding the lesson id, with the lesson title as the link text. Add `data-step="slug"` for a step. The platform fills in the address and keeps the course. `build.py` stops if the id does not exist. Put cross-references inside More detail or the last step.
- From JavaScript, write the same markup into `innerHTML`. Do not use `textContent` for text that holds a link.
- Page size: each built page stays well under 300 KB without pictures. No libraries from a CDN. The page must work from `file://` with no network.

## Rules for the writing

1. Short declarative sentences in ordinary spoken English. Would a lecturer say it out loud?
2. Headings name the topic like a textbook section. No verdicts, jokes or full-sentence claims.
3. No contrast framing ("not X but Y", "rather than", "instead of"), no antithesis pairs, no cleft sentences ("What X does is"), no em dashes, no rhetorical questions that answer themselves.
4. Explain each technical term once, in one plain clause, as `<dfn title="definition under 15 words">term</dfn>`. At most 3 per step.
5. Assume no programming experience. Where code appears, say in one line what it does.
6. US spelling. Sentence case for labels. No ALL CAPS typed in the source.
7. Keep every number consistent between the text, the widget and the questions. Teaching figures say so where it matters.
8. Plain words on buttons and step titles: "See the three tiers", "Follow one request".

## Shape of a lesson

- Head: the h2 and one lede of at most 2 sentences and 35 words.
- Step 1 is the analogy. Open with an everyday situation in 1 to 3 sentences (at most 60 words), then name the technical idea. Add a `.scene` that maps roles to terms, with `data-art="slug"` and `data-art-desc="one sentence"` for the picture. End with a `.ask` "Think first" question of at most 30 words that the student can try alone and that does not answer itself. No widget in step 1.
- Each later step: at most 70 words, at most one widget, and one sentence that says what to do with the widget, placed before it. 3 to 5 authored steps.
- Depth goes in `<details class="more"><summary>More detail</summary>...</details>`, closed. Controls that the script reaches by id may sit inside it, and the widget must start with it closed.
- The platform adds the last step, "Check your understanding" (slug `check`), with the key terms and the questions. Do not write it.
- Step slugs are lowercase words joined by hyphens, unique in the lesson. A slug is part of the address (`lessons/ID.html#slug`) and of old links, so do not rename one that is published.
- Anything visible must make sense for a student who opened only this lesson.

## Rules for the questions

- 3 to 4 items. Types: `mc` (one correct), `multi` (several correct; the stem says "Select all that apply"), `predict` (a prediction, then a `try` line that names what to do in the widget).
- `sec` is a step slug, or `null` for the last step. At most one item per step has its own `sec`.
- 3 or 4 options. Every option has `feedback`. Wrong options are mistakes a business student would make.
- Each item can be answered from the lesson text and widgets without opening More detail.
- The questions test the three outcomes in `meta.json`. Backticks in text become code. Do not write "above" or "before you try it", because the question may sit away from the widget.
- Use `{{project}}` where a question names the final project.

## Icons and pictures

- Icons are Phosphor regular, in `shared/icons/<name>.svg`. Write `<svg class="ico big" aria-hidden="true"><use href="#i-NAME"/></svg>` in HTML or `ICO("name","big")` in JS. To add one, copy it from `@phosphor-icons/core/assets/regular/` into `shared/icons/`.
- The same role keeps the same icon in every lesson (see the table in `docs/CONVERSION-RECIPE.md`).
- Blue (`--res`) and orange (`--req`) mean response and request only. Do not use them as decoration.
- Pictures: `python3 tools/make_art.py --dry-run` lists scenes. A scene without a picture keeps its icon row. The same slug in two lessons carries the same description.
- `tools/new_lesson.py` also edits `courses/library.json` to add the new lesson to its area. Two authors must not run it at the same time, because the second write can drop the first one's entry. Run it one at a time and check `library.json` afterwards.
- No font-family, letter-spacing or text-transform in inline styles. No new inline styles.

## Shared widget components

`shared/widgets.css` defines the pieces that interactive steps share. A widget root carries `class="card wg"`. The panel itself must stay `<section class="panel" id="p-ID">`, so put `wg` on the widget, not the panel.

| Class | Use |
|---|---|
| `card wg` | the widget box, with 44 px controls inside |
| `.meter` with `.g`, `.gl`, `.gv` | the row of counters (label above, number below); show "None yet" before there is a value |
| `.verdict` with `.ok`, `.warn`, `.bad` | the result box; the first `<b>` gets a check, warning or cross icon, so right and wrong never rely on colour |
| `.is-right`, `.is-wrong` | a short inline result such as Pass or Fail, with icon and text |
| `.wline`, `.wline.strong` | the one status line above or below a widget |
| `.wopts` with `.wopt` | full-width choices; states `sel`, `right`, `tried`, `wait` |
| `.wchips` with `.wchip` | small draggable or selectable cards; same states |
| `.wlist` with `.wrow` | a bordered list of rows or steps; states `on`, `right`, `wrong` |
| `.wno` | the shake for a refused move (off under reduced motion) |
| `.ctrls`, `.btn`, `.btn.primary` | buttons: Reset, Check, Run, Next |

A lesson that needs more CSS puts it in `lessons/<id>/lesson.css`. `build.py` adds it to the page after the shared styles. Do not write `<style>` blocks in `lesson.html` and do not inject styles from `lesson.js`.

## Courses

`courses/<course>.json` holds `id` (the file name), `code`, `title`, `org`, `vars` (for example `{"project":"capstone project"}`) and `homes`. Each home is a page: `file`, `title`, `subtitle`, `kicker`, `intro`, `links` (to another home with `home`, or an outside page with `href`) and `groups` (a `label` and a list of lesson ids). A lesson can sit in one home of a course only. Home file names must be unique across courses. The course's lesson list, Next lesson button and visited ticks follow the order of the groups.

`courses/library.json` lists the areas of the library page and the order of lessons in each. Without a course, "Next lesson" follows that order inside the area.

## Checklist

1. `python3 build.py` finishes with no message from the validator and the page is under 300 KB.
2. `python3 tools/check.py . ID --embed` reports 0 problems. It opens the lesson alone, with a course, over http and in the Canvas view, and clicks every control.
3. Open `lessons/ID.html` from the file system. Open it with `?c=<course>` and with `?embed=1`.
4. Every widget works after a reload on step 3, and in the dark theme.
5. The first screen of each step is short. No step has more than one widget.
6. Every term is explained once. Every number matches between text, widget and questions.
7. No course name, module number, week number or "capstone" in the lesson. Cross-references are links.
8. Tab through the lesson with the keyboard. Every control has a visible focus ring and a name.
9. 390 px wide: nothing scrolls sideways and touch targets are at least 44 px.
10. The lesson is in `courses/library.json`, and `meta.json` has 3 outcomes written as "Say", "Name", "Explain" or "Predict" statements a student could prove.
