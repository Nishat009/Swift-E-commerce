import * as THREE from 'three';
import { BodySpec, Ring } from './body';

/**
 * Any garment photo -> a garment on the mannequin.
 *
 * The photo (a flat-lay or packshot on a plain background) is cut out, and each row of the
 * cut-out is read as one horizontal band of the garment: a flat garment's width is half its
 * circumference. Every band is wrapped round the body as a ring with that circumference (never
 * tighter than the body plus ease), the photo's row painted across the front half and mirrored
 * across the back. Sleeves are found from what sticks out past the torso and drawn on the arms.
 */

export type GarmentKind = 'dress' | 'top' | 'outer' | 'pants' | 'skirt';

export interface GarmentImage {
  canvas: HTMLCanvasElement;
  W: number;
  H: number;
  mask: Uint8Array;
  /** Row extents of the garment, NaN where the row is empty. */
  L: Float32Array;
  R: Float32Array;
  top: number;
  bottom: number;
  cx: number;
  /** False when the photo isn't a garment on a plain background (a model, a street scene). */
  usable: boolean;
  /** The garment's main colour, for the plain stand-in when the photo isn't usable. */
  color: string;
}

const MAX_SIZE = 640;

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[sorted.length >> 1];
}

/** 3-channel box blur. Radius 2, two passes flattens paper grain and JPEG noise. */
function blur(px: Uint8ClampedArray, W: number, H: number, r = 2, passes = 2) {
  let src = new Float32Array(W * H * 3);
  for (let i = 0; i < W * H; i++) for (let c = 0; c < 3; c++) src[i * 3 + c] = px[i * 4 + c];
  for (let pass = 0; pass < passes; pass++) {
    const tmp = new Float32Array(src.length);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          let n = 0;
          for (let k = -r; k <= r; k++) {
            const xx = x + k;
            if (xx < 0 || xx >= W) continue;
            sum += src[(y * W + xx) * 3 + c];
            n++;
          }
          tmp[(y * W + x) * 3 + c] = sum / n;
        }
      }
    }
    const out = new Float32Array(src.length);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          let n = 0;
          for (let k = -r; k <= r; k++) {
            const yy = y + k;
            if (yy < 0 || yy >= H) continue;
            sum += tmp[(yy * W + x) * 3 + c];
            n++;
          }
          out[(y * W + x) * 3 + c] = sum / n;
        }
      }
    }
    src = out;
  }
  return src;
}

/** Cuts the garment out of its background. Works on plain studio, paper and floor backdrops. */
export function analyzeGarmentImage(img: HTMLImageElement): GarmentImage {
  const k = Math.min(1, MAX_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
  const W = Math.max(16, Math.round(img.naturalWidth * k));
  const H = Math.max(16, Math.round(img.naturalHeight * k));
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, W, H);
  const image = ctx.getImageData(0, 0, W, H);
  const px = image.data;
  const N = W * H;
  const soft = blur(px, W, H);

  const borderIdx: number[] = [];
  for (let x = 0; x < W; x++) borderIdx.push(x, x + (H - 1) * W);
  for (let y = 1; y < H - 1; y++) borderIdx.push(y * W, y * W + W - 1);
  const bgColor = [0, 1, 2].map((c) => median(borderIdx.map((i) => soft[i * 3 + c])));
  const dist = (i: number) =>
    Math.hypot(soft[i * 3] - bgColor[0], soft[i * 3 + 1] - bgColor[1], soft[i * 3 + 2] - bgColor[2]);
  const step = (i: number, j: number) =>
    Math.hypot(soft[i * 3] - soft[j * 3], soft[i * 3 + 1] - soft[j * 3 + 1], soft[i * 3 + 2] - soft[j * 3 + 2]);
  // A plain backdrop is smooth pixel to pixel, even when lit unevenly (vignetting).
  const steps: number[] = [];
  for (let x = 1; x < W; x++) steps.push(step(x, x - 1), step((H - 1) * W + x, (H - 1) * W + x - 1));
  for (let y = 1; y < H; y++) steps.push(step(y * W, (y - 1) * W), step(y * W + W - 1, (y - 1) * W + W - 1));
  const noise = median(steps);
  const tol = 70;

  // Edge strength on a lightly smoothed copy: a garment's outline is a sharp step even where
  // its colour is close to the backdrop's (a white shirt on beige paper).
  const crisp = blur(px, W, H, 1, 1);
  const grad = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const x = i % W;
    const r = x < W - 1 ? i + 1 : i;
    const l = x > 0 ? i - 1 : i;
    const d = i < N - W ? i + W : i;
    const u = i >= W ? i - W : i;
    let gx = 0;
    let gy = 0;
    for (let c = 0; c < 3; c++) {
      gx += (crisp[r * 3 + c] - crisp[l * 3 + c]) ** 2;
      gy += (crisp[d * 3 + c] - crisp[u * 3 + c]) ** 2;
    }
    grad[i] = Math.sqrt(gx + gy) / 2;
  }
  const edgeAt = 3 + 3 * median(borderIdx.map((i) => grad[i]));

  // Flood the backdrop in from the border, through smooth pixels only. Uneven lighting and soft
  // shadows change slowly and are followed; the garment outline is an edge and stops it. Each
  // pixel also stays within reach of the colour of the border pixel it came from.
  let fg = new Uint8Array(N).fill(1);
  const plainBackdrop = noise < 3.5;
  if (plainBackdrop) {
    const ref = new Float32Array(N * 3);
    const queue = new Int32Array(N);
    let head = 0;
    let tail = 0;
    for (const i of borderIdx) {
      if (fg[i] && dist(i) < tol && grad[i] < edgeAt) {
        fg[i] = 0;
        for (let c = 0; c < 3; c++) ref[i * 3 + c] = soft[i * 3 + c];
        queue[tail++] = i;
      }
    }
    while (head < tail) {
      const i = queue[head++];
      const x = i % W;
      for (let n = 0; n < 4; n++) {
        let j: number;
        if (n === 0) { if (x === 0) continue; j = i - 1; }
        else if (n === 1) { if (x === W - 1) continue; j = i + 1; }
        else if (n === 2) { if (i < W) continue; j = i - W; }
        else { if (i >= N - W) continue; j = i + W; }
        if (!fg[j]) continue;
        const d = Math.hypot(soft[j * 3] - ref[i * 3], soft[j * 3 + 1] - ref[i * 3 + 1], soft[j * 3 + 2] - ref[i * 3 + 2]);
        if (d < tol && grad[j] < edgeAt) {
          fg[j] = 0;
          for (let c = 0; c < 3; c++) ref[j * 3 + c] = ref[i * 3 + c];
          queue[tail++] = j;
        }
      }
    }

    // Drop specks (labels, lint): keep components at least 4% the size of the largest.
    const label = new Int32Array(N).fill(-1);
    const sizes: number[] = [];
    for (let s = 0; s < N; s++) {
      if (!fg[s] || label[s] >= 0) continue;
      const id = sizes.length;
      let count = 0;
      head = 0;
      tail = 0;
      queue[tail++] = s;
      label[s] = id;
      while (head < tail) {
        const i = queue[head++];
        count++;
        const x = i % W;
        const ns = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W];
        for (const j of ns) {
          if (j < 0 || j >= N || !fg[j] || label[j] >= 0) continue;
          label[j] = id;
          queue[tail++] = j;
        }
      }
      sizes.push(count);
    }
    const largest = Math.max(0, ...sizes);
    for (let i = 0; i < N; i++) if (fg[i] && sizes[label[i]] < largest * 0.04) fg[i] = 0;

    // Shave the 1px halo of background colour.
    const eroded = new Uint8Array(fg);
    for (let i = 0; i < N; i++) {
      if (!fg[i]) continue;
      const x = i % W;
      if ((x > 0 && !fg[i - 1]) || (x < W - 1 && !fg[i + 1]) || (i >= W && !fg[i - W]) || (i < N - W && !fg[i + W])) eroded[i] = 0;
    }
    fg = eroded;
  }
  let area = 0;
  for (let i = 0; i < N; i++) area += fg[i];
  let usable = plainBackdrop && area > N * 0.04 && area < N * 0.97;
  let shape = measure(fg, W, H);

  // A model photographed on a plain backdrop cuts out as a person: a narrow, skin-toned head
  // on top. That (or a busy scene) can't be worn; keep only the garment's colour.
  const isSkin = (i: number) => {
    const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
    return r > 95 && g > 40 && b > 20 && r > g && r > b && r - g > 15 && r - Math.min(g, b) > 15;
  };
  if (usable) {
    const bandEnd = shape.top + Math.round((shape.bottom - shape.top) * 0.12);
    let inBand = 0;
    let skin = 0;
    let bandWidth = 0;
    let maxWidth = 0;
    for (let y = shape.top; y <= shape.bottom; y++) {
      if (Number.isNaN(shape.L[y])) continue;
      const w = shape.R[y] - shape.L[y];
      maxWidth = Math.max(maxWidth, w);
      if (y > bandEnd) continue;
      bandWidth = Math.max(bandWidth, w);
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (!fg[i]) continue;
        inBand++;
        skin += isSkin(i) ? 1 : 0;
      }
    }
    if (skin > inBand * 0.3 && bandWidth < maxWidth * 0.36) usable = false;
  }

  const sample = (x0: number, x1: number, y0: number, y1: number, needMask: boolean) => {
    const ch: number[][] = [[], [], []];
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(H, y1); y += 2) {
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x1); x += 2) {
        const i = y * W + x;
        if ((needMask && !fg[i]) || isSkin(i)) continue;
        for (let c = 0; c < 3; c++) ch[c].push(px[i * 4 + c]);
      }
    }
    return ch[0].length ? new THREE.Color(median(ch[0]) / 255, median(ch[1]) / 255, median(ch[2]) / 255) : null;
  };
  const Hs = shape.bottom - shape.top;
  const color = (
    usable ? sample(0, W, shape.top, shape.bottom, true)
    : plainBackdrop && area > N * 0.04 ? sample(shape.cx - W * 0.15, shape.cx + W * 0.15, shape.top + Hs * 0.35, shape.top + Hs * 0.6, true)
    : sample(W * 0.35, W * 0.65, H * 0.4, H * 0.7, false)
  ) ?? new THREE.Color('#8a8580');

  if (!usable) {
    fg.fill(1);
    shape = measure(fg, W, H);
  }
  // Cut-out texture. Transparent pixels take the garment's colour so mipmaps don't pull a
  // fringe of background colour into the edges.
  for (let i = 0; i < N; i++) {
    if (fg[i]) {
      px[i * 4 + 3] = 255;
    } else {
      px[i * 4] = color.r * 255;
      px[i * 4 + 1] = color.g * 255;
      px[i * 4 + 2] = color.b * 255;
      px[i * 4 + 3] = 0;
    }
  }
  ctx.putImageData(image, 0, 0);

  return { canvas, W, H, mask: fg, ...shape, usable, color: `#${color.getHexString()}` };
}

/** Row extents, vertical span and centre column of a mask. */
function measure(fg: Uint8Array, W: number, H: number) {
  const L = new Float32Array(H).fill(NaN);
  const R = new Float32Array(H).fill(NaN);
  let top = -1;
  let bottom = -1;
  let sx = 0;
  let n = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!fg[y * W + x]) continue;
      if (Number.isNaN(L[y])) L[y] = x;
      R[y] = x + 1;
      sx += x;
      n++;
    }
    if (!Number.isNaN(L[y])) {
      if (top < 0) top = y;
      bottom = y;
    }
  }
  if (top < 0) {
    top = 0;
    bottom = H - 1;
  }
  return { L, R, top, bottom, cx: n ? sx / n : W / 2 };
}

/** Flat-lay outlines (400 x 640) for the plain stand-in garment. */
const OUTLINES: Record<GarmentKind, (c: CanvasRenderingContext2D) => void> = {
  dress: (c) => {
    c.moveTo(140, 10); c.lineTo(165, 10); c.quadraticCurveTo(200, 70, 235, 10); c.lineTo(260, 10);
    c.quadraticCurveTo(255, 80, 292, 110); c.lineTo(270, 250); c.quadraticCurveTo(300, 420, 340, 620);
    c.quadraticCurveTo(200, 640, 60, 620); c.quadraticCurveTo(100, 420, 130, 250); c.lineTo(108, 110);
    c.quadraticCurveTo(145, 80, 140, 10);
  },
  top: (c) => {
    c.moveTo(170, 15); c.quadraticCurveTo(200, 50, 230, 15); c.lineTo(290, 25); c.lineTo(360, 90);
    c.lineTo(335, 150); c.lineTo(292, 130); c.lineTo(292, 440); c.quadraticCurveTo(200, 452, 108, 440);
    c.lineTo(108, 130); c.lineTo(65, 150); c.lineTo(40, 90); c.lineTo(110, 25);
  },
  outer: (c) => {
    c.moveTo(165, 10); c.lineTo(200, 120); c.lineTo(235, 10); c.lineTo(288, 22); c.lineTo(338, 70);
    c.lineTo(362, 495); c.lineTo(312, 500); c.lineTo(294, 150); c.lineTo(288, 520); c.lineTo(112, 520);
    c.lineTo(106, 150); c.lineTo(88, 500); c.lineTo(38, 495); c.lineTo(62, 70); c.lineTo(112, 22);
  },
  pants: (c) => {
    c.moveTo(115, 0); c.lineTo(285, 0); c.lineTo(300, 160); c.lineTo(290, 640); c.lineTo(238, 640);
    c.lineTo(203, 235); c.lineTo(197, 235); c.lineTo(162, 640); c.lineTo(110, 640); c.lineTo(100, 160);
  },
  skirt: (c) => {
    c.moveTo(130, 0); c.lineTo(270, 0); c.lineTo(330, 420); c.quadraticCurveTo(200, 440, 70, 420);
  },
};

/** A plain garment of the given kind and colour, with soft folds, standing in for a photo. */
export function plainGarment(kind: GarmentKind, color: string): GarmentImage {
  const W = 400;
  const H = 640;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = color;
  ctx.beginPath();
  OUTLINES[kind](ctx);
  ctx.closePath();
  ctx.fill();
  if (kind === 'outer') {
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, 120);
    ctx.lineTo(200, 520);
    ctx.stroke();
  }
  const image = ctx.getImageData(0, 0, W, H);
  const px = image.data;
  const fg = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    if (px[i * 4 + 3] < 128) continue;
    fg[i] = 1;
    const x = i % W;
    const y = (i / W) | 0;
    const shade = 1 + 0.05 * Math.sin(x / 23 + y / 140) + 0.03 * Math.sin(x / 9.7) - 0.06 * (y / H) + (Math.random() - 0.5) * 0.03;
    for (let c = 0; c < 3; c++) px[i * 4 + c] = Math.min(255, px[i * 4 + c] * shade);
    px[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return { canvas, W, H, mask: fg, ...measure(fg, W, H), usable: true, color };
}

// ---------------------------------------------------------------------------------------------
// Fitting
// ---------------------------------------------------------------------------------------------

/** What a worn garment occupies, so the next layer goes over it. */
export interface LayerRecord {
  at(y: number): Ring | null;
}

export interface BuiltGarment {
  group: THREE.Group;
  record: LayerRecord;
  dispose(): void;
}

const EASE: Record<GarmentKind, number> = { top: 0.008, dress: 0.008, outer: 0.022, pants: 0.006, skirt: 0.008 };
const LAYER_GAP = 0.007;

function halfEllipse(a: number, b: number) {
  const h = ((a - b) / (a + b)) ** 2;
  return (Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)))) / 2;
}
const perimeter = (r: Ring) => halfEllipse(r.a, r.bf) + halfEllipse(r.a, r.bb);
const grow = (r: Ring, e: number): Ring => ({ a: r.a + e, bf: r.bf + e, bb: r.bb + e });

/** The base ring grown evenly until its perimeter is P (never shrunk). */
function fitRing(base: Ring, P: number): Ring {
  let e = 0;
  for (let k = 0; k < 5; k++) e += (P - perimeter(grow(base, e))) / (2 * Math.PI);
  return grow(base, Math.max(0, e));
}

const maxRing = (a: Ring, b: Ring): Ring => ({ a: Math.max(a.a, b.a), bf: Math.max(a.bf, b.bf), bb: Math.max(a.bb, b.bb) });

/** Median filter over valid rows, then fill gaps from the nearest valid row. */
function smoothRows(values: Float32Array, top: number, bottom: number, radius = 3) {
  const out = new Float32Array(values.length).fill(NaN);
  for (let y = top; y <= bottom; y++) {
    const window: number[] = [];
    for (let k = -radius; k <= radius; k++) {
      const v = values[y + k];
      if (v !== undefined && !Number.isNaN(v)) window.push(v);
    }
    if (window.length) out[y] = median(window);
  }
  let last = NaN;
  for (let y = top; y <= bottom; y++) {
    if (Number.isNaN(out[y])) out[y] = last;
    else last = out[y];
  }
  last = NaN;
  for (let y = bottom; y >= top; y--) {
    if (Number.isNaN(out[y])) out[y] = last;
    else last = out[y];
  }
  // Then a short box average, so the photo doesn't shift sideways from one band to the next.
  const eased = new Float32Array(out);
  for (let y = top; y <= bottom; y++) {
    let sum = 0;
    let n = 0;
    for (let k = -4; k <= 4; k++) {
      const v = out[y + k];
      if (y + k < top || y + k > bottom || Number.isNaN(v)) continue;
      sum += v;
      n++;
    }
    if (n) eased[y] = sum / n;
  }
  return eased;
}

/** The run of garment pixels in row y containing (or nearest to) column x. */
function runAt(img: GarmentImage, y: number, x: number): [number, number] | null {
  const { W, mask } = img;
  const row = y * W;
  let cx = Math.round(THREE.MathUtils.clamp(x, 0, W - 1));
  if (!mask[row + cx]) {
    let found = -1;
    for (let d = 1; d < W; d++) {
      if (cx - d >= 0 && mask[row + cx - d]) { found = cx - d; break; }
      if (cx + d < W && mask[row + cx + d]) { found = cx + d; break; }
    }
    if (found < 0) return null;
    cx = found;
  }
  let l = cx;
  let r = cx;
  while (l > 0 && mask[row + l - 1]) l--;
  while (r < W - 1 && mask[row + r + 1]) r++;
  return [l, r + 1];
}

function textureFor(img: GarmentImage) {
  const texture = new THREE.CanvasTexture(img.canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Positions of `cols + 1` points evenly spaced by arc length along half an ellipse. */
function halfArc(a: number, b: number, from: number, cols: number, out: Float32Array) {
  const fine = 96;
  const xs = new Float32Array(fine + 1);
  const zs = new Float32Array(fine + 1);
  const len = new Float32Array(fine + 1);
  for (let k = 0; k <= fine; k++) {
    const th = from + (Math.PI * k) / fine;
    xs[k] = a * Math.cos(th);
    zs[k] = b * Math.sin(th);
    if (k) len[k] = len[k - 1] + Math.hypot(xs[k] - xs[k - 1], zs[k] - zs[k - 1]);
  }
  let k = 0;
  for (let i = 0; i <= cols; i++) {
    const target = (len[fine] * i) / cols;
    while (k < fine - 1 && len[k + 1] < target) k++;
    const t = (target - len[k]) / Math.max(1e-9, len[k + 1] - len[k]);
    out[i * 2] = xs[k] + (xs[k + 1] - xs[k]) * t;
    out[i * 2 + 1] = zs[k] + (zs[k + 1] - zs[k]) * t;
  }
}

/**
 * A garment band from yTop down to yBot: rings around the body, front half and back half
 * each carrying the photo row from its right edge to its left (so both views read the right way).
 */
function ringSection(o: {
  img: GarmentImage;
  yTop: number;
  yBot: number;
  rowOf: (y: number) => number;
  L: Float32Array;
  R: Float32Array;
  base: (y: number) => Ring;
  widthOf: (row: number) => number; // metres of flat garment
  ease: number;
  fitAbove: number;
  drapeBelow: number | null;
}) {
  const rows = Math.max(8, Math.ceil((o.yTop - o.yBot) / 0.006));
  const cols = 64;
  const ys: number[] = [];
  const fits: number[] = [];
  const excess: number[] = [];
  const bases: Ring[] = [];
  let hang = 0;
  for (let j = 0; j <= rows; j++) {
    const y = o.yTop - ((o.yTop - o.yBot) * j) / rows;
    const base = o.base(y);
    const fitted = perimeter(grow(base, o.ease));
    let P = y > o.fitAbove ? fitted : Math.max(fitted, 2 * o.widthOf(o.rowOf(y)));
    if (o.drapeBelow !== null && y < o.drapeBelow) {
      P = Math.max(P, hang);
      hang = P;
    }
    ys.push(y);
    bases.push(base);
    fits.push(fitted);
    excess.push(Math.min(P, fitted * 2.6) - fitted);
  }
  // Soften how far the garment stands off the body row to row (the body's own shape stays crisp).
  const rings = excess.map((_, j) => {
    let sum = 0;
    let n = 0;
    for (let k = -8; k <= 8; k++) {
      const v = excess[j + k];
      if (v === undefined) continue;
      sum += v;
      n++;
    }
    return fitRing(bases[j], fits[j] + sum / n);
  });

  const count = 2 * (rows + 1) * (cols + 1);
  const pos = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const arc = new Float32Array((cols + 1) * 2);
  const { W, H } = o.img;
  for (let half = 0; half < 2; half++) {
    for (let j = 0; j <= rows; j++) {
      const ring = rings[j];
      halfArc(ring.a, half ? ring.bb : ring.bf, half ? Math.PI : 0, cols, arc);
      const r = THREE.MathUtils.clamp(Math.round(o.rowOf(ys[j])), 0, H - 1);
      const L = o.L[r];
      const R = o.R[r];
      for (let i = 0; i <= cols; i++) {
        const k = (half * (rows + 1) + j) * (cols + 1) + i;
        pos[k * 3] = arc[i * 2];
        pos[k * 3 + 1] = ys[j];
        pos[k * 3 + 2] = arc[i * 2 + 1];
        const x = Number.isNaN(L) ? -1 : R - ((R - L) * i) / cols;
        uv[k * 2] = x / W;
        uv[k * 2 + 1] = 1 - (r + 0.5) / H;
      }
    }
  }
  const index: number[] = [];
  for (let half = 0; half < 2; half++) {
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const p = (half * (rows + 1) + j) * (cols + 1) + i;
        const q = p + cols + 1;
        index.push(p, p + 1, q, p + 1, q + 1, q);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  // The two halves meet at both sides: share their normals so the seams don't show.
  const normal = geometry.getAttribute('normal') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let j = 0; j <= rows; j++) {
    const front = j * (cols + 1);
    const back = (rows + 1 + j) * (cols + 1);
    for (const [p, q] of [[front, back + cols], [front + cols, back]]) {
      v.set(normal.getX(p) + normal.getX(q), normal.getY(p) + normal.getY(q), normal.getZ(p) + normal.getZ(q)).normalize();
      normal.setXYZ(p, v.x, v.y, v.z);
      normal.setXYZ(q, v.x, v.y, v.z);
    }
  }

  const at = (y: number): Ring | null => {
    if (y > o.yTop || y < o.yBot) return null;
    const t = ((o.yTop - y) / (o.yTop - o.yBot)) * rows;
    const j = Math.min(rows - 1, Math.floor(t));
    const f = t - j;
    const a = rings[j];
    const b = rings[j + 1];
    return { a: a.a + (b.a - a.a) * f, bf: a.bf + (b.bf - a.bf) * f, bb: a.bb + (b.bb - a.bb) * f };
  };
  return { geometry, at };
}

/** Mirrored repeat of x over [0, w]. */
function tri(x: number, w: number) {
  const m = ((x % (2 * w)) + 2 * w) % (2 * w);
  return m > w ? 2 * w - m : m;
}

interface Patch { x0: number; x1: number; y0: number; y1: number }

/** The calmest stretch of the torso (fewest buttons, pockets, prints) to dress the sleeves in. */
function plainestPatch(img: GarmentImage, cx: number, torsoHalf: number, rowAt: (f: number) => number): Patch {
  const ctx = img.canvas.getContext('2d', { willReadFrequently: true })!;
  const px = ctx.getImageData(0, 0, img.W, img.H).data;
  const w = torsoHalf * 0.24;
  const h = rowAt(0.25) - rowAt(0);
  let best: Patch = { x0: cx - torsoHalf * 0.38, x1: cx - torsoHalf * 0.14, y0: rowAt(0.55), y1: rowAt(0.8) };
  let bestScore = Infinity;
  for (let fx = -0.85; fx <= 0.85 - 0.24; fx += 0.08) {
    for (let fy = 0.3; fy <= 0.7; fy += 0.05) {
      const x0 = Math.round(cx + fx * torsoHalf);
      const y0 = rowAt(fy);
      let n = 0, sum = 0, sq = 0, holes = 0;
      for (let y = y0; y < y0 + h; y += 3) {
        for (let x = x0; x < x0 + w; x += 3) {
          const i = y * img.W + x;
          if (!img.mask[i]) { holes++; continue; }
          const l = px[i * 4] * 0.3 + px[i * 4 + 1] * 0.59 + px[i * 4 + 2] * 0.11;
          sum += l;
          sq += l * l;
          n++;
        }
      }
      if (!n || holes > n * 0.02) continue;
      const score = sq / n - (sum / n) ** 2;
      if (score < bestScore) {
        bestScore = score;
        best = { x0, x1: x0 + w, y0, y1: y0 + h };
      }
    }
  }
  return best;
}

/** A sleeve swept along the arm, wearing a plain patch of the garment's own fabric. */
function sleeveGeometry(body: BodySpec, side: number, length: number, ease: number, patch: Patch, img: GarmentImage, s: number) {
  const m = (p: THREE.Vector3) => new THREE.Vector3(p.x * side, p.y, p.z);
  const { shoulder, elbow, wrist, radius } = body.arm;
  const R0 = radius(0) + ease;
  const sh = m(shoulder);
  const el = m(elbow);
  const wr = m(wrist);
  const capStart = sh.clone().add(sh.clone().sub(el).normalize().multiplyScalar(R0));
  const curve = new THREE.CatmullRomCurve3([capStart, sh, el, wr], false, 'centripetal');
  const total = curve.getLength();
  const steps = 40;
  const sides = 28;
  const span = Math.min(total, R0 + length);
  const pos: number[] = [];
  const uv: number[] = [];
  const zRef = new THREE.Vector3(0, 0, 1);
  const pw = patch.x1 - patch.x0;
  const ph = patch.y1 - patch.y0;
  for (let k = 0; k <= steps; k++) {
    const d = (span * k) / steps;
    const u = d / total;
    const p = curve.getPointAt(u);
    const t = curve.getTangentAt(u);
    const n = new THREE.Vector3().crossVectors(t, zRef).normalize();
    const b = new THREE.Vector3().crossVectors(t, n).normalize();
    let r: number;
    if (d < R0) r = R0 * Math.sqrt(Math.max(0, 1 - ((R0 - d) / R0) ** 2));
    else r = radius(d - R0) + ease + 0.01 * ((d - R0) / Math.max(0.1, length));
    for (let i = 0; i <= sides; i++) {
      const phi = (i / sides) * Math.PI * 2;
      const c = Math.cos(phi);
      const sn = Math.sin(phi);
      pos.push(p.x + r * (c * n.x + sn * b.x), p.y + r * (c * n.y + sn * b.y), p.z + r * (c * n.z + sn * b.z));
      const around = (Math.abs(phi - Math.PI) * r) / s; // pixels of fabric round the sleeve
      uv.push((patch.x0 + tri(around, pw)) / img.W, 1 - (patch.y0 + tri(d / s, ph)) / img.H);
    }
  }
  const index: number[] = [];
  for (let k = 0; k < steps; k++) {
    for (let i = 0; i < sides; i++) {
      const p = k * (sides + 1) + i;
      const q = p + sides + 1;
      index.push(p, q, p + 1, p + 1, q, q + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

/** A trouser leg: circular rings around the leg axis, photo run across the front. */
function legGeometry(o: {
  body: BodySpec;
  side: number;
  yTop: number;
  yBot: number;
  rowOf: (y: number) => number;
  L: Float32Array;
  R: Float32Array;
  s: number;
  img: GarmentImage;
  ease: number;
  inner: (y: number) => number;
}) {
  const { body, img } = o;
  const rows = Math.max(8, Math.ceil((o.yTop - o.yBot) / 0.006));
  const cols = 40;
  const legTop = body.crotchY + 0.06;
  const pos: number[] = [];
  const uv: number[] = [];
  const radii: number[] = [];
  for (let half = 0; half < 2; half++) {
    for (let j = 0; j <= rows; j++) {
      const y = o.yTop - ((o.yTop - o.yBot) * j) / rows;
      const r = THREE.MathUtils.clamp(Math.round(o.rowOf(y)), 0, img.H - 1);
      const L = o.L[r];
      const R = o.R[r];
      const flat = Number.isNaN(L) ? 0 : (R - L) * o.s;
      const minR = Math.max(body.legR(Math.min(y, legTop)), o.inner(y)) + o.ease;
      const rad = Math.max(minR, flat / Math.PI);
      if (!half) radii.push(rad);
      const k = THREE.MathUtils.clamp((legTop - y) / (legTop - 0.07), 0, 1);
      const cx = o.side * (body.hipX + 0.012 * k);
      for (let i = 0; i <= cols; i++) {
        const th = (half ? Math.PI : 0) + (Math.PI * i) / cols;
        pos.push(cx + rad * Math.cos(th), y, rad * Math.sin(th));
        const x = Number.isNaN(L) ? -1 : R - ((R - L) * i) / cols;
        uv.push(x / img.W, 1 - (r + 0.5) / img.H);
      }
    }
  }
  const index: number[] = [];
  for (let half = 0; half < 2; half++) {
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const p = (half * (rows + 1) + j) * (cols + 1) + i;
        const q = p + cols + 1;
        index.push(p, p + 1, q, p + 1, q + 1, q);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  const radiusAt = (y: number) => {
    if (y > o.yTop || y < o.yBot) return 0;
    const j = Math.round(((o.yTop - y) / (o.yTop - o.yBot)) * rows);
    return radii[THREE.MathUtils.clamp(j, 0, rows)];
  };
  return { geometry, radiusAt };
}

export function buildGarment(
  body: BodySpec,
  img: GarmentImage,
  kind: GarmentKind,
  opts: { roughness?: number; inner?: LayerRecord[] } = {},
): BuiltGarment {
  const { top, bottom, cx, W } = img;
  const Hg = Math.max(1, bottom - top);
  const inner = opts.inner ?? [];
  const ease = EASE[kind];
  const base = (y: number) => {
    let ring = body.ring(y);
    for (const layer of inner) {
      const r = layer.at(y);
      if (r) ring = maxRing(ring, grow(r, LAYER_GAP));
    }
    return ring;
  };

  // --- Torso width in the photo, and what lies outside it (sleeves) ---
  const rowAt = (f: number) => Math.round(top + f * Hg);
  let clipHalf: (row: number) => number = () => Infinity;
  let refRow = rowAt(0.03);
  let refHalf = 0;
  let sleeveRows: [number, number] | null = null;
  let torsoHalf = 0;
  if (kind === 'top' || kind === 'outer') {
    const halves: number[] = [];
    for (let f = 0.84; f <= 0.94; f += 0.02) {
      const run = runAt(img, rowAt(f), cx);
      if (run) halves.push((run[1] - run[0]) / 2);
    }
    torsoHalf = median(halves) || W / 4;
    // Sleeves laid down the sides touch the hem, so the hem spans (nearly) the whole photo:
    // a flat-lay body is then about 60% of the full width.
    let minL = Infinity;
    let maxR = -Infinity;
    for (let row = top; row <= bottom; row++) {
      if (Number.isNaN(img.L[row])) continue;
      minL = Math.min(minL, img.L[row]);
      maxR = Math.max(maxR, img.R[row]);
    }
    if (2 * torsoHalf > 0.85 * (maxR - minL)) torsoHalf = 0.31 * (maxR - minL);
    refRow = rowAt(0.9);
    refHalf = torsoHalf;
    clipHalf = (row) => torsoHalf * (row < rowAt(0.3) ? 1.08 : 1.03);
    sleeveRows = [top, bottom];
  } else if (kind === 'dress') {
    let best = Infinity;
    for (let f = 0.15; f <= 0.55; f += 0.01) {
      const row = rowAt(f);
      if (!img.mask[row * W + Math.round(cx)]) continue;
      const run = runAt(img, row, cx);
      if (run && run[1] - run[0] < best) {
        best = run[1] - run[0];
        refRow = row;
      }
    }
    refHalf = Number.isFinite(best) ? best / 2 : W / 6;
    torsoHalf = refHalf;
    const waistRow = refRow;
    clipHalf = (row) => (row <= waistRow ? refHalf * 1.4 : Infinity);
    sleeveRows = [top, waistRow];
  } else {
    const halves: number[] = [];
    for (let f = 0.01; f <= 0.06; f += 0.01) {
      const r = rowAt(f);
      if (!Number.isNaN(img.L[r])) halves.push((img.R[r] - img.L[r]) / 2);
    }
    refHalf = median(halves) || W / 4;
  }
  const clippedL = new Float32Array(img.H).fill(NaN);
  const clippedR = new Float32Array(img.H).fill(NaN);
  for (let row = top; row <= bottom; row++) {
    if (Number.isNaN(img.L[row])) continue;
    const h = clipHalf(row);
    clippedL[row] = Math.max(img.L[row], cx - h);
    clippedR[row] = Math.min(img.R[row], cx + h);
  }
  const L = smoothRows(clippedL, top, bottom);
  const R = smoothRows(clippedR, top, bottom);

  // --- Where it sits on the body ---
  // Spaghetti straps: the first rows are two thin strips with nothing at the centre.
  let straps = false;
  if (kind === 'dress' || kind === 'top') {
    let thin = 0;
    const rows = Math.max(3, Math.round(Hg * 0.05));
    for (let row = top; row < top + rows; row++) {
      let filled = 0;
      for (let x = 0; x < W; x++) filled += img.mask[row * W + x];
      if (!img.mask[row * W + Math.round(cx)] && filled < 0.3 * 2 * torsoHalf) thin++;
    }
    straps = thin > rows * 0.7;
  }
  const anchorY =
    kind === 'pants' ? body.waistY - 0.03
    : kind === 'skirt' ? body.waistY + 0.005
    : straps ? body.shoulderY + 0.035
    : body.neckY - 0.012;

  // Scale (metres per pixel): the reference row's flat width is half the circumference of the
  // body where that row is worn (plus ease): a dress's narrowest row at the waist, a top's hem
  // at the hip, a waistband at the waist.
  const yRef = kind === 'dress' ? body.waistY : kind === 'top' || kind === 'outer' ? body.crotchY + 0.09 : anchorY;
  let s = perimeter(grow(base(yRef), ease)) / 2 / (2 * Math.max(1, refHalf));
  s = Math.min(s, (anchorY - 0.015) / Hg);
  const rowOf = (y: number) => top + (anchorY - y) / s;
  const yOf = (row: number) => anchorY - (row - top) * s;
  // A curved hem leaves its last rows only partly filled; end the garment where rows are full
  // (trousers are two legs, so their rows are never full).
  let hemRow = bottom;
  if (kind !== 'pants') {
    while (hemRow > top + Hg * 0.6) {
      const l = Math.round(L[hemRow]);
      const r = Math.round(R[hemRow]);
      let filled = 0;
      for (let x = l; x < r; x++) filled += img.mask[hemRow * W + x];
      if (r > l && filled >= (r - l) * 0.9) break;
      hemRow--;
    }
  }
  const yBottom = Math.max(0.015, yOf(hemRow));
  const widthOf = (row: number) => {
    const r = THREE.MathUtils.clamp(Math.round(row), top, bottom);
    return Number.isNaN(L[r]) ? 0 : (R[r] - L[r]) * s;
  };

  const texture = textureFor(img);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: opts.roughness ?? 0.82,
    metalness: 0,
    side: THREE.DoubleSide,
    alphaTest: 0.45,
  });
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: texture, alphaTest: 0.45 });
  const group = new THREE.Group();
  const add = (geometry: THREE.BufferGeometry) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.customDepthMaterial = depth;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  };

  let record: LayerRecord;
  if (kind === 'pants') {
    // Crotch: first row (below the seat) where the centre column is empty between two legs.
    let crotchRow = -1;
    for (let row = rowAt(0.2); row <= bottom; row++) {
      const c = Math.round(cx);
      const gap = !img.mask[row * W + c] && !img.mask[row * W + c - 2] && !img.mask[row * W + c + 2];
      if (gap && img.L[row] < cx && img.R[row] > cx) {
        crotchRow = row;
        break;
      }
    }
    if (crotchRow < 0) crotchRow = bottom; // no leg split: wear it like a skirt
    const overlap = 0.03;
    const yCrotch = Math.max(yBottom, yOf(crotchRow));
    const hips = ringSection({
      img, yTop: anchorY, yBot: Math.max(yBottom, yCrotch - overlap), rowOf, L, R, base, widthOf, ease,
      fitAbove: Infinity, drapeBelow: null,
    });
    add(hips.geometry);

    // Each leg's run: below the crotch the outermost run on that side; above it, half the seat.
    const legRuns = (side: number) => {
      const a = new Float32Array(img.H).fill(NaN);
      const b = new Float32Array(img.H).fill(NaN);
      for (let row = top; row <= bottom; row++) {
        if (Number.isNaN(img.L[row])) continue;
        if (row < crotchRow) {
          a[row] = side < 0 ? img.L[row] : cx;
          b[row] = side < 0 ? cx : img.R[row];
        } else {
          const run = runAt(img, row, side < 0 ? img.L[row] : img.R[row] - 1);
          if (!run) continue;
          a[row] = run[0];
          b[row] = run[1];
        }
      }
      return [smoothRows(a, top, bottom), smoothRows(b, top, bottom)];
    };
    const legs = [-1, 1].map((side) => {
      const [la, lb] = legRuns(side);
      const leg = legGeometry({
        body, side, yTop: yCrotch + overlap, yBot: yBottom, rowOf, L: la, R: lb, s, img, ease,
        inner: (y) => {
          let r = 0;
          for (const layer of inner) {
            const ring = layer.at(y);
            if (ring && y < body.crotchY) r = Math.max(r, ring.bf);
          }
          return r;
        },
      });
      add(leg.geometry);
      return leg;
    });
    record = {
      at: (y) => {
        if (y >= yCrotch) return hips.at(y);
        const r = Math.max(legs[0].radiusAt(y), legs[1].radiusAt(y));
        return r ? { a: body.hipX + 0.012 + r, bf: r, bb: r } : null;
      },
    };
  } else {
    const section = ringSection({
      img, yTop: anchorY, yBot: yBottom, rowOf, L, R, base, widthOf, ease,
      fitAbove: kind === 'skirt' ? Infinity : body.shoulderY - 0.03,
      drapeBelow: kind === 'skirt' ? body.waistY - 0.06 : body.waistY,
    });
    add(section.geometry);
    record = { at: section.at };

    // Sleeves: how far past the torso edge the photo reaches, measured from the shoulder point.
    if (sleeveRows && kind !== 'skirt') {
      const shoulderRow = rowAt(0.1);
      const edge = clipHalf(shoulderRow) / 1.04;
      let reach = 0;
      for (let row = sleeveRows[0]; row <= sleeveRows[1]; row++) {
        if (Number.isNaN(img.L[row])) continue;
        const dy = row - shoulderRow;
        if (img.L[row] < cx - edge * 1.12) reach = Math.max(reach, Math.hypot(cx - edge - img.L[row], dy));
        if (img.R[row] > cx + edge * 1.12) reach = Math.max(reach, Math.hypot(img.R[row] - (cx + edge), dy));
      }
      const armLen = body.arm.shoulder.distanceTo(body.arm.elbow) + body.arm.elbow.distanceTo(body.arm.wrist);
      const length = Math.min(reach * s, armLen + 0.01);
      if (length > 0.06) {
        // A plain stretch of fabric beside the placket, between chest and hem.
        const patch = plainestPatch(img, cx, torsoHalf, rowAt);
        for (const side of [1, -1]) add(sleeveGeometry(body, side, length, ease + 0.004, patch, img, s));
      }
    }
  }

  return {
    group,
    record,
    dispose() {
      group.traverse((obj) => (obj as THREE.Mesh).geometry?.dispose());
      material.dispose();
      depth.dispose();
      texture.dispose();
    },
  };
}
