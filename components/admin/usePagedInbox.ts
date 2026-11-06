'use client';

import { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { errMsg } from './adminUtils';

const PAGE_SIZE = 50;

type Pagination = { page: number; pages: number; total: number };

/**
 * A paginated admin inbox (GET /chat, GET /contact): loads page 1, appends later pages on
 * "Load more", and applies status changes and deletes locally so the loaded pages stay put.
 */
export function usePagedInbox<T extends { id: string }>(path: string, status?: string) {
  const [items, setItems] = useState<T[]>([]);
  const [paging, setPaging] = useState<Pagination>({ page: 0, pages: 1, total: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Only async state updates here, so the effect below can call it directly
  const fetchPage = useCallback(async (page: number) => {
    try {
      const res = await apiClient.get(path, { params: { page, limit: PAGE_SIZE, ...(status ? { status } : {}) } });
      const rows: T[] = res.data?.data || [];
      setItems((current) => {
        if (page === 1) return rows;
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...rows.filter((item) => !seen.has(item.id))];
      });
      setPaging(res.data?.pagination || { page, pages: page, total: rows.length });
      setError('');
      setUnreadCount(res.data?.unreadCount ?? 0);
    } catch (err) {
      setError(errMsg(err, 'Failed to load messages.'));
    } finally {
      setLoading(false);
    }
  }, [path, status]);

  // Button handlers show the spinner first; the first load starts with loading = true already
  const reload = useCallback(() => { setLoading(true); return fetchPage(1); }, [fetchPage]);
  const loadMore = useCallback(() => { setLoading(true); return fetchPage(paging.page + 1); }, [fetchPage, paging.page]);

  // Loads page 1 on mount and whenever the status filter changes
  useEffect(() => { void fetchPage(1); }, [fetchPage]);

  // Re-reads only the unread counter after a change, without reloading the list
  const refreshUnread = useCallback(async () => {
    try {
      const res = await apiClient.get(path, { params: { limit: 1 } });
      setUnreadCount(res.data?.unreadCount ?? 0);
    } catch { /* the counter catches up on the next reload */ }
  }, [path]);

  const updateLocal = useCallback((id: string, changes: Partial<T>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  }, []);

  const removeLocal = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    setPaging((current) => ({ ...current, total: Math.max(0, current.total - 1) }));
  }, []);

  return {
    items,
    total: paging.total,
    hasMore: paging.page < paging.pages,
    unreadCount,
    loading,
    error,
    reload,
    loadMore,
    refreshUnread,
    updateLocal,
    removeLocal,
  };
}
