'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  interactive?: boolean;
  onChange?: (newRating: number) => void;
  showScore?: boolean;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function RatingStars({
  rating,
  maxRating = 5,
  interactive = false,
  onChange,
  showScore = false,
  reviewCount,
  size = 'md',
  className,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const currentDisplayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= Math.floor(currentDisplayRating);
          const isHalf = starValue > Math.floor(currentDisplayRating) && starValue <= Math.ceil(currentDisplayRating) && currentDisplayRating % 1 !== 0;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={cn(
                'focus:outline-none transition-transform',
                interactive ? 'cursor-pointer hover:scale-115' : 'cursor-default'
              )}
            >
              <Star
                className={cn(
                  starSizes[size],
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : isHalf
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'text-gray-300 dark:text-gray-700'
                )}
              />
            </button>
          );
        })}
      </div>

      {showScore && (
        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
          {rating.toFixed(1)}
        </span>
      )}

      {reviewCount !== undefined && (
        <span className="text-[11px] text-text-muted font-normal">
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}
