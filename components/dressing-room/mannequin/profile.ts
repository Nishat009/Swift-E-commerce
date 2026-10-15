// Pure body and garment profiles shared by the 3D mannequin (three.js) and the 2D dress silhouettes.
// Units are metres: feet rest on y = 0 and the figure faces +z.

export type Gender = 'male' | 'female';
export type Silhouette =
  | 'a-line' | 'skater' | 'ballgown' | 'maxi' | 'slip' | 'bodycon' | 'mermaid' | 'anarkali'
  | 'top' | 'crop' | 'jacket' | 'coat';
export type Neckline = 'sweetheart' | 'v-neck' | 'round' | 'boat' | 'strapless' | 'halter' | 'square';
export type Sleeves = 'none' | 'straps' | 'cap' | 'puff' | 'short' | 'elbow' | 'long' | 'bishop';
export type Fabric =
  | 'cotton' | 'linen' | 'satin' | 'silk' | 'velvet' | 'chiffon' | 'sequin' | 'knit' | 'denim' | 'wool' | 'leather';
export type Pattern = 'solid' | 'floral' | 'polka' | 'stripes' | 'gingham' | 'paisley' | 'leaf';

export interface GarmentSpec {
  silhouette: Silhouette;
  neckline: Neckline;
  sleeves: Sleeves;
  fabric: Fabric;
  pattern: Pattern;
  color: string;
  accent?: string;   // secondary pattern colour
  trim?: string;     // hem band colour
  belt?: string;     // waist belt colour
  leggings?: string; // fitted leggings under the skirt (anarkali / churidar)
}

/** Cross-section of the body at one height: half-width, front depth and back depth. */
export interface Ring { a: number; bf: number; bb: number }

type TorsoKey = [y: number, a: number, bf: number, bb: number];

export interface Rig {
  torso: TorsoKey[];
  shoulder: { x: number; y: number };
  hip: { x: number; y: number };
  upperArm: number;
  foreArm: number;
  thigh: number;
  shin: number;
  upperArmR: number[];
  foreArmR: number[];
  thighR: number[];
  shinR: number[];
  hand: [number, number, number];
  head: { y: number; r: [number, number, number] };
  waistY: number;
  strapX: number;
}

const FEMALE_TORSO: TorsoKey[] = [
  [0.790, 0.020, 0.020, 0.020],
  [0.815, 0.120, 0.072, 0.088],
  [0.850, 0.160, 0.088, 0.112],
  [0.905, 0.178, 0.094, 0.126],
  [0.960, 0.174, 0.089, 0.118],
  [1.020, 0.152, 0.081, 0.096],
  [1.080, 0.128, 0.077, 0.081],
  [1.150, 0.134, 0.084, 0.084],
  [1.210, 0.147, 0.110, 0.089],
  [1.270, 0.157, 0.126, 0.091],
  [1.330, 0.160, 0.108, 0.091],
  [1.390, 0.171, 0.088, 0.084],
  [1.430, 0.165, 0.074, 0.074],
  [1.460, 0.118, 0.060, 0.062],
  [1.480, 0.058, 0.047, 0.050],
  [1.520, 0.046, 0.045, 0.046],
  [1.570, 0.044, 0.044, 0.044],
];

const MALE_TORSO: TorsoKey[] = [
  [0.810, 0.020, 0.020, 0.020],
  [0.835, 0.125, 0.075, 0.085],
  [0.875, 0.158, 0.088, 0.104],
  [0.930, 0.166, 0.092, 0.110],
  [1.000, 0.160, 0.090, 0.098],
  [1.080, 0.152, 0.092, 0.090],
  [1.160, 0.160, 0.100, 0.092],
  [1.240, 0.174, 0.110, 0.098],
  [1.320, 0.188, 0.116, 0.102],
  [1.400, 0.204, 0.104, 0.098],
  [1.450, 0.198, 0.084, 0.084],
  [1.485, 0.140, 0.066, 0.068],
  [1.505, 0.066, 0.056, 0.058],
  [1.550, 0.056, 0.054, 0.055],
  [1.610, 0.053, 0.052, 0.052],
];

export const RIGS: Record<Gender, Rig> = {
  female: {
    torso: FEMALE_TORSO,
    shoulder: { x: 0.168, y: 1.405 },
    hip: { x: 0.085, y: 0.865 },
    upperArm: 0.27,
    foreArm: 0.24,
    thigh: 0.42,
    shin: 0.39,
    upperArmR: [0.040, 0.037, 0.031],
    foreArmR: [0.030, 0.027, 0.021],
    thighR: [0.080, 0.073, 0.060, 0.047],
    shinR: [0.046, 0.053, 0.045, 0.034, 0.029],
    hand: [0.02, 0.07, 0.038],
    head: { y: 1.645, r: [0.074, 0.098, 0.088] },
    waistY: 1.08,
    strapX: 0.092,
  },
  male: {
    torso: MALE_TORSO,
    shoulder: { x: 0.198, y: 1.432 },
    hip: { x: 0.09, y: 0.885 },
    upperArm: 0.29,
    foreArm: 0.26,
    thigh: 0.43,
    shin: 0.40,
    upperArmR: [0.048, 0.044, 0.036],
    foreArmR: [0.036, 0.033, 0.025],
    thighR: [0.086, 0.079, 0.066, 0.052],
    shinR: [0.051, 0.058, 0.049, 0.038, 0.032],
    hand: [0.024, 0.08, 0.045],
    head: { y: 1.70, r: [0.080, 0.106, 0.094] },
    waistY: 1.08,
    strapX: 0.11,
  },
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smoothstep = (e0: number, e1: number, v: number) => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** max() with a rounded corner, so fabric leaves the body without a crease. */
const smoothMax = (a: number, b: number, k: number) => (a + b + Math.sqrt((a - b) ** 2 + k * k)) / 2;

/** Linear sample of a radius list spread evenly along t in [0, 1]. */
export function sampleRadius(radii: number[], t: number): number {
  const f = clamp01(t) * (radii.length - 1);
  const i = Math.min(radii.length - 2, Math.floor(f));
  return lerp(radii[i], radii[i + 1], f - i);
}

const catmull = (p0: number, p1: number, p2: number, p3: number, t: number) => {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
};

/** Smooth torso cross-section, or null outside the torso. */
export function torsoRing(rig: Rig, y: number): Ring | null {
  const keys = rig.torso;
  if (y < keys[0][0] || y > keys[keys.length - 1][0]) return null;
  let i = 0;
  while (i < keys.length - 2 && y > keys[i + 1][0]) i++;
  const k0 = keys[Math.max(0, i - 1)];
  const k1 = keys[i];
  const k2 = keys[i + 1];
  const k3 = keys[Math.min(keys.length - 1, i + 2)];
  const t = (y - k1[0]) / (k2[0] - k1[0]);
  const at = (c: 1 | 2 | 3) => Math.max(0.004, catmull(k0[c], k1[c], k2[c], k3[c], t));
  return { a: at(1), bf: at(2), bb: at(3) };
}

/** Radius of a single (vertical) leg at height y, 0 above the hip. */
export function legRadius(rig: Rig, y: number): number {
  const { hip, thigh, shin, thighR, shinR } = rig;
  const top = thighR[0];
  if (y > hip.y + top) return 0;
  if (y > hip.y) {
    const d = (y - hip.y) / top;
    return top * Math.sqrt(Math.max(0, 1 - d * d));
  }
  if (y > hip.y - thigh) return sampleRadius(thighR, (hip.y - y) / thigh);
  if (y > hip.y - thigh - shin) return sampleRadius(shinR, (hip.y - thigh - y) / shin);
  return shinR[shinR.length - 1];
}

/** Outer envelope of torso + both legs: what a garment must clear at height y. */
export function envelope(rig: Rig, y: number): Ring {
  const t = torsoRing(rig, y);
  const r = legRadius(rig, y);
  const legs = r > 0 ? { a: rig.hip.x + r, bf: r, bb: r } : null;
  if (!t && !legs) return { a: 0, bf: 0, bb: 0 };
  if (!t) return legs!;
  if (!legs) return t;
  return { a: Math.max(t.a, legs.a), bf: Math.max(t.bf, legs.bf), bb: Math.max(t.bb, legs.bb) };
}

/** z of the torso surface at (x, y), on the front or back. */
export function surfaceZ(rig: Rig, x: number, y: number, front: boolean): number {
  const r = torsoRing(rig, y);
  if (!r || Math.abs(x) >= r.a) return 0;
  const depth = front ? r.bf : -r.bb;
  return depth * Math.sqrt(1 - (x / r.a) ** 2);
}

interface SilhouetteParams {
  hem: number;          // hem height
  waist?: number;       // where the skirt starts (female scale), default = natural waist
  flareFrom?: number;   // stays fitted down to this height (mermaid)
  flare: number;        // hem half-width
  curve: (t: number) => number;
  depth: number;        // hem depth / width ratio
  taper?: number;       // pencil taper through the fitted section
  folds: number;
  fold: number;
  ease: number;         // distance from the body
  sway: number;
}

const none = () => 0;

export const SILHOUETTES: Record<Silhouette, SilhouetteParams> = {
  'a-line': { hem: 0.50, flare: 0.33, curve: (t) => t ** 0.85, depth: 0.82, folds: 9, fold: 0.05, ease: 0.007, sway: 0.012 },
  skater: { hem: 0.70, flare: 0.36, curve: (t) => Math.sin((t * Math.PI) / 2), depth: 0.85, folds: 13, fold: 0.07, ease: 0.007, sway: 0.014 },
  ballgown: { hem: 0.02, flare: 0.60, curve: (t) => 1 - (1 - t) ** 2.4, depth: 0.9, folds: 15, fold: 0.04, ease: 0.007, sway: 0.01 },
  maxi: { hem: 0.04, flare: 0.34, curve: (t) => t ** 1.1, depth: 0.82, folds: 11, fold: 0.06, ease: 0.008, sway: 0.02 },
  slip: { hem: 0.36, flare: 0.24, curve: (t) => t ** 1.3, depth: 0.78, folds: 7, fold: 0.035, ease: 0.006, sway: 0.012 },
  bodycon: { hem: 0.44, flare: 0, curve: none, depth: 0.7, taper: 0.08, folds: 0, fold: 0, ease: 0.005, sway: 0 },
  mermaid: { hem: 0.02, flareFrom: 0.46, flare: 0.44, curve: (t) => t ** 1.6, depth: 0.85, taper: 0.07, folds: 12, fold: 0.06, ease: 0.006, sway: 0.012 },
  anarkali: { hem: 0.24, waist: 1.19, flare: 0.50, curve: (t) => t ** 0.75, depth: 0.88, folds: 28, fold: 0.045, ease: 0.008, sway: 0.016 },
  top: { hem: 0.92, flare: 0, curve: none, depth: 0.8, folds: 0, fold: 0, ease: 0.013, sway: 0 },
  crop: { hem: 1.12, flare: 0, curve: none, depth: 0.8, folds: 0, fold: 0, ease: 0.011, sway: 0 },
  jacket: { hem: 0.86, flare: 0, curve: none, depth: 0.8, folds: 0, fold: 0, ease: 0.03, sway: 0 },
  coat: { hem: 0.46, flare: 0.27, curve: (t) => t ** 1.4, depth: 0.8, folds: 6, fold: 0.03, ease: 0.032, sway: 0.006 },
};

/** Neckline height (female scale) for a direction with cos/sin around the body; front is sin > 0. */
export function necklineY(neckline: Neckline, c: number, s: number): number {
  const front = smoothstep(-0.15, 0.35, s);
  const ac = Math.abs(c);
  switch (neckline) {
    case 'strapless': return 1.30 + 0.015 * front;
    case 'sweetheart': return lerp(1.295, 1.338 - 0.05 * Math.exp(-((c / 0.12) ** 2)), front);
    case 'square': return lerp(1.40, 1.325 + 0.125 * smoothstep(0.40, 0.62, ac), front);
    case 'v-neck': return lerp(1.43, 1.27 + 0.19 * Math.min(1, ac / 0.5), front);
    case 'round': return lerp(1.465, 1.415 + 0.05 * smoothstep(0.05, 0.6, ac), front);
    case 'boat': return lerp(1.462, 1.448 + 0.012 * ac, front);
    case 'halter': return lerp(1.16, 1.295 + 0.08 * Math.exp(-((c / 0.3) ** 2)), front);
  }
}

/** Static per-height sample: fitted radii (a, bf, bb), flare radii (fa, fbf, fbb) and flare progress t. */
export interface ShapeSample { a: number; bf: number; bb: number; fa: number; fbf: number; fbb: number; t: number }

export interface GarmentShape {
  params: SilhouetteParams;
  hem: number;
  waist: number;
  uRepeat: number;
  animated: boolean;
  topY(theta: number): number;
  sample(y: number): ShapeSample;
  place(s: ShapeSample, theta: number, time: number, animate: boolean, extra?: number): [number, number];
}

export function garmentShape(rig: Rig, spec: GarmentSpec): GarmentShape {
  const p = SILHOUETTES[spec.silhouette];
  const dy = rig.shoulder.y - RIGS.female.shoulder.y;
  const waist = p.waist !== undefined ? p.waist + dy : rig.waistY;
  const hem = p.hem;
  const flareFrom = p.flareFrom !== undefined ? Math.min(waist, p.flareFrom) : waist;
  const ease = p.ease;

  // Fabric hangs straight down from the widest point above it (hips, bust...).
  const step = 0.004;
  const count = Math.max(2, Math.ceil((waist - hem) / step) + 2);
  const hang: Ring[] = [];
  let run: Ring = { a: 0, bf: 0, bb: 0 };
  for (let k = 0; k < count; k++) {
    const e = envelope(rig, waist - k * step);
    run = { a: Math.max(run.a, e.a), bf: Math.max(run.bf, e.bf), bb: Math.max(run.bb, e.bb) };
    hang.push(run);
  }
  const hangAt = (y: number): Ring => {
    const f = Math.min(count - 1.001, Math.max(0, (waist - y) / step));
    const k = Math.floor(f);
    const w = f - k;
    const h0 = hang[k];
    const h1 = hang[k + 1];
    return { a: lerp(h0.a, h1.a, w), bf: lerp(h0.bf, h1.bf, w), bb: lerp(h0.bb, h1.bb, w) };
  };

  const span = Math.max(0.01, waist - hem);
  const fitted = (y: number): Ring => {
    const e = envelope(rig, y);
    if (y >= waist) return { a: e.a + ease, bf: e.bf + ease, bb: e.bb + ease };
    const h = hangAt(y);
    const k = 1 - (p.taper ?? 0) * clamp01((waist - y) / span);
    return {
      a: Math.max(e.a, h.a * k) + ease,
      bf: Math.max(e.bf, h.bf * k) + ease,
      bb: Math.max(e.bb, h.bb * k) + ease,
    };
  };

  const start = fitted(flareFrom);
  const flareSpan = Math.max(0.01, flareFrom - hem);
  const sample = (y: number): ShapeSample => {
    const f = fitted(y);
    if (p.flare <= 0 || y >= flareFrom) return { ...f, fa: 0, fbf: 0, fbb: 0, t: 0 };
    const t = clamp01((flareFrom - y) / flareSpan);
    const c = p.curve(t);
    const d = p.flare * p.depth;
    return { ...f, fa: lerp(start.a, p.flare, c), fbf: lerp(start.bf, d, c), fbb: lerp(start.bb, d, c), t };
  };

  const place = (s: ShapeSample, theta: number, time: number, animate: boolean, extra = 0): [number, number] => {
    let wave = 1;
    if (p.folds && s.t > 0) {
      const phase = theta * p.folds + Math.sin(theta * 3) * 0.6 + (animate ? time * 0.9 : 0);
      wave = 1 + p.fold * Math.pow(s.t, 1.2) * Math.sin(phase);
    }
    const k = 0.01 * smoothstep(0, 0.2, s.t); // sharp at the waist seam, soft where the skirt leaves the hips
    const a = smoothMax(s.a, s.fa * wave, k) + extra;
    const bf = smoothMax(s.bf, s.fbf * wave, k) + extra;
    const bb = smoothMax(s.bb, s.fbb * wave, k) + extra;
    const c = Math.cos(theta);
    const sn = Math.sin(theta);
    let x = a * c;
    let z = sn * (sn > 0 ? bf : bb);
    if (animate && p.sway && s.t > 0) {
      const w = s.t * s.t;
      x += p.sway * w * Math.sin(time * 1.1);
      z += p.sway * 0.6 * w * Math.sin(time * 0.8 + 1);
    }
    return [x, z];
  };

  const low = spec.neckline === 'strapless' || spec.neckline === 'sweetheart' || spec.neckline === 'halter';
  const sleeveless = spec.sleeves === 'none' || spec.sleeves === 'straps';
  const topY = (theta: number) => {
    const c = Math.cos(theta);
    let y = necklineY(spec.neckline, c, Math.sin(theta));
    // Cut armholes so sleeveless styles leave the shoulder joint free.
    if (sleeveless && !low) y = lerp(y, Math.min(y, 1.31), smoothstep(0.78, 0.95, Math.abs(c)));
    return y + dy;
  };

  const meanR = (0.16 + Math.max(p.flare, 0.17)) / 2;
  return {
    params: p,
    hem,
    waist,
    uRepeat: Math.max(3, Math.round((2 * Math.PI * meanR) / 0.25)),
    animated: p.sway > 0 || p.folds > 0,
    topY,
    sample,
    place,
  };
}

/** Outward arm angle that keeps hanging hands clear of the widest garment. */
export function armSpread(rig: Rig, shapes: GarmentShape[]): number {
  const reach = rig.upperArm + rig.foreArm + 0.06;
  let need = 0;
  for (let y = rig.shoulder.y - reach; y <= rig.shoulder.y - 0.25; y += 0.02) {
    let w = envelope(rig, y).a;
    for (const sh of shapes) {
      const s = sh.sample(y);
      w = Math.max(w, s.a, s.fa * (1 + sh.params.fold));
    }
    need = Math.max(need, Math.atan2(w + 0.045 - rig.shoulder.x, rig.shoulder.y - y));
  }
  return Math.min(0.62, Math.max(0.09, need));
}

/** How far down the upper arm (and forearm) a sleeve reaches. */
export function sleeveLength(rig: Rig, sleeves: Sleeves): number {
  switch (sleeves) {
    case 'cap': return 0.06;
    case 'puff': return 0.12;
    case 'short': return 0.14;
    case 'elbow': return rig.upperArm * 0.96;
    case 'long':
    case 'bishop': return rig.upperArm + rig.foreArm - 0.012;
    default: return 0;
  }
}
