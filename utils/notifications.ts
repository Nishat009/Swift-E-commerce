// The navbar bell listens for this event and reloads at once, instead of waiting for its next poll
export const NOTIFICATIONS_REFRESH_EVENT = 'swiftcart:notifications-refresh';

export interface NotificationsRefreshDetail {
  /** Don't pop up a toast for what arrived: the page already told the user (default) */
  silent?: boolean;
}

export const refreshNotifications = (detail: NotificationsRefreshDetail = { silent: true }) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(NOTIFICATIONS_REFRESH_EVENT, { detail }));
};
