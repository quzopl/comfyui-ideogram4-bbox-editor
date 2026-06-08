# Ideogram4 Bbox Editor — ComfyUI node (design)

Date: 2026-06-08
Status: approved (design), pending spec review

## Goal

Port the standalone HTML editor `ideogram4_bbox_editor(1).html` into a ComfyUI
custom node that renders the full visual bbox/caption editor **on the node**
and outputs the assembled caption as a **JSON string**. All editor logic is
preserved verbatim; the node is a thin pass-through.

## Source of truth

`/home/bart/Pobrane/ideogram4_bbox_editor(1).html` (406 lines). Self-contained
editor with: aspect-ratio presets, draggable/resizable bboxes on a 0–1000 grid,
per-element cards, palette handling, JSON import with nested-JSON normalization,
and `buildCaption()` producing the Ideogram-4 caption object.

## Decisions (locked)

- **Integration:** custom canvas rendered on the node via a DOM widget
  (LiteGraph `addDOMWidget`), mirroring the kjnodes
  `Ideogram4PromptBuilderKJ` pattern (`web/js/ideogram4_prompt_builder.js`).
- **Module:** new standalone `comfyui-ideogram4-bbox-editor/` custom node.
- **I/O:** single output `STRING prompt` (the caption JSON). No sockets in.
  Import is done inside the editor via the built-in "Wklej JSON" textarea.
- **Node API:** v1 (`INPUT_TYPES` dict class). The DOM-widget integration is a
  frontend feature independent of node API version; v1 keeps the Python side
  minimal.
- **Caption-level fields:** the node ADDS a collapsible section for
  `high_level_description`, `background`, and `style_description`
  (aesthetics / lighting / photo / medium / color_palette) so the node is
  self-sufficient (the raw HTML could only set these via import). The
  bbox/element editor is otherwise unchanged.

## Architecture

```
comfyui-ideogram4-bbox-editor/
  __init__.py        # NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS, WEB_DIRECTORY="./web"
  nodes.py           # Ideogram4BboxEditor (v1)
  web/
    ideogram4_bbox_editor.js   # ported editor as a DOM widget
  docs/superpowers/specs/...   # this spec
  README.md
```

### Python node — `Ideogram4BboxEditor`

- `INPUT_TYPES`: one hidden string widget `caption_json`
  (`{"default": "{}", "multiline": True}`) managed by the JS widget. Marked so
  it is not a visible socket (the JS hides it / it is a serialized widget value).
- `RETURN_TYPES = ("STRING",)`, `RETURN_NAMES = ("prompt",)`.
- `CATEGORY = "Ideogram4"`, `FUNCTION = "build"`.
- `build(self, caption_json)`:
  - parse `caption_json`; on success re-serialize with stable formatting
    (`json.dumps(obj, ensure_ascii=False)`) and return it;
  - on parse failure or empty, return `"{}"`.
  - This validates/normalizes without duplicating the build logic (which lives
    in JS).

### JS widget — `web/ideogram4_bbox_editor.js`

- `app.registerExtension({ name, beforeRegisterNodeType })`; in
  `onNodeCreated` for the `Ideogram4BboxEditor` class:
  - find the `caption_json` widget; hide it from normal rendering.
  - build the editor DOM (toolbar, canvas frame, side panel, caption-level
    section) and attach via `node.addDOMWidget("ideo_editor", "div", wrap,
    { serialize: false })`.
  - port verbatim: AR presets (4:5/16:9/1:1, canvas aspect only), `addEl`,
    `pxFromBbox`/`bboxFromPx`/`clamp`, render, click-cycle overlap selection,
    `startDrag`/`bindDrag` (move + corner resize), z-order bump, element cards
    (text/desc/palette + swatches), `parseHex`, `normalize`/`loadCaption`
    import, `buildCaption`.
  - new: caption-level inputs bound to the `cap` object
    (`high_level_description`, `background`, `style_description.*`).
  - on **every** mutation call `serialize()`: write
    `JSON.stringify(buildCaption())` into the `caption_json` widget value and
    `node.graph.setDirtyCanvas(true, true)` so the value is queued for Python
    and persisted in the saved workflow.

## Data flow

edit on node → JS `buildCaption()` → `caption_json` widget value → on queue,
Python `build()` reads the widget → returns it as the `prompt` STRING output.

## Fidelity checklist (from the HTML)

- bbox normalized 0–1000 as `[ymin, xmin, ymax, xmax]`.
- default bbox per type and AR (text vs obj; 16:9/4:5/1:1 variants).
- only the selected box is draggable; click cycles through overlapping boxes
  (smallest-first) to defeat overlap.
- corner handle resizes; center drag moves; values clamped to frame.
- element card: type label, live bbox readout, `text` (text type only), `desc`,
  `palette` (hex CSV) with swatch preview, z ▲/▼, delete ×.
- import normalizes doubly-encoded JSON (high_level_description holding a JSON
  string) by recursing into the inner object.
- `buildCaption` ordering: `high_level_description`, `style_description`
  (aesthetics, lighting, then photo+medium OR medium+art_style, optional
  color_palette), `compositional_deconstruction` (background, elements[]); each
  element: `type`, `bbox`, `text`(if text), `desc`, optional `color_palette`
  (≤5).

## Testing

- Python: unit test `build()` — valid JSON round-trips; empty/garbage → `"{}"`;
  unicode preserved.
- Manual: load node in ComfyUI, draw/drag/resize boxes, edit cards, paste a
  sample caption (incl. doubly-encoded), confirm the `prompt` output equals the
  editor's live JSON and persists across save/reload of the workflow.

## Out of scope

- No width/height or bbox outputs (JSON string only).
- No wired `import_json` input socket (editor's paste covers import).
- No server-side rebuild of the caption (logic stays in JS, single source).

## Distribution

New git repo `comfyui-ideogram4-bbox-editor` under quzopl, pushed like the
other modules.
