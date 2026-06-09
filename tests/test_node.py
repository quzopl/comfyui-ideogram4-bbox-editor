import json
import sys
from pathlib import Path

# import nodes.py directly without importing the package __init__ (which pulls
# in ComfyUI-only web glue). Load the module by file path.
import importlib.util

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("ig4_nodes", ROOT / "nodes.py")
ig4 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ig4)
Node = ig4.Ideogram4BboxEditor


def test_valid_json_roundtrips():
    caption = {"high_level_description": "a cat",
               "compositional_deconstruction": {"background": "sky", "elements": []}}
    raw = json.dumps(caption)
    (out,) = Node().build(caption_json=raw)
    assert json.loads(out) == caption


def test_empty_returns_empty_object():
    (out,) = Node().build(caption_json="")
    assert out == "{}"


def test_garbage_returns_empty_object():
    (out,) = Node().build(caption_json="not json {{{")
    assert out == "{}"


def test_unicode_preserved():
    raw = json.dumps({"high_level_description": "zdjęcie quz0"}, ensure_ascii=False)
    (out,) = Node().build(caption_json=raw)
    assert "quz0" in out and "zdjęcie" in out


def test_input_types_declares_caption_json():
    t = Node.INPUT_TYPES()
    assert "caption_json" in t["required"]
    assert t["required"]["caption_json"][0] == "STRING"
    assert t["required"]["width"][0] == "INT"
    assert t["required"]["height"][0] == "INT"


def test_width_height_override_aspect_ratio():
    raw = json.dumps({"aspect_ratio": "1:1", "high_level_description": "x",
                      "compositional_deconstruction": {"background": "", "elements": []}})
    (out,) = Node().build(caption_json=raw, width=1024, height=1280)
    assert json.loads(out)["aspect_ratio"] == "4:5"


def test_zero_size_keeps_editor_aspect_ratio():
    raw = json.dumps({"aspect_ratio": "16:9", "compositional_deconstruction": {"elements": []}})
    (out,) = Node().build(caption_json=raw, width=0, height=0)
    assert json.loads(out)["aspect_ratio"] == "16:9"
