# tools/imagegen

Run from the project folder (quote the path, it ends with a space):

    GOOGLE_CLOUD_PROJECT=my-jev-autonomous-agent ~/.local/bin/uv run --no-project --python 3.12 \
      --with google-genai --with pillow --with imageio-ffmpeg python tools/imagegen/<script>.py

- `sky.py [id ...]`: Nano Banana 2.1 cloud plates and the dive start frame (`_source/generated/sky-*.png`).
- `dusk.py [suffix]`: same-camera dusk edit of SS-26 (`ss26-row-houses-dusk.png`). Check it against the day image.
- `keyframes.py <preview_dir>`: 16:9 keyframes for Veo into `_source/generated/keyframes/`, WebP previews and a contact sheet.
- `preview.py <in> <out.jpg> [width]`: small preview of any image.
- `_lib.py`: client, backoff on 429, prompt saving, and the call log (`docs/IMAGEGEN_LOG.md`).

Veo clips and web encodes are added after Darshit approves the keyframes. Originals and prompts stay in `_source/generated/`.
