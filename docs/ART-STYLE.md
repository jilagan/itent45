# Scene pictures: model, style and pipeline

Each lesson's step 1 ("the everyday picture") gets one illustration, set in the `.scene` element through `data-art="slug"` and `data-art-desc="one sentence"`. The picture is generated with Google's Nano Banana 2.1 on Replicate. Labels stay as HTML under the picture. The pipeline is `tools/make_art.py`; the site hook is in `build.py` and `src/shared/platform.js`.

## The model (read on 2026-11-18)

| Item | Value |
|---|---|
| Identifier | `google/nano-banana-2.1` (official model, called at `POST https://api.replicate.com/v1/models/google/nano-banana-2.1/predictions`) |
| What it is | "Google's fast image generation and editing model, with sharp text rendering, multi-image editing, and up to 4K output"; builds on Nano Banana 2 |
| Inputs | `prompt` (required); `image_input` (array of URLs, up to 14 reference images, default empty); `aspect_ratio` (default `match_input_image`; includes `3:2`); `resolution` (`1K` default, `2K`, `4K`); `output_format` (`jpg` default, `png`); `google_search` and `image_search` (booleans, default false; keep off) |
| Output | one image URL (string) |
| Price per output image | 1K $0.0336, 2K $0.0504, 4K $0.1134 |
| Older siblings | `google/nano-banana` (Gemini 2.5 Flash Image), `google/nano-banana-pro` (Gemini 3 Pro), `google/nano-banana-2` (Gemini 3.1 Flash Image, announced 2026-02-26). 2.1 is the newest of the four and matches the "2.1" the owner named. |

Sources: https://replicate.com/google/nano-banana-2.1 (readme, aspect ratios, output format), https://replicate.com/google/nano-banana-2.1/api/schema (input schema and the per-resolution prices in the page data), https://replicate.com/google/nano-banana-2, /nano-banana and /nano-banana-pro (siblings), https://replicate.com/docs/topics/predictions/input-files (file inputs). The page's own data also carries a "$0.0001 per second" figure; the per-image prices above are the ones the schema lists per resolution.

Reference images. `image_input` takes URLs. A data URL works only up to 256 KB, so the tool uploads the anchor PNG with `POST https://api.replicate.com/v1/files` (multipart field `content`) and passes the returned `urls.get`. The readme says the model keeps style and character consistent across images and accepts up to 14 references.

We use 1K at 3:2 and shrink to 1200 px wide, which is enough for a picture shown at 620 px.

## Style: one hand for every scene

The set should read as spot illustration commissioned for a textbook. Rules:

1. Flat shapes in solid fills. One dark ink outline (#1A1D21) at the same medium weight on everything. No gradient, glow, 3D, gloss, bokeh, lens effect, paper or painterly texture, or cast shadow other than one flat grey ground line.
2. Palette: ink #1A1D21, blue #0B4A8F (the site blue, for the thing the lesson is about), orange #B4491B (the secondary object), light grey #E6E9ED and mid grey #B7BEC8, on white. Skin and clothing use these colours only. Tying the picture to the site palette makes it look designed with the page.
3. No text, letters, numbers, logos or brand marks in the image. Signs, menus, receipts, lists and ID cards are drawn as blank shapes or plain bars. Labels are HTML.
4. Simple figures: natural proportions, plain faces (at most a dot for each eye) or none, normal hands. Filipino everyday settings (sari-sari store, jeepney, canteen, registrar window) drawn respectfully, without caricature.
5. One clear action. At most four figures. Side-on or three-quarter view at eye level. The horizon sits two thirds down in every scene and figures are about a third of the picture height, so the pictures share a scale. Plenty of white space around a compact scene.
6. 3:2 landscape, 1200 x 800 on the site.

Writing the scene sentence (`data-art-desc`): one scene, one action, at most four people, nothing that has to carry readable text or numbers. Avoid "a second picture shows..." (one image, one moment) and avoid describing writing on objects. The sentence is also the alt text, so it should describe what a person sees.

### AI tells: reject on sight
Extra, fused or missing fingers. Objects that melt into each other or have impossible joins. Signage with gibberish letters. Over-rendered lighting, rim light, soft glow. Symmetrical, centred stock-photo composition. Line weight that changes within the picture. Plastic or airbrushed skin. Decorative swirls, sparkles, borders. Background crowds with blurred faces. Colours outside the palette, especially teal-and-orange or pastel gradients. Two scenes that differ in line weight, scale or horizon from the anchor. Regenerate rather than retouch.

## Prompt template

The style block and negative list are identical for every scene; only the scene sentence changes. The source of truth is `STYLE`, `NEGATIVE` and `REF_NOTE` in `tools/make_art.py` (`--print-template` prints it). The model has no negative-prompt input, so the list is appended as an "Avoid:" paragraph.

```
<STYLE>   Flat vector spot illustration for a university textbook ... (palette, line, view, horizon, figures, white space, 3:2, no text)
<REF_NOTE, only when a reference image is passed>   The first reference image is the style anchor. Match its line weight, palette, figure style, scale, horizon height and level of detail exactly. Do not copy its subject, composition or props: no wall fan, no pitcher, no pencil cup unless the scene below names them. Keep the background plain and nearly empty.
Scene: <data-art-desc>.
<NEGATIVE>   Avoid: text, letters, numbers, logos, watermarks, gibberish signage, gradients, glow, ... extra or fused fingers, ... symmetrical stock-photo composition, crowds, ...
```

## Anchor record (2026-11-18)
Six candidates for `restaurant-three-tiers` with the unchanged style block; candidate 1 is the anchor. It has the plainest drawing: two people and a cook in a hatch, one uniform outline, blue apron and orange shirt as the only colour, normal hands, no text, nothing melted. Candidates 2 and 5 added a window, utensil rack and sauce bottles (clutter). Candidate 3 had an unrelated shelf and a broken chair behind the waiter. Candidate 4 used orange for the whole furniture set, which pulls attention from the figures. Candidate 6 had the waiter walking away from the kitchen and a fused fridge shape in the hatch. The first batch with the anchor as reference copied the anchor's wall fan into every scene, so the reference note now forbids copying props.

## Consistency plan

1. Pick the anchor scene: one with two or three figures and simple props, such as the restaurant for the three tiers.
2. `python3 tools/make_art.py --anchor <slug> --candidates 4` makes four options with no reference image. Choose the one that best fits the rules above and passes the AI-tells list. `--pick <slug>:N` promotes it to `art-src/<slug>.png` and writes the webp.
3. Run `python3 tools/make_art.py --anchor <slug>`. The approved anchor is uploaded once and passed as `image_input` for every other scene.
4. Review each picture against the rules. For scenes that miss, use `--only a,b --candidates 3 --force` and `--pick`.
5. A change to the style block means regenerating everything (`--force`) from a new anchor, so settle the anchor before the batch.

Originals are kept in `art-src/` (git-ignored). Web files are in `src/shared/art/<slug>.webp`; `build.py` copies them to `art/` in the output and lists them in `window.COURSE.art`. A scene without a file shows the icon row exactly as before.

## Credit

NOTICE.md says the scene pictures are generated with Nano Banana 2.1 and reviewed by the course team. Check Replicate's and Google's terms for the output before the repository is published under an open licence; this document did not verify them.
