'use client';

import React, { useState } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import { useAvatarStore } from '@/stores/avatarStore';
import DressSilhouette from './DressSilhouette';
import {
  DEMO_DRESSES, DEMO_OCCASIONS, DemoOccasion, SILHOUETTE_LABEL, FABRIC_LABEL,
} from './mannequin/demoDresses';

export default function DemoDressRack() {
  const demoDress = useAvatarStore((s) => s.demoDress);
  const setDemoDress = useAvatarStore((s) => s.setDemoDress);
  const gender = useAvatarStore((s) => s.avatar.gender);
  const [occasion, setOccasion] = useState<'all' | DemoOccasion>('all');

  const active = demoDress ? DEMO_DRESSES.find((d) => d.id === demoDress.id) : undefined;
  const visible = occasion === 'all' ? DEMO_DRESSES : DEMO_DRESSES.filter((d) => d.occasion === occasion);

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
          <Sparkles className="h-4 w-4 text-[#8b6f47] dark:text-[#c9a96b]" />
          Demo Dresses
        </h3>
        <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
          Showroom samples for the 3D model — tap one to dress the mannequin.
        </p>
      </div>

      {/* Selected look */}
      {active && demoDress ? (
        <div className="rounded-xl border border-[#8b6f47]/30 bg-[#8b6f47]/5 p-3 dark:border-[#c9a96b]/30 dark:bg-[#c9a96b]/5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-gray-900 dark:text-white">{active.name}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {SILHOUETTE_LABEL[active.silhouette]} · {FABRIC_LABEL[active.fabric]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDemoDress(null)}
              className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-white hover:text-red-500 dark:hover:bg-gray-800"
              aria-label="Take off demo dress"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-gray-600 dark:text-gray-300">{active.description}</p>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Colour</span>
            {active.colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDemoDress({ id: active.id, color: c })}
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-transform hover:scale-110"
                style={{ backgroundColor: c, borderColor: demoDress.color === c ? '#8b6f47' : '#e5e5e5' }}
                aria-label={`Colour ${c}`}
              >
                {demoDress.color === c && <Check className="h-3 w-3 text-white mix-blend-difference" />}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-gray-200 p-3 text-center text-[11px] text-gray-400 dark:border-gray-800">
          No dress on the model yet. Pick one below.
        </p>
      )}

      {/* Occasion filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {DEMO_OCCASIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOccasion(o.id)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
              occasion === o.id
                ? 'bg-[#8b6f47] text-white dark:bg-[#c9a96b] dark:text-gray-950'
                : 'border border-gray-200 bg-gray-50 text-gray-500 hover:text-gray-800 dark:border-gray-800 dark:bg-gray-950'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Rack */}
      <div className="grid max-h-[520px] grid-cols-2 gap-3 overflow-y-auto pr-1">
        {visible.map((dress) => {
          const isActive = demoDress?.id === dress.id;
          const color = isActive ? demoDress!.color : dress.color;
          return (
            <button
              key={dress.id}
              type="button"
              onClick={() => setDemoDress(isActive ? null : { id: dress.id, color: dress.colors[0] })}
              className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                isActive
                  ? 'border-[#8b6f47] ring-2 ring-[#8b6f47]/25 dark:border-[#c9a96b]'
                  : 'border-gray-100 dark:border-gray-800'
              }`}
            >
              <div className="relative aspect-[4/5] w-full bg-gradient-to-b from-stone-50 to-stone-100 dark:from-zinc-900 dark:to-zinc-950">
                <DressSilhouette spec={{ ...dress, color }} gender={gender} className="h-full w-full p-1.5" />
                <span className="absolute left-1.5 top-1.5 rounded-md bg-white/85 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-[#8b6f47] dark:bg-black/60 dark:text-[#c9a96b]">
                  Demo
                </span>
                {isActive && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-[#8b6f47] p-1 text-white dark:bg-[#c9a96b] dark:text-gray-950">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <p className="line-clamp-1 text-xs font-bold text-gray-800 dark:text-gray-200">{dress.name}</p>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  {SILHOUETTE_LABEL[dress.silhouette]} · {FABRIC_LABEL[dress.fabric]}
                </p>
                <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isActive ? 'bg-[#8b6f47] text-white dark:bg-[#c9a96b] dark:text-gray-950' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                }`}>
                  {isActive ? 'On model' : 'Try on'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
