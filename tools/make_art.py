#!/usr/bin/env python3
"""Generate the step-1 scene pictures with Google's Nano Banana 2.1 on Replicate.
   Standard library only (urllib). Style rules and the reasoning are in docs/ART-STYLE.md.

   export REPLICATE_API_TOKEN=...            (read from the environment, never printed)
   python3 tools/make_art.py --dry-run                      prompts and planned cost, no API calls
   python3 tools/make_art.py --anchor restaurant-tiers      make the style anchor, then stop so you can look at it
   python3 tools/make_art.py --anchor restaurant-tiers      run again: anchor exists, so it is the reference for every other scene
   python3 tools/make_art.py --only a,b --candidates 3      3 options per scene: art-src/a-1.png ... a-3.png
   python3 tools/make_art.py --pick a:2                     promote art-src/a-2.png to the final picture for a (no API call)
   python3 tools/make_art.py --force                        regenerate even where a picture exists

   Reads data-art="slug" and data-art-desc="sentence" from src/*/panels/*.html.
   Originals (PNG) go to art-src/<slug>.png (git-ignored). Web versions go to src/shared/art/<slug>.webp, 1200 px wide, quality 80."""
import argparse, html, io, json, os, pathlib, re, shutil, subprocess, sys, time, urllib.error, urllib.request, uuid

ROOT = pathlib.Path(__file__).resolve().parent.parent
MODEL = "google/nano-banana-2.1"
API = "https://api.replicate.com/v1"
PRICE = {"1K": 0.0336, "2K": 0.0504, "4K": 0.1134}     # USD per output image, replicate.com/google/nano-banana-2.1 (read 2026-11-18)
WEB_W, WEB_Q = 1200, 80

# ---- the prompt template (identical for every scene; keep in step with docs/ART-STYLE.md) ----
STYLE = (
    "Flat vector spot illustration for a university textbook, as drawn by a professional editorial illustrator. "
    "Solid flat shapes with one consistent dark ink outline of the same medium weight on every object. "
    "Palette limited to: ink #1A1D21 for outlines, blue #0B4A8F, orange #B4491B, a light grey tint #E6E9ED, a mid grey tint #B7BEC8, and a plain white background. "
    "No gradients, no shading, no shadows except a single flat grey ground line, no glow, no texture, no 3D, no depth of field. "
    "Side-on or three-quarter view, eye-level camera, the same horizon line two thirds of the way down the picture, "
    "figures about one third of the picture height. One clear action. At most four people. "
    "People are simple and natural in proportion, with plain faces (a dot for each eye at most) and normal hands. "
    "Filipino everyday setting, drawn respectfully and without caricature. "
    "Generous empty white space around a compact scene. Landscape 3:2. "
    "The picture contains no text of any kind: no letters, numbers, logos, brand marks, signs or labels."
)
NEGATIVE = (
    "Avoid: text, letters, numbers, logos, watermarks, gibberish signage, gradients, glow, lens flare, bokeh, glossy or plastic surfaces, "
    "3D rendering, photorealism, painterly or paper texture, sketchy or varying line weight, extra or fused fingers, extra limbs, "
    "melted or impossible objects, dramatic lighting, decorative swirls or borders, symmetrical stock-photo composition, "
    "crowds, busy backgrounds, stereotyped or exaggerated faces."
)
REF_NOTE = ("The first reference image is the style anchor. Match its line weight, palette, figure style, scale, horizon height and level of detail exactly. "
            "Do not copy its subject, composition or props: no wall fan, no pitcher, no pencil cup unless the scene below names them. "
            "Keep the background plain and nearly empty.")

def build_prompt(desc, with_ref):
    parts = [STYLE, "Scene: " + desc.strip().rstrip(".") + ".", NEGATIVE]
    if with_ref: parts.insert(1, REF_NOTE)
    return "\n\n".join(parts)

# ---- reading the scenes from the panels ----
def find_scenes(src):
    scenes, warns = {}, []
    for f in sorted(src.glob("*/panels/*.html")):
        for tag in re.findall(r"<[a-zA-Z][^>]*\bdata-art=[^>]*>", f.read_text(encoding="utf-8")):
            a = {k: html.unescape(v) for k, v in re.findall(r'([\w-]+)="([^"]*)"', tag)}
            slug, desc = a.get("data-art", "").strip(), " ".join(a.get("data-art-desc", "").split())
            rel = str(f.relative_to(ROOT)) if f.is_relative_to(ROOT) else str(f)
            if not re.fullmatch(r"[A-Za-z0-9_-]+", slug): warns.append(f"{rel}: bad slug {slug!r}"); continue
            if not desc: warns.append(f"{rel}: slug {slug} has no data-art-desc"); continue
            if slug in scenes:
                if scenes[slug]["desc"] != desc: warns.append(f"slug {slug} has different descriptions: {scenes[slug]['file']} and {rel} (using the first)")
                continue
            scenes[slug] = {"desc": desc, "file": rel}
    return scenes, warns

# ---- Replicate HTTP ----
class ApiError(Exception): pass
def _req(method, url, token, data=None, headers=None, tries=6):
    h = {"Authorization": "Bearer " + token, "User-Agent": "itent45-make-art"}; h.update(headers or {})
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=h, method=method), timeout=120) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")[:300]
            if e.code == 429 and i < tries - 1:
                try: wait = float(json.loads(body).get("retry_after", 5))
                except Exception: wait = 5
                time.sleep(wait + 1); continue
            if e.code >= 500 and i < tries - 1: time.sleep(3 * (i + 1)); continue
            raise ApiError(f"HTTP {e.code} from {method} {url.split('?')[0]}: {body}")
        except (urllib.error.URLError, TimeoutError, ConnectionError, OSError) as e:
            if i < tries - 1: time.sleep(3 * (i + 1)); continue
            raise ApiError(f"network error on {url.split('?')[0]}: {e}")

def upload_file(path, token):
    """POST /v1/files (multipart); returns the URL Replicate accepts as an image_input."""
    b = "----art" + uuid.uuid4().hex
    body = (f"--{b}\r\nContent-Disposition: form-data; name=\"content\"; filename=\"{path.name}\"\r\nContent-Type: application/octet-stream\r\n\r\n").encode() \
           + path.read_bytes() + f"\r\n--{b}--\r\n".encode()
    j = _req("POST", API + "/files", token, body, {"Content-Type": "multipart/form-data; boundary=" + b})
    return j["urls"]["get"]

def generate(prompt, ref_urls, token, resolution, log):
    inp = {"prompt": prompt, "aspect_ratio": "3:2", "resolution": resolution, "output_format": "png"}
    if ref_urls: inp["image_input"] = ref_urls
    p = _req("POST", f"{API}/models/{MODEL}/predictions", token, json.dumps({"input": inp}).encode(),
             {"Content-Type": "application/json", "Prefer": "wait=30"})
    t0 = time.time()
    while p.get("status") in ("starting", "processing"):
        if time.time() - t0 > 600: raise ApiError("prediction took longer than 10 minutes: " + p.get("id", "?"))
        time.sleep(2); p = _req("GET", p["urls"]["get"], token)
    if p.get("status") != "succeeded": raise ApiError(f"prediction {p.get('id')} {p.get('status')}: {str(p.get('error'))[:300]}")
    out = p["output"]; url = out[0] if isinstance(out, list) else out
    log(f"  prediction {p.get('id')} done in {time.time()-t0:.0f}s")
    for i in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "itent45-make-art"}), timeout=120) as r:
                return r.read()
        except (urllib.error.URLError, TimeoutError, ConnectionError, OSError) as e:
            if i == 4: raise ApiError(f"download failed: {e}")
            time.sleep(3 * (i + 1))

# ---- web version ----
def to_web(png, dest):
    """Write dest (.webp, 1200 px wide, quality 80). Pillow, else cwebp, else keep a PNG. Returns a note."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        from PIL import Image
        im = Image.open(png).convert("RGB")
        if im.width != WEB_W: im = im.resize((WEB_W, round(im.height * WEB_W / im.width)), Image.LANCZOS)
        im.save(dest, "WEBP", quality=WEB_Q, method=6)
        return f"webp via Pillow {im.width}x{im.height}, {dest.stat().st_size//1024} KB"
    except ImportError: pass
    if shutil.which("cwebp"):
        subprocess.run(["cwebp", "-q", str(WEB_Q), "-resize", str(WEB_W), "0", str(png), "-o", str(dest)], check=True, capture_output=True)
        return f"webp via cwebp, {dest.stat().st_size//1024} KB"
    keep = dest.with_suffix(".png"); shutil.copyfile(png, keep)
    return f"NO WEBP ENCODER (install Pillow or cwebp): kept the PNG at {keep}; build.py only ships .webp"

def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0], formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
    ap.add_argument("--only", help="comma-separated slugs")
    ap.add_argument("--anchor", metavar="SLUG", help="style anchor: made first, then used as the reference for the other scenes")
    ap.add_argument("--candidates", type=int, default=1, metavar="N", help="N options per scene, saved as art-src/<slug>-1.png ...")
    ap.add_argument("--pick", action="append", default=[], metavar="SLUG:N", help="promote art-src/<slug>-N.png to the final picture (no API call)")
    ap.add_argument("--force", action="store_true", help="regenerate scenes that already have a picture")
    ap.add_argument("--dry-run", action="store_true", help="print prompts and planned cost; no API calls, no token needed")
    ap.add_argument("--resolution", choices=list(PRICE), default="1K", help="1K is enough for a 1200 px picture (default)")
    ap.add_argument("--src", default=str(ROOT / "src"), help="folder holding */panels/*.html (default src)")
    ap.add_argument("--print-template", action="store_true")
    a = ap.parse_args()
    out_png, out_web = ROOT / "art-src", ROOT / "src" / "shared" / "art"
    if a.print_template:
        print(build_prompt("<one sentence describing the everyday scene>", False)); return 0
    for pk in a.pick:
        slug, _, n = pk.partition(":"); cand = out_png / f"{slug}-{n}.png"
        if not cand.exists(): print(f"no such candidate: {cand}"); return 2
        shutil.copyfile(cand, out_png / f"{slug}.png"); print(f"{slug}: {to_web(cand, out_web / (slug + '.webp'))}")
    if a.pick and not (a.only or a.anchor or a.dry_run): return 0

    scenes, warns = find_scenes(pathlib.Path(a.src))
    for w in warns: print("WARNING:", w, file=sys.stderr)
    only = [s for s in (a.only or "").split(",") if s]
    for s in only + ([a.anchor] if a.anchor else []):
        if s not in scenes: print(f"ERROR: slug {s!r} not found in any panel (found: {', '.join(scenes) or 'none'})"); return 2
    todo = [s for s in scenes if not only or s in only]
    if a.anchor and a.anchor not in todo: todo.append(a.anchor)
    n = max(1, a.candidates)

    def have(s): return (out_web / (s + ".webp")).exists()
    anchor_png = out_png / f"{a.anchor}.png" if a.anchor else None
    anchor_new = bool(a.anchor) and (a.force or not anchor_png.exists())
    todo = [s for s in todo if a.force or not have(s)]
    order = ([a.anchor] if a.anchor in todo else []) + [s for s in todo if s != a.anchor]
    # a scene whose original PNG exists but whose webp is missing needs no API call
    redo_web = [s for s in order if (out_png / f"{s}.png").exists() and not a.force]
    gen = [s for s in order if s not in redo_web]
    if a.anchor and not anchor_new and a.anchor not in redo_web and not have(a.anchor): redo_web.append(a.anchor)
    cost = len(gen) * n * PRICE[a.resolution]

    print(f"model {MODEL}, {a.resolution}, 3:2, png | scenes found: {len(scenes)} | to generate: {len(gen)} x {n} candidate(s)"
          f" = {len(gen)*n} image(s) | planned cost ${cost:.2f} (${PRICE[a.resolution]}/image)")
    if redo_web: print("webp only (original exists):", ", ".join(redo_web))
    skipped = [s for s in scenes if (not only or s in only) and s not in order and s not in redo_web]
    if skipped: print("skipped (picture exists, use --force):", ", ".join(skipped))
    if a.anchor and a.dry_run is False and anchor_new and len(gen) > 1:
        print("anchor mode: the anchor is made first and the run then stops so you can review it.")
    if a.dry_run:
        for i, s in enumerate(gen):
            ref = bool(a.anchor) and s != a.anchor
            print(f"\n=== {s}{'  [ANCHOR, no reference image]' if s == a.anchor else ''}{'  [reference: ' + str(anchor_png.relative_to(ROOT)) + ']' if ref else ''}\n{build_prompt(scenes[s]['desc'], ref)}")
        if not gen: print("\n(sample prompt; no scenes need generating)\n" + build_prompt("<one sentence describing the everyday scene>", False))
        return 0

    token = os.environ.get("REPLICATE_API_TOKEN", "").strip()
    if gen and not token:
        print("ERROR: set REPLICATE_API_TOKEN in the environment (https://replicate.com/account/api-tokens)."); return 2
    out_png.mkdir(exist_ok=True)
    for s in redo_web: print(f"{s}: {to_web(out_png / (s + '.png'), out_web / (s + '.webp'))}")
    ref_urls, fails = [], []
    for s in gen:
        is_anchor = s == a.anchor
        if not is_anchor and a.anchor and not ref_urls:
            if not anchor_png.exists(): print("ERROR: anchor picture missing"); return 2
            print(f"uploading reference {anchor_png.name}"); ref_urls = [upload_file(anchor_png, token)]
        prompt = build_prompt(scenes[s]["desc"], bool(ref_urls) and not is_anchor)
        for k in range(1, n + 1):
            print(f"{s} ({k}/{n})")
            try: data = generate(prompt, [] if is_anchor else ref_urls, token, a.resolution, print)
            except (ApiError, KeyError) as e: print("  FAILED:", e); fails.append(s); break
            name = f"{s}-{k}.png" if n > 1 else f"{s}.png"
            (out_png / name).write_bytes(data); print(f"  saved art-src/{name}")
            if n == 1: print("  " + to_web(out_png / name, out_web / (s + ".webp")))
        if is_anchor and anchor_new and len(gen) > 1 and s not in fails:
            print(f"\nAnchor made: art-src/{s}{'-1' if n>1 else ''}.png. Review it against docs/ART-STYLE.md."
                  + (f" Pick one with: --pick {s}:N." if n > 1 else "")
                  + f"\nThen run the same command again: it will use the approved anchor as the reference for the other scenes.")
            return 0
    if n > 1: print("\nCandidates are in art-src/. Promote one per scene with --pick slug:N.")
    if fails: print("failed:", ", ".join(sorted(set(fails)))); return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
