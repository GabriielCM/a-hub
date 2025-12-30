'use client';

import { ReactNode, useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  disabled = false,
  className,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pullDistance = useMotionValue(0);

  const indicatorOpacity = useTransform(
    pullDistance,
    [0, threshold / 2, threshold],
    [0, 0.5, 1]
  );
  const indicatorScale = useTransform(pullDistance, [0, threshold], [0.5, 1]);
  const indicatorRotate = useTransform(pullDistance, [0, threshold], [0, 180]);

  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing) return;

      const scrollTop = containerRef.current?.scrollTop ?? 0;
      if (scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling.current || isRefreshing || disabled) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      const scrollTop = containerRef.current?.scrollTop ?? 0;

      if (diff > 0 && scrollTop === 0) {
        // Add resistance when pulling
        const resistance = 0.4;
        pullDistance.set(diff * resistance);
      }
    },
    [isRefreshing, disabled, pullDistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || disabled) return;
    isPulling.current = false;

    const currentPull = pullDistance.get();

    if (currentPull >= threshold && !isRefreshing) {
      setIsRefreshing(true);

      // Keep indicator visible during refresh
      animate(pullDistance, threshold, { duration: 0.2 });

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        animate(pullDistance, 0, { duration: 0.3 });
      }
    } else {
      animate(pullDistance, 0, { duration: 0.3 });
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh, disabled]);

  return (
    <div className={cn('relative h-full overflow-hidden', className)}>
      {/* Pull Indicator */}
      <motion.div
        style={{
          opacity: indicatorOpacity,
          scale: indicatorScale,
          y: useTransform(pullDistance, (v) => Math.max(0, v - 40)),
        }}
        className="absolute top-0 left-0 right-0 z-10 flex justify-center py-4 pointer-events-none"
      >
        <motion.div
          style={{ rotate: isRefreshing ? 0 : indicatorRotate }}
          className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-100"
        >
          <Loader2
            className={cn(
              'w-5 h-5 text-primary',
              isRefreshing && 'animate-spin'
            )}
          />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        ref={containerRef}
        style={{ y: pullDistance }}
        className="h-full overflow-y-auto overflow-x-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </motion.div>
    </div>
  );
}
