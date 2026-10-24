'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import Input from '@/components/ui/Input';
import { Search, Star, Trash2 } from 'lucide-react';
import { SectionLoading, useSectionLoad } from './AdminSection';

export default function ReviewsAdmin() {
  const toast = useToast();
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [reviewSearch, setReviewSearch] = useState('');

  const loading = useSectionLoad(async () => {
    const res = await apiClient.get('/reviews');
    if (res.data?.success) setAllReviews(res.data.data || []);
  });

  if (loading) return <SectionLoading />;

  return (
    <div className="space-y-4">
      <div className="border-b pb-3.5 mb-4">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Product Reviews</h2>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Search reviews by customer name, comment, or product title..."
          value={reviewSearch}
          onChange={(e) => setReviewSearch(e.target.value)}
          className="w-full text-sm pl-8"
        />
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {/* Reviews Table */}
      <div className="overflow-x-auto border rounded-2xl max-h-[500px] overflow-y-auto scrollbar-thin">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px] sticky top-0 z-10">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Comment</th>
              <th className="p-3">Date</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {allReviews
              .filter((r) =>
                (r.userName || '').toLowerCase().includes(reviewSearch.toLowerCase()) ||
                (r.review || r.comment || '').toLowerCase().includes(reviewSearch.toLowerCase()) ||
                (r.product?.title || '').toLowerCase().includes(reviewSearch.toLowerCase())
              )
              .map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="p-3 font-bold text-gray-800 dark:text-gray-200">
                    <span className="block max-w-[150px] truncate">{r.product?.title || 'Unknown Product'}</span>
                  </td>
                  <td className="p-3">
                    <span className="block font-semibold text-gray-800 dark:text-gray-200">{r.userName || (r.user as any)?.name}</span>
                    <span className="block text-[10px] text-gray-400">{(r.user as any)?.email}</span>
                  </td>
                  <td className="p-3">
                    <span className="flex items-center text-yellow-500 font-bold gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-yellow-500" />
                      {r.rating}/5
                    </span>
                  </td>
                  <td className="p-3 max-w-[200px] truncate text-gray-650 dark:text-gray-300" title={r.review || r.comment}>
                    {r.review || r.comment}
                  </td>
                  <td className="p-3 text-gray-550">
                    {new Date(r.createdAt || r.date).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={async () => {
                        if (!confirm('Are you sure you want to delete this review?')) return;
                        try {
                          const res = await apiClient.delete(`/reviews/${r.id}`);
                          if (res.data?.success) {
                            setAllReviews(allReviews.filter((review) => review.id !== r.id));
                            toast.success('Review deleted successfully.');
                          }
                        } catch (err: any) {
                          toast.error(err.response?.data?.message || 'Failed to delete review.');
                        }
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      title="Delete Review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
