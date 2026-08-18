'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface Category {
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

interface CategoryDesignSliderProps {
  categories: Category[];
  allProducts?: any[]; // Kept for interface compatibility, not needed for categories display
}

export default function CategoryDesignSlider({ categories }: CategoryDesignSliderProps) {
  const router = useRouter();
  const [slides, setSlides] = useState<Category[][]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [hoveredWedgeIndex, setHoveredWedgeIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  // Chunk and prepare categories into slides of exactly 4
  useEffect(() => {
    if (!categories || !Array.isArray(categories) || categories.length === 0) return;

    // Filter out categories without images or names
    const validCats = categories.filter(c => c.name);
    if (validCats.length === 0) return;

    const chunked: Category[][] = [];
    for (let i = 0; i < validCats.length; i += 4) {
      const chunk = validCats.slice(i, i + 4);
      
      // If the last chunk is smaller than 4, pad it from the beginning to maintain balance
      const paddedChunk = [...chunk];
      let padIdx = 0;
      while (paddedChunk.length < 4) {
        const padCat = validCats[padIdx % validCats.length];
        // Only pad if it is not already in this chunk (or if it's the only category)
        if (!paddedChunk.some(c => c.slug === padCat.slug) || paddedChunk.length === chunk.length) {
          paddedChunk.push(padCat);
        }
        padIdx++;
      }
      chunked.push(paddedChunk);
    }

    setSlides(chunked);
    setActiveSlideIndex(0);
    setHoveredWedgeIndex(null);
  }, [categories]);

  if (slides.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b6f47]"></div>
      </div>
    );
  }

  const activeCategories = slides[activeSlideIndex];

  const handleNext = () => {
    setDirection('next');
    setActiveSlideIndex((prev) => (prev + 1) % slides.length);
    setHoveredWedgeIndex(null);
  };

  const handlePrev = () => {
    setDirection('prev');
    setActiveSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setHoveredWedgeIndex(null);
  };

  // SVG Geometry Constants
  const SVG_WIDTH = 800;
  const SVG_HEIGHT = 420;
  const CX = 400;
  const CY = 410;
  const R_OUTER = 390;
  const R_INNER = 140;

  // Wedges: 4 sectors spanning top half (180 to 360 degrees)
  const wedgeAngles = [
    { start: 180.5, end: 223.5 }, // Wedge 1 (left)
    { start: 225.5, end: 268.5 }, // Wedge 2 (center-left)
    { start: 270.5, end: 313.5 }, // Wedge 3 (center-right)
    { start: 315.5, end: 358.5 }, // Wedge 4 (right)
  ];

  // Helper to calculate SVG wedge path
  const getWedgePath = (start: number, end: number) => {
    const rad = Math.PI / 180;
    const x1_outer = CX + R_OUTER * Math.cos(start * rad);
    const y1_outer = CY + R_OUTER * Math.sin(start * rad);
    const x2_outer = CX + R_OUTER * Math.cos(end * rad);
    const y2_outer = CY + R_OUTER * Math.sin(end * rad);

    const x1_inner = CX + R_INNER * Math.cos(end * rad);
    const y1_inner = CY + R_INNER * Math.sin(end * rad);
    const x2_inner = CX + R_INNER * Math.cos(start * rad);
    const y2_inner = CY + R_INNER * Math.sin(start * rad);

    return `M ${x1_outer} ${y1_outer} A ${R_OUTER} ${R_OUTER} 0 0 1 ${x2_outer} ${y2_outer} L ${x1_inner} ${y1_inner} A ${R_INNER} ${R_INNER} 0 0 0 ${x2_inner} ${y2_inner} Z`;
  };

  // Helper to calculate wedge center for rendering image and offset
  const getWedgeCenter = (start: number, end: number) => {
    const midAngle = (start + end) / 2;
    const midRadius = (R_INNER + R_OUTER) / 2;
    const rad = Math.PI / 180;
    return {
      x: CX + midRadius * Math.cos(midAngle * rad),
      y: CY + midRadius * Math.sin(midAngle * rad),
    };
  };

  // 180 Degree spin variants rotating around the central bottom point (CX, CY)
  const spinVariants = {
    initial: (dir: 'next' | 'prev') => ({
      rotate: dir === 'next' ? -180 : 180,
      opacity: 0,
      scale: 0.85,
    }),
    animate: {
      rotate: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: 'next' | 'prev') => ({
      rotate: dir === 'next' ? 180 : -180,
      opacity: 0,
      scale: 0.85,
    }),
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 select-none">
      
      {/* 1. Elegant Animated Header (Perfect Harmony slogan) */}
      <div className="text-center flex flex-col items-center justify-center mb-8 sm:mb-12">
        <span className="text-xs font-bold tracking-widest uppercase text-[#8b6f47] dark:text-[#c9a96b] mb-2.5">
          Explore Curated Categories
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[42px] text-zinc-900 dark:text-zinc-50 leading-tight tracking-tight whitespace-normal sm:whitespace-nowrap">
          Where design meets lifestyle in{' '}
          <span className="font-serif italic text-[#8b6f47] dark:text-[#c9a96b] font-medium pr-1">
            perfect harmony
          </span>
          .
        </h2>
      </div>

      {/* 2. Interactive SVG Semi-Circle Wheel */}
      <div className="relative w-full max-w-4xl mx-auto overflow-hidden pb-[40px] md:pb-[60px]">
        
        {/* Navigation Arrows on the sides of the wheel */}
        {slides.length > 1 && (
          <>
            <div className="absolute top-[40%] left-0 z-30">
              <button
                onClick={handlePrev}
                className="w-12 h-12 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 text-zinc-800 dark:text-zinc-200 flex items-center justify-center hover:bg-[#8b6f47] hover:text-white dark:hover:bg-[#c9a96b] dark:hover:text-zinc-950 transition-all duration-300 shadow-md"
                aria-label="Previous categories"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
            <div className="absolute top-[40%] right-0 z-30">
              <button
                onClick={handleNext}
                className="w-12 h-12 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 text-zinc-800 dark:text-zinc-200 flex items-center justify-center hover:bg-[#8b6f47] hover:text-white dark:hover:bg-[#c9a96b] dark:hover:text-zinc-950 transition-all duration-300 shadow-md"
                aria-label="Next categories"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </>
        )}

        {/* SVG Drawing */}
        <div className="relative w-full aspect-[2/1.05] overflow-visible">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full h-auto overflow-visible filter drop-shadow-xl"
          >
            <defs>
              {/* Generate clip paths for each wedge */}
              {wedgeAngles.map((angles, index) => (
                <clipPath key={index} id={`clip-wedge-${index}`}>
                  <path d={getWedgePath(angles.start, angles.end)} />
                </clipPath>
              ))}
            </defs>

            {/* Base grid and wedges */}
            <g className="origin-bottom-center">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.g
                  key={activeSlideIndex}
                  custom={direction}
                  variants={spinVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                  style={{ originX: `${CX}px`, originY: `${CY}px` }}
                >
                  {activeCategories.map((category, index) => {
                    const angles = wedgeAngles[index];
                    const wedgePath = getWedgePath(angles.start, angles.end);
                    const center = getWedgeCenter(angles.start, angles.end);
                    const isHovered = hoveredWedgeIndex === index;

                    return (
                      <g
                        key={category.slug || index}
                        className="cursor-pointer group"
                        onMouseEnter={() => setHoveredWedgeIndex(index)}
                        onMouseLeave={() => setHoveredWedgeIndex(null)}
                        onClick={() => router.push(`/products?category=${category.slug}`)}
                      >
                        {/* Background Wedge Segment */}
                        <motion.path
                          d={wedgePath}
                          animate={{
                            fill: isHovered ? '#fdfbf7' : '#f5f5f7',
                          }}
                          transition={{ duration: 0.2 }}
                          className="dark:fill-zinc-900/60 dark:group-hover:fill-zinc-800/80 stroke-[1.5] stroke-white dark:stroke-zinc-950"
                        />

                        {/* Category Image within Wedge */}
                        <g clipPath={`url(#clip-wedge-${index})`}>
                          <motion.g
                            animate={{
                              scale: isHovered ? 1.08 : 1,
                              x: isHovered ? (center.x - CX) * 0.05 : 0,
                              y: isHovered ? (center.y - CY) * 0.05 : 0,
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                            style={{ originX: `${center.x}px`, originY: `${center.y}px` }}
                          >
                            <image
                              href={category.image || 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop'}
                              x={center.x - 110}
                              y={center.y - 110}
                              width="220"
                              height="220"
                              preserveAspectRatio="xMidYMid slice"
                            />
                            {/* Dark Overlay for contrast when not hovered */}
                            <path
                              d={wedgePath}
                              className="fill-black/[0.02] dark:fill-white/[0.01] pointer-events-none transition-opacity duration-350 group-hover:opacity-0"
                            />
                          </motion.g>
                        </g>

                        {/* White inner border highlight on hover */}
                        <motion.path
                          d={wedgePath}
                          fill="transparent"
                          animate={{
                            stroke: isHovered ? '#8b6f47' : 'transparent',
                          }}
                          transition={{ duration: 0.2 }}
                          className="stroke-[2px] pointer-events-none"
                        />
                      </g>
                    );
                  })}
                </motion.g>
              </AnimatePresence>
            </g>

            {/* Central Hollow Cutout Cover (Circle) */}
            <circle
              cx={CX}
              cy={CY}
              r={R_INNER}
              className="fill-white dark:fill-zinc-950 stroke-white dark:stroke-zinc-950"
            />
          </svg>

          {/* 3. Center Dashboard inside Hollow cutout */}
          <div
            className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 flex flex-col items-center justify-end z-20 text-center"
            style={{ width: `${R_INNER * 2 - 10}px`, height: `${R_INNER - 10}px` }}
          >
            <div className="pb-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlideIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-0.5"
                >
                  <span className="block text-[11px] uppercase tracking-widest text-[#8b6f47] dark:text-[#c9a96b] font-black">
                    Explore
                  </span>
                  <Link
                    href="/products"
                    className="group inline-flex items-center gap-1 font-serif text-sm font-bold text-zinc-800 dark:text-zinc-200 hover:text-[#8b6f47] dark:hover:text-[#c9a96b] transition-colors"
                  >
                    Catalog <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Hover details / Tooltip card (displays details of the hovered wedge category) */}
      <div className="h-[75px] flex items-center justify-center mt-2">
        <AnimatePresence mode="wait">
          {hoveredWedgeIndex !== null && activeCategories[hoveredWedgeIndex] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-md max-w-xl cursor-pointer hover:border-[#8b6f47] transition-colors"
              onClick={() => router.push(`/products?category=${activeCategories[hoveredWedgeIndex].slug}`)}
            >
              <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-zinc-100 dark:border-zinc-800">
                <Image
                  src={activeCategories[hoveredWedgeIndex].image || 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=100&h=100&fit=crop'}
                  alt="Category Image"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-left leading-tight">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-150">
                  {activeCategories[hoveredWedgeIndex].name}
                </p>
                <p className="text-[10px] text-zinc-400 font-medium line-clamp-1 max-w-sm mt-0.5">
                  {activeCategories[hoveredWedgeIndex].description || `Explore our high-quality collection of ${activeCategories[hoveredWedgeIndex].name}.`}
                </p>
              </div>
              <span className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />
              <span className="text-xs font-serif font-black text-[#8b6f47] dark:text-[#c9a96b] flex items-center gap-1">
                Shop Category <ArrowRight className="w-3 h-3" />
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. Pagination Indicator Dots */}
      {slides.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > activeSlideIndex ? 'next' : 'prev');
                setActiveSlideIndex(index);
                setHoveredWedgeIndex(null);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === activeSlideIndex
                  ? 'w-6 bg-[#8b6f47] dark:bg-[#c9a96b]'
                  : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
