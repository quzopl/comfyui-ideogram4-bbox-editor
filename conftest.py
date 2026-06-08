import sys
from pathlib import Path

# Make the custom_nodes directory available so this package can be imported
# as a proper Python package when pytest runs.
_CUSTOM_NODES = Path(__file__).resolve().parent.parent
if str(_CUSTOM_NODES) not in sys.path:
    sys.path.insert(0, str(_CUSTOM_NODES))
