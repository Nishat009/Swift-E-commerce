'use client';

import { useState } from 'react';
import { Archive, Bot, CheckCheck, RefreshCw, Trash2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { usePagedInbox } from './usePagedInbox';
import { useToast } from '@/context/ToastContext';
import { errMsg } from './adminUtils';
import { AdminButton, AdminEmpty, Pill, SectionHeader } from './AdminUI';

type Status = 'unread' | 'read' | 'archived';
type Chat = {
  id: string; sessionId: string; name: string; email: string; message: string;
  assistantReply: string; status: Status; createdAt: string;
};

const badge: Record<Status, { label: string; tone: 'warning' | 'neutral' }> = {
  unread: { label: 'Unread', tone: 'warning' },
  read: { label: 'Read', tone: 'neutral' },
  archived: { label: 'Archived', tone: 'neutral' },
};

export default function ChatMessages({ onUnreadChange }: { onUnreadChange?: () => void }) {
  const toast = useToast();
  const { items: messages, total, hasMore, loading, error, reload, loadMore, updateLocal, removeLocal } = usePagedInbox<Chat>('/chat');
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    await reload();
    onUnreadChange?.();
  };

  const setStatus = async (id: string, status: Status) => {
    try {
      await apiClient.put(`/chat/${id}`, { status });
      updateLocal(id, { status });
      onUnreadChange?.();
    } catch (error) { toast.error(errMsg(error)); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this AI conversation message permanently?')) return;
    try {
      await apiClient.delete(`/chat/${id}`);
      toast.success('Chat message deleted');
      removeLocal(id);
      onUnreadChange?.();
    } catch (error) { toast.error(errMsg(error)); }
  };

  const toggle = (message: Chat) => {
    const opening = openId !== message.id;
    setOpenId(opening ? message.id : null);
    if (opening && message.status === 'unread') void setStatus(message.id, 'read');
  };

  return (
    <section className="space-y-4 border-t border-line pt-8">
      <SectionHeader
        title="AI stylist conversations"
        description="What shoppers asked the AI stylist, and how it replied."
        actions={
          <AdminButton size="sm" onClick={load}>
            <RefreshCw className={'size-3.5 ' + (loading ? 'animate-spin' : '')} /> Refresh
          </AdminButton>
        }
      />

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{error}</p>
      )}

      {!loading && !error && messages.length === 0 ? (
        <div className="rounded-lg border border-line">
          <AdminEmpty icon={Bot} title="No AI stylist conversations yet" description="Questions shoppers ask the AI stylist will appear here." />
        </div>
      ) : messages.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
          {messages.map((message) => {
            const open = openId === message.id;
            const unread = message.status === 'unread';
            return (
              <li key={message.id} className={open ? 'bg-stone-50/60 dark:bg-white/[0.02]' : undefined}>
                <button
                  type="button"
                  onClick={() => toggle(message)}
                  aria-expanded={open}
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50 dark:hover:bg-white/[0.03] cursor-pointer"
                >
                  <span className="flex min-w-0 items-start gap-2.5">
                    <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${unread ? 'bg-[#8b6f47] dark:bg-[#c9a96b]' : 'bg-transparent'}`} aria-hidden />
                    <span className="min-w-0">
                      <span className={`block truncate text-sm ${unread ? 'font-semibold text-stone-900 dark:text-white' : 'font-medium text-stone-700 dark:text-stone-300'}`}>{message.message}</span>
                      <span className="block truncate text-xs text-stone-500 dark:text-stone-400">{message.name}{message.email ? ` · ${message.email}` : ' · Guest'} · {new Date(message.createdAt).toLocaleString()}</span>
                    </span>
                  </span>
                  <Pill tone={badge[message.status]?.tone || 'neutral'} className="shrink-0">{badge[message.status]?.label || message.status}</Pill>
                </button>
                {open && (
                  <div className="space-y-3 px-4 pb-4 pl-8">
                    <div>
                      <p className="mb-1 text-xs font-medium text-stone-500 dark:text-stone-400">Shopper</p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800 dark:text-stone-200">{message.message}</p>
                    </div>
                    <div className="rounded-lg border border-line bg-surface p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
                        <Bot className="size-3.5 text-[#8b6f47] dark:text-[#c9a96b]" /> AI stylist reply
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700 dark:text-stone-300">{message.assistantReply}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {message.status !== 'unread' && (
                        <AdminButton size="sm" onClick={() => setStatus(message.id, 'unread')}>
                          <CheckCheck className="size-3.5" /> Mark unread
                        </AdminButton>
                      )}
                      {message.status !== 'archived' && (
                        <AdminButton size="sm" onClick={() => setStatus(message.id, 'archived')}>
                          <Archive className="size-3.5" /> Archive
                        </AdminButton>
                      )}
                      <AdminButton size="sm" variant="danger" onClick={() => remove(message.id)}>
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
