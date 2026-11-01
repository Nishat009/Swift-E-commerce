'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageGalleryProps {
  images: string[];
  title: string;
  activeVariantImage?: string | null;
  className?: string;
}

export default function ImageGallery({
  images,
  title,
  activeVariantImage,
  className,
}: ImageGalleryProps) {
  const displayImages = images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=800&fit=crop'];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [showFullModal, setShowFullModal] = useState(false);
  const [is360Mode, setIs360Mode] = useState(false);

  const pointerStartX = useRef<number | null>(null);
  const pointerStartIndex = useRef<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize activeVariantImage changes to selectedIndex state
  React.useEffect(() => {
    if (activeVariantImage) {
      const idx = displayImages.indexOf(activeVariantImage);
      if (idx !== -1) {
        setSelectedIndex(idx);
      }
    }
  }, [activeVariantImage, displayImages]);

  const currentImageUrl = displayImages[selectedIndex] || displayImages[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!is360Mode) return;
    pointerStartX.current = e.clientX;
    pointerStartIndex.current = selectedIndex;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!is360Mode || pointerStartX.current === null) return;
    const deltaX = e.clientX - pointerStartX.current;
    
    // Cycle image every 20px of drag displacement
    const step = 20;
    const offset = Math.floor(deltaX / step);
    let nextIndex = (pointerStartIndex.current - offset) % displayImages.length;
    if (nextIndex < 0) {
      nextIndex += displayImages.length;
    }
    setSelectedIndex(nextIndex);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!is360Mode) return;
    pointerStartX.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Featured Main Image with Lens Zoom / 360 Mode */}
      <div
        ref={containerRef}
        onMouseEnter={() => !is360Mode && setIsHovered(true)}
        onMouseLeave={() => !is360Mode && setIsHovered(false)}
        onMouseMove={(e) => !is360Mode && handleMouseMove(e)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={() => !is360Mode && setShowFullModal(true)}
        className={cn(
          "relative w-full aspect-[4/5] overflow-hidden rounded-sm bg-stone-100 dark:bg-stone-900 select-none",
          is360Mode ? "cursor-grab active:cursor-grabbing touch-none" : "cursor-zoom-in group"
        )}
      >
        {is360Mode ? (
          <Image
            src={currentImageUrl}
            alt={title}
            fill
            priority
            draggable={false}
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="object-cover object-top pointer-events-none"
          />
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full"
            >
              <Image
                src={currentImageUrl}
                alt={title}
                fill
                priority
                draggable={false}
                sizes="(max-width: 1024px) 100vw, 58vw"
                className={cn(
                  'object-cover object-top transition-transform duration-200 ease-out pointer-events-none',
                  isHovered ? 'scale-[1.8]' : 'scale-100'
                )}
                style={
                  isHovered
                    ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` }
                    : undefined
                }
              />
            </motion.div>
          </AnimatePresence>
        )}

        {/* 360° Interaction Toggle Button */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIs360Mode(!is360Mode);
              setIsHovered(false);
            }}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide backdrop-blur-md transition-colors cursor-pointer",
              is360Mode
                ? "bg-ink text-paper"
                : "bg-paper/80 hover:bg-paper text-ink"
            )}
          >
            {is360Mode ? 'Exit 360° view' : '360° view'}
          </button>
        </div>

        {/* Interactive Badges overlay */}
        <div className="absolute bottom-4 right-4 z-20 bg-paper/80 backdrop-blur-md text-ink text-[11px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {is360Mode ? (
            <span>Drag horizontally to rotate product</span>
          ) : (
            <>
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Click to enlarge</span>
            </>
          )}
        </div>
      </div>

      {/* Thumbnails Navigation Strip */}
      {displayImages.length > 1 && (
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          {displayImages.map((img, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className="relative w-16 sm:w-20 aspect-[3/4] rounded-sm overflow-hidden flex-shrink-0 cursor-pointer bg-stone-100 dark:bg-stone-900"
                aria-label={`Show image ${idx + 1}`}
              >
                <Image src={img} alt={`${title} thumbnail ${idx + 1}`} fill sizes="80px" className="object-cover object-top" />
                {isSelected ? (
                  <motion.div
                    layoutId="activeThumbnailOutline"
                    className="absolute inset-0 border border-ink rounded-sm pointer-events-none z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-paper/40 hover:bg-transparent transition-colors" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Inspection Zoom Modal */}
      <AnimatePresence>
        {showFullModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFullModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-4xl bg-surface rounded-lg p-5 sm:p-6 shadow-2xl z-10 overflow-hidden border border-line"
            >
              <button
                onClick={() => setShowFullModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-stone-100 dark:hover:bg-white/10 rounded-full text-ink transition z-20 cursor-pointer" aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-3">
                <h3 className="font-sans text-sm font-medium text-ink">
                  {title}
                </h3>
              </div>

              <div className="relative w-full h-[70vh] max-h-[640px] rounded-sm overflow-hidden bg-stone-100 dark:bg-stone-900">
                <Image src={currentImageUrl} alt={title} fill sizes="900px" className="object-contain" />
              </div>

              {displayImages.length > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayImages.length - 1))}
                    className="flex items-center gap-1 text-sm text-stone-600 dark:text-stone-300 hover:text-ink cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  <span className="text-xs tabular-nums text-stone-500">
                    {selectedIndex + 1} / {displayImages.length}
                  </span>

                  <button
                    onClick={() => setSelectedIndex((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0))}
                    className="flex items-center gap-1 text-sm text-stone-600 dark:text-stone-300 hover:text-ink cursor-pointer"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
