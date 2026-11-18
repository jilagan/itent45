# ITENT 45 structure and pedagogy audit

Read-only. Nothing under /home/claude/itent45 was edited. Working files are in /home/claude/audit/_structure (scripts and JSON).

Method: Playwright with /usr/bin/google-chrome, 1440x900 for the rendered heights, then the same pages with the rail hidden at 900 and 700 px wide to approximate a Canvas page. "px @900 embed" means rail hidden, rig height auto. Many layouts stack below about 940 to 1020 px, so panels are 20 to 60 percent taller at Canvas widths than at 1440. Pick iframe heights from the 900 or 700 column.

Note on the source tree: while this audit ran, src/index/app.js and src/machine/app.js were replaced by src/*/js/NN-name.js plus js-order.json (someone else's refactor). index.html and machine.html were rebuilt at 09:48 with identical byte sizes, so everything measured here is unchanged. The JS section-marker findings in E describe the old single app.js, which I read before it moved. The new js file prefixes also follow script order, not panel numbers (src/index/js/04-basics.js is panel 00, 18-txn.js is panel 13).

Counts: Module 1 has 26 panels (00 to 25), Module 2 has 17 (00 to 16).

---

## A. Should the long panels be split into sections?

Yes for 15 panels, optionally for 5 more, no for 23. The panels already share one pattern: `.head` (eyebrow, h2, intro, "Ask the room"), then repeating blocks of `.card-t` heading, optional `<p>`, one widget (`.srv`, `.card`, `.cmp`, `.art`), and a `.whynot` note. Natural section starts therefore already exist in the DOM. Several panels even contain a second `.head` in the middle (clients, pay) or numbered card titles (math "1 ... 2 ... 3"). A section is one `.card-t` through the last element before the next `.card-t` or `.head`.

How "widgets" and "prose words" were counted: a widget is a top-level child of the panel that holds buttons, sliders, canvas, or click targets (a tab strip that drives the next block counts with it). Prose words are the words in top-level children that hold no controls (head, card titles, notes, static cards, static diagrams). Rows with a single tab strip driving a static diagram (card, tokens) therefore show a small widget word count.

### A1. Every panel

Heights are the `.panel` element height in px.

| Module | Panel | px @1440 | px @900 embed | px @700 embed | Words (all) | Prose words | Widgets | Buttons+inputs | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| M1 | basics | 2974 | 3600 | 3856 | 1118 | 657 | 4 | 11 | split |
| M1 | tiers | 1094 | 1926 | 1963 | 476 | 272 | 2 | 10 | fine as is |
| M1 | layers | 1306 | 1999 | 2142 | 488 | 154 | 2 | 4 | fine as is |
| M1 | journey | 682 | 950 | 971 | 172 | 85 | 1 | 4 | fine as is |
| M1 | bytes | 1584 | 1794 | 1874 | 404 | 127 | 2 | 14 | split |
| M1 | rest | 5046 | 5827 | 6559 | 1621 | 889 | 6 | 55 | split |
| M1 | clients | 2803 | 3666 | 4078 | 963 | 726 | 2 | 6 | split |
| M1 | render | 1800 | 2404 | 2638 | 824 | 679 | 2 | 4 | split (optional) |
| M1 | pay | 2431 | 3681 | 3804 | 841 | 624 | 3 | 10 | split |
| M1 | entity | 972 | 1280 | 1343 | 361 | 210 | 1 | 30 | fine as is |
| M1 | card | 801 | 997 | 1165 | 312 | 303 | 1 | 3 | fine as is |
| M1 | rea | 3039 | 2915 | 2974 | 961 | 944 | 2 | 6 | split |
| M1 | sql | 1506 | 1834 | 1934 | 432 | 298 | 1 | 9 | fine, long; one idea per widget |
| M1 | txn | 1209 | 1448 | 1719 | 499 | 373 | 1 | 7 | fine as is |
| M1 | norm | 1232 | 1718 | 1760 | 399 | 298 | 1 | 4 | fine as is |
| M1 | query | 1195 | 1310 | 1387 | 386 | 244 | 1 | 4 | fine as is |
| M1 | shape | 1504 | 2239 | 2376 | 732 | 638 | 1 | 5 | fine, long; one idea per widget |
| M1 | mem | 1746 | 2122 | 2223 | 630 | 314 | 1 | 6 | split (optional) |
| M1 | server | 1361 | 1849 | 1963 | 324 | 228 | 1 | 7 | fine as is |
| M1 | scale | 2096 | 2628 | 2849 | 684 | 376 | 2 | 15 | split |
| M1 | enlist | 944 | 1322 | 1562 | 414 | 116 | 2 | 6 | fine as is |
| M1 | vm | 2801 | 3968 | 4101 | 868 | 549 | 4 | 18 | split |
| M1 | cost | 1445 | 1813 | 2016 | 531 | 407 | 1 | 3 | fine, long; one idea per widget |
| M1 | region | 2277 | 2315 | 2399 | 612 | 286 | 3 | 9 | split |
| M1 | split | 2083 | 2826 | 3119 | 1090 | 723 | 2 | 2 | split |
| M1 | break | 1160 | 1663 | 1773 | 487 | 230 | 1 | 9 | fine, but hide instructor card in embed |
| M2 | intro | 2063 | 2726 | 2730 | 584 | 410 | 1 | 8 | split |
| M2 | next | 1921 | 3096 | 3246 | 686 | 349 | 2 | 11 | split |
| M2 | learn | 1697 | 2138 | 2172 | 532 | 423 | 1 | 8 | split (optional) |
| M2 | train | 1366 | 1785 | 1774 | 392 | 198 | 1 | 4 | fine as is |
| M2 | deep | 2389 | 3079 | 3128 | 821 | 592 | 1 | 3 | split |
| M2 | backprop | 1440 | 1959 | 1961 | 506 | 299 | 1 | 3 | fine, long; one idea per widget |
| M2 | tokens | 995 | 1110 | 1174 | 307 | 303 | 1 | 4 | fine as is |
| M2 | embed | 1245 | 1866 | 1837 | 404 | 244 | 1 | 3 | fine as is |
| M2 | vectors | 2395 | 3243 | 3318 | 883 | 486 | 2 | 8 | split |
| M2 | rnn | 1124 | 1341 | 1400 | 398 | 182 | 1 | 5 | fine as is |
| M2 | attn | 1277 | 2115 | 2240 | 474 | 179 | 1 | 3 | fine, long; one idea per widget |
| M2 | ctx | 663 | 816 | 857 | 212 | 88 | 1 | 3 | fine as is |
| M2 | prompt | 1459 | 2295 | 2395 | 507 | 198 | 1 | 3 | fine, long; one idea per widget |
| M2 | loop | 1351 | 1852 | 1940 | 448 | 222 | 1 | 3 | fine as is |
| M2 | tools | 1607 | 1846 | 2171 | 582 | 404 | 1 | 5 | split (optional) |
| M2 | vibe | 1763 | 2052 | 2265 | 547 | 367 | 1 | 5 | split (optional) |
| M2 | math | 2678 | 3733 | 3766 | 889 | 395 | 3 | 3 | split |

Reading the table:
- Firm splits (15): basics, bytes, rest, clients, pay, rea, scale, vm, region, split (M1); intro, next, deep, vectors, math (M2).
- Optional splits (5): render, mem (M1); learn, tools, vibe (M2). They are 1.7k to 1.8k at 1440 and only need splitting if iframe height must stay near 1200.
- Fine as they are (23): tiers, layers, journey, entity, card, sql, txn, norm, query, shape, server, enlist, cost, break (M1); train, backprop, tokens, embed, rnn, attn, ctx, prompt, loop (M2). Each holds one idea and one widget. At 900 px some reach 1800 to 2300 px (layers, server, prompt, attn, shape) because the two-column widgets stack. For those, fix the iframe height at the 900 value and let the section scroll. Splitting would cut mid-argument.
- rest is the outlier: 5046 px at 1440, 6559 at 700. Its first widget (the request lab, `.srv` child 4) is 1398 px by itself, so no split can bring S1 under about 1800 px at Canvas width. A layout fix (table and request builder side by side) would help more than any split.
- The "Ask the room" box appears once per panel, always inside `.head`, always before the content it asks about. Sections 2 and up lose it, which is fine: each later section should open with its own short title instead.
- Sections that start on a non-heading element need a new visible title: rest S2 (`.verbs`), clients S1 and others starting at `.head`, rea S4 (`.srv`), deep S2 (`.whynot`).

### A2. Proposed sections for the long panels

"Starts at" gives the 1-based child position inside the panel `<section>`, so child 7 is `#p-basics > :nth-child(7)`. Column heights are the section height at 1440 / 900 / 700 px. Implementation: wrap each section's children in `<div class="sec" id="<panel>-<slug>" data-title="...">` in the panel partial. Every widget id stays unique, so app.js needs no change.

Slugs for URLs (see B): basics: server-is-a-job, address-and-reach, several-addresses, host-the-capstone. rest: request-lab, verb-promises, status-codes, naming-and-one-vs-fifty, lazy-loading. The full slug list is in the file /home/claude/audit/_structure/embed_h.py (SPLITS dict).

**M1 / basics**

| Section | Starts at (child of `#p-basics`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 A server is a job, not a machine | child 1, `.head` (panel opens here) | 799 | 949 | 1041 |
| S2 Reading an address, and who can reach what | child 7, `.card-t`: How Anything Finds It: Reading An  | 846 | 1095 | 1115 |
| S3 Your laptop has several addresses | child 12, `.card-t`: Your Laptop Has More Than One Ip A | 579 | 761 | 838 |
| S4 Can you host the capstone on your laptop? | child 15, `.card-t`: So Can You Just Host The Capstone  | 750 | 795 | 862 |

**M1 / rest**

| Section | Starts at (child of `#p-rest`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 Fire requests at a real table | child 1, `.head` (panel opens here) | 1724 | 1818 | 1818 |
| S2 What each verb promises, and verb x URL | child 5, `.verbs` | 1021 | 1021 | 1156 |
| S3 Status codes (first digit tells whose problem) | child 10, `.card-t`: The Other Half Of The Sentence: Wh | 636 | 719 | 996 |
| S4 Naming things, and one request or fifty | child 16, `.card-t`: Naming Things: The Mistake Almost  | 832 | 1152 | 1406 |
| S5 The reverse case: lazy loading, and what REST asks of you | child 21, `.card-t`: And The Reverse: When Fetching Eve | 833 | 1117 | 1183 |

**M1 / clients**

| Section | Starts at (child of `#p-clients`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 One backend, three clients | child 1, `.head` (panel opens here) | 1215 | 1600 | 1895 |
| S2 The counterexample: server-rendered HTML | child 6, `.head`: The Counterexample Is The Site You | 746 | 1110 | 1185 |
| S3 What serving three clients costs: version drift | child 9, `.head`: What Serving Those Three Clients C | 843 | 956 | 998 |

**M1 / render**

| Section | Starts at (child of `#p-render`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 Two ways to build the page, three ways to write the data | child 1, `.head` (panel opens here) | 978 | 1130 | 1343 |
| S2 What each choice costs somewhere else | child 9, `.card-t`: Which Model Moves Less Over A Sess | 822 | 1274 | 1295 |

**M1 / pay**

| Section | Starts at (child of `#p-pay`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 The checkout flow (four parties) | child 1, `.head` (panel opens here) | 1035 | 1760 | 1839 |
| S2 Why every message is JSON | child 4, `.card-t`: Why Is Every Message In That Flow  | 632 | 821 | 866 |
| S3 Double charge and the idempotency key | child 11, `.head`: The Payoff For Panel 05 Post Is No | 764 | 1100 | 1099 |

**M1 / rea**

| Section | Starts at (child of `#p-rea`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 Six boxes, four domains | child 1, `.head` (panel opens here) | 1059 | 1014 | 949 |
| S2 Duality is many-to-many | child 5, `.card-t`: Duality Is Not A Tidy One-To-One | 573 | 574 | 663 |
| S3 Where to put the boxes (layout convention) | child 10, `.card-t`: Where To Put The Boxes | 818 | 705 | 634 |
| S4 The three letters, and universal data models | child 15, `.srv`: The Three Letters Resource: The Th | 589 | 622 | 728 |

**M1 / vm**

| Section | Starts at (child of `#p-vm`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 One machine, sliced | child 1, `.head` (panel opens here) | 965 | 1301 | 1380 |
| S2 Get yourself a server (provisioning) | child 4, `.card-t`: Try It: Get Yourself A Server | 570 | 814 | 835 |
| S3 Elasticity as work arrives | child 7, `.card-t`: Now Let A Policy Do It: Elasticity | 558 | 1006 | 1019 |
| S4 Five characteristics, and service models | child 10, `.card-t`: Five Things That Follow From Slici | 708 | 847 | 867 |

**M1 / region**

| Section | Starts at (child of `#p-region`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 What distance costs | child 1, `.head` (panel opens here) | 1302 | 1318 | 1337 |
| S2 What happens when something catches fire | child 4, `.card-t`: And What Happens When Something Ca | 975 | 997 | 1062 |

**M1 / scale**

| Section | Starts at (child of `#p-scale`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 Bigger machine or more machines, and the load balancer | child 1, `.head` (panel opens here) | 1201 | 1514 | 1735 |
| S2 Fixing one bottleneck moves it | child 6, `.card-t`: And Once You Have Several: Fixing  | 895 | 1114 | 1114 |

**M1 / split**

| Section | Starts at (child of `#p-split`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 Monolith copies against split parts (memory) | child 1, `.head` (panel opens here) | 977 | 1302 | 1515 |
| S2 What splitting costs, and chatter | child 4, `.card-t`: What Splitting Actually Costs You | 1106 | 1524 | 1604 |

**M1 / bytes**

| Section | Starts at (child of `#p-bytes`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 Anatomy of a request and response | child 1, `.head` (panel opens here) | 625 | 835 | 855 |
| S2 Run this yourself (setup for Breakout 1) | child 5, `.card-t`: Run This Yourself | 959 | 959 | 1019 |

**M1 / mem**

| Section | Starts at (child of `#p-mem`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 Memory budget | child 1, `.head` (panel opens here) | 947 | 1468 | 1546 |
| S2 What if Postgres moves out? | child 3, `.card-t`: What If Postgres Moves Out? | 799 | 654 | 677 |

**M2 / math**

| Section | Starts at (child of `#p-math`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 Linear algebra (dot product) | child 1, `.head` (panel opens here) | 1091 | 1482 | 1454 |
| S2 Calculus (slope) | child 5, `.card-t`: 2 · Calculus, Of Which You Need Th | 712 | 1047 | 997 |
| S3 Statistics (distribution and loss) | child 8, `.card-t`: 3 · Statistics, Of Which You Need  | 875 | 1204 | 1315 |

**M2 / vectors**

| Section | Starts at (child of `#p-vectors`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 Words as positions (analogies) | child 1, `.head` (panel opens here) | 1364 | 1805 | 1858 |
| S2 Sentences as positions (similarity) | child 5, `.card-t`: The Same Trick, Applied To Whole S | 1031 | 1438 | 1460 |

**M2 / deep**

| Section | Starts at (child of `#p-deep`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 Why one line fails, and stacking units | child 1, `.head` (panel opens here) | 1295 | 1850 | 1750 |
| S2 What the picture means, and what you gave up | child 3, `.whynot`: Two Pictures Of The Same Object Mo | 1094 | 1229 | 1378 |

**M2 / intro**

| Section | Starts at (child of `#p-intro`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 Where does each term sit (rings) | child 1, `.head` (panel opens here) | 1029 | 1648 | 1541 |
| S2 The four in plain terms, and three clarifications | child 3, `.card-t`: The Four, In Plain Terms | 1034 | 1078 | 1189 |

**M2 / next**

| Section | Starts at (child of `#p-next`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 One word (sampler, temperature) | child 1, `.head` (panel opens here) | 816 | 1598 | 1640 |
| S2 Eight hundred times (the loop), and three misreadings | child 4, `.card-t`: Now Do That Eight Hundred Times | 1105 | 1498 | 1606 |

**M2 / learn**

| Section | Starts at (child of `#p-learn`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 Seventeen students, five hidden | child 1, `.head` (panel opens here) | 1348 | 1745 | 1696 |
| S2 Training set and test set | child 5, `.card-t`: The Two Words You Will Hear Consta | 349 | 393 | 476 |

**M2 / tools**

| Section | Starts at (child of `#p-tools`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 Who runs the tool call | child 1, `.head` (panel opens here) | 903 | 1119 | 1154 |
| S2 Why there is a standard (MCP) | child 4, `.card-t`: Why There Is A Standard For This | 704 | 727 | 1017 |

**M2 / vibe**

| Section | Starts at (child of `#p-vibe`) | px @1440 | px @900 | px @700 |
|---|---|---|---|---|
| S1 Four snippets that work and are wrong | child 1, `.head` (panel opens here) | 922 | 1166 | 1229 |
| S2 Vibe coding against agentic coding, and what to watch for | child 4, `.card-t`: Two Words That Get Used Interchang | 841 | 886 | 1036 |

Sections still above 1500 px at 900 wide, because one widget fills them: rest S1 (1818), pay S1 (1760, flow diagram plus 10-step trace), deep S1 (1850), vectors S1 (1805), intro S1 (1648), next S1 (1598), split S2 (1524), scale S1 (1514), math S1 (1482). Do not split inside these. Give them a taller iframe.

Rea S3 (layout convention, "crow's feet up and left") is craft advice with no widget except a two-tab diagram. Mark it optional or advanced in a Canvas page.

Bytes S2 (Run this yourself) is a setup how-to with a copy button, 959 px. It reads better as its own Canvas page or handout than as a lesson section.


---

## B. Can each panel or section be embedded in a Canvas page by iframe?

Short answer: yes, after a small change. Today the pages cannot be deep-linked and the shell is built for a full viewport.

### B1. How panel switching works today

- index shell (first lines of app.js): `$$("#nav button").forEach(b => b.addEventListener("click", ...))`. The handler sets `aria-selected`, removes `.on` from all `.panel`, adds `.on` to `#p-<data-p>`, then calls hooks for three panels: `sizeCanvas()` for server, `layoutBypass()` plus `placePayBall(pyI)` for pay, `placeBall(trI)` for tiers. The comment says why: "rect measurements are all zero while a panel is display:none".
- machine shell: same pattern with `$$('[role="tab"]')`, toggles `.on`, resets `.stage` scrollTop. No hooks (machine has no layout measuring code, everything is SVG with a viewBox).
- No `location.hash`, no `history`, no query string anywhere. Refresh always returns to the default panel. The default panel is `p-tiers` in index.html (the `on` class is on 01, not 00) and `p-intro` in machine.html. Back button does nothing. Nobody can link to a panel.
- Only `.panel.on` is `display:block`; all 26 (or 17) panels are in the DOM and all init code runs on load.

### B2. What breaks if the rail is hidden

1. If the nav were removed from the DOM instead of hidden, `$("#thBtn").onclick = ...` and `$("#zIn").onclick` would throw on null and abort the rest of the script. Hide with CSS only.
2. There is no other way to change panel, so a hidden rail needs hash or query routing (B5).
3. `.rig` is `display:grid; height:100vh; overflow:hidden` and `.stage` is `overflow-y:auto`. In an iframe the document height equals the viewport, so `document.documentElement.scrollHeight` never reports the content height and the page scrolls inside the iframe. Needs `html.embed .rig{display:block;height:auto;overflow:visible}` and `.stage{overflow:visible}`.
4. The rail is not responsive. Grid column is `clamp(210px,17vw,260px)`. At a 390 px viewport the stage is 179 px wide and 24 of 26 index panels overflow horizontally (content 218 to 624 px), as do 14 of 17 machine panels. Any narrow Canvas column or phone view with the rail present is unusable.
5. Theme and text-size controls live in the rail footer. They vanish. Canvas pages are light, so default light and accept `?theme=dark`.
6. Dozens of prose references (about 30 in panel HTML and 40 in app.js strings) say "panel 17", "panel 19", "panel 04" as plain text. With the rail hidden the student sees no panel numbers anywhere except the eyebrow. Either make them links (`<a data-goto="mem">`) or rewrite them as names. Several already point to the wrong panel (E7).
7. Machine's "Module 1 tool" link is an absolute GitHub Pages URL with `target=_blank`. Hide it in embed.
8. `.panel.on` runs a 0.3 s fade each time. Harmless.

### B3. Widgets that depend on being visible when initialised

All five sites are in the index page. Machine has none (no getBoundingClientRect, clientWidth or offsetWidth in its app.js).

| Panel | Code | What goes wrong if measured while hidden |
|---|---|---|
| server (18) | `sizeCanvas()` at load and on every `resize` uses `cv.getBoundingClientRect()` | Canvas is sized 0 x 0 at load (confirmed: width 0, height 0 before first visit). Nav hook fixes it on click. A window resize while the panel is hidden re-zeroes it. |
| pay (08) | `layoutBypass()`, `placePayBall()` use rects of `#pBrowser`, `#pGw`, `#pBank`, rails | Ball and bypass line mis-placed until the nav hook runs. Also the `resize` handler only acts when `#p-pay` is `.on`. |
| tiers (01) | `placeBall()`, `flowStacked()` use rects of `#tb1`, `#tb3`, rails | Works at load only because tiers is the default visible panel. A different start panel needs the hook. |
| vm (21) | `elDraw()` sizes `#elCanvas` from its rect on every draw | Draws nothing when hidden, self-heals on the next tick once visible. A hidden section inside the visible panel would also draw 0 x 0. |
| mem (17) | `ramline` uses `#ramBar` rect | Result is overwritten two lines later with a percentage, so harmless. |

Other things that run while hidden: `PROV.timer` (setInterval every 420 ms, always on), `LB.timer`, `trTimer`, `pyTimer`, the server `requestAnimationFrame` loop only while running. Each iframe would therefore load and run the whole page: 483 KB for index.html, 212 KB for machine.html, all panels' DOM and all timers. Four iframes on one Canvas page means four full copies running. The browser cache shares the download, not the parse or the timers.

Fix: move the hook list into one `showPanel(id, sec)` function (the click handler calls it too) and call it again whenever a section is shown. If sections are wrapped in `.sec` and hidden with `display:none`, add `elDraw()` and `sizeCanvas()` style hooks for the sections that hold canvases (vm S3, server).

Also confirmed: no localStorage, sessionStorage, cookies, fetch or XHR in either page (grep). Third-party storage blocking in an iframe cannot break anything. The only external request is the Google Fonts stylesheet; the pages fall back to system fonts.

Content dependency: the basics panel reads `location.protocol`, `hostname`, `port` to write its "is your laptop a server" answer (file://, localhost, or a remote host). Embedded in Canvas from GitHub Pages it will take the "remote" branch and say "this copy came from jilagan.github.io", which is correct but differs from the file:// wording students see when they open it locally.

### B4. Keyboard shortcuts that would misfire inside an iframe

index.html (`addEventListener("keydown")`): ignores only `e.target.matches("input")`. It does not check modifiers, `select`, `textarea`, or contenteditable.
- Single keys `0-9 c a w t n q h m s p e v k r o b` jump to a panel. Inside an embed that replaces the visible section with a different panel and, with the rail hidden, gives no way back.
- Space triggers play on journey, server, break, tiers; ArrowRight and ArrowLeft step the tiers and journey traces, all with `preventDefault()`.
- No modifier check. Confirmed in Chrome: select the copy-paste commands in panel 04 and press Ctrl+C. The page jumps to panel 10 (Relationships) and the selection is gone (`getSelection()` returns empty). Ctrl+A jumps to panel 11. The same happens for Cmd+C and Cmd+A on a Mac. This is a live bug on the main site, on the panel whose job is to be copied from.
- Single-character shortcuts without an off switch also break WCAG 2.1.4 (Character Key Shortcuts) for keyboard and screen reader users.
- The comment above `setTheme` says "Keys: t", but t goes to the transactions panel. No theme key exists.

machine.html: ignores input and textarea, no modifier check. `kmap` is built with `String(i)` for i up to 16, so only keys 0 to 9 can ever match. Panels 10 to 16 have no shortcut. Ctrl+1 also switches panel as well as the browser tab.

Minimum change for both files: `if (e.ctrlKey || e.metaKey || e.altKey) return;`, extend the target check to `input, select, textarea, [contenteditable]`, and `if (document.documentElement.classList.contains('embed')) return;`. In an embed, keep Space and arrows only if the iframe has focus and the key belongs to the visible widget.

### B5. Proposed URL scheme

```
index.html                         full site, rail visible, as today
index.html#rest                    open panel rest
index.html#rest/status-codes       open panel rest, scroll to or show that section
index.html?embed=1#rest/status-codes   embed mode: rail hidden, only that section visible
index.html?embed=1&p=rest&s=status-codes   same, query form, survives link rewriters that drop fragments
index.html?embed=1&theme=dark&fid=rest-3   optional: theme, and a frame id echoed in height messages
```
Rules: panel id is the existing `data-p` value. A section slug is the `.sec` id suffix. Unknown slug shows the first section. `embed=1` hides the rail and all other sections. Without `embed`, a section hash scrolls to the section and highlights it. Nav clicks call `history.replaceState` so the address always reflects the panel (this also gives deep links for the in-class site).

### B6. Minimal JS and CSS changes

JS (both files, about 40 lines each):
1. Extract `showPanel(id, sec)` from the nav click handler: toggle `.on`, set `aria-selected`, run the existing hooks, show the matching `.sec` (embed only).
2. On load: parse `location.hash` and `URLSearchParams`; add `embed` class to `<html>` in an inline script in `<head>`; call `showPanel`. Listen for `hashchange`.
3. Nav click calls `location.hash = '#'+id` (or `replaceState`).
4. Keyboard handler guards from B4.
5. Do not remove the rail from the DOM.
6. Height messaging, only when `embed` is set:
```js
const fid = new URLSearchParams(location.search).get('fid') || '';
const target = document.querySelector('.panel.on .sec.on') || document.querySelector('.panel.on');
const post = () => parent.postMessage({type:'itent45:height', fid,
  h: Math.ceil(target.getBoundingClientRect().height + 24)}, '*');
new ResizeObserver(post).observe(target); post();
```
Measure the section element, not `documentElement.scrollHeight`, which can only grow inside an iframe. The content is public teaching material, so targetOrigin `*` leaks nothing.

CSS:
```css
html.embed .rail, html.embed .repolink, html.embed .rail-foot { display:none }
html.embed .rig   { display:block; height:auto; overflow:visible }
html.embed .stage { overflow:visible; padding:12px 16px 20px }
html.embed .panel .sec { display:none }
html.embed .panel .sec.on { display:block }
html.embed body { background:transparent }
```
Also add a responsive rule for the normal site: `@media (max-width:760px){ .rig{grid-template-columns:1fr} .rail{display:none or collapsed} }`.

Widths: with the rail hidden, horizontal overflow remains at 800 px for index pay (the moving `.ball` pushes the document to 930 px), at 600 px for basics (`.ifaces`), tiers and pay (`.ball`), and vm (`.stk`), and at 600 px for machine tools (`.trace`, 659 px). At 390 px eleven index panels and six machine panels overflow. Test and fix these before telling students to use phones.

### B7. What is known about Canvas, and what to test

Sure of (stable, long-standing Canvas behaviour):
- Canvas serves over HTTPS, so the iframe `src` must be HTTPS. GitHub Pages is.
- Canvas strips `<script>` from user-authored Pages. Only the iframe tag carries the content, so every behaviour must live in the framed page.
- A plain iframe inside a Page cannot be auto-resized from outside. Canvas listens for the `lti.frameResize` postMessage only from LTI tool frames. The `itent45:height` message in B6 will be ignored by a normal Page unless an admin installs custom theme JavaScript that listens for it. So choose fixed iframe heights from the table (900 or 700 px column), and keep the message for other hosts.
- Embedded content that needs a login or third-party cookie would break. This site needs neither.

Likely true but must be confirmed on Ateneo's Canvas:
- The Rich Content Editor keeps `<iframe>` in the HTML editor only for allowed hosts. Many institutions add a CSP allowlist under Account Settings, Security. Ask the Canvas admin to allow jilagan.github.io (and youtube-nocookie.com if video goes inside the page, see C).
- Whether the editor keeps `allowfullscreen`, `title`, `loading` and `style` attributes. Whether it adds a `sandbox` attribute. A sandbox without `allow-scripts` kills every widget.
- GitHub Pages sends no `X-Frame-Options`, so framing should work. Confirm with a real embed.
- Canvas Student mobile apps: whether the iframe renders and scrolls cleanly.
- Whether Canvas's high-contrast or dark UI changes anything inside the frame (it should not).
- Uploading index.html into Canvas Files and framing that copy: behaviour of the Files domain for HTML is uncertain. Keep hosting on GitHub Pages unless the owner wants the files inside Canvas.
- The iframe tag to test first:
```html
<iframe src="https://jilagan.github.io/itent45/index.html?embed=1#rest/status-codes"
  title="Verbs and REST: status codes" width="100%" height="1000"
  loading="lazy" allowfullscreen style="border:1px solid #ccc"></iframe>
<p><a href="https://jilagan.github.io/itent45/index.html#rest/status-codes" target="_blank" rel="noopener">Open this activity in its own tab</a></p>
```
Always add the text link under the iframe. It covers CSP blocks and gives students a larger view.


---

## C. Would short embedded YouTube videos help, and where?

Yes, in a few places, and mainly where the widgets simulate something the student has never seen for real. Every widget here is a hand-built model with canned numbers (the README says so). A video can show the real thing, show a person doing a task step by step, or show the messy version. A video should not re-explain a mechanism a widget already lets the student operate.

### C1. Proposed slots (at most two per group)

| Group | Slot | Working title | Where | What it shows that the widgets cannot |
|---|---|---|---|---|
| M1 Anatomy (00 to 08) | m1-devtools | "One click, for real: the Network tab" | journey S1 (or tiers) | A real site's request waterfall in browser DevTools: dozens of requests, third-party calls, real header values, real timings. The journey widget has exactly five idealised round trips. |
| M1 Anatomy | m1-run-server | "Run the teaching server on your laptop (Windows and Mac)" | bytes S2 "Run this yourself" | Where to open a terminal, installing Python, what the output looks like, the first curl. The panel gives text steps only; for a non-CS student this is the biggest barrier to Breakout 1. |
| M5 Data (09 to 16) | m5-whiteboard | "From a pile of nouns to tables: the enlistment model, drawn live" | entity or card | Watching someone decide, get it wrong, and redraw. The widgets show finished and sorted states. |
| M5 Data | m5-real-sql | "The same four statements on a real database, and the 51 queries in the debug toolbar" | sql or query | A real database tool and the Django debug toolbar counting queries. The widgets run against a fake three-row table. |
| M4 Capacity and cloud (17 to 23) | m4-console | "Launch a real cloud server, then open the bill" | vm S2 | A real console (instance types, regions dropdown, the pricing page, the time to boot). Gives vocabulary the student will meet in the capstone. The provisioning widget teaches the concept; the video teaches the interface. |
| M4 Capacity and cloud | (none needed) | | | server, scale, enlist, cost and region widgets are better than any recording. |
| M6 Architecture (24) | m6-trace | "Following one request across three services" (optional, 60 s) | split S2 | A real distributed trace view. Skip if time is short; the chatter widget covers the idea. |
| M2 Foundations (00 to 05) | m2-logprobs | "A real model's probabilities, same prompt at temperature 0 and 1" | next S1 | Real, unpredictable output in a real playground. The sampler widget uses fixed distributions (for example Paris 97.5 percent). |
| M2 Representations (06 to 11) | m2-tokenizer | "Paste your own text into a real tokenizer" | tokens | The student's own name, a Tagalog sentence and a code line, with live counts. The tokens widget has four fixed examples. |
| M2 Using models (12 to 16) | m2-agent-session | "A coding agent session in 90 seconds, including the permission prompt" | loop or tools | A real agent reading files, editing, running tests, failing and retrying, and stopping to ask. The loop and tools widgets are scripted traces. Panel 15 says "you are about to watch an agent write code", so this is the lead-in. |

### C2. Where a video would be redundant

- index 02 layers, 04 bytes S1, 05 rest request lab and verb matrix, 12 sql, 13 txn, 14 norm, 18 server, 19 scale, 20 enlist, 22 cost, 23 region: stepped or slider-driven widgets already give hands-on cause and effect. A video would show the same thing with less control.
- machine 03 train, 04 deep, 05 backprop, 07 embed, 08 vectors, 10 attn: the widgets animate the mechanism. General explainer videos on these topics (long, third-party) would duplicate them and add jargon.
- machine 16 math: three sliders already carry it.

### C3. Data shape (a slot renders only when an ID is filled in)

One file per module, inlined by build.py into the page as `<script type="application/json" id="videos">` so the site stays single-file.

```json
{
  "version": 1,
  "slots": [
    {
      "id": "m1-run-server",
      "panel": "bytes",
      "section": "run-it",
      "position": "after-title",
      "title": "Run the teaching server on your laptop",
      "youtube_id": "",
      "start": 0,
      "end": null,
      "duration": "1:30",
      "caption": "Windows and Mac, no prior terminal use.",
      "transcript": "",
      "shows": "Where to type the command and what the output looks like"
    }
  ]
}
```
Render rule:
```js
const OK = /^[A-Za-z0-9_-]{11}$/;
slots.filter(s => OK.test(s.youtube_id)).forEach(mount);   // empty ID: nothing is added to the DOM
function mount(s){
  const host = document.querySelector(`#${s.panel}-${s.section} .card-t`) || document.querySelector(`#p-${s.panel}`);
  const fig = document.createElement('figure'); fig.className = 'vid';
  fig.innerHTML = `<button class="vid-go" aria-label="Play video: ${s.title}">
      <span>Play · ${s.duration}</span></button><figcaption>${s.caption}</figcaption>`;
  fig.querySelector('button').onclick = () => {
    const q = new URLSearchParams({rel:0, playsinline:1, cc_load_policy:1, start:s.start||0});
    if (s.end) q.set('end', s.end);
    fig.querySelector('button').replaceWith(Object.assign(document.createElement('iframe'), {
      src: `https://www.youtube-nocookie.com/embed/${s.youtube_id}?${q}`, title: s.title,
      loading: 'lazy', allow: 'encrypted-media; picture-in-picture; fullscreen',
      referrerPolicy: 'strict-origin-when-cross-origin', allowFullscreen: true }));
  };
  host.after(fig);
}
```
Notes:
- The click-to-load facade makes no request to YouTube until the student presses play, even in privacy-enhanced mode. It also keeps every page light, since index.html already carries 26 panels.
- Do not use a YouTube thumbnail as the poster: that is a third-party image request on page load.
- Keep captions on (`cc_load_policy=1`) and publish the transcript text in the slot so it can be shown under the video.
- YouTube now expects embeds to send a Referer; a page opened from disk (file://) may show a player configuration error. Expect it to work from https://jilagan.github.io. Test once. (Medium confidence.)
- Inside a Canvas iframe this is a nested iframe. If the Canvas CSP is strict, the outer frame's own policy decides, but test with `allow="fullscreen"` on the outer iframe too.
- Alternative: leave video out of the site and place the YouTube embed in the Canvas page directly above or below the iframe. Canvas has native media embed and captioning. This is simpler for the instructor; the JSON slots are worth building only if the site is also used outside Canvas.


---

## D. Check Your Understanding

### D1. What exists today

Each panel has exactly one "Ask the room" prompt, at the top, with no answer capture and no feedback. The widgets are explore-and-read: click, slide, run, and a `.verdict` box explains the result. Only a few things behave like a check: index basics "Have a guess first" (pick, then reveal), index entity (sort 30 nouns into entity, attribute or instance), index clients (Additive or Breaking buttons with a verdict), index enlist (two fix buttons), machine intro (classify 8 examples into the four rings), and machine vibe (find the flaw in 4 snippets, with a "Score" card). Everything else relies on the instructor asking the room. In Canvas, with no instructor in the room, nothing tests anything.

Outcome shorthand: A = the Ask prompt tests it. W = a widget lets the student discover it (reveal only unless marked "check"). Gap = nothing tests it.

### D2. Three outcomes per panel, and what tests them

**Module 1**

- 00 basics. (1) Say that "server" means a machine and a program, and any computer can be one. (2) Read a URL as scheme, host, port, path. (3) Say who can reach a laptop service (same machine, same wifi, outside) and why public hosting needs a rented box. Tests: A covers 1. W guess row checks 1; URL parts and reach list reveal 2 and 3. Gap: 2 and 3 have no check.
- 01 tiers. (1) Name the three tiers and where each runs. (2) Say why the browser cannot talk to the database directly. (3) Follow a click through the 12 steps and name the tier doing each. Tests: A covers 1. W trace plays 3 (reveal). Gap: 2 is only in the "question worth asking" note; 3 has no check.
- 02 layers. (1) Explain encapsulation: each layer wraps and only talks to its twin. (2) Estimate how much packaging a small message carries. (3) Explain why a big reply becomes many packets and arrives whole. Tests: A covers 2 (numeric). W layer click shows 1; size slider shows 3. Gap: 1 and 3 unchecked.
- 03 journey. (1) List what happens before your code runs (lookup, connect, encrypt, request). (2) Predict wait time from distance and number of round trips. (3) Say why more server capacity does not fix distance. Tests: A covers 2 and 3 (Berlin question). W slider and Step cover 1 and 2. Gap: 1 has no check.
- 04 bytes. (1) Name the parts of an HTTP message (start line, headers, blank line, body). (2) Say what Host, 200, 201, 404 tell you. (3) Send a request by hand to a local server. Tests: A covers 3 (telnet). W highlight-and-explain covers 1 and 2 (reveal). The run-it steps cover 3 in practice. Gap: 1 and 2 unchecked.
- 05 rest. (1) Choose a verb for a task and say whether it is safe and idempotent. (2) Read a status code by its first digit; separate 401 from 403 and 404 from 500. (3) Judge endpoint design: noun URLs, one request or fifty, when fetching everything is waste. Tests: A covers 1. W request lab with "send the same one again" and the verb matrix check 1; code chips reveal 2; granularity and lazy widgets show 3. Gap: 2 and the naming part of 3 have no check. Largest panel, least tested.
- 06 clients. (1) Say why one API can serve web, iOS and Android. (2) Contrast a server that returns HTML with one that returns JSON. (3) Classify a change as additive or breaking and say who breaks. Tests: A covers 2. W client picker shows 1; days slider and the Additive and Breaking buttons check 3. Gap: 1.
- 07 render. (1) Contrast server-rendered with single-page apps. (2) Compare JSON, XML and HTML sizes for the same data. (3) Choose one for a capstone and give a reason. Tests: A covers 1. W format picker covers 2; pages slider covers 1 and 3. Gap: 3 has no check.
- 08 pay. (1) Say which machines touch the card number and why the token exists. (2) Explain a double charge and what the idempotency key does. (3) Explain why a slow third-party call becomes your capacity problem. Tests: A covers 1. W flow trace shows 1; Pay button and key toggle check 2. Gap: 3 is text only.
- 09 entity. (1) Tell entity, attribute and instance apart. (2) Decide when an attribute should become an entity (Room). (3) Recognise a pairing as an entity (Enrolment). Tests: A covers 2. W sorting drill (30 buttons) checks 1. Gap: 3.
- 10 card. (1) Classify a relationship as 1:1, 1:M or M:N. (2) Say which tables each needs (foreign key, or a third table). (3) Name facts that belong to the pairing. Tests: A covers 1. W three tabs show 2. Gap: 3.
- 11 rea. (1) Find resource, event and agents in a transaction of your own. (2) Explain why payment and enrolment are many-to-many. (3) Say why a standard pattern shortens schema design. Tests: A covers 1. W four-domain tabs show 1; allocations card shows 2 (static). Gap: 2 and 3.
- 12 sql. (1) Read the four statements and map them to HTTP verbs. (2) Predict what UPDATE or DELETE does without WHERE. (3) Say which statements are safe to repeat. Tests: A covers 3 and 2 (run twice, no undo). W picker and Run check 2. Gap: 1.
- 13 txn. (1) Explain how two sessions both book the last seat. (2) Say which fix works and which does not (lock or one statement, not "check first"). (3) Say what A, C, I and D each guarantee. Tests: A covers 1. W tabs plus Step and Run check 1 and 2. Gap: 3 is static cards.
- 14 norm. (1) Explain redundancy: one fact stored in many rows. (2) Predict how many rows change on a rename. (3) Say what goes wrong if you miss some. Tests: A covers 2. W rename buttons and slider check 2 and 3. Gap: 1.
- 15 query. (1) Define N+1. (2) Estimate the query count for N rows under three approaches. (3) Name the fix (join, select_related, caching). Tests: A covers 2. W three pickers and slider check 2. Gap: 1 and 3.
- 16 shape. (1) Say relational against document is a question about which questions you ask. (2) Say where the schema is enforced in each. (3) Choose for a capstone and justify. Tests: A covers 1. W three questions check 1. Gap: 2 and 3.
- 17 mem. (1) Compute how many workers fit in RAM after OS, web server and database. (2) Explain process-per-worker against threads. (3) Predict what moving Postgres to its own box changes. Tests: A covers 1 loosely. W sliders check 1; toggle and second widget show 3. Gap: 2.
- 18 server. (1) Compute maximum throughput from workers and handler time. (2) Explain why past saturation latency climbs while throughput stays flat. (3) Predict how RAM per request limits workers. Tests: A covers 1 (numeric) and 2. W simulator checks 2. Gap: 3.
- 19 scale. (1) Distinguish scaling up from scaling out. (2) Say what a load balancer does and what it needs from your code. (3) Name the next bottleneck after a fix. Tests: A covers 2. W balancer modes and Take E down check 2; bottleneck widget checks 3. Gap: 1.
- 20 enlist. (1) Separate read-heavy browsing from write-must-be-correct reserving. (2) Explain why adding web servers does not fix one database. (3) Name a fix that costs no hardware. Tests: A covers 2. W era toggle and sliders show 2; the two fix buttons check 3. Gap: 1.
- 21 vm. (1) Explain a VM as a slice of a host. (2) Name the five NIST characteristics and tie three to things you did. (3) Place IaaS, PaaS and SaaS by who runs what. Tests: A covers 1. W slicing, provisioning and elasticity widgets cover 1 and 2. Gap: 3 is a static table.
- 22 cost. (1) Separate CapEx from OpEx. (2) Explain the two ways to guess capacity wrong. (3) List TCO items beyond price. Tests: A covers 2. W buy-or-rent buttons and capacity slider cover 2. Gap: 1 and 3 (business students may know 1 already).
- 23 region. (1) Compute the physics minimum latency from distance. (2) Match failure type (machine, datacentre, region) to the posture that survives it. (3) Choose a region for users and say why. Tests: A covers 1 (numeric). W region slider covers 3; kill buttons check 2. Gap: none major.
- 24 split. (1) Separate scaling out from splitting up. (2) Compute memory with and without splitting. (3) List what splitting costs (network calls, versioning, retries, tracing). Tests: A covers 2. W sliders cover 2 and chatter. Gap: 1 and 3 are static cards.
- 25 break. (1) Read the wire on a real request. (2) Size and defend an architecture with numbers. (3) Report back with evidence. This panel is the assessment. No check items needed.

**Module 2**

- 00 intro. (1) Order AI, ML, deep learning, generative. (2) Say a system can be AI without learning. (3) Say what each term implies about how it fails. Tests: A covers 2. W ring classifier (8 cards) checks 1. Gap: 3.
- 01 next. (1) Describe generation as repeated next-word choice. (2) Explain temperature: spread, not correctness. (3) Say there is no lookup, plan or check step. Tests: A covers 3. W temperature slider checks 2; "pick one" and the loop check 1. Gap: none major.
- 02 learn. (1) Say a model is a boundary fitted to examples. (2) Explain the train and test split and why training score means little. (3) Spot leakage (splitting after fitting). Tests: A covers 2. W four-stage tabs and the bent-line toggle show 2. Gap: 1 and 3.
- 03 train. (1) Describe training as repeated nudges downhill. (2) Predict what a learning rate too high or too low does. (3) Say nobody writes the rule. Tests: A covers 1. W rate slider and Run 200 check 2. Gap: 3.
- 04 deep. (1) Say why one line cannot separate a non-monotonic case. (2) Say what hidden units add and why the nonlinearity matters. (3) State the trade: no hand-picked features, no explanation. Tests: A covers 1. W units slider and "keep the nonlinearity" check 2. Gap: 3.
- 05 backprop. (1) Say backpropagation assigns blame backward through the chain. (2) Predict which weights move most. (3) Say why a middle weight needs information from downstream. Tests: A covers 1 and 3 (dish). W Step and Run check 2. Gap: none major.
- 06 tokens. (1) Say the model sees token ids, not letters. (2) Explain the strawberry failure. (3) Predict that language and code change token count and cost. Tests: A covers 2. W four-example tabs cover 3. Gap: 1 is implicit.
- 07 embed. (1) Describe how co-occurrence moves word positions. (2) Predict neighbours (king and queen, king and hospital). (3) Say no one labels anything. Tests: A covers 2. W Run the training shows 1 and 3. Gap: none major.
- 08 vectors. (1) Say a word or sentence is a position and similarity is an angle. (2) Read an analogy result and its limits. (3) Explain why search finds different words with the same meaning. Tests: A covers 3. W analogy tabs cover 2; sentence pairs cover 1. Gap: none major.
- 09 rnn. (1) Describe reading one word at a time with one fixed note. (2) Predict what gets forgotten across a long gap. (3) Say why that limits long inputs. Tests: A covers 2. W buttons check 2. Gap: 3.
- 10 attn. (1) Describe each word looking at all the others. (2) Say cost grows with the square of prompt length. (3) Say why this fixed the note problem. Tests: A covers 1. W tabs show 1; size slider checks 2. Gap: 3.
- 11 ctx. (1) Say there is no memory outside the window. (2) Predict when early instructions fall out. (3) Estimate how files and turns eat the budget. Tests: A covers 1 and 2. W three sliders check 3. Gap: none major.
- 12 prompt. (1) Say a prompt narrows the range of likely answers. (2) Name constraints that remove unwanted answers. (3) Pick the variant that survives two simultaneous clicks. Tests: A covers 1. W three add-constraint buttons check 2 and 3. Gap: none major.
- 13 loop. (1) Distinguish chat from agent (action plus observation). (2) Name four ways a loop drifts. (3) Say which lines the model could not have written (observations). Tests: A covers 3. W Step and Run show 1; cost card shows 2. Gap: 2.
- 14 tools. (1) Say the model only emits a request; another program runs it. (2) Say where a human can refuse. (3) Say what MCP standardises (N x M adapters become N + M). Tests: A covers 2. W trace with Refuse checks 2. Gap: 3 is a static comparison.
- 15 vibe. (1) Separate vibe coding from agentic coding. (2) Find the flaw in plausible code. (3) Name what to watch for in the next session. Tests: A covers 2. W four snippets with score check 2. Gap: 1 and 3.
- 16 math. (1) Read a dot product as an angle. (2) Read a derivative as a slope. (3) Read a distribution and a loss as "how sure" and "how wrong". Tests: A is a self-rating. W three sliders show 1, 2, 3 (reveal). Gap: nothing checks any of them.

Summary of gaps: the widgets show; they rarely ask. Outcomes with no check anywhere are mostly the "say why" and "choose and justify" kind, plus anything that appears only in a `.whynot` or `.cmp` note.

### D3. Question format

Three item types, all with a stem and options:

1. `mc`: multiple choice, one best answer, with feedback written for each option (what the wrong choice reveals about the misunderstanding), plus a short "why" shown after any answer.
2. `predict`: "Predict, then try it." The stem asks for a prediction before touching the widget ("Workers 4, handler 200 ms, arrivals 30 per second. What happens to p95 in the first minute?"). Student commits to an option; the card then says which control to use (`try_it`), scrolls to it and outlines it, and shows the result text after the student presses "I tried it". Grading stays honest because the page cannot read the widget state reliably, so the item is ungraded in the site and becomes an ordinary multiple choice in Canvas.
3. `multi`: choose all that apply, for items such as "which of these can a laptop serve to the public?" (use sparingly; Canvas supports it as multiple answers).

Rules: 3 items per panel, one per outcome, one stem sentence plus at most two lines of code or numbers. Use the course's own examples (enlistment, ITENT 45, peso amounts). Use plain wording: no jargon the panel has not defined yet. No negative stems. Wrong options should be errors students really make, such as "refresh after a POST enrols you twice" for an idempotency item.

### D4. Question bank JSON

One file per module (`src/index/questions.json`, `src/machine/questions.json`), inlined by build.py into `<script type="application/json" id="qbank">`. Fields map directly to QTI.

```json
{
  "bank": "itent45-m1",
  "version": 1,
  "outcomes": [
    {"id": "rest-o1", "panel": "rest", "text": "Choose a verb for a task and say whether it is safe and idempotent."}
  ],
  "items": [
    {
      "id": "rest-q1",
      "panel": "rest",
      "section": "request-lab",
      "outcome": "rest-o1",
      "type": "predict",
      "bloom": "apply",
      "points": 1,
      "shuffle": true,
      "stem": "You press Pay on a form that sends POST /enrollments. The page hangs and you press it again. What do you expect in the table?",
      "code": null,
      "options": [
        {"id": "a", "text": "One enrolment, because the server notices the repeat.", "correct": false,
         "feedback": "POST promises nothing about repeats. Something has to add that, such as an idempotency key."},
        {"id": "b", "text": "Two enrolments.", "correct": true,
         "feedback": "Right. POST is not idempotent. Try it with Send, then Send the same one again."},
        {"id": "c", "text": "An error, because the id already exists.", "correct": false,
         "feedback": "The server assigns the id, so a second POST gets a new one. A PUT to a fixed id is the case that would not duplicate."}
      ],
      "explanation": "Safe means changes nothing. Idempotent means twice equals once. POST is neither.",
      "try_it": {"target": "#reqSend", "instruction": "Press Send, then Send the same one again, and count rows."},
      "source_ask": "You submit a form, the page hangs, you hit refresh. Have you now enrolled twice?",
      "tags": ["http", "idempotency"]
    }
  ]
}
```
Canvas conversion (a small `qti_export.py`):
- `mc` and `predict` become QTI 1.2 `multiple_choice_question`: `<item ident=id>`, `<presentation>` with `<mattext texttype="text/html">` for stem and code, `<response_lid>` with one `<response_label>` per option, `<resprocessing>` scoring the correct option, and one `<itemfeedback>` per option for the per-answer comment. Canvas classic quizzes import QTI 1.2 zip files and show per-answer comments.
- `multi` becomes `multiple_answers_question`.
- The `predict` try-it step is folded into the stem text ("Before you try the widget, predict...") since a quiz cannot press a slider.
- `outcome` ids go into the item metadata so questions can be aligned to Canvas Outcomes by hand or CSV.
- New Quizzes import QTI too, but check the supported QTI version on Ateneo's instance; a QTI 2.1 variant may be needed. Test an import with three items before building the whole bank.
- Grading: an iframe self-check does not pass grades back to Canvas (that needs LTI 1.3 and a tool server). Anything that must be graded stays a Canvas quiz built from the same bank.

### D5. Where it sits on the panel

- Inside each `.sec`, as the last element, after the `.whynot` note: a `<div class="cyu" data-q="rest-q1">` card titled "Check your understanding". One item per section (or per panel for short panels). The card fills itself from the bank by id.
- For panels with no sections, one card of up to three items at the very end.
- Keep the existing "Ask the room" box where it is (it frames the panel). Add the "predict then try" item before the widget instead when the point is to commit to a guess first, using `data-q-before` on the section.
- Card behaviour: choose an option, show that option's feedback at once, show the explanation, allow another try. Show "3 of 3 seen" only within the page. Do not store answers (a Canvas iframe may block storage).
- Accessibility: radio inputs inside a `<fieldset><legend>`, feedback in an `aria-live="polite"` region, no colour-only correct marker.
- Embed: with `?embed=1&q=0` hide the card for pages where the instructor wants the Canvas quiz to do the checking.


---

## E. Order and numbering problems

Verified: every eyebrow number matches its nav number in both files (00 to 25 and 00 to 16). Every `data-p` has a matching `#p-<id>` section. The problems are elsewhere.

### E1. Module 1 (index.html)

1. Nav order, body order and file numbers disagree. Nav and file numbers run 00 to 25. `order.json` places panels in the body as 00-08, 17, 18, 19, 20, 24, 21, 22, 23, 09-16, 25. Invisible while panels are `display:none`, but a no-JS view, print, or any "show all panels" feature would show capacity before data and the monolith panel (24) before the cloud panels (21 to 23).
2. Group labels run Module 1, Module 5, Module 4, Module 6, Work. Panels 09 to 16 (Module 5) sit before 17 to 23 (Module 4). Module numbers go 1, 5, 4, 6.
3. Eyebrow module tags are inconsistent. 09 to 16 say "Module 5". 21 to 23 say "Module 4". 17 and 18 carry no module (they sit under the Module 4 nav group). 19 says "overlaps Module 6". 20 says "Case study". 24 says "Module 6". 00 to 08 say nothing.
4. Rail header says "ITENT 45 · Module 1" but the page covers modules 1, 4, 5 and 6. The in-page title is "Under the Hood".
5. Default open panel is 01 (`on` class on `p-tiers`), not 00. README says to read 00 first. The first panel comment in shell.html is `<!-- 01 TIERS -->` placed above `<!-- 00 BASICS -->`.
6. README table (index) is stale:
   - Says "24 panels" twice (command table and files table); there are 26.
   - Rows 12 to 21 are shifted. README 12 "One table or many?" is panel 14; 13 "What one query costs" is 15; 14 "Rows or documents?" is 16; 15 "Past one box" is 19; 16 "Case: enlistment" is 20; 17 "Whose computer" is 21; 18 "Paying for it" is 22; 19 "Regions" is 23; 20 "One app or many" is 24; 21 "Breakouts" is 25.
   - Missing rows: 12 Talking to it directly (SQL), 13 Two at the same time (transactions), 17 What a server holds, 18 Inside the server. Panel 08 is listed as "Checkout & payments" correctly.
   - Module grouping line "1 anatomy (00-08), 4 capacity and cloud (09-10, 14-16), 6 architecture (11-13), 5 data (17-19)" matches nothing in the current nav.
   - machine.html (Module 2) is not mentioned in the README at all.
7. Keyboard shortcuts. Code: `0`-`9` panels 00-09, then `c`=10 card, `a`=11 rea, `w`=12 sql, `t`=13 txn, `n`=14 norm, `q`=15 query, `h`=16 shape, `m`=17 mem, `s`=18 server, `p`=19 scale, `e`=20 enlist, `v`=21 vm, `k`=22 cost, `r`=23 region, `o`=24 split, `b`=25 break. README lists all of these except `w` and `t`. A comment above `setTheme` says "Keys: t" (theme), but t opens transactions.
8. Prose cross-references that point to the wrong panel (nav numbering):
   - 05 rest: "Panel 02 showed what a round trip costs" should be 03.
   - 08 pay: "the same verbs and status codes you saw in panel 04" should be 05 (04 only shows three canned messages).
   - 13 txn: "Panel 19's enlistment morning" should be 20.
   - 07 render: "the ceiling you measured in panel 19" is measured in 18 (19 adds machines). Soft.
   - 18 server code listing (JS string): "the exact bytes from panel 03" should be 04.
   - 25 break (JS string): "memory per thread, straight back to panel 04" should be 17.
   - 25 break: "Go back to panel 02. Does any amount of server capacity fix their experience?" fits 03 or 23 better. Soft.
   - JS comment on the scale code: "one copy of the machine from panels 08 and 09" is old numbering (now 17 and 18).
9. JS section markers (in the old single app.js; comment text against the panel it belongs to). Correct: 00 BASICS, 01 TIERS, 05 VERBS & REST, 06 CLIENTS, 07 RENDERING & PAYLOADS. Wrong: "01 LAYERS" (02), "02 JOURNEY" (03), "03 BYTES" (04), "07 CHECKOUT" (08), "08 MEMORY BUDGET" (17), "09 SERVER SIM" (18), "05 SCALE" (19), "08 The enlistment system CASE" (20; also shows a find-and-replace artifact in the name), "13 VIRTUALIZATION" (21), "14 CLOUD ECONOMICS" (22), "15 REGIONS & FAILOVER" (23), "12 MONOLITH VS SERVICES" (24), "17 NORMALISATION" (14), "18 QUERY COST" (15), "19 ROWS OR DOCUMENTS" (16), "09 BREAKOUTS" (25). No number: TRANSACTIONS (13), SQL CRUD (12), REA (11), RELATIONSHIPS (10), ENTITY (09). Section order in the file is a dependency order, not panel order: layers, journey, bytes, basics, tiers, rest, clients, render, pay, mem, server, scale, enlist, split, vm, cost, region, txn, sql, rea, card, entity, norm, query, shape, break.
10. The new `src/index/js/` file prefixes copy that script order (04-basics.js is panel 00, 18-txn.js is panel 13), so the mismatch carries into the new layout.

### E2. Module 2 (machine.html)

1. Body order (`order.json`): 14-tools comes before 12-prompt and 13-loop, and 16-math comes before 15-vibe. Nav order, the `PANELS` array and eyebrows all run 00 to 16 in order.
2. Keyboard: `kmap` uses `String(i)`, so only 0 to 9 work. Panels 10 attn, 11 ctx, 12 prompt, 13 loop, 14 tools, 15 vibe, 16 math cannot be reached by key. No README mention of machine keys.
3. JS section markers (old app.js). Correct: 00 WHAT THE WORDS MEAN, 01 NEXT TOKEN. Wrong: "01 LEARNING A BOUNDARY" (02), "02 TRAINING" (03), "03 STACKING LINES" (04), "03 TOKENS" (06), "06 LEARNING POSITIONS" (07), "07 VECTORS" (08), "06 RECURRENT" (09), "07 ATTENTION" (10), "05 CONTEXT WINDOW" (11), "06 THE LOOP" (13), "09 TOOLS AND MCP" (14), "10 VIBE CODING" (15). No number: BACKPROP (05), PROMPTING (12), MATH (16). In the file, MATH (16) sits before VIBE CODING (15).
4. Prose and string cross-references to the wrong panel:
   - 01 next, note: "The boundary in panel 01" should be 02 (panel 01 is the one being read).
   - 13 loop: "Panel 05, arriving with a bill" is about the window filling; that is panel 11.
   - 15 vibe: "the loop from panel 06" should be 13. "these seven panels" does not match 17 panels.
   - 16 math: "where words live in panel 07" and "the similarity score in panel 07" should be 08 (07 is how positions are found).
   - Deep-learning text: "That is panel 05" (faces fell out of edges) should be 04. "attention, in panel 09" should be 10.
   - Vector text: "Both are positions in the space from panel 05" should be 07 or 08; a JS comment says "Panel 05 is where those positions came from" (07).
   - Context text: "the operating system in panel 12 of the Module 1 tool" should be panel 17 of Module 1 (12 is SQL).
   - Tools text: "panel 04's missing WHERE clause" is Module 1 panel 12; inside machine, panel 04 is deep learning. Say "Module 1, panel 12".
5. Link asymmetry: index links to `machine.html` in the same tab; machine links to `https://jilagan.github.io/itent45/` with `target=_blank`. Offline or on a classroom intranet the second link leaves the local copy.


---

## F. Prior knowledge assumed that a non-CS student lacks

One line per panel. The course description says students have used Django views and SQL, and the panels lean on that (01 says so). Treat "has used Django" as thin: they have run code an instructor gave them.

**Module 1**

- 00 basics: ports, IP addresses, routers and wifi, "localhost", running a command in a terminal.
- 01 tiers: what a database, a framework (Django, Express, Laravel) and the DOM are; what JSON looks like.
- 02 layers: bytes, packets, headers, the names TCP, IP, Ethernet and the idea of a 1,500-byte limit.
- 03 journey: DNS, TCP handshake, TLS, milliseconds, the difference between latency and bandwidth.
- 04 bytes: HTTP headers, sockets, telnet and curl, installing Python 3.8, opening a terminal in macOS or PowerShell.
- 05 rest: GET, POST, PUT, PATCH, DELETE, JSON bodies, "idempotent", status code families, pagination.
- 06 clients: API, native iOS and Android apps, app-store release cycles, `request.method`.
- 07 render: the DOM, a JavaScript bundle, single-page against multi-page, XML and SOAP, KB sizes.
- 08 pay: payment gateways, PCI DSS, tokens, retries, idempotency, XML against JSON.
- 09 entity: what a data model or ERD is; "attribute" and "instance" as technical words.
- 10 card: primary key, foreign key, junction table, rows and columns.
- 11 rea: crow's-foot notation, double-entry duality (accounting students may have it, IT students may not), schema.
- 12 sql: SELECT, INSERT, UPDATE, DELETE syntax, WHERE, what an ORM is.
- 13 txn: concurrency, sessions, race conditions, locks, COMMIT and ROLLBACK, isolation levels.
- 14 norm: foreign keys, joins, and the word "normalise"; thinking of a spreadsheet as a database.
- 15 query: joins, loops over query results, `select_related`, templates.
- 16 shape: Postgres, Firebase, JSON documents, key-value and graph stores, "schema enforcement".
- 17 mem: RAM in MB and GB, processes against threads, the global interpreter lock, gunicorn workers, nginx, forking.
- 18 server: queues, throughput, p95 latency, requests per second, saturation; arithmetic such as workers divided by handler time.
- 19 scale: load balancer, reverse proxy, health checks, read replica, cache, sticky sessions.
- 20 enlist: web tier against database tier, autoscaling (the enlistment context itself is familiar).
- 21 vm: hypervisor, kernel, guest and host, IaaS, PaaS, SaaS, EC2 or Droplet, NIST.
- 22 cost: little new for business students (CapEx, OpEx, TCO); "provisioning curve" and SaaS licensing wording.
- 23 region: speed of light in fibre, availability zone, RTO and RPO, standby and failover, great-circle distance.
- 24 split: monolith and microservice, service call, memory per process, trace ids, additive change.
- 25 break: all of the above, plus using a terminal and curl.

**Module 2**

- 00 intro: the buzzwords AI, ML and deep learning, "feature", "label", a spam filter as a classifier.
- 01 next: probabilities and percentages, autocomplete, the code line `def get_user(request)`.
- 02 learn: scatter plots, classification, "decision boundary", train and test data, overfitting.
- 03 train: slope, error, iteration, "learning rate" (a derivative in plain words).
- 04 deep: neuron, hidden layer, activation function, regression, features.
- 05 backprop: weights, gradients, the chain rule as an idea (no formulas).
- 06 tokens: characters against tokens, Unicode, subword splitting; Tagalog and code examples need no knowledge.
- 07 embed: coordinates in space, a corpus, random initialisation, "embedding".
- 08 vectors: vector subtraction, angle between vectors, hundreds of dimensions, "semantic search".
- 09 rnn: sequence models, hidden state, pronoun reference ("it" refers to which noun).
- 10 attn: "transformer", the T in GPT, attention weights, cost growing with the square of length.
- 11 ctx: tokens, "K" tokens, a system prompt, an agent session.
- 12 prompt: prompts, Django models, race conditions (two simultaneous clicks), constraints.
- 13 loop: shell, test runner, agent against chat, tool call, stopping token.
- 14 tools: JSON requests, APIs, MCP, adapters (N times M), the Module 1 SQL WHERE clause.
- 15 vibe: reading Python and Django (`request.user`, `.filter`), authorisation, idempotency, code review.
- 16 math: school algebra and trigonometry, Greek and sigma notation, probability. The panel exists to reduce this gap.

---

## G. Functional bugs

Method: Playwright, file:// URLs, console and pageerror and requestfailed listeners with the panel id as label, one click on every nav button, one click on every `button` and `[role=button]` inside each panel (scrolled into view, via `.click()`), every range slider set to max then min, every select option, every checkbox toggled, every non-button element with `cursor:pointer` clicked, then a keyboard sweep of 0-9, a-z, Space and arrows. Clicks made: 219 buttons across 26 index panels, 72 across 17 machine panels (index split, machine ctx and machine math have only sliders, which were exercised).

**Console errors, warnings, uncaught page errors, failed requests: none in either page, on any panel.**

(Google Fonts: in this sandbox `document.fonts` stayed `unloaded` or `loading`, so the font request itself was not confirmed. Pages fall back to system fonts either way.)

Defects found by behaviour rather than by console:

| # | Panel or area | Defect | Evidence |
|---|---|---|---|
| 1 | index, all panels, keyboard | Single-letter shortcuts fire with Ctrl or Cmd held. Ctrl+C on selected text jumps panel and clears the selection; Ctrl+A jumps to panel 11. Worst on panel 04, where students copy the setup commands. | Select the code in panel 04, press Control+C: active panel becomes `p-card`, `getSelection()` is empty. Ctrl+A gives `p-rea`. |
| 2 | machine, keyboard | Panels 10 to 16 unreachable by key; `kmap` has keys "10" to "16", which no key event produces. Ctrl+1 also changes panel. | `kmap` built with `String(i)` up to 16. |
| 3 | index, theme toggle | `setTheme` redraws canvases by name from a fixed list. `renderQueue` and `drawQueue` do not exist; `drawSim` (the server simulator canvas) is not in the list. While the simulator is paused the canvas keeps the old palette until the next run. | Pixel signature of `#simCanvas` identical before and after the theme toggle; changes only after Start. |
| 4 | index, `sizeCanvas` | The server canvas is 0 x 0 until the panel is first visited, and a window resize while it is hidden re-zeroes it. Nav click repairs it. Any embed that shows the panel without a nav click will draw nothing. | Canvas `width,height` = 0,0 on load and after a hidden resize. |
| 5 | both, layout | Rail is not responsive. At 390 px the stage is 179 px wide; 24 of 26 index panels and 14 of 17 machine panels overflow horizontally. At 900 px machine `tools` overflows (document 897 wide, stage 689) because `.trace` has a fixed width. | Overflow scan at 900 and 390. |
| 6 | both, narrow widths with rail hidden | Horizontal overflow: index pay at 800 px (`.ball` pushes the document to 930), basics `.ifaces`, tiers and pay `.ball`, vm `.stk` at 600; machine tools `.trace` at 600; 11 index and 6 machine panels at 390. | Scan with the rail hidden by injected CSS. |
| 7 | index 25 break | Student-visible panel includes "For the instructor, what to listen for" (good-sign and watch-for lines) and scenario Curveball hints that give the answer ("Name a move that costs no hardware at all"). README says facilitator notes live in a private repo because they contain breakout answers. Embedding this panel in Canvas would show them to students. | Panel text read in the page. Hide `.listen` in embed mode or move it out. |
| 8 | index and machine, cross references | 8 wrong or doubtful "panel NN" references in Module 1 and 8 in Module 2 (list in E). Students following them land on the wrong topic. | See E1.8 and E2.4. |
| 9 | index, default panel | Opens on 01 while the first nav item is 00 and README says to read 00 first. Not an error; a mismatch. | `.panel.on` is `p-tiers` on load. |
| 10 | accessibility | Nav buttons have `role="tab"` inside `role="tablist"` but panels have no `role="tabpanel"` or `aria-controls`, and arrow keys do not move between tabs. Shortcut keys have no way to be turned off (WCAG 2.1.4). | Markup and handler read. |

Nothing else misbehaved: all 26 plus 17 nav buttons switched the right panel, no widget threw when driven to extremes, and no panel produced an error when its controls were clicked in any order.
