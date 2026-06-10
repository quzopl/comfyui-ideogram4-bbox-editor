# Design — extra outputs, reference image, import_json, optional style_description

**Date:** 2026-06-10
**Scope:** `nodes.py` (Python) + `web/ideogram4_bbox_editor.js` (JS) + tests + README.

Brings the node to feature-parity with `Ideogram4PromptBuilderKJ` where it makes
sense, while staying on the v1 node API (lower risk than a v3 migration; the only
v3-only feature dropped is `search_aliases`).

## Node I/O

**Outputs** (was: only `prompt`):
- `prompt` (STRING) — the v15 caption JSON (unchanged).
- `preview` (IMAGE) — server-rendered boxes + index tags + desc/text over the
  canvas (or the dimmed reference image).
- `bboxes` (BOUNDING_BOX, `io_type="BOUNDING_BOX"`) — pixel-space, nested
  `[[{x,y,width,height}]]` (one frame), for SAM3 / crop / mask consumers.
- `width` (INT), `height` (INT) — resolved canvas dims (passthrough).

**Inputs** (added):
- `image` (IMAGE, optional) — reference image: dimmed behind the preview and
  pushed to the editor backdrop via `ui.bg_url`.
- `import_json` (STRING, force_input) — a caption JSON loaded into the editor on
  run via `ui.caption`. Output always reflects the editor, never the raw input.
- existing: `caption_json` (hidden STRING), `width`, `height` (INT, default 0).

## nodes.py — pure helpers + thin build()

- `_resolve_canvas(obj, width, height) -> (W, H)`: use width/height if both > 0;
  else derive from `aspect_ratio` scaling the long edge to 1024 (multiple of 16);
  fallback 1024×1024.
- `_pixel_bboxes(obj, W, H) -> [[{x,y,width,height}]]`: convert each element's
  `bbox [ymin,xmin,ymax,xmax]` on the 0-1000 grid to pixels; skip bbox-less
  elements; empty list of frames when none. **No heavy deps — unit-tested.**
- `_render_preview(obj, W, H, image) -> IMAGE tensor`: PIL render (rectangles,
  numbered tags, wrapped desc/text; reference dimmed in the background). Long edge
  capped at 1024. **torch / PIL / numpy imported lazily inside the function** so
  importing the module (and `pytest` in a torch-less env) stays cheap.
- `build(caption_json, width, height, image=None, import_json="")` returns
  `{"ui": {"dims":[W,H], "bg_url"?, "caption"?}, "result": (prompt, preview, bboxes, W, H)}`.

## Optional style_description (v14) — in the JS editor

A collapsible "Style (optional)" section:
- checkbox **include**; select **none / photo / art_style**;
- fields `aesthetics`, `lighting`, `medium`; conditional `photo` or `art_style`;
- `color_palette` as comma-separated `#hex`.

`buildCaption()` inserts `style_description` only when enabled, with KJ key order:
- photo → `{aesthetics, lighting, photo, medium[, color_palette]}`
- art_style → `{aesthetics, lighting, medium, art_style[, color_palette]}`

`loadCaption()` populates the section from an incoming `style_description` and
enables the toggle. The validation panel **stays silent** about style_description
(the old "legacy format" warning is removed).

## Frontend data flow

- Per-node `onExecuted(message)`: `message.caption` → `loadCaption`; `message.bg_url`
  → `onNewImage` (reference backdrop); `message.dims` → set AR when Auto.
- The existing global `"executed"` listener (post-generation backdrop from other
  nodes) stays. Reference (own input) vs generated (downstream) — latest wins.

## Testing

Rewrite the 7 tests to target pure functions: caption/aspect-ratio assembly,
`_pixel_bboxes` conversion, `_resolve_canvas`. The preview render and full
`build()` (need torch) are verified manually in ComfyUI.

## Notes

- Python changed → **restart ComfyUI** after deploy.
- `search_aliases` omitted (v3-only); everything else works on v1.
