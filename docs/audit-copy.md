# Copy audit: ITENT 45 teaching sites

Scope: all 26 panels in src/index/panels, all 17 in src/machine/panels, and every long string literal in both app.js files. No repo file was edited. Counts are from regex passes plus reading, so treat them as rough (plus or minus 15%).

Short diagnosis. The writing is stiff because almost every panel is built from the same five moves: (1) a clever headline that states a conclusion instead of naming a topic, (2) a "not X, it is Y" or "X says A, Y says B" sentence, (3) a bold one-line verdict that sounds like a quotable ruling, (4) a metaphor where a literal phrase exists, and (5) an "Ask the room" that either answers itself or lectures. The second cause is audience. Much of the copy was written for a CS or MIS student and for an instructor talking about "students" in the third person. Terms such as Django view, ORM, DOM, handler, worker, gunicorn, p95 and idempotent appear before any plain definition.

---

## 1. Counts per tic, per site

| Tic | Index (Module 1) | Machine (Module 2) | Notes |
|---|---|---|---|
| Clever or aphoristic h2 (states a verdict, not a topic) | 22 of 29 h2s | 15 of 17 h2s | Panel 25 title is dynamic; 06 and 08 carry two extra h2s each |
| Bold lead-in verdict lines in panels (e.g. "The gap between those two columns is the product") | ~28 | ~40 | Plus the verdict headlines generated in JS below |
| Bold verdict headlines generated in JS (`<b>Still two enrolments. The transaction did not help.</b>`) | ~86 | ~65 | Same voice as the aphorisms, shown after every click |
| Contrast framing ("not X but Y", "rather than", "instead of", "is not the same as", "not just") | ~56 | ~26 | Index: 18 "not X but/just", 33 "rather than/instead of", 5 "not the same" |
| Two-sentence antithesis ("The verb says X. The URL says Y." "The relationship is real. The demonstration is arranged.") | ~11 clear cases, ~40 looser | ~12 | Machine panels use it more in verdict text |
| Cleft and "That is why / This is what / which is why" setups | ~39 | ~19 | Many open the closing paragraph of a card |
| Quotable closers (short final sentence that rules on the paragraph) | ~45 | ~35 | See list in section 2 |
| Rhetorical setups ("Now: ...?", "Then answer for...", "Worth asking") | ~25 | ~15 | Mostly inside Ask the room |
| Metaphor or flourish where a literal phrase exists | ~30 | ~25 | "earns an afternoon", "wearing different words", "physics gets a vote", "ran out of downhill" |
| Personification of machines, false drama | ~20 | ~25 | "Database drowning", "Both tiers under water", "Street was never chosen", "closed room", "cheerful summary" |
| Em dashes in on-screen prose (raw plus `&mdash;`, excluding the 26 and 17 eyebrow separators) | ~44 | ~32 | The tool-wide style also uses "NN — Label" eyebrows |
| Triads for rhythm ("A, B and C" with no content difference) | ~25 | ~20 | "Fast, correct and cheap"-type lists, "search, planning, rules, logic" |
| The word "lands/landed" in prose | 10 | 7 | e.g. "Click one and watch where it lands", "a bend that was carved...held-back five landed" |
| "actually / honest" as intensifier | 37 / 3 | 8 / 2 | "What a server is actually holding", "The honest answer is..." |
| Ask the room prompts | 25 (one per panel 00 to 24) | 17 (one per panel) | ~12 index and ~7 machine answer themselves in the next sentence |
| Cute eyebrow or widget caption | ~25 | ~12 | See section 2 captions list and section 3 |
| Jargon before definition | pervasive | pervasive | See section 4 |
| Instructor-voice lines on a student-facing page | 8 | 6 | See bugs (5g) |

Ask the room: the self-answering and lecturing ones. Index 00 ("The honest answer is that it depends"), 01 ("Most people cannot say, and that is the gap this session closes"), 04 ("(Nothing. We'll do it live.)"), 05 ("The answer depends entirely on which verb"), 08 ("Most people guess wrong, and the right answer is the reason online shops are not constantly leaking cards"), 09, 10 ("Two yeses, and the tables you are about to draw are not the tables you expected"), 13 ("Neither of them did. The database has to be the one that decides"), 15, 19 ("It does not, and it must not"), 22 (instructor note: "Push them past 'it is cheaper'"). Machine 00 ("It was. Did it learn anything? Not one thing."), 01 ("Everyone answered."), 03 (answers itself: "Feel which way is downhill. Step. Repeat."), 05, 09, 10 ("Everyone knows instantly... You read the whole sentence and worked out which noun"), 13.

Cute captions and eyebrows worth replacing: "Just in waiting" (02 gauge), "THE QUESTION WORTH ASKING" (01), "THE PAIR EVERYONE MIXES UP" and "THE FORK THAT SAVES YOU AN HOUR" (05), "THE COUNTEREXAMPLE IS THE SITE YOU USE EVERY DAY" and "WHAT SERVING THOSE THREE CLIENTS COSTS YOU" (06), "THE PAYOFF FOR PANEL 05" (08), "Why this trips people up" (00), "Break something and see" (23), "The part the textbook leaves out" (machine 08), "The uncomfortable part" (machine 12), "Level pegging", "Near the knee", "Both tiers under water", "Web tier fine. Database drowning." (JS verdicts).

---

## 2. The 40 worst lines

Format: file, quote, rewrite. JS = src/index/app.js or src/machine/app.js; line numbers are from the string-extraction pass.

### Index (22)

1. index/panels/01-tiers.html. "An agent will write most of this code for you. The shape underneath still earns an afternoon." 
   Rewrite: "AI tools can write much of this code. You still need to know where each part runs."
2. index/panels/01-tiers.html. "Two run on a machine you control. One runs on a stranger's laptop, and that difference decides most of what follows."
   Rewrite: "Two parts run on servers you manage. The third runs on your user's own device, which you do not control."
3. index/panels/01-tiers.html. "You have used Django views and SQL queries; what is usually left vague is where each piece runs."
   Rewrite: delete the sentence. Say what a view and a query are in one line each.
4. index/panels/01-tiers.html. "The application tier exists to be the only thing holding the keys, and the only thing deciding which questions are allowed."
   Rewrite: "The application tier holds the database password and decides which requests are allowed."
5. index/panels/05-rest.html (h2). "The verb says what you want done. The URL says what to do it to."
   Rewrite: "HTTP methods and URLs: what you ask for and what you ask it of."
6. index/panels/05-rest.html. "The pair everyone mixes up" box, "<code>401 Unauthorized</code> is badly named. It means unauthenticated."
   Rewrite: heading "401 and 403". Body: "401 means the server does not know who you are. 403 means it knows and says no."
7. index/panels/05-rest.html. "5xx: Their fault. The request was fine. The server broke. Read the server logs." (and "4xx: Your fault")
   Rewrite: "4xx: Client error. The request was wrong." and "5xx: Server error. The server failed."
8. index/panels/06-clients.html. "Systems like it were servlet-based, from an era when that stack was what you chose."
   Rewrite: "Older systems, such as the enlistment system, return finished web pages instead of data." (no antecedent for "it" today, and "servlet" is undefined)
9. index/panels/06-clients.html. ""It already works, why change it" is a harder argument to answer than it sounds."
   Rewrite: delete, or "Teams often keep old designs because they still work."
10. index/panels/07-render.html (h2). "The server sent data. Something still has to turn it into a page."
    Rewrite: "Who builds the page: the server or the browser."
11. index/panels/07-render.html. "Decide on the shape of the session, not on what is fashionable."
    Rewrite: "Choose based on how long users stay and how many pages they open."
12. index/panels/08-pay.html. "Every third-party call you make inside a request becomes part of your handler time, which means their bad afternoon becomes your outage."
    Rewrite: "If your server waits for the payment gateway, your site is as slow as the gateway."
13. index/panels/09-entity.html (h2). "Before you draw anything, sort the nouns"
    Rewrite: "Entities, attributes and instances."
14. index/panels/11-rea.html (h2). "Most business systems are the same six boxes wearing different words"
    Rewrite: "The REA pattern: resources, events and agents."
15. index/panels/12-sql.html (h2). "Four statements, and one of them can ruin your afternoon"
    Rewrite: "Reading and changing data with SQL."
16. index/panels/12-sql.html. "The WHERE clause is not optional, it only looks optional"
    Rewrite: "Always use WHERE with UPDATE and DELETE. Without it, the command changes every row."
17. index/panels/13-txn.html. "A transaction is not a lock, and this is the mistake to expect"
    Rewrite: "A transaction alone does not stop two users from taking the same seat."
18. index/panels/15-query.html. "Nothing in the first version is a mistake. It reads well, it passes review, and an agent writes exactly this."
    Rewrite: "The first version looks correct, and AI tools often produce it. It is still slow."
19. index/panels/18-server.html. "Latency goes vertical while throughput stays flat."
    Rewrite: "Waiting time rises sharply. The number of requests served per second stops rising."
20. index/panels/21-vm.html. "That was a useful lie." (about treating a server as a physical machine) and "which is the whole trick"
    Rewrite: "That was a simplification. In practice a rented server is a share of a larger machine."
21. index/panels/22-cost.html. "Elasticity earns its premium here." and (JS 3027) "This is the on-premise era, drawn."
    Rewrite: "Renting costs more per unit, but you pay only for what you use." / "This chart shows what buying for the peak looks like."
22. index/panels/23-region.html (h2) + 24-split.html (h2). "Where you run it is a decision, and physics gets a vote" and "Scaling out is not the same as splitting up"
    Rewrite: "Regions, availability zones and failover." / "One application or many services?"

### Machine (18)

23. machine/panels/00-intro.html (h2). "Four terms, each one a smaller thing inside the last"
    Rewrite: "AI, machine learning, deep learning and generative AI."
24. machine/panels/01-next.html (h2). "It is guessing the next word, and there is no second mechanism"
    Rewrite: "How a language model writes: one word at a time."
25. machine/panels/01-next.html. "Temperature 0 is not correct mode. It is most-likely mode."
    Rewrite: "Temperature 0 gives the most likely word each time. The most likely word can still be wrong."
26. machine/panels/01-next.html. "This is where a wrong answer becomes a confident paragraph"
    Rewrite: "Why one early error can run through a whole answer."
27. machine/panels/02-learn.html (h2). "A model is a line somebody found. Whether it learned anything is a separate question."
    Rewrite: "Training data and test data."
28. machine/panels/03-train.html. "Those three words appear in every textbook and every framework. This screen is all they mean."
    Rewrite: "Loss, cross-entropy and gradient descent are the standard terms. Here is what each one means on this screen."
29. machine/panels/04-deep.html. "The bill arrives later" and "the diagram becomes a logo rather than an explanation"
    Rewrite: "The cost of this approach: nobody can say what each unit means." / "People remember the diagram but not what it does."
30. machine/panels/05-backprop.html (h2). "How do you get a slope for a weight that never touches the output?"
    Rewrite: "Backpropagation: how a network works out which weights to change."
31. machine/panels/06-tokens.html (h2). "It has never seen a letter in its life"
    Rewrite: "Tokens: how text is cut into pieces for the model."
32. machine/panels/06-tokens.html. "It fell out of what the tokenizer was fitted to, and the people paying for it were not in the room."
    Rewrite: "The tokenizer was built mostly on English text, so Filipino costs more per message."
33. machine/panels/07-embed.html. "Meaning here is a side effect of company."
    Rewrite: "Words that appear together end up close together. Nobody assigns meanings."
34. machine/panels/08-vectors.html. "The relationship is real. The demonstration is arranged."
    Rewrite: "The pattern exists in real models. These word positions were placed by hand to show it."
35. machine/panels/08-vectors.html. "Word overlap and meaning are different measurements, and only one of them is the one you wanted."
    Rewrite: "Two sentences can share many words and mean opposite things. The score here measures meaning."
36. machine/panels/10-attn.html. "The 2017 paper is called Attention Is All You Need, and the title is the claim." and "Everything else in a transformer is engineering around that idea."
    Rewrite: "The 2017 paper that introduced this was titled Attention Is All You Need." / delete the second sentence.
37. machine/panels/11-ctx.html. "There is no memory." and "When something falls out of it, it is gone, and nothing announces that it went."
    Rewrite: "The model only sees what fits in its context window. Older text drops out without any warning."
38. machine/panels/12-prompt.html. "Students arrive believing in magic words. There are none."
    Rewrite: "No special phrase makes a model more accurate. Adding facts and limits does."
39. machine/panels/13-loop.html + JS 1340. "On its own, a model reasons in a closed room." / "arriving through an agent, at machine speed, with a cheerful summary at the end."
    Rewrite: "On its own, a model cannot run anything or check results." / "an agent running the same command very fast and reporting success."
40. machine/panels/14-tools.html (h2) + JS 1324. "The model never touches your database. It writes a note asking someone else to." / "That gap is where every safety control on an agent lives."
    Rewrite: "Tool calls: the model asks, a separate program acts." / "That step is where you can log, approve or refuse each action."

Also strong candidates not in the 40: machine JS 1049 "Street was never chosen. It was the only one still audible."; JS 421 "Nothing declared success. It ran out of downhill."; JS 559 "A neural network has no deeper trick than this."; index JS 3356 "The row count is the answer."; index JS 3879 "which is panel 14 again wearing a different hat"; index JS 3800 "how you would feel about that number in a migration script at 2am"; index JS 2649 "changes how fast an organization can be wrong and recover"; machine 16-math "they are describing a different job to the one you are training for"; index 00 "The gap between those two columns is the product"; index 00 JS 458 "an expensive space heater".

---

## 3. Every h2, with a plain replacement

### Index (Module 1, "Under the Hood")

| File | Current h2 | Proposed |
|---|---|---|
| 00-basics | What is a server, actually? | What is a server? |
| 01-tiers | A web app is three programs on different machines, passing messages | The three tiers of a web application |
| 02-layers | Your message travels inside a stack of envelopes | How network messages are layered (protocol layers) |
| 03-journey | Most of the wait is not your code running | Why loading a page takes several round trips |
| 04-bytes | HTTP is text you could type by hand | What an HTTP request and response look like |
| 05-rest | The verb says what you want done. The URL says what to do it to. | HTTP methods, URLs and status codes (REST) |
| 06-clients | One backend, three clients that have never met | One API for the web, iOS and Android |
| 06-clients (2nd) | A server-rendered system has no API layer, and that is why this is hard for it | Systems without an API: why a mobile app is hard to add |
| 06-clients (3rd) | Once phones call your API, you cannot change it freely | Changing an API that mobile apps depend on (versioning) |
| 07-render | The server sent data. Something still has to turn it into a page. | Building the page: on the server or in the browser |
| 08-pay | Checkout, where your API is the one doing the asking | Online payments and payment gateways |
| 08-pay (2nd) | POST is not idempotent, and this is what that costs | Preventing double charges (idempotency keys) |
| 09-entity | Before you draw anything, sort the nouns | Entities, attributes and instances |
| 10-card | Cardinality decides what your tables look like | Relationships: one-to-one, one-to-many, many-to-many |
| 11-rea | Most business systems are the same six boxes wearing different words | The REA pattern: resources, events and agents |
| 12-sql | Four statements, and one of them can ruin your afternoon | Reading and changing data with SQL |
| 13-txn | One seat, two students, and both of them get it | Transactions and two users changing the same data |
| 14-norm | The same fact, written down in forty places | Normalization: storing each fact once |
| 15-query | The loop that costs one query per row | The N+1 query problem |
| 16-shape | Relational or not is a question about your questions | Choosing a relational or a document database |
| 17-mem | Before anything of yours runs, the box is already half full | How a server's memory is used |
| 18-server | Still one machine. Now watch those workers do the work. | Server capacity: workers, queues and requests per second |
| 19-scale | More machines, and the thing in front that makes them useful | Scaling out with a load balancer |
| 20-enlist | Enlistment day, and why the cloud did not fix it | Case study: enlistment day |
| 21-vm | Whose computer is it, actually? | Virtualization and what "the cloud" means |
| 22-cost | From asset-heavy to asset-light | Cloud cost: capital expenditure and operating expenditure |
| 23-region | Where you run it is a decision, and physics gets a vote | Regions, availability zones and failover |
| 24-split | Scaling out is not the same as splitting up | Monolith or microservices |
| 25-break | Breakout 1, Read the wire / Breakout 2, Defend the architecture | Group exercise 1: inspect an HTTP exchange / Group exercise 2: design for a load |

### Machine (Module 2, "What the Machine Is Doing")

| File | Current h2 | Proposed |
|---|---|---|
| 00-intro | Four terms, each one a smaller thing inside the last | AI, machine learning, deep learning and generative AI |
| 01-next | It is guessing the next word, and there is no second mechanism | How a language model writes: predicting the next word |
| 02-learn | A model is a line somebody found. Whether it learned anything is a separate question. | Training data and test data |
| 03-train | The line gets pushed until it stops being wrong so often | Training: adjusting a model to reduce its errors |
| 04-deep | Some questions have no straight-line answer, so you use several lines | Neural networks: combining several lines |
| 05-backprop | How do you get a slope for a weight that never touches the output? | Backpropagation |
| 06-tokens | It has never seen a letter in its life | Tokens: how text is fed to a model |
| 07-embed | The words start in random places and get shoved around by sentences | Word embeddings: how words get positions |
| 08-vectors | Meaning turns into a position, and positions can be subtracted | Vectors and similarity of meaning |
| 09-rnn | One word at a time, and one note to itself, rewritten after every word | Recurrent networks: the approach before transformers |
| 10-attn | Every word looks at every other word and decides which ones matter | Attention and the transformer |
| 11-ctx | Everything it knows right now is in one budget, and the budget is not big | The context window |
| 12-prompt | A better prompt removes the answers you did not want | Writing better prompts |
| 13-loop | Give it tools and it can be wrong and find out | AI agents: the think, act and observe loop |
| 14-tools | The model never touches your database. It writes a note asking someone else to. | Tool calls and the Model Context Protocol (MCP) |
| 15-vibe | Four snippets. Each one works. Each one has something wrong with it. | Finding mistakes in AI-written code |
| 16-math | Three pieces of mathematics, and you have already used all of them | The math behind it: vectors, slopes and probabilities |

Nav labels (shell.html) are already fairly plain. Weak ones: index "Past one box", "Paying for it", "Two at the same time", "What the words mean" (appears in both sites with different meanings); machine "Assigning blame", "It cannot see letters", "Meaning becomes geometry", "Just enough math".

---

## 4. Per panel: unexplained terms and one analogy

"Exists" means an analogy is already in the panel. "Works" means it helps a business student.

### Index

- 00 Server. Unexplained: processor, network interface, packet, DNS, nginx, gunicorn, ports 80/443, routable, upload bandwidth. Analogy: building plus unit number for IP plus port (exists, works). Add a sari-sari store that is a "store" only while it is open.
- 01 Tiers. Unexplained: tier, Django view, SQL, ORM, DOM, wire format, Express, Laravel, rows. Analogy: restaurant with a customer, a waiter and a kitchen, or an LBC counter, clerk and warehouse (none exists). The waiter-only-talks-to-the-kitchen idea explains why the browser cannot reach the database.
- 02 Layers. Unexplained: protocol, header, TCP, IP, Ethernet frame, MAC address, TLS, payload. Analogy: envelopes (exists, works). Extend with a parcel in a box in a bigger box with a new waybill at each LBC hub.
- 03 Round trip. Unexplained: latency, DNS, TCP handshake, TLS, handler, time to first byte, waterfall. Analogy: Katipunan versus Berlin (exists, works). Add ordering from a store: ring to ask if open, confirm, then order. Each call costs a trip.
- 04 Bytes. Unexplained: HTTP, header, body, socket, telnet, status code, curl, nc, PowerShell. Analogy: a fixed-format fill-in form or a telegram (none). "Text you could type by hand" is not a picture for a non-coder.
- 05 REST. Unexplained: verb/method, REST, idempotent, endpoint, JSON, ORM, pagination, HTTP/2, 401/403/404/500, N+1. Analogy: a GCash or Jollibee order slip: view menu, place order, change order, cancel. Idempotent: pressing the elevator button twice versus "send 500 pesos" twice (none exists).
- 06 Clients. Unexplained: API, backend, JSON, scraping, iOS, servlet, versioning, schema. Analogy: one kitchen serving dine-in, drive-thru and a delivery app (none). Old app versions: old LRT card readers that nobody updates.
- 07 Render. Unexplained: server-rendered, single-page app, DOM, bundle, JavaScript, JSON versus XML, SOAP, cache. Analogy: a printed menu reprinted for each visit versus a menu board where only prices change (none).
- 08 Pay. Unexplained: payment gateway, PCI DSS, token, webhook, idempotency key, UUID, XML-DSig, SOAP, rps. Analogy: pay at a cashier, get a claim stub (token), receive an SMS later (webhook). GCash/Maya are mentioned in JS but not used as the explanation.
- 09 Entity. Unexplained: schema, data model. Analogy: class list and enrolment form (exists, works). SOM 407 example works.
- 10 Cardinality. Unexplained: foreign key, junction table, many-to-many. Analogy: students and subjects (exists, works). Add barangay: one household head per household, many residents per household.
- 11 REA. Unexplained: REA, duality, reconciliation, crow's foot, schema, universal data model, ORM. Analogy: a sari-sari sale (goods out, cash in, utang later) (none). The enrolment and payment table with pesos (exists, works).
- 12 SQL. Unexplained: SELECT, INSERT, UPDATE, DELETE, ORM, WHERE, production, idempotent. Analogy: Excel: filter, add row, edit cell, delete row; forgetting the filter is Replace All on the whole sheet (none).
- 13 Transactions. Unexplained: ACID, isolation level, lock, COMMIT, CHECK, serialize, session. Analogy: the last jeepney seat or last cinema ticket with two cashiers (none). Enlistment (exists, works).
- 14 Normalization. Unexplained: normalization (word never used), join, flat table, migration. Analogy: an Excel sheet with the course title typed on every row versus a lookup sheet (spreadsheet question in Ask the room exists, works).
- 15 Query cost. Unexplained: N+1, join, index, ORM, template, handler, worker, ceiling. Analogy: asking a clerk for 50 files one trip at a time versus one trip with a cart (none).
- 16 Rows or documents. Unexplained: Postgres, Firebase, MongoDB, Redis, schema, denormalize, key-value, graph. Analogy: a filing cabinet of fixed forms versus a folder of free-form envelopes (none).
- 17 Memory. Unexplained: RAM, process, thread, worker, gunicorn, GIL, swap, fork, nginx. Analogy: a small carinderia with eight tables where the kitchen and fridge already take space (none). The laptop 8 GB question (exists).
- 18 Capacity. Unexplained: queue, throughput, p95 latency, utilization, rps, saturation. Analogy: cashier counters in a Jollibee branch with one line (none). Workers equal cashiers.
- 19 Scaling. Unexplained: load balancer, reverse proxy, vertical/horizontal, round robin, sticky session, health check, replica, cache, job queue, stateless. Analogy: a mall guard sending cars to floors, or a barangay hall queue number (none).
- 20 Enlistment. Unexplained: web tier, primary database, replica, autoscaling, rps, ops/s, serialise. Analogy: the case itself (exists, works). Add: many people read the bulletin board, one window reserves seats.
- 21 VM. Unexplained: virtualization, hypervisor, kernel, bare metal, IaaS/PaaS/SaaS, EC2, Droplet, NIST. Analogy: condo units in one building (the "slice" idea exists, no image). IaaS/PaaS/SaaS as cook at home, catering, eating out.
- 22 Cost. Unexplained: CapEx, OpEx, depreciation, TCO, elasticity. Analogy: buying a jeepney versus riding Grab; seven servers idle 364 days (exists, works).
- 23 Region. Unexplained: region, availability zone, failover, replication, RPO, RTO, multi-AZ. Analogy: bank branches in Manila and Cebu; a typhoon hits one (none). Light-speed question (exists, works).
- 24 Split. Unexplained: monolith, microservice, trace id, uptime, serialization, coupling. Analogy: one cook doing everything versus a food court of stalls with runners (none).
- 25 Breakout. Unexplained: terminal, curl, nc, THREADED, Host header, headroom, bottleneck. Analogy: none needed. Add one line on what a terminal is.

### Machine

- 00 Intro. Unexplained: algorithm, features, labelled data, classifier, "one bit". Analogy: nested circles (exists, works). Add a calculator versus a trained cashier.
- 01 Next word. Unexplained: probability distribution, token, sample, temperature, context, classifier, noise. Analogy: phone autocomplete or finishing a lyric (the France sentence exists, works). Temperature as how adventurous you are choosing ulam.
- 02 Learn. Unexplained: logistic regression, training/test set, overfitting, boundary, fit. Analogy: seeing the exam before sitting it (exists, works).
- 03 Train. Unexplained: loss, cross-entropy, gradient descent, learning rate, weights, bias. Analogy: fog on a hillside (exists, works). Add a dial on an aircon: nudge, check, nudge.
- 04 Deep. Unexplained: neural network, hidden layer, unit, nonlinearity, feature, output unit. Analogy: a scholarship board where each member applies one cut-off and the committee needs agreement (none).
- 05 Backprop. Unexplained: slope, weight, chain rule, forward/backward pass, derivative. Analogy: the dish coming back to the kitchen (exists, works). Add tracing a late parcel back through LBC hubs.
- 06 Tokens. Unexplained: token, tokenizer, context window. Analogy: Scrabble tiles or syllable chunks (none). Filipino sentence example (exists, works).
- 07 Embeddings. Unexplained: embedding, word2vec, corpus, co-occur, "directions". Analogy: a barkada party where people who talk together end up seated together (none).
- 08 Vectors. Unexplained: vector, cosine, embedding, retrieval, bias, keyword search. Analogy: map pins: close on the map means similar (none). Sign-up versus drop example (exists, works).
- 09 RNN. Unexplained: recurrent network, hidden state, long-range dependency. Analogy: a student with one sticky note during a long lecture, or chismis passed down a line (none).
- 10 Attention. Unexplained: attention, transformer, GPT, quadratic cost, weights. Analogy: a group chat where each person scans everyone else's message (none). The "it" pronoun example (exists, works).
- 11 Context. Unexplained: context window, system prompt, tokens, agent session. Analogy: a fixed-size bilao or balikbayan box; a whiteboard that erases the oldest line (none). Operating system memory comparison (exists, wrong panel ref).
- 12 Prompt. Unexplained: system prompt, constraint, check-then-write, ORM, framework. Analogy: telling a tricycle driver "somewhere near" versus a street name (none).
- 13 Loop. Unexplained: agent, shell, ReAct, observation, test runner, token cost. Analogy: an intern who runs errands and reports back (none). "Closed room" is not an analogy.
- 14 Tools. Unexplained: MCP, client/server (clashes with Module 1 meaning of server), schema, JSON, adapter. Analogy: a universal charger or a barangay hall front desk that relays and can refuse (menu-you-have-not-tasted exists, weak).
- 15 Vibe. Unexplained: ORM, select_related, race condition, vibe coding, agentic coding, test suite, diff. Analogy: proofreading a receipt where the spelling is perfect and the total is wrong (none).
- 16 Math. Unexplained: dot product, matrix, derivative, gradient, distribution, cross-entropy, Wx. Analogy: a dot product is a weighted grade; a slope is a speedometer (none). Weighted grade is the best fit for this audience.

---

## 5. Bugs in copy

### a. Stale or wrong panel cross-references

Index (panel numbers are the file prefixes and nav numbers; no renumbering happens in build.py):
- 05-rest: "Panel 02 showed what a round trip costs." Panel 03 is the round-trip panel. Panel 02 does show round trips in its segment gauge, so say "panels 02 and 03".
- 07-render: "That raises the ceiling you measured in panel 19." The ceiling slider is panel 18. Panel 19 uses it.
- 08-pay: "the same verbs and status codes you saw in panel 04." Verbs and status codes are panel 05. Panel 04 is the wire format.
- 13-txn: "Panel 19's enlistment morning is nine thousand people doing this." Enlistment is panel 20.
- app.js 2652: "what panel 19's autoscaling web tier actually rests on". Autoscaling is shown in panels 20 and 21, not 19.
- app.js 3999 (Breakout 2, Card B curveball): "Go back to panel 02." The 120 ms round-trip slider is panel 03.
- app.js 3964 (Breakout 1 listen list): "memory per thread, straight back to panel 04." Memory per worker is panel 17.
- 07-render: the last "What each choice costs you" group includes a card "XML is not wrong, it is just heavy" with the line "You will meet it in a SOAP integration eventually". XML belongs to panel 08. It reads as a leftover from a merge.

Machine:
- 01-next: "Generative, as against the thing in panel 01" and "The boundary in panel 01 answers a closed question". Both should say panel 02. The panel refers to itself.
- 11-ctx: "Same shape as the memory budget in panel 12 of the Module 1 tool." Memory is panel 17. Same wrong reference in app.js 1161.
- 12-prompt: "in the review drill at the end of this one" is panel 15, not the end of panel 12. Say "panel 15".
- 13-loop: "Panel 05, arriving with a bill." Context filling is panel 11.
- 15-vibe: "Every defect here belongs to a category from panel 06 of the other tool." Panel 06 of Module 1 is the API clients panel. The defects (N+1, missing WHERE, race, invented method) are panels 12, 13, 15.
- 15-vibe: "the loop from panel 06". The loop is panel 13.
- 15-vibe: "more useful than anything on these seven panels". There are 17 panels. Stale from an earlier version.
- 16-math: "The attention weight in panel 09". Attention is panel 10. "The similarity score in panel 07". Similarity is panel 08. "where words live in panel 07" should be panel 08.
- app.js 22 (deep learning card): "That is panel 05." The stacked layers are panel 04.
- app.js 559: "attention, in panel 09". Panel 10.
- app.js 1071: "Both are positions in the space from panel 05". Panel 07 or 08.
- app.js 1340: "panel 04's missing WHERE clause". The WHERE clause is Module 1 panel 12, not machine panel 04.
- app.js comments use old numbers ("07 VECTORS", "06 THE LOOP", "09 BREAKOUTS"). Not visible to students.

### b. Broken find and replace (the enlistment system)

- 06-clients: "Then answer for the real the enlistment system" has a doubled "the".
- 22-cost: sentence starts lowercase: "the enlistment system needed seven servers for the twenty minutes".
- 21-vm (end): "your student portal, Canvas and Gmail are SaaS" begins a sentence in lowercase after a period.
- app.js 2649: "The seven the enlistment system servers each needed a procurement cycle". Grammar broken.
- 20-enlist: "A student information system of that era" and "student systems of that era". "That era" has no referent.
- app.js 3990 (Card A): "Enlistment morning (The enlistment system)" is an odd capitalised parenthetical.
- 06-clients: "Systems like it were servlet-based". "It" has no antecedent after the rewrite.

### c. Raw characters showing on screen

- index/panels/19-scale.html line 116: label text "Machines (each a copy of panel 18’s box)". `’` is written literally in HTML, so students see the six characters `’`. Replace with a typed apostrophe or `&rsquo;`.
- No escaped tags (`&lt;code&gt;`) appear as stray text in verdicts. Escaped tags exist only inside code samples (JSX, XML, HTML shown on purpose) and are correct. `&amp;middot;` at index app.js 1408 is correct as it is inside a JSX sample.
- No `textContent` assignments contain markup. The page cannot show raw tags that way as the code stands.

### d. Typos and grammar

- machine 08-vectors: "a different vector depending on the sentence around it, Retrieval works as well as it now does because of that change." Comma splice and a capital R. Use a full stop.
- machine 08-vectors: "because the method is arranged" is unclear. Rewrite: "because the example was arranged to work."
- machine app.js 1167: "The instruction you gave at the start is no longer in front of it. The text is no longer there." The second sentence repeats the first.
- index/panels/12-sql: "Four statements, and one of them can ruin your afternoon" is fine as grammar but wrong as register for a heading (see section 3).
- index 00: "Click each one and see." and "Click any coloured section above." mix UK spelling ("coloured", "enrolment") with US spelling elsewhere ("enrollments", "normalization", "color"). Pick one. The site uses "enrolment" in prose and "enrollments" in table and column names. Keep the column names and choose one for prose.

### e. Numbers and counts that do not match

- README.md: "the teaching tool, 24 panels" and "Grouped by syllabus module: 1 anatomy (00-08), 4 capacity and cloud (09-10, 14-16), 6 architecture (11-13), 5 data (17-19)". The tool has 26 panels, and the module grouping uses different numbers. Not student-facing, but it is the repo front page.
- machine shell.html and index shell.html link names: index says "Module 2 tool", machine says "Module 1 tool". Correct, but the machine panels say "of the Module 1 tool" in running text while the site title says "Under the Hood". Students may not connect the two names.
- index nav order is Module 1, 5, 4, 6 (Data before Capacity). Module numbers read as out of order to a student.
- machine 07-embed: "Fifteen words" in the JS verdict and "sixteen words" in machine 08. Panels differ, so this is correct, but the line "Fourteen sentences" and "Fifteen words" should be checked against the data arrays before class.

### f. Eyebrow labels in two voices

Some eyebrows are topic labels ("02 — Encapsulation", "05 — Verbs & REST") and others are module tags ("09 — Module 5 · what the words mean"). The second kind is lowercase and cute ("talking to it directly", "a pattern that repeats"). Use the same format for all: "NN, Topic".

### g. Instructor voice on student-facing pages

These lines address the teacher, not the student, and appear inside the page the student reads:
- index 22-cost: "Discussion, take five minutes on this. ... Push them past 'it is cheaper'".
- index 25-break: "For the instructor, what to listen for" (labelled, but visible).
- index 04 Ask: "(Nothing. We'll do it live.)".
- machine 01: "Students assume one mechanism sits behind everything, so say this out loud."
- machine 12: "Students arrive believing in magic words."
- machine 08: "Two things are true at once and students will want to collapse them."
- machine 06: "the people paying for it were not in the room."
- machine 02: "it is worth telling them apart early" (reads like a lecture note).
Move these to a presenter notes view or rewrite in second person.

---

## Recommended order of fixes

1. Replace all 43 h2s and the 25 eyebrows with topic names (section 3). Highest impact, cheapest.
2. Fix the broken enlistment-system replacements and the `’` label (section 5b, 5c). Visible errors.
3. Correct cross-references (5a). Several send students to the wrong panel.
4. Rewrite the ~150 bold verdict headlines in panels and JS into plain statements. One pattern: "What happened, in the numbers the student just saw."
5. Define terms at first use, and add one everyday analogy per panel from section 4.
6. Move instructor-voice lines out of student view.
