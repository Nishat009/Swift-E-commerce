'use client';

import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';

const fragments = Array.from({ length: 150 }, (_, index) => {
  const angle = index * 2.39996;
  const distance = 12 + Math.sqrt(index / 150) * 43;
  return {
    x: `${(Math.cos(angle) * distance).toFixed(3)}vw`,
    y: `${(Math.sin(angle) * distance * 0.7).toFixed(3)}vh`,
    rotation: `${(index * 67) % 540 - 270}deg`,
    delay: `${(index % 11) * 0.025}s`,
    size: `${5 + (index * 13) % 13}px`,
  };
});

const CYCLE_MS = 15000;
const FADE_MS = 1000;

export default function CinematicFashionHero() {
  const [cycle, setCycle] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const fade = setTimeout(() => setLeaving(true), CYCLE_MS - FADE_MS);
    const restart = setTimeout(() => {
      setLeaving(false);
      setCycle((c) => c + 1);
    }, CYCLE_MS);
    return () => { clearTimeout(fade); clearTimeout(restart); };
  }, [cycle]);

  return (
    <section className="fashion-story relative" aria-label="SwiftCart atelier collection">
      <div key={cycle} className={`fashion-stage relative h-[calc(100svh-235px)] min-h-[580px] overflow-hidden bg-[#17110f] text-[#f8f1e8] max-md:h-[calc(100svh-104px)] max-md:min-h-[620px] ${leaving ? 'is-leaving' : ''}`}>
        <div className="fashion-dust absolute inset-0" aria-hidden="true" />
        <div className="fashion-spotlight absolute inset-0" aria-hidden="true" />
        <div className="fashion-fabric-detail absolute inset-0" aria-hidden="true" />
        <div className="fashion-ribbon fashion-ribbon-one absolute" aria-hidden="true" />
        <div className="fashion-ribbon fashion-ribbon-two absolute" aria-hidden="true" />
        <div className="fashion-ribbon fashion-ribbon-three absolute" aria-hidden="true" />
        <div className="fashion-fragments absolute inset-0" aria-hidden="true">
          {fragments.map((fragment, index) => (
            <span
              key={index}
              className={`fashion-fragment ${index % 5 === 0 ? 'fashion-fragment-thread' : ''}`}
              style={{
                '--fragment-x': fragment.x,
                '--fragment-y': fragment.y,
                '--fragment-rotation': fragment.rotation,
                '--fragment-delay': fragment.delay,
                '--fragment-size': fragment.size,
              } as CSSProperties}
            />
          ))}
        </div>
        <div className="fashion-stitch absolute" aria-hidden="true" />
        <div className="fashion-model absolute inset-0" role="img" aria-label="Model wearing a camel wool coat over an ivory outfit" />
        <div className="fashion-scrim absolute inset-0 pointer-events-none" aria-hidden="true" />

        <div className="fashion-opening absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center pointer-events-none" aria-hidden="true">
          <div className="mb-5 flex items-center gap-4"><span className="fashion-rule" /><p className="text-[10px] font-medium uppercase tracking-[0.45em] text-[#d9b783] sm:text-xs">SwiftCart Atelier</p><span className="fashion-rule" /></div>
          <div className="fashion-shimmer font-serif text-[clamp(3.5rem,8vw,8rem)] leading-[0.86] tracking-tight">From thread.<br /><em className="font-normal">To form.</em></div>
          <p className="fashion-tagline mt-7 text-xs tracking-[0.22em] text-[#dbc9b6] sm:text-sm">A collection in motion</p>
        </div>

        <div className="fashion-final-copy absolute inset-0 z-20 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 sm:px-10 lg:px-12 max-md:justify-end max-md:pb-20">
          <p className="fashion-in fashion-in-1 mb-5 text-[10px] font-medium uppercase tracking-[0.42em] text-[#d9b783] sm:text-xs">SwiftCart / The Atelier Edit</p>
          <h1 className="fashion-in fashion-in-2 max-w-[660px] font-serif text-[clamp(3.8rem,7.5vw,8rem)] leading-[0.9] tracking-tight">Wear<br /><em className="font-normal">the story.</em></h1>
          <p className="fashion-in fashion-in-3 mt-7 max-w-md text-sm leading-7 text-[#e7dcd0] sm:text-base">From the first fold of fabric to a silhouette made for you.</p>
          <Link href="/products" className="fashion-in fashion-in-4 mt-8 inline-flex w-fit items-center gap-5 border border-[#d9b783] bg-[#d9b783] px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#1b1512] transition-colors hover:bg-[#f1d5aa] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Shop Collection <span aria-hidden="true">↗</span></Link>
          <span className="fashion-in fashion-in-5 mt-9 text-[10px] uppercase tracking-[0.28em] text-[#d5c5b4] motion-reduce:hidden">Scroll to explore ↓</span>
        </div>
        <div className="fashion-counter absolute bottom-8 right-8 z-20 hidden text-[10px] uppercase tracking-[0.3em] text-[#d5c5b4] md:block">The atelier / 01—04</div>
      </div>
    </section>
  );
}
