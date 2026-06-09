# Design — Generated-image backdrop + Auto aspect ratio

**Date:** 2026-06-09
**Scope:** `web/ideogram4_bbox_editor.js` only (no Python change).

## Goal

After generating, show the latest generated image as a **scaled-to-fit backdrop**
under the bboxes, so the user can see where to move boxes and regenerate. The
aspect ratio / grid proportions should follow that image **automatically** —
no preset picking.

## Why not an `IMAGE` input

This node outputs `prompt`, which drives generation → VAEDecode → image. Wiring
that image back into the same node creates a dependency loop, which ComfyUI
rejects ("Loop detected"). So the backdrop is captured on the **frontend**
instead, with no graph wiring.

## Mechanism

- Subscribe once to `window.comfyAPI.api.api` `"executed"` events.
  `detail.output.images[]` carries `{filename, subfolder, type}`.
- On a run, take the **last** image that has `output.images` (final Save/Preview),
  build its URL via `api.apiURL("/view?" + params)`, and push it to every live
  editor instance (module-level registry; cleaned up on `node.onRemoved`).
- A freshly created editor adopts the last captured image immediately.

## Backdrop rendering (scaled to fit)

The `.frame` already sizes to the aspect ratio inside its host. Render the image
as a CSS multi-layer background on `.frame` (no DOM change):
`grid-h, grid-v, dim-overlay, url(image)` with sizes `10% 10%, 10% 10%, cover, cover`.
The frame AR matches the image AR, so `cover` shows the whole image undistorted,
scaled down to the frame. A flat dim layer (`rgba(panel, 1-opacity)`) implements
the opacity slider. Clearing the backdrop removes the inline style → falls back
to the CSS grid-only frame.

## Auto aspect ratio (default on)

State: `autoAR` (default `true`), `bgUrl`, `bgOpacity` (default `0.85`).

- `autoAR` on + image present → AR from the image's natural `W:H` (reduced by gcd).
- `autoAR` on + no image → AR from connected `width`/`height` (existing `syncFromWH`).
- Choosing a preset / editing custom `W:H` / driving `width`/`height` manually →
  treated as a manual override → `autoAR` off (checkbox reflects it).
- An **Auto** toggle re-enables auto and re-derives AR (image first, else W/H).

The output `aspect_ratio` follows whatever AR is active (auto or manual), as today.

## Controls (new row under the canvas)

- **Auto** toggle (on by default).
- **Opacity** slider for the backdrop (0.2–1).
- **Clear backdrop** button (work without an image).

Backdrop URL and these UI prefs are session-only (not persisted to the workflow);
the temp image URL is ephemeral anyway.

## Testing

JS `node --check`. Python tests unchanged (no Python change). Manual: generate →
backdrop appears, grid matches image; move boxes; clear works; Auto off lets
presets win.
