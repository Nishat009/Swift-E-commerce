'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'classic';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-medium rounded-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden uppercase tracking-wide text-xs sm:text-sm';
  
  const variants = {
    primary: 'bg-[#8b6f47] text-white hover:bg-[#6b5435] focus:ring-[#8b6f47] shadow-sm hover:shadow-md',
    secondary: 'bg-[#c9a96b] text-white hover:bg-[#a88a4f] focus:ring-[#c9a96b] shadow-sm hover:shadow-md',
    outline: 'border-2 border-[#8b6f47] text-[#8b6f47] hover:bg-[#8b6f47] hover:text-white focus:ring-[#8b6f47] bg-transparent',
    ghost: 'text-[#8b6f47] hover:bg-[#f5f1eb] focus:ring-[#8b6f47]',
    classic: 'bg-gradient-to-r from-[#8b6f47] to-[#c9a96b] text-white hover:from-[#6b5435] hover:to-[#a88a4f] focus:ring-[#8b6f47] shadow-md hover:shadow-lg',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3 text-base',
  };

  // Exclude conflicting event handlers between HTML and Framer Motion
  const {
    onDrag,
    onDragStart,
    onDragEnd,
    onAnimationStart,
    onAnimationEnd,
    ...motionProps
  } = props;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...motionProps}
    >
      <motion.div
        className="absolute inset-0 bg-white/10"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.5 }}
      />
      <span className="relative z-10 flex items-center justify-center">
        {children}
      </span>
    </motion.button>
  );
}
