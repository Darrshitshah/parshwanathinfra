/**
 * The Tier A scene, in plain three.js (no React inside). Owner: scene-lead.
 *
 * Why not React Three Fiber: importing @react-three/fiber augments the global JSX namespace with three's element names,
 * which breaks the dynamic `Tag` props in src/motion/Reveal.tsx, src/components/ui/Section.tsx and cursor/Magnetic.tsx
 * (they type-check as `never`). A plain-three runtime avoids that and is a smaller lazy chunk.
 *
 * Renders on demand: a frame is drawn only while the camera is easing, the pointer changes the hover tint, or the size
 * changes, so an idle scene costs nothing. `dispose()` stops the loop, removes listeners and frees the WebGL context.
 */
import {
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { buildingIdOf } from "./building-picking";
import { MODEL_URL } from "./frames";
import type { ProgressStore } from "./progress-store";
import { poseAtProgress, sceneMeta, verticalFovDeg, type LabelAnchor, type Station } from "./stations";

const TYPE_HEX: Record<string, string> = { flats: "#2f6db0", rowhouses: "#c9601f", shops: "#1d8460", mixed: "#6a5fa8", office: "#9a8f7a" };
const CLAY_HEX = "#f4f1ea";
const TINT_STRENGTH = 0.62;
const DAMPING = 5.5;
const SETTLE_DISTANCE_M = 0.05;
const MAX_PIXEL_RATIO = 1.75;
const SUN_OFFSET: [number, number, number] = [-167, 244, 270];
const SHADOW_EXTENT_M = 290;
const KNOWN_IDS: ReadonlySet<string> = new Set(sceneMeta.buildings.map((b) => b.id));
const TYPOLOGY_OF = new Map(sceneMeta.buildings.map((b) => [b.id, b.typology]));

export interface SceneOptions {
  container: HTMLElement;
  stations: readonly Station[];
  store: ProgressStore;
  onReady: () => void;
  onFail: () => void;
  onSelect?: (buildingId: string) => void;
  onHover?: (hovering: boolean) => void;
}

export interface SceneHandle {
  setLabels(anchors: readonly LabelAnchor[], elements: ReadonlyMap<string, HTMLElement>): void;
  dispose(): void;
}

export function createDioramaScene(options: SceneOptions): SceneHandle {
  const { container, stations, store } = options;
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // the model is static: one shadow pass after it loads
  const canvas = renderer.domElement;
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  canvas.setAttribute("aria-hidden", "true");
  container.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(verticalFovDeg(20 / 11), 20 / 11, 5, 4000);
  scene.add(new HemisphereLight("#f3f3f0", "#e6e4dd", 1.5));
  const sun = new DirectionalLight("#fffaf0", 3.0);
  sun.position.set(...SUN_OFFSET);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  Object.assign(sun.shadow.camera, { left: -SHADOW_EXTENT_M, right: SHADOW_EXTENT_M, top: SHADOW_EXTENT_M, bottom: -SHADOW_EXTENT_M, near: 50, far: 900 });
  scene.add(sun);

  let disposed = false;
  let frameHandle = 0;
  let lastTime = 0;
  let position: Vector3 | null = null;
  let aim: Vector3 | null = null;
  let labels: Array<{ anchor: LabelAnchor; element: HTMLElement; world: Vector3 }> = [];
  let model: Object3D | null = null;
  const pickables: Mesh[] = [];
  const byBuilding = new Map<string, Mesh[]>();
  const swapped = new Map<Mesh, Material | Material[]>();
  const tintMaterials: Record<string, MeshStandardMaterial> = {};
  let hoveredId: string | null = null;
  let readyPending = false; // the model is in the scene; `onReady` fires once its first frame has been drawn
  const pointer = new Vector2();
  const raycaster = new Raycaster();
  const projected = new Vector3();

  function setTint(id: string | null) {
    if (id === hoveredId) return;
    swapped.forEach((material, mesh) => {
      mesh.material = material;
    });
    swapped.clear();
    hoveredId = id;
    if (id) {
      const tint = tintMaterials[TYPOLOGY_OF.get(id) ?? "flats"];
      byBuilding.get(id)?.forEach((mesh) => {
        const current = mesh.material;
        if (!Array.isArray(current) && current.name === "clay") {
          swapped.set(mesh, current);
          mesh.material = tint;
        }
      });
    }
    options.onHover?.(id !== null);
    requestRender();
  }

  function pick(event: PointerEvent): string | null {
    if (!pickables.length) return null;
    const rect = canvas.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0];
    return hit ? (buildingIdOf(hit.object, KNOWN_IDS) ?? null) : null;
  }

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === "mouse") setTint(pick(event));
  };
  const onPointerLeave = () => setTint(null);
  const onClick = (event: MouseEvent) => {
    const id = pick(event as PointerEvent);
    if (id) options.onSelect?.(id);
  };
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("click", onClick);

  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = verticalFovDeg(camera.aspect);
    camera.updateProjectionMatrix();
    requestRender();
  }
  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
  observer?.observe(container);
  const unsubscribe = store.subscribe(() => requestRender());

  function updateLabels() {
    const { clientWidth: w, clientHeight: h } = container;
    for (const { element, world } of labels) {
      projected.copy(world).project(camera);
      const visible = projected.z < 1 && Math.abs(projected.x) < 1.1 && Math.abs(projected.y) < 1.1;
      element.style.opacity = visible ? "1" : "0";
      element.style.transform = `translate(${((projected.x + 1) / 2) * w}px, ${((1 - projected.y) / 2) * h}px) translate(-50%, -50%)`;
    }
  }

  function frame(time: number) {
    frameHandle = 0;
    if (disposed) return;
    const dt = Math.min((time - lastTime) / 1000 || 0.016, 0.1);
    lastTime = time;
    const goal = poseAtProgress(stations, store.get());
    const goalPosition = new Vector3(...goal.position);
    const goalAim = new Vector3(...goal.aim);
    position ??= goalPosition.clone();
    aim ??= goalAim.clone();
    const k = 1 - Math.exp(-DAMPING * dt);
    position.lerp(goalPosition, k);
    aim.lerp(goalAim, k);
    camera.position.copy(position);
    camera.lookAt(aim);
    camera.updateMatrixWorld();
    renderer.render(scene, camera);
    updateLabels();
    if (readyPending) {
      readyPending = false;
      options.onReady();
    }
    if (position.distanceTo(goalPosition) > SETTLE_DISTANCE_M || aim.distanceTo(goalAim) > SETTLE_DISTANCE_M) requestRender();
  }
  function requestRender() {
    if (!frameHandle && !disposed) frameHandle = requestAnimationFrame(frame);
  }

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.loadAsync(MODEL_URL).then(
    (gltf) => {
      if (disposed) return;
      model = gltf.scene;
      const clay = new Color(CLAY_HEX);
      for (const [type, hex] of Object.entries(TYPE_HEX)) {
        tintMaterials[type] = new MeshStandardMaterial({ color: clay.clone().lerp(new Color(hex), TINT_STRENGTH), roughness: 0.9 });
      }
      model.traverse((object) => {
        const mesh = object as Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const id = buildingIdOf(mesh, KNOWN_IDS);
        if (id) {
          pickables.push(mesh);
          byBuilding.set(id, [...(byBuilding.get(id) ?? []), mesh]);
        }
      });
      scene.add(model);
      renderer.shadowMap.needsUpdate = true;
      readyPending = true;
      resize(); // requests the frame that reports ready
    },
    () => {
      if (!disposed) options.onFail();
    },
  );
  resize();

  return {
    setLabels(anchors, elements) {
      labels = anchors.flatMap((anchor) => {
        const element = elements.get(anchor.id);
        return element ? [{ anchor, element, world: new Vector3(...anchor.position) }] : [];
      });
      requestRender();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameHandle);
      unsubscribe();
      observer?.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("click", onClick);
      swapped.forEach((material, mesh) => {
        mesh.material = material;
      });
      model?.traverse((object) => {
        const mesh = object as Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        [mesh.material].flat().forEach((m) => m.dispose());
      });
      Object.values(tintMaterials).forEach((m) => m.dispose());
      sun.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
