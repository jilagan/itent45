# ITENT 45: Under the Hood

Teaching materials for **ITENT 45: Application Development and Emerging Technologies**
(Ateneo de Manila University, John Gokongwei School of Management).

**Live tool: https://jilagan.github.io/itent45/**

## Quick start

Download the repo, then run one command. Python 3.8 or newer is all you need.

    git clone https://github.com/jilagan/itent45.git
    cd itent45
    python3 start.py

That serves the tool at `localhost:8080` and opens it. The first panel, "What is a server?", explains what that address means. Two other things to run:

| Command | What it does |
|---|---|
| `python3 start.py` | the teaching tool (Module 1 and related modules, and the Module 2 page) |
| `python3 start.py demo` | raw-socket server that prints every byte a client sends |
| `python3 start.py api` | the starter API from Breakout 2 |

On Windows use `python start.py`. Nothing to install for the first two.
`api` uses Django if you have it and Node otherwise. Add `--node` or `--django`
to choose. If a port is busy it takes the next free one.

No internet? The tool still works. It loads IBM Plex from Google Fonts when it
can and uses your system fonts when it cannot.

## The panels

The tables come from the navigation in each `shell.html`. Run `python3 tools/panels.py` to regenerate them.

### Module 1 and related modules (index.html)

| Group | Panel | Opens with the heading |
|---|---|---|
| Module 1 · Anatomy | What is a server? | What is a server? |
| Module 1 · Anatomy | What a web app is | The three tiers of a web application |
| Module 1 · Anatomy | Layers & envelopes | How network messages are layered (protocol layers) |
| Module 1 · Anatomy | The round trip | Why loading a page takes several round trips |
| Module 1 · Anatomy | The actual bytes | What an HTTP request and response look like |
| Module 1 · Anatomy | Verbs & REST | HTTP verbs, URLs and status codes (REST) |
| Module 1 · Anatomy | One API, many clients | One API for the web, iOS and Android |
| Module 1 · Anatomy | Who builds the page | Building the page: on the server or in the browser |
| Module 1 · Anatomy | Checkout & payments | Online payments and payment gateways |
| Module 5 · Data | What the words mean | Entities, attributes and instances |
| Module 5 · Data | Relationships | Relationships: one-to-one, one-to-many, many-to-many |
| Module 5 · Data | A pattern that repeats | The REA pattern: resources, events and agents |
| Module 5 · Data | Talking to it directly | Reading and changing data with SQL |
| Module 5 · Data | Two at the same time | Transactions and two users changing the same data |
| Module 5 · Data | One table or many? | Normalization: storing each fact once |
| Module 5 · Data | What one query costs | The N+1 query problem |
| Module 5 · Data | Rows or documents? | Choosing a relational or a document database |
| Module 4 · Capacity & cloud | What a server holds | How a server's memory is used |
| Module 4 · Capacity & cloud | Inside the server | Server capacity: workers, queues and requests per second |
| Module 4 · Capacity & cloud | Past one box | Scaling out with a load balancer |
| Module 4 · Capacity & cloud | Case: enlistment | Case study: enlistment day |
| Module 4 · Capacity & cloud | Whose computer is it? | Virtualization and what the cloud means |
| Module 4 · Capacity & cloud | Paying for it | Cloud cost: capital expenditure and operating expenditure |
| Module 4 · Capacity & cloud | Regions & failover | Regions, availability zones and failover |
| Module 6 · Architecture | One app or many? | One application or many services? |
| Work | Breakouts | Group exercise 1: inspect an HTTP exchange |

### Module 2 (machine.html)

| Group | Panel | Opens with the heading |
|---|---|---|
|  | What the words mean | AI, machine learning, deep learning and generative AI |
|  | Predicting the next word | How a language model writes: predicting the next word |
|  | Learning a boundary | Training data and test data |
|  | Where the line comes from | Training: adjusting a model to reduce its errors |
|  | Stacking straight lines | Neural networks: combining several lines |
|  | Assigning blame | Backpropagation |
|  | It cannot see letters | Tokens: how text is fed to a model |
|  | How positions get found | Word embeddings: how words get positions |
|  | Meaning becomes geometry | Vectors and similarity of meaning |
|  | One word at a time | Recurrent networks: the approach before transformers |
|  | Looking at everything at once | Attention and the transformer |
|  | The context window | The context window |
|  | Saying what you want | Writing better prompts |
|  | The loop, and how it drifts | AI agents: the think, act and observe loop |
|  | Tools, and who runs them | Tool calls and the Model Context Protocol (MCP) |
|  | Vibe coding, and the handoff | Finding mistakes in AI-written code |
|  | Just enough math | The math behind it: vectors, slopes and probabilities |

Single-key shortcuts on the full site jump to panels. On Module 1, `0` to `9` open the first ten panels
and letters open the later ones (`c` relationships, `a` REA, `w` SQL, `t` transactions, `n` normalization,
`q` query cost, `h` shapes, `m` memory, `s` inside the server, `p` past one box, `e` enlistment,
`v` virtualization, `k` cost, `r` regions, `o` one app or many, `b` breakouts). On Module 2, `0` to `9` open the first ten panels.
The shortcuts are off when Ctrl, Cmd or Alt is held, when focus is in a form field, and in embed mode.

## How the site is built

The two pages are generated from `src/`. Edit the files in `src/`, never `index.html` or `machine.html`.

| Path | What it holds |
|---|---|
| `src/<page>/shell.html` | rail and page frame (`<page>` is `index` or `machine`) |
| `src/<page>/panels/NN-id.html` | one panel each, in the order given by `order.json` |
| `src/<page>/js/NN-id.js` | widget code for each panel, in the order given by `js-order.json` |
| `src/<page>/style.css` | page styles |
| `src/<page>/cyu/<id>.json` | check-your-understanding questions for panel `<id>` |
| `src/<page>/videos.json` | video slots |
| `src/shared/theme.css` | the shared look |
| `src/shared/platform.css`, `platform.js` | routing, sections, embed mode, questions, video |
| `tools/` | `check.py` (click-through test), `panels.py` (README tables) |

Build and check:

    python3 build.py                  # writes index.html, machine.html, embed.html
    python3 build.py --out /tmp/x     # writes somewhere else
    python3 tools/check.py /tmp/x     # clicks every panel and section, prints console errors
    python3 tools/check.py /tmp/x --embed   # also loads every panel and section in embed mode

`check.py` needs Playwright and Chrome. Run `python3 build.py` before publishing, because GitHub Pages serves the built files.

## Addresses

    index.html#rest                  opens a panel
    index.html#rest/status-codes     opens a section of a panel
    index.html?instructor=1          shows the instructor notes
    index.html?theme=dark            starts in the dark theme

A panel with two or more sections shows a tab strip and Previous and Next buttons. A section is a
`<div class="sec" data-sec="slug" data-title="Title">` directly inside the panel, after its `.head`.

## Embedding in Canvas

Add `?embed=1` to any address. The rail is hidden and the shortcuts are off.

    index.html?embed=1#rest                 the whole panel, with its section tabs
    index.html?embed=1#rest/status-codes    one section, no tabs
    ...&cyu=0                               hide the questions
    ...&video=0                             hide the video

In a section view the panel title is small above the section title, and the introduction shows only with
the first section. Links to other panels open the full site in a new tab. Each embed ends with an
"Open full site" link. The page posts its height to the parent as
`{type:"itent45:height", height, fid}`. A normal Canvas page ignores it, so set the iframe height by hand.

`embed.html` lists every panel and section with its embed URL and an iframe snippet to copy.
Canvas must allow `jilagan.github.io` in its frame settings. Put a plain link under each frame in case it is blocked.

## Questions

Each panel can have `src/<page>/cyu/<panelId>.json`. Items are `mc` (one answer), `multi` (several answers)
or `predict` (a prediction, then a `try` line that points at the widget). Each option has `text`, `correct`
and `feedback`. An item with `sec` set to a section slug appears at the end of that section.
An item with `sec` null appears at the end of the panel. Backticks in text become `code`. Nothing is stored
and nothing is sent. The score line counts only the current visit.

## Videos

`src/<page>/videos.json` is a list of slots: `panel`, `sec` (or null), `youtube`, `title`, `about`.
A slot shows only when `youtube` holds an 11-character video id. It appears at the top of its section
(or after the panel heading when `sec` is null) as a thumbnail with a play button. The video loads from
`youtube-nocookie.com` when the student presses play. The `about` text says what the video should show.

## Facilitator notes

The two-session plan, the single-session cut, and the what-to-listen-for notes
live in a separate private repository, because they contain the breakout answers.
Email jbilagan@ateneo.edu if you are teaching this and want them.

## What is in here

| Path | What it is |
|---|---|
| `index.html`, `machine.html` | the two tools, one file each, no dependencies |
| `embed.html` | embed addresses and iframe snippets |
| `start.py` | runs any of the three things above |
| `teaching_server.py` | raw sockets, prints the exact bytes a client sent |
| `starter/django_api.py` | the Breakout 2 API in Django, SQLite-backed |
| `starter/node_api.js` | the same API in Node, no dependencies |

`starter/README.md` explains what to read in those two files: the idempotency key, PUT against PATCH,
the unique constraint on the seat, and `select_related` against the N+1.

## A note on the numbers

The case study is modeled on a real class of system, not on any named one.
Every requests-per-second, latency and cost figure in the tool is a teaching model
chosen to make a mechanism visible. It is not a measurement of any live system. The panels
say so where it matters.

## Copyright

Copyright (c) 2026 Ateneo de Manila University. Created for ITENT 45 at the
Loyola Schools. See `NOTICE.md` for the current licensing position: an MIT
release has been requested from the Ateneo Intellectual Property Office and is
not yet granted, so please hold off on redistributing.

Open it, use it, send students to it. That part needs no permission.

IBM Plex Sans and Mono come from Google Fonts under the SIL Open Font License and
are not covered by anything granted here.

---

Joseph Benjamin R. Ilagan · [BUILD Lab](https://github.com/jilagan), Ateneo de Manila University
