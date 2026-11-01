import {
  LayoutDashboard,
  Shirt,
  FolderTree,
  Star,
  ShoppingBag,
  RotateCcw,
  TicketPercent,
  Users,
  Inbox,
  Mail,
  CreditCard,
  Wallet,
  Coins,
  Gift,
  ImageIcon,
  Sparkles,
  BarChart3,
  Activity,
  ScrollText,
  ShieldCheck,
  LucideIcon,
} from 'lucide-react';

// Tab ids are part of deep links (/admin?tab=orders&order=<id> from emails and notifications): keep them stable.
export type AdminTab =
  | 'overview' | 'hero' | 'ai_suite' | 'products' | 'orders' | 'returns' | 'payments' | 'users' | 'newsletter'
  | 'reviews' | 'campaigns' | 'monitoring' | 'reports' | 'logs' | 'security' | 'currencies' | 'coupons'
  | 'categories' | 'messages' | 'accounts';

export interface AdminNavItem {
  id: AdminTab;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Renders straight on the page instead of inside one card (it lays out its own panels). */
  bare?: boolean;
}

export interface AdminNavGroup {
  label: string | null;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: null,
    items: [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, bare: true, description: 'Sales, orders and stock at a glance.' },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { id: 'products', label: 'Products', icon: Shirt, description: 'Add and edit products, prices, stock and visibility.' },
      { id: 'categories', label: 'Categories', icon: FolderTree, description: 'Organise the catalog and choose featured collections.' },
      { id: 'reviews', label: 'Reviews', icon: Star, description: 'Moderate what customers say about your products.' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { id: 'orders', label: 'Orders', icon: ShoppingBag, description: 'Track, update and fulfil customer orders.' },
      { id: 'returns', label: 'Returns & refunds', icon: RotateCcw, description: 'Cancellations, return requests and refunds in one queue.' },
      { id: 'coupons', label: 'Coupons', icon: TicketPercent, description: 'Discount codes, limits and expiry dates.' },
    ],
  },
  {
    label: 'Customers',
    items: [
      { id: 'users', label: 'Customers', icon: Users, description: 'Accounts, roles, carts and wishlists.' },
      { id: 'messages', label: 'Inbox', icon: Inbox, description: 'Contact-form messages and AI stylist conversations.' },
      { id: 'newsletter', label: 'Newsletter', icon: Mail, description: 'Everyone subscribed to store emails.' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'payments', label: 'Payment methods', icon: CreditCard, description: 'Turn checkout payment methods on or off and test gateways.' },
      { id: 'accounts', label: 'Wallet & ledger', icon: Wallet, description: 'Store balance, payouts and the transaction statement.' },
      { id: 'currencies', label: 'Currencies', icon: Coins, description: 'Currencies shoppers can browse in, and their rates.' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { id: 'campaigns', label: 'Campaigns', icon: Gift, description: 'Lucky-draw campaigns, tickets and winners.' },
      { id: 'hero', label: 'Storefront hero', icon: ImageIcon, description: 'Images for the slides at the top of the shop.' },
      { id: 'ai_suite', label: 'AI tools', icon: Sparkles, bare: true, description: 'Product copy drafts, image presets and review insights.' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'reports', label: 'Reports', icon: BarChart3, description: 'Sales reports and CSV exports.' },
      { id: 'monitoring', label: 'Monitoring', icon: Activity, description: 'Server health, uptime and errors.' },
      { id: 'logs', label: 'Activity log', icon: ScrollText, description: 'Who changed what, and when.' },
      { id: 'security', label: 'Security', icon: ShieldCheck, description: 'Two-factor authentication for your admin account.' },
    ],
  },
];

export const ADMIN_NAV_ITEMS: (AdminNavItem & { group: string | null })[] = ADMIN_NAV.flatMap((g) =>
  g.items.map((item) => ({ ...item, group: g.label }))
);

export const isAdminTab = (value: string | null | undefined): value is AdminTab =>
  !!value && ADMIN_NAV_ITEMS.some((item) => item.id === value);
