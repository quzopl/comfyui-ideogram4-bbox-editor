"""ComfyUI node: Ideogram4 Bbox Editor.

Renders a visual bbox/caption editor on the node (see web/ideogram4_bbox_editor.js)
and outputs the assembled Ideogram-4 caption as a JSON string. The Python side is
a thin validator/pass-through; all caption-building logic lives in the JS widget.
"""
from __future__ import annotations

import json


class Ideogram4BboxEditor:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                # Managed by the JS DOM widget; hidden in the UI. Holds the live
                # caption JSON so it persists in the saved workflow and reaches
                # the backend.
                "caption_json": ("STRING", {"default": "{}", "multiline": True}),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("prompt",)
    FUNCTION = "build"
    CATEGORY = "Ideogram4"
    DESCRIPTION = "Visual bbox editor for the Ideogram-4 caption JSON. Outputs the caption as a string."

    def build(self, caption_json: str):
        raw = (caption_json or "").strip()
        if not raw:
            return ("{}",)
        try:
            obj = json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            return ("{}",)
        return (json.dumps(obj, ensure_ascii=False),)


NODE_CLASS_MAPPINGS = {"Ideogram4BboxEditor": Ideogram4BboxEditor}
NODE_DISPLAY_NAME_MAPPINGS = {"Ideogram4BboxEditor": "Ideogram4 Bbox Editor"}
