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


# ---- florence-2 ingest -----------------------------------------------------
def test_florence_grounding_dict_with_labels():
    data = {"bboxes": [[0, 0, 500, 1000]], "labels": ["a dog"]}
    out = ig4._florence_elements(data, 1000, 1000)
    assert out == [{"type": "obj", "bbox": [0, 0, 1000, 500], "desc": "a dog"}]


def test_florence_bare_box_list_wrapped():
    data = [[[0, 0, 500, 1000], [200, 100, 700, 300]]]  # OD/dense: boxes, no labels, wrapped one level
    out = ig4._florence_elements(data, 1000, 1000)
    assert [e["type"] for e in out] == ["obj", "obj"]
    assert out[0]["bbox"] == [0, 0, 1000, 500] and out[0]["desc"] == ""


def test_florence_ocr_quad_to_text():
    data = [{"label": "QUZ0", "box": [100, 50, 300, 50, 300, 150, 100, 150]}]  # 8-num quad
    out = ig4._florence_elements(data, 1000, 1000)
    assert out == [{"type": "text", "bbox": [50, 100, 150, 300], "text": "QUZ0", "desc": ""}]


def test_florence_needs_dims():
    assert ig4._florence_elements({"bboxes": [[0, 0, 1, 1]], "labels": ["x"]}, 0, 0) == []


def test_florence_caption_obj_assembles():
    fl = ig4._florence_caption_obj("a scene", {"bboxes": [[0, 0, 512, 512]], "labels": ["x"]},
                                   None, 1024, 1024)
    assert fl["aspect_ratio"] == "1:1"
    assert fl["high_level_description"] == "a scene"
    assert fl["compositional_deconstruction"]["elements"][0]["desc"] == "x"


def test_florence_caption_obj_none_when_empty():
    assert ig4._florence_caption_obj("", None, None, 0, 0) is None


def test_loc_elements_parses_region_string():
    txt = ("human face<loc_531><loc_193><loc_623><loc_360>"
           "man<loc_393><loc_159><loc_768><loc_998>"
           "street light<loc_305><loc_98><loc_402><loc_600>")
    out = ig4._loc_elements(txt)
    assert [e["desc"] for e in out] == ["human face", "man", "street light"]
    # x1,y1,x2,y2 (0-999) -> [ymin,xmin,ymax,xmax] (0-1000); first box ~ [193,531,360,623]
    assert out[0]["type"] == "obj"
    assert out[0]["bbox"] == [193, 532, 360, 624]


def test_loc_caption_becomes_elements_not_hld():
    txt = "cat<loc_100><loc_100><loc_500><loc_500>"
    fl = ig4._florence_caption_obj(txt, None, None, 1024, 1024)
    assert fl["high_level_description"] == ""               # raw region string not dumped into HLD
    assert fl["compositional_deconstruction"]["elements"][0]["desc"] == "cat"


def test_plain_caption_stays_hld():
    fl = ig4._florence_caption_obj("a quiet harbour at dawn", None, None, 1024, 1024)
    assert fl["high_level_description"] == "a quiet harbour at dawn"


def test_regions_input_gives_labeled_boxes_with_prose_hld():
    # prose caption -> HLD, region string -> labeled boxes (the user's case)
    fl = ig4._florence_caption_obj(
        "a busy street at dusk",
        None, None, 1024, 1024,
        florence_regions="man<loc_393><loc_159><loc_768><loc_998>street light<loc_305><loc_98><loc_402><loc_600>",
    )
    assert fl["high_level_description"] == "a busy street at dusk"
    els = fl["compositional_deconstruction"]["elements"]
    assert [e["desc"] for e in els] == ["man", "street light"]
    assert all(e["type"] == "obj" and len(e["bbox"]) == 4 for e in els)


# ---- node interface --------------------------------------------------------
def test_input_types():
    t = Node.INPUT_TYPES()
    assert t["required"]["caption_json"][0] == "STRING"
    assert t["required"]["width"][0] == "INT" and t["required"]["height"][0] == "INT"
    assert t["optional"]["image"][0] == "IMAGE"
    assert t["optional"]["import_json"][0] == "STRING"
    assert t["optional"]["florence_caption"][0] == "STRING"
    assert t["optional"]["florence_data"][0] == "JSON"
    assert t["optional"]["florence_regions"][0] == "STRING"


def test_return_signature():
    assert Node.RETURN_TYPES == ("STRING", "IMAGE", "BOUNDING_BOX", "INT", "INT")
    assert Node.RETURN_NAMES == ("prompt", "preview", "bboxes", "width", "height")
