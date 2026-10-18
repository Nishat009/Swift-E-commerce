'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Focus, Pause, Play, ZoomIn, ZoomOut } from 'lucide-react';
import { Gender, bodySpec, buildMannequin } from './tryon/body';
import { BuiltGarment, GarmentImage, GarmentKind, LayerRecord, analyzeGarmentImage, buildGarment, plainGarment } from './tryon/garment';

export interface WornGarment {
  key: string;
  image: string;
  kind: GarmentKind;
  title: string;
}

// Inner layers first so each one goes over the last.
const LAYER_ORDER: Record<GarmentKind, number> = { pants: 0, skirt: 0, top: 1, dress: 2, outer: 3 };
const CAMERA_HOME = new THREE.Vector3(0, 1.02, 4.7);
const TARGET_HOME = new THREE.Vector3(0, 0.9, 0);

const isSameOrigin = (src: string) => {
  if (/^(blob:|data:|\/(?!\/))/.test(src)) return true;
  try {
    return new URL(src).origin === window.location.origin;
  } catch {
    return true;
  }
};

function loadImage(src: string, crossOrigin: boolean) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

const analyzed = new Map<string, Promise<GarmentImage>>();
function garmentImage(src: string) {
  let pending = analyzed.get(src);
  if (!pending) {
    // The canvas needs the pixels: remote images must allow CORS, or come through Next's
    // image endpoint (same origin) for hosts it is configured to optimise.
    pending = (isSameOrigin(src)
      ? loadImage(src, false)
      : loadImage(src, true).catch(() => loadImage(`/_next/image?url=${encodeURIComponent(src)}&w=828&q=90`, false))
    ).then(analyzeGarmentImage);
    pending.catch(() => analyzed.delete(src));
    analyzed.set(src, pending);
  }
  return pending;
}

const plain = new Map<string, GarmentImage>();
function plainStandIn(kind: GarmentKind, color: string) {
  const key = `${kind}:${color}`;
  if (!plain.has(key)) plain.set(key, plainGarment(kind, color));
  return plain.get(key)!;
}

function roughnessFor(title: string) {
  if (/silk|satin|leather|vinyl|sequin/i.test(title)) return 0.5;
  if (/denim|wool|knit|linen|cotton|tweed|fleece/i.test(title)) return 0.92;
  return 0.8;
}

interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  figure: THREE.Group | null;
  garments: BuiltGarment[];
  mannequin: THREE.Material;
}

export default function FittingRoom3D({ gender, items }: { gender: Gender; items: WornGarment[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const [turntable, setTurntable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const [simplified, setSimplified] = useState<string[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f3f1ed');
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    scene.environment = env;
    scene.environmentIntensity = 0.55;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c8, 0.7));
    const key = new THREE.DirectionalLight(0xfffaf3, 1.7);
    key.position.set(1.6, 3.4, 2.6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -1.2, right: 1.2, top: 2.2, bottom: -0.4, near: 0.5, far: 9 });
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 4;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xf0f4ff, 0.45);
    fill.position.set(-2.5, 1.6, 1.8);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.6);
    rim.position.set(0, 2.4, -3);
    scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.4, 64),
      new THREE.MeshStandardMaterial({ color: '#ebe7e1', roughness: 1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 30);
    camera.position.copy(CAMERA_HOME);
    const controls = new OrbitControls(camera, canvas);
    controls.target.copy(TARGET_HOME);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false; // keep the page scrolling; zoom from the toolbar
    controls.minDistance = 1.4;
    controls.maxDistance = 6;
    controls.minPolarAngle = 0.5;
    controls.maxPolarAngle = 1.62;
    controls.autoRotateSpeed = 1.6;
    controls.update();

    const mannequin = new THREE.MeshStandardMaterial({ color: '#e7e2da', roughness: 0.55 });
    const stage: Stage = { renderer, scene, camera, controls, figure: null, garments: [], mannequin };
    stageRef.current = stage;

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    let frame = 0;
    const loop = () => {
      frame = requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      for (const g of stage.garments) g.dispose();
      stage.figure?.traverse((obj) => (obj as THREE.Mesh).geometry?.dispose());
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      mannequin.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      stageRef.current = null;
    };
  }, []);

  const itemsKey = items.map((item) => `${item.key}:${item.kind}`).join('|');
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let cancelled = false;
    const ordered = [...items].sort((a, b) => LAYER_ORDER[a.kind] - LAYER_ORDER[b.kind]);
    setLoading(ordered.length > 0);

    Promise.allSettled(ordered.map((item) => garmentImage(item.image))).then((results) => {
      if (cancelled || stageRef.current !== stage) return;
      const body = bodySpec(gender);
      const figure = new THREE.Group();
      figure.add(buildMannequin(body, stage.mannequin));
      const garments: BuiltGarment[] = [];
      const layers: LayerRecord[] = [];
      const missing: string[] = [];
      const standIns: string[] = [];
      results.forEach((result, i) => {
        if (result.status !== 'fulfilled') {
          missing.push(ordered[i].title);
          return;
        }
        let img = result.value;
        if (!img.usable) {
          img = plainStandIn(ordered[i].kind, img.color);
          standIns.push(ordered[i].title);
        }
        const garment = buildGarment(body, img, ordered[i].kind, {
          roughness: roughnessFor(ordered[i].title),
          inner: layers,
        });
        garments.push(garment);
        layers.push(garment.record);
        figure.add(garment.group);
      });

      if (stage.figure) {
        stage.scene.remove(stage.figure);
        stage.figure.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh && mesh.material === stage.mannequin) mesh.geometry.dispose();
        });
      }
      for (const g of stage.garments) g.dispose();
      stage.scene.add(figure);
      stage.figure = figure;
      stage.garments = garments;
      setFailed(missing);
      setSimplified(standIns);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // itemsKey stands in for items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender, itemsKey]);

  useEffect(() => {
    if (stageRef.current) stageRef.current.controls.autoRotate = turntable;
  }, [turntable]);

  const zoom = (factor: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const { camera, controls } = stage;
    const offset = camera.position.clone().sub(controls.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
    // Zooming in looks at the upper body, where the detail is.
    const t = THREE.MathUtils.clamp((offset.length() - 2) / 2.7, 0, 1);
    controls.target.y = THREE.MathUtils.lerp(1.15, TARGET_HOME.y, t);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  };

  const resetView = () => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.camera.position.copy(CAMERA_HOME);
    stage.controls.target.copy(TARGET_HOME);
    stage.controls.update();
  };

  const tool = 'rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-[#f3f1ed] dark:border-gray-800">
      <div ref={containerRef} className="relative h-[480px] w-full cursor-grab active:cursor-grabbing sm:h-[600px]">
        <canvas ref={canvasRef} className="block h-full w-full touch-none" aria-label="3D mannequin, drag to rotate" />
        {loading && (
          <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
            <span className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs text-gray-600 shadow-sm">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
              Fitting...
            </span>
          </div>
        )}
        {failed.length > 0 && !loading && (
          <p className="absolute inset-x-4 top-4 rounded-lg bg-white/90 px-3 py-2 text-center text-xs text-red-600 shadow-sm">
            Couldn&apos;t load the image for {failed.join(', ')}.
          </p>
        )}
        {simplified.length > 0 && !loading && (
          <p className="pointer-events-none absolute inset-x-4 bottom-16 text-center text-[11px] text-gray-500">
            {simplified.join(', ')} {simplified.length > 1 ? 'are' : 'is'} shown in plain fabric: {simplified.length > 1 ? 'their photos show' : 'its photo shows'} it on a model, not laid flat.
          </p>
        )}
      </div>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-gray-200 bg-white/95 p-1 shadow-sm dark:border-gray-700 dark:bg-gray-900/95">
        <button type="button" onClick={() => zoom(1.2)} className={tool} aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></button>
        <button type="button" onClick={() => zoom(0.8)} className={tool} aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></button>
        <button type="button" onClick={resetView} className={tool} aria-label="Reset view"><Focus className="h-4 w-4" /></button>
        <button type="button" onClick={() => setTurntable((v) => !v)} className={tool} aria-label={turntable ? 'Stop rotating' : 'Rotate'} aria-pressed={turntable}>
          {turntable ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
