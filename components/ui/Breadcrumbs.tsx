import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn('flex items-center flex-wrap gap-x-1.5 gap-y-1 text-xs text-stone-500 dark:text-stone-400', className)} aria-label="Breadcrumb">
      <Link href="/shop" className="hover:text-ink transition-colors">
        Home
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3 h-3 text-stone-300 dark:text-stone-600 flex-shrink-0" strokeWidth={1.5} />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-ink transition-colors capitalize truncate max-w-[150px] sm:max-w-[200px]"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-ink capitalize truncate max-w-[180px] sm:max-w-[240px]">
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
