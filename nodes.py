"""ComfyUI node: Ideogram4 Bbox Editor.

Renders a visual bbox/caption editor on the node (see web/ideogram4_bbox_editor.js)
and outputs the assembled Ideogram-4 caption (v15) as a JSON string. The Python side
also derives pixel-space bounding boxes (for SAM3 / crop consumers), renders a preview
image, and relays an optional reference image + import_json to the editor.

The caption-building logic lives in the JS widget; Python is a thin validator/relay
plus the derived outputs. Heavy deps (torch / PIL / numpy / folder_paths) are imported
lazily inside the render helpers so the module imports cheaply (and tests run without
torch).
"""
from __future__ import annotations

import json
import re
from math import gcd

_LOC_RE = re.compile(r"<loc_(\d+)>")


# --------------------------------------------------------------------------- #
# pure helpers (no heavy deps — unit-tested)
# --------------------------------------------------------------------------- #
def _parse_caption(caption_json: str) -> dict:
    raw = (caption_json or "").strip()
    if not raw:
        return {}
    try:
        obj = json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        return {}
    return obj if isinstance(obj, dict) else {}


def _apply_size(obj: dict, width: int, height: int) -> dict:
    """Real width/height (both > 0) override the editor's aspect_ratio with reduced W:H."""
    if isinstance(obj, dict) and width and height and width > 0 and height > 0:
        g = gcd(int(width), int(height)) or 1
        obj["aspect_ratio"] = f"{int(width) // g}:{int(height) // g}"
    return obj


def _ratio(obj: dict):
    ar = obj.get("aspect_ratio") if isinstance(obj, dict) else None
    if isinstance(ar, str) and ":" in ar:
        a, _, b = ar.strip().partition(":")
        try:
            aw, ah = int(a), int(b)
            if aw > 0 and ah > 0:
                return aw, ah
        except ValueError:
            pass
    return 1, 1


def _round16(v: float) -> int:
    return max(16, int(round(v / 16.0)) * 16)


def _resolve_canvas(obj: dict, width: int, height: int):
    """Pixel canvas: explicit width/height if both > 0, else from aspect_ratio
    scaling the long edge to 1024 (multiple of 16)."""
    if width and height and width > 0 and height > 0:
        return int(width), int(height)
    aw, ah = _ratio(obj)
    if aw >= ah:
        return 1024, _round16(1024 * ah / aw)
    return _round16(1024 * aw / ah), 1024


def _elements(obj: dict):
    """Normalize caption elements to {frac:(x,y,w,h)|None, type, desc, text}.
    frac is in 0-1 fractions of the canvas; None when the element has no bbox."""
    cd = obj.get("compositional_deconstruction") if isinstance(obj, dict) else None
    out = []
    if isinstance(cd, dict):
        for e in (cd.get("elements") or []):
            if not isinstance(e, dict):
                continue
            bb = e.get("bbox")
            frac = None
            if isinstance(bb, (list, tuple)) and len(bb) == 4:
                try:
                    ymin, xmin, ymax, xmax = [max(0.0, min(1000.0, float(v))) / 1000.0 for v in bb]
                    frac = (min(xmin, xmax), min(ymin, ymax), abs(xmax - xmin), abs(ymax - ymin))
                except (TypeError, ValueError):
                    frac = None
            out.append({
                "frac": frac,
                "type": "text" if e.get("type") == "text" else "obj",
                "desc": e.get("desc", "") or "",
                "text": e.get("text", "") or "",
            })
    return out


def _pixel_bboxes(obj: dict, W: int, H: int):
    """Pixel-space boxes as the BoundingBox shape, nested one frame deep
    ([[{x,y,width,height}]]) — what SAM3 / crop nodes expect. Empty when none."""
    boxes = []
    for e in _elements(obj):
        f = e["frac"]
        if not f:
            continue
        x, y, w, h = f
        boxes.append({
            "x": int(round(x * W)), "y": int(round(y * H)),
            "width": int(round(w * W)), "height": int(round(h * H)),
        })
    return [boxes] if boxes else []


def _image_dims(image):
    """(W, H) from an IMAGE tensor shaped (B, H, W, C). (0, 0) on failure."""
    try:
        return int(image.shape[2]), int(image.shape[1])
    except Exception:
        return 0, 0


def _florence_elements(data, W: int, H: int):
    """Convert Florence2Run `data` (pixel space) to v15 caption elements.

    Handles: {bboxes:[...], labels:[...]} (grounding), bare box lists
    [[x0,y0,x1,y1],...] possibly wrapped one level (OD / dense / region_proposal,
    no labels), and [{label, box}, ...] for OCR (box may be a 4-rect or an 8-quad).
    """
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except (json.JSONDecodeError, ValueError):
            return []
    if not data or W <= 0 or H <= 0:
        return []

    found = []  # (box, label, is_ocr)

    def collect(d):
        if isinstance(d, dict):
            if "bboxes" in d:
                labels = d.get("labels") or []
                for i, b in enumerate(d["bboxes"]):
                    found.append((b, labels[i] if i < len(labels) else "", False))
            elif "box" in d:  # OCR {label, box}
                found.append((d["box"], d.get("label", ""), True))
        elif isinstance(d, (list, tuple)):
            if d and all(isinstance(x, (int, float)) for x in d) and len(d) in (4, 8):
                found.append((list(d), "", False))   # a single box
            else:
                for it in d:
                    collect(it)

    collect(data)

    def n(v, dim):
        return int(max(0, min(1000, round(v / dim * 1000.0))))

    out = []
    for box, label, is_ocr in found:
        if not isinstance(box, (list, tuple)):
            continue
        if len(box) == 8:
            xs, ys = box[0::2], box[1::2]
            x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
        elif len(box) == 4:
            x0, y0, x1, y1 = box
        else:
            continue
        x0, x1 = sorted((float(x0), float(x1)))
        y0, y1 = sorted((float(y0), float(y1)))
        el = {"type": "text" if is_ocr else "obj", "bbox": [n(y0, H), n(x0, W), n(y1, H), n(x1, W)]}
        if is_ocr:
            el["text"] = str(label or "")
            el["desc"] = ""
        else:
            el["desc"] = str(label or "")
        out.append(el)
    return out


def _loc_elements(text):
    """Parse Florence's raw region string `label<loc_x1><loc_y1><loc_x2><loc_y2>...`
    into v15 elements. <loc_N> is a 0-999 normalized coordinate (no image dims
    needed). Returns [] when the text has no <loc_> tokens."""
    if not text or "<loc_" not in text:
        return []
    parts = re.split(r"(<loc_\d+>)", text)
    out, label, locs = [], "", []
    for p in parts:
        m = _LOC_RE.fullmatch(p) if p else None
        if m:
            locs.append(int(m.group(1)))
            if len(locs) == 4:
                x1, y1, x2, y2 = locs
                def g(v):
                    return int(max(0, min(1000, round(v / 999.0 * 1000.0))))
                ymin, ymax = sorted((g(y1), g(y2)))
                xmin, xmax = sorted((g(x1), g(x2)))
                out.append({"type": "obj", "bbox": [ymin, xmin, ymax, xmax], "desc": label.strip()})
                label, locs = "", []
        else:
            label += p
    return out


def _florence_caption_obj(florence_caption, florence_data, image, width, height, florence_regions=""):
    """Assemble a v15 caption from Florence-2 outputs, or None when nothing usable.

    Elements come from (in priority): the `florence_regions` raw region string, a
    loc-string accidentally wired into `florence_caption`, then `florence_data`.
    high_level_description is the prose caption (unless it was itself a loc-string).
    """
    cap_text = (florence_caption or "").strip()
    reg_text = (florence_regions or "").strip()
    W, H = _image_dims(image) if image is not None else (int(width or 0), int(height or 0))

    cap_loc = _loc_elements(cap_text)            # caption mis-wired with a region string?
    els = _loc_elements(reg_text) or cap_loc or (_florence_elements(florence_data, W, H) if florence_data is not None else [])
    hld = "" if cap_loc else cap_text            # don't dump a raw loc-string into the HLD
    cap_text = hld
    if not cap_text and not els:
        return None
    g = gcd(W, H) if W > 0 and H > 0 else 0
    ar = f"{W // g}:{H // g}" if g else "1:1"
    return {
        "aspect_ratio": ar,
        "high_level_description": cap_text,
        "compositional_deconstruction": {"background": "", "elements": els},
    }


# --------------------------------------------------------------------------- #
# heavy helpers (lazy imports)
# --------------------------------------------------------------------------- #
def _wrap(draw, text, font, max_w):
    lines = []
    for para in (text or "").split("\n"):
        line = ""
        for word in para.split():
            test = word if not line else line + " " + word
            if line and draw.textlength(test, font=font) > max_w:
                lines.append(line)
                line = word
            else:
                line = test
        lines.append(line)
    return lines


def _render_preview(obj: dict, W: int, H: int, image):
    """Render boxes + numbered tags + desc/text over the canvas (or the dimmed
    reference image). Returns an IMAGE tensor (1, h, w, 3)."""
    import numpy as np
    import torch
    from PIL import Image, ImageDraw, ImageFont, ImageEnhance

    long_edge = max(W, H)
    scale = min(1.0, 1024.0 / long_edge) if long_edge > 0 else 1.0
    rw, rh = max(1, round(W * scale)), max(1, round(H * scale))

    base = None
    if image is not None:
        try:
            arr = (image[0].detach().cpu().numpy() * 255.0).clip(0, 255).astype(np.uint8)
            base = Image.fromarray(arr).convert("RGB").resize((rw, rh), Image.LANCZOS)
            base = ImageEnhance.Brightness(base).enhance(0.45)  # dim the reference
        except Exception:
            base = None
    if base is None:
        base = Image.new("RGB", (rw, rh), (20, 22, 26))
    img = base.convert("RGBA")

    overlay = Image.new("RGBA", (rw, rh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    fs = max(10, round(rh / 64))
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", fs)
    except Exception:
        try:
            font = ImageFont.load_default(fs)
        except Exception:
            font = ImageFont.load_default()
    lh = fs + 2
    acc, acc2 = (216, 116, 58, 255), (58, 160, 216, 255)

    for i, e in enumerate(_elements(obj)):
        f = e["frac"]
        if not f:
            continue
        col = acc2 if e["type"] == "text" else acc
        x1 = max(0, min(rw, round(f[0] * rw)))
        y1 = max(0, min(rh, round(f[1] * rh)))
        x2 = max(0, min(rw, round((f[0] + f[2]) * rw)))
        y2 = max(0, min(rh, round((f[1] + f[3]) * rh)))
        draw.rectangle([x1, y1, x2, y2], outline=col, width=2)
        tag = str(i + 1).zfill(2)
        tw = draw.textlength(tag, font=font)
        draw.rectangle([x1, y1, x1 + tw + 6, y1 + fs + 2], fill=col)
        draw.text((x1 + 3, y1 + 1), tag, fill=(20, 13, 5, 255), font=font)
        body = e["desc"]
        if e["type"] == "text" and e["text"]:
            body = '"%s"%s' % (e["text"], " — " + body if body else "")
        if body and (x2 - x1) > 8:
            ty = y1 + fs + 5
            for line in _wrap(draw, body, font, x2 - x1 - 8):
                if ty > y2:
                    break
                draw.text((x1 + 4, ty), line, fill=(235, 236, 240, 255), font=font)
                ty += lh

    out = Image.alpha_composite(img, overlay).convert("RGB")
    arr = np.asarray(out, dtype=np.float32) / 255.0
    return torch.from_numpy(arr).unsqueeze(0)


def _save_reference(image):
    """Save the reference image to the temp dir; return {filename,subfolder,type}
    so the editor can show it as a backdrop. None on any failure."""
    try:
        import os
        import random
        import string

        import numpy as np
        from PIL import Image
        import folder_paths

        arr = (image[0].detach().cpu().numpy() * 255.0).clip(0, 255).astype(np.uint8)
        d = folder_paths.get_temp_directory()
        os.makedirs(d, exist_ok=True)
        name = "ig4ref_" + "".join(random.choices(string.ascii_lowercase + string.digits, k=8)) + ".png"
        Image.fromarray(arr).save(os.path.join(d, name))
        return {"filename": name, "subfolder": "", "type": "temp"}
    except Exception:
        return None


# --------------------------------------------------------------------------- #
# node
# --------------------------------------------------------------------------- #
class Ideogram4BboxEditor:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                # Managed by the JS DOM widget; hidden in the UI. Holds the live
                # caption JSON so it persists in the saved workflow and reaches the
                # backend. NOT multiline on purpose (a multiline STRING becomes a DOM
                # textarea that type="hidden" can't fully hide).
                "caption_json": ("STRING", {"default": "{}"}),
                "width": ("INT", {
                    "default": 0, "min": 0, "max": 16384, "step": 8,
                    "tooltip": "Target width. 0 = use the aspect ratio set in the editor. "
                               "When both width and height are > 0 they override aspect_ratio (W:H) "
                               "and set the pixel grid for the bboxes/preview outputs.",
                }),
                "height": ("INT", {
                    "default": 0, "min": 0, "max": 16384, "step": 8,
                    "tooltip": "Target height. 0 = use the aspect ratio set in the editor.",
                }),
            },
            "optional": {
                "image": ("IMAGE", {
                    "tooltip": "Optional reference image: dimmed behind the preview output and "
                               "shown as the editor backdrop (loads on run).",
                }),
                "import_json": ("STRING", {
                    "forceInput": True,
                    "tooltip": "Optional caption JSON loaded into the editor on run. The output "
                               "always reflects the editor, never this raw input.",
                }),
                "florence_caption": ("STRING", {
                    "forceInput": True,
                    "tooltip": "Florence2Run `caption` -> high_level_description (auto-fill on run).",
                }),
                "florence_data": ("JSON", {
                    "tooltip": "Florence2Run `data` (region/OCR boxes). Auto-placed as elements; "
                               "needs the `image` input connected (boxes are in image pixel space). "
                               "Note: kijai's `data` has no per-region labels for OD/dense — use "
                               "`florence_regions` for labeled boxes.",
                }),
                "florence_regions": ("STRING", {
                    "forceInput": True,
                    "tooltip": "A region task's raw `caption` (label<loc_..> string). Parsed into "
                               "labeled boxes (desc = label) — recovers labels that `data` drops. "
                               "Coords are normalized, so no `image` needed.",
                }),
            },
        }

    RETURN_TYPES = ("STRING", "IMAGE", "BOUNDING_BOX", "INT", "INT")
    RETURN_NAMES = ("prompt", "preview", "bboxes", "width", "height")
    FUNCTION = "build"
    CATEGORY = "Ideogram4"
    DESCRIPTION = ("Visual bbox editor for the Ideogram-4 caption JSON. Outputs the caption string, "
                   "a preview image, pixel-space bounding boxes (SAM3/crop), and the resolved size.")

    def build(self, caption_json: str, width: int = 0, height: int = 0,
              image=None, import_json: str = "", florence_caption: str = "", florence_data=None,
              florence_regions: str = ""):
        obj = _apply_size(_parse_caption(caption_json), width, height)
        prompt = json.dumps(obj, ensure_ascii=False) if obj else "{}"
        W, H = _resolve_canvas(obj, width, height)
        bboxes = _pixel_bboxes(obj, W, H)
        preview = _render_preview(obj, W, H, image)

        ui = {"dims": [W, H]}
        if image is not None:
            ref = _save_reference(image)
            if ref:
                ui["bg_image"] = [ref]
        if import_json and import_json.strip():
            try:
                cap = json.loads(import_json)
                if isinstance(cap, dict):
                    ui["caption"] = [json.dumps(cap, ensure_ascii=False)]
            except (json.JSONDecodeError, ValueError):
                pass
        fl = _florence_caption_obj(florence_caption, florence_data, image, width, height, florence_regions)
        if fl is not None:
            ui["florence"] = [json.dumps(fl, ensure_ascii=False)]
        return {"ui": ui, "result": (prompt, preview, bboxes, W, H)}


NODE_CLASS_MAPPINGS = {"Ideogram4BboxEditor": Ideogram4BboxEditor}
NODE_DISPLAY_NAME_MAPPINGS = {"Ideogram4BboxEditor": "Ideogram4 Bbox Editor"}
