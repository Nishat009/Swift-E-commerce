import React from 'react';
import { Sparkles, CheckCircle2, TrendingUp } from 'lucide-react';

interface AIBadgeProps {
  type: 'recommended' | 'match' | 'trending';
  label?: string;
  className?: string;
}

export default function AIBadge({ type, label, className = '' }: AIBadgeProps) {
  const config = {
    recommended: {
      defaultLabel: 'AI Recommended',
      bg: 'bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-600/10 text-amber-800 dark:text-amber-300 border-amber-500/30',
      icon: <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400 animate-pulse" />,
    },
    match: {
      defaultLabel: '98% Perfect Match',
      bg: 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/20 to-teal-600/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />,
    },
    trending: {
      defaultLabel: 'AI Trending',
      bg: 'bg-gradient-to-r from-purple-500/10 via-indigo-500/20 to-purple-600/10 text-purple-800 dark:text-purple-300 border-purple-500/30',
      icon: <TrendingUp className="w-3 h-3 text-purple-600 dark:text-purple-400" />,
    },
  }[type];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border shadow-xs ${config.bg} ${className}`}
    >
      {config.icon}
      <span>{label || config.defaultLabel}</span>
    </span>
  );
}
