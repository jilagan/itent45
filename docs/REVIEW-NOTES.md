# Review notes

For the instructor. Built from the final state of the `overhaul` branch.

## 1. What changed

1. Every panel opens with an everyday analogy, then names the technical term.
2. Panels are split into sections with short openings, so one section works alone in Canvas.
3. Rail labels and headings are plain words, and the rail labels match the quoted panel names in the text.
4. Every section has a Check your understanding item; about 170 items in `src/<page>/cyu/`. Prediction items ask before the widget is used.
5. Every "Think first." prompt uses one label and can be answered before the widget.
6. Diagram and canvas text is at least 14px on desktop and 12px on phones; wide diagrams scroll sideways on phones.
7. Section tabs scroll sideways on phones and the page no longer overflows at 390px.
8. `?embed=1` hides the rail, `?instructor=1` shows instructor notes, and `embed.html` lists every embed address.
9. `build.py` makes the three pages from `src/`, and `tools/check.py` clicks through every panel and embed view.
10. Widget numbers and the text beside them were checked against each other (section 3).

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
|  | AI, ML and generative AI | AI, machine learning, deep learning and generative AI |
|  | Predicting the next word | How a language model writes: predicting the next word |
|  | Training and test data | Training data and test data |
|  | How training works | Training: adjusting a model to reduce its errors |
|  | Neural networks | Neural networks: combining several lines |
|  | Backpropagation | Backpropagation |
|  | Tokens | Tokens: how text is fed to a model |
|  | Word embeddings | Word embeddings: how words get positions |
|  | Vectors and similarity | Vectors and similarity of meaning |
|  | Recurrent networks | Recurrent networks: the approach before transformers |
|  | Attention and transformers | Attention and the transformer |
|  | The context window | The context window |
|  | Writing prompts | Writing better prompts |
|  | AI agents | AI agents: the think, act and observe loop |
|  | Tool calls and MCP | Tool calls and the Model Context Protocol (MCP) |
|  | Checking AI-written code | Finding mistakes in AI-written code |
|  | The math behind it | The math behind it: vectors, slopes and probabilities |

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
| [index.html#pay](index.html#pay) | "a reply this size arrives with 54 bytes of headers", so the packaging costs more than the message | Sizes taken from the widget: 248, 92 and 558 bytes. The JSON sample is one line of 92 bytes. |
| [index.html#layers](index.html#layers) | "the 24-byte request GET /courses" | A 24-byte message as an example; the widget shows the headers adding up to 145 bytes at the bottom layer. |
| [index.html#journey](index.html#journey) | 103 ms first byte, with 13 ms unexplained | The 103 ms and the five round trips now agree with what the widget shows. |
| [index.html#rest](index.html#rest) | "Each verb makes two promises" | GET, PUT, PATCH and DELETE make promises that POST does not. Safe and idempotent are defined separately. |
| [index.html#clients](index.html#clients) | "The server does not check who is calling." | "The server does not care whether the caller is a browser, an iPhone or an Android app." Authentication is covered by the cookie paragraph. |
| [index.html#mem](index.html#mem) | table in the second section was empty on first load; verdict said "not short of memory" | Table fills; verdict says the second machine doubled the cost and every request spends 0.8 ms on the network. The RAM slider is now repeated in that section. |
| [index.html#server](index.html#server) | queue "grows without limit" | The queue fills, new requests are rejected, p95 latency stays high and throughput stays at the maximum. |
| [index.html#vm](index.html#vm) | four of five characteristics claimed, while the widget lit five | The widget lights four. Resource pooling is the shared host in the first section. |
| [index.html#region](index.html#region) | Manila to Virginia 27,000 km round trip against 13,700 km one way in the questions; Tokyo given a distance | One figure: 13,700 km one way, 27,400 round trip. Tokyo is "thousands of kilometers". |
| [index.html#txn](index.html#txn) | "default isolation level of common databases such as Postgres" | "of Postgres". MySQL defaults differently. |
| [machine.html#next](machine.html#next) | "no plan, no draft"; default temperature showed 97.5 percent against text quoting 0.89 | Overclaim removed; the default temperature is 1 and the text matches the widget. |
| [machine.html#deep](machine.html#deep) | 1-unit result (69 percent) mixed with 2 to 8 units (42 percent) | Question and verdict start at 2 units. Eight units still build one straight line. |
| [machine.html#tokens](machine.html#tokens) | Scrabble analogy (tiles are single letters) | Child sounding out a word in pieces. |
| index and machine, check questions | 28 feedbacks began "Correct." under a "Correct" label; a few began "No" | Lead-in words removed. |


## 4. Needs the instructor's judgement

- [index.html#basics](index.html#basics) and most panels: introductions run 100 to 170 words because they hold the analogy and the definitions. Should they be cut to about 90, with the rest moved into the first section?
- [index.html#vm](index.html#vm): the condo analogy covers pooling but not "furnished" versus "serviced" (IaaS, PaaS, SaaS). Keep it as is?
- [index.html#txn](index.html#txn): the text names Postgres only. Do you also teach MySQL's default?
- [machine.html#intro](machine.html#intro): is a fixed rule for flagging transfers acceptable as an example of "not machine learning"?
- [machine.html#tools](machine.html#tools): the text says the client, not MCP itself, provides approval. Does this match what you teach?
- [index.html#cost](index.html#cost): is the 120-unit starting point a fair "wrong both ways" example for your class?
- [embed.html](embed.html): the base URL points at https://jilagan.github.io/itent45/. Is that the address you will publish?
- [index.html#region](index.html#region): distances are straight-line figures rounded for the exercise. Acceptable?

## 5. Embedding in Canvas

1. Publish the site (GitHub Pages serves the built `index.html`, `machine.html` and `embed.html`).
2. Open `embed.html`, check the base URL, and copy the iframe snippet for a panel or a section.
3. In a Canvas page choose the HTML editor and paste the snippet. If the editor strips the iframe, ask your Canvas admin to allow the site's domain.
4. Test in Canvas: the frame loads at the page width; a section address (for example `#rest/status-codes`) shows one section with no tabs; the sliders and buttons work; the wide diagrams scroll sideways on a phone; Check buttons give feedback; the page height does not cut off the bottom; the dark theme (`?theme=dark`) is readable if you use it.

Checked against the widgets and found already correct: 24 workers at 400 MB is 9,600 MB (split), six weights with two into the output (backprop), sixteen words (embed), 87 percent idle at 320 units (cost).
