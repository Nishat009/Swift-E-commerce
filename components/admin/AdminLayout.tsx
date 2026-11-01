'use client';

import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  Search,
  ExternalLink,
  LogOut,
  Moon,
  Sun,
  RefreshCw,
  Menu,
  X,
  ChevronRight,
  CornerDownLeft,
  Store,
} from 'lucide-react';
import NotificationBell from '@/components/layout/NotificationBell';
import { cn } from '@/lib/utils';
import { ADMIN_NAV, ADMIN_NAV_ITEMS, AdminTab } from './adminNav';

const iconButton =
  'relative flex size-9 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-200/60 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/[0.06] dark:hover:text-white cursor-pointer';

const noopSubscribe = () => () => {};

const initials = (name?: string) =>
  (name || 'A')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

interface SidebarProps {
  active: AdminTab;
  onSelect: (tab: AdminTab) => void;
  badges?: Partial<Record<AdminTab, number>>;
  user: { name?: string; email?: string };
  onLogout: () => void;
}

function SidebarContent({ active, onSelect, badges = {}, user, onLogout, onClose }: SidebarProps & { onClose?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-line px-5">
        <button type="button" onClick={() => onSelect('overview')} className="flex items-baseline gap-2 cursor-pointer" aria-label="Admin dashboard">
          <span className="text-lg font-semibold tracking-[0.18em] text-stone-900 dark:text-white" style={{ fontFamily: 'var(--font-playfair), serif' }}>SWIFTCART</span>
          <span className="rounded-md bg-[#8b6f47]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b6f47] dark:bg-[#c9a96b]/15 dark:text-[#d9bd85]">Admin</span>
        </button>
        {onClose && (
          <button type="button" onClick={onClose} className={iconButton} aria-label="Close menu">
            <X className="size-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Admin sections">
        {ADMIN_NAV.map((group, gi) => (
          <div key={group.label ?? gi} className={gi === 0 ? 'pt-4' : 'pt-5'}>
            {group.label && (
              <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;
                const badge = badges[item.id];
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors cursor-pointer',
                        isActive
                          ? 'bg-stone-100 text-stone-900 dark:bg-white/[0.07] dark:text-white'
                          : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/[0.04] dark:hover:text-stone-200'
                      )}
                    >
                      <Icon
                        className={cn(
                          'size-4 shrink-0',
                          isActive ? 'text-[#8b6f47] dark:text-[#c9a96b]' : 'text-stone-400 group-hover:text-stone-600 dark:text-stone-500 dark:group-hover:text-stone-300'
                        )}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {!!badge && badge > 0 && (
                        <span className="min-w-5 rounded-full bg-[#8b6f47] px-1.5 text-center text-[10px] font-semibold leading-5 text-white tabular-nums">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-line p-3">
        <Link
          href="/shop"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/[0.04] dark:hover:text-stone-200"
        >
          <Store className="size-4 text-stone-400" />
          <span className="flex-1">View storefront</span>
          <ExternalLink className="size-3.5 text-stone-400" />
        </Link>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-stone-900 text-[11px] font-semibold text-white dark:bg-white dark:text-stone-900">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-stone-900 dark:text-stone-100">{user.name || 'Administrator'}</p>
            <p className="truncate text-[11px] text-stone-500">{user.email}</p>
          </div>
          <button type="button" onClick={onLogout} className={cn(iconButton, 'size-8 hover:text-red-600 dark:hover:text-red-400')} title="Log out" aria-label="Log out">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Fixed left navigation on desktop, slide-over drawer on smaller screens. */
export function AdminSidebar({ mobileOpen, onMobileClose, ...props }: SidebarProps & { mobileOpen: boolean; onMobileClose: () => void }) {
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onMobileClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-surface lg:block">
        <SidebarContent {...props} />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-[2px]" onClick={onMobileClose} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-line bg-surface shadow-2xl">
            <SidebarContent {...props} onClose={onMobileClose} />
          </aside>
        </div>
      )}
    </>
  );
}

interface TopbarProps {
  active: AdminTab;
  onOpenMenu: () => void;
  onOpenSearch: () => void;
  onRefresh: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

/** Sticky bar above the content: where you are, search, and the global actions. */
export function AdminTopbar({ active, onOpenMenu, onOpenSearch, onRefresh, theme, onToggleTheme }: TopbarProps) {
  const current = ADMIN_NAV_ITEMS.find((item) => item.id === active);
  // Server render says Ctrl; Macs switch to the ⌘ symbol after mount
  const isMac = useSyncExternalStore(noopSubscribe, () => /Mac|iPhone|iPad/.test(navigator.platform), () => false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-[#f6f5f3]/85 px-4 backdrop-blur-md sm:px-6 dark:bg-[#0b0a09]/85">
      <button type="button" onClick={onOpenMenu} className={cn(iconButton, 'lg:hidden')} aria-label="Open menu">
        <Menu className="size-5" />
      </button>

      <nav className="hidden min-w-0 items-center gap-1.5 text-sm md:flex" aria-label="Breadcrumb">
        <span className="text-stone-400">Admin</span>
        {current?.group && (
          <>
            <ChevronRight className="size-3.5 text-stone-300 dark:text-stone-600" />
            <span className="text-stone-400">{current.group}</span>
          </>
        )}
        <ChevronRight className="size-3.5 text-stone-300 dark:text-stone-600" />
        <span className="truncate font-medium text-stone-800 dark:text-stone-100">{current?.label}</span>
      </nav>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenSearch}
          className="mr-1 hidden h-9 w-64 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-stone-400 transition-colors hover:border-stone-300 hover:text-stone-600 sm:flex dark:hover:border-stone-600 dark:hover:text-stone-300 cursor-pointer"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Jump to...</span>
          <kbd className="rounded border border-line px-1.5 font-sans text-[10px] font-medium text-stone-400">{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>
        <button type="button" onClick={onOpenSearch} className={cn(iconButton, 'sm:hidden')} aria-label="Search sections">
          <Search className="size-[18px]" />
        </button>
        <button type="button" onClick={onRefresh} className={iconButton} title="Reload this section" aria-label="Reload this section">
          <RefreshCw className="size-[18px]" />
        </button>
        <button
          type="button"
          onClick={onToggleTheme}
          className={iconButton}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </button>
        <NotificationBell className={cn(iconButton, '[&>svg]:size-[18px]')} />
        <Link href="/shop" className={cn(iconButton, 'hidden sm:flex')} title="View storefront" aria-label="View storefront">
          <ExternalLink className="size-[18px]" />
        </Link>
      </div>
    </header>
  );
}

interface CommandAction {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
}

interface CommandMenuProps {
  open: boolean;
  onClose: () => void;
  onSelect: (tab: AdminTab) => void;
  extraActions: CommandAction[];
}

/** Ctrl/⌘+K: type to jump to any admin section or run a global action. */
export function AdminCommandMenu({ open, ...props }: CommandMenuProps) {
  // Mounted only while open, so every opening starts with an empty query
  return open ? <CommandMenuBody {...props} /> : null;
}

function CommandMenuBody({ onClose, onSelect, extraActions }: Omit<CommandMenuProps, 'open'>) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sections: CommandAction[] = ADMIN_NAV_ITEMS.map((item) => ({
      id: item.id,
      label: item.label,
      hint: item.group || 'Home',
      icon: item.icon,
      run: () => onSelect(item.id),
    }));
    const all = [...sections, ...extraActions];
    if (!q) return all;
    return all.filter((a) => `${a.label} ${a.hint || ''} ${a.id}`.toLowerCase().includes(q));
  }, [query, extraActions, onSelect]);

  const run = (action?: CommandAction) => {
    if (!action) return;
    onClose();
    action.run();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Jump to section">
      <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 text-stone-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
              if (e.key === 'Enter') { e.preventDefault(); run(results[cursor]); }
              if (e.key === 'Escape') onClose();
            }}
            placeholder="Search sections and actions..."
            className="h-12 flex-1 bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none dark:text-stone-100"
            aria-label="Search sections and actions"
          />
          <kbd className="rounded border border-line px-1.5 text-[10px] font-medium text-stone-400">Esc</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2" role="listbox">
          {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-stone-500">No matches for &ldquo;{query}&rdquo;</li>}
          {results.map((action, i) => {
            const Icon = action.icon;
            return (
              <li key={action.id} role="option" aria-selected={i === cursor}>
                <button
                  type="button"
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => run(action)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm cursor-pointer',
                    i === cursor ? 'bg-stone-100 text-stone-900 dark:bg-white/[0.07] dark:text-white' : 'text-stone-700 dark:text-stone-300'
                  )}
                >
                  <Icon className="size-4 text-stone-400" />
                  <span className="flex-1">{action.label}</span>
                  {action.hint && <span className="text-xs text-stone-400">{action.hint}</span>}
                  {i === cursor && <CornerDownLeft className="size-3.5 text-stone-400" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
