"""Make the module root importable as a package so pytest's Package.setup() succeeds."""
import sys
from pathlib import Path

# The module root's parent (custom_nodes) must be on sys.path so that
# pytest can import comfyui-ideogram4-bbox-editor as a package when it
# calls Package.setup() on our __init__.py.
_parent = str(Path(__file__).parent.parent)
if _parent not in sys.path:
    sys.path.insert(0, _parent)
