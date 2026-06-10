import json
import importlib.util
from pathlib import Path

# Load nodes.py directly without importing the package __init__ (which pulls in
# ComfyUI-only web glue). Heavy deps (torch/PIL) are lazy, so the module imports
# fine here; we only exercise the pure helpers, never the preview render.
ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("ig4_nodes", ROOT / "nodes.py")
ig4 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ig4)
Node = ig4.Ideogram4BboxEditor


# ---- caption parsing -------------------------------------------------------
def test_parse_valid():
    cap = {"high_level_description": "a cat",
           "compositional_deconstruction": {"background": "sky", "elements": []}}
    assert ig4._parse_caption(json.dumps(cap)) == cap


def test_parse_empty_and_garbage():
    assert ig4._parse_caption("") == {}
    assert ig4._parse_caption("not json {{{") == {}
    assert ig4._parse_caption("[1,2,3]") == {}  # non-dict JSON -> {}


def test_unicode_preserved():
    obj = ig4._parse_caption(json.dumps({"high_level_description": "zdjęcie quz0"}, ensure_ascii=False))
    out = json.dumps(obj, ensure_ascii=False)
    assert "quz0" in out and "zdjęcie" in out


# ---- aspect ratio from width/height ---------------------------------------
def test_size_overrides_aspect_ratio():
    obj = ig4._apply_size({"aspect_ratio": "1:1"}, 1024, 1280)
    assert obj["aspect_ratio"] == "4:5"


def test_zero_size_keeps_aspect_ratio():
    obj = ig4._apply_size({"aspect_ratio": "16:9"}, 0, 0)
    assert obj["aspect_ratio"] == "16:9"


# ---- canvas resolution -----------------------------------------------------
def test_resolve_canvas_explicit():
    assert ig4._resolve_canvas({}, 832, 1216) == (832, 1216)


def test_resolve_canvas_from_ratio():
    assert ig4._resolve_canvas({"aspect_ratio": "1:1"}, 0, 0) == (1024, 1024)
    w, h = ig4._resolve_canvas({"aspect_ratio": "4:5"}, 0, 0)  # portrait, long edge 1024
    assert h == 1024 and w == ig4._round16(1024 * 4 / 5)
    w, h = ig4._resolve_canvas({"aspect_ratio": "16:9"}, 0, 0)  # landscape
    assert w == 1024 and h == ig4._round16(1024 * 9 / 16)


# ---- pixel bboxes ----------------------------------------------------------
def test_pixel_bboxes_conversion():
    obj = {"compositional_deconstruction": {"elements": [
        {"type": "obj", "bbox": [0, 0, 1000, 500], "desc": "x"},     # left half
        {"type": "text", "bbox": [100, 200, 300, 700], "text": "Q"},
    ]}}
    out = ig4._pixel_bboxes(obj, 1000, 1000)
    assert out == [[
        {"x": 0, "y": 0, "width": 500, "height": 1000},
        {"x": 200, "y": 100, "width": 500, "height": 200},
    ]]


def test_pixel_bboxes_skips_missing_and_empty():
    assert ig4._pixel_bboxes({}, 1024, 1024) == []
    obj = {"compositional_deconstruction": {"elements": [{"type": "obj", "desc": "no bbox"}]}}
    assert ig4._pixel_bboxes(obj, 1024, 1024) == []  # bbox-less -> no frame


# ---- node interface --------------------------------------------------------
def test_input_types():
    t = Node.INPUT_TYPES()
    assert t["required"]["caption_json"][0] == "STRING"
    assert t["required"]["width"][0] == "INT" and t["required"]["height"][0] == "INT"
    assert t["optional"]["image"][0] == "IMAGE"
    assert t["optional"]["import_json"][0] == "STRING"


def test_return_signature():
    assert Node.RETURN_TYPES == ("STRING", "IMAGE", "BOUNDING_BOX", "INT", "INT")
    assert Node.RETURN_NAMES == ("prompt", "preview", "bboxes", "width", "height")
