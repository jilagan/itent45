# Lesson library and its courses

Short interactive lessons on computational thinking and on how software works, built so that any course can use them. Three courses use them now:

| Course | Home page | Lessons |
|---|---|---|
| **ITENT 45**: Application Development and Emerging Technologies (Ateneo de Manila University) | `index.html`, `machine.html` | 43 established lessons |
| **ITENT 21**: Introduction to Computing for Technology Startups | `itent21.html` | 31 established lessons and the 10 computational thinking lessons |
| **CT**: Computational Thinking | `ct.html` | the 10 computational thinking lessons |

Open `library.html` to see every lesson by area.

**Live tool: https://jilagan.github.io/itent45/**

## Quick start

Download the repo, then run one command. Python 3.8 or newer is all you need.

    git clone https://github.com/jilagan/itent45.git
    cd itent45
    python3 start.py

That serves the tool at `localhost:8080` and opens it. The first lesson, "What is a server?", explains what that address means. Two other things to run:

| Command | What it does |
|---|---|
| `python3 start.py` | the lesson site (the ITENT 45 home pages, the lessons and the library) |
| `python3 start.py demo` | raw-socket server that prints every byte a client sends |
| `python3 start.py api` | the starter API from Breakout 2 |

On Windows use `python start.py`. Nothing to install for the first two.
`api` uses Django if you have it and Node otherwise. Add `--node` or `--django`
to choose. If a port is busy it takes the next free one.

No internet? The tool still works. It loads IBM Plex from Google Fonts when it
can and uses your system fonts when it cannot.

## The lessons

There are 53 lessons in seven areas. Each one is a page of its own, `lessons/<id>.html`, and works with no course around it. The tables below come from `python3 tools/panels.py`. Titles, descriptions, outcomes and topics are in `lessons/<id>/meta.json`, and `library.html` shows them by area.

### How a lesson is laid out

Each lesson is three to five steps shown one at a time, followed by a "Check your understanding" step that the platform adds. The head holds the title and one lede of at most 35 words.

- Step 1 is the everyday picture: an analogy of at most 60 words, a small picture or icon row that maps it to the technical terms, and a "Think first" question of at most 30 words.
- Each later step has at most 70 words of prose, one widget and one instruction for using it. New terms are marked `<dfn title="...">` and show their definition on hover or focus.
- Anything deeper sits in a closed `<details class="more">` called "More detail".
- The check step lists the lesson's three or four questions, then a collapsed "Key terms" list built from the `dfn` terms of the lesson.
- Group exercises (`break`) is the one lesson that is not divided into steps.

Icons are inline SVG from `shared/icons/*.svg`, written as `<use href="#i-name"/>`. Each role keeps one icon across lessons. `docs/CONVERSION-RECIPE.md` has the table.

### Web applications

| Lesson | Label | Opens with the heading |
|---|---|---|
| basics | What a server is | What is a server? |
| tiers | Three tiers | The three tiers of a web application |
| layers | Protocol layers | How network messages are layered (protocol layers) |
| journey | Round trips and latency | Why loading a page takes several round trips |
| bytes | HTTP messages | What an HTTP request and response look like |
| rest | HTTP verbs and status codes | HTTP verbs, URLs and status codes (REST) |
| clients | One API, many clients | One API for the web, iOS and Android |
| render | Server or browser rendering | Building the page: on the server or in the browser |
| pay | Payments and gateways | Online payments and payment gateways |

### Data and databases

| Lesson | Label | Opens with the heading |
|---|---|---|
| entity | Entities and attributes | Entities, attributes and instances |
| card | Relationships | Relationships: one-to-one, one-to-many, many-to-many |
| rea | The REA pattern | The REA pattern: resources, events and agents |
| sql | SQL basics | Reading and changing data with SQL |
| txn | Transactions | Transactions and two users changing the same data |
| norm | Normalization | Normalization: storing each fact once |
| query | The N+1 query problem | The N+1 query problem |
| shape | Relational or document | Choosing a relational or a document database |

### Capacity and cloud

| Lesson | Label | Opens with the heading |
|---|---|---|
| mem | Server memory | How a server's memory is used |
| server | Server capacity | Server capacity: workers, queues and requests per second |
| scale | Load balancers and scaling | Scaling out with a load balancer |
| enlist | Case study: enlistment | Case study: enlistment day |
| vm | Virtual machines and the cloud | Virtualization and what the cloud means |
| cost | CapEx and OpEx | Cloud cost: capital expenditure and operating expenditure |
| region | Regions and failover | Regions, availability zones and failover |

### Architecture

| Lesson | Label | Opens with the heading |
|---|---|---|
| split | Monolith or services | One application or many services? |

### Language models and AI

| Lesson | Label | Opens with the heading |
|---|---|---|
| intro | AI, ML and generative AI | AI, machine learning, deep learning and generative AI |
| next | Predicting the next word | How a language model writes: predicting the next word |
| learn | Training and test data | Training data and test data |
| train | How training works | Training: adjusting a model to reduce its errors |
| deep | Neural networks | Neural networks: combining several lines |
| backprop | Backpropagation | Backpropagation |
| tokens | Tokens | Tokens: how text is fed to a model |
| embed | Word embeddings | Word embeddings: how words get positions |
| vectors | Vectors and similarity | Vectors and similarity of meaning |
| rnn | Recurrent networks | Recurrent networks: the approach before transformers |
| attn | Attention and transformers | Attention and the transformer |
| ctx | The context window | The context window |
| prompt | Writing prompts | Writing better prompts |
| loop | AI agents | AI agents: the think, act and observe loop |
| tools | Tool calls and MCP | Tool calls and the Model Context Protocol (MCP) |
| vibe | Reviewing AI-written code | Reviewing AI-written code |
| math | The math behind it | The math behind it: vectors, slopes and probabilities |

### Computational thinking

| Lesson | Label | Opens with the heading |
|---|---|---|
| frame | Framing | Framing a problem |
| decompose | Breaking down | Breaking a task into parts |
| patterns | Spotting patterns | Spotting patterns |
| abstract | Abstraction | Abstraction and models |
| algorithm | Writing steps | Writing steps for a robot |
| rules | Decision rules | Decision rules and tables |
| sorting | Sorting and searching | Sorting and searching |
| routes | Shortest routes | Finding the shortest route |
| growth | How work grows | How work grows with the list |
| debug | Finding mistakes | Finding and fixing mistakes |

### Practice

| Lesson | Label | Opens with the heading |
|---|---|---|
| break | Group exercises | Group exercises |

## How the site is built

The pages are generated. Edit the sources, never the built pages.

| Path | What it holds |
|---|---|
| `lessons/<id>/lesson.html` | the lesson's markup: one `<section class="panel" id="p-ID">` |
| `lessons/<id>/lesson.js` | the lesson's widget code |
| `lessons/<id>/lesson.css` | optional: styles only this lesson uses, added to the page by `build.py` |
| `lessons/<id>/cyu.json` | check-your-understanding questions |
| `lessons/<id>/meta.json` | id, title, label, desc, 3 outcomes, tags, area, needs (libs), video |
| `lib/<name>.js` | code that two or more lessons share; `core.js` is on every page |
| `courses/<course>.json` | a course: title, code, vars, homes and their groups of lesson ids |
| `courses/library.json` | the areas of the library page and the order of lessons in each |
| `shared/` | `theme.css`, `lessons.css`, `widgets.css`, `platform.css`, `platform.js`, `course.js`, `analytics.js`, `analytics.json`, `icons/`, `art/` |
| `tools/` | `check.py`, `new_lesson.py`, `panels.py`, `make_art.py`, `equiv.py`, `shots.py`, `migrate_to_library.py` |

What `python3 build.py` writes:

| Output | What it is |
|---|---|
| `lessons/<id>.html` | one standalone page per lesson, with its libs, style and platform inlined |
| `courses/<course>.js` | the course data a lesson page loads for `?c=<course>` |
| `index.html`, `machine.html` | the two ITENT 45 home pages (title, intro, Start button, lesson links) |
| `library.html` | every lesson by area, with outcomes and a note on assembling a course |
| `embed.html` | embed snippets for every lesson and step, with a course selector |
| `art/` | the scene pictures |

Build and check:

    python3 build.py                      # writes into this folder
    python3 build.py --out /tmp/x         # writes somewhere else
    python3 tools/check.py /tmp/x         # opens every lesson alone, with ?c=, over http; clicks every step and control
    python3 tools/check.py /tmp/x --embed # also opens every step in the Canvas view
    python3 tools/new_lesson.py ID --area web --title "..." --label "..."   # scaffold a lesson

`check.py` needs Playwright and Chrome. Run `python3 build.py` before publishing, because GitHub Pages serves the built files. Each lesson page is about 180 to 220 KB. `build.py` stops if one passes 300 KB.

To add a lesson, run `tools/new_lesson.py`, write the four files (`docs/AUTHORING.md`), build and check.
To add a course, copy `courses/ct.json` (one home page) or `courses/itent45.json` (two) to `courses/<name>.json`, change the title, code, vars and groups, and build. The course gets home pages, a lesson list on every lesson page that uses `?c=<name>`, visited ticks and a Next lesson button. Its home page file names must differ from every other course's.

## Addresses

    lessons/rest.html                      the lesson alone, step 1, a slim header with a link to the library
    lessons/rest.html#status-codes         one step of the lesson
    lessons/rest.html?c=itent45            with that course's lesson list, home link, visited ticks and Next lesson
    lessons/rest.html?instructor=1         shows the instructor notes
    lessons/rest.html?theme=dark           starts in the dark theme
    index.html, itent21.html, ct.html      course home pages

`instructor`, `theme`, `cyu`, `video`, `notrack` and `gadebug` follow the student from page to page. Old addresses such as `index.html#tiers`, `index.html#tiers/trace` and `machine.html#next` still work. They send the browser to the lesson page, keep every option and add `?c=itent45`.

A lesson shows a numbered step strip and Back and Next buttons. The last step is always "Check your understanding". Course words are filled from the course's `vars`. The default for `project` is "project". ITENT 45 sets it to "capstone project".

## Embed mode

Add `?embed=1` to a lesson address. The rail and header are hidden and the shortcuts are off.

    lessons/rest.html?embed=1                the whole lesson, with its step strip
    lessons/rest.html?embed=1#status-codes   one step, no strip
    ...&cyu=0                               hide the questions
    ...&video=0                             hide the video

In a single-step view the lesson title is small above the step title, and the introduction shows only with
the first step. Links to other lessons open in a new tab. Each embed ends with an
"Open full lesson" link. The page posts its height to the parent as
`{type:"lesson:height", lesson, height, fid}` (and `{type:"itent45:height", height, fid}` for older embeds). A normal Canvas page ignores it, so set the iframe height by hand.

`embed.html` lists every lesson and step with its embed URL and an iframe snippet. It has a base-URL field at the top
(default `https://jilagan.github.io/itent45/`) that rewrites every snippet and link, a course selector that adds `&c=<course>`
(off by default) and a Copy button on each snippet. Each lesson has a whole-lesson snippet. The links work after the branch is published.

## Embedding in Canvas

1. Open `embed.html` (from the published site) and copy the snippet for the lesson or step.
2. In the Canvas Rich Content Editor, switch to the HTML view and paste the snippet.
3. Canvas cannot auto-resize plain iframes, so every snippet has a fixed height. Check it on the live page and change `height` if the content is cut off or leaves a gap.
4. Test it on the university's Canvas before the term starts. Some Canvas instances restrict which iframe sources are allowed, and `jilagan.github.io` may have to be added by the Canvas administrators. Put a plain link to the full site under each frame in case it is blocked.

## Analytics

The site can report to Google Analytics 4. It is off until you add a measurement ID.

Open `shared/analytics.json` and put the ID in `ga4`, for example `{"ga4":"G-ABC123XYZ9", "debug":false}`. Run `python3 build.py` and publish. With an empty `ga4` the pages make no analytics request and set nothing in the browser.

Tracking is also off when the page is opened from a file, when the address has `?notrack=1` (the browser remembers this for the rest of the tab session), and when the browser sends Do Not Track. Instructor mode (`?instructor=1`) still tracks, with `instructor` set to true.

In the GA4 stream settings, switch off "Page changes based on browser history events" and "Outbound clicks" under Enhanced measurement. The site sends both itself, and leaving them on counts them twice.

Events. Every event also carries `module` (the lesson's area: web, data, capacity-cloud, architecture, ai or practice), `course` (the `?c=` value, or `none`), `lesson_id`, `panel_id` (the same value as `lesson_id`, kept so older reports still work), `embedded` and `instructor` (true or false). `page_title` is "lesson title / step title".

| Event | When | Parameters |
|---|---|---|
| `page_view` | a lesson or one of its steps is shown, once per view (a lesson with five steps and the check step gives one per step) | `page_title`, `page_location`, `panel_id`, `section_id` |
| `select_content` | a click on the lesson list or on a step in the step strip | `content_type` (lesson or section), `item_id` |
| `widget_click` | a button, slider, menu or checkbox in a panel, not the questions | `panel_id`, `section_id`, `control`, `control_type` |
| `cyu_answer` | a question is checked | `panel_id`, `section_id`, `item_id`, `item_type`, `correct`, `attempt` |
| `cyu_complete` | every question in a panel is answered correctly | `panel_id`, `item_count`, `attempts` |
| `video_start` | a video is played | `panel_id`, `section_id`, `video_id` |
| `click` | a link that leaves the site, including "Open full lesson" in an embed and lesson links in an embed | `outbound` (true), `link_url`, `link_domain`, `link_text`, `panel_id` |
| `panel_time` | the reader leaves a lesson step, or the tab is hidden or closed | `panel_id`, `section_id`, `seconds` (visible time only) |

Sliders send at most one `widget_click` per control every 2 seconds. Nothing a student types is sent.

Register these custom dimensions in GA4 (Admin, Custom definitions, Create custom dimension, scope Event, use the parameter name as the event parameter): `lesson_id`, `course`, `panel_id`, `section_id`, `module`, `embedded`, `instructor`, `item_id`, `correct`, `control`. They show in reports and Explorations about 24 hours after registration. Register `seconds` as a custom metric (unit: seconds) to report time on panel.

To leave out the instructor's visits, add a filter `instructor` does not exactly match `true` to a report or Exploration, or build a segment that excludes events where `instructor` is `true`. GA4 data filters cannot filter on this parameter.

For testing, set `"debug":true` in `analytics.json` or add `?gadebug=1` to the address. Each event is then written to the browser console as a table row and appears in GA4 DebugView.

In Canvas the pages run as third-party iframes, so the analytics cookie is set with `SameSite=None;Secure`. Browsers that block third-party cookies (Safari, Firefox in strict mode, some Chrome settings) give a returning student a new identity on every visit in an embed. Users counts then run high in embeds. Event counts stay correct.

## Scene pictures

Step 1 of every lesson except Group exercises has a picture, set on the `.scene` element with `data-art="slug"` and `data-art-desc="one sentence"`. The sentence is the alt text and the prompt for the image model. A slug that appears in two lessons must carry the same sentence in both. `docs/ART-STYLE.md` has the style rules and the model details.

    python3 tools/make_art.py --dry-run      # lists every scene, the prompt and the cost, writes nothing
    python3 tools/make_art.py --anchor <slug> --candidates 4    # pick the style anchor first
    python3 tools/make_art.py                # generates the rest with Nano Banana 2.1 on Replicate

It needs a `REPLICATE_API_TOKEN`. Originals go to `art-src/` (not committed) and the 1200 px web files to `shared/art/<slug>.webp`. `build.py` copies them to `art/` and lists them in each lesson page's `LESSON.art`. A scene with no file keeps the icon row, so the site works before any picture exists. The 49 pictures are generated.

## Questions

Each lesson has `lessons/<id>/cyu.json`. Items are `mc` (one answer), `multi` (several answers)
or `predict` (a prediction, then a `try` line that points at the widget). Each option has `text`, `correct`
and `feedback`. An item with `sec` set to a step slug appears at the end of that step.
An item with `sec` null appears in the final "Check your understanding" step. A step holds at most one item of its own. A lesson has three or four items in all. Backticks in text become `code`. Nothing is stored
and nothing is sent. The score line counts only the current visit.

## Videos

The `video` field of `lessons/<id>/meta.json` is one slot or a list of slots: `sec` (or null), `youtube`, `title`, `about`.
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
| `lessons/*.html`, `index.html`, `machine.html`, `library.html` | the built site, no dependencies |
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
