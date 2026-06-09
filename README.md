# ComfyUI — Ideogram4 Bbox Editor

A ComfyUI custom node that renders a visual bounding-box / caption editor **on the
node itself** and outputs the assembled Ideogram-4 caption (**v15 format**) as a
JSON string.

![Ideogram4 Bbox Editor node](docs/screenshots/node.png)

## Features

- **On-node visual editor** — draw, move and resize regions directly on the node
  (corner handle resizes, centre drags; click cycles through overlapping boxes).
- **Aspect-ratio presets** — `1:1 / 4:5 / 9:16 / 16:9 / 3:1` plus a free **custom
  `W:H`** field. The ratio drives default bbox shapes.
- **0–1000 grid** — bboxes as `[ymin, xmin, ymax, xmax]`, independent of pixels.
- **Per-element controls** — `obj` / `text` type, **optional bbox** (toggle per
  element), literal multi-line `text` for text regions, `desc`, and **z-order**
  (▲/▼ choose what sits on top).
- **Caption-level fields** — `aspect_ratio`, `high_level_description`,
  `background` (scene shell only).
- **Live validation panel** — flags v15 guideline issues as you type: word caps
  (HLD ≤ 50, desc ≤ 60), camera/shadow language in `desc`, floor/ground as an
  element, `"warm"` grading, post-processing in `background`, furniture/people
  smuggled into `background`, missing `text` in built environments, bad bbox, etc.
- **Word counters** on HLD and each `desc`.
- **Smart import** — paste any caption JSON; it unwraps `caption`/`data`/`result`
  wrappers, doubly-encoded JSON, derives the ratio from `size`, and **converts
  legacy (style_description) captions to v15** (warning you that style fields are
  dropped — rewrite them as prose into HLD/background).
- **Copy minified / Pretty / Download**.
- **Output** — `prompt` (STRING): the live v15 caption JSON.

## v15 output format

```json
{
  "aspect_ratio": "4:5",
  "high_level_description": "…",
  "compositional_deconstruction": {
    "background": "…",
    "elements": [
      { "type": "obj",  "bbox": [40, 240, 1000, 760], "desc": "…" },
      { "type": "text", "bbox": [110, 300, 250, 700], "text": "QUZ0", "desc": "…" }
    ]
  }
}
```

`bbox` is `[ymin, xmin, ymax, xmax]` on a 0–1000 grid and is **optional** per
element. v15 has **no** `style_description` and **no** `color_palette` — describe
style as prose inside `high_level_description` / `background`.

## Install

Clone into `ComfyUI/custom_nodes/` and restart ComfyUI:

```bash
git clone https://github.com/quzopl/comfyui-ideogram4-bbox-editor.git
```

## Usage

Add **Ideogram4 Bbox Editor** (category `Ideogram4`). Pick a ratio, add `obj` /
`text` regions, fill `desc` / `text`, write `high_level_description` and
`background`, and watch the validation panel. Wire the `prompt` output into a
text encoder (e.g. `CLIPTextEncode`) or any string consumer. Pairs naturally with
the AI Gallery metadata stack.

## Development

```bash
python -m pytest tests/ -v
```

## License

MIT
