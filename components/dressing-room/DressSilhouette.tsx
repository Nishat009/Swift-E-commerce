'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';
import {
  RIGS, Gender, GarmentSpec, garmentShape, armSpread, torsoRing, legRadius, sleeveLength,
} from './mannequin/profile';
import { patternDataUrl } from './mannequin/fabric';

// Front-view 2D drawing of a dress on the mannequin, built from the same profiles as the 3D model.
const S = 100; // svg units per metre
const px = (x: number) => +(x * S).toFixed(2);
const py = (y: number) => +(-y * S).toFixed(2);
const path = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${px(x)} ${py(y)}`).join('L')}Z`;

function drawing(spec: GarmentSpec, gender: Gender) {
  const rig = RIGS[gender];
  const shape = garmentShape(rig, spec);
  const spread = armSpread(rig, [shape]);
  const edge = (y: number, theta: number) => shape.place(shape.sample(y), theta, 0, false)[0];

  // Mannequin
  const keys = rig.torso;
  const torso: [number, number][] = [];
  for (let y = keys[0][0]; y <= keys[keys.length - 1][0]; y += 0.01) torso.push([-(torsoRing(rig, y)?.a ?? 0), y]);
  for (let i = torso.length - 1; i >= 0; i--) torso.push([-torso[i][0], torso[i][1]]);
  const legs = [-1, 1].map((side) => {
    const pts: [number, number][] = [];
    const ankle = rig.hip.y - rig.thigh - rig.shin;
    for (let y = rig.hip.y; y >= ankle; y -= 0.02) pts.push([side * rig.hip.x - legRadius(rig, y), y]);
    for (let y = ankle; y <= rig.hip.y; y += 0.02) pts.push([side * rig.hip.x + legRadius(rig, y), y]);
    return path(pts);
  });
  const reach = rig.upperArm + rig.foreArm;
  const arms = [-1, 1].map((side) => {
    const from: [number, number] = [side * rig.shoulder.x, rig.shoulder.y];
    const dir: [number, number] = [side * Math.sin(spread), -Math.cos(spread)];
    const at = (d: number): [number, number] => [from[0] + dir[0] * d, from[1] + dir[1] * d];
    return { from, at, elbow: at(rig.upperArm), wrist: at(reach), hand: at(reach + rig.hand[1] * 0.8) };
  });

  // Dress outline: up the left side, across the neckline, down the right side.
  const outline: [number, number][] = [];
  const topLeft = shape.topY(Math.PI);
  for (let y = shape.hem; y < topLeft; y += 0.01) outline.push([edge(y, Math.PI), y]);
  for (let k = 0; k <= 60; k++) {
    const theta = Math.PI - (k / 60) * Math.PI;
    const y = shape.topY(theta);
    outline.push([edge(y, theta), y]);
  }
  const topRight = shape.topY(0);
  for (let y = topRight; y > shape.hem; y -= 0.01) outline.push([edge(y, 0), y]);
  outline.push([edge(shape.hem, 0), shape.hem]);

  const trim = spec.trim
    ? path([[edge(shape.hem, Math.PI), shape.hem], [edge(shape.hem + 0.045, Math.PI), shape.hem + 0.045], [edge(shape.hem + 0.045, 0), shape.hem + 0.045], [edge(shape.hem, 0), shape.hem]])
    : null;
  const belt = spec.belt ? { y: shape.waist, w: edge(shape.waist, 0) + 0.005 } : null;

  const sleeve = sleeveLength(rig, spec.sleeves);
  const sleeveWidth = (rig.upperArmR[0] + 0.012 + (spec.sleeves === 'puff' ? 0.03 : 0)) * 2;
  const straps = spec.sleeves === 'straps' || spec.neckline === 'halter'
    ? [-1, 1].map((side) => {
      const x = spec.neckline === 'halter' ? side * 0.045 : side * rig.strapX;
      let y = shape.topY(Math.PI / 2);
      for (let k = 0; k <= 60; k++) {
        const theta = Math.PI / 2 - (side * k * Math.PI) / 120;
        if (Math.abs(edge(shape.topY(theta), theta)) >= Math.abs(x)) { y = shape.topY(theta); break; }
      }
      const toX = spec.neckline === 'halter' ? side * 0.05 : x;
      return { x1: px(x), y1: py(y), x2: px(toX), y2: py(rig.shoulder.y + (spec.neckline === 'halter' ? 0.1 : 0.06)) };
    })
    : [];
  const leggings = spec.leggings
    ? [-1, 1].map((side) => ({ x: side * rig.hip.x, top: shape.hem + 0.02, bottom: rig.hip.y - rig.thigh - rig.shin }))
    : [];

  return { rig, torso: path(torso), legs, arms, dress: path(outline), trim, belt, sleeve, sleeveWidth, straps, leggings };
}

interface DressSilhouetteProps {
  spec: GarmentSpec;
  gender?: Gender;
  className?: string;
}

export default function DressSilhouette({ spec, gender = 'female', className }: DressSilhouetteProps) {
  const id = `ds${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [tile, setTile] = useState<string | null>(null);
  const { fabric, pattern, color, accent } = spec;

  // Pattern tiles are drawn on a canvas, which only exists in the browser.
  useEffect(() => {
    setTile(patternDataUrl({ fabric, pattern, color, accent }));
  }, [fabric, pattern, color, accent]);

  const d = useMemo(() => drawing(spec, gender), [spec, gender]);
  const fill = tile ? `url(#${id})` : spec.color;
  const skin = '#e4dcd2';
  const { rig } = d;

  return (
    <svg viewBox="-62 -186 124 190" className={className} role="img" aria-label="Dress preview">
      {tile && (
        <defs>
          <pattern id={id} patternUnits="userSpaceOnUse" width={25} height={25}>
            <image href={tile} width={25} height={25} preserveAspectRatio="none" />
          </pattern>
        </defs>
      )}
      <ellipse cx={0} cy={py(0)} rx={36} ry={3} fill="#000" opacity={0.06} />
      {d.legs.map((leg, i) => <path key={i} d={leg} fill={skin} />)}
      {d.leggings.map((l, i) => (
        <line key={i} x1={px(l.x)} y1={py(l.top)} x2={px(l.x)} y2={py(l.bottom)} stroke={spec.leggings} strokeWidth={9} strokeLinecap="round" />
      ))}
      <path d={d.torso} fill={skin} />
      <rect x={-4.6} y={py(rig.head.y - 0.05)} width={9.2} height={8} fill={skin} />
      <ellipse cx={0} cy={py(rig.head.y)} rx={rig.head.r[0] * S} ry={rig.head.r[1] * S} fill={skin} />
      {d.arms.map((arm, i) => (
        <g key={i} stroke={skin} strokeLinecap="round">
          <line x1={px(arm.from[0])} y1={py(arm.from[1])} x2={px(arm.elbow[0])} y2={py(arm.elbow[1])} strokeWidth={rig.upperArmR[0] * 2 * S} />
          <line x1={px(arm.elbow[0])} y1={py(arm.elbow[1])} x2={px(arm.wrist[0])} y2={py(arm.wrist[1])} strokeWidth={rig.foreArmR[0] * 2 * S} />
          <ellipse cx={px(arm.hand[0])} cy={py(arm.hand[1])} rx={rig.hand[2] * S * 0.7} ry={rig.hand[1] * S} fill={skin} stroke="none" />
        </g>
      ))}
      <path d={d.dress} fill={fill} stroke="rgba(0,0,0,0.18)" strokeWidth={0.5} strokeLinejoin="round" />
      {d.trim && <path d={d.trim} fill={spec.trim} />}
      {d.belt && <rect x={-px(d.belt.w)} y={py(d.belt.y + 0.022)} width={px(d.belt.w) * 2} height={4.4} rx={1} fill={spec.belt} />}
      {d.sleeve > 0 && d.arms.map((arm, i) => {
        const end = arm.at(d.sleeve);
        return (
          <line key={i} x1={px(arm.from[0])} y1={py(arm.from[1] + 0.01)} x2={px(end[0])} y2={py(end[1])}
            stroke={fill} strokeWidth={d.sleeveWidth * S} strokeLinecap="round" />
        );
      })}
      {d.straps.map((s, i) => (
        <line key={i} {...s} stroke={spec.color} strokeWidth={1.4} strokeLinecap="round" />
      ))}
    </svg>
  );
}
