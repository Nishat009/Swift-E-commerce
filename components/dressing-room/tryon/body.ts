import * as THREE from 'three';

export type Gender = 'female' | 'male';

/** Torso cross-section at a height: half width, front depth, back depth (metres). */
export interface Ring { a: number; bf: number; bb: number }

/** Landmarks the garment fitting needs. Floor is y = 0, the figure faces +z. */
export interface BodySpec {
  gender: Gender;
  crotchY: number;
  waistY: number;
  shoulderY: number;
  neckY: number;
  hipX: number;
  /** Torso (or, below the crotch, the envelope around both legs) at height y. */
  ring(y: number): Ring;
  /** Radius of one leg at height y. */
  legR(y: number): number;
  /** Shoulder → elbow → wrist, with the arm radius along it. */
  arm: { shoulder: THREE.Vector3; elbow: THREE.Vector3; wrist: THREE.Vector3; radius(t: number): number };
}

type Key = [y: number, a: number, bf: number, bb: number];

// Store-mannequin proportions. Women: narrow shoulders, bust, waist, wide hips.
// Men: broad shoulders, flat chest, straight waist, narrow hips.
const TORSO: Record<Gender, Key[]> = {
  female: [
    [0.765, 0.06, 0.04, 0.045],
    [0.8, 0.152, 0.085, 0.105],
    [0.88, 0.18, 0.1, 0.13],
    [0.97, 0.168, 0.094, 0.114],
    [1.06, 0.128, 0.082, 0.084],
    [1.15, 0.134, 0.088, 0.084],
    [1.235, 0.148, 0.098, 0.088],
    [1.3, 0.152, 0.098, 0.086],
    [1.36, 0.162, 0.086, 0.082],
    [1.405, 0.17, 0.07, 0.07],
    [1.435, 0.135, 0.058, 0.058],
    [1.46, 0.07, 0.048, 0.048],
    [1.48, 0.047, 0.045, 0.045],
    [1.57, 0.044, 0.042, 0.042],
  ],
  male: [
    [0.825, 0.06, 0.04, 0.045],
    [0.86, 0.148, 0.09, 0.1],
    [0.94, 0.168, 0.1, 0.11],
    [1.03, 0.16, 0.098, 0.1],
    [1.12, 0.152, 0.1, 0.092],
    [1.22, 0.162, 0.108, 0.098],
    [1.32, 0.178, 0.12, 0.102],
    [1.41, 0.194, 0.108, 0.1],
    [1.48, 0.206, 0.082, 0.082],
    [1.52, 0.162, 0.07, 0.07],
    [1.55, 0.086, 0.06, 0.06],
    [1.57, 0.06, 0.057, 0.057],
    [1.67, 0.056, 0.054, 0.054],
  ],
};

const SHAPE = {
  female: {
    crotchY: 0.8, waistY: 1.06, shoulderY: 1.405, neckY: 1.48, hipX: 0.088,
    head: { y: 1.655, r: [0.074, 0.104, 0.088] },
    bust: { y: 1.235, amp: 0.042 },
    // [distance from hip joint, radius]
    leg: [[0, 0.088], [0.12, 0.08], [0.3, 0.06], [0.4, 0.047], [0.5, 0.054], [0.6, 0.048], [0.72, 0.031], [0.8, 0.03]],
    shoulder: [0.148, 1.382], upperArm: 0.285, foreArm: 0.25,
    armR: [[0, 0.046], [0.06, 0.044], [0.27, 0.032], [0.32, 0.036], [0.47, 0.026], [0.535, 0.024]],
    foot: [0.038, 0.034, 0.115],
  },
  male: {
    crotchY: 0.86, waistY: 1.12, shoulderY: 1.48, neckY: 1.57, hipX: 0.096,
    head: { y: 1.755, r: [0.08, 0.112, 0.097] },
    bust: { y: 1.3, amp: 0 },
    leg: [[0, 0.092], [0.12, 0.085], [0.32, 0.066], [0.42, 0.053], [0.53, 0.062], [0.64, 0.054], [0.77, 0.036], [0.86, 0.034]],
    shoulder: [0.178, 1.458], upperArm: 0.315, foreArm: 0.275,
    armR: [[0, 0.054], [0.07, 0.052], [0.3, 0.039], [0.35, 0.043], [0.52, 0.031], [0.59, 0.029]],
    foot: [0.044, 0.04, 0.13],
  },
} as const;

/** Smooth interpolation through keys (monotone cubic, so no overshoot between them). */
function smoothCurve(xs: number[], ys: number[]) {
  const n = xs.length;
  const d = new Array(n - 1).fill(0).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = new Array(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

const gauss = (x: number, mu: number, sigma: number) => Math.exp(-(((x - mu) / sigma) ** 2));

export function bodySpec(gender: Gender): BodySpec {
  const s = SHAPE[gender];
  const keys = TORSO[gender];
  const ys = keys.map((k) => k[0]);
  const a = smoothCurve(ys, keys.map((k) => k[1]));
  const bf = smoothCurve(ys, keys.map((k) => k[2]));
  const bb = smoothCurve(ys, keys.map((k) => k[3]));
  const legTop = s.crotchY + 0.06;
  const legCurve = smoothCurve(s.leg.map((p) => p[0]), s.leg.map((p) => p[1]));
  const legR = (y: number) => legCurve(legTop - y);
  const bust = (y: number) => s.bust.amp * gauss(y, s.bust.y, 0.055);

  const ring = (y: number): Ring => {
    const torso = { a: a(y), bf: bf(y) + bust(y) * 0.9, bb: bb(y) };
    // Below the hips: the envelope around both legs, blending into the torso.
    const r = legR(y);
    const legs = { a: s.hipX + r, bf: r, bb: r };
    const k = THREE.MathUtils.smoothstep(y, s.crotchY - 0.02, s.crotchY + 0.06);
    return {
      a: Math.max(legs.a, THREE.MathUtils.lerp(legs.a, torso.a, k)),
      bf: Math.max(legs.bf, THREE.MathUtils.lerp(legs.bf, torso.bf, k)),
      bb: Math.max(legs.bb, THREE.MathUtils.lerp(legs.bb, torso.bb, k)),
    };
  };

  const shoulder = new THREE.Vector3(s.shoulder[0], s.shoulder[1], 0);
  const upperDir = new THREE.Vector3(Math.sin(0.16), -Math.cos(0.16), 0).normalize();
  const elbow = shoulder.clone().addScaledVector(upperDir, s.upperArm);
  const foreDir = new THREE.Vector3(Math.sin(0.1), -Math.cos(0.1), 0.18).normalize();
  const wrist = elbow.clone().addScaledVector(foreDir, s.foreArm);
  const armCurve = smoothCurve(s.armR.map((p) => p[0]), s.armR.map((p) => p[1]));

  return {
    gender,
    crotchY: s.crotchY,
    waistY: s.waistY,
    shoulderY: s.shoulderY,
    neckY: s.neckY,
    hipX: s.hipX,
    ring,
    legR,
    arm: { shoulder, elbow, wrist, radius: armCurve },
  };
}

/** Tube along a straight bone from p0 to p1, radius r(t) with t in metres from p0. */
export function boneTube(p0: THREE.Vector3, p1: THREE.Vector3, r: (t: number) => number, t0 = 0, steps = 24, sides = 32) {
  const len = p0.distanceTo(p1);
  const pts: THREE.Vector2[] = [];
  for (let k = 0; k <= steps; k++) {
    const t = (len * k) / steps;
    pts.push(new THREE.Vector2(Math.max(0.0005, r(t0 + t)), -t));
  }
  const geometry = new THREE.LatheGeometry(pts.reverse(), sides);
  // Lathe runs along +y; aim it from p0 towards p1.
  const dir = p1.clone().sub(p0).normalize();
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir));
  geometry.translate(p0.x, p0.y, p0.z);
  return geometry;
}

/** Faceless display mannequin. Returns its group; geometry and material are owned by it. */
export function buildMannequin(body: BodySpec, material: THREE.Material): THREE.Group {
  const s = SHAPE[body.gender];
  const group = new THREE.Group();
  const add = (geometry: THREE.BufferGeometry) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // Torso + neck: elliptical rings, front and back depths independent.
  const keys = TORSO[body.gender];
  const y0 = keys[0][0];
  const y1 = keys[keys.length - 1][0];
  const rows = 90;
  const cols = 72;
  const ys = Array.from({ length: rows + 1 }, (_, j) => y1 - ((y1 - y0) * j) / rows);
  const pos: number[] = [];
  const bust = (y: number) => s.bust.amp * gauss(y, s.bust.y, 0.055);
  const a = smoothCurve(keys.map((k) => k[0]), keys.map((k) => k[1]));
  const bf = smoothCurve(keys.map((k) => k[0]), keys.map((k) => k[2]));
  const bb = smoothCurve(keys.map((k) => k[0]), keys.map((k) => k[3]));
  for (const y of ys) {
    const ra = a(y);
    for (let i = 0; i <= cols; i++) {
      const th = (i / cols) * Math.PI * 2;
      const x = ra * Math.cos(th);
      const sn = Math.sin(th);
      let z = (sn > 0 ? bf(y) : bb(y)) * sn;
      // Two soft lobes for the bust
      if (sn > 0) z += bust(y) * gauss(Math.abs(x), 0.068, 0.05) * sn;
      pos.push(x, y, z);
    }
  }
  pos.push(0, y0 - 0.005, 0); // bottom pole
  const index: number[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const p = j * (cols + 1) + i;
      const q = p + cols + 1;
      index.push(p, p + 1, q, p + 1, q + 1, q);
    }
  }
  const pole = (rows + 1) * (cols + 1);
  for (let i = 0; i < cols; i++) {
    const p = rows * (cols + 1) + i;
    index.push(p, p + 1, pole);
  }
  const torso = new THREE.BufferGeometry();
  torso.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  torso.setIndex(index);
  torso.computeVertexNormals();
  seamNormals(torso, rows + 1, cols);
  add(torso);

  // Head: a smooth egg, chin slightly forward.
  const head = add(new THREE.SphereGeometry(1, 48, 32));
  head.scale.set(s.head.r[0], s.head.r[1], s.head.r[2]);
  head.position.set(0, s.head.y, 0.012);
  head.rotation.x = 0.12;

  // Arms
  const { shoulder, elbow, wrist, radius } = body.arm;
  for (const side of [1, -1]) {
    const m = (v: THREE.Vector3) => new THREE.Vector3(v.x * side, v.y, v.z);
    add(boneTube(m(shoulder), m(elbow), radius));
    add(boneTube(m(elbow), m(wrist), radius, s.upperArm));
    const joint = add(new THREE.SphereGeometry(radius(0), 24, 16));
    joint.position.copy(m(shoulder));
    const elbowBall = add(new THREE.SphereGeometry(radius(s.upperArm), 16, 12));
    elbowBall.position.copy(m(elbow));
    // Hand: a flat, relaxed paddle
    const handLen = body.gender === 'female' ? 0.085 : 0.095;
    const hand = add(new THREE.SphereGeometry(1, 24, 16));
    hand.scale.set(0.021, handLen, 0.042);
    const dir = wrist.clone().sub(elbow).normalize();
    hand.position.copy(m(wrist.clone().addScaledVector(dir, handLen * 0.9)));
    hand.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(dir.x * side, dir.y, dir.z));
  }

  // Legs (straight, a touch apart) and feet
  const legTop = body.crotchY + 0.06;
  for (const side of [1, -1]) {
    const top = new THREE.Vector3(side * body.hipX, legTop, 0);
    const ankle = new THREE.Vector3(side * (body.hipX + 0.012), 0.07, -0.005);
    add(boneTube(top, ankle, (t) => body.legR(legTop - t), 0, 40));
    const [fx, fy, fz] = s.foot;
    const foot = add(new THREE.SphereGeometry(1, 24, 16));
    foot.scale.set(fx, fy, fz);
    foot.position.set(side * (body.hipX + 0.016), fy * 0.6, 0.05);
    foot.rotation.y = side * 0.08;
  }
  return group;
}

/** Shares normals between the first and last column of a closed ring surface. */
export function seamNormals(geometry: THREE.BufferGeometry, rows: number, cols: number) {
  const normal = geometry.getAttribute('normal') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let j = 0; j < rows; j++) {
    const p = j * (cols + 1);
    const q = p + cols;
    v.set(normal.getX(p) + normal.getX(q), normal.getY(p) + normal.getY(q), normal.getZ(p) + normal.getZ(q)).normalize();
    normal.setXYZ(p, v.x, v.y, v.z);
    normal.setXYZ(q, v.x, v.y, v.z);
  }
  normal.needsUpdate = true;
}
