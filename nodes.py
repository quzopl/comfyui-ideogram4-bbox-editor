"""ComfyUI node: Ideogram4 Bbox Editor.

Renders a visual bbox/caption editor on the node (see web/ideogram4_bbox_editor.js)
and outputs the assembled Ideogram-4 caption as a JSON string. The Python side is
a thin validator/pass-through; all caption-building logic lives in the JS widget.

Optional width/height inputs let the node carry the actual target size: when both
are > 0 the output's `aspect_ratio` is overridden with the reduced `W:H` (e.g.
connect a resolution node). 0 means "use the aspect ratio set in the editor".
"""
from __future__ import annotations

import json
from math import gcd


class Ideogram4BboxEditor:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                # Managed by the JS DOM widget; hidden in the UI. Holds the live
                # caption JSON so it persists in the saved workflow and reaches
                # the backend. NOT multiline on purpose: a multiline STRING becomes
                # a DOM textarea that `type="hidden"` can't fully hide, so it would
                # show the raw JSON and shove the width/height widgets off-screen.
                "caption_json": ("STRING", {"default": "{}"}),
                "width": ("INT", {
                    "default": 0, "min": 0, "max": 16384, "step": 8,
                    "tooltip": "Target width. 0 = use the aspect ratio set in the editor. "
                               "When both width and height are > 0 they override aspect_ratio (W:H). "
                               "Right-click → convert to input to drive it from a resolution node.",
                }),
                "height": ("INT", {
                    "default": 0, "min": 0, "max": 16384, "step": 8,
                    "tooltip": "Target height. 0 = use the aspect ratio set in the editor.",
                }),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("prompt",)
    FUNCTION = "build"
    CATEGORY = "Ideogram4"
    DESCRIPTION = "Visual bbox editor for the Ideogram-4 caption JSON. Outputs the caption as a string."

    def build(self, caption_json: str, width: int = 0, height: int = 0):
        raw = (caption_json or "").strip()
        if not raw:
            return ("{}",)
        try:
            obj = json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            return ("{}",)
        # Real size overrides the editor's aspect_ratio with reduced W:H.
        if isinstance(obj, dict) and width and height and width > 0 and height > 0:
            g = gcd(int(width), int(height)) or 1
            obj["aspect_ratio"] = f"{int(width) // g}:{int(height) // g}"
        return (json.dumps(obj, ensure_ascii=False),)


NODE_CLASS_MAPPINGS = {"Ideogram4BboxEditor": Ideogram4BboxEditor}
NODE_DISPLAY_NAME_MAPPINGS = {"Ideogram4BboxEditor": "Ideogram4 Bbox Editor"}
