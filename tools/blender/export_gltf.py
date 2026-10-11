"""Export the diorama to GLB and compress it (owner: scene-lead).

    tools/.venv-blender/bin/python tools/blender/export_gltf.py            # raw export to _source/blender/shiv-shiva.raw.glb, then optimise
    tools/.venv-blender/bin/python tools/blender/export_gltf.py --no-opt   # raw export only

Node names are kept (`b-<building id>`, `plots-<strip id>`, `tree-NNN`, `car-NN` ...) because the web scene picks buildings
by name. Trees share one mesh, so `gltf-transform optimize` turns them into EXT_mesh_gpu_instancing. `join` stays off for the
same reason: joining would merge every building into one mesh. Target 2.5 MB or less.
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import bpy

from common import BLEND_PATH, ROOT

RAW = ROOT / "_source/blender/shiv-shiva.raw.glb"
OUT = ROOT / "public/3d/shiv-shiva.glb"
MAX_BYTES = int(2.5 * 1024 * 1024)


def export_raw() -> None:
    bpy.ops.wm.open_mainfile(filepath=str(BLEND_PATH))
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.data.objects:
        if obj.type == "MESH":
            obj.select_set(True)
    RAW.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(RAW), export_format="GLB", use_selection=True, export_yup=True, export_apply=False,
        export_cameras=False, export_lights=False, export_materials="EXPORT", export_normals=True,
        export_texcoords=False, export_extras=False,
    )


def optimise() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["npx", "gltf-transform", "optimize", str(RAW), str(OUT), "--compress", "meshopt", "--join", "false",
           "--flatten", "false", "--simplify", "false", "--texture-compress", "false", "--palette", "false",
           "--instance", "true", "--instance-min", "2"]
    subprocess.run(cmd, check=True, cwd=ROOT, stdout=subprocess.DEVNULL)
    size = OUT.stat().st_size
    print(f"raw {RAW.stat().st_size / 1e6:.2f} MB -> {size / 1e6:.2f} MB ({'ok' if size <= MAX_BYTES else 'OVER BUDGET'})")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-opt", action="store_true")
    a = ap.parse_args()
    export_raw()
    if not a.no_opt:
        optimise()
