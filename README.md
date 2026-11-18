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

### Module 2 (machine.html)

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

## Embed mode

Add `?embed=1` to any address. The rail is hidden and the shortcuts are off.

    index.html?embed=1#rest                 the whole panel, with its section tabs
    index.html?embed=1#rest/status-codes    one section, no tabs
    ...&cyu=0                               hide the questions
    ...&video=0                             hide the video

In a section view the panel title is small above the section title, and the introduction shows only with
the first section. Links to other panels open the full site in a new tab. Each embed ends with an
"Open full site" link. The page posts its height to the parent as
`{type:"itent45:height", height, fid}`. A normal Canvas page ignores it, so set the iframe height by hand.

`embed.html` lists every panel and section with its embed URL and an iframe snippet. It has a base-URL field at the top
(default `https://jilagan.github.io/itent45/`) that rewrites every snippet and link, and a Copy button on each snippet.
Each panel has a whole-panel snippet. The links work after the branch is published.

## Embedding in Canvas

1. Open `embed.html` (from the published site) and copy the snippet for the panel or section.
2. In the Canvas Rich Content Editor, switch to the HTML view and paste the snippet.
3. Canvas cannot auto-resize plain iframes, so every snippet has a fixed height. Check it on the live page and change `height` if the content is cut off or leaves a gap.
4. Test it on the university's Canvas before the term starts. Some Canvas instances restrict which iframe sources are allowed, and `jilagan.github.io` may have to be added by the Canvas administrators. Put a plain link to the full site under each frame in case it is blocked.

## Analytics

The site can report to Google Analytics 4. It is off until you add a measurement ID.

Open `src/shared/analytics.json` and put the ID in `ga4`, for example `{"ga4":"G-ABC123XYZ9", "debug":false}`. Run `python3 build.py` and publish. With an empty `ga4` the pages make no analytics request and set nothing in the browser.

Tracking is also off when the page is opened from a file, when the address has `?notrack=1` (the browser remembers this for the rest of the tab session), and when the browser sends Do Not Track. Instructor mode (`?instructor=1`) still tracks, with `instructor` set to true.

In the GA4 stream settings, switch off "Page changes based on browser history events" and "Outbound clicks" under Enhanced measurement. The site sends both itself, and leaving them on counts them twice.

Events. Every event also carries `module` (index or machine), `embedded` and `instructor` (true or false).

| Event | When | Parameters |
|---|---|---|
| `page_view` | a panel or section is shown, once per view | `page_title`, `page_location`, `panel_id`, `section_id` |
| `select_content` | a click on the rail or a section tab | `content_type` (panel or section), `item_id` |
| `widget_click` | a button, slider, menu or checkbox in a panel, not the questions | `panel_id`, `section_id`, `control`, `control_type` |
| `cyu_answer` | a question is checked | `panel_id`, `section_id`, `item_id`, `item_type`, `correct`, `attempt` |
| `cyu_complete` | every question in a panel is answered correctly | `panel_id`, `item_count`, `attempts` |
| `video_start` | a video is played | `panel_id`, `section_id`, `video_id` |
| `click` | a link that leaves the site, including "Open full site" in an embed | `outbound` (true), `link_url`, `link_domain`, `link_text`, `panel_id` |
| `panel_time` | the reader leaves a panel or section, or the tab is hidden or closed | `panel_id`, `section_id`, `seconds` (visible time only) |

Sliders send at most one `widget_click` per control every 2 seconds. Nothing a student types is sent.

Register these custom dimensions in GA4 (Admin, Custom definitions, Create custom dimension, scope Event, use the parameter name as the event parameter): `panel_id`, `section_id`, `module`, `embedded`, `instructor`, `item_id`, `correct`, `control`. They show in reports and Explorations about 24 hours after registration. Register `seconds` as a custom metric (unit: seconds) to report time on panel.

To leave out the instructor's visits, add a filter `instructor` does not exactly match `true` to a report or Exploration, or build a segment that excludes events where `instructor` is `true`. GA4 data filters cannot filter on this parameter.

For testing, set `"debug":true` in `analytics.json` or add `?gadebug=1` to the address. Each event is then written to the browser console as a table row and appears in GA4 DebugView.

In Canvas the pages run as third-party iframes, so the analytics cookie is set with `SameSite=None;Secure`. Browsers that block third-party cookies (Safari, Firefox in strict mode, some Chrome settings) give a returning student a new identity on every visit in an embed. Users counts then run high in embeds. Event counts stay correct.

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
