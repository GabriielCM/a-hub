'use client';

import { forwardRef, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export type GradientVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'info'
  | 'dark'
  | 'custom';

export interface GradientCardProps
  extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  variant?: GradientVariant;
  customGradient?: string;
  hasGlow?: boolean;
  interactive?: boolean;
  withDecoration?: boolean;
}

const gradientMap: Record<GradientVariant, string> = {
  primary: 'from-purple-600 via-purple-500 to-fuchsia-500',
  secondary: 'from-rose-500 via-pink-500 to-purple-500',
  success: 'from-emerald-500 via-green-500 to-teal-500',
  warning: 'from-amber-500 via-orange-500 to-yellow-500',
  info: 'from-cyan-500 via-blue-500 to-indigo-500',
  dark: 'from-slate-800 via-slate-900 to-black',
  custom: '',
};

const glowMap: Record<GradientVariant, string> = {
  primary: 'shadow-[0_4px_20px_-2px_rgba(168,85,247,0.4)]',
  secondary: 'shadow-[0_4px_20px_-2px_rgba(244,63,94,0.4)]',
  success: 'shadow-[0_4px_20px_-2px_rgba(16,185,129,0.4)]',
  warning: 'shadow-[0_4px_20px_-2px_rgba(245,158,11,0.4)]',
  info: 'shadow-[0_4px_20px_-2px_rgba(59,130,246,0.4)]',
  dark: 'shadow-xl',
  custom: 'shadow-glow',
};

export const GradientCard = forwardRef<HTMLDivElement, GradientCardProps>(
  (
    {
      children,
      variant = 'primary',
      customGradient,
      hasGlow = false,
      interactive = true,
      withDecoration = true,
      className,
      ...props
    },
    ref
  ) => {
    const gradientClass =
      variant === 'custom' && customGradient
        ? customGradient
        : gradientMap[variant];

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        whileTap={interactive ? { scale: 0.98 } : undefined}
        whileHover={interactive ? { scale: 1.02 } : undefined}
        className={cn(
          'relative overflow-hidden rounded-2xl p-6 text-white',
          `bg-gradient-to-br ${gradientClass}`,
          hasGlow && glowMap[variant],
          interactive && 'cursor-pointer transition-shadow hover:shadow-xl',
          className
        )}
        {...props}
      >
        {/* Decorative elements */}
        {withDecoration && (
          <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute -top-1/2 -right-1/4 w-2/3 h-full bg-white rounded-full blur-3xl" />
            <div className="absolute -bottom-1/2 -left-1/4 w-1/2 h-full bg-white rounded-full blur-3xl" />
          </div>
        )}

        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);

GradientCard.displayName = 'GradientCard';
