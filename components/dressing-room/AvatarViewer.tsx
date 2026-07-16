'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useAvatarStore } from '@/stores/avatarStore';
import { Product } from '@/types';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Camera,
  Undo2,
  Redo2,
  Sparkles,
  Move,
  Loader2
} from 'lucide-react';
import Button from '../ui/Button';

export default function AvatarViewer() {
  const {
    avatar,
    wornItems,
    undoStack,
    redoStack,
    undo,
    redo,
    resetOutfit
  } = useAvatarStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs for 3D elements
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  
  // Ready Player Me model ref
  const rpmModelRef = useRef<THREE.Group | null>(null);
  const bgPlaneRef = useRef<THREE.Mesh | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);

  // Fallback Mannequin Mesh refs
  const fallbackGroupRef = useRef<THREE.Group | null>(null);
  const bodyMeshesRef = useRef<Record<string, THREE.Mesh | THREE.Group>>({});
  const clothesMeshesRef = useRef<Record<string, THREE.Mesh | THREE.Group>>({});

  // Loading and Fallback states
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const isDragging = useRef(false);
  const prevMouseX = useRef(0);

  // Catwalk humor logs
  const humorComments = [
    " Catalog details synced. Catwalk strut cycle active.",
    " Rendering localized 3D studio. Mara is ignoring calls from Paris.",
    " Stand clear: Rigged model is styling and profiling.",
    " AI Backdrop generated: Soft studio focus. Stance: Strutting.",
  ];
  const [activeHumorText, setActiveHumorText] = useState(humorComments[0]);

  useEffect(() => {
    const idx = Math.floor(Math.random() * humorComments.length);
    setActiveHumorText(humorComments[idx]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wornItems, avatar.pose, avatar.backgroundScene]);

  const getSpec = (product: Product | undefined, key: string): string => {
    if (!product || !product.specifications) return '';
    return product.specifications[key] || '';
  };

  const getSceneTextureUrl = (scene: string): string => {
    const scenes: Record<string, string> = {
      tokyo: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=600&q=80',
      paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80',
      beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      rooftop: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80',
      editorial: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    };
    return scenes[scene] || '';
  };

  // --- INITIALIZE THREE.JS RUNWAY SCENE ---
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#fafaf9');
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 5.0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const spotlight = new THREE.SpotLight(0xffecd0, 15, 10, Math.PI / 6, 0.5, 1);
    spotlight.position.set(0, 5, 3);
    spotlight.castShadow = true;
    scene.add(spotlight);

    // Background Plane
    const bgGeo = new THREE.PlaneGeometry(16, 12);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0xfaf9f6, toneMapped: false });
    const bgPlane = new THREE.Mesh(bgGeo, bgMat);
    bgPlane.position.set(0, 1, -3.5);
    scene.add(bgPlane);
    bgPlaneRef.current = bgPlane;

    // Metallic Catwalk platform
    const catwalkGeo = new THREE.BoxGeometry(2.4, 0.15, 6);
    const catwalkMat = new THREE.MeshStandardMaterial({
      color: 0x111115,
      roughness: 0.15,
      metalness: 0.85
    });
    const catwalk = new THREE.Mesh(catwalkGeo, catwalkMat);
    catwalk.position.set(0, -0.9, 0);
    catwalk.receiveShadow = true;
    scene.add(catwalk);

    // Runway grid pattern lines
    const gridHelper = new THREE.GridHelper(2.2, 10, 0x8b6f47, 0x27272a);
    gridHelper.position.set(0, -0.82, 0);
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // --- SETUP FALLBACK MANNEQUIN GROUP ---
    const fallbackGroup = new THREE.Group();
    fallbackGroup.position.set(0, -0.85, 0);
    scene.add(fallbackGroup);
    fallbackGroupRef.current = fallbackGroup;

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xe0a96d,
      roughness: 0.55,
      metalness: 0.1
    });

    // Fallback Torso
    const torsoGeo = new THREE.CylinderGeometry(0.35, 0.28, 1.3, 16);
    const torsoMesh = new THREE.Mesh(torsoGeo, skinMat);
    torsoMesh.position.y = 1.35;
    fallbackGroup.add(torsoMesh);
    bodyMeshesRef.current.torso = torsoMesh;

    // Fallback Head
    const headGeo = new THREE.SphereGeometry(0.28, 32, 32);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = 2.2;
    fallbackGroup.add(headMesh);
    bodyMeshesRef.current.head = headMesh;

    // Fallback Hair Group
    const hairGroup = new THREE.Group();
    hairGroup.position.set(0, 2.2, 0);
    fallbackGroup.add(hairGroup);
    bodyMeshesRef.current.hair = hairGroup;

    // Fallback Arms left & right
    const armGeo = new THREE.CylinderGeometry(0.09, 0.06, 0.9, 8);
    
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.5, 1.8, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, skinMat);
    leftArmMesh.position.y = -0.4; 
    leftArmGroup.add(leftArmMesh);
    fallbackGroup.add(leftArmGroup);
    bodyMeshesRef.current.leftArm = leftArmGroup;

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.5, 1.8, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, skinMat);
    rightArmMesh.position.y = -0.4;
    rightArmGroup.add(rightArmMesh);
    fallbackGroup.add(rightArmGroup);
    bodyMeshesRef.current.rightArm = rightArmGroup;

    // Fallback Legs left & right
    const legGeo = new THREE.CylinderGeometry(0.12, 0.08, 1.3, 12);
    
    const leftLegMesh = new THREE.Mesh(legGeo, skinMat);
    leftLegMesh.position.set(-0.18, 0.65, 0);
    fallbackGroup.add(leftLegMesh);
    bodyMeshesRef.current.leftLeg = leftLegMesh;

    const rightLegMesh = new THREE.Mesh(legGeo, skinMat);
    rightLegMesh.position.set(0.18, 0.65, 0);
    fallbackGroup.add(rightLegMesh);
    bodyMeshesRef.current.rightLeg = rightLegMesh;

    // --- FALLBACK CLOTHING MESHES ---
    // Tops
    const topGeo = new THREE.CylinderGeometry(0.37, 0.3, 0.9, 16);
    const topMat = new THREE.MeshStandardMaterial({ roughness: 0.7 });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.set(0, 1.45, 0);
    fallbackGroup.add(topMesh);
    clothesMeshesRef.current.top = topMesh;

    // Sleeves
    const sleeveGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.6, 8);
    
    const leftSleeveMesh = new THREE.Mesh(sleeveGeo, topMat);
    leftSleeveMesh.position.y = -0.3;
    leftArmGroup.add(leftSleeveMesh);
    clothesMeshesRef.current.leftSleeve = leftSleeveMesh;

    const rightSleeveMesh = new THREE.Mesh(sleeveGeo, topMat);
    rightSleeveMesh.position.y = -0.3;
    rightArmGroup.add(rightSleeveMesh);
    clothesMeshesRef.current.rightSleeve = rightSleeveMesh;

    // Pants
    const pantsGroup = new THREE.Group();
    fallbackGroup.add(pantsGroup);
    clothesMeshesRef.current.pants = pantsGroup;

    const pantsMat = new THREE.MeshStandardMaterial({ roughness: 0.8 });
    const leftPantLeg = new THREE.Mesh(legGeo, pantsMat);
    leftPantLeg.scale.set(1.1, 0.85, 1.1);
    leftPantLeg.position.set(-0.18, 0.7, 0);
    pantsGroup.add(leftPantLeg);

    const rightPantLeg = new THREE.Mesh(legGeo, pantsMat);
    rightPantLeg.scale.set(1.1, 0.85, 1.1);
    rightPantLeg.position.set(0.18, 0.7, 0);
    pantsGroup.add(rightPantLeg);

    // Dress
    const dressGeo = new THREE.CylinderGeometry(0.3, 0.65, 1.1, 16);
    const dressMat = new THREE.MeshStandardMaterial({ roughness: 0.6 });
    const dressMesh = new THREE.Mesh(dressGeo, dressMat);
    dressMesh.position.set(0, 0.95, 0);
    fallbackGroup.add(dressMesh);
    clothesMeshesRef.current.dress = dressMesh;

    // Jackets
    const jacketGeo = new THREE.CylinderGeometry(0.4, 0.34, 1.0, 16);
    const jacketMat = new THREE.MeshStandardMaterial({ roughness: 0.5 });
    const jacketMesh = new THREE.Mesh(jacketGeo, jacketMat);
    jacketMesh.position.set(0, 1.5, 0.01);
    fallbackGroup.add(jacketMesh);
    clothesMeshesRef.current.jacket = jacketMesh;

    const jacketSleeveGeo = new THREE.CylinderGeometry(0.13, 0.1, 0.7, 8);
    
    const leftJacketSleeve = new THREE.Mesh(jacketSleeveGeo, jacketMat);
    leftJacketSleeve.position.y = -0.35;
    leftArmGroup.add(leftJacketSleeve);
    clothesMeshesRef.current.leftJacketSleeve = leftJacketSleeve;

    const rightJacketSleeve = new THREE.Mesh(jacketSleeveGeo, jacketMat);
    rightJacketSleeve.position.y = -0.35;
    rightArmGroup.add(rightJacketSleeve);
    clothesMeshesRef.current.rightJacketSleeve = rightJacketSleeve;

    // Glasses
    const glassesGeo = new THREE.BoxGeometry(0.5, 0.09, 0.18);
    const glassesMat = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.9 });
    const glassesMesh = new THREE.Mesh(glassesGeo, glassesMat);
    glassesMesh.position.set(0, 2.22, 0.24);
    fallbackGroup.add(glassesMesh);
    clothesMeshesRef.current.glasses = glassesMesh;

    // Hat
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 2.45, 0);
    fallbackGroup.add(hatGroup);
    clothesMeshesRef.current.hat = hatGroup;

    const hatMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.22, 16), hatMat);
    hatGroup.add(hatCrown);
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.01, 24), hatMat);
    hatBrim.position.y = -0.11;
    hatGroup.add(hatBrim);

    // Shoes
    const shoeGeo = new THREE.BoxGeometry(0.16, 0.1, 0.25);
    const shoeMat = new THREE.MeshStandardMaterial({ roughness: 0.5 });
    
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(-0.18, 0.04, 0.04);
    fallbackGroup.add(leftShoe);
    clothesMeshesRef.current.leftShoe = leftShoe;

    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0.18, 0.04, 0.04);
    fallbackGroup.add(rightShoe);
    clothesMeshesRef.current.rightShoe = rightShoe;

    // Hide fallback group by default
    fallbackGroup.visible = false;

    // --- ANIMATION LOOP ---
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      
      const speed = 3.6; // Catwalk pace
      const swingAngle = 0.38; // Max leg swing

      const activePose = useAvatarStore.getState().avatar.pose;
      const model = rpmModelRef.current;
      const fallback = fallbackGroupRef.current;

      // 1. If using GLTF Model animation
      if (model && model.visible) {
        const leftThigh = model.getObjectByName('LeftUpLeg') || model.getObjectByName('mixamorigLeftUpLeg');
        const rightThigh = model.getObjectByName('RightUpLeg') || model.getObjectByName('mixamorigRightUpLeg');
        const leftShoulder = model.getObjectByName('LeftArm') || model.getObjectByName('mixamorigLeftArm');
        const rightShoulder = model.getObjectByName('RightArm') || model.getObjectByName('mixamorigRightArm');
        const spine = model.getObjectByName('Spine') || model.getObjectByName('mixamorigSpine');
        const head = model.getObjectByName('Head') || model.getObjectByName('mixamorigHead');

        if (leftThigh && rightThigh && leftShoulder && rightShoulder) {
          leftThigh.rotation.x = Math.sin(time * speed) * swingAngle;
          rightThigh.rotation.x = -Math.sin(time * speed) * swingAngle;

          if (activePose === 'hips') {
            leftShoulder.rotation.set(0.12 * Math.sin(time * speed), 0.1, -0.6);
            rightShoulder.rotation.set(-0.12 * Math.sin(time * speed), -0.1, 0.6);
          } else if (activePose === 'crossed') {
            leftShoulder.rotation.set(0.8, 0.6, -0.2);
            rightShoulder.rotation.set(0.8, -0.6, 0.2);
          } else {
            leftShoulder.rotation.x = -Math.sin(time * speed) * (swingAngle * 1.1);
            rightShoulder.rotation.x = Math.sin(time * speed) * (swingAngle * 1.1);
            leftShoulder.rotation.z = -0.15;
            rightShoulder.rotation.z = 0.15;
          }
        }

        if (spine) {
          model.position.y = -0.85 + Math.abs(Math.sin(time * speed)) * 0.05;
          spine.rotation.z = Math.sin(time * speed) * 0.025;
        }
        if (head) {
          head.rotation.x = -Math.sin(time * speed) * 0.04;
        }

        if (!isDragging.current) {
          model.rotation.y = 0.2 * Math.sin(time * 0.4);
        }
      }

      // 2. If using Fallback Mannequin animation
      if (fallback && fallback.visible) {
        const leftLegB = bodyMeshesRef.current.leftLeg;
        const rightLegB = bodyMeshesRef.current.rightLeg;
        const leftArmB = bodyMeshesRef.current.leftArm;
        const rightArmB = bodyMeshesRef.current.rightArm;
        const headB = bodyMeshesRef.current.head;
        const hairB = bodyMeshesRef.current.hair;

        if (leftLegB && rightLegB && leftArmB && rightArmB) {
          leftLegB.rotation.x = Math.sin(time * speed) * swingAngle;
          rightLegB.rotation.x = -Math.sin(time * speed) * swingAngle;

          if (activePose === 'hips') {
            leftArmB.rotation.set(0.12 * Math.sin(time * speed), 0, -0.55);
            rightArmB.rotation.set(-0.12 * Math.sin(time * speed), 0, 0.55);
          } else if (activePose === 'crossed') {
            leftArmB.rotation.set(0.75, 0.5, -0.2);
            rightArmB.rotation.set(0.75, -0.5, 0.2);
          } else {
            leftArmB.rotation.x = -Math.sin(time * speed) * (swingAngle * 1.1);
            rightArmB.rotation.x = Math.sin(time * speed) * (swingAngle * 1.1);
            leftArmB.rotation.z = -0.15;
            rightArmB.rotation.z = 0.15;
          }
        }

        fallback.position.y = -0.85 + Math.abs(Math.sin(time * speed)) * 0.05;
        fallback.rotation.z = Math.sin(time * speed) * 0.025;
        if (headB) {
          headB.rotation.x = -Math.sin(time * speed) * 0.04;
          if (hairB) hairB.rotation.x = headB.rotation.x;
        }

        if (!isDragging.current) {
          fallback.rotation.y = 0.2 * Math.sin(time * 0.4);
        }
      }

      // Catwalk treadmill grids shift
      const grid = gridHelperRef.current;
      if (grid) {
        grid.position.z = ((time * 0.95) % 0.5) - 0.25;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 500;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- DYNAMIC MODEL LOADER & COLOR COUPLER ---
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    setLoading(true);
    setLoadingProgress(0);

    // Use our local backend API proxy to completely bypass browser CORS blocks!
    const avatarUrl = `/api/avatar?gender=${avatar.gender}`;

    const loader = new GLTFLoader();
    
    loader.load(
      avatarUrl,
      (gltf) => {
        // Success: Hide Fallback Mannequin
        setUsingFallback(false);
        if (fallbackGroupRef.current) {
          fallbackGroupRef.current.visible = false;
        }

        // Clear previous GLTF model
        if (rpmModelRef.current) {
          scene.remove(rpmModelRef.current);
        }

        const model = gltf.scene;
        model.scale.set(1.0, 1.0, 1.0);
        model.position.set(0, -0.85, 0);
        
        model.traverse((child) => {
          if ((child as any).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(model);
        rpmModelRef.current = model as any;
        setLoading(false);

        // Apply dynamic realistic clothing textures
        applyGarmentColors();
      },
      (xhr) => {
        if (xhr.total > 0) {
          setLoadingProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (err) => {
        console.warn('GLTF load error (likely CORS/network block), rendering fallback 3D mannequin:', err);
        setLoading(false);
        setUsingFallback(true);

        // Clear previous GLTF model
        if (rpmModelRef.current) {
          scene.remove(rpmModelRef.current);
          rpmModelRef.current = null;
        }

        // Reveal Local Fallback Mannequin
        if (fallbackGroupRef.current) {
          fallbackGroupRef.current.visible = true;
        }

        applyLocalFallbackMannequinStyles();
      }
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatar.gender]);

  // Apply clothing colors to Ready Player Me mesh materials
  const applyGarmentColors = () => {
    const model = rpmModelRef.current;
    if (!model) return;

    model.traverse((child: any) => {
      if (child.isMesh) {
        const name = child.name;

        // 1. Tops / Jackets
        if (name === 'Wolf3D_Outfit_Top') {
          child.visible = true;
          if (wornItems.top || wornItems.jacket) {
            const topColor = getSpec(wornItems.jacket || wornItems.top, 'SvgColor') || '#ccc';
            // Swap with high-fidelity, tactile matte standard material to simulate real garments
            child.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(topColor),
              roughness: 0.85,
              metalness: 0.05,
              bumpScale: 0.05
            });
          } else {
            child.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#eaeaea'),
              roughness: 0.7,
              metalness: 0.05
            });
          }
        }

        // 2. Pants
        if (name === 'Wolf3D_Outfit_Bottom') {
          child.visible = true;
          if (wornItems.pants) {
            const pantColor = getSpec(wornItems.pants, 'SvgColor') || '#333';
            child.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(pantColor),
              roughness: 0.9,
              metalness: 0.02
            });
          } else {
            child.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#3c3c3c'),
              roughness: 0.8,
              metalness: 0.02
            });
          }
        }

        // 3. Shoes
        if (name === 'Wolf3D_Outfit_Footwear') {
          child.visible = true;
          if (wornItems.shoes) {
            const shoeColor = getSpec(wornItems.shoes, 'SvgColor') || '#111';
            child.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(shoeColor),
              roughness: 0.5,
              metalness: 0.1
            });
          } else {
            child.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#1c1c1c'),
              roughness: 0.5,
              metalness: 0.1
            });
          }
        }
      }
    });
  };

  // Build and recolor local 3D Mannequin shapes
  const applyLocalFallbackMannequinStyles = () => {
    const fallback = fallbackGroupRef.current;
    if (!fallback || !fallback.visible) return;

    // Skin Tone
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatar.skinTone),
      roughness: 0.55,
      metalness: 0.1
    });
    
    if (bodyMeshesRef.current.torso) (bodyMeshesRef.current.torso as THREE.Mesh).material = skinMat;
    if (bodyMeshesRef.current.head) (bodyMeshesRef.current.head as THREE.Mesh).material = skinMat;
    if (bodyMeshesRef.current.leftArm) {
      bodyMeshesRef.current.leftArm.children.forEach((c) => {
        (c as THREE.Mesh).material = skinMat;
      });
    }
    if (bodyMeshesRef.current.rightArm) {
      bodyMeshesRef.current.rightArm.children.forEach((c) => {
        (c as THREE.Mesh).material = skinMat;
      });
    }
    if (bodyMeshesRef.current.leftLeg) (bodyMeshesRef.current.leftLeg as THREE.Mesh).material = skinMat;
    if (bodyMeshesRef.current.rightLeg) (bodyMeshesRef.current.rightLeg as THREE.Mesh).material = skinMat;

    // Width scale based on bodyType
    let scaleX = 1.0;
    let scaleZ = 1.0;
    let heightScale = 1.0;

    if (avatar.bodyType === 'slim') { scaleX = 0.85; scaleZ = 0.85; }
    else if (avatar.bodyType === 'athletic') { scaleX = 1.12; scaleZ = 0.92; }
    else if (avatar.bodyType === 'plus') { scaleX = 1.35; scaleZ = 1.25; }

    if (avatar.height === 'short') { heightScale = 0.9; }
    else if (avatar.height === 'tall') { heightScale = 1.15; }

    fallback.scale.set(scaleX, heightScale, scaleZ);

    // Hair Style
    const hairGroup = bodyMeshesRef.current.hair as THREE.Group;
    if (hairGroup) {
      while (hairGroup.children.length > 0) {
        hairGroup.remove(hairGroup.children[0]);
      }

      const hairMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(avatar.hairColor), roughness: 0.8 });
      if (avatar.hairStyle === 'short') {
        const crop = new THREE.Mesh(new THREE.SphereGeometry(0.29, 16, 16), hairMat);
        crop.scale.set(1.02, 0.8, 1.02);
        crop.position.y = 0.08;
        hairGroup.add(crop);
      } else if (avatar.hairStyle === 'long' || avatar.hairStyle === 'wavy') {
        const top = new THREE.Mesh(new THREE.SphereGeometry(0.29, 16, 16), hairMat);
        top.position.y = 0.08;
        hairGroup.add(top);
        
        const strandLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.04, 0.5, 8), hairMat);
        strandLeft.position.set(-0.2, -0.15, 0.1);
        strandLeft.rotation.z = 0.2;
        hairGroup.add(strandLeft);

        const strandRight = strandLeft.clone();
        strandRight.position.x = 0.2;
        strandRight.rotation.z = -0.2;
        hairGroup.add(strandRight);
      } else if (avatar.hairStyle === 'curly') {
        const curls = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), hairMat);
        curls.position.y = 0.12;
        hairGroup.add(curls);
      }
    }

    // Clothing layers toggle
    const topMesh = clothesMeshesRef.current.top as THREE.Mesh;
    const leftSleeve = clothesMeshesRef.current.leftSleeve as THREE.Mesh;
    const rightSleeve = clothesMeshesRef.current.rightSleeve as THREE.Mesh;

    if (wornItems.top && topMesh) {
      topMesh.visible = true;
      const color = getSpec(wornItems.top, 'SvgColor') || '#ccc';
      topMesh.material = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.7 });
      
      const style = getSpec(wornItems.top, 'SvgStyle');
      if (style === 'tank') {
        leftSleeve.visible = false;
        rightSleeve.visible = false;
      } else {
        leftSleeve.visible = true;
        rightSleeve.visible = true;
        leftSleeve.material = topMesh.material;
        rightSleeve.material = topMesh.material;
      }
    } else if (topMesh) {
      topMesh.visible = false;
      leftSleeve.visible = false;
      rightSleeve.visible = false;
    }

    // Pants
    const pantsGroup = clothesMeshesRef.current.pants as THREE.Group;
    if (wornItems.pants && pantsGroup) {
      pantsGroup.visible = true;
      const color = getSpec(wornItems.pants, 'SvgColor') || '#ccc';
      const pantsMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.8 });
      pantsGroup.children.forEach((c) => {
        (c as THREE.Mesh).material = pantsMat;
      });
    } else if (pantsGroup) {
      pantsGroup.visible = false;
    }

    // Dress
    const dressMesh = clothesMeshesRef.current.dress as THREE.Mesh;
    if (wornItems.dress && dressMesh) {
      dressMesh.visible = true;
      const color = getSpec(wornItems.dress, 'SvgColor') || '#ccc';
      dressMesh.material = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.6 });
    } else if (dressMesh) {
      dressMesh.visible = false;
    }

    // Jackets
    const jacketMesh = clothesMeshesRef.current.jacket as THREE.Mesh;
    const leftJackSlv = clothesMeshesRef.current.leftJacketSleeve as THREE.Mesh;
    const rightJackSlv = clothesMeshesRef.current.rightJacketSleeve as THREE.Mesh;
    
    if (wornItems.jacket && jacketMesh) {
      jacketMesh.visible = true;
      leftJackSlv.visible = true;
      rightJackSlv.visible = true;
      
      const color = getSpec(wornItems.jacket, 'SvgColor') || '#2d2d2d';
      const jacketMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.5 });
      jacketMesh.material = jacketMat;
      leftJackSlv.material = jacketMat;
      rightJackSlv.material = jacketMat;
    } else if (jacketMesh) {
      jacketMesh.visible = false;
      leftJackSlv.visible = false;
      rightJackSlv.visible = false;
    }

    // Glasses
    const glassesMesh = clothesMeshesRef.current.glasses as THREE.Mesh;
    if (glassesMesh) {
      glassesMesh.visible = !!wornItems.glasses;
    }

    // Hats
    const hatGroup = clothesMeshesRef.current.hat as THREE.Group;
    if (wornItems.hat && hatGroup) {
      hatGroup.visible = true;
      const color = getSpec(wornItems.hat, 'SvgColor') || '#222';
      const hatMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.9 });
      hatGroup.children.forEach((c) => {
        (c as THREE.Mesh).material = hatMat;
      });
    } else if (hatGroup) {
      hatGroup.visible = false;
    }

    // Shoes
    const leftShoe = clothesMeshesRef.current.leftShoe as THREE.Mesh;
    const rightShoe = clothesMeshesRef.current.rightShoe as THREE.Mesh;
    if (wornItems.shoes && leftShoe) {
      leftShoe.visible = true;
      rightShoe.visible = true;
      const color = getSpec(wornItems.shoes, 'SvgColor') || '#222';
      const shoeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.5 });
      leftShoe.material = shoeMat;
      rightShoe.material = shoeMat;
    } else if (leftShoe) {
      leftShoe.visible = false;
      rightShoe.visible = false;
    }
  };

  // Re-run color mapper when clothing sets or falls change
  useEffect(() => {
    if (usingFallback) {
      applyLocalFallbackMannequinStyles();
    } else {
      applyGarmentColors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wornItems, avatar, usingFallback]);

  // Backdrop texture loader
  useEffect(() => {
    const bgPlane = bgPlaneRef.current;
    if (bgPlane) {
      if (avatar.backgroundScene === 'studio') {
        bgPlane.material = new THREE.MeshBasicMaterial({ color: 0xfaf9f6 });
      } else {
        const loader = new THREE.TextureLoader();
        loader.load(getSceneTextureUrl(avatar.backgroundScene), (texture) => {
          bgPlane.material = new THREE.MeshBasicMaterial({ map: texture });
        });
      }
    }
  }, [avatar.backgroundScene]);

  // Zoom Level camera scaling
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.position.z = 5.0 / zoomLevel;
    }
  }, [zoomLevel]);

  // Drag interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    prevMouseX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - prevMouseX.current;
    
    if (usingFallback && fallbackGroupRef.current) {
      fallbackGroupRef.current.rotation.y += deltaX * 0.015;
    } else if (rpmModelRef.current) {
      rpmModelRef.current.rotation.y += deltaX * 0.015;
    }
    prevMouseX.current = e.clientX;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleExportImage = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    setIsExporting(true);

    setTimeout(() => {
      try {
        rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
        const url = rendererRef.current?.domElement.toDataURL('image/png');
        if (url) {
          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = `${avatar.gender}_${usingFallback ? 'mannequin' : 'readyplayerme'}_lookbook.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      } catch (err) {
        console.error('Failed to export snapshot PNG:', err);
      } finally {
        setIsExporting(false);
      }
    }, 400);
  };

  return (
    <div className="flex flex-col items-center justify-between h-full bg-[#faf9f6] dark:bg-gray-950 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
      {/* Watermark */}
      <div className="absolute top-6 left-6 flex items-center gap-1.5 opacity-40 select-none">
        <Sparkles className="w-4 h-4 text-[#8b6f47] dark:text-[#c9a96b]" />
        <span className="text-[#8b6f47] dark:text-[#c9a96b] text-[10px] font-serif font-bold tracking-widest uppercase">
          {usingFallback ? 'SwiftCart 3D Studio' : 'Ready Player Me 3D Studio'}
        </span>
      </div>

      {/* Snapshot export */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportImage}
          disabled={isExporting}
          className="bg-white/80 hover:bg-white border-gray-200/80 p-2 rounded-full shadow-sm text-gray-700 hover:text-[#8b6f47] transition-all"
          title="Snap Catwalk Photo"
        >
          <Camera className="w-4 h-4" />
        </Button>
      </div>

      {/* Catwalk wrapper */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex-1 w-full max-h-[460px] flex items-center justify-center relative cursor-grab active:cursor-grabbing group mt-6"
      >
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-950/80 z-20 flex flex-col items-center justify-center text-center gap-3 select-none rounded-xl">
            <Loader2 className="w-8 h-8 text-[#8b6f47] dark:text-[#c9a96b] animate-spin" />
            <div>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Syncing 3D Avatar Asset</p>
              <p className="text-[10px] text-gray-400 font-mono mt-1">Downloading Model: {loadingProgress}%</p>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="w-full h-full block rounded-xl overflow-hidden shadow-inner" />
        
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900/60 backdrop-blur-sm py-1.5 px-3 rounded-full flex items-center gap-1 text-[9px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity select-none duration-300 pointer-events-none">
          <Move className="w-3 h-3 animate-pulse" />
          Drag cursor to rotate avatar 360°
        </div>
      </div>

      {/* Controls Toolbar */}
      <div className="w-full mt-4 flex justify-between items-center bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/80 p-3 rounded-2xl shadow-sm gap-4 z-10">
        
        {/* Zoom */}
        <div className="flex bg-gray-50 dark:bg-gray-950 p-0.5 rounded-full border border-gray-100 dark:border-gray-900">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
            disabled={zoomLevel <= 0.6}
            className="p-2 border-0 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-850 rounded-full"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.2))}
            disabled={zoomLevel >= 1.8}
            className="p-2 border-0 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-850 rounded-full"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Fashion Show logs */}
        <div className="flex-1 text-center hidden sm:block">
          <p className="text-[10px] text-gray-500 italic truncate max-w-[260px] mx-auto">
            "{activeHumorText}"
          </p>
        </div>

        {/* Undo/Redo/Reset Actions */}
        <div className="flex gap-1 bg-gray-50 dark:bg-gray-950 p-0.5 rounded-full border border-gray-100 dark:border-gray-900">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={undoStack.length === 0}
            className="p-2 border-0 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-850 disabled:opacity-30 rounded-full"
            aria-label="Undo worn item"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={redoStack.length === 0}
            className="p-2 border-0 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-850 disabled:opacity-30 rounded-full"
            aria-label="Redo worn item"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetOutfit}
            disabled={Object.keys(wornItems).length === 0}
            className="p-2 border-0 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-850 disabled:opacity-30 rounded-full text-red-500"
            aria-label="Reset Outfit"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

      </div>
    </div>
  );
}
