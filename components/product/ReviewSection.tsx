'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ProductReview, RatingDistribution } from '@/types';
import RatingStars from '@/components/ui/RatingStars';
import Button from '@/components/ui/Button';
import { ThumbsUp, CheckCircle, MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';

export interface ReviewSectionProps {
  productId: string | number;
  rating: number;
  reviewCount: number;
  ratingDistribution?: RatingDistribution;
  reviews?: (ProductReview & { images?: string[] })[];
  onSubmitReview?: (rating: number, comment: string, images?: string[]) => Promise<void>;
  className?: string;
}

export default function ReviewSection({
  rating,
  reviewCount,
  ratingDistribution,
  reviews = [],
  onSubmitReview,
  className,
}: ReviewSectionProps) {
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [userImagesText, setUserImagesText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({});
  const toast = useToast();

  // Distribution is computed from the real reviews loaded from the database
  const distribution = reviews.reduce(
    (acc, r) => {
      const key = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      acc[key] += 1;
      return acc;
    },
    { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as RatingDistribution
  );

  const handleHelpfulClick = async (reviewId: string) => {
    try {
      await apiClient.post('/reviews/' + reviewId + '/helpful');
      setHelpfulCounts((prev) => ({
        ...prev,
        [reviewId]: (prev[reviewId] || 0) + 1,
      }));
    } catch (err: any) {
      const status = err?.response?.status;
      toast.info(status === 401 ? 'Please log in to vote on reviews.' : err?.response?.data?.message || 'Could not record your vote.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userComment.trim() || !onSubmitReview) return;
    setIsSubmitting(true);
    
    // Parse commas separated image urls
    const reviewImages = userImagesText
      .split(',')
      .map((url) => url.trim())
      .filter((url) => url.startsWith('http') || url.startsWith('data:image'));

    try {
      await onSubmitReview(userRating, userComment, reviewImages);
      setUserComment('');
      setUserImagesText('');
      setUserRating(5);
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic AI Sentiment summarizer
  const aiSummary = React.useMemo(() => {
    if (reviews.length === 0) {
      return {
        sentiment: 'Neutral Sentiment',
        pros: ['Be the first to review and share details!'],
        cons: ['No issues reported'],
      };
    }
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = sum / reviews.length;
    let sentiment = 'Mostly Positive Reviews';
    if (avg >= 4.5) sentiment = 'Highly Positive Sentiment';
    else if (avg < 3.5) sentiment = 'Mixed Sentiment';

    const prosSet = new Set<string>();
    const consSet = new Set<string>();

    reviews.forEach((r) => {
      const c = r.comment.toLowerCase();
      if (c.includes('comfort') || c.includes('soft') || c.includes('fit') || c.includes('cozy')) {
        prosSet.add('Comfortable Cushioned Fit');
      }
      if (c.includes('premium') || c.includes('leather') || c.includes('wood') || c.includes('quality') || c.includes('solid')) {
        prosSet.add('Premium Material Quality');
      }
      if (c.includes('beautiful') || c.includes('looks') || c.includes('design') || c.includes('gorgeous')) {
        prosSet.add('Modern Elegant Aesthetics');
      }
      if (c.includes('large') || c.includes('wide') || c.includes('loose')) {
        consSet.add('Slightly loose fit proportions');
      }
      if (c.includes('tight') || c.includes('small')) {
        consSet.add('Slightly tighter or snug sizing');
      }
    });

    if (prosSet.size === 0) {
      prosSet.add('Stunning Design Craftsmanship');
      prosSet.add('Highly matches store descriptions');
    }
    if (consSet.size === 0) {
      consSet.add('No major design flaws reported');
    }

    return {
      sentiment,
      pros: Array.from(prosSet).slice(0, 3),
      cons: Array.from(consSet).slice(0, 2),
    };
  }, [reviews]);

  // Only reviews from customers who actually bought the item carry the verified flag
  const verifiedCount = reviews.filter((r) => r.verified).length;

  // Aggregate all uploaded review photos
  const customerPhotos = React.useMemo(() => {
    return reviews.flatMap((r) => r.images || []);
  }, [reviews]);

  const labelClass = 'block text-xs font-medium text-stone-600 dark:text-stone-300';
  const fieldClass = 'w-full rounded-md border border-line bg-transparent px-3.5 text-sm text-ink placeholder:text-stone-400 focus:border-ink focus:outline-none';

  return (
    <div className={cn('space-y-12', className)}>
      {/* Overview and distribution */}
      <div className="space-y-10">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-3 lg:gap-16">
          <div className="space-y-2 text-center lg:text-left">
            <span className="block font-serif text-6xl font-medium leading-none tracking-tight text-ink">
              {rating.toFixed(1)}
            </span>
            <div className="flex justify-center lg:justify-start">
              <RatingStars rating={rating} size="lg" />
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              {verifiedCount > 0 && ` (${verifiedCount} from verified buyers)`}
            </p>
          </div>

          <div className="space-y-2.5 lg:col-span-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = distribution[stars as keyof RatingDistribution] || 0;
              const percentage = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-8 text-right tabular-nums text-stone-600 dark:text-stone-300">{stars} ★</span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                    <div className="h-full rounded-full bg-ink transition-all duration-500" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="w-16 text-left tabular-nums text-stone-500">
                    {percentage}% ({count})
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 border-t border-line pt-8 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Review highlights</p>
            <p className="text-sm font-medium text-ink">{aiSummary.sentiment}</p>
            <ul className="space-y-1.5 text-sm text-stone-600 dark:text-stone-400">
              {aiSummary.pros.map((p, idx) => (
                <li key={`pro-${idx}`} className="flex items-start gap-2">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-ink" aria-hidden="true" />
                  {p}
                </li>
              ))}
              {aiSummary.cons.map((c, idx) => (
                <li key={`con-${idx}`} className="flex items-start gap-2">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-stone-400" aria-hidden="true" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
              Customer photos ({customerPhotos.length})
            </p>
            {customerPhotos.length > 0 ? (
              <div className="no-scrollbar flex gap-2 overflow-x-auto py-0.5">
                {customerPhotos.map((url, idx) => (
                  <div key={idx} className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-sm bg-surface-muted">
                    <img src={url} alt={`Buyer upload ${idx + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-500 dark:text-stone-400">No images shared by buyers yet.</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
          <div>
            <h3 className="font-serif text-xl font-medium tracking-tight text-ink">Customer feedback</h3>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Have you purchased this item? Share your opinion with our community.
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowForm(!showForm)}>
            <MessageSquarePlus className="size-4" />
            <span>{showForm ? 'Cancel Review' : 'Write a Review'}</span>
          </Button>
        </div>
      </div>

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-line p-6">
          <h3 className="font-serif text-xl font-medium tracking-tight text-ink">Write your review</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Reviews from customers who bought this item are marked &ldquo;Verified Buyer&rdquo;.
          </p>

          <div className="space-y-1.5">
            <label className={labelClass}>Your overall rating</label>
            <RatingStars rating={userRating} interactive onChange={setUserRating} size="lg" />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Your review and comments</label>
            <textarea
              required
              rows={4}
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              placeholder="Tell others about the quality, fit, design, and performance of this item..."
              className={`${fieldClass} py-3`}
            />
          </div>

          <div className="space-y-1.5">
            <label className={`${labelClass} flex flex-wrap items-center justify-between gap-x-3`}>
              <span>Attach review photo URLs (optional)</span>
              <span className="text-[11px] font-normal text-stone-500">Separate multiple URLs with commas</span>
            </label>
            <input
              type="text"
              value={userImagesText}
              onChange={(e) => setUserImagesText(e.target.value)}
              placeholder="e.g. https://example.com/photo-1.jpg, https://example.com/photo-2.jpg"
              className={`${fieldClass} h-11`}
            />
          </div>

          <Button type="submit" loading={isSubmitting} size="lg">
            Submit Review
          </Button>
        </form>
      )}

      {/* Reviews list */}
      {reviews.length > 0 && (
        <ul className="divide-y divide-line border-y border-line">
          {reviews.map((rev) => {
            const currentHelpful = (rev.helpfulCount || 0) + (helpfulCounts[rev.id] || 0);
            return (
              <li key={rev.id} className="space-y-3 py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-sm font-medium text-ink">
                      {rev.userAvatar ? (
                        <Image src={rev.userAvatar} alt={rev.userName} fill className="object-cover" />
                      ) : (
                        (rev.userName || '?').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-sm font-medium text-ink">{rev.userName}</span>
                        {rev.verified && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-stone-500">
                            <CheckCircle className="size-3 text-ink" /> Verified Buyer
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-stone-500">{rev.date ? new Date(rev.date).toLocaleDateString() : ''}</span>
                    </div>
                  </div>

                  <RatingStars rating={rev.rating} size="sm" />
                </div>

                <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">{rev.comment}</p>

                {rev.images && rev.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {rev.images.map((imgUrl, idx) => (
                      <div key={idx} className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-sm bg-surface-muted">
                        <img src={imgUrl} alt={`Review photo ${idx + 1}`} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-xs text-stone-500">
                  <span>Was this review helpful?</span>
                  <button
                    type="button"
                    onClick={() => handleHelpfulClick(rev.id)}
                    className="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-ink"
                  >
                    <ThumbsUp className="size-3.5" />
                    <span>Helpful ({currentHelpful})</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
