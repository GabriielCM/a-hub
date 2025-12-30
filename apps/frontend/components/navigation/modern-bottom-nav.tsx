'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import {
  Home,
  MapPin,
  PartyPopper,
  ShoppingBag,
  User,
  Settings,
  LucideIcon,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  activeColor: string;
  activeBg: string;
}

interface ModernBottomNavProps {
  className?: string;
}

export function ModernBottomNav({ className }: ModernBottomNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const userNavItems: NavItem[] = [
    {
      href: '/dashboard',
      label: 'Home',
      icon: Home,
      activeColor: 'text-purple-600',
      activeBg: 'bg-purple-100',
    },
    {
      href: '/dashboard/espacos',
      label: 'Espaços',
      icon: MapPin,
      activeColor: 'text-blue-600',
      activeBg: 'bg-blue-100',
    },
    {
      href: '/dashboard/eventos',
      label: 'Eventos',
      icon: PartyPopper,
      activeColor: 'text-pink-600',
      activeBg: 'bg-pink-100',
    },
    {
      href: '/dashboard/loja',
      label: 'Loja',
      icon: ShoppingBag,
      activeColor: 'text-orange-600',
      activeBg: 'bg-orange-100',
    },
  ];

  const lastNavItem: NavItem = isAdmin
    ? {
        href: '/admin/espacos',
        label: 'Admin',
        icon: Settings,
        activeColor: 'text-slate-600',
        activeBg: 'bg-slate-100',
      }
    : {
        href: '/dashboard/carteirinha',
        label: 'Perfil',
        icon: User,
        activeColor: 'text-green-600',
        activeBg: 'bg-green-100',
      };

  const navItems = [...userNavItems, lastNavItem];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl',
        'border-t border-gray-200/50 dark:border-gray-800/50',
        'safe-area-inset-bottom',
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center flex-1 h-full touch-feedback"
            >
              <motion.div
                className="relative flex flex-col items-center gap-0.5"
                whileTap={{ scale: 0.9 }}
              >
                {/* Active background pill */}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      layoutId="activeNavTab"
                      className={cn(
                        'absolute -inset-x-1 -inset-y-1 rounded-2xl',
                        item.activeBg
                      )}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon */}
                <motion.div
                  className="relative z-10"
                  animate={{
                    scale: active ? 1.1 : 1,
                    y: active ? -1 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors duration-200',
                      active ? item.activeColor : 'text-gray-400'
                    )}
                    strokeWidth={active ? 2.5 : 2}
                  />
                </motion.div>

                {/* Label */}
                <motion.span
                  className={cn(
                    'relative z-10 text-[10px] font-medium transition-colors duration-200',
                    active ? item.activeColor : 'text-gray-400'
                  )}
                  animate={{
                    opacity: active ? 1 : 0.7,
                  }}
                >
                  {item.label}
                </motion.span>

                {/* Active indicator dot */}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ delay: 0.1 }}
                      className={cn(
                        'absolute -bottom-1.5 w-1 h-1 rounded-full',
                        item.activeColor.replace('text-', 'bg-')
                      )}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
