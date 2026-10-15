import * as THREE from 'three';
import type { Fabric, Pattern } from './profile';

// Every pattern tile covers 0.25 m of fabric (see the uv mapping in build.ts).
const SIZE = 512;

export interface FabricLook {
  fabric: Fabric;
  pattern: Pattern;
  color: string;
  accent?: string;
}

function rgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('');
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [128, 128, 128];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Blend two hex colours, returning a CSS rgb() string. */
export function mix(a: string, b: string, t: number): string {
  const pa = rgb(a);
  const pb = rgb(b);
  const ch = (i: number) => Math.round(pa[i] + (pb[i] - pa[i]) * t);
  return `rgb(${ch(0)},${ch(1)},${ch(2)})`;
}

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draw a motif at (x, y) and at its wrapped copies so the tile repeats seamlessly. */
function wrapped(x: number, y: number, draw: (x: number, y: number) => void) {
  for (const dx of [-SIZE, 0, SIZE]) for (const dy of [-SIZE, 0, SIZE]) draw(x + dx, y + dy);
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}

function drawFloral(ctx: CanvasRenderingContext2D, base: string, accent: string) {
  const rnd = seeded(11);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const leaf = mix('#4f7d57', base, 0.25);
  for (let k = 0; k < 70; k++) {
    ctx.fillStyle = mix(accent, base, 0.55);
    const x = rnd() * SIZE;
    const y = rnd() * SIZE;
    wrapped(x, y, (cx, cy) => ellipse(ctx, cx, cy, 3, 3, 0));
  }
  for (let k = 0; k < 14; k++) {
    const x = rnd() * SIZE;
    const y = rnd() * SIZE;
    const r = 26 + rnd() * 20;
    const rot = rnd() * Math.PI;
    const petal = mix(accent, '#ffffff', rnd() * 0.35);
    wrapped(x, y, (cx, cy) => {
      ctx.fillStyle = leaf;
      for (const off of [0.6, 2.4]) {
        const a = rot + off;
        ellipse(ctx, cx + Math.cos(a) * r * 1.05, cy + Math.sin(a) * r * 1.05, r * 0.8, r * 0.3, a);
      }
      ctx.fillStyle = petal;
      for (let p = 0; p < 5; p++) {
        const a = rot + (p * Math.PI * 2) / 5;
        ellipse(ctx, cx + Math.cos(a) * r * 0.52, cy + Math.sin(a) * r * 0.52, r * 0.52, r * 0.36, a);
      }
      ctx.fillStyle = mix(accent, '#000000', 0.35);
      ellipse(ctx, cx, cy, r * 0.24, r * 0.24, 0);
      ctx.fillStyle = '#f6d365';
      ellipse(ctx, cx, cy, r * 0.11, r * 0.11, 0);
    });
  }
}

function drawPolka(ctx: CanvasRenderingContext2D, base: string, accent: string) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = accent;
  const step = 64;
  for (let row = 0; row < SIZE / step; row++) {
    for (let col = 0; col < SIZE / step; col++) {
      const x = col * step + (row % 2 ? step / 2 : 0);
      wrapped(x, row * step + step / 2, (cx, cy) => ellipse(ctx, cx, cy, 12, 12, 0));
    }
  }
}

function drawStripes(ctx: CanvasRenderingContext2D, base: string, accent: string) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SIZE, SIZE);
  for (let x = 0; x < SIZE; x += 128) {
    ctx.fillStyle = accent;
    ctx.fillRect(x, 0, 44, SIZE);
    ctx.fillStyle = mix(accent, base, 0.5);
    ctx.fillRect(x + 80, 0, 8, SIZE);
  }
}

function drawGingham(ctx: CanvasRenderingContext2D, base: string, accent: string) {
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = base;
  for (let p = 0; p < SIZE; p += 64) {
    ctx.fillRect(0, p, SIZE, 32);
    ctx.fillRect(p, 0, 32, SIZE);
  }
  ctx.globalAlpha = 1;
}

function teardrop(ctx: CanvasRenderingContext2D, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.bezierCurveTo(-34, 30, -30, -12, 0, -16);
  ctx.bezierCurveTo(22, -18, 28, -36, 10, -46);
  ctx.bezierCurveTo(44, -36, 38, 26, 0, 40);
  ctx.fill();
}

function drawPaisley(ctx: CanvasRenderingContext2D, base: string, accent: string) {
  const rnd = seeded(23);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SIZE, SIZE);
  for (let k = 0; k < 12; k++) {
    const x = rnd() * SIZE;
    const y = rnd() * SIZE;
    const s = 0.8 + rnd() * 0.5;
    const rot = rnd() * Math.PI * 2;
    wrapped(x, y, (cx, cy) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.scale(s, s);
      teardrop(ctx, accent);
      ctx.scale(0.62, 0.62);
      teardrop(ctx, base);
      ctx.scale(0.55, 0.55);
      teardrop(ctx, mix(accent, '#ffffff', 0.25));
      ctx.restore();
      ctx.fillStyle = accent;
      for (let d = 0; d < 8; d++) {
        const a = (d / 8) * Math.PI * 2;
        ellipse(ctx, cx + Math.cos(a) * 52 * s, cy + Math.sin(a) * 52 * s, 2.5, 2.5, 0);
      }
    });
  }
}

function drawLeaf(ctx: CanvasRenderingContext2D, base: string, accent: string) {
  const rnd = seeded(5);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SIZE, SIZE);
  for (let k = 0; k < 16; k++) {
    const x = rnd() * SIZE;
    const y = rnd() * SIZE;
    const r = 34 + rnd() * 26;
    const rot = rnd() * Math.PI;
    const fill = mix(accent, base, rnd() * 0.4);
    wrapped(x, y, (cx, cy) => {
      ctx.fillStyle = fill;
      ellipse(ctx, cx, cy, r, r * 0.36, rot);
      ctx.strokeStyle = mix(fill, '#ffffff', 0.35);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(rot) * r, cy - Math.sin(rot) * r);
      ctx.lineTo(cx + Math.cos(rot) * r, cy + Math.sin(rot) * r);
      ctx.stroke();
    });
  }
}

function drawSequins(ctx: CanvasRenderingContext2D, base: string) {
  const rnd = seeded(3);
  ctx.fillStyle = mix(base, '#000000', 0.3);
  ctx.fillRect(0, 0, SIZE, SIZE);
  const step = 16;
  for (let row = 0; row < SIZE / step; row++) {
    for (let col = 0; col < SIZE / step; col++) {
      const x = col * step + (row % 2 ? step / 2 : 0);
      const y = row * step + step / 2;
      const tone = rnd();
      ctx.fillStyle = mix(base, tone > 0.5 ? '#ffffff' : '#000000', Math.abs(tone - 0.5) * 0.7);
      wrapped(x, y, (cx, cy) => ellipse(ctx, cx, cy, 7, 7, 0));
    }
  }
}

const canvasCache = new Map<string, HTMLCanvasElement>();
const urlCache = new Map<string, string>();

/** Pattern tile for a fabric look, or null when it is a plain colour. */
export function patternCanvas(look: FabricLook): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (look.pattern === 'solid' && look.fabric !== 'sequin') return null;
  const accent = look.accent || '#ffffff';
  const key = `${look.fabric === 'sequin' ? 'sequin' : look.pattern}|${look.color}|${accent}`;
  const cached = canvasCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  if (look.fabric === 'sequin') drawSequins(ctx, look.color);
  else if (look.pattern === 'floral') drawFloral(ctx, look.color, accent);
  else if (look.pattern === 'polka') drawPolka(ctx, look.color, accent);
  else if (look.pattern === 'stripes') drawStripes(ctx, look.color, accent);
  else if (look.pattern === 'gingham') drawGingham(ctx, look.color, accent);
  else if (look.pattern === 'paisley') drawPaisley(ctx, look.color, accent);
  else drawLeaf(ctx, look.color, accent);
  canvasCache.set(key, canvas);
  return canvas;
}

/** Same tile as a small data URL for the 2D silhouettes. */
export function patternDataUrl(look: FabricLook): string | null {
  const canvas = patternCanvas(look);
  if (!canvas) return null;
  const key = `${look.fabric}|${look.pattern}|${look.color}|${look.accent}`;
  let url = urlCache.get(key);
  if (!url) {
    const small = document.createElement('canvas');
    small.width = 128;
    small.height = 128;
    small.getContext('2d')?.drawImage(canvas, 0, 0, 128, 128);
    url = small.toDataURL('image/png');
    urlCache.set(key, url);
  }
  return url;
}

const FABRICS: Record<Fabric, THREE.MeshPhysicalMaterialParameters> = {
  cotton: { roughness: 0.88, sheen: 0.35, sheenRoughness: 0.8 },
  linen: { roughness: 0.92, sheen: 0.25, sheenRoughness: 0.9 },
  knit: { roughness: 0.95, sheen: 0.4, sheenRoughness: 0.7 },
  denim: { roughness: 0.9, sheen: 0.15, sheenRoughness: 0.9 },
  wool: { roughness: 0.95, sheen: 0.5, sheenRoughness: 0.9 },
  satin: { roughness: 0.3, clearcoat: 0.35, clearcoatRoughness: 0.35, sheen: 0.4, sheenRoughness: 0.3 },
  silk: { roughness: 0.52, sheen: 0.6, sheenRoughness: 0.4, envMapIntensity: 0.7 },
  velvet: { roughness: 0.82, sheen: 1, sheenRoughness: 0.45 },
  chiffon: { roughness: 0.6, sheen: 0.6, sheenRoughness: 0.5 },
  sequin: { roughness: 0.25, metalness: 0.7, envMapIntensity: 1.4 },
  leather: { roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.5 },
};

export function fabricMaterial(look: FabricLook): THREE.MeshPhysicalMaterial {
  const canvas = patternCanvas(look);
  const material = new THREE.MeshPhysicalMaterial({
    ...FABRICS[look.fabric],
    color: canvas ? '#ffffff' : look.color,
    sheenColor: new THREE.Color(mix(look.color, '#ffffff', 0.5)),
    side: THREE.DoubleSide,
    shadowSide: THREE.BackSide, // avoids self-shadow acne on the lit side of the cloth
  });
  if (canvas) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    material.map = texture;
  }
  return material;
}

export function metalMaterial(color: string): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({ color, metalness: 0.85, roughness: 0.28, side: THREE.DoubleSide });
}
