'use client';

import React from 'react';
import Button from './Button';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionLink,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 max-w-md mx-auto">
      {/* Icon with animated subtle bounce/pulse */}
      <div className="p-5 bg-[#faf9f6] dark:bg-gray-850 border border-gray-150/40 dark:border-gray-800 rounded-full mb-5 shadow-sm text-gray-305 dark:text-gray-600">
        <Icon className="w-10 h-10 animate-pulse text-[#8b6f47] dark:text-[#c9a96b]" />
      </div>

      {/* Text Info */}
      <h3 className="text-xl font-bold font-serif text-gray-900 dark:text-white mb-2 leading-tight">
        {title}
      </h3>
      <p className="text-xs text-text-muted mb-6 leading-relaxed">
        {description}
      </p>

      {/* Button Action */}
      {actionText && (
        <>
          {actionLink ? (
            <Link href={actionLink}>
              <Button className="bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full font-bold px-6 shadow-md border-0 text-xs">
                {actionText}
              </Button>
            </Link>
          ) : (
            <Button
              onClick={onAction}
              className="bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full font-bold px-6 shadow-md border-0 text-xs"
            >
              {actionText}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
