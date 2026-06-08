# ComfyUI — Ideogram4 Bbox Editor

A custom node that renders a visual bounding-box / caption editor **on the node**
and outputs the assembled Ideogram-4 caption as a JSON string.

- Aspect-ratio presets (4:5 / 16:9 / 1:1) for the canvas
- Draw / move / resize regions on a 0–1000 grid (`[ymin, xmin, ymax, xmax]`)
- Per-element `type` (obj/text), `desc`, `text`, hex `color_palette`, z-order
- Caption-level fields: `high_level_description`, `style_description`, `background`
- Paste-import (also unwraps doubly-encoded JSON)
- Output: `prompt` (STRING) — the caption JSON

## Install

Clone into `ComfyUI/custom_nodes/` and restart ComfyUI:

```bash
git clone https://github.com/quzopl/comfyui-ideogram4-bbox-editor.git
```

## Node

**Ideogram4 Bbox Editor** (category `Ideogram4`). Wire `prompt` into a text
encoder or any string consumer. Pairs well with the AI Gallery metadata stack.

## Development

```bash
python -m pytest tests/ -v
```
