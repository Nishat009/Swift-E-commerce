'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useAvatarStore } from '@/stores/avatarStore';
import { buildFigure, Figure } from './mannequin/build';
import { outfitFromState, describeLook } from './mannequin/outfit';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Camera,
  Undo2,
  Redo2,
  Sparkles,
  Move,
  Play,
  Pause,
  Focus,
} from 'lucide-react';
import Button from '../ui/Button';

const SCENE_PHOTOS: Record<string, string> = {
  tokyo: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=1200&q=80',
  paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
  beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  rooftop: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
  editorial: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
};

const CAMERA_HOME = new THREE.Vector3(0, 1.15, 4.1);
const TARGET_HOME = new THREE.Vector3(0, 0.92, 0);

interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  slot: THREE.Group;
  floor: THREE.Mesh;
  studio: THREE.Texture;
  figure: Figure | null;
}

function studioBackdrop() {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#f6f2ec');
  g.addColorStop(0.6, '#ece5dc');
  g.addColorStop(1, '#ddd4c8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function AvatarViewer() {
  const { avatar, wornItems, demoDress, undoStack, redoStack, undo, redo, resetOutfit } = useAvatarStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // --- Studio: renderer, lights, plinth, controls ---
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
    const studio = studioBackdrop();
    scene.background = studio;
    scene.fog = new THREE.Fog('#e3dbd0', 7, 16);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    scene.environmentIntensity = 0.6;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
    camera.position.copy(CAMERA_HOME);

    const controls = new OrbitControls(camera, canvas);
    controls.target.copy(TARGET_HOME);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableZoom = false; // keep page scrolling; zoom via the toolbar
    controls.minDistance = 1.6;
    controls.maxDistance = 6;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = 1.62;
    controls.rotateSpeed = 0.8;
    controls.autoRotateSpeed = 1.4;
    controls.update();

    scene.add(new THREE.HemisphereLight(0xfff6ec, 0x6b5b4b, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.0);
    key.position.set(2.5, 4, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -1.2;
    key.shadow.camera.right = 1.2;
    key.shadow.camera.top = 2.2;
    key.shadow.camera.bottom = -0.4;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 3;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffe2c4, 1.2);
    rim.position.set(-3, 2.5, -3);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xdfe8ff, 0.5);
    fill.position.set(-3, 1.5, 2);
    scene.add(fill);

    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.6, 0.06, 96),
      new THREE.MeshPhysicalMaterial({ color: '#f3efe9', roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
    );
    plinth.position.y = -0.03;
    plinth.receiveShadow = true;
    scene.add(plinth);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.552, 0.004, 8, 128),
      new THREE.MeshPhysicalMaterial({ color: '#c9a96b', metalness: 0.9, roughness: 0.3 }),
    );
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(8, 64),
      new THREE.MeshStandardMaterial({ color: '#e6dfd5', roughness: 1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.06;
    floor.receiveShadow = true;
    scene.add(floor);

    const slot = new THREE.Group();
    scene.add(slot);

    const stage: Stage = { renderer, scene, camera, controls, slot, floor, studio, figure: null };
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
      stage.figure?.update(performance.now() / 1000);
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      stage.figure?.dispose();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry.dispose();
          (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => m.dispose());
        }
      });
      if (scene.background instanceof THREE.Texture && scene.background !== studio) scene.background.dispose();
      studio.dispose();
      env.dispose();
      room.dispose();
      pmrem.dispose();
      renderer.dispose();
      stageRef.current = null;
    };
  }, []);

  // --- Mannequin + outfit ---
  const outfit = useMemo(() => outfitFromState(wornItems, demoDress), [wornItems, demoDress]);
  const { gender, bodyType, height, skinTone, hairStyle, hairColor, pose } = avatar;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const figure = buildFigure({ gender, bodyType, height, skinTone, hairStyle, hairColor, pose }, outfit);
    if (stage.figure) {
      stage.slot.remove(stage.figure.root);
      stage.figure.dispose();
    }
    stage.slot.add(figure.root);
    stage.figure = figure;
  }, [outfit, gender, bodyType, height, skinTone, hairStyle, hairColor, pose]);

  // --- Backdrop ---
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const url = SCENE_PHOTOS[avatar.backgroundScene];
    const previous = stage.scene.background;
    const dropPrevious = () => {
      if (previous instanceof THREE.Texture && previous !== stage.studio) previous.dispose();
    };
    if (!url) {
      stage.scene.background = stage.studio;
      stage.floor.visible = true;
      dropPrevious();
      return;
    }
    let cancelled = false;
    new THREE.TextureLoader().setCrossOrigin('anonymous').load(url, (texture) => {
      if (cancelled || stageRef.current !== stage) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      stage.scene.background = texture;
      stage.floor.visible = false;
      dropPrevious();
    });
    return () => {
      cancelled = true;
    };
  }, [avatar.backgroundScene]);

  useEffect(() => {
    if (stageRef.current) stageRef.current.controls.autoRotate = autoRotate;
  }, [autoRotate]);

  const zoom = (factor: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const { camera, controls } = stage;
    const offset = camera.position.clone().sub(controls.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
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

  const handleExportImage = () => {
    const stage = stageRef.current;
    if (!stage) return;
    setIsExporting(true);
    try {
      stage.renderer.render(stage.scene, stage.camera);
      const url = stage.renderer.domElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `swiftcart_${avatar.gender}_look.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      // Photo backdrops from another origin can taint the canvas
      console.error('Failed to export snapshot PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const look = describeLook(wornItems, demoDress);
  const nothingWorn = Object.keys(wornItems).length === 0 && !demoDress;

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-[#faf9f6] p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      {/* Viewport */}
      <div ref={containerRef} className="group relative h-[460px] w-full cursor-grab overflow-hidden rounded-xl active:cursor-grabbing sm:h-[540px]">
        <canvas ref={canvasRef} className="block h-full w-full touch-none" />

        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-[#8b6f47]" />
          <span className="font-serif text-[10px] font-bold uppercase tracking-widest text-[#8b6f47]">SwiftCart 3D Studio</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportImage}
          disabled={isExporting}
          className="absolute right-3 top-3 z-10 rounded-full border-gray-200/80 bg-white/80 p-2 text-gray-700 shadow-sm hover:bg-white hover:text-[#8b6f47]"
          title="Save a photo of this look"
        >
          <Camera className="h-4 w-4" />
        </Button>

        <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gray-900/60 px-3 py-1.5 text-[9px] font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Move className="h-3 w-3" />
          Drag to rotate 360°
        </div>
      </div>

      {/* Current look */}
      <p className="mt-3 truncate text-center text-[11px] text-gray-500 dark:text-gray-400" title={look}>
        <span className="font-semibold text-gray-700 dark:text-gray-200">Wearing:</span> {look}
      </p>

      {/* Toolbar */}
      <div className="z-10 mt-3 flex w-full items-center justify-between gap-2 rounded-2xl border border-gray-200/60 bg-white p-2 shadow-sm dark:border-gray-800/80 dark:bg-gray-900">
        <div className="flex rounded-full border border-gray-100 bg-gray-50 p-0.5 dark:border-gray-900 dark:bg-gray-950">
          <Button variant="outline" size="sm" onClick={() => zoom(1.18)} className="rounded-full border-0 bg-transparent p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => zoom(0.85)} className="rounded-full border-0 bg-transparent p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetView} className="rounded-full border-0 bg-transparent p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Reset view" title="Reset view">
            <Focus className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setAutoRotate((v) => !v)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold ${autoRotate ? 'border-[#8b6f47] text-[#8b6f47] dark:border-[#c9a96b] dark:text-[#c9a96b]' : ''}`}
          aria-pressed={autoRotate}
        >
          {autoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{autoRotate ? 'Stop' : 'Turntable'}</span>
        </Button>

        <div className="flex gap-1 rounded-full border border-gray-100 bg-gray-50 p-0.5 dark:border-gray-900 dark:bg-gray-950">
          <Button variant="outline" size="sm" onClick={undo} disabled={undoStack.length === 0} className="rounded-full border-0 bg-transparent p-2 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800" aria-label="Undo worn item">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={redo} disabled={redoStack.length === 0} className="rounded-full border-0 bg-transparent p-2 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800" aria-label="Redo worn item">
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetOutfit} disabled={nothingWorn} className="rounded-full border-0 bg-transparent p-2 text-red-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800" aria-label="Take everything off">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
