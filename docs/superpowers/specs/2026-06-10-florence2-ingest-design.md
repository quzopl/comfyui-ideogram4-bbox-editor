# Design — Florence-2 ingest (auto-fill the editor from an image)

**Date:** 2026-06-10
**Scope:** `nodes.py` + `web/ideogram4_bbox_editor.js` + tests + README.

Inspired by cocktailpeanut/image-to-prompt: use Florence-2 to seed the editor from
an image. We **do not embed Florence-2** (heavy model); we consume the output of the
already-installed `comfyui-florence2` (kijai) `Florence2Run` node.

## Inputs (added, optional)

- `florence_caption` (STRING, force_input) — Florence2Run `caption` → `high_level_description`.
- `florence_data` (JSON) — Florence2Run `data`. Pixel-space, handled shapes:
  - `{bboxes:[[x0,y0,x1,y1],...], labels:[...]}` (caption_to_phrase_grounding),
  - `[[x0,y0,x1,y1], ...]` possibly wrapped one level (OD / dense / region_proposal; no labels),
  - `[{label, box}, ...]` where `box` is `[x0,y0,x1,y1]` or an 8-number quad (ocr_with_region → text elements).

Normalization uses the **image dimensions** (Florence boxes are in the source
image's pixel space), so the `image` input must be connected for `florence_data`.

## nodes.py

- `_florence_elements(data, W, H) -> [element]`: pure, robust shape detection;
  pixel → 0-1000 `[ymin,xmin,ymax,xmax]`; OCR boxes (incl. quads) → `type:text`
  with `text=label`; others → `type:obj` with `desc=label` (empty when absent).
- `_image_dims(image) -> (W, H)` from the tensor shape `(B,H,W,C)`.
- `build()`: when `florence_caption`/`florence_data` present, assemble a v15 caption
  (`aspect_ratio` from image dims, `high_level_description = florence_caption`,
  elements from `_florence_elements`) and emit it under `ui["florence"]`.

## JS editor

- `onExecuted`: `m.florence[0]` is applied via `loadCaption` **only when it changed**
  from the last applied value (per-node `lastFlorence` guard) — so re-running with the
  same Florence output does not clobber the user's manual edits; a new image re-fills.
- Existing `m.caption` (import_json) and `m.bg_image` (reference backdrop) unchanged.

## Tests

`_florence_elements` across the three shapes (dict+labels, bare box list incl. one
wrapping level, OCR dict list incl. quad). Pure — no torch.

## Notes

- Wiring: `LoadImage → Florence2Run` (task = dense_region_caption / OD / ocr_with_region
  / caption); `Florence2Run.caption → florence_caption`, `.data → florence_data`,
  `.image → image`. Edit, then generate.
- kijai's `data` drops per-region labels for OD/dense (only grounding/OCR carry labels)
  — documented; those tasks auto-place boxes with empty `desc` for the user to fill.
- Python changed → restart ComfyUI.
