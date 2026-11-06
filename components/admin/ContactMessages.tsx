'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { RefreshCw, Mail, Trash2, Archive, CheckCheck, Reply } from 'lucide-react';
import { errMsg } from './adminUtils';
import { usePagedInbox } from './usePagedInbox';
import { AdminButton, AdminEmpty, FilterTabs, Pill, SectionHeader } from './AdminUI';

type Status = 'unread' | 'read' | 'replied' | 'archived';

interface Msg {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: Status;
  createdAt: string;
}

const FILTERS: { value: Status | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
  { value: 'archived', label: 'Archived' },
];

const badge: Record<Status, { label: string; tone: 'warning' | 'neutral' | 'success' }> = {
  unread: { label: 'Unread', tone: 'warning' },
  read: { label: 'Read', tone: 'neutral' },
  replied: { label: 'Replied', tone: 'success' },
  archived: { label: 'Archived', tone: 'neutral' },
};

export default function ContactMessages({ onUnreadChange }: { onUnreadChange?: (n: number) => void }) {
  const toast = useToast();
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const {
    items: messages, total, hasMore, unreadCount, loading, error, reload: load, loadMore, refreshUnread, updateLocal, removeLocal,
  } = usePagedInbox<Msg>('/contact', filter === 'all' ? undefined : filter);
  const [openId, setOpenId] = useState<string | null>(null);

  // Keep the sidebar badge in step with the server's unread count
  useEffect(() => { onUnreadChange?.(unreadCount); }, [unreadCount, onUnreadChange]);

  const setStatus = async (id: string, status: Status) => {
    try {
      await apiClient.put('/contact/' + id, { status });
      // Under a status filter, a message that no longer matches leaves the list
      if (filter !== 'all' && status !== filter) removeLocal(id);
      else updateLocal(id, { status });
      await refreshUnread();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this message permanently?')) return;
    try {
      await apiClient.delete('/contact/' + id);
      toast.success('Message deleted');
      removeLocal(id);
      await refreshUnread();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const toggle = (m: Msg) => {
    const opening = openId !== m.id;
    setOpenId(opening ? m.id : null);
    if (opening && m.status === 'unread') setStatus(m.id, 'read');
  };

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Contact messages"
        description="Sent through the contact form. Open one to read it; replying opens your email app."
        actions={
          <AdminButton size="sm" onClick={load}>
            <RefreshCw className={'size-3.5 ' + (loading ? 'animate-spin' : '')} /> Refresh
          </AdminButton>
        }
      />

      <FilterTabs options={FILTERS} value={filter} onChange={setFilter} className="w-fit max-w-full" />

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{error}</p>
      )}

      {!loading && !error && messages.length === 0 ? (
        <div className="rounded-lg border border-line">
          <AdminEmpty icon={Mail} title="No messages here" description={filter !== 'all' ? 'Try a different filter.' : 'Messages from the contact form will appear here.'} />
        </div>
      ) : messages.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
          {messages.map((m) => {
            const open = openId === m.id;
            const unread = m.status === 'unread';
            return (
              <li key={m.id} className={open ? 'bg-stone-50/60 dark:bg-white/[0.02]' : undefined}>
                <button
                  type="button"
                  onClick={() => toggle(m)}
                  aria-expanded={open}
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50 dark:hover:bg-white/[0.03] cursor-pointer"
                >
                  <span className="flex min-w-0 items-start gap-2.5">
                    <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${unread ? 'bg-[#8b6f47] dark:bg-[#c9a96b]' : 'bg-transparent'}`} aria-hidden />
                    <span className="min-w-0">
                      <span className={`block truncate text-sm ${unread ? 'font-semibold text-stone-900 dark:text-white' : 'font-medium text-stone-700 dark:text-stone-300'}`}>{m.subject}</span>
                      <span className="block truncate text-xs text-stone-500 dark:text-stone-400">
                        {m.name} &middot; {m.email} &middot; {new Date(m.createdAt).toLocaleString()}
                      </span>
                    </span>
                  </span>
                  <Pill tone={badge[m.status].tone} className="shrink-0">{badge[m.status].label}</Pill>
                </button>
                {open && (
                  <div className="space-y-3 px-4 pb-4 pl-8">
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-stone-700 dark:text-stone-300">{m.message}</p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.subject)}`}
                        onClick={() => m.status !== 'replied' && setStatus(m.id, 'replied')}
                        className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg bg-stone-900 px-3 text-xs font-medium text-white shadow-xs transition-colors hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
                      >
                        <Reply className="size-3.5" /> Reply by email
                      </a>
                      {m.status !== 'unread' && (
                        <AdminButton size="sm" onClick={() => setStatus(m.id, 'unread')}>
                          <CheckCheck className="size-3.5" /> Mark unread
                        </AdminButton>
                      )}
                      {m.status !== 'archived' && (
                        <AdminButton size="sm" onClick={() => setStatus(m.id, 'archived')}>
                          <Archive className="size-3.5" /> Archive
                        </AdminButton>
                      )}
                      <AdminButton size="sm" variant="danger" onClick={() => remove(m.id)}>
                        <Trash2 className="size-3.5" /> Delete
                      </AdminButton>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {hasMore && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-stone-500 dark:text-stone-400">Showing {messages.length} of {total}</p>
          <AdminButton size="sm" onClick={loadMore} disabled={loading}>
            {loading ? 'Loading…' : 'Load more'}
          </AdminButton>
        </div>
      )}
    </section>
  );
}

/** Unread count for the sidebar badge; fetched once on mount, updated by the tab. */
export function useContactUnread(enabled: boolean): [number, (n: number) => void] {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    Promise.all([
      apiClient.get('/contact', { params: { status: 'unread' } }),
      apiClient.get('/chat', { params: { status: 'unread' } }),
    ])
      .then(([contact, chat]) => setCount((contact.data?.unreadCount ?? 0) + (chat.data?.unreadCount ?? 0)))
      .catch(() => {});
  }, [enabled]);
  return [count, setCount];
}
