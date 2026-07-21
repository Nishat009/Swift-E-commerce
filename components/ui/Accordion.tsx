'use client';

import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AccordionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: ReactNode;
  badge?: ReactNode;
  className?: string;
}

export default function Accordion({
  title,
  subtitle,
  children,
  defaultOpen = false,
  icon,
  badge,
  className,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn('border border-gray-150/60 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 transition-shadow hover:shadow-xs', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && <div className="text-[#8b6f47] dark:text-[#c9a96b] flex-shrink-0">{icon}</div>}
          <div className="min-w-0">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white font-serif">
              {title}
            </h4>
            {subtitle && <p className="text-[10px] text-text-muted mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {badge && <div>{badge}</div>}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-gray-400"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-gray-100 dark:border-gray-800/60"
          >
            <div className="p-5 text-xs text-gray-700 dark:text-gray-300 space-y-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
