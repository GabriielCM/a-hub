'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Star, CreditCard, ShoppingBag, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAccessGridProps {
  pointsBalance: number;
  upcomingBookingsCount: number;
  className?: string;
}

interface ActionItem {
  href: string;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  value?: string | number;
  gradient: string;
  glowColor: string;
  iconBg: string;
}

export function QuickAccessGrid({
  pointsBalance,
  upcomingBookingsCount,
  className,
}: QuickAccessGridProps) {
  const items: ActionItem[] = [
    {
      href: '/dashboard/agendamentos',
      label: 'Reservas',
      icon: Calendar,
      value: upcomingBookingsCount > 0 ? upcomingBookingsCount : undefined,
      sublabel: upcomingBookingsCount > 0 ? 'próximas' : 'ver reservas',
      gradient: 'from-blue-500 to-cyan-500',
      glowColor: 'shadow-blue-500/30',
      iconBg: 'bg-white/20',
    },
    {
      href: '/dashboard/pontos',
      label: 'Pontos',
      icon: Star,
      value: pointsBalance.toLocaleString('pt-BR'),
      sublabel: 'saldo atual',
      gradient: 'from-amber-500 to-orange-500',
      glowColor: 'shadow-amber-500/30',
      iconBg: 'bg-white/20',
    },
    {
      href: '/dashboard/carteirinha',
      label: 'Carteirinha',
      icon: CreditCard,
      sublabel: 'acesso digital',
      gradient: 'from-emerald-500 to-teal-500',
      glowColor: 'shadow-emerald-500/30',
      iconBg: 'bg-white/20',
    },
    {
      href: '/dashboard/loja',
      label: 'Loja',
      icon: ShoppingBag,
      sublabel: 'trocar pontos',
      gradient: 'from-purple-500 to-pink-500',
      glowColor: 'shadow-purple-500/30',
      iconBg: 'bg-white/20',
    },
  ];

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href}>
            <motion.div
              whileTap={{ scale: 0.95 }}
              className={cn(
                'relative overflow-hidden rounded-2xl p-4 h-32',
                'bg-gradient-to-br text-white',
                item.gradient,
                'shadow-lg hover:shadow-xl transition-shadow',
                item.glowColor
              )}
            >
              {/* Background decoration */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-white/10 rounded-full blur-2xl" />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-between">
                {/* Icon */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    item.iconBg
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>

                {/* Text */}
                <div>
                  {item.value !== undefined && (
                    <p className="text-2xl font-bold leading-none mb-1 tabular-nums">
                      {item.value}
                    </p>
                  )}
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-white/80">{item.sublabel}</p>
                </div>
              </div>
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}
