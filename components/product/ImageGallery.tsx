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
    <div className={cn('space-y-4', className)}>
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
          "relative w-full h-[420px] sm:h-[500px] rounded-[32px] overflow-hidden bg-gray-50 dark:bg-gray-950 border border-gray-150/50 dark:border-gray-800 shadow-sm select-none",
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
            className="object-contain pointer-events-none"
          />
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full"
            >
              <Image
                src={currentImageUrl}
                alt={title}
                fill
                priority
                draggable={false}
                className={cn(
                  'object-contain transition-transform duration-200 ease-out pointer-events-none',
                  isHovered ? 'scale-175' : 'scale-100'
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
              "px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md backdrop-blur-md transition-colors cursor-pointer border",
              is360Mode
                ? "bg-[#8b6f47] text-white border-[#8b6f47]"
                : "bg-white/70 dark:bg-gray-900/70 hover:bg-white/90 text-gray-850 dark:text-white border-gray-250/20 dark:border-gray-800"
            )}
          >
            🔄 {is360Mode ? 'Standard Photo' : 'Interactive 360°'}
          </button>
        </div>

        {/* Interactive Badges overlay */}
        <div className="absolute bottom-4 right-4 z-20 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none">
          {is360Mode ? (
            <span>Drag horizontally to rotate product</span>
          ) : (
            <>
              <ZoomIn className="w-3.5 h-3.5" />
              <span>{isHovered ? 'Hovering Zoom' : 'Click to Enlarge'}</span>
            </>
          )}
        </div>
      </div>

      {/* Thumbnails Navigation Strip */}
      {displayImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto py-1.5 scrollbar-none">
          {displayImages.map((img, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer"
              >
                <Image src={img} alt={`${title} thumbnail ${idx + 1}`} fill className="object-cover" />
                {isSelected ? (
                  <motion.div
                    layoutId="activeThumbnailOutline"
                    className="absolute inset-0 border-[2.5px] border-[#8b6f47] dark:border-[#c9a96b] rounded-2xl pointer-events-none z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-black/5 dark:bg-white/5 opacity-40 hover:opacity-0 transition-opacity rounded-2xl" />
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
              className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-[32px] p-6 shadow-2xl z-10 overflow-hidden border border-gray-200 dark:border-gray-800"
            >
              <button
                onClick={() => setShowFullModal(false)}
                className="absolute top-4 right-4 p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-700 dark:text-gray-200 transition z-20 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-3">
                <span className="text-[10px] font-black uppercase text-[#8b6f47] dark:text-[#c9a96b] tracking-widest">
                  High-Definition Inspection
                </span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white font-serif mt-0.5">
                  {title}
                </h3>
              </div>

              <div className="relative w-full h-[540px] rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-950">
                <Image src={currentImageUrl} alt={title} fill className="object-contain" />
              </div>

              {displayImages.length > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayImages.length - 1))}
                    className="flex items-center gap-1 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-[#8b6f47] cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  <span className="text-xs font-bold text-text-muted">
                    {selectedIndex + 1} of {displayImages.length}
                  </span>

                  <button
                    onClick={() => setSelectedIndex((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0))}
                    className="flex items-center gap-1 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-[#8b6f47] cursor-pointer"
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
