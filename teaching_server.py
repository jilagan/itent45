#!/usr/bin/env python3
"""
ITENT 45 - Module 1 live demo server.

No framework, no library. Just a socket, so students can see that an HTTP
server is a program that reads text off a connection and writes text back.

    python3 teaching_server.py

Then, in a second terminal, work down this list on the projector:

    1.  curl http://localhost:8080/courses
    2.  curl -v http://localhost:8080/courses          # see request AND response headers
    3.  curl -X POST http://localhost:8080/enrollments -d '{"code":"ITENT 45"}'
    4.  curl http://localhost:8080/slow                # 2s handler - watch it block
    5.  curl http://localhost:8080/nope                # 404
    6.  Open http://localhost:8080/ in a browser       # look at how many headers it sends

The point to land: the terminal running this server prints the *exact bytes*
the client sent. Nothing is hidden.
"""

import socket
import json
import time
import threading

HOST, PORT = "127.0.0.1", 8080
BACKLOG = 64          # the queue depth from the simulator
SEQ = 0               # request counter, for the log

BOLD, DIM, AMBER, TEAL, RED, OFF = (
    "\033[1m", "\033[2m", "\033[38;5;214m", "\033[38;5;44m", "\033[38;5;203m", "\033[0m"
)


def route(method, path, body):
    """Return (status, reason, headers, body). The only 'application' code here."""
    if path.startswith("/courses"):
        payload = {"courses": [
            {"code": "ITENT 45", "title": "Application Development and Emerging Technologies", "units": 3},
            {"code": "CSCI 21", "title": "Data Structures", "units": 3},
        ]}
        return 200, "OK", {}, json.dumps(payload)

    if path.startswith("/enrollments") and method == "POST":
        try:
            sent = json.loads(body) if body else {}
        except json.JSONDecodeError:
            return 400, "Bad Request", {}, json.dumps({"error": "invalid_json"})
        out = {"id": 8891, "code": sent.get("code", "?"), "status": "enrolled"}
        return 201, "Created", {"Location": "/enrollments/8891"}, json.dumps(out)

    if path.startswith("/slow"):
        # Blocks this worker for 2s. With one thread, a second request just waits.
        time.sleep(2)
        return 200, "OK", {}, json.dumps({"note": "that took 2000ms of handler time"})

    if path == "/":
        html = (
            "<!doctype html><meta charset=utf-8>"
            "<title>ITENT 45</title>"
            "<body style='font:16px system-ui;padding:3rem;max-width:40rem'>"
            "<h1>It's just text over a socket.</h1>"
            "<p>Check the terminal running this server. Every header your browser "
            "sent is printed there.</p>"
            "<p><a href='/courses'>/courses</a> &middot; "
            "<a href='/slow'>/slow</a> &middot; "
            "<a href='/nope'>/nope</a></p></body>"
        )
        return 200, "OK", {"Content-Type": "text/html; charset=utf-8"}, html

    return 404, "Not Found", {}, json.dumps({"error": "not_found", "path": path})


def handle(conn, addr):
    global SEQ
    SEQ += 1
    n = SEQ
    started = time.time()
    try:
        raw = conn.recv(65536).decode("utf-8", "replace")
        if not raw:
            return

        head, sep, body = raw.partition("\r\n\r\n")

        print(f"\n{AMBER}{BOLD}┌─ #{n}  request from {addr[0]}:{addr[1]}{OFF}")
        for line in head.split("\r\n"):
            print(f"{AMBER}│{OFF} {line}")
        if sep:
            print(f"{AMBER}│{OFF} {DIM}(blank line — headers end, body begins){OFF}")
        if body:
            print(f"{AMBER}│{OFF} {body}")

        request_line = head.split("\r\n")[0]
        try:
            method, path, _version = request_line.split(" ")
        except ValueError:
            method, path = "GET", "/"

        status, reason, extra, payload = route(method, path, body)

        headers = {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": str(len(payload.encode())),
            "Connection": "close",
            "Server": "itent45-demo",
        }
        headers.update(extra)
        headers["Content-Length"] = str(len(payload.encode()))

        response = f"HTTP/1.1 {status} {reason}\r\n"
        response += "".join(f"{k}: {v}\r\n" for k, v in headers.items())
        response += "\r\n" + payload

        conn.sendall(response.encode())

        ms = (time.time() - started) * 1000
        colour = TEAL if status < 400 else RED
        print(f"{colour}└─ #{n}  {status} {reason} · {len(payload.encode())} B · {ms:.0f} ms{OFF}")

    except Exception as exc:  # noqa: BLE001 - teaching server, show the error
        print(f"{RED}└─ #{n}  handler error: {exc}{OFF}")
    finally:
        conn.close()


def main():
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind((HOST, PORT))
    srv.listen(BACKLOG)

    print(f"{TEAL}{BOLD}listening on http://{HOST}:{PORT}{OFF}")
    print(f"{DIM}backlog={BACKLOG} · single-threaded by default · ctrl-c to stop{OFF}")
    print(f"{DIM}try:  curl -v http://{HOST}:{PORT}/courses{OFF}")

    # Set THREADED = True to show how a worker pool changes the /slow demo.
    THREADED = False

    try:
        while True:
            conn, addr = srv.accept()
            if THREADED:
                threading.Thread(target=handle, args=(conn, addr), daemon=True).start()
            else:
                handle(conn, addr)
    except KeyboardInterrupt:
        print(f"\n{DIM}stopped after {SEQ} requests{OFF}")
    finally:
        srv.close()


if __name__ == "__main__":
    main()
