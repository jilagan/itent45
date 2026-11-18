# Review notes

For the instructor. Built from the final state of the `overhaul` branch.

## 1. What changed

1. Every panel is a lesson of three to five steps shown one at a time, with a numbered step strip, Back and Next. The platform adds a last step, "Check your understanding", holding three or four questions and a collapsed "Key terms" list.
2. Step 1 of each lesson is a real moment seen on a screen (at most 60 words, an icon row of the real parts, a "Think first" question about what happens behind the screen). Its title starts "Start with ...". No lesson uses an analogy or metaphor (section 9). The last authored step ends "You can now ..." and says what a student can say or decide.
3. Each later step has at most 70 words of prose, one widget and one instruction. Depth sits in closed "More detail" blocks. Code sits in "Show the code" blocks, except in HTTP messages, SQL basics and Reviewing AI-written code, which show a short sample by default.
4. Controls use one wording: Play, Step, Reset, Next, and sit above the list, trace or map they drive. Icons are literal, and each part keeps one icon across lessons.
5. Rail labels, headings, `data-desc` lines and the README tables agree, and cross-references use the current rail labels and sit inside More detail.
6. Every lesson except Group exercises has a `data-art` slug and a one-sentence scene description for the picture pipeline (`tools/make_art.py`). 49 pictures are generated (Google Nano Banana 2.1 through Replicate) and reviewed against the reject list in docs/ART-STYLE.md. Each sits above a one-line legend in step 1.
7. Questions: 192 items in `lessons/<id>/cyu.json`, 3 to 4 per lesson, at most one per step. Each key can be worked out without opening More detail.
8. Diagram and canvas text is at least 14px on desktop and 12px on phones, and the page does not overflow at 390px.
9. `?embed=1` hides the rail, `?instructor=1` shows instructor notes, and `embed.html` lists every lesson and step.
10. Analytics (GA4) reports one `page_view` per lesson step, `select_content` on a step or rail click and `cyu_answer` on a checked question. It was tested with stubbed Google requests. The measurement ID in `shared/analytics.json` is the real one.
11. `build.py` makes one page per lesson, the home pages, the library page and the embed page from `lessons/`, and `tools/check.py` clicks through every lesson, step and embed view.
12. Widget numbers and the text beside them were checked against each other (section 3).

## 2. Decisions made for you

### Rail labels and headings

#### Module 1 and related modules (index.html)

| Group | Panel | Opens with the heading |
|---|---|---|
| Module 1 · Anatomy | What a server is | What is a server? |
| Module 1 · Anatomy | Three tiers | The three tiers of a web application |
| Module 1 · Anatomy | Protocol layers | How network messages are layered (protocol layers) |
| Module 1 · Anatomy | Round trips and latency | Why loading a page takes several round trips |
| Module 1 · Anatomy | HTTP messages | What an HTTP request and response look like |
| Module 1 · Anatomy | HTTP verbs and status codes | HTTP verbs, URLs and status codes (REST) |
| Module 1 · Anatomy | One API, many clients | One API for the web, iOS and Android |
| Module 1 · Anatomy | Server or browser rendering | Building the page: on the server or in the browser |
| Module 1 · Anatomy | Payments and gateways | Online payments and payment gateways |
| Module 5 · Data | Entities and attributes | Entities, attributes and instances |
| Module 5 · Data | Relationships | Relationships: one-to-one, one-to-many, many-to-many |
| Module 5 · Data | The REA pattern | The REA pattern: resources, events and agents |
| Module 5 · Data | SQL basics | Reading and changing data with SQL |
| Module 5 · Data | Transactions | Transactions and two users changing the same data |
| Module 5 · Data | Normalization | Normalization: storing each fact once |
| Module 5 · Data | The N+1 query problem | The N+1 query problem |
| Module 5 · Data | Relational or document | Choosing a relational or a document database |
| Module 4 · Capacity & cloud | Server memory | How a server's memory is used |
| Module 4 · Capacity & cloud | Server capacity | Server capacity: workers, queues and requests per second |
| Module 4 · Capacity & cloud | Load balancers and scaling | Scaling out with a load balancer |
| Module 4 · Capacity & cloud | Case study: enlistment | Case study: enlistment day |
| Module 4 · Capacity & cloud | Virtual machines and the cloud | Virtualization and what the cloud means |
| Module 4 · Capacity & cloud | CapEx and OpEx | Cloud cost: capital expenditure and operating expenditure |
| Module 4 · Capacity & cloud | Regions and failover | Regions, availability zones and failover |
| Module 6 · Architecture | Monolith or services | One application or many services? |
| Work | Group exercises | Group exercises |

#### Module 2 (machine.html)

| Group | Panel | Opens with the heading |
|---|---|---|
| Foundations | AI, ML and generative AI | AI, machine learning, deep learning and generative AI |
| Foundations | Predicting the next word | How a language model writes: predicting the next word |
| Foundations | Training and test data | Training data and test data |
| Foundations | How training works | Training: adjusting a model to reduce its errors |
| Foundations | Neural networks | Neural networks: combining several lines |
| Foundations | Backpropagation | Backpropagation |
| How language models work | Tokens | Tokens: how text is fed to a model |
| How language models work | Word embeddings | Word embeddings: how words get positions |
| How language models work | Vectors and similarity | Vectors and similarity of meaning |
| How language models work | Recurrent networks | Recurrent networks: the approach before transformers |
| How language models work | Attention and transformers | Attention and the transformer |
| How language models work | The context window | The context window |
| Using AI well | Writing prompts | Writing better prompts |
| Using AI well | AI agents | AI agents: the think, act and observe loop |
| Using AI well | Tool calls and MCP | Tool calls and the Model Context Protocol (MCP) |
| Using AI well | Reviewing AI-written code | Reviewing AI-written code |
| Using AI well | The math behind it | The math behind it: vectors, slopes and probabilities |

### Step 1 openings

The table of analogies that stood here is withdrawn. Every lesson opens with a real moment from software the students use, and the running cases are one food order (web lessons), enlistment day (capacity, cloud and data lessons) and one AI assistant session (AI lessons). The rule is the last section of docs/OVERHAUL-SPEC.md.

## 3. Facts corrected from the old text

| Where | Old | New |
|---|---|---|
| [lessons/pay.html](../lessons/pay.html) | "a reply this size arrives with 54 bytes of headers", so the packaging costs more than the message | Sizes taken from the widget: 248, 90 and 556 bytes (after the sample course changed). The JSON sample is one line of 90 bytes. |
| [lessons/layers.html](../lessons/layers.html) | "the 24-byte request GET /courses" | A 24-byte message as an example; the widget shows the headers adding up to 145 bytes at the bottom layer. |
| [lessons/journey.html](../lessons/journey.html) | 103 ms first byte, with 13 ms unexplained | The 103 ms and the five round trips now agree with what the widget shows. |
| [lessons/rest.html](../lessons/rest.html) | "Each verb makes two promises" | GET, PUT, PATCH and DELETE make promises that POST does not. Safe and idempotent are defined separately. |
| [lessons/mem.html](../lessons/mem.html) | table in the second section was empty on first load; verdict said "not short of memory" | Table fills; verdict says the second machine doubled the cost and every request spends 0.8 ms on the network. The RAM slider is now repeated in that section. |
| [lessons/server.html](../lessons/server.html) | queue "grows without limit" | The queue fills, new requests are rejected, p95 latency stays high and throughput stays at the maximum. |
| [lessons/vm.html](../lessons/vm.html) | four of five characteristics claimed, while the widget lit five | The widget lights four. Resource pooling is the shared host in the first section. |
| [lessons/region.html](../lessons/region.html) | Manila to Virginia 27,000 km round trip against 13,700 km one way in the questions; Tokyo given a distance | One figure: 13,700 km one way, 27,400 round trip. Tokyo is "thousands of kilometers". |
| [lessons/txn.html](../lessons/txn.html) | "default isolation level of common databases such as Postgres" | "of Postgres". MySQL defaults differently. |
| [lessons/next.html](../lessons/next.html) | "no plan, no draft"; default temperature showed 97.5 percent against text quoting 0.89 | Overclaim removed; the default temperature is 1 and the text matches the widget. |
| [lessons/deep.html](../lessons/deep.html) | 1-unit result (69 percent) mixed with 2 to 8 units (42 percent) | Question and verdict start at 2 units. Eight units still build one straight line. |
| [lessons/tokens.html](../lessons/tokens.html) | Scrabble analogy (tiles are single letters) | Removed. The lesson shows how a tokenizer splits real words. |
| index and machine, check questions | 28 feedbacks began "Correct." under a "Correct" label; a few began "No" | Lead-in words removed. |


## 4. Needs the instructor's judgement

- [lessons/txn.html](../lessons/txn.html): the text names Postgres only. Do you also teach MySQL's default?
- [lessons/intro.html](../lessons/intro.html): is a fixed rule for flagging transfers acceptable as an example of "not machine learning"?
- [lessons/tools.html](../lessons/tools.html): the text says the client, not MCP itself, provides approval. Does this match what you teach?
- [lessons/cost.html](../lessons/cost.html): is the 120-unit starting point a fair "wrong both ways" example for your class?
- [embed.html](embed.html): the base URL points at https://jilagan.github.io/itent45/. Is that the address you will publish?
- [lessons/server.html](../lessons/server.html): the simulator's default memory is now 4096 MB, not 512 MB, so the first run is not memory-limited. Lower the slider to show the memory limit.
- [lessons/split.html](../lessons/split.html): the "Think first" memory figure is now 120 MB for the three small parts, not 90 MB, to match the widget.
- Widget behaviour changes: the trace code in Three tiers is under "Show the code"; REST body fields are under "Edit the body"; the Send, Run, Play and Step controls sit above what they drive; the clients and tools widgets show plain-language lines first and the request text only in More detail; the region map is shorter and the transaction timeline starts with Play. Do the demos you plan still work in that order?
- [lessons/region.html](../lessons/region.html): distances are straight-line figures rounded for the exercise. Acceptable?

## 5. Embedding in Canvas

1. Publish the site (GitHub Pages serves the built pages: `lessons/*.html`, `index.html`, `machine.html`, `library.html` and `embed.html`).
2. Open `embed.html`, check the base URL, and copy the iframe snippet for a panel or a section.
3. In a Canvas page choose the HTML editor and paste the snippet. If the editor strips the iframe, ask your Canvas admin to allow the site's domain.
4. Test in Canvas: the frame loads at the page width; a section address (for example `#rest/status-codes`) shows one section with no tabs; the sliders and buttons work; the wide diagrams scroll sideways on a phone; Check buttons give feedback; the page height does not cut off the bottom; the dark theme (`?theme=dark`) is readable if you use it.

Checked against the widgets and found already correct: 24 workers at 400 MB is 9,600 MB (split), six weights with two into the output (backprop), sixteen words (embed), 87 percent idle at 320 units (cost).

## 6. The ten computational thinking lessons

They are in the area "Computational thinking" (teaching order below), need no programming and are used by the CT and ITENT 21 courses. Each widget was played to its solved and failed states by script at 1440 and 390 px wide, in both themes and by keyboard only.

| Lesson | Title | What the widget does |
|---|---|---|
| frame | Framing a problem | Sort facts into inputs, outputs and limits, then test a framing against sample requests |
| decompose | Breaking a task into parts | Split a poster job into parts, then plan five days for three people along the critical chain |
| patterns | Spotting patterns | Pick the repeating block in receipts, find the best-selling pair, and spot the outlier day on a bar chart |
| abstract | Abstraction and models | Keep or drop details for a route model, then zoom between map levels |
| algorithm | Writing steps for a robot | Build a step list from a small instruction set, run it, and see which step fails |
| rules | Decision rules and tables | Fill a discount table, order the rules, and test the edge values |
| sorting | Sorting and searching | Sort eight cards with as few comparisons as you can, and halve a list to find a value |
| routes | Finding the shortest route | Compare routes on a small commuter map and close a link to see the change |
| growth | How work grows with the list | Double a list and watch steps for three jobs, then see one query per row against one query |
| debug | Finding and fixing mistakes | Trace a calculation to the first wrong value, fix it, and run six test cases |

Plan figures checked and corrected during the build: fastest route 38 minutes with 4 rides, fewest rides 43 minutes with 3 rides, closing Marikina to Ortigas gives 39, 17 routes in all; 8 cards have 40,320 orders, so 16 comparisons are the least that always work, and 15 comparisons separate at most 32,768 orders; the sorting text no longer says "fifteen halvings"; the growth text says comparing every customer with every customer takes 10 billion comparisons at 100,000 (every distinct pair would be about 5 billion); rules: 1,080 against 1,020 and three problems in the tester; debug: 123 against 324. Nineteen questions were reworded so that the correct option is at most 1.3 times the mean wrong option, and every option now has an explicit `correct` value.

## 7. ITENT 21: draft course and lessons still needed

`courses/itent21.json` is a draft built from the approved course proposal, which has no weekly outline. It lists only lessons that exist: the ten computational thinking lessons first, then the core web, data, cloud and AI lessons, then a group "Going further" (layers, journey, bytes, txn, query, enlist, split, tokens). Replace the order with the real syllabus when you have it.

Lessons ITENT 21 still needs, from the outcomes in the proposal:

1. What a computer is: processor, memory, storage, operating system (so that "memory" and "worker" are known words in the cloud lessons).
2. Bits and data: how text, numbers and pictures become ones and zeros.
3. MVPs and prototypes: mockup, prototype and MVP, and the cheapest test for a question.
4. No-code tools: building an app from blocks and what the tool decides for you.
5. Digital assets with design tools: raster and vector, resolution, formats.
6. Data visualization: choosing a chart and removing what misleads.
7. Spreadsheets: a small model with inputs, formulas and a result.

The outlines are in the planning notes (itent21-map.md).

## 8. Changed just before publication

Decompose (Breaking a task into parts)
- The splitter and the plan now use one set of durations. One day in the plan is a 2-hour work session. Hours (old to new): Design layout 3 to 2, Buy materials 3 to 4, Make signs 4 (same), Make shift schedule 2 (same), Brief volunteers 2 (same), Run the morning shift 4 to 2, Design sign-up sheet 2 to 4, Record sign-ups 4 to 2. Total 24 h to 22 h.
- Days in the plan (old to new): only Design sign-up sheet changed, 1 to 2. Others stay 1, 2, 2, 1, 1, 1 and 1. The plan widget derives its days from the splitter hours (hours divided by 2) and shows both.
- The "Volunteers on the day" group was removed from the splitter tree (its two pieces were 4 h in total, so no Split button could reach them). Pieces are still eight. Group totals: Prepare the booth 10 h, Staff the booth 6 h, Follow up with visitors 6 h.
- Recomputed by exhaustive search over all schedules: longest chain 5 days (Design layout, Buy materials, Run the morning shift, Record sign-ups, unique); shortest finish 5 days with 3 people (old 5), 5 with 4 people (old 5), 6 with 2 people (old 6). One-day delay on a job (3 people): Design layout, Buy materials, Run the morning shift, Record sign-ups finish on day 6 (old 6); Make signs, Make shift schedule, Brief volunteers, Design sign-up sheet stay at 5 (old 5). The text, verdicts, More detail and four questions already held; only question 4's wording about Design sign-up sheet changed (it is no longer the smallest job).

Sample course in older lessons
- The sample course "ITENT 45 / ITENT45 / ITENT99, Application Dev & Emerging Tech" is now "MGT 45 / MGT45 / MGT99, Operations Management" in 15 lessons (break, bytes, clients, entity, norm, pay, rea, render, rest, server, shape, sql, tiers, tools, txn, with their questions). Other sample courses (CSCI 21, ITMGT 25, MATH 11, SOM 407) are unchanged. The renamed title in Normalization is "Operations and Quality Management". Spacing in aligned code samples and tables was adjusted. The GitHub clone URL in HTTP messages is the real repository and is unchanged.
- Byte counts recomputed from the strings (old to new): bytes lesson Content-Length 51 to 49, 41 to 39, 50 to 48; clients lesson Content-Length 118 to 109 (the old value matched no count of the body as shown); pay lesson JSON 92 to 90 bytes, SOAP 558 to 556 bytes, HTML 248 (same), data 38 to 36 characters, SOAP data share 7% to 6%; render lesson (sizes now count the text with line breaks and indentation removed) JSON 144 to 148 bytes and 34% to 36%, XML 264 to 260 bytes and 19% to 20%, HTML 385 to 379 bytes and 13% to 14%, data 49 to 53 characters.

Other number
- N+1 lessons disagreed: How work grows with the list used 5 ms per question, The N+1 query problem uses 0.4 ms. Growth now uses 0.4 ms: 40 courses load in 16 ms (old 205 ms) against 0.8 ms (old 5 ms); 2,000 courses 800 ms against 20 ms (old 10,005 against 25); the question about 4,000 courses now answers about 1.6 seconds (old about 20 seconds).

Routes: on phones the map is taller (aspect ratio 5 to 12, old 33 to 58), labels are 15 px (old 14), the layout was rearranged so no label or stop overlaps at 360, 375 and 390 px. Rules: the rule text is shown above the table, each order shows what fires beneath it, the Check my flags and Try order buttons are now Check and Run.

Wording: nine step-1 titles now start "Start with a ..."; the Play and Pause buttons no longer carry symbols; "Check my pick" and "Check order" are "Check"; US spelling (gray, canceled, standardizes, idealized); "this panel" and "this module" removed from two questions and one description; two link texts match their lesson (Debug to Writing steps for a robot, Rules to HTTP verbs and status codes).

Found and not changed: Entities and attributes and its questions use "SOM 407" as a sample room (a campus building name). Pages built for the CT and ITENT 21 courses show the repository name itent45 only in the git clone command in HTTP messages, which is the real repository.

## 9. Round 3: openings without analogies

What changed
- All 53 lessons open with a real moment and carry no analogy, metaphor or comparison in step text, widgets, questions, feedback, key terms, More detail or meta.json. A scan of source and rendered text for the withdrawn settings (restaurant as a comparison, waiter, kitchen, cashier, counter, order slip, claim stub, sari-sari, jeepney, taxi, bus, condo, guard, branch, barangay, clerk, folders, cart, parcel, courier, LBC, food court, utang, party, hill, fog, sticky note, whiteboard, committee, recipe, soup, speedometer, weather forecast, Scrabble, phone charger) found them in step slugs, a few data labels and the unused icons. Real subjects stay (a food delivery app in split, trains in routes).
- Step slugs and question "sec" values that carried withdrawn words now match their step titles. The video slot in vm/meta.json follows the new slug.
- Enlistment vocabulary everywhere: enlist, the table `enlistments`, "slot" for a place in a course. The starter APIs and the teaching server use the same words.
- One food order: order 8891 with Chicken rice (P180) and Beef noodles (P220), menu, item, checkout. The sample course is MGT 45 Operations Management in the code samples of shape as well.
- 15 icons that no lesson references were deleted from shared/icons. The icon table in CONVERSION-RECIPE lists literal icons only.
- Fixes: the Take E down verdict in scale shows under Least connections; the deep trade step is under 70 words; the rea diagram fits 390 px without a 760 px minimum; step-1 text no longer repeats the title; brand names were removed from lesson text outside the AI tools' sample data.

Numbers recomputed from the strings (old to new)
- clients lesson Content-Length 109 to 119 (body with line breaks, counted again after the menu items changed).
- tiers lesson Content-Length now 83 for the order body `{"items": [{"name": "Chicken rice", "qty": 2}, {"name": "Beef noodles", "qty": 1}]}`; the earlier value belonged to the old body and was not recorded.
- pay lesson sizes 248, 90 and 556 bytes to 247, 89 and 555 bytes; data 36 to 35 characters; the payment amount is P580 (58000 centavos) for the new order.
- render lesson sizes 101, 193 and 310 bytes and 32 data characters were checked against the shown text with line breaks and indentation removed, as the lesson says. They did not change.
- split lesson memory figures (monolith 1,600 MB at 40 rps and 14,400 MB at 400 rps; services 2,760 MB and 7,160 MB) were recomputed from the widget data. They did not change.
