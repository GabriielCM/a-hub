'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Coins, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PointsHeroCardProps {
  balance: number;
  className?: string;
}

function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) =>
    Math.round(latest).toLocaleString('pt-BR')
  );
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.2,
      ease: [0.25, 0.46, 0.45, 0.94],
    });
    return controls.stop;
  }, [count, value]);

  return <motion.span ref={nodeRef}>{rounded}</motion.span>;
}

export function PointsHeroCard({ balance, className }: PointsHeroCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-3xl p-6 text-white',
        'bg-gradient-to-br from-purple-600 via-purple-500 to-fuchsia-500',
        'shadow-lg shadow-purple-500/25',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large circle top-right */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        {/* Medium circle bottom-left */}
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        {/* Small decorative circles */}
        <div className="absolute top-8 right-20 w-2 h-2 bg-white/30 rounded-full" />
        <div className="absolute bottom-12 right-8 w-3 h-3 bg-white/20 rounded-full" />
        <div className="absolute top-16 left-8 w-1.5 h-1.5 bg-white/25 rounded-full" />
        {/* Sparkle decorations */}
        <motion.div
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute top-6 right-12"
        >
          <Sparkles className="w-4 h-4 text-yellow-300/50" />
        </motion.div>
        <motion.div
          animate={{
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.3, 1]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5
          }}
          className="absolute bottom-10 left-20"
        >
          <Sparkles className="w-3 h-3 text-yellow-300/40" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            >
              <Coins className="w-5 h-5 text-yellow-300" />
            </motion.div>
            <span className="text-white/80 text-sm font-medium uppercase tracking-wider">
              Meus Pontos
            </span>
          </div>
        </div>

        {/* Balance */}
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold tabular-nums tracking-tight">
            <AnimatedNumber value={balance} />
          </span>
          <span className="text-white/70 text-lg font-medium">pontos</span>
        </div>

        {/* Subtitle */}
        <p className="text-white/60 text-sm mt-2">
          Saldo disponivel para transferencias e compras
        </p>
      </div>
    </motion.div>
  );
}
