'use client';

import { motion } from 'framer-motion';
import {
  QrCode,
  Send,
  History,
  FileText,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  gradient: string;
  shadowColor: string;
  onClick: () => void;
}

interface PointsQuickActionsProps {
  onQrPay: () => void;
  onTransfer: () => void;
  onHistory?: () => void;
  onStatement?: () => void;
  className?: string;
}

export function PointsQuickActions({
  onQrPay,
  onTransfer,
  onHistory,
  onStatement,
  className,
}: PointsQuickActionsProps) {
  const actions: QuickAction[] = [
    {
      id: 'qr-pay',
      label: 'QR Pay',
      icon: QrCode,
      gradient: 'from-orange-500 to-amber-500',
      shadowColor: 'shadow-orange-500/25',
      onClick: onQrPay,
    },
    {
      id: 'transfer',
      label: 'Transferir',
      icon: Send,
      gradient: 'from-blue-500 to-cyan-500',
      shadowColor: 'shadow-blue-500/25',
      onClick: onTransfer,
    },
    {
      id: 'history',
      label: 'Historico',
      icon: History,
      gradient: 'from-purple-500 to-pink-500',
      shadowColor: 'shadow-purple-500/25',
      onClick: onHistory || (() => {}),
    },
    {
      id: 'statement',
      label: 'Extrato',
      icon: FileText,
      gradient: 'from-emerald-500 to-teal-500',
      shadowColor: 'shadow-emerald-500/25',
      onClick: onStatement || (() => {}),
    },
  ];

  return (
    <div className={cn('relative', className)}>
      {/* Label */}
      <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
        Acoes rapidas
      </h3>

      {/* Carousel */}
      <div className="relative -mx-4 overflow-hidden">
        <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 overscroll-x-contain touch-pan-x">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                whileTap={{ scale: 0.92 }}
                onClick={action.onClick}
                className="flex-shrink-0 snap-start"
              >
                <div className="flex flex-col items-center gap-2 w-[76px]">
                  <div
                    className={cn(
                      'w-14 h-14 rounded-2xl flex items-center justify-center',
                      'bg-gradient-to-br shadow-lg transition-shadow hover:shadow-xl',
                      action.gradient,
                      action.shadowColor
                    )}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-foreground/80 text-center leading-tight">
                    {action.label}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Fade edge for scroll indication */}
        <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
