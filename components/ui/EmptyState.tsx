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
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 max-w-md mx-auto">
      <Icon className="w-8 h-8 mb-5 text-stone-400 dark:text-stone-500" strokeWidth={1.25} />

      <h3 className="text-2xl font-serif font-medium tracking-tight text-ink mb-2 leading-tight">
        {title}
      </h3>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-7 leading-relaxed">
        {description}
      </p>

      {actionText && (
        <>
          {actionLink ? (
            <Link href={actionLink}>
              <Button>{actionText}</Button>
            </Link>
          ) : (
            <Button onClick={onAction}>{actionText}</Button>
          )}
        </>
      )}
    </div>
  );
}
