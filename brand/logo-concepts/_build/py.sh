#!/bin/sh
# Runs Python 3.12 with the logo toolchain (no project install). Usage: sh py.sh build.py 01 --proof
exec "$HOME/.local/bin/uv" run --no-project --python 3.12 \
  --with fonttools --with brotli --with uharfbuzz --with skia-pathops python "$@"
