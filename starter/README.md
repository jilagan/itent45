# Starter API

The endpoints from Breakout 2, working. Two files, same design, different
languages — the two stacks panel 01 lets you toggle between.

| File | Run it | State |
|---|---|---|
| `django_api.py` | `pip install django` → `python3 django_api.py migrate` → `python3 django_api.py runserver` | SQLite, survives restarts |
| `node_api.js` | `node node_api.js` | in memory, resets on restart |

Both listen on port 8000 and seed the same three courses.

## The endpoints

```
GET    /api/courses                 list
POST   /api/courses                 create                  201 + Location
GET    /api/courses/{code}          fetch one               404 if absent
PUT    /api/courses/{code}          replace every field
PATCH  /api/courses/{code}          change only what you sent
DELETE /api/courses/{code}          remove                  204

GET    /api/enrollments?student=    list, one query not N+1
POST   /api/enrollments             enrol                   201, or 409
DELETE /api/enrollments/{id}        drop                    204, then 404
```

## Things in here worth reading rather than running

**Idempotency-Key on POST /enrollments.** Send the same enrolment twice with
the same key and the second one returns `200` with the *first* result instead
of enrolling again. Without a key you get `201` then `409`. That is panel 07,
and the header is the entire fix.

```bash
curl -X POST localhost:8000/api/enrollments \
     -H 'Content-Type: application/json' \
     -H 'Idempotency-Key: abc-123' \
     -d '{"student":"20-1234","code":"ITENT 45"}'
```

**PUT versus PATCH.** `PUT /api/courses/ITMGT%2025` with a body of only
`{"slots":7}` blanks the title, because you asked for a replacement and did
not supply one. `PATCH` with the same body changes `slots` and leaves the rest
alone. Run both and look at what comes back.

**The unique constraint.** In `django_api.py` a database constraint stops one
student holding two seats in the same course. In `node_api.js` nothing does,
so the check is a line of application code — which is fine until two requests
arrive at once and both pass the check before either writes. That is the
enlistment seat race from panel 11, and it is why the constraint belongs in
the database.

**`select_related("course")`.** One query for the enrolment list instead of one
per row. Take it out and watch panel 10's N+1 number happen to you.

**Malformed input does not kill the process.** `node_api.js` returns `400` on a
broken percent-escape and `500` on an unexpected throw, and keeps serving. The
first version of this file crashed the whole server on a bad URL, which is a
good illustration of why panel 05 separates *your fault* from *their fault*.

## What is deliberately missing

No authentication, no pagination, no rate limiting, and the Node version has no
persistence. Those are the obvious next things, and an agent will write any of
them for you in seconds. The point of this file is to be small enough that you
can hold all of it in your head while you decide whether what the agent hands
back is right.
