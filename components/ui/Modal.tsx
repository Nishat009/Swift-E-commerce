'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export default function Modal({ isOpen, onClose, children, title, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 backdrop-blur-[2px] p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className={cn(
          'bg-surface rounded-xl shadow-2xl w-full mx-auto max-h-[90vh] overflow-y-auto border border-line',
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h2 className="font-sans text-base font-semibold text-stone-900 dark:text-white">{title}</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-stone-100 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer" aria-label="Close"
              >
                <X className="w-5 h-5 text-stone-500 dark:text-stone-400" />
              </button>
            )}
          </div>
        )}
        {!title && onClose && (
          <div className="sticky top-0 z-10 flex items-center justify-end px-3 pt-3">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-stone-100 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer" aria-label="Close"
            >
              <X className="w-5 h-5 text-stone-500 dark:text-stone-400" />
            </button>
          </div>
        )}
        <div className={title ? 'p-5' : 'px-5 pb-5'}>{children}</div>
      </div>
    </div>
  );
}

