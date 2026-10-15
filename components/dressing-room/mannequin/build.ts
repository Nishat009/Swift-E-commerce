import * as THREE from 'three';
import {
  RIGS, Rig, Gender, GarmentSpec, Fabric, GarmentShape, Sleeves,
  garmentShape, armSpread, torsoRing, envelope, surfaceZ, sampleRadius, sleeveLength,
  lerp, smoothstep,
} from './profile';
import { fabricMaterial, metalMaterial } from './fabric';

export type BodyType = 'slim' | 'regular' | 'athletic' | 'plus';
export type HeightType = 'short' | 'average' | 'tall';
export type HairStyle = 'short' | 'long' | 'curly' | 'wavy' | 'bald';
export type Pose = 'default' | 'hips' | 'crossed';

export interface FigureOptions {
  gender: Gender;
  bodyType: BodyType;
  height: HeightType;
  skinTone: string;
  hairStyle: HairStyle;
  hairColor: string;
  pose: Pose;
}

export interface PantsSpec { color: string; fabric: Fabric; fit: 'slim' | 'straight' | 'wide' | 'relaxed' }
export interface ShoeSpec { color: string; kind: 'heel' | 'boot' | 'sneaker' | 'flat' }

export interface Outfit {
  dress?: GarmentSpec;
  top?: GarmentSpec;
  jacket?: GarmentSpec;
  pants?: PantsSpec;
  shoes?: ShoeSpec;
  hat?: string;
  glasses?: string;
  jewelry?: string;
  bag?: string;
}

export interface Figure {
  root: THREE.Group;
  update(time: number): void;
  dispose(): void;
}

const WIDTH: Record<BodyType, [number, number]> = {
  slim: [0.9, 0.92], regular: [1, 1], athletic: [1.06, 1], plus: [1.22, 1.22],
};
const HEIGHT: Record<HeightType, number> = { short: 0.94, average: 1, tall: 1.06 };
const DOWN = new THREE.Vector3(0, -1, 0);

// ---------------------------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------------------------

interface Surface {
  geometry: THREE.BufferGeometry;
  ys: Float32Array;
  setXZ(fn: (k: number, y: number, theta: number) => [number, number]): void;
}

/**
 * Grid wrapped around the vertical axis. Columns walk theta (front is +z at PI/2), rows walk
 * downwards; y(theta, row) gives each vertex height so necklines can follow any curve.
 */
function surface(o: {
  segU: number;
  segV: number;
  theta?: [number, number];
  y: (theta: number, row: number) => number;
  split?: number;
  uRepeat?: number;
}): Surface {
  const closed = !o.theta;
  const [t0, t1] = o.theta ?? [-Math.PI / 2, Math.PI * 1.5];
  const cols = o.segU + 1;
  const rows = o.segV + 1;
  const n = cols * rows;
  const pos = new Float32Array(n * 3);
  const uv = new Float32Array(n * 2);
  const ys = new Float32Array(n);
  const thetas = new Float32Array(cols);
  const uRepeat = o.uRepeat ?? 1;

  for (let i = 0; i < cols; i++) {
    const theta = t0 + ((t1 - t0) * i) / o.segU;
    thetas[i] = theta;
    for (let j = 0; j < rows; j++) {
      const k = i * rows + j;
      const y = o.y(theta, j);
      ys[k] = y;
      pos[k * 3 + 1] = y;
      uv[k * 2] = (i / o.segU) * uRepeat;
      uv[k * 2 + 1] = y / 0.25;
    }
  }

  const index: number[] = [];
  const quad = (i: number, j: number) => {
    const a = i * rows + j;
    const b = (i + 1) * rows + j;
    index.push(a, b, a + 1, b, b + 1, a + 1);
  };
  const split = o.split ?? o.segV;
  for (let i = 0; i < o.segU; i++) for (let j = 0; j < split; j++) quad(i, j);
  const firstGroup = index.length;
  for (let i = 0; i < o.segU; i++) for (let j = split; j < o.segV; j++) quad(i, j);

  const geometry = new THREE.BufferGeometry();
  const position = new THREE.BufferAttribute(pos, 3);
  geometry.setAttribute('position', position);
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(index);
  if (o.split !== undefined) {
    geometry.addGroup(0, firstGroup, 0);
    geometry.addGroup(firstGroup, index.length - firstGroup, 1);
  }

  const setXZ = (fn: (k: number, y: number, theta: number) => [number, number]) => {
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const k = i * rows + j;
        const [x, z] = fn(k, ys[k], thetas[i]);
        pos[k * 3] = x;
        pos[k * 3 + 2] = z;
      }
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    if (closed) {
      // First and last columns are the same seam: share their normals so it doesn't show.
      const normal = geometry.getAttribute('normal') as THREE.BufferAttribute;
      const v = new THREE.Vector3();
      for (let j = 0; j < rows; j++) {
        const a = j;
        const b = (cols - 1) * rows + j;
        v.set(normal.getX(a) + normal.getX(b), normal.getY(a) + normal.getY(b), normal.getZ(a) + normal.getZ(b)).normalize();
        normal.setXYZ(a, v.x, v.y, v.z);
        normal.setXYZ(b, v.x, v.y, v.z);
      }
      normal.needsUpdate = true;
    }
    geometry.computeBoundingSphere();
  };

  return { geometry, ys, setXZ };
}

/** Lathe from a top-to-bottom profile (reversed so normals face outwards). */
function lathe(topToBottom: THREE.Vector2[], segments = 28) {
  return new THREE.LatheGeometry([...topToBottom].reverse(), segments);
}

/** Tapered capsule hanging down from its pivot at y = 0. */
function limbGeometry(length: number, radii: number[]) {
  const rt = radii[0];
  const rb = radii[radii.length - 1];
  const pts: THREE.Vector2[] = [];
  for (let k = 6; k >= 0; k--) {
    const phi = (Math.PI / 2) * (k / 6);
    pts.push(new THREE.Vector2(rt * Math.cos(phi), rt * Math.sin(phi)));
  }
  for (let k = 1; k < 20; k++) {
    const t = k / 20;
    pts.push(new THREE.Vector2(sampleRadius(radii, t), -t * length));
  }
  for (let k = 0; k <= 6; k++) {
    const phi = (Math.PI / 2) * (k / 6);
    pts.push(new THREE.Vector2(rb * Math.cos(phi), -length - rb * Math.sin(phi)));
  }
  return lathe(pts);
}

/** Open tube following a radius function from y0 down to y1. */
function tubeGeometry(y0: number, y1: number, radius: (y: number) => number, steps = 24) {
  const pts: THREE.Vector2[] = [];
  for (let k = 0; k <= steps; k++) {
    const y = lerp(y0, y1, k / steps);
    pts.push(new THREE.Vector2(radius(y), y));
  }
  return lathe(pts, 32);
}

function ellipsoid(radii: [number, number, number], material: THREE.Material, segments = 24) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, segments, Math.round(segments * 0.7)), material);
  mesh.scale.set(...radii);
  return mesh;
}

function cord(points: THREE.Vector3[], radius: number, material: THREE.Material, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
  return new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, points.length * 10), radius, 8, closed), material);
}

// ---------------------------------------------------------------------------------------------
// Figure
// ---------------------------------------------------------------------------------------------

interface Arm { side: number; shoulder: THREE.Group; elbow: THREE.Group }
interface Leg { side: number; hip: THREE.Group; knee: THREE.Group; ankle: THREE.Group }

export function buildFigure(opts: FigureOptions, outfit: Outfit): Figure {
  const rig: Rig = RIGS[opts.gender];
  const root = new THREE.Group();
  const body = new THREE.Group();
  const [w, d] = WIDTH[opts.bodyType];
  body.scale.set(w, HEIGHT[opts.height], d);
  root.add(body);
  const updaters: ((time: number) => void)[] = [];

  const skin = new THREE.MeshPhysicalMaterial({
    color: opts.skinTone,
    roughness: 0.42,
    clearcoat: 0.2,
    clearcoatRoughness: 0.45,
    sheen: 0.3,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(0x4d4d4d),
  });

  // Torso + neck
  const torsoTop = rig.torso[rig.torso.length - 1][0];
  const torsoBottom = rig.torso[0][0];
  const torso = surface({ segU: 72, segV: 96, y: (_, j) => lerp(torsoTop, torsoBottom, j / 96) });
  torso.setXZ((_, y, theta) => {
    // Clamp: Float32 storage can nudge the end rows just outside the key range.
    const r = torsoRing(rig, Math.min(torsoTop, Math.max(torsoBottom, y)))!;
    const s = Math.sin(theta);
    return [r.a * Math.cos(theta), s * (s > 0 ? r.bf : r.bb)];
  });
  body.add(new THREE.Mesh(torso.geometry, skin));

  // Head
  const head = new THREE.Group();
  head.position.set(0, rig.head.y, 0.008);
  body.add(head);
  const [hx, hy, hz] = rig.head.r;
  head.add(ellipsoid([hx, hy, hz], skin, 40));
  const nose = ellipsoid([0.011, 0.02, 0.013], skin, 16);
  nose.position.set(0, -0.006, hz - 0.004);
  head.add(nose);
  for (const side of [-1, 1]) {
    const ear = ellipsoid([0.008, 0.022, 0.014], skin, 12);
    ear.position.set(side * hx * 0.98, -0.006, -0.004);
    head.add(ear);
  }
  buildHair(rig, opts, head);

  // Arms
  const arms: Arm[] = [1, -1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * rig.shoulder.x, rig.shoulder.y, 0);
    body.add(shoulder);
    const deltoid = new THREE.Mesh(new THREE.SphereGeometry(rig.upperArmR[0] + 0.002, 24, 16), skin);
    deltoid.position.y = -0.004;
    shoulder.add(deltoid);
    shoulder.add(new THREE.Mesh(limbGeometry(rig.upperArm, rig.upperArmR), skin));
    const elbow = new THREE.Group();
    elbow.position.y = -rig.upperArm;
    shoulder.add(elbow);
    elbow.add(new THREE.Mesh(limbGeometry(rig.foreArm, rig.foreArmR), skin));
    const hand = ellipsoid(rig.hand, skin, 20);
    hand.position.set(0, -rig.foreArm - rig.hand[1] * 0.85, 0.004);
    elbow.add(hand);
    return { side, shoulder, elbow };
  });

  // Legs
  const legs: Leg[] = [1, -1].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(side * rig.hip.x, rig.hip.y, 0);
    hip.rotation.z = side * 0.02;
    body.add(hip);
    hip.add(new THREE.Mesh(limbGeometry(rig.thigh, rig.thighR), skin));
    const knee = new THREE.Group();
    knee.position.y = -rig.thigh;
    hip.add(knee);
    knee.add(new THREE.Mesh(limbGeometry(rig.shin, rig.shinR), skin));
    const ankle = new THREE.Group();
    ankle.position.y = -rig.shin;
    ankle.rotation.y = side * 0.12;
    knee.add(ankle);
    const foot = ellipsoid([0.034, 0.03, 0.105], skin, 20);
    foot.position.set(0, -0.022, 0.045);
    ankle.add(foot);
    return { side, hip, knee, ankle };
  });

  // Clothing: lower layers first so outer layers sit on top.
  const shapes: GarmentShape[] = [];
  if (outfit.pants) buildPants(rig, body, legs, outfit.pants);
  if (outfit.dress) shapes.push(buildGarment(rig, body, arms, legs, outfit.dress, updaters));
  if (outfit.top) shapes.push(buildGarment(rig, body, arms, legs, outfit.top, updaters));
  if (outfit.jacket) shapes.push(buildGarment(rig, body, arms, legs, outfit.jacket, updaters));
  if (outfit.shoes) buildShoes(rig, legs, outfit.shoes);
  if (outfit.hat) buildHat(rig, head, outfit.hat);
  if (outfit.glasses) buildGlasses(rig, head, outfit.glasses);
  if (outfit.jewelry) buildJewelry(rig, body, head, outfit.jewelry);
  if (outfit.bag) buildBag(rig, body, outfit.bag);

  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  // Pose: aim each arm segment along a direction in body space.
  const spread = armSpread(rig, shapes);
  const d1 = new THREE.Vector3();
  const d2 = new THREE.Vector3();
  const inv = new THREE.Quaternion();
  const aim = (arm: Arm, upper: THREE.Vector3, lower: THREE.Vector3) => {
    arm.shoulder.quaternion.setFromUnitVectors(DOWN, upper.normalize());
    inv.copy(arm.shoulder.quaternion).invert();
    arm.elbow.quaternion.setFromUnitVectors(DOWN, lower.normalize().applyQuaternion(inv));
  };

  const update = (time: number) => {
    const breathe = Math.sin(time * 1.6);
    for (const arm of arms) {
      const s = arm.side;
      if (opts.pose === 'hips') {
        aim(arm, d1.set(0.68 * s, -0.73, -0.1), d2.set(-0.92 * s, -0.38, 0.06));
      } else if (opts.pose === 'crossed') {
        aim(arm, d1.set(0.06 * s, -0.85, 0.5), d2.set(-0.88 * s, s > 0 ? 0.24 : 0.3, s > 0 ? 0.34 : 0.42));
      } else {
        const a = spread + 0.012 * breathe;
        aim(
          arm,
          d1.set(Math.sin(a) * s, -Math.cos(a), 0.03 + 0.02 * Math.sin(time * 0.7 + s)),
          d2.set(Math.sin(a) * s, -Math.cos(a), 0.12),
        );
      }
    }
    head.rotation.y = 0.12 * Math.sin(time * 0.35);
    head.rotation.x = 0.025 * Math.sin(time * 0.6);
    body.rotation.z = 0.006 * Math.sin(time * 0.8);
    for (const fn of updaters) fn(time);
  };
  update(0);

  const dispose = () => {
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of materials) {
        (m as THREE.MeshPhysicalMaterial).map?.dispose();
        m.dispose();
      }
    });
  };

  return { root, update, dispose };
}

// ---------------------------------------------------------------------------------------------
// Hair
// ---------------------------------------------------------------------------------------------

function buildHair(rig: Rig, opts: FigureOptions, head: THREE.Group) {
  const style = opts.hairStyle;
  if (style === 'bald') return;
  const material = new THREE.MeshStandardMaterial({ color: opts.hairColor, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide });
  const [hx, hy, hz] = rig.head.r;

  const curly = style === 'curly';
  const capGeometry = new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI * (style === 'short' ? 0.55 : 0.6));
  if (curly) {
    const p = capGeometry.getAttribute('position') as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      v.multiplyScalar(1 + 0.06 * Math.sin(v.x * 18) * Math.sin(v.y * 16) * Math.sin(v.z * 17));
      p.setXYZ(i, v.x, v.y, v.z);
    }
    capGeometry.computeVertexNormals();
  }
  const capScale = curly ? 1.16 : 1.07;
  const cap = new THREE.Mesh(capGeometry, material);
  cap.scale.set(hx * capScale, hy * capScale * 0.98, hz * capScale);
  cap.rotation.x = -0.5; // lift the front hairline, drop the back over the nape
  cap.position.y = 0.006;
  head.add(cap);

  if (style === 'short') return;

  // Hair falling behind the shoulders, open around the face.
  const length = style === 'long' ? 0.36 : style === 'wavy' ? 0.3 : 0.2;
  const bottom = -length;
  const drape = surface({
    segU: 56,
    segV: 44,
    theta: [Math.PI / 2 + 1.0, Math.PI * 2.5 - 1.0],
    y: (_, j) => lerp(0.01, bottom, j / 44),
  });
  drape.setXZ((_, y, theta) => {
    const k = smoothstep(0, -0.13, y);
    const ring = torsoRing(rig, rig.head.y + y);
    const back = ring ? ring.bb + 0.016 : 0;
    const ax = lerp(hx * 1.08, curly ? 0.13 : 0.105, k);
    const zBack = Math.max(lerp(hz * 1.08, 0.05, k), back);
    const zFront = lerp(hz * 0.55, 0.03, k); // stays behind the cheeks so the face is clear
    const wave = style === 'wavy'
      ? 1 + 0.06 * Math.sin(y * 55 + theta * 3) * k
      : curly ? 1 + 0.08 * Math.sin(y * 80) * Math.cos(theta * 7) : 1;
    const s = Math.sin(theta);
    return [ax * Math.cos(theta) * wave, s * (s > 0 ? zFront : zBack) * wave];
  });
  head.add(new THREE.Mesh(drape.geometry, material));
}

// ---------------------------------------------------------------------------------------------
// Garments
// ---------------------------------------------------------------------------------------------

function buildGarment(
  rig: Rig,
  body: THREE.Group,
  arms: Arm[],
  legs: Leg[],
  spec: GarmentSpec,
  updaters: ((time: number) => void)[],
): GarmentShape {
  const shape = garmentShape(rig, spec);
  const material = fabricMaterial(spec);
  const band = spec.trim ? 0.045 : 0;
  const segV = 110;
  const bandRows = band ? 6 : 0;
  const mainRows = segV - bandRows;

  const surf = surface({
    segU: 104,
    segV,
    split: band ? mainRows : undefined,
    uRepeat: shape.uRepeat,
    y: (theta, j) => {
      const top = shape.topY(theta);
      return j <= mainRows
        ? lerp(top, shape.hem + band, j / mainRows)
        : lerp(shape.hem + band, shape.hem, (j - mainRows) / bandRows);
    },
  });
  const samples = Array.from(surf.ys, (y) => shape.sample(y));
  const place = (time: number, animate: boolean) =>
    surf.setXZ((k, _y, theta) => shape.place(samples[k], theta, time, animate));
  place(0, false);
  const mesh = new THREE.Mesh(surf.geometry, band ? [material, metalMaterial(spec.trim!)] : material);
  body.add(mesh);
  if (shape.animated) updaters.push((time) => place(time, true));

  if (spec.belt) {
    const belt = surface({ segU: 104, segV: 3, y: (_, j) => shape.waist + 0.022 - (0.044 * j) / 3 });
    belt.setXZ((_, y, theta) => shape.place(shape.sample(y), theta, 0, false, 0.005));
    body.add(new THREE.Mesh(belt.geometry, metalMaterial(spec.belt)));
  }

  const strapMaterial = fabricMaterial({ ...spec, pattern: 'solid' });
  if (spec.neckline === 'halter') body.add(halterStrap(rig, shape, strapMaterial));
  else if (spec.sleeves === 'straps') for (const side of [-1, 1]) body.add(shoulderStrap(rig, shape, side, strapMaterial));

  addSleeves(rig, arms, spec.sleeves, shape.params.ease + 0.004, material);

  if (spec.leggings) {
    const leggings = fabricMaterial({ fabric: 'knit', pattern: 'solid', color: spec.leggings });
    for (const leg of legs) addLegTubes(rig, leg, leggings, 0.004, () => 0);
  }
  return shape;
}

/** Column angle on the front (or back) where the garment's top edge reaches x. */
function topEdgeAt(rig: Rig, shape: GarmentShape, x: number, front: boolean) {
  const ease = shape.params.ease;
  for (let k = 0; k <= 160; k++) {
    const theta = front ? Math.PI / 2 - (k / 160) * (Math.PI / 2) : -Math.PI / 2 + (k / 160) * (Math.PI / 2);
    const y = shape.topY(theta);
    const r = torsoRing(rig, y);
    if (r && (r.a + ease) * Math.cos(theta) >= Math.abs(x)) return y;
  }
  return shape.topY(0);
}

function shoulderStrap(rig: Rig, shape: GarmentShape, side: number, material: THREE.Material) {
  const x = side * rig.strapX;
  let top = rig.shoulder.y + 0.1;
  while (top > rig.shoulder.y - 0.05 && (torsoRing(rig, top)?.a ?? 0) < rig.strapX) top -= 0.002;
  const yF = topEdgeAt(rig, shape, x, true);
  const yB = topEdgeAt(rig, shape, x, false);
  const lift = shape.params.ease + 0.004;
  const pts: THREE.Vector3[] = [];
  for (let k = 0; k <= 4; k++) {
    const y = lerp(yF, top - 0.008, k / 4);
    pts.push(new THREE.Vector3(x, y, surfaceZ(rig, x, y, true) + lift));
  }
  pts.push(new THREE.Vector3(x, top + 0.008, 0));
  for (let k = 4; k >= 0; k--) {
    const y = lerp(yB, top - 0.008, k / 4);
    pts.push(new THREE.Vector3(x, y, surfaceZ(rig, x, y, false) - lift));
  }
  return cord(pts, 0.007, material);
}

function halterStrap(rig: Rig, shape: GarmentShape, material: THREE.Material) {
  const lift = shape.params.ease + 0.004;
  const neckY = rig.shoulder.y + 0.1;
  const neck = (torsoRing(rig, neckY)?.a ?? 0.046) + 0.01;
  const side = (s: number) => {
    const yF = topEdgeAt(rig, shape, 0.045, true);
    const yMid = lerp(yF, neckY, 0.55);
    return [
      new THREE.Vector3(s * 0.045, yF, surfaceZ(rig, 0.045, yF, true) + lift),
      new THREE.Vector3(s * 0.05, yMid, surfaceZ(rig, 0.05, yMid, true) + lift),
      new THREE.Vector3(s * neck, neckY, 0.012),
      new THREE.Vector3(s * neck * 0.6, neckY + 0.005, -neck * 0.85),
    ];
  };
  const left = side(-1);
  const right = side(1).reverse();
  return cord([...left, new THREE.Vector3(0, neckY + 0.006, -neck), ...right], 0.01, material);
}

function addSleeves(rig: Rig, arms: Arm[], sleeves: Sleeves, ease: number, material: THREE.Material) {
  const length = sleeveLength(rig, sleeves);
  if (!length) return;
  const upperLen = Math.min(length, rig.upperArm + 0.02);
  const rTop = rig.upperArmR[0] + 0.002 + ease; // dome must enclose the deltoid sphere
  for (const arm of arms) {
    const pts: THREE.Vector2[] = [];
    for (let k = 0; k <= 8; k++) {
      const phi = (Math.PI / 2) * (k / 8);
      pts.push(new THREE.Vector2(Math.max(0.001, rTop * Math.sin(phi)), 0.004 + rTop * Math.cos(phi) * 0.78));
    }
    for (let k = 1; k <= 20; k++) {
      const y = (upperLen * k) / 20;
      let r = sampleRadius(rig.upperArmR, y / rig.upperArm) + ease;
      if (sleeves === 'puff') r += 0.032 * Math.sin(Math.PI * Math.min(1, y / (upperLen * 0.85)));
      if (sleeves === 'cap') r += 0.012 * (y / upperLen);
      pts.push(new THREE.Vector2(r, -y));
    }
    arm.shoulder.add(new THREE.Mesh(lathe(pts, 32), material));

    if (sleeves === 'long' || sleeves === 'bishop') {
      const end = -(rig.foreArm - 0.012);
      arm.elbow.add(new THREE.Mesh(tubeGeometry(0.03, end, (y) => {
        const t = Math.min(1, Math.max(0, -y / rig.foreArm));
        let r = sampleRadius(rig.foreArmR, t) + ease;
        if (sleeves === 'bishop') r += 0.034 * smoothstep(0.2, 0.75, t) * (1 - smoothstep(0.9, 0.97, t));
        return r;
      }), material));
    }
  }
}

function addLegTubes(rig: Rig, leg: Leg, material: THREE.Material, ease: number, extra: (t: number) => number) {
  leg.hip.add(new THREE.Mesh(tubeGeometry(0.02, -rig.thigh, (y) => {
    const t = Math.min(1, -y / rig.thigh);
    return sampleRadius(rig.thighR, Math.max(0, t)) + ease + extra(t * 0.5);
  }), material));
  leg.knee.add(new THREE.Mesh(tubeGeometry(0.03, -(rig.shin - 0.015), (y) => {
    const t = Math.min(1, Math.max(0, -y / rig.shin));
    return sampleRadius(rig.shinR, t) + ease + extra(0.5 + t * 0.5);
  }), material));
}

function buildPants(rig: Rig, body: THREE.Group, legs: Leg[], pants: PantsSpec) {
  const material = fabricMaterial({ fabric: pants.fabric, pattern: 'solid', color: pants.color });
  const top = rig.waistY - 0.005;
  const bottom = rig.hip.y - 0.075;
  const seat = surface({ segU: 72, segV: 24, y: (_, j) => lerp(top, bottom, j / 24) });
  seat.setXZ((_, y, theta) => {
    const r = envelope(rig, y);
    const s = Math.sin(theta);
    return [(r.a + 0.011) * Math.cos(theta), s * ((s > 0 ? r.bf : r.bb) + 0.011)];
  });
  body.add(new THREE.Mesh(seat.geometry, material));

  // Extra looseness down the leg (t = 0 at the hip, 1 at the ankle).
  const extra: Record<PantsSpec['fit'], (t: number) => number> = {
    slim: () => 0,
    straight: (t) => 0.014 * smoothstep(0.3, 1, t),
    relaxed: (t) => 0.008 + 0.02 * smoothstep(0.3, 1, t),
    wide: (t) => 0.006 + 0.04 * smoothstep(0.2, 1, t),
  };
  for (const leg of legs) addLegTubes(rig, leg, material, 0.011, extra[pants.fit]);
}

function buildShoes(rig: Rig, legs: Leg[], shoes: ShoeSpec) {
  const upper = new THREE.MeshPhysicalMaterial({ color: shoes.color, roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.4 });
  const sole = new THREE.MeshStandardMaterial({ color: shoes.kind === 'sneaker' ? '#f4f4f2' : '#1d1b19', roughness: 0.7 });
  for (const leg of legs) {
    const shell = ellipsoid([0.038, 0.034, 0.115], upper, 24);
    shell.position.set(0, -0.02, 0.046);
    leg.ankle.add(shell);
    const base = ellipsoid([0.041, shoes.kind === 'sneaker' ? 0.012 : 0.007, 0.118], sole, 24);
    base.position.set(0, -0.048, 0.046);
    leg.ankle.add(base);
    if (shoes.kind === 'boot') {
      leg.knee.add(new THREE.Mesh(tubeGeometry(-(rig.shin - 0.17), -rig.shin, (y) => {
        const t = Math.min(1, Math.max(0, -y / rig.shin));
        return sampleRadius(rig.shinR, t) + 0.008;
      }), upper));
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Accessories
// ---------------------------------------------------------------------------------------------

function buildHat(rig: Rig, head: THREE.Group, color: string) {
  const [hx, hy, hz] = rig.head.r;
  const felt = new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide });
  const hat = new THREE.Group();
  hat.position.set(0, hy * 0.55, -0.006);
  hat.rotation.x = -0.12;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(hx * 1.02, hx * 1.18, 0.095, 40), felt);
  crown.scale.z = hz / hx;
  crown.position.y = 0.05;
  hat.add(crown);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.008, 56), felt);
  brim.scale.z = 1.08;
  hat.add(brim);
  const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(hx * 1.17, hx * 1.19, 0.022, 40, 1, true), new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.6 }));
  ribbon.scale.z = hz / hx;
  ribbon.position.y = 0.016;
  hat.add(ribbon);
  head.add(hat);
}

function buildGlasses(rig: Rig, head: THREE.Group, color: string) {
  const [, , hz] = rig.head.r;
  const frame = new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 0.6 });
  const lens = new THREE.MeshPhysicalMaterial({ color: '#1c1917', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.82 });
  const glasses = new THREE.Group();
  glasses.position.set(0, 0.014, hz * 0.9);
  for (const side of [-1, 1]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.0035, 8, 32), frame);
    rim.position.x = side * 0.031;
    rim.scale.y = 0.8;
    glasses.add(rim);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.021, 32), lens);
    glass.position.set(side * 0.031, 0, 0.001);
    glass.scale.y = 0.8;
    glasses.add(glass);
    const temple = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, 0.09), frame);
    temple.position.set(side * 0.058, 0.004, -0.045);
    glasses.add(temple);
  }
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.018, 8), frame);
  bridge.rotation.z = Math.PI / 2;
  bridge.position.y = 0.006;
  glasses.add(bridge);
  head.add(glasses);
}

function buildJewelry(rig: Rig, body: THREE.Group, head: THREE.Group, color: string) {
  const gold = metalMaterial(color);
  const pts: THREE.Vector3[] = [];
  for (let k = 0; k < 40; k++) {
    const phi = (k / 40) * Math.PI * 2;
    const s = Math.sin(phi);
    const y = rig.shoulder.y + 0.07 - 0.075 * Math.pow(Math.max(0, s), 1.5);
    const r = torsoRing(rig, y) ?? { a: 0.06, bf: 0.05, bb: 0.05 };
    pts.push(new THREE.Vector3((r.a + 0.006) * Math.cos(phi), y, s * ((s > 0 ? r.bf : r.bb) + 0.006)));
  }
  body.add(cord(pts, 0.004, gold, true));
  const pendantY = rig.shoulder.y - 0.005;
  const pendant = new THREE.Mesh(new THREE.SphereGeometry(0.011, 16, 12), gold);
  pendant.position.set(0, pendantY - 0.012, surfaceZ(rig, 0, pendantY - 0.012, true) + 0.012);
  body.add(pendant);
  for (const side of [-1, 1]) {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.0028, 8, 24), gold);
    hoop.position.set(side * rig.head.r[0] * 1.02, -0.045, -0.004);
    hoop.rotation.y = Math.PI / 2;
    head.add(hoop);
  }
}

function buildBag(rig: Rig, body: THREE.Group, color: string) {
  const leather = new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, clearcoat: 0.45, clearcoatRoughness: 0.4 });
  const bagY = rig.waistY - 0.12;
  const bagZ = envelope(rig, bagY).bf + 0.05;
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.06, 4, 4, 2), leather);
  bag.position.set(-0.13, bagY, bagZ);
  bag.rotation.y = 0.35;
  body.add(bag);
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.204, 0.07, 0.008), leather);
  flap.position.set(-0.13 + Math.sin(0.35) * 0.034, bagY + 0.04, bagZ + Math.cos(0.35) * 0.034);
  flap.rotation.y = 0.35;
  body.add(flap);

  // Crossbody strap: bag -> across the chest -> over the right shoulder -> down the back.
  const shoulderTop = rig.shoulder.y + 0.05;
  const chestY = rig.waistY + 0.16;
  const strap = [
    new THREE.Vector3(-0.07, bagY + 0.07, bagZ),
    new THREE.Vector3(0.0, chestY, surfaceZ(rig, 0, chestY, true) + 0.014),
    new THREE.Vector3(0.1, rig.shoulder.y - 0.01, surfaceZ(rig, 0.1, rig.shoulder.y - 0.01, true) + 0.014),
    new THREE.Vector3(0.11, shoulderTop, 0),
    new THREE.Vector3(0.08, rig.shoulder.y - 0.06, surfaceZ(rig, 0.08, rig.shoulder.y - 0.06, false) - 0.014),
    new THREE.Vector3(-0.08, rig.waistY + 0.05, surfaceZ(rig, -0.08, rig.waistY + 0.05, false) - 0.014),
    new THREE.Vector3(-0.2, bagY + 0.06, bagZ - 0.07),
  ];
  body.add(cord(strap, 0.006, leather));
}
