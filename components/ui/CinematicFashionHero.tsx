'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import apiClient from '@/lib/apiClient';

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

const slides = [
  { motion: 'atelier', label: 'Camel coat editorial', eyebrow: 'The Atelier Edit', title: 'Wear the story.', opening: 'From thread. To form.', description: 'From the first fold of fabric to a silhouette made for you.', image: '/hero-atelier-desktop.webp', mobile: '/hero-atelier-portrait.webp', href: '/products', action: 'Shop Collection' },
  { motion: 'runway', label: 'Runway fashion editorial', eyebrow: 'The Runway Edit', title: 'Find your moment.', opening: 'A new mood. In motion.', description: 'Expressive silhouettes and enduring pieces for every entrance.', image: '/banner-runway.jpg', mobile: '/banner-runway.jpg', href: '/products?category=dress', action: 'Explore the Edit' },
  { motion: 'editorial', label: 'Everyday fashion editorial', eyebrow: 'The Everyday Edit', title: 'Style for every day.', opening: 'Made to move. Made to last.', description: 'Considered layers and quiet details for the way you live.', image: '/hero-everyday-editorial.png', mobile: '/hero-everyday-editorial.png', href: '/products', action: 'Discover More' },
];
const CYCLE_MS = 11000;
const FADE_MS = 1000;

export default function CinematicFashionHero() {
  const [cycle, setCycle] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});
  const index = cycle % slides.length;
  const baseSlide = slides[index];
  const slide = uploadedImages[baseSlide.motion]
    ? { ...baseSlide, image: uploadedImages[baseSlide.motion], mobile: uploadedImages[baseSlide.motion] }
    : baseSlide;

  useEffect(() => {
    apiClient.get('/hero').then(({ data }) => {
      if (Array.isArray(data.slides)) {
        setUploadedImages(Object.fromEntries(data.slides.filter((item: { key?: string; image?: string }) =>
          typeof item.key === 'string' && typeof item.image === 'string'
        ).map((item: { key: string; image: string }) => [item.key, item.image])));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!playing) return;
    const fade = setTimeout(() => setLeaving(true), CYCLE_MS - FADE_MS);
    const restart = setTimeout(() => {
      setLeaving(false);
      setCycle((c) => c + 1);
    }, CYCLE_MS);
    return () => { clearTimeout(fade); clearTimeout(restart); };
  }, [cycle, playing]);

  const goTo = (target: number) => {
    setLeaving(false);
    setCycle(value => value + ((target - value % slides.length + slides.length) % slides.length));
  };

  return (
    <section className="fashion-story relative" aria-label="SwiftCart atelier collection">
      <div key={cycle} className={`fashion-stage fashion-stage--${slide.motion} relative h-[calc(100svh-235px)] min-h-[580px] overflow-hidden bg-[#17110f] text-[#f8f1e8] max-md:h-[calc(100svh-104px)] max-md:min-h-[620px] ${leaving ? 'is-leaving' : ''}`} style={{ '--hero-image': `url('${slide.image}')`, '--hero-mobile-image': `url('${slide.mobile}')` } as CSSProperties}>
        <div className="fashion-dust absolute inset-0" aria-hidden="true" />
        {slide.motion === 'atelier' && <>
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
        </>}
        <div className="fashion-model absolute inset-0" role="img" aria-label={slide.label} />
        {slide.motion === 'runway' && <>
          <div className="fashion-runway-light absolute inset-0" aria-hidden="true" />
          <div className="fashion-runway-curtain fashion-runway-curtain--left absolute inset-y-0 left-0" aria-hidden="true" />
          <div className="fashion-runway-curtain fashion-runway-curtain--right absolute inset-y-0 right-0" aria-hidden="true" />
        </>}
        {slide.motion === 'editorial' && <div className="fashion-editorial-strips absolute inset-0" aria-hidden="true">
          {Array.from({ length: 5 }, (_, stripIndex) => <span key={stripIndex} className="fashion-editorial-strip" style={{ '--strip-index': stripIndex } as CSSProperties} />)}
        </div>}
        <div className="fashion-scrim absolute inset-0 pointer-events-none" aria-hidden="true" />

        <div className="fashion-opening absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center pointer-events-none" aria-hidden="true">
          <div className="mb-5 flex items-center gap-4"><span className="fashion-rule" /><p className="text-[10px] font-medium uppercase tracking-[0.45em] text-[#d9b783] sm:text-xs">SwiftCart Atelier</p><span className="fashion-rule" /></div>
          <div className="fashion-shimmer font-serif text-[clamp(3.5rem,8vw,8rem)] leading-[0.86] tracking-tight">{slide.opening}</div>
          <p className="fashion-tagline mt-7 text-xs tracking-[0.22em] text-[#dbc9b6] sm:text-sm">A collection in motion</p>
        </div>

        <div className="fashion-final-copy absolute inset-0 z-20 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 sm:px-10 lg:px-12 max-md:justify-end max-md:pb-20">
          <p className="fashion-in fashion-in-1 mb-5 text-[10px] font-medium uppercase tracking-[0.42em] text-[#d9b783] sm:text-xs">SwiftCart / {slide.eyebrow}</p>
          <h1 className="fashion-in fashion-in-2 max-w-[660px] font-serif text-[clamp(3.8rem,7.5vw,8rem)] leading-[0.9] tracking-tight">{slide.title}</h1>
          <p className="fashion-in fashion-in-3 mt-7 max-w-md text-sm leading-7 text-[#e7dcd0] sm:text-base">{slide.description}</p>
          <Link href={slide.href} className="fashion-in fashion-in-4 mt-8 inline-flex w-fit items-center gap-5 border border-[#d9b783] bg-[#d9b783] px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#1b1512] transition-colors hover:bg-[#f1d5aa] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">{slide.action} <span aria-hidden="true">↗</span></Link>
          <span className="fashion-in fashion-in-5 mt-9 text-[10px] uppercase tracking-[0.28em] text-[#d5c5b4] motion-reduce:hidden">Scroll to explore ↓</span>
        </div>
        <div className="absolute bottom-5 right-5 z-30 flex items-center gap-1 rounded-full border border-white/25 bg-[#211513]/80 p-1.5 text-white backdrop-blur-md" aria-label="Hero slider controls">
          <button type="button" onClick={() => goTo((index - 1 + slides.length) % slides.length)} aria-label="Previous slide" className="rounded-full p-2 hover:bg-white/20 focus-visible:outline-2"><ChevronLeft size={18} /></button>
          <span className="min-w-12 text-center text-xs tabular-nums" aria-live="polite">{String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
          <button type="button" onClick={() => goTo((index + 1) % slides.length)} aria-label="Next slide" className="rounded-full p-2 hover:bg-white/20 focus-visible:outline-2"><ChevronRight size={18} /></button>
          <button type="button" onClick={() => setPlaying(value => !value)} aria-label={playing ? 'Pause slider' : 'Play slider'} className="rounded-full p-2 hover:bg-white/20 focus-visible:outline-2">{playing ? <Pause size={16} /> : <Play size={16} />}</button>
        </div>
      </div>
    </section>
  );
}
