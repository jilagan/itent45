# Design audit: itent45 index.html (Module 1) and machine.html (Module 2)

Read-only. Nothing under /home/claude/itent45 was edited. Screenshots are in /home/claude/audit/shots/, named `<site>-<panel>-<d|m>-<light|dark>.png` (d = 1440x900, m = 390x800; `-fold` = first viewport only). Raw measurements: /home/claude/audit/measure.json and sizes.json. Scripts: shoot.py, measure.py, mfold.py.
Shot coverage: index basics, tiers, rest, pay, scale, vm, split, server, sql, break; machine intro, next, deep, vectors, vibe, math, attn, tokens. Each in both viewports and both themes (90 images), plus mfold shots.

## 0. Headline findings

1. The mobile layout is broken. There is no rail collapse. The 210px rail stays beside the content at 390px, so the content column is about 180px wide. The h2 wraps one word per line (index-mfold0.png, index-mfold1.png). Many widgets are wider than the panel and spill out (see 3).
2. Real bugs: a raw `’` shown in a label, and raw `<code>` tags shown in the Tiers trace step. See 5.
3. The look comes from one system repeated everywhere: tiny uppercase letter-spaced mono labels over everything, rounded 1px boxes, a tinted "ask the room" bar, and an orange/indigo pair on cool off-white. Remove the labels and boxes and most of the AI look goes.
4. Prose is small and wide. Real body text is 13 to 15px. Paragraphs inside cards run 1100px wide at 14.5px, about 150 characters per line. About 20% of all text on a typical panel is under 12px, and 14% is under 11px.

## 1. AI-look tics, with counts

Counts are from src/index/style.css (I) and src/machine/style.css (M), plus panel HTML and app.js.

| Tic | Index | Machine | Where to see it |
|---|---|---|---|
| `letter-spacing` declarations | 78 | 22 | every shot |
| `text-transform:uppercase` rules | 36 | 13 | every shot |
| Rules that are mono + uppercase + letter-spaced all at once | 36 | 12 | index-tiers-d-light-fold.png ("01 — ORIENTATION", "STACK", "TIER 1", "STEP 1 OF 12") |
| `border-radius` declarations | 148 | 36 | index-rest-d-light.png |
| `border:1px solid` rules | 114 | 30 | same |
| `box-shadow` / `gradient` | 14 / 3 | 0 / 0 | |
| `font-family` declarations (mono: 157 of 162 in I; 40 of 42 in M) | 162 | 42 | |
| font-size below .7em (under 11.9px at 17px base) | 112 of 253 | 22 of 59 | |
| font-size .55 to .62em (9.4 to 10.5px) | about 70 | about 12 | nav numbers, card titles, eyebrows |
| Inline `style="` in panel HTML | 315 | 222 | mostly `margin-top` (148 / 115) and `color` (37 / 59) |
| Inline `style="` in app.js templates | 50 | 52 | |
| Orange (`--req`) / blue (`--res`) accent pair | all panels | all panels | |
| Eyebrow with number prefix ("05 — Verbs & REST") | 26 of 29 panels | 17 of 17 | |
| `.card-t` uppercase mono card titles | 104 uses | 46 | |
| "Ask the room" tinted callout with left border | 25 | 17 | every panel head |
| `.whynot` boxed callout (colored border, tint) | 25 | 40 | machine-vectors-d-dark.png has five stacked |
| Left-border bars (`border-left:2-3px`) | 4 (+nav, ask, 16 total declarations) | 3 (12 total) | nav selected state, `.ask` |
| Pill/segmented toggles (`.toggles`, `.tg`, `.btn`) | 14 groups | 4 groups | index-tiers "STACK" row |
| Number prefix on every nav item (`.num` "00" to "25") above the label | 27 | 17 | rail |
| Dot bullets before links ("● Module 2 tool", "● Get the code") | 2 | 2 | rail bottom |
| Hardcoded hex colors / rgba | 45 / 75 | 44 / 28 | |

Fonts: IBM Plex Sans for body and IBM Plex Mono for roughly 18 to 28% of all visible characters per panel (index-server is 56% mono). Plex Sans plus Plex Mono is the most common pairing in AI-generated technical pages. Mono is used for labels, nav numbers, table cells and pill text, not just code.

Palette: light theme is white and #F6F6FA with ink #0A0A14, headings in indigo #10069F, accent orange #C2410C. The dark theme is slate-navy (#0D141C) with amber #FFA23A and teal #3FD0C9. Both are the stock "dark dashboard with amber and teal" and "indigo plus orange on cool white" looks.

Box structure: panel > `.card` (1px border, 9px radius, 20px padding) > inner `.ibox`/`.srv`/`.g` boxes (1px border, 5 to 8px radius) > mono pills. Measured nesting of bordered rounded boxes is up to 2 levels deep, and a panel contains 13 to 88 bordered rounded boxes (index-rest: 88, index-vm: 56, index-basics: 38). Radius values are a mix of 3, 4, 5, 6, 7, 8, 9px with no scale (index: 8px x30, 7px x26, 4px x20, 5px x16, 6px x15, 3px x15).

Other tics: every panel head is the same stack (eyebrow, h2, dim paragraph, tinted "Ask the room" bar, hairline). The `<h2>` in light theme is indigo, the section "heads" are uppercase mono, and the card titles in light theme are also indigo, so blue shows up on about every label.

## 2. Readability

Measured with Playwright at 1440x900 (computed styles of visible text).

- Base is 17px, but body copy is set at .8 to .88em, so real sizes are: panel intro 14.96px, in-card paragraphs 13 to 14.5px, descriptions 12 to 13px, labels 9.4 to 11px. Pixel histogram for index-rest (characters by px size): 9px 57, 10px 482, 11px 811, 12px 1185, 13px 3024, 14px 3080, 15px 257. Machine-math: 13px 1093, 14px 2382, 15px 388.
- Text under 12px: 7 to 31% by panel (index-scale 31%, index-vm 30%, index-sql 27%, index-basics 24%). Under 11px: up to 29%. This is for a projector as well as for phones.
- Line length: `.head p` is capped at 74ch (fine, 664px). Section paragraphs below it are not capped. Measured 1102px wide at 14.45px, about 150 characters per line (index-rest-d-light.png, "Three rows in a database..." and "The verb says what you wanted..."). The comfortable range is 60 to 80.
- Contrast, computed (WCAG ratio):
  - light --dim #3F3F4D on white 10.4; light --faint #63616F on #F6F6FA 5.6 (passes, but used at 9 to 10px).
  - light accent #C2410C on white 5.2; on the tinted ask bar 4.6 (passes for normal text, barely).
  - light --req-soft #F0B78E on white 1.8 (fails, wherever it is used for text or thin strokes).
  - dark --dim #9CB0C1 on #0D141C 8.3; dark --faint #93A7B9 on panel 6.4; amber on bg 9.2; teal on bg 9.8. All pass.
  - Dark --link #1364C4 on #0D141C 3.2 (fails if used as text).
  - Borders: dark --line2 on bg 2.2; light --line2 on white 1.7, light --line 1.3. Input fields and unselected cards are outlined with these, so fields are hard to see in light theme (index-rest-m-light.png form fields, index-scale-d-light.png sliders).
- Chrome before content, at 1440x900: left rail is 245px (17% of width, 26 items, 2 footer links, size and theme buttons). The panel head (eyebrow, h2, intro, ask bar, hairline) ends at y=187 to 379 (median about 267 of 900), so about 30% of the first screen is header before any widget (index-tiers-d-light-fold.png: head ends at 267; machine-vectors: 379). A second label+intro block ("FIRE A REQUEST AT A REAL TABLE...") precedes the first widget again.
- Density: 13 to 88 bordered boxes per panel. A typical panel has 2,000 to 9,000 characters of text, with widgets and text boxes at the same visual weight, so nothing is the main thing.
- Long panels at 1440 wide: index 05-rest 5046px (about 5.6 screens), basics 2974, vm 2801, pay 2431, scale 2096, split 2083; machine math 2678, vectors 2395, deep 2389. On a 390px phone the same panels are 14909 (rest), 8906 (basics), 8524 (machine deep), 8340 (split), 7858 (pay) and 7795 (math) pixels. 05-rest contains about 9 separate sections in one tab (verbs table, verb cards, "GET what it promises", verb-by-URL matrix, status codes, two mistakes, N+1 comparison, scroll comparison, closing callouts). Each could be its own panel or at least have an in-panel contents list. There is no in-panel navigation, no sticky heading, and no "back to top".
- Tabs: 26 and 17 tabs, with module group headings in the rail. Only one scrolls (the stage), the rail is `height:100vh` and `overflow:hidden`, so a short laptop (700px) clips the lower rail; the rail nav scrolls internally.
- Zoom: A- A+ buttons are 27px square (below 44px) and the Dark button is wider than its box and its text overlaps the border (index-tiers-d-light-fold.png bottom left: "Dar|k"). It is at the very bottom of the rail where it is hard to find.

## 3. Mobile (390x800)

- The rail does not collapse. There is no `@media` for `.rig` or `.rail` in either stylesheet (26 media queries exist, all collapse widget grids at 760 to 1020px). At 390px the rail is still `clamp(210px,17vw,260px)` = 210px, and the 100vh grid with `overflow:hidden` means the stage is 180px wide. The h2 "A web app is three programs on different machines, passing messages" takes 9 lines. Intro text is 20 words per screen (index-mfold0.png).
- Because of the 180px column, widgets that have fixed or intrinsic width overflow the panel. Measured right edges beyond the 390px viewport: index-rest `.dbwrap`/`table.db` to 713px, machine-math `.scatter` svg/`.card`/`.sliders` to 525px. The full-page captures (index-rest-m-light.png is 735px wide) show the clipping: the courses table extends right of the card, and JSON text runs past its box. The content is reachable only by horizontal scroll inside the stage.
- Tap targets (buttons, links, inputs, `.btn`): below 44px in 7 of 10 (tiers), 8 of 10 (pay), 8 of 15 (scale), 7 of 18 (vm), 17 of 49 (rest), 3 of 3 (machine math), 4 of 4 (tokens). `.btn` is 9px padding at .79em, so about 38px high. Zoom buttons 27px. Verb pill buttons in index-rest are about 30px. Several are 3px high (hidden or `display` toggled), which my measure counted as small; real misses are the visible ones.
- No tap highlight or `touch-action` handling for the sliders and draggable graphs was checked. I did not test drag on touch.
- The theme and zoom controls are in the rail footer and are visible only after scrolling the 26-item rail, since the rail fits 800px only partly (shot: index-mfold0.png shows "SIZE A- A+ Dark" cut off at the bottom).

## 4. Dark theme defects

Dark is the stylesheet base and light is a ~11 to 12 rule override block at the end of each file (`html[data-theme="light"]`), so the two are not designed to match; light is a patch.

- Index default theme is light (`data-theme="light"` on `<html>`), but the comment in app.js says dark reads better on a projector.
- Dark callouts: `.whynot` and `.ask` use amber/teal tinted rgba backgrounds. Several stacked teal-bordered boxes with teal uppercase labels (machine-vectors-d-dark.png) read as a wall of the same box. Red "verdict" boxes (0.31, and yet 5 words in common; BOTTLENECK) are the only variation.
- Dark `--link:#1364C4` has 3.2:1 on the background.
- Dark `--line2` outlines (2.2:1) make input fields, slider tracks and unselected options nearly invisible against `--panel` (index-scale-d-dark.png "Moves available" list).
- SVG label overlap in dark vectors: "man", "king" and "result" labels sit on top of their dots and of the strike-through (machine-vectors-d-dark.png, top map, labels `man`, `king`, `result` collide).
- Amber used for both primary buttons ("Send traffic") and warning text ("Runs out." in index-scale option card) so action and caution share a colour.
- Canvas drawings use `CSSV()` and repaint on theme change, but hardcode `"600 9px 'IBM Plex Mono'"` for labels (4 places in index app.js): 9px text on canvas.
- Light-theme-only overrides mean new components added to dark will not get a light style unless someone adds a rule.

## 5. Layout bugs seen in screenshots

1. Raw escape shown: `src/index/panels/19-scale.html:116`, label reads "Machines (each a copy of panel 18’s box)". HTML does not decode `’`. Use `&rsquo;` or a literal apostrophe. Visible in index-scale-d-dark.png (slider label, uppercased as "18\U2019S BOX"). This is the only literal `\uXXXX` in the panel HTML.
2. Raw tags shown: the Tiers trace step text is set with `textContent` (`src/index/app.js:841`, `$("#trText").textContent=s.x`), but the string contains `<code>/my-courses</code>` (line 580). The page shows "The page at <code>/my-courses</code> is already open" (index-tiers-d-light-fold.png). Same line 586 style strings may be affected for other steps. Fix: use innerHTML for this one element (content is author-controlled).
3. Animated ball overlaps body text in Tiers ("do not control it an●cannot trust": the orange ball is drawn over the sentence, index-tiers-d-light-fold.png at about x=437,y=505).
4. Theme button overflow: "Dark" label exceeds its 27px box in the rail footer (all desktop shots, bottom left).
5. Empty space: in index-rest, the left "Courses" card stretches to the height of the right column and leaves about 700px blank (index-rest-d-dark.png). Same in index-scale-d-dark.png (the load balancer card has about 220px blank, then the bottleneck diagram has 100px). In index-vm-d-light.png, the "One physical machine, sliced" card has about 150px blank below its callout and the provisioning card has about 100px blank. Grid `align-items:stretch` default.
6. Broken inline bold in `.whynot`: `.whynot b` is styled as an uppercase label, so a bold word inside a sentence becomes a label on its own line. machine-math-d-light.png: "A / MATRIX / is a stack of vectors" in the "Where you have met it" box. Same class turns `<b>` in running text into headings.
7. Canvas text overlapping the curve in machine-math calculus chart: "how wrong it is" label sits on the parabola (machine-math-d-light.png, upper-left of curve). Axis label "the number you control →" touches the baseline.
8. Space oddity: "ITENT  45" shows a double space in the rest panel table (cell id text is mono and the code string is "ITENT 45" with preserved whitespace).
9. Index `clients` panel text shows literal `<ul>`, `<tr>`, `&middot;` (checked by scan). These are probably code samples that are meant to show tags; verify. The `tiers` one is the real bug.
10. Mobile: items in section 3.

## 6. Redesign direction

Goal: a course site that a lecturer made, not a product dashboard. Calm, book-like, one accent, text first, widgets as plain figures.

### 6.1 Concept
- Treat each panel as a page of a handout: one heading, ordinary paragraphs at 18px, figures that sit in the flow with a thin caption. No "card" around prose. The interactive widget gets one hairline frame (or none), not a box inside a box.
- Light theme is the designed one; dark is a straight inversion using the same variable names. Default to light, remember the choice in `localStorage`, and also respect `prefers-color-scheme` on first visit. Put the theme toggle in the top bar, not the rail footer.
- Navigation: a top bar on phones (title, "Contents" button) and a slim left list on desktop (240px, 15px type, no numbers above labels; number inline, same size, in normal text weight, "5  Verbs and REST"). Group headings as small normal-case semi-bold text, not uppercase mono.

### 6.2 Type (fall back offline)
Pick a serif for reading and a plain sans for UI. Both load from Google Fonts with a system fallback, so they degrade without breaking layout.

```css
--serif: "Source Serif 4", "Charter", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
--sans:  "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--mono:  ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, "Liberation Mono", monospace;
```
Rationale: Source Serif 4 (Google Fonts) for body and headings gives it a textbook look; Charter/Georgia/Palatino come installed on Mac, Windows, and Linux, so offline fallback is close in width. Inter, or just system-ui, for buttons, labels and tables. Mono is only for code and for values in code-like widgets (HTTP text, SQL, JSON), with no Plex Mono import (use the system mono). Drop the Plex import entirely; it removes two font requests.

Alternative with no web fonts at all: body `Georgia` + UI `system-ui`. This works anywhere.

### 6.3 Type scale (rem, root 100% = 16px)
```
--fs-body:  1.125rem;   /* 18px  prose */
--fs-ui:    0.9375rem;  /* 15px  buttons, table cells, nav, captions */
--fs-small: 0.875rem;   /* 14px  smallest allowed anywhere, incl. canvas/SVG text */
--fs-h3:    1.25rem;    /* 20px */
--fs-h2:    1.75rem;    /* 28px panel title; clamp(1.5rem, 4.5vw, 2rem) */
--lh-body:  1.6;  --lh-tight: 1.25;
--measure:  66ch;       /* max width for prose */
```
No size under 14px. Zoom control (A- A+) can stay but should scale `html{font-size}` and not a `--scale` multiplier on a 17px base.

### 6.4 Palette (restrained; one blue, one warm signal)
Light:
```css
--bg:#FBFAF7;     /* warm paper, not cool grey-white */
--bg2:#F3F1EC;    /* rail, code blocks */
--panel:#FFFFFF;  /* widget surface only */
--panel2:#F3F1EC;
--ink:#1B1B1F;    /* text, 16:1 */
--ink2:#2E2E34;
--dim:#4A4A52;    /* secondary, 8.5:1 */
--dim2:#5A5A63;   /* 6.6:1 */
--faint:#6B6B73;  /* 5:1, never below 14px */
--line:#D9D5CC;   /* hairlines on paper, 1.4:1 is OK for rules */
--line2:#8F8B82;  /* controls, inputs, 3.3:1 (WCAG 1.4.11) */
--line3:#B5B1A8;
--res:#0B4A8F;    /* the main blue, a university-ish blue but not #003A6C and no logo; 8.9:1 on --bg */
--res-deep:#083A72;
--req:#B4491B;    /* burnt orange, used only for "request / change / warning" meaning, 5.1:1 */
--req-soft:#E9C2AA; --req-deep:#8E3912; --req-edge:#6F2C0E;
--warn:#A3161E;
--link:#0B4A8F;
--sink:#F7F5F0; --grid:#E8E4DA; --land:#ECE8DF;
```
Dark (same names; keep it warm-neutral, not navy):
```css
--bg:#16171A; --bg2:#1D1F23; --panel:#202228; --panel2:#272A30;
--ink:#ECEAE4; --ink2:#D8D5CD; --dim:#B3B0A8; --dim2:#A09D95; --faint:#8F8C85;
--line:#34363C; --line2:#7C7A74; --line3:#4A4C52;
--res:#7DB2EA; --res-deep:#5E98D6;
--req:#E8925E; --req-soft:#F2B896; --req-deep:#C97544; --req-edge:#A55E33;
--warn:#FF8A8A; --link:#8CBBEF;
--sink:#121316; --grid:#272A30; --land:#25272C;
```
Check after applying: --line2 against --bg is at least 3:1 for control outlines; --faint at least 4.5:1.
Rules for colour: blue is the only brand colour (links, h2 optional, selected state, "response" in the diagrams). Orange appears only where it means something: request direction, a changed value, a warning. Body text, card titles and labels are ink or dim, never blue or orange. Delete the teal.

Ateneo blue is #003A6C family. `--res:#0B4A8F` is a similar blue in spirit but lighter; do not use the seal, wordmark or the university's gold/navy header pattern.

### 6.5 Labels, callouts, frames
- Section label (`.card-t`, `.eyebrow`, `.navgrp`, `.artlbl`, `.ft`, etc.): sentence case, sans, 14 to 15px, weight 600, colour `--dim`, `letter-spacing:0`, `text-transform:none`. No mono. One rule for all of them.
- Eyebrow above h2: delete. Put the panel number in the nav and keep h2 plain. If a number is needed, "5. Verbs and REST" in the h2.
- "Ask the room": a plain paragraph with a bold lead-in "Ask the room." and a hairline above and below, no tint, no left bar. Or a `<aside>` with 3px top border in `--line2`. Same treatment for `.whynot`, `.wexp`, `.verdict` notes: no coloured borders, no tinted fills, no uppercase title. Use a bold sentence start and `--bg2` fill at most once per panel. Reserve a red/orange border only for a real error state in a widget (e.g., BOTTLENECK).
- Callout structure rule: callouts are never stacked more than 2 in a row; if three in a row, merge into prose or a list.
- Widget frame: one 1px `--line` border, 6px radius, `--panel` fill, 16px padding. Nothing bordered inside the frame except inputs and buttons. Inner groups are separated by space or a hairline, not by a box. Replace `.ibox`, `.srv`, `.g`, `.tbox` nested borders with 12px gaps and text rows.
- Radius: only 3 values: 4px (inputs, buttons, chips), 6px (widget frames), 50% (dots). Delete 3, 5, 7, 8, 9px.
- Shadows and gradients: none.
- Buttons: 40px min height on desktop, 44px on touch (`@media (pointer:coarse)`), 15px sans, 4px radius. Primary = solid `--res`, white text. Secondary = 1px `--line2`. No uppercase.
- Toggles/pills: render as an ordinary segmented control or underlined text tabs. Sans, 15px, selected = bold + 2px underline in `--res`. Not mono, not uppercase, no pill outline per item.
- Tables: no outer box, rules only (`border-bottom:1px solid var(--line)`), header row bold sans 14px.
- Code: `--bg2` fill, 4px radius, system mono at 0.9em, no border.
- Links: underlined, `--link`. Remove dot bullets on rail links ("● Module 2 tool" becomes "Next: Module 2 (machine.html)").

### 6.6 Spacing scale
`--s1:4px; --s2:8px; --s3:12px; --s4:16px; --s5:24px; --s6:32px; --s7:48px; --s8:72px;`
- Paragraph gap `--s4`; between sections `--s7`; page top padding `--s6`; widget internal padding `--s4`.
- Panel max width: 1100px for the figure area, 66ch for prose; prose is left-aligned with the figure, not centred.
- Replace the 148 + 115 inline `margin-top:` values with 3 utility classes (`.mt1/.mt2/.mt3` = s3/s4/s5), or with `* + *` spacing in `.panel`.

### 6.7 Delete list
Eyebrows on all 29 and 17 panels; the "00/01" nav number line; `.navgrp` uppercase; the `.kicker`; the org line in the brand block (put it in a footer); the "Module 2 tool" and "Get the code" rail footer items (move to a footer line on the page); all `text-transform:uppercase` (49 rules); all `letter-spacing` except `-.01em` on h2 (100 declarations); mono on labels (about 190 `font-family:var(--mono)` uses outside code); tinted backgrounds on `.ask`/`.whynot`; coloured card borders; teal accent; the `fade` animation on panel switch (translateY 6px); 9 to 11px sizes (about 134 declarations under .7em); `box-shadow` (14); gradients (3); second-level bordered boxes; stacked callouts at panel bottoms where the same point is already made in the intro.
Panel structure to prune: split 05-rest into 2 to 3 tabs ("Verbs", "Status codes", "How much to return") or add a mini contents at the top with anchor links.

### 6.8 Rules of thumb for the restyle (for other agents)
1. Prose is 18px serif at `--measure` (66ch) and `line-height:1.6`. No text anywhere under 14px, including SVG and canvas labels.
2. Labels are sentence-case sans, weight 600, same size as UI text. No uppercase, no letter-spacing, no mono except for code and code-like values.
3. One bordered frame per widget. No box inside a box. Separate with space or a hairline.
4. Three radii only: 4, 6, 50%. No shadows, no gradients.
5. Blue is the single brand colour. Orange only means request, change or warning. No teal. Text is ink/dim, never coloured, except links and the selected nav item.
6. Callouts: plain paragraph with bold lead-in, hairline above and below. At most one filled callout per panel, never two adjacent.
7. Do not fill space. Grids use `align-items:start`, so cards are as tall as their content (fixes the blank 150 to 700px areas).
8. Every control has a 44px hit area on touch (`min-height:44px` under `pointer:coarse`); outlines are 3:1 against the surface.
9. Under 700px the rail becomes a top bar with a Contents button, and every widget grid is one column; nothing may be wider than 100vw (`min-width:0` on grid children, `overflow-x:auto` on tables and code blocks only).
10. Panel head is: h2, one intro paragraph, optional one-line "Ask the room". No eyebrow, no number line, no hairline pair.

### 6.9 What JS reads, so these names must stay
- `CSSV("--name")` (cached in `CSSV.cache`, cleared on theme change) is called in index app.js for: `--bg`, `--dim`, `--faint` (x3), `--line`, `--line2`, `--req` (x2), `--res`. The machine file defines the same `CSSV` and clears the cache on theme change; the names above should be treated as the minimum set for both.
- Inline strings built in app.js use `var(--x)` directly (counts, index / machine): `--res` 24/38, `--faint` 22/26, `--req` 18/48, `--warn` 15/18, `--line2` 8/16, `--ink` 6/6, `--line3` 5/10, `--dim2` 4/0, `--dim` 4/4, `--sans` 2/2, `--mono` 2/6, `--panel2` 2/4, `--link` 2/0, `--grid` 2/0, `--req-soft` 1/0, `--panel` 1/0, `--line` 1/2, `--land` 1/0, `--bg` 1/1.
  Keep all of these variable names: --bg --bg2 --panel --panel2 --line --line2 --line3 --ink --ink2 --dim --dim2 --faint --req --req-soft --req-deep --req-edge --res --res-deep --warn --link --sink --grid --land --mono --sans --scale.
- Because canvases use `CSSV` and SVG uses `var()`, changing a value is safe, renaming is not. Canvas label font is hardcoded `'IBM Plex Mono'` in 4 places (index app.js, around line 2158); change to a system stack or `var(--mono)` read through `getComputedStyle`, and raise the 9px size to 12px or more.
- Class/attribute hooks that app.js depends on: `html[data-theme]`, `.panel.on`, `#nav button[aria-selected]`, `[data-p]`, `--scale` on `:root` (set by the A-/A+ buttons), `#thBtn`, `#zIn`, `#zOut`, and many `#id`s in panels. Do not rename or remove them. A new top bar for phones should keep the same `#nav` button elements.
- If `--scale` is kept, base size is `calc(17px * var(--scale))` now; `em` sizes derive from it. Switching to rem requires also changing the `.xx em` declarations (they are relative to `body`), so convert in one pass.

## 7. The 30 selectors that carry the look (most used, HTML + JS counts)

By class occurrence (index / machine): `.card-t` (104 / 46), `.card` (70 / 36), `.btn` (45 / 27), `.verdict` (36 / 20) and `.verdict b`, `.g` `.gl` `.gv` stat tiles (40 / 34 each), `.srv` (32 / 21), `.field` and `.field label` (32 / 10), `.val` (32 / 10), `.rtt-note` (32 / 21), `.head` (29 / 17), `.eyebrow` (29 / 17), `.num` and `.lbl` in `.nav button` (27 / 17), `.panel` (26 / 17), `.dot` (26 / 7), `.ask` and `.ask b` (25 / 17), `.whynot` and `.whynot b` (25 / 40), `.art` (23 / 15), `.sliders` (17 / 8), `.ctrls` (17 / 10), `.toggles` and `.tg` (14 / 4, 26 / 6), `.primary` (14 / 9), `.artlbl` (8 / ?), `.meter` (machine 14), `.c` and `.kw` `.s` (code highlight spans).

Structural selectors to restyle first:
1. `.rig` (grid, 100vh, overflow hidden)
2. `.rail`, `.brand`, `.brand .kicker`, `.brand .sub`, `.brand .org`
3. `.nav`, `.nav button`, `.nav button .num`, `.nav button .lbl`, `.nav button[aria-selected="true"]`, `.navgrp`
4. `.repolink`, `.rail-foot`, `.zoom button`
5. `.stage`, `.panel`, `.panel.on`
6. `.head`, `.head .eyebrow`, `.head h2`, `.head p`
7. `.ask`, `.ask b`, `.whynot`, `.whynot b`, `.wexp`
8. `.card`, `.card-t`
9. `.btn`, `.btn.primary`, `.ctrls`, `.toggles`, `.tg`
10. `.field`, `.field label`, `.sliders`, `.val`
11. `.g`, `.gl`, `.gv` (stat tiles), `.verdict`, `.verdict b`
12. `.srv`, `.art`, `.artlbl`, `.rtt-note`
13. `.dot`, `.c`, `.kw`, `.s` (code syntax)
14. `html[data-theme="light"]` block (lines ~1256 to 1280 index, ~1259 in machine; machine duplicates the same selectors)
15. Utility inline styles in panel HTML: `margin-top` (148 / 115), `color` (37 / 59), `grid-template-columns` (7 / 14), `background` (15 / 4).

Notes for the person doing the restyle: machine/style.css is a near copy of the index stylesheet (same class names, the machine file has no inline-style-heavy blocks like `.wexp`); editing both with one shared base file would stop them drifting. Build step is `python3 build.py`. Sizes in the stylesheets are in `em` multiplied from a 17px base, so a "smallest size 14px" rule needs a minimum of about .83em at scale 1.
