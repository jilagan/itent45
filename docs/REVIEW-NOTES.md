# Review notes

For the instructor. Built from the final state of the `overhaul` branch.

## 1. What changed

1. Every panel is a lesson of three to five steps shown one at a time, with a numbered step strip, Back and Next. The platform adds a last step, "Check your understanding", holding three or four questions and a collapsed "Key terms" list.
2. Step 1 of each lesson is an everyday picture (analogy of at most 60 words, an icon row, a "Think first" question). Its title starts "Start with a ...". The last authored step ends "You can now ..." and says what a student can say or decide.
3. Each later step has at most 70 words of prose, one widget and one instruction. Depth sits in closed "More detail" blocks. Code sits in "Show the code" blocks, except in HTTP messages, SQL basics and Reviewing AI-written code, which show a short sample by default.
4. Controls use one wording: Play, Step, Reset, Next, and sit above the list, trace or map they drive. Each role keeps one icon across lessons.
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

### Analogy per panel

| Panel | Analogy used |
|---|---|
| basics | sari-sari store: a store only while open and staffed |
| tiers | restaurant: customer, waiter, kitchen |
| layers | LBC parcel with waybills and hub labels |
| journey | phone calls to a restaurant before ordering |
| bytes | order slip with fixed fields |
| rest | order slip at a counter: what to do and to which order |
| clients | one kitchen serving dine-in, drive-thru and delivery app |
| render | printing a fresh menu versus a menu board |
| pay | cashier terminal that talks to the bank, receipt as proof |
| entity | class list spreadsheet |
| card | students and courses on class lists |
| rea | sari-sari sale: goods out, 20 pesos in, or the utang notebook |
| sql | Excel filter, add, change, delete |
| txn | last seat sold by two cashiers |
| norm | course title typed on every row of a class list |
| query | clerk fetching 50 files one by one or with a cart |
| shape | spreadsheets with fixed columns versus a folder per student |
| mem | fast-food branch floor area |
| server | fast-food cashiers and one line |
| scale | more counters versus more branches with a guard |
| enlist | registrar's office on enlistment day |
| vm | condominium units in one building |
| cost | jeepney versus Grab |
| region | bank with Manila and Cebu branches |
| split | carinderia cooks versus food court stalls |
| intro (machine) | calculator rules versus a cashier learning fake bills |
| next | phone keyboard suggesting the next word |
| learn | memorizing the exam paper |
| train | walking down a foggy hillside |
| deep | scholarship committee with several cut-offs |
| backprop | a salty dish sent back through the kitchen |
| tokens | child sounding out a word in pieces |
| embed | barkada party where people end up seated together |
| vectors | pins on a map |
| rnn | one sticky note rewritten after each sentence |
| attn | group chat reply that needs earlier messages |
| ctx | whiteboard that erases the oldest line |
| prompt | telling a tricycle driver where to stop |
| loop | intern sent to fix a record |
| tools | request slip at the barangay hall front desk |
| vibe | receipt with correct spelling and a wrong total |
| math | grade as a weighted sum |

## 3. Facts corrected from the old text

| Where | Old | New |
|---|---|---|
| [lessons/pay.html](../lessons/pay.html) | "a reply this size arrives with 54 bytes of headers", so the packaging costs more than the message | Sizes taken from the widget: 248, 92 and 558 bytes. The JSON sample is one line of 92 bytes. |
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
| [lessons/tokens.html](../lessons/tokens.html) | Scrabble analogy (tiles are single letters) | Child sounding out a word in pieces. |
| index and machine, check questions | 28 feedbacks began "Correct." under a "Correct" label; a few began "No" | Lead-in words removed. |


## 4. Needs the instructor's judgement

- [lessons/vm.html](../lessons/vm.html): the condo analogy covers pooling but not "furnished" versus "serviced" (IaaS, PaaS, SaaS). Keep it as is?
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

Two things to know. In decompose, the task list shows hours for the tree and days for the plan, so Buy materials is 3 hours of work in one and 2 calendar days in the other. The established lessons use the sample course code "ITENT 45" in their example records. Those records are sample data, but ITENT 21 students will see them. Replacing the code with a neutral one would touch 18 lessons, so it is left for a later pass.

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

