'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import apiClient from '@/lib/apiClient';
import { NOTIFICATIONS_REFRESH_EVENT, NotificationsRefreshDetail } from '@/utils/notifications';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'campaign_purchase' | 'draw_result' | 'campaign_update' | 'winner_announcement' | 'price_drop' | 'restock' | 'delivery_update' | 'admin_alert' | 'store_message' | 'system';
  relatedCampaign?: { id: string; title: string; prizeName: string; status: string } | null;
  relatedOrder?: string | null;
  relatedProduct?: string | null;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// Where clicking a notification takes the user
const notificationHref = (n: Notification): string | null => {
  if (n.link) return n.link;
  if (n.relatedOrder) return `/orders?order=${n.relatedOrder}`;
  if (n.relatedCampaign?.id) return `/campaigns/${n.relatedCampaign.id}`;
  if (n.relatedProduct) return `/product/${n.relatedProduct}`;
  return null;
};

/** Bell with the unread count and the latest notifications; used by the shop navbar and the admin header. */
export default function NotificationBell({ className = '' }: { className?: string }) {
  const { user } = useAuth();
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const markNotificationRead = async (n: Notification) => {
    if (n.isRead) return;
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await apiClient.put('/notifications/' + n.id + '/read');
    } catch {
      fetchNotifications();
    }
  };

  const markAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setUnreadCount(0);
    try {
      await apiClient.put('/notifications/read-all');
    } catch {
      fetchNotifications();
    }
  };

  // Newest notification time already shown; anything newer and unread pops up as a toast (null until the first load)
  const newestSeenRef = useRef<number | null>(null);

  const fetchNotifications = useCallback(async ({ silent = false }: NotificationsRefreshDetail = {}) => {
    if (!user) return;
    try {
      const [notifRes, countRes] = await Promise.all([
        apiClient.get('/notifications?limit=10'),
        apiClient.get('/notifications/unread-count'),
      ]);
      if (notifRes.data?.success) {
        const list: Notification[] = notifRes.data.data;
        setNotifications(list);
        const newest = list.reduce((max, n) => Math.max(max, new Date(n.createdAt).getTime()), 0);
        const seen = newestSeenRef.current;
        if (seen !== null && !silent) {
          const fresh = list.filter((n) => !n.isRead && new Date(n.createdAt).getTime() > seen);
          if (fresh.length === 1) toast.info(`${fresh[0].title}: ${fresh[0].message}`);
          else if (fresh.length > 1) toast.info(`You have ${fresh.length} new notifications.`);
        }
        newestSeenRef.current = Math.max(seen ?? 0, newest);
      }
      if (countRes.data?.success) setUnreadCount(countRes.data.data.count);
    } catch {
      // Silently fail
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    newestSeenRef.current = null;
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Pages fire this right after something that creates a notification (placing an order, a return request...)
    const handleRefresh = (e: Event) => fetchNotifications((e as CustomEvent<NotificationsRefreshDetail>).detail || {});
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefresh);

    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchNotifications();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefresh);
    };
  }, [user, fetchNotifications]);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setIsNotifOpen(!isNotifOpen);
          if (!isNotifOpen) fetchNotifications();
        }}
        className={className || 'relative p-1.5 text-gray-800 dark:text-gray-200 hover:text-[#8b6f47] dark:hover:text-[#c9a96b] transition-colors cursor-pointer'}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 bg-[#9b2c2c] text-white text-[9px] font-semibold rounded-full min-w-4 h-4 px-1 flex items-center justify-center ring-2 ring-paper">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {isNotifOpen && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setIsNotifOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-surface rounded-lg shadow-[0_16px_40px_-12px_rgba(0,0,0,0.25)] border border-line z-[100] text-left overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <span className="text-sm font-medium text-stone-900 dark:text-white">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllNotificationsRead} className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white underline-offset-4 hover:underline cursor-pointer">
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-line">
              {notifications.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-stone-500">You're all caught up.</p>
              ) : (
                notifications.map((n) => {
                  const content = (
                    <div className={'px-4 py-3 text-xs hover:bg-stone-50 dark:hover:bg-white/5 cursor-pointer ' + (n.isRead ? '' : 'bg-[#8b6f47]/[0.05] dark:bg-[#c9a96b]/[0.06]')}>
                      <div className="flex items-start gap-2">
                        {!n.isRead && <span className="mt-1.5 size-1.5 rounded-full bg-[#8b6f47] dark:bg-[#c9a96b] flex-shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-stone-900 dark:text-white">{n.title}</p>
                          <p className="text-stone-600 dark:text-stone-400 mt-0.5 leading-snug line-clamp-3">{n.message}</p>
                          <p className="text-[11px] text-stone-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  );
                  const href = notificationHref(n);
                  return href ? (
                    <Link
                      key={n.id}
                      href={href}
                      onClick={() => {
                        markNotificationRead(n);
                        setIsNotifOpen(false);
                      }}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={n.id} onClick={() => markNotificationRead(n)}>
                      {content}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
