'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  PartyPopper,
  MapPin,
  Package,
  Gift,
  QrCode,
  Calendar,
  ShoppingCart,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Shortcut {
  href: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

const shortcuts: Shortcut[] = [
  {
    href: '/dashboard/eventos',
    label: 'Eventos',
    icon: PartyPopper,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
  },
  {
    href: '/dashboard/espacos',
    label: 'Espaços',
    icon: MapPin,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    href: '/dashboard/agendamentos',
    label: 'Reservas',
    icon: Calendar,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  {
    href: '/dashboard/pedidos',
    label: 'Pedidos',
    icon: Package,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  {
    href: '/dashboard/carteirinha',
    label: 'Benefícios',
    icon: Gift,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  {
    href: '/dashboard/carrinho',
    label: 'Carrinho',
    icon: ShoppingCart,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    href: '/dashboard/pontos',
    label: 'QR Pay',
    icon: QrCode,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
];

interface ShortcutCarouselProps {
  className?: string;
}

export function ShortcutCarousel({ className }: ShortcutCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cn('relative', className)}>
      {/* Label */}
      <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
        Acesso rápido
      </h3>

      {/* Carousel */}
      <div className="relative -mx-4 overflow-hidden">
        <div
          ref={scrollRef}
          className="flex gap-3 px-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 overscroll-x-contain touch-pan-x"
        >
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Link key={shortcut.href} href={shortcut.href}>
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  className="flex-shrink-0 snap-start"
                >
                  <div className="flex flex-col items-center gap-2 w-[72px]">
                    <div
                      className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center',
                        'shadow-sm transition-shadow hover:shadow-md',
                        shortcut.bgColor
                      )}
                    >
                      <Icon className={cn('h-6 w-6', shortcut.color)} />
                    </div>
                    <span className="text-xs font-medium text-foreground/80 text-center leading-tight">
                      {shortcut.label}
                    </span>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Fade edges for scroll indication */}
        <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
