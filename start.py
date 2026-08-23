#!/usr/bin/env python3
"""
ITENT 45 - one command to run everything.

    python3 start.py            the teaching tool in your browser
    python3 start.py demo       the raw-socket server, for reading HTTP bytes
    python3 start.py api        the starter API from Breakout 2

Nothing to install for the first two. Python 3.8 or newer, that is all.
On Windows use `python start.py` instead of `python3`.
"""
import argparse
import http.server
import os
import shutil
import socket
import socketserver
import subprocess
import sys
import threading
import webbrowser

HERE = os.path.dirname(os.path.abspath(__file__))
BOLD, DIM, OFF = "\033[1m", "\033[2m", "\033[0m"
if os.name == "nt" and not os.environ.get("WT_SESSION"):
    BOLD = DIM = OFF = ""          # old Windows consoles show the codes literally


def say(msg=""):
    print(msg, flush=True)


def free_port(preferred):
    """Take the preferred port if it is free, otherwise the next one that is."""
    for port in range(preferred, preferred + 20):
        with socket.socket() as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    raise SystemExit(f"No free port between {preferred} and {preferred + 19}.")


# --------------------------------------------------------------- the tool
def run_tool(open_browser=True):
    index = os.path.join(HERE, "index.html")
    if not os.path.exists(index):
        raise SystemExit("index.html is missing. Are you in the right folder?")

    port = free_port(8080)
    url = f"http://localhost:{port}/index.html"

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=HERE, **kw)

        def log_message(self, *a):
            pass                     # a running log would drown the instructions

    say()
    say(f"  {BOLD}Under the Hood{OFF}  is running at  {BOLD}{url}{OFF}")
    say()
    say(f"  {DIM}21 panels across four modules. Keys 0-9, then q h m s p e v c r o b.{OFF}")
    say()
    say(f"  {DIM}Serving over HTTP rather than opening the file directly, so you")
    say(f"  can point curl at it and see the same bytes panel 04 talks about:{OFF}")
    say(f"      curl -I {url}")
    say()
    say(f"  {DIM}Ctrl-C to stop.{OFF}")
    say()

    if open_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()

    with socketserver.TCPServer(("127.0.0.1", port), Handler) as httpd:
        httpd.allow_reuse_address = True
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            say("\n  stopped.\n")


# --------------------------------------------------------------- the demo
def run_demo():
    script = os.path.join(HERE, "teaching_server.py")
    if not os.path.exists(script):
        raise SystemExit("teaching_server.py is missing.")
    say()
    say(f"  {BOLD}Raw-socket demo server{OFF} on http://localhost:8080")
    say()
    say(f"  {DIM}Every byte a client sends gets printed below. In a second terminal:{OFF}")
    say("      curl http://localhost:8080/courses")
    say("      curl -v http://localhost:8080/courses")
    say("      curl -X POST http://localhost:8080/enrollments -d '{\"code\":\"ITENT 45\"}'")
    say()
    subprocess.call([sys.executable, script])


# --------------------------------------------------------------- the API
def has_django():
    try:
        import django  # noqa: F401
        return True
    except ImportError:
        return False


def run_api(prefer):
    starter = os.path.join(HERE, "starter")
    node = shutil.which("node")

    use = prefer
    if use is None:
        use = "django" if has_django() else ("node" if node else None)

    if use == "django" and not has_django():
        raise SystemExit("Django is not installed. Run:  pip install django")
    if use == "node" and not node:
        raise SystemExit("Node is not installed. Get it from https://nodejs.org")
    if use is None:
        say()
        say(f"  {BOLD}Neither Django nor Node is available.{OFF}")
        say()
        say("  Pick whichever is easier for you:")
        say(f"      {DIM}pip install django{OFF}     then  python3 start.py api")
        say(f"      {DIM}install Node{OFF}           then  python3 start.py api")
        say()
        raise SystemExit(1)

    if use == "django":
        db = os.path.join(starter, "itent45.sqlite3")
        script = os.path.join(starter, "django_api.py")
        if not os.path.exists(db):
            say(f"  {DIM}first run: creating the database and seeding three courses{OFF}")
            subprocess.call([sys.executable, script, "migrate"])
        say()
        say(f"  {BOLD}Starter API (Django){OFF} on http://localhost:8000")
        _api_hints()
        subprocess.call([sys.executable, script, "runserver", "8000", "--noreload"])
    else:
        say()
        say(f"  {BOLD}Starter API (Node){OFF} on http://localhost:8000")
        say(f"  {DIM}State is in memory here, so it resets when you stop it.{OFF}")
        _api_hints()
        subprocess.call([node, os.path.join(starter, "node_api.js")])


def _api_hints():
    say()
    say(f"  {DIM}Send the same enrolment twice with one key, then twice without:{OFF}")
    say("      curl localhost:8000/api/courses")
    say("      curl -X POST localhost:8000/api/enrollments \\")
    say("           -H 'Content-Type: application/json' \\")
    say("           -H 'Idempotency-Key: abc-123' \\")
    say("           -d '{\"student\":\"20-1234\",\"code\":\"ITENT 45\"}'")
    say()
    say(f"  {DIM}201 then 200 with the key. 201 then 409 without. That is panel 07.{OFF}")
    say()


# --------------------------------------------------------------- entry
def main():
    ap = argparse.ArgumentParser(
        description="Run the ITENT 45 teaching tool and starter code.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="examples:\n"
               "  python3 start.py            open the tool\n"
               "  python3 start.py demo       raw HTTP server, prints every byte\n"
               "  python3 start.py api        starter API from Breakout 2\n"
               "  python3 start.py api --node force the Node version\n")
    ap.add_argument("what", nargs="?", default="tool",
                    choices=["tool", "demo", "api"],
                    help="what to run (default: tool)")
    ap.add_argument("--node", action="store_true", help="force the Node starter")
    ap.add_argument("--django", action="store_true", help="force the Django starter")
    ap.add_argument("--no-browser", action="store_true",
                    help="do not open a browser window")
    args = ap.parse_args()

    if sys.version_info < (3, 8):
        raise SystemExit("This needs Python 3.8 or newer.")

    if args.what == "tool":
        run_tool(open_browser=not args.no_browser)
    elif args.what == "demo":
        run_demo()
    else:
        prefer = "node" if args.node else "django" if args.django else None
        run_api(prefer)


if __name__ == "__main__":
    main()
