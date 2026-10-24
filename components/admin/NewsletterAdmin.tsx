'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { Trash2 } from 'lucide-react';
import { SectionLoading, useSectionLoad } from './AdminSection';

interface NewsletterSub {
  id: string;
  _id: string;
  email: string;
  subscribedAt: string;
}

export default function NewsletterAdmin() {
  const toast = useToast();
  const [allNewsletters, setAllNewsletters] = useState<NewsletterSub[]>([]);

  const loading = useSectionLoad(async () => {
    const res = await apiClient.get('/newsletter/subscriptions');
    if (res.data?.success) setAllNewsletters(res.data.data);
  });

  const handleDeleteSubscription = async (subId: string) => {
    if (!confirm('Remove this email subscription?')) return;
    try {
      const res = await apiClient.delete(`/newsletter/subscriptions/${subId}`);
      if (res.data?.success) {
        setAllNewsletters(allNewsletters.filter((n) => n.id !== subId && n._id !== subId));
        toast.success('Subscription removed.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete subscription.');
    }
  };

  if (loading) return <SectionLoading />;

  return (
    <div className="space-y-4">
      <div className="border-b pb-3.5 mb-4">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Newsletter Subscribers</h2>
      </div>

      <div className="overflow-x-auto border rounded-2xl max-h-[500px] overflow-y-auto scrollbar-thin">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px] sticky top-0 z-10">
            <tr>
              <th className="p-3">Email Address</th>
              <th className="p-3">Subscription Date</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {allNewsletters.map((n) => (
              <tr key={n.id || n._id} className="hover:bg-gray-50/50">
                <td className="p-3 font-mono font-bold text-gray-800 dark:text-gray-200">{n.email}</td>
                <td className="p-3 text-gray-500">{new Date(n.subscribedAt).toLocaleString()}</td>
                <td className="p-3 text-right">
                  <button onClick={() => handleDeleteSubscription(n.id || n._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Remove subscription">
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
