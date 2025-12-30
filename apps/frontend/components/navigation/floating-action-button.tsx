'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FABAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  color?: string;
  bgColor?: string;
}

interface FloatingActionButtonProps {
  actions: FABAction[];
  mainIcon?: LucideIcon;
  position?: 'bottom-right' | 'bottom-center';
  className?: string;
}

export function FloatingActionButton({
  actions,
  mainIcon: MainIcon = Plus,
  position = 'bottom-right',
  className,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const containerVariants = {
    open: {
      transition: { staggerChildren: 0.07, delayChildren: 0.05 },
    },
    closed: {
      transition: { staggerChildren: 0.05, staggerDirection: -1 },
    },
  };

  const itemVariants = {
    open: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
    closed: {
      y: 20,
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2',
  };

  return (
    <div className={cn('fixed z-40', positionClasses[position], className)}>
      {/* Action buttons */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={containerVariants}
            className="absolute bottom-16 right-0 flex flex-col-reverse gap-3 items-end"
          >
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={index}
                  variants={itemVariants}
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-full',
                    'bg-white dark:bg-gray-800',
                    'shadow-lg hover:shadow-xl',
                    'transition-shadow touch-feedback',
                    'border border-gray-100 dark:border-gray-700'
                  )}
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                    {action.label}
                  </span>
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center',
                      action.bgColor || 'bg-primary',
                      action.color || 'text-white'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          />
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        animate={{
          rotate: isOpen ? 135 : 0,
          scale: isOpen ? 0.9 : 1,
        }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={cn(
          'relative w-14 h-14 rounded-full',
          'bg-gradient-to-br from-purple-600 to-fuchsia-500',
          'flex items-center justify-center',
          'shadow-lg shadow-purple-500/30',
          'hover:shadow-xl hover:shadow-purple-500/40',
          'transition-shadow'
        )}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 blur-lg opacity-50 -z-10" />

        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MainIcon className="w-6 h-6 text-white" />
        )}
      </motion.button>
    </div>
  );
}
