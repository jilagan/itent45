# ITENT 45 — Under the Hood

Teaching materials for **ITENT 45: Application Development and Emerging Technologies**
(Ateneo de Manila University, John Gokongwei School of Management).

**Live tool → https://jilagan.github.io/itent45/**

## Quick start

Download the repo, then one command. Python 3.8 or newer is all you need.

    git clone https://github.com/jilagan/itent45.git
    cd itent45
    python3 start.py

That serves the tool at `localhost:8080` and opens it. Panel 00 explains what that address means, which is worth reading before panel 01 if the word *server* has always been slightly vague. Two other things to run:

| Command | What it does |
|---|---|
| `python3 start.py` | the teaching tool, 24 panels |
| `python3 start.py demo` | raw-socket server that prints every byte a client sends |
| `python3 start.py api` | the starter API from Breakout 2 |

On Windows use `python start.py`. Nothing to install for the first two.
`api` uses Django if you have it and Node otherwise; add `--node` or `--django`
to choose. If a port is busy it takes the next free one.

No internet? The tool still works. It pulls IBM Plex from Google Fonts when it
can and falls back to your system fonts when it cannot, so it looks slightly
different offline and behaves identically.

## The panels

Grouped by syllabus module: **1** anatomy (00–08), **4** capacity and cloud (09–10, 14–16),
**6** architecture (11–13), **5** data (17–19).

| # | Panel | Covers |
|---|---|---|
| 00 | What is a server? | The word, ports, loopback vs private vs public addresses, and why your laptop cannot host the capstone |
| 01 | What a web app is | Three tiers, a 12-step trace, DOM and rendered views, Django/Express/Laravel toggle |
| 02 | Layers & envelopes | Encapsulation, and one reply cut into packets, sent and reassembled |
| 03 | The round trip | Latency, five round trips before your code runs |
| 04 | The actual bytes | Raw HTTP, plus the copyable setup for running the server yourself |
| 05 | Verbs & REST | Live table you fire requests at, safe vs idempotent, request granularity, 18 status codes |
| 06 | One API, many clients | Web/iOS/Android against one backend, version drift, the server-rendered counterexample |
| 07 | Who builds the page | Server-rendered vs single-page, and JSON against XML against HTML measured in bytes |
| 08 | Checkout & payments | Four-party flow, the card bypass, idempotency keys, and why the flow is JSON |
| 09 | What the words mean | Entity, attribute or instance, sorted as a drill |
| 10 | Relationships | Cardinality, and how 1:1, 1:M and M:N each decide your tables |
| 11 | A pattern that repeats | REA and universal data models: the same six boxes in four domains |
| 12 | One table or many? | Normalising, and the same fact written down in forty places |
| 13 | What one query costs | The loop that looks innocent, and the N+1 |
| 14 | Rows or documents? | Structured against unstructured, and where the schema is enforced |
| 15 | Past one box | Vertical vs horizontal, load balancing, the moving bottleneck |
| 16 | Case: enlistment | Enlistment day, and why the cloud migration did not fix it |
| 17 | Whose computer is it? | Virtualisation, provisioning console, the five NIST characteristics |
| 18 | Paying for it | CapEx vs OpEx, the provisioning curve, TCO |
| 19 | Regions & failover | World map, great-circle latency, RTO and RPO |
| 20 | One app or many? | Monolith vs microservices, the crossover, and what chatter costs |
| 21 | Breakouts | Timer, roles, seven scenario cards |


Keyboard: `0`–`9` for the first ten, then `c` relationships, `a` the REA pattern,
`n` normalising, `q` query cost, `h` shapes, `m` memory, `s` inside the server,
`p` past one box, `e` enlistment, `v` virtualisation, `k` cost, `r` regions,
`o` one app or many, `b` breakouts.
## What is in here

| Path | What it is |
|---|---|
| `index.html` | the tool. 24 panels, one file, no build, no dependencies |
| `start.py` | runs any of the three things below |
| `teaching_server.py` | raw sockets, prints the exact bytes a client sent |
| `starter/django_api.py` | the Breakout 2 API in Django, SQLite-backed |
| `starter/node_api.js` | the same API in Node, no dependencies |

`starter/README.md` explains what in those two files is worth reading rather
than running: the idempotency key, PUT against PATCH, the unique constraint on
the seat, and `select_related` against the N+1.

## Facilitator notes

The two-session plan, the single-session cut, and the what-to-listen-for notes
live in a separate private repository, because they contain the breakout answers.
Email jbilagan@ateneo.edu if you are teaching this and want them.

## A note on the numbers

The case study is modelled on a real class of system, not on any named one.
Every requests-per-second, latency and cost figure in the tool is a teaching model
chosen to make a mechanism visible, not a measurement of any live system. The panels
say so where it matters, and knowing where a model stops being true is one of the
things the session is trying to teach.

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
