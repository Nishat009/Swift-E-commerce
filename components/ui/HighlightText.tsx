import React from 'react';

interface HighlightTextProps {
  text: string;
  query?: string;
  className?: string;
  highlightClassName?: string;
}

export default function HighlightText({
  text,
  query,
  className = '',
  highlightClassName = 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold px-0.5 rounded',
}: HighlightTextProps) {
  if (!query || !query.trim() || !text) {
    return <span className={className}>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </span>
  );
}
