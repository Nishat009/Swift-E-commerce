'use client';

import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import { RefreshCw, Mail, Trash2, Archive, CheckCheck, Reply } from 'lucide-react';
import { errMsg } from './adminUtils';

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

const FILTERS: { id: Status | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'read', label: 'Read' },
  { id: 'replied', label: 'Replied' },
  { id: 'archived', label: 'Archived' },
];

const badge: Record<Status, string> = {
  unread: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  read: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  replied: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  archived: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

export default function ContactMessages({ onUnreadChange }: { onUnreadChange?: (n: number) => void }) {
  const toast = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/contact', { params: filter === 'all' ? {} : { status: filter } });
      setMessages(res.data?.data || []);
      onUnreadChange?.(res.data?.unreadCount ?? 0);
    } catch (err) {
      setError(errMsg(err, 'Failed to load messages.'));
    } finally {
      setLoading(false);
    }
  }, [filter, onUnreadChange]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: string, status: Status) => {
    try {
      await apiClient.put('/contact/' + id, { status });
      await load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this message permanently?')) return;
    try {
      await apiClient.delete('/contact/' + id);
      toast.success('Message deleted');
      await load();
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#8b6f47]" /> Contact Messages
        </h2>
        <Button onClick={load} variant="outline" className="text-xs font-bold flex items-center gap-2">
          <RefreshCw className={'w-3.5 h-3.5 ' + (loading ? 'animate-spin' : '')} /> Refresh
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={
              'px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap cursor-pointer ' +
              (filter === f.id
                ? 'bg-[#8b6f47] dark:bg-[#c9a96b] text-white dark:text-gray-950 border-transparent'
                : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400')
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && !error && messages.length === 0 && (
        <p className="text-sm text-gray-500 py-8 text-center">No messages here.</p>
      )}

      <ul className="space-y-3">
        {messages.map((m) => {
          const open = openId === m.id;
          return (
            <li key={m.id} className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggle(m)}
                className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40"
              >
                <div className="min-w-0">
                  <p className={'text-sm truncate ' + (m.status === 'unread' ? 'font-bold' : 'font-medium')}>{m.subject}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {m.name} &middot; {m.email} &middot; {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={'text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg flex-shrink-0 ' + badge[m.status]}>
                  {m.status}
                </span>
              </button>
              {open && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3 space-y-3">
                  <p className="text-sm whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300">{m.message}</p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.subject)}`}
                      onClick={() => m.status !== 'replied' && setStatus(m.id, 'replied')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-[#8b6f47] dark:bg-[#c9a96b] text-white dark:text-gray-950"
                    >
                      <Reply className="w-3.5 h-3.5" /> Reply by email
                    </a>
                    {m.status !== 'unread' && (
                      <button type="button" onClick={() => setStatus(m.id, 'unread')} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 cursor-pointer">
                        <CheckCheck className="w-3.5 h-3.5" /> Mark unread
                      </button>
                    )}
                    {m.status !== 'archived' && (
                      <button type="button" onClick={() => setStatus(m.id, 'archived')} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 cursor-pointer">
                        <Archive className="w-3.5 h-3.5" /> Archive
                      </button>
                    )}
                    <button type="button" onClick={() => remove(m.id)} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-red-600 border border-red-200 dark:border-red-900 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Unread count for the sidebar badge; fetched once on mount, updated by the tab. */
export function useContactUnread(enabled: boolean): [number, (n: number) => void] {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    apiClient
      .get('/contact', { params: { status: 'unread' } })
      .then((res) => setCount(res.data?.unreadCount ?? 0))
      .catch(() => {});
  }, [enabled]);
  return [count, setCount];
}
