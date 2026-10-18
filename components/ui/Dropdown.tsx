'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownOption {
  value: string;
  label: string;
  /** Smaller second line under the label */
  hint?: string;
  disabled?: boolean;
}

export interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  icon?: ReactNode;
  /** 'md' matches form inputs, 'sm' matches compact filter bars */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * The store's own dropdown: same look as <Select> when closed, and a styled list (instead of the
 * browser's native one) when open. Keyboard: arrows, Home / End, Enter / Space, Escape, Tab.
 * The list is portalled to <body> so it is never clipped by a scrolling modal.
 */
export default function Dropdown({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select...',
  disabled = false,
  id,
  icon,
  size = 'md',
  className,
  ...rest
}: DropdownProps) {
  const autoId = useId();
  const buttonId = id || `dd-${autoId}`;
  const listId = `${buttonId}-list`;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight: number } | null>(null);

  const selected = options.find((o) => o.value === value);
  const enabledIndexes = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);

  const place = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - 8;
    const above = r.top - 8;
    const wanted = Math.min(288, options.length * 44 + 8);
    // Open upwards only when there is clearly more room above
    if (below < wanted && above > below) {
      setPos({ left: r.left, width: r.width, bottom: window.innerHeight - r.top + 4, maxHeight: Math.min(288, above) });
    } else {
      setPos({ left: r.left, width: r.width, top: r.bottom + 4, maxHeight: Math.min(288, Math.max(120, below)) });
    }
  }, [options.length]);

  const openList = () => {
    if (disabled) return;
    const current = options.findIndex((o) => o.value === value && !o.disabled);
    setActive(current >= 0 ? current : enabledIndexes[0] ?? -1);
    place();
    setOpen(true);
  };

  const close = (focusButton = true) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  };

  const choose = (index: number) => {
    const opt = options[index];
    if (!opt || opt.disabled) return;
    if (opt.value !== value) onChange(opt.value);
    close();
  };

  const move = (step: number) => {
    if (!enabledIndexes.length) return;
    const at = enabledIndexes.indexOf(active);
    const next = at < 0 ? 0 : (at + step + enabledIndexes.length) % enabledIndexes.length;
    setActive(enabledIndexes[next]);
  };

  useLayoutEffect(() => {
    if (!open) return;
    const onMove = () => place();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t) || listRef.current?.contains(t)) return;
      close(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Keep the highlighted option in view while using the keyboard
  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); move(1); break;
      case 'ArrowUp': e.preventDefault(); move(-1); break;
      case 'Home': e.preventDefault(); setActive(enabledIndexes[0] ?? -1); break;
      case 'End': e.preventDefault(); setActive(enabledIndexes[enabledIndexes.length - 1] ?? -1); break;
      case 'Enter':
      case ' ': e.preventDefault(); choose(active); break;
      case 'Escape': e.preventDefault(); close(); break;
      case 'Tab': close(false); break;
    }
  };

  const sm = size === 'sm';

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={buttonId} className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-label={rest['aria-label']}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          'w-full flex items-center gap-2 text-left border rounded-xl transition',
          'bg-white dark:bg-gray-900 text-gray-900 dark:text-white',
          'focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/40 focus:border-[#8b6f47]',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          sm ? 'pl-3 pr-2 py-2 text-xs font-medium' : 'pl-3.5 pr-2.5 py-2.5 text-sm',
          open ? 'border-[#8b6f47] ring-2 ring-[#8b6f47]/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
        )}
      >
        {icon && <span className="text-gray-400 shrink-0">{icon}</span>}
        <span className={cn('flex-1 truncate', !selected && 'text-gray-400')}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={cn('w-4 h-4 shrink-0 text-gray-400 transition-transform', open && 'rotate-180 text-[#8b6f47]')} />
      </button>

      {open && pos && typeof document !== 'undefined' && createPortal(
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={buttonId}
          tabIndex={-1}
          style={{ position: 'fixed', left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }}
          className="z-[100] overflow-y-auto p-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl shadow-black/10"
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isActive = i === active;
            return (
              <li
                key={opt.value}
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled || undefined}
                onMouseEnter={() => !opt.disabled && setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                className={cn(
                  'flex items-center gap-2 rounded-lg cursor-pointer select-none',
                  sm ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
                  opt.disabled && 'opacity-40 cursor-not-allowed',
                  isActive && !opt.disabled && 'bg-[#8b6f47]/10 dark:bg-[#c9a96b]/10',
                  isSelected ? 'text-[#8b6f47] dark:text-[#c9a96b] font-bold' : 'text-gray-700 dark:text-gray-200',
                )}
              >
                <span className="flex-1 min-w-0">
                  <span className="block truncate">{opt.label}</span>
                  {opt.hint && <span className="block text-[10px] font-normal text-gray-400 truncate">{opt.hint}</span>}
                </span>
                {isSelected && <Check className="w-4 h-4 shrink-0" />}
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </div>
  );
}
