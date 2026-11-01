'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { Mail, Trash2 } from 'lucide-react';
import { SectionLoading, useSectionLoad } from './AdminSection';
import { AdminButton, AdminEmpty, table } from './AdminUI';

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
      <div className={`${table.wrap} max-h-[640px] overflow-y-auto`}>
        <table className={table.table}>
          <thead className={`${table.thead} sticky top-0 z-10`}>
            <tr>
              <th className={table.th}>Email</th>
              <th className={table.th}>Subscribed</th>
              <th className={table.th}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className={table.tbody}>
            {allNewsletters.length === 0 && (
              <tr>
                <td colSpan={3}>
                  <AdminEmpty icon={Mail} title="No subscribers yet" description="People who sign up for store emails will appear here." />
                </td>
              </tr>
            )}
            {allNewsletters.map((n) => (
              <tr key={n.id || n._id} className={table.tr}>
                <td className={`${table.td} font-medium text-stone-900 dark:text-stone-100`}>{n.email}</td>
                <td className={`${table.td} whitespace-nowrap text-stone-500 dark:text-stone-400`}>{new Date(n.subscribedAt).toLocaleString()}</td>
                <td className={`${table.td} text-right`}>
                  <AdminButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSubscription(n.id || n._id)}
                    className="w-8 px-0 text-stone-500 hover:bg-red-50 hover:text-red-600 dark:text-stone-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                    title="Remove subscription"
                    aria-label={`Remove ${n.email}`}
                  >
                    <Trash2 className="size-3.5" />
                  </AdminButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-stone-500">{allNewsletters.length} {allNewsletters.length === 1 ? 'subscriber' : 'subscribers'}</p>
    </div>
  );
}
