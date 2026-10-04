'use client';

import { useCallback, useEffect, useState } from 'react';
import { Archive, Bot, CheckCheck, RefreshCw, Trash2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import Button from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { errMsg } from './adminUtils';

type Status = 'unread' | 'read' | 'archived';
type Chat = {
  id: string; sessionId: string; name: string; email: string; message: string;
  assistantReply: string; status: Status; createdAt: string;
};

export default function ChatMessages({ onUnreadChange }: { onUnreadChange?: () => void }) {
  const toast = useToast();
  const [messages, setMessages] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/chat');
      setMessages(response.data?.data || []);
      onUnreadChange?.();
    } catch (error) {
      toast.error(errMsg(error, 'Failed to load AI conversations.'));
    } finally {
      setLoading(false);
    }
  }, [onUnreadChange, toast]);

  useEffect(() => { void load(); }, [load]);

  const setStatus = async (id: string, status: Status) => {
    try {
      await apiClient.put(`/chat/${id}`, { status });
      await load();
    } catch (error) { toast.error(errMsg(error)); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this AI conversation message permanently?')) return;
    try {
      await apiClient.delete(`/chat/${id}`);
      toast.success('Chat message deleted');
      await load();
    } catch (error) { toast.error(errMsg(error)); }
  };

  const toggle = (message: Chat) => {
    const opening = openId !== message.id;
    setOpenId(opening ? message.id : null);
    if (opening && message.status === 'unread') void setStatus(message.id, 'read');
  };

  return (
    <section className="space-y-4 pt-8 border-t border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-serif font-bold flex items-center gap-2"><Bot className="w-5 h-5 text-[#8b6f47]" /> AI Chat Conversations</h2>
        <Button onClick={load} variant="outline" className="text-xs font-bold flex items-center gap-2">
          <RefreshCw className={'w-3.5 h-3.5 ' + (loading ? 'animate-spin' : '')} /> Refresh
        </Button>
      </div>
      {!loading && messages.length === 0 && <p className="text-sm text-gray-500 py-6 text-center">No AI chat messages yet.</p>}
      <ul className="space-y-3">
        {messages.map((message) => (
          <li key={message.id} className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            <button type="button" onClick={() => toggle(message)} className="w-full text-left px-4 py-3 flex justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/40">
              <div className="min-w-0">
                <p className={'text-sm truncate ' + (message.status === 'unread' ? 'font-bold' : 'font-medium')}>{message.message}</p>
                <p className="text-xs text-gray-500 truncate">{message.name}{message.email ? ` · ${message.email}` : ' · Guest'} · {new Date(message.createdAt).toLocaleString()}</p>
              </div>
              <span className="text-[10px] uppercase font-bold text-amber-700">{message.status}</span>
            </button>
            {openId === message.id && (
              <div className="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
                <div><p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Customer</p><p className="text-sm whitespace-pre-wrap">{message.message}</p></div>
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 p-3"><p className="text-[10px] font-bold uppercase text-amber-700 mb-1">AI reply</p><p className="text-sm whitespace-pre-wrap">{message.assistantReply}</p></div>
                <div className="flex gap-2">
                  {message.status !== 'unread' && <button onClick={() => setStatus(message.id, 'unread')} className="inline-flex items-center gap-1 text-xs border rounded-xl px-3 py-2"><CheckCheck className="w-3.5 h-3.5" /> Mark unread</button>}
                  {message.status !== 'archived' && <button onClick={() => setStatus(message.id, 'archived')} className="inline-flex items-center gap-1 text-xs border rounded-xl px-3 py-2"><Archive className="w-3.5 h-3.5" /> Archive</button>}
                  <button onClick={() => remove(message.id)} className="inline-flex items-center gap-1 text-xs text-red-600 border border-red-200 rounded-xl px-3 py-2"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
