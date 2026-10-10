"""Make a small JPG preview of any image: python tools/imagegen/preview.py <in> <out.jpg> [width]"""
import sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from _lib import preview
preview(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 1280)
