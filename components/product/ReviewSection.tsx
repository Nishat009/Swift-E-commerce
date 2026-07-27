'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ProductReview, RatingDistribution } from '@/types';
import RatingStars from '@/components/ui/RatingStars';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ThumbsUp, CheckCircle, MessageSquarePlus, User } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const distribution = ratingDistribution || {
    5: Math.round(reviewCount * 0.7),
    4: Math.round(reviewCount * 0.2),
    3: Math.round(reviewCount * 0.07),
    2: Math.round(reviewCount * 0.02),
    1: Math.round(reviewCount * 0.01),
  };

  const handleHelpfulClick = (reviewId: string) => {
    if (typeof window === 'undefined') return;
    const votedStored = localStorage.getItem('voted-helpful-reviews') || '[]';
    let votedList: string[] = [];
    try {
      votedList = JSON.parse(votedStored);
    } catch {
      votedList = [];
    }
    if (votedList.includes(reviewId)) {
      return; // Already upvoted in session
    }
    localStorage.setItem('voted-helpful-reviews', JSON.stringify([...votedList, reviewId]));
    setHelpfulCounts((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1,
    }));
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

  // Aggregate all uploaded review photos
  const customerPhotos = React.useMemo(() => {
    return reviews.flatMap((r) => r.images || []);
  }, [reviews]);

  return (
    <div className={cn('space-y-8', className)}>
      {/* Overview & Distribution Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150/40 dark:border-gray-800 rounded-[32px] p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          
          {/* Rating Score Summary */}
          <div className="text-center lg:border-r border-gray-100 dark:border-gray-800 lg:pr-8 space-y-2">
            <span className="text-5xl font-black font-serif text-gray-900 dark:text-white leading-none">
              {rating.toFixed(1)}
            </span>
            <div className="flex justify-center">
              <RatingStars rating={rating} size="lg" />
            </div>
            <p className="text-xs font-bold text-text-muted">
              Based on {reviewCount} verified buyer reviews
            </p>
          </div>

          {/* 5 to 1 Star Progress Breakdown Bars */}
          <div className="lg:col-span-2 space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = distribution[stars as keyof RatingDistribution] || 0;
              const percentage = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-8 text-right font-bold text-gray-700 dark:text-gray-300 font-mono">
                    {stars} ★
                  </span>
                  <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-left font-mono font-bold text-text-muted text-[10px]">
                    {percentage}% ({count})
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Sentiment Summarizer Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
          <div className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-2">
            <span className="block text-[10px] font-black uppercase text-amber-600 tracking-wider">
              ✨ AI Sentiment Analysis Summary
            </span>
            <p className="text-xs font-bold text-gray-900 dark:text-white capitalize">{aiSummary.sentiment}</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex flex-wrap gap-1.5 pt-1">
                {aiSummary.pros.map((p, idx) => (
                  <span key={idx} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                    ✓ {p}
                  </span>
                ))}
                {aiSummary.cons.map((c, idx) => (
                  <span key={idx} className="bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded text-[10px] font-bold">
                    ⚠ {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Reviews Shared Photos strip */}
          <div className="bg-gray-50 dark:bg-gray-950 border rounded-2xl p-4 flex flex-col justify-between">
            <span className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">
              📸 Customer Outfit Gallery ({customerPhotos.length} photos)
            </span>
            {customerPhotos.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto py-1.5 scrollbar-none">
                {customerPhotos.map((url, idx) => (
                  <div key={idx} className="relative w-12 h-12 rounded-lg border bg-white dark:bg-gray-900 overflow-hidden flex-shrink-0">
                    <img src={url} alt={`Buyer upload ${idx + 1}`} className="object-cover w-full h-full" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-text-muted italic py-3 text-center">No images shared by buyers yet.</p>
            )}
          </div>
        </div>

        {/* Write a Review Button */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h4 className="text-sm font-bold font-serif text-gray-900 dark:text-white">
              Customer Feedback & Reviews
            </h4>
            <p className="text-xs text-text-muted">
              Have you purchased this item? Share your opinion with our community.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowForm(!showForm)}
            className="rounded-full text-xs font-bold py-2 px-5 flex items-center gap-2"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>{showForm ? 'Cancel Review' : 'Write a Review'}</span>
          </Button>
        </div>
      </div>

      {/* Review Form Drawer */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-[32px] p-6 space-y-4 shadow-inner">
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
            Write Your Verified Product Review
          </h4>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Your Overall Rating
            </label>
            <RatingStars rating={userRating} interactive onChange={setUserRating} size="lg" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Your Review & Comments
            </label>
            <textarea
              required
              rows={3}
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              placeholder="Tell others about the quality, fit, design, and performance of this item..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/40 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
              <span>Attach Review Photo URLs (optional)</span>
              <span className="text-[9px] text-text-muted normal-case font-normal">Separate multiple URLs with commas</span>
            </label>
            <input
              type="text"
              value={userImagesText}
              onChange={(e) => setUserImagesText(e.target.value)}
              placeholder="e.g. https://images.unsplash.com/photo-1, https://images.unsplash.com/photo-2"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/40 outline-none font-mono"
            />
          </div>

          <Button
            type="submit"
            loading={isSubmitting}
            className="bg-[#8b6f47] text-white rounded-full text-xs font-bold px-6 py-2.5"
          >
            Submit Verified Review
          </Button>
        </form>
      )}

      {/* Verified Reviews Cards List */}
      <div className="space-y-4">
        {reviews.map((rev) => {
          const currentHelpful = (rev.helpfulCount || 0) + (helpfulCounts[rev.id] || 0);
          return (
            <div
              key={rev.id}
              className="bg-white dark:bg-gray-900 border border-gray-150/40 dark:border-gray-800 rounded-3xl p-6 space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-sm text-[#8b6f47]">
                    {rev.userAvatar ? (
                      <Image src={rev.userAvatar} alt={rev.userName} fill className="object-cover" />
                    ) : (
                      rev.userName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-900 dark:text-white font-serif">
                        {rev.userName}
                      </span>
                      {rev.verified && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" /> Verified Buyer
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-text-muted">{rev.date}</span>
                  </div>
                </div>

                <RatingStars rating={rev.rating} size="sm" />
              </div>

              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-normal">
                {rev.comment}
              </p>

              {rev.images && rev.images.length > 0 && (
                <div className="flex gap-2 pt-1 flex-wrap">
                  {rev.images.map((imgUrl, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl border bg-gray-50 overflow-hidden flex-shrink-0">
                      <img src={imgUrl} alt={`Review photo ${idx + 1}`} className="object-cover w-full h-full" />
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-[11px] text-text-muted border-t border-gray-100 dark:border-gray-800/60">
                <span>Was this review helpful?</span>
                <button
                  type="button"
                  onClick={() => handleHelpfulClick(rev.id)}
                  className="flex items-center gap-1 hover:text-[#8b6f47] transition cursor-pointer font-bold"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Helpful ({currentHelpful})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
