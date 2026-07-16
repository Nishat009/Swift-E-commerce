import React from 'react';
import { BodyType, GenderType, HairStyleType } from '@/types/dressingRoom';

// --- BASE SKIN TONES ---
export const SKIN_TONES = [
  { name: 'Porcelain', value: '#fff5eb' },
  { name: 'Warm Beige', value: '#ffd1b3' },
  { name: 'Sand', value: '#e0a96d' },
  { name: 'Honey', value: '#c68d5f' },
  { name: 'Terracotta', value: '#a05c3d' },
  { name: 'Espresso', value: '#5c3818' },
];

// --- HAIR COLORS ---
export const HAIR_COLORS = [
  { name: 'Platinum Blonde', value: '#e8cfa1' },
  { name: 'Chestnut Brown', value: '#4a3728' },
  { name: 'Obsidian Black', value: '#1a1a1a' },
  { name: 'Auburn Red', value: '#9c3d23' },
  { name: 'Silver Gray', value: '#b5b5b5' },
];

// --- AVATAR BASE SHAPES (FRONT VIEW) ---
// Returns custom SVG paths for torso, arms, legs, and head based on gender & body shape.
export const getBodyPaths = (gender: GenderType, bodyType: BodyType) => {
  const isMale = gender === 'male';
  
  // Custom scaling and shape adjustments
  let shoulderWidth = 40;
  let waistWidth = 25;
  let hipWidth = 28;
  let limbThickness = 12;

  if (isMale) {
    shoulderWidth = 48;
    waistWidth = 28;
    hipWidth = 30;
    limbThickness = 14;
    
    if (bodyType === 'slim') {
      shoulderWidth = 42;
      waistWidth = 24;
      hipWidth = 26;
      limbThickness = 11;
    } else if (bodyType === 'athletic') {
      shoulderWidth = 54;
      waistWidth = 26;
      hipWidth = 28;
      limbThickness = 16;
    } else if (bodyType === 'plus') {
      shoulderWidth = 50;
      waistWidth = 38;
      hipWidth = 38;
      limbThickness = 18;
    }
  } else {
    // Female proportions
    shoulderWidth = 36;
    waistWidth = 20;
    hipWidth = 32;
    limbThickness = 10;

    if (bodyType === 'slim') {
      shoulderWidth = 32;
      waistWidth = 18;
      hipWidth = 28;
      limbThickness = 8.5;
    } else if (bodyType === 'athletic') {
      shoulderWidth = 38;
      waistWidth = 21;
      hipWidth = 30;
      limbThickness = 12;
    } else if (bodyType === 'plus') {
      shoulderWidth = 42;
      waistWidth = 30;
      hipWidth = 40;
      limbThickness = 15;
    }
  }

  // Base coordinates for drawing parts (assuming center line X = 150)
  const cx = 150;
  const headY = 90;
  const neckY = 125;
  const shoulderY = 145;
  const waistY = 220;
  const hipY = 260;
  const feetY = 460;

  return {
    cx, headY, neckY, shoulderY, waistY, hipY, feetY,
    shoulderWidth, waistWidth, hipWidth, limbThickness
  };
};

// --- VECTOR HAIR STYLES ---
interface HairProps {
  color: string;
  gender: GenderType;
  style: HairStyleType;
}

export const HairComponent: React.FC<HairProps> = ({ color, gender, style }) => {
  if (style === 'bald') return null;

  return (
    <g id="avatar-hair" fill={color} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      {style === 'short' && (
        <>
          {/* Cap outline */}
          <path d="M 130 85 C 130 55, 170 55, 170 85 C 172 87, 168 95, 164 92 C 160 88, 150 90, 145 92 C 138 95, 132 90, 130 85 Z" />
          {/* Sideburns / Fringe detail */}
          <path d="M 130 83 L 132 94 L 136 90 Z" />
          <path d="M 170 83 L 168 94 L 164 90 Z" />
          {/* Top spikes */}
          <path d="M 140 62 L 146 56 L 152 62 L 158 56 L 164 63" fill="none" strokeWidth="2" />
        </>
      )}

      {style === 'long' && (
        <>
          {/* Long strands behind shoulders */}
          <path d="M 124 95 C 114 110, 114 170, 116 195 C 118 198, 126 198, 128 190 C 124 160, 128 120, 134 95 Z" opacity="0.9" />
          <path d="M 176 95 C 186 110, 186 170, 184 195 C 182 198, 174 198, 172 190 C 176 160, 172 120, 166 95 Z" opacity="0.9" />
          {/* Front scalp & bangs */}
          <path d="M 128 85 C 128 50, 172 50, 172 85 C 172 90, 165 92, 160 88 C 150 82, 140 92, 128 85 Z" />
          <path d="M 128 83 Q 148 70 152 86" fill="none" strokeWidth="1.5" />
        </>
      )}

      {style === 'curly' && (
        <>
          {/* Fluffy loops */}
          <circle cx="150" cy="60" r="22" />
          <circle cx="136" cy="68" r="16" />
          <circle cx="164" cy="68" r="16" />
          <circle cx="128" cy="80" r="12" />
          <circle cx="172" cy="80" r="12" />
          {/* Details */}
          <path d="M 132 80 C 132 75, 138 75, 142 82 M 158 82 C 162 75, 168 75, 168 80" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.4" />
        </>
      )}

      {style === 'wavy' && (
        <>
          {/* Wavy bob */}
          <path d="M 126 85 C 126 52, 174 52, 174 85 C 174 110, 170 125, 174 135 C 171 138, 166 138, 164 128 C 166 100, 162 90, 150 90 C 138 90, 134 100, 136 128 C 134 138, 129 138, 126 135 C 130 125, 126 110, 126 85 Z" />
          {/* Waves detailing */}
          <path d="M 134 78 Q 142 66 150 82 Q 158 66 166 78" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.3" />
        </>
      )}
    </g>
  );
};

// --- FACE BUILDER ---
interface FaceProps {
  gender: GenderType;
  eyeColor: string;
  browStyle: 'normal' | 'thick' | 'thin';
  mouthExpression: 'smile' | 'neutral' | 'open';
}

export const FaceComponent: React.FC<FaceProps> = ({ eyeColor, browStyle, mouthExpression }) => {
  return (
    <g id="avatar-face">
      {/* Brows */}
      <g stroke="#261b13" strokeLinecap="round" fill="none" strokeWidth={browStyle === 'thick' ? '2.5' : browStyle === 'thin' ? '1' : '1.8'}>
        <path d="M 138 80 Q 143 77 148 80" /> {/* Left Brow */}
        <path d="M 162 80 Q 157 77 152 80" /> {/* Right Brow */}
      </g>

      {/* Eyes */}
      <g>
        {/* Sclera */}
        <ellipse cx="143" cy="85" rx="5" ry="3" fill="#ffffff" stroke="#261b13" strokeWidth="0.5" />
        <ellipse cx="157" cy="85" rx="5" ry="3" fill="#ffffff" stroke="#261b13" strokeWidth="0.5" />
        {/* Iris */}
        <circle cx="143" cy="85" r="2.5" fill={eyeColor} />
        <circle cx="157" cy="85" r="2.5" fill={eyeColor} />
        {/* Pupil */}
        <circle cx="143" cy="85" r="1.2" fill="#000000" />
        <circle cx="157" cy="85" r="1.2" fill="#000000" />
        {/* Reflection */}
        <circle cx="144" cy="84" r="0.6" fill="#ffffff" />
        <circle cx="158" cy="84" r="0.6" fill="#ffffff" />
      </g>

      {/* Nose */}
      <path d="M 150 85 L 149 93 Q 150 95 152 93" fill="none" stroke="#ba8260" strokeWidth="1.2" strokeLinecap="round" />

      {/* Mouth */}
      <g stroke="#913d33" strokeLinecap="round" fill={mouthExpression === 'open' ? '#913d33' : 'none'} strokeWidth="1.5">
        {mouthExpression === 'smile' && (
          <path d="M 144 99 Q 150 105 156 99" />
        )}
        {mouthExpression === 'neutral' && (
          <path d="M 145 101 L 155 101" />
        )}
        {mouthExpression === 'open' && (
          <path d="M 145 99 Q 150 107 155 99 Z" fill="#913d33" />
        )}
      </g>
    </g>
  );
};

interface ClothingLayerProps {
  layer: string;
  styleKey: string;
  color: string;
  gender: GenderType;
  bodyType: BodyType;
  pose?: 'default' | 'hips' | 'crossed';
}

export const ClothingLayerRenderer: React.FC<ClothingLayerProps> = ({ layer, styleKey, color, gender, bodyType, pose = 'default' }) => {
  const p = getBodyPaths(gender, bodyType);
  const sh = p.shoulderWidth;
  const w = p.waistWidth;
  const hp = p.hipWidth;
  const th = p.limbThickness;

  // Render SVG based on layer type and styling key
  switch (layer) {
    case 'top':
      if (styleKey === 'tank') {
        return (
          <g id="worn-top">
            {/* Front Vest torso contour */}
            <path
              d={`M ${150 - sh + 4} ${p.shoulderY + 12} 
                  C ${150 - sh + 8} ${p.shoulderY + 2}, ${150 - sh/2} ${p.shoulderY - 5}, 140 ${p.neckY + 10}
                  C 143 ${p.neckY + 25}, 157 ${p.neckY + 25}, 160 ${p.neckY + 10}
                  C 150 + sh/2 ${p.shoulderY - 5}, ${150 + sh - 8} ${p.shoulderY + 2}, ${150 + sh - 4} ${p.shoulderY + 12}
                  L ${150 + w + 1} ${p.waistY}
                  L ${150 - w - 1} ${p.waistY} Z`}
              fill={color}
              stroke={darkenColor(color)}
              strokeWidth="1.5"
            />
            {/* Strap accents */}
            <path d={`M 134 ${p.shoulderY - 2} L 135 ${p.shoulderY + 15}`} stroke={darkenColor(color, 15)} strokeWidth="2" />
            <path d={`M 166 ${p.shoulderY - 2} L 165 ${p.shoulderY + 15}`} stroke={darkenColor(color, 15)} strokeWidth="2" />
          </g>
        );
      }
      if (styleKey === 'sweater') {
        return (
          <g id="worn-top">
            {/* Loose baggier torso contour */}
            <path
              d={`M ${150 - sh - 4} ${p.shoulderY + 5} 
                  C ${142} ${p.neckY - 2}, ${158} ${p.neckY - 2}, ${150 + sh + 4} ${p.shoulderY + 5}
                  L ${150 + w + 6} ${p.waistY + 12}
                  L ${150 - w - 6} ${p.waistY + 12} Z`}
              fill={color}
              stroke={darkenColor(color)}
              strokeWidth="1.5"
            />
            {/* Collar neckband */}
            <ellipse cx="150" cy={p.neckY + 2} rx="16" ry="6" fill={darkenColor(color, 10)} stroke={darkenColor(color)} strokeWidth="1" />
            
             {/* Sleeves overlaying the arms area */}
             {pose === 'hips' ? (
               <>
                 <path
                   d={`M ${150 - sh - 4} ${p.shoulderY + 5} 
                       Q ${150 - sh - 22} ${p.waistY - 8} ${150 - w - 2} ${p.waistY + 8}
                       L ${150 - w - 8} ${p.waistY + 2}
                       Q ${150 - sh - 14} ${p.waistY - 14} ${150 - sh + 2} ${p.shoulderY + 15} Z`}
                   fill={color}
                   stroke={darkenColor(color)}
                   strokeWidth="1.5"
                 />
                 <path
                   d={`M ${150 + sh + 4} ${p.shoulderY + 5} 
                       Q ${150 + sh + 22} ${p.waistY - 8} ${150 + w + 2} ${p.waistY + 8}
                       L ${150 + w + 8} ${p.waistY + 2}
                       Q ${150 + sh + 14} ${p.waistY - 14} ${150 + sh - 2} ${p.shoulderY + 15} Z`}
                   fill={color}
                   stroke={darkenColor(color)}
                   strokeWidth="1.5"
                 />
               </>
             ) : pose === 'crossed' ? (
               <>
                 <path
                   d={`M ${150 - sh - 4} ${p.shoulderY + 5} 
                       Q 145 ${p.shoulderY + 24} 162 ${p.waistY - 4}
                       L 155 ${p.waistY + 1}
                       Q 140 ${p.shoulderY + 28} ${150 - sh + 2} ${p.shoulderY + 15} Z`}
                   fill={color}
                   stroke={darkenColor(color)}
                   strokeWidth="1.5"
                 />
                 <path
                   d={`M ${150 + sh + 4} ${p.shoulderY + 5} 
                       Q 155 ${p.shoulderY + 24} 138 ${p.waistY - 4}
                       L 145 ${p.waistY + 1}
                       Q 160 ${p.shoulderY + 28} ${150 + sh - 2} ${p.shoulderY + 15} Z`}
                   fill={color}
                   stroke={darkenColor(color)}
                   strokeWidth="1.5"
                 />
               </>
             ) : (
               <>
                 <path
                   d={`M ${150 - sh - 4} ${p.shoulderY + 5} 
                       L ${150 - sh - 28} ${p.waistY + 5} 
                       L ${150 - sh - 20} ${p.waistY + 10} 
                       L ${150 - sh + 2} ${p.shoulderY + 15} Z`}
                   fill={color}
                   stroke={darkenColor(color)}
                   strokeWidth="1.5"
                 />
                 <path
                   d={`M ${150 + sh + 4} ${p.shoulderY + 5} 
                       L ${150 + sh + 28} ${p.waistY + 5} 
                       L ${150 + sh + 20} ${p.waistY + 10} 
                       L ${150 + sh - 2} ${p.shoulderY + 15} Z`}
                   fill={color}
                   stroke={darkenColor(color)}
                   strokeWidth="1.5"
                 />
               </>
             )}
          </g>
        );
      }
      if (styleKey === 'shirt') {
        return (
          <g id="worn-top">
            {/* Button-down style */}
            <path
              d={`M ${150 - sh - 1} ${p.shoulderY + 4}
                  C 142 ${p.neckY}, 158 ${p.neckY}, ${150 + sh + 1} ${p.shoulderY + 4}
                  L ${150 + w + 3} ${p.waistY + 5}
                  L ${150 - w - 3} ${p.waistY + 5} Z`}
              fill={color}
              stroke={darkenColor(color)}
              strokeWidth="1.5"
            />
            {/* Collar Fold */}
            <path d={`M 136 ${p.neckY} L 150 ${p.neckY + 14} L 140 ${p.neckY + 18} Z`} fill={darkenColor(color, 8)} stroke={darkenColor(color)} strokeWidth="1" />
            <path d={`M 164 ${p.neckY} L 150 ${p.neckY + 14} L 160 ${p.neckY + 18} Z`} fill={darkenColor(color, 8)} stroke={darkenColor(color)} strokeWidth="1" />
            
            {/* Center placket line and buttons */}
            <line x1="150" y1={p.neckY + 14} x2="150" y2={p.waistY + 5} stroke={darkenColor(color, 20)} strokeWidth="2" />
            <circle cx="150" cy={p.neckY + 30} r="2" fill="#fff" />
            <circle cx="150" cy={p.neckY + 50} r="2" fill="#fff" />
            <circle cx="150" cy={p.neckY + 70} r="2" fill="#fff" />
            
            {/* Short-ish sleeves */}
            <path
              d={`M ${150 - sh} ${p.shoulderY + 4} L ${150 - sh - 12} ${p.shoulderY + 36} L ${150 - sh + 4} ${p.shoulderY + 40} L ${150 - sh + 8} ${p.shoulderY + 12} Z`}
              fill={color}
              stroke={darkenColor(color)}
              strokeWidth="1"
            />
            <path
              d={`M ${150 + sh} ${p.shoulderY + 4} L ${150 + sh + 12} ${p.shoulderY + 36} L ${150 + sh - 4} ${p.shoulderY + 40} L ${150 + sh - 8} ${p.shoulderY + 12} Z`}
              fill={color}
              stroke={darkenColor(color)}
              strokeWidth="1"
            />
          </g>
        );
      }
      // Default: basic Tee
      return (
        <g id="worn-top">
          <path
            d={`M ${150 - sh} ${p.shoulderY + 3} 
                C 142 ${p.neckY + 8}, 158 ${p.neckY + 8}, ${150 + sh} ${p.shoulderY + 3}
                L ${150 + w + 2} ${p.waistY + 2}
                L ${150 - w - 2} ${p.waistY + 2} Z`}
            fill={color}
            stroke={darkenColor(color)}
            strokeWidth="1.5"
          />
          {/* Round crew neck binding */}
          <path d={`M 136 ${p.neckY + 4} C 136 ${p.neckY + 12}, 164 ${p.neckY + 12}, 164 ${p.neckY + 4}`} fill="none" stroke={darkenColor(color, 15)} strokeWidth="2.5" />
          
          {/* Classic short T-shirt sleeves */}
          <path
            d={`M ${150 - sh} ${p.shoulderY + 3} 
                L ${150 - sh - 14} ${p.shoulderY + 30} 
                L ${150 - sh + 2} ${p.shoulderY + 35} Z`}
            fill={color}
            stroke={darkenColor(color)}
            strokeWidth="1.2"
          />
          <path
            d={`M ${150 + sh} ${p.shoulderY + 3} 
                L ${150 + sh + 14} ${p.shoulderY + 30} 
                L ${150 + sh - 2} ${p.shoulderY + 35} Z`}
            fill={color}
            stroke={darkenColor(color)}
            strokeWidth="1.2"
          />
        </g>
      );

    case 'pants':
      const legLeftX = 150 - hp/2;
      const legRightX = 150 + hp/2;
      const hemY = p.feetY - 15;

      if (styleKey === 'jeans' || styleKey === 'chinos') {
        return (
          <g id="worn-pants">
            {/* Double leg straight cut */}
            <path
              d={`M ${150 - w} ${p.waistY - 2}
                  L ${150 + w} ${p.waistY - 2}
                  L ${legRightX + 4} ${p.hipY + 5}
                  L ${legRightX + 1} ${hemY}
                  L ${152} ${hemY}
                  L 150 ${p.hipY + 20}
                  L 148 ${hemY}
                  L ${legLeftX - 1} ${hemY}
                  L ${legLeftX - 4} ${p.hipY + 5} Z`}
              fill={color}
              stroke={darkenColor(color)}
              strokeWidth="1.5"
            />
            {/* Pockets & belt highlights */}
            <path d={`M ${150 - w} ${p.waistY + 12} Q 150 ${p.waistY + 20} ${150 + w} ${p.waistY + 12}`} fill="none" stroke={darkenColor(color, 20)} strokeWidth="1" />
            <line x1="150" y1={p.waistY} x2="150" y2={p.hipY + 10} stroke={darkenColor(color, 20)} strokeWidth="1.5" />
            {/* Leg cuffs */}
            <line x1={legLeftX - 1} y1={hemY} x2="148" y2={hemY} stroke={darkenColor(color, 25)} strokeWidth="2.5" />
            <line x1="152" y1={hemY} x2={legRightX + 1} y2={hemY} stroke={darkenColor(color, 25)} strokeWidth="2.5" />
          </g>
        );
      }
      if (styleKey === 'cargo') {
        return (
          <g id="worn-pants">
            {/* Baggy trousers outline */}
            <path
              d={`M ${150 - w} ${p.waistY - 2}
                  L ${150 + w} ${p.waistY - 2}
                  L ${legRightX + 8} ${p.hipY + 10}
                  L ${legRightX + 6} ${hemY - 4}
                  L ${153} ${hemY - 4}
                  L 150 ${p.hipY + 20}
                  L 147 ${hemY - 4}
                  L ${legLeftX - 6} ${hemY - 4}
                  L ${legLeftX - 8} ${p.hipY + 10} Z`}
              fill={color}
              stroke={darkenColor(color)}
              strokeWidth="1.5"
            />
            {/* Pocket shapes on thigh flaps */}
            <rect x={legLeftX - 9} y={p.hipY + 45} width="10" height="15" rx="2" fill={darkenColor(color, 10)} stroke={darkenColor(color)} />
            <rect x={legRightX - 1} y={p.hipY + 45} width="10" height="15" rx="2" fill={darkenColor(color, 10)} stroke={darkenColor(color)} />
            {/* Knee folds details */}
            <path d={`M ${legLeftX - 4} ${p.hipY + 80} H ${149} M ${151} ${p.hipY + 80} H ${legRightX + 4}`} fill="none" stroke={darkenColor(color, 18)} strokeWidth="1" />
          </g>
        );
      }
      // Default: basic shorts or tailored pants
      return (
        <g id="worn-pants">
          <path
            d={`M ${150 - w} ${p.waistY - 2}
                L ${150 + w} ${p.waistY - 2}
                L ${legRightX + 3} ${p.hipY + 15}
                L ${152} ${p.hipY + 20}
                L ${legLeftX - 3} ${p.hipY + 15} Z`}
            fill={color}
            stroke={darkenColor(color)}
            strokeWidth="1.5"
          />
        </g>
      );

    case 'dress':
      const bottomSkirtY = p.feetY - 30;
      return (
        <g id="worn-dress">
          {/* Silhouette covering torso and stretching to midi length */}
          <path
            d={`M ${150 - sh + 4} ${p.shoulderY + 12} 
                C ${150 - sh + 8} ${p.shoulderY + 2}, 138 ${p.neckY + 12}, 141 ${p.neckY + 14}
                C 144 ${p.neckY + 26}, 156 ${p.neckY + 26}, 159 ${p.neckY + 14}
                C 162 ${p.neckY + 12}, ${150 + sh - 8} ${p.shoulderY + 2}, ${150 + sh - 4} ${p.shoulderY + 12}
                L ${150 + w + 1} ${p.waistY}
                L ${150 + hp + 8} ${p.hipY + 20}
                L ${150 + hp + 18} ${bottomSkirtY}
                L ${150 - hp - 18} ${bottomSkirtY}
                L ${150 - hp - 8} ${p.hipY + 20}
                L ${150 - w - 1} ${p.waistY} Z`}
            fill={color}
            stroke={darkenColor(color)}
            strokeWidth="1.5"
          />
          {/* Flare shading highlights */}
          <path d={`M 148 ${p.waistY} L 138 ${bottomSkirtY - 4}`} stroke={darkenColor(color, 12)} strokeWidth="1" />
          <path d={`M 152 ${p.waistY} L 162 ${bottomSkirtY - 4}`} stroke={darkenColor(color, 12)} strokeWidth="1" />
        </g>
      );

    case 'jacket':
      if (styleKey === 'trench') {
        return (
          <g id="worn-jacket">
            {/* Long heavy open coat overlaying the sides */}
            <path
              d={`M ${150 - sh - 5} ${p.shoulderY + 2}
                  L 134 ${p.neckY + 15}
                  L 142 ${p.neckY + 30}
                  L ${150 - w - 6} ${p.waistY + 15}
                  L ${150 - hp - 12} ${p.feetY - 50}
                  L ${150 - hp + 2} ${p.feetY - 50}
                  L 145 ${p.waistY + 25}
                  L 155 ${p.waistY + 25}
                  L ${150 + hp - 2} ${p.feetY - 50}
                  L ${150 + hp + 12} ${p.feetY - 50}
                  L ${150 + w + 6} ${p.waistY + 15}
                  L 166 ${p.neckY + 30}
                  L 158 ${p.neckY + 15}
                  L ${150 + sh + 5} ${p.shoulderY + 2} Z`}
              fill={color}
              stroke={darkenColor(color)}
              strokeWidth="2"
            />
            {/* Belt buckle and loop details */}
            <rect x="135" y={p.waistY + 4} width="30" height="6" rx="1" fill={darkenColor(color, 15)} />
            <rect x="147" y={p.waistY + 2} width="6" height="10" fill="#dfc08a" stroke="#a08050" />
            
            {/* Sleeves overlay */}
            {pose === 'hips' ? (
               <>
                 <path
                   d={`M ${150 - sh - 5} ${p.shoulderY + 2} 
                       Q ${150 - sh - 22} ${p.waistY - 8} ${150 - w - 2} ${p.waistY + 8}
                       L ${150 - w - 8} ${p.waistY + 2}
                       Q ${150 - sh - 14} ${p.waistY - 14} ${150 - sh} ${p.shoulderY + 14} Z`}
                   fill={color}
                   stroke={darkenColor(color)}
                   strokeWidth="1.5"
                 />
                 <path
                   d={`M ${150 + sh + 5} ${p.shoulderY + 2} 
                       Q ${150 + sh + 22} ${p.waistY - 8} ${150 + w + 2} ${p.waistY + 8}
                       L ${150 + w + 8} ${p.waistY + 2}
                       Q ${150 + sh + 14} ${p.waistY - 14} ${150 + sh} ${p.shoulderY + 14} Z`}
                   fill={color}
                   stroke={darkenColor(color)}
                   strokeWidth="1.5"
                 />
               </>
            ) : pose === 'crossed' ? (
               <>
                 <path
                   d={`M ${150 - sh - 5} ${p.shoulderY + 2} 
                       Q 145 ${p.shoulderY + 24} 162 ${p.waistY - 4}
                       L 155 ${p.waistY + 1}
                       Q 140 ${p.shoulderY + 28} ${150 - sh} ${p.shoulderY + 14} Z`}
                   fill={color}
                   stroke={darkenColor(color)}
                   strokeWidth="1.5"
                 />
                 <path
                   d={`M ${150 + sh + 5} ${p.shoulderY + 2} 
                       Q 155 ${p.shoulderY + 24} 138 ${p.waistY - 4}
                       L 145 ${p.waistY + 1}
                       Q 160 ${p.shoulderY + 28} ${150 + sh} ${p.shoulderY + 14} Z`}
                   fill={color}
                   stroke={darkenColor(color)}
                   strokeWidth="1.5"
                 />
               </>
            ) : (
               <>
                 <path
                   d={`M ${150 - sh - 5} ${p.shoulderY + 2} L ${150 - sh - 30} ${p.waistY + 10} L ${150 - sh - 22} ${p.waistY + 16} L ${150 - sh} ${p.shoulderY + 14} Z`}
                   fill={color}
                   stroke={darkenColor(color)}
                   strokeWidth="1.5"
                 />
                 <path
                   d={`M ${150 + sh + 5} ${p.shoulderY + 2} L ${150 + sh + 30} ${p.waistY + 10} L ${150 + sh + 22} ${p.waistY + 16} L ${150 + sh} ${p.shoulderY + 14} Z`}
                   fill={color}
                   stroke={darkenColor(color)}
                   strokeWidth="1.5"
                 />
               </>
            )}
          </g>
        );
      }
      // Bomber / Denim Jacket
      return (
        <g id="worn-jacket">
          {/* Waist length structured open jacket */}
          <path
            d={`M ${150 - sh - 3} ${p.shoulderY + 1}
                L 138 ${p.neckY + 16}
                L 142 ${p.neckY + 32}
                L ${150 - w - 4} ${p.waistY + 4}
                L ${150 - w + 2} ${p.waistY + 4}
                L 146 ${p.waistY - 10}
                L 154 ${p.waistY - 10}
                L ${150 + w - 2} ${p.waistY + 4}
                L ${150 + w + 4} ${p.waistY + 4}
                L 158 ${p.neckY + 32}
                L 162 ${p.neckY + 16}
                L ${150 + sh + 3} ${p.shoulderY + 1} Z`}
            fill={color}
            stroke={darkenColor(color)}
            strokeWidth="1.8"
          />
          {/* Collar flaps */}
          <polygon points={`138,${p.neckY + 16} 145,${p.neckY + 12} 142,${p.neckY + 32}`} fill={darkenColor(color, 12)} stroke={darkenColor(color)} />
          <polygon points={`162,${p.neckY + 16} 155,${p.neckY + 12} 158,${p.neckY + 32}`} fill={darkenColor(color, 12)} stroke={darkenColor(color)} />
          
          {/* Long sleeves */}
          {pose === 'hips' ? (
             <>
               <path
                 d={`M ${150 - sh - 3} ${p.shoulderY + 1} 
                     Q ${150 - sh - 22} ${p.waistY - 8} ${150 - w - 2} ${p.waistY + 8}
                     L ${150 - w - 8} ${p.waistY}
                     Q ${150 - sh - 12} ${p.waistY - 14} ${150 - sh + 2} ${p.shoulderY + 12} Z`}
                 fill={color}
                 stroke={darkenColor(color)}
                 strokeWidth="1.5"
               />
               <path
                 d={`M ${150 + sh + 3} ${p.shoulderY + 1} 
                     Q ${150 + sh + 22} ${p.waistY - 8} ${150 + w + 2} ${p.waistY + 8}
                     L ${150 + w + 8} ${p.waistY}
                     Q ${150 + sh + 12} ${p.waistY - 14} ${150 + sh - 2} ${p.shoulderY + 12} Z`}
                 fill={color}
                 stroke={darkenColor(color)}
                 strokeWidth="1.5"
               />
             </>
          ) : pose === 'crossed' ? (
             <>
               <path
                 d={`M ${150 - sh - 3} ${p.shoulderY + 1} 
                     Q 145 ${p.shoulderY + 24} 162 ${p.waistY - 4}
                     L 155 ${p.waistY + 1}
                     Q 140 ${p.shoulderY + 28} ${150 - sh + 2} ${p.shoulderY + 12} Z`}
                 fill={color}
                 stroke={darkenColor(color)}
                 strokeWidth="1.5"
               />
               <path
                 d={`M ${150 + sh + 3} ${p.shoulderY + 1} 
                     Q 155 ${p.shoulderY + 24} 138 ${p.waistY - 4}
                     L 145 ${p.waistY + 1}
                     Q 160 ${p.shoulderY + 28} ${150 + sh - 2} ${p.shoulderY + 12} Z`}
                 fill={color}
                 stroke={darkenColor(color)}
                 strokeWidth="1.5"
               />
             </>
          ) : (
             <>
               <path
                 d={`M ${150 - sh - 3} ${p.shoulderY + 1} L ${150 - sh - 28} ${p.waistY} L ${150 - sh - 20} ${p.waistY + 6} L ${150 - sh + 2} ${p.shoulderY + 12} Z`}
                 fill={color}
                 stroke={darkenColor(color)}
                 strokeWidth="1.5"
               />
               <path
                 d={`M ${150 + sh + 3} ${p.shoulderY + 1} L ${150 + sh + 28} ${p.waistY} L ${150 + sh + 20} ${p.waistY + 6} L ${150 + sh - 2} ${p.shoulderY + 12} Z`}
                 fill={color}
                 stroke={darkenColor(color)}
                 strokeWidth="1.5"
               />
             </>
          )}
        </g>
      );

    case 'shoes':
      const leftFootX = 150 - hp/2;
      const rightFootX = 150 + hp/2;
      const shoeTopY = p.feetY - 15;

      return (
        <g id="worn-shoes">
          {/* Left Shoe */}
          <path
            d={`M ${leftFootX - 10} ${shoeTopY}
                C ${leftFootX - 15} ${shoeTopY + 2}, ${leftFootX - 16} ${p.feetY}, ${leftFootX - 12} ${p.feetY + 4}
                L ${leftFootX + 8} ${p.feetY + 4}
                C ${leftFootX + 10} ${p.feetY}, ${leftFootX + 8} ${shoeTopY + 2}, ${leftFootX + 6} ${shoeTopY} Z`}
            fill={color}
            stroke={darkenColor(color)}
            strokeWidth="1.5"
          />
          <line x1={leftFootX - 11} y1={p.feetY + 1} x2={leftFootX + 7} y2={p.feetY + 1} stroke="#ffffff" strokeWidth="2.2" /> {/* White sole */}

          {/* Right Shoe */}
          <path
            d={`M ${rightFootX - 6} ${shoeTopY}
                C ${rightFootX - 8} ${shoeTopY + 2}, ${rightFootX - 10} ${p.feetY}, ${rightFootX - 8} ${p.feetY + 4}
                L ${rightFootX + 12} ${p.feetY + 4}
                C ${rightFootX + 16} ${p.feetY}, ${rightFootX + 15} ${shoeTopY + 2}, ${rightFootX + 10} ${shoeTopY} Z`}
            fill={color}
            stroke={darkenColor(color)}
            strokeWidth="1.5"
          />
          <line x1={rightFootX - 7} y1={p.feetY + 1} x2={rightFootX + 11} y2={p.feetY + 1} stroke="#ffffff" strokeWidth="2.2" />
        </g>
      );

    case 'hat':
      if (styleKey === 'fedora') {
        return (
          <g id="worn-hat">
            {/* Fedora crown & wide brim */}
            <path d="M 126 65 C 126 40, 174 40, 174 65 L 170 73 L 130 73 Z" fill={color} stroke={darkenColor(color)} strokeWidth="1" />
            <ellipse cx="150" cy="73" rx="36" ry="6" fill={color} stroke={darkenColor(color)} strokeWidth="1" />
            {/* Ribbon Trim */}
            <path d="M 130 70 L 170 70 L 171 73 L 129 73 Z" fill="#1c1c1c" />
          </g>
        );
      }
      // Baseball cap
      return (
        <g id="worn-hat">
          {/* Cap dome */}
          <path d="M 131 75 C 131 46, 169 46, 169 75 Z" fill={color} stroke={darkenColor(color)} strokeWidth="1" />
          {/* Visor / Brim */}
          <path d="M 130 73 C 138 73, 162 73, 172 79 C 168 83, 134 81, 130 73 Z" fill={darkenColor(color, 12)} stroke={darkenColor(color, 25)} strokeWidth="1" />
          {/* Crown button */}
          <circle cx="150" cy="48" r="2.5" fill={color} />
        </g>
      );

    case 'glasses':
      return (
        <g id="worn-glasses">
          {/* Oval Frames */}
          <ellipse cx="142" cy="85" rx="9" ry="5.5" fill="none" stroke={color} strokeWidth="2" />
          <ellipse cx="158" cy="85" rx="9" ry="5.5" fill="none" stroke={color} strokeWidth="2" />
          {/* Bridge connection */}
          <path d="M 149 84 Q 150 82 151 84" fill="none" stroke={color} strokeWidth="2.5" />
          {/* Temples / Sides */}
          <path d="M 133 84 Q 128 82 127 80" fill="none" stroke={color} strokeWidth="2" />
          <path d="M 167 84 Q 172 82 173 80" fill="none" stroke={color} strokeWidth="2" />
          {/* Tinted Lenses */}
          <ellipse cx="142" cy="85" rx="8" ry="4.5" fill="#1f1b24" fillOpacity="0.8" />
          <ellipse cx="158" cy="85" rx="8" ry="4.5" fill="#1f1b24" fillOpacity="0.8" />
        </g>
      );

    case 'jewelry':
      return (
        <g id="worn-jewelry">
          {/* Choker Chain resting on neck area */}
          <path d={`M 142 ${p.neckY + 6} C 144 ${p.neckY + 16}, 156 ${p.neckY + 16}, 158 ${p.neckY + 6}`} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          {/* Small shiny diamond pendant */}
          <polygon points={`150,${p.neckY + 14} 153,${p.neckY + 17} 150,${p.neckY + 20} 147,${p.neckY + 17}`} fill="#e0f0ff" stroke={color} strokeWidth="0.8" />
        </g>
      );

    case 'bag':
      return (
        <g id="worn-bag">
          {/* Crossbody shoulder strap */}
          <path d={`M 136 ${p.shoulderY - 2} Q 156 ${p.waistY - 10} ${150 + w + 12} ${p.waistY + 45}`} fill="none" stroke="#2b2b2b" strokeWidth="2.5" />
          {/* Elegant handbag positioned around hip/waist side */}
          <rect x={150 + w + 4} y={p.waistY + 30} width="24" height="18" rx="3" fill={color} stroke={darkenColor(color)} strokeWidth="1.5" />
          {/* Metal buckle emblem */}
          <circle cx={150 + w + 16} cy={p.waistY + 39} r="2.5" fill="#ffd700" />
        </g>
      );

    default:
      return null;
  }
};

// --- HELPER UTILITY: COLOR DARKENER ---
// Darkens a hex color code to generate vector borders/linework.
export const darkenColor = (hex: string, percent: number = 20): string => {
  let num = parseInt(hex.replace('#', ''), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) - amt,
    G = ((num >> 8) & 0x00ff) - amt,
    B = (num & 0x0000ff) - amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 0 ? 0 : R > 255 ? 255 : R) * 0x10000 +
      (G < 0 ? 0 : G > 255 ? 255 : G) * 0x100 +
      (B < 0 ? 0 : B > 255 ? 255 : B)
    )
      .toString(16)
      .slice(1)
  );
};
