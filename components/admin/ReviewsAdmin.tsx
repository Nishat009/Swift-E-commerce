'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { Star, Trash2 } from 'lucide-react';
import { SectionLoading, useSectionLoad } from './AdminSection';
import { AdminButton, AdminEmpty, SearchField, table } from './AdminUI';

export default function ReviewsAdmin() {
  const toast = useToast();
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [reviewSearch, setReviewSearch] = useState('');

  const loading = useSectionLoad(async () => {
    const res = await apiClient.get('/reviews');
    if (res.data?.success) setAllReviews(res.data.data || []);
  });

  if (loading) return <SectionLoading />;

  const filteredReviews = allReviews.filter((r) =>
    (r.userName || '').toLowerCase().includes(reviewSearch.toLowerCase()) ||
    (r.review || r.comment || '').toLowerCase().includes(reviewSearch.toLowerCase()) ||
    (r.product?.title || '').toLowerCase().includes(reviewSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <SearchField
        value={reviewSearch}
        onChange={setReviewSearch}
        placeholder="Search by customer, comment or product"
        className="w-full sm:w-96"
      />

      <div className={`${table.wrap} max-h-[640px] overflow-y-auto`}>
        <table className={table.table}>
          <thead className={`${table.thead} sticky top-0 z-10`}>
            <tr>
              <th className={table.th}>Product</th>
              <th className={table.th}>Customer</th>
              <th className={table.th}>Rating</th>
              <th className={table.th}>Comment</th>
              <th className={table.th}>Date</th>
              <th className={table.th}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className={table.tbody}>
            {filteredReviews.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <AdminEmpty
                    icon={Star}
                    title="No reviews found"
                    description={reviewSearch ? 'Try a different search.' : 'Customer reviews will appear here.'}
                  />
                </td>
              </tr>
            )}
            {filteredReviews.map((r) => (
              <tr key={r.id} className={table.tr}>
                <td className={table.td}>
                  <span className="block max-w-[180px] truncate font-medium text-stone-900 dark:text-stone-100" title={r.product?.title}>
                    {r.product?.title || 'Unknown product'}
                  </span>
                </td>
                <td className={table.td}>
                  <span className="block font-medium text-stone-800 dark:text-stone-200">{r.userName || (r.user as any)?.name}</span>
                  <span className="block text-xs text-stone-400">{(r.user as any)?.email}</span>
                </td>
                <td className={table.td}>
                  <span className="inline-flex items-center gap-1 whitespace-nowrap tabular-nums text-stone-800 dark:text-stone-200" aria-label={`${r.rating} out of 5`}>
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{r.rating}</span>
                    <span className="text-xs text-stone-400">/ 5</span>
                  </span>
                </td>
                <td className={`${table.td} max-w-xs truncate text-stone-600 dark:text-stone-300`} title={r.review || r.comment}>
                  {r.review || r.comment}
                </td>
                <td className={`${table.td} whitespace-nowrap text-xs text-stone-500 dark:text-stone-400`}>
                  {new Date(r.createdAt || r.date).toLocaleDateString()}
                </td>
                <td className={`${table.td} text-right`}>
                  <AdminButton
                    variant="ghost"
                    size="sm"
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
                    className="w-8 px-0 text-stone-500 hover:bg-red-50 hover:text-red-600 dark:text-stone-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                    title="Delete review"
                    aria-label="Delete review"
                  >
                    <Trash2 className="size-3.5" />
                  </AdminButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-stone-500">Showing {filteredReviews.length} of {allReviews.length} reviews</p>
    </div>
  );
}
