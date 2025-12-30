'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Star, ChevronRight } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';

interface HeroCardProps {
  userName: string;
  userPhoto?: string | null;
  balance: number;
  className?: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia,';
  if (hour < 18) return 'Boa tarde,';
  return 'Boa noite,';
}

export function HeroCard({
  userName,
  userPhoto,
  balance,
  className,
}: HeroCardProps) {
  const firstName = userName.split(' ')[0];
  const greeting = getGreeting();

  return (
    <div
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
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header - Avatar + Greeting */}
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="ring-2 ring-white/30 ring-offset-2 ring-offset-transparent rounded-full"
          >
            <UserAvatar
              name={userName}
              photo={userPhoto}
              size="lg"
              className="border-2 border-white/50"
            />
          </motion.div>
          <div className="flex-1">
            <p className="text-white/80 text-sm font-medium">{greeting}</p>
            <h1 className="text-2xl font-bold tracking-tight">{firstName}</h1>
          </div>
        </div>

        {/* Balance Section */}
        <Link href="/dashboard/pontos">
          <motion.div
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-between bg-white/15 backdrop-blur-sm rounded-2xl p-4 cursor-pointer transition-colors hover:bg-white/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
                  Seu saldo
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {balance.toLocaleString('pt-BR')}
                  <span className="text-sm font-medium ml-1 opacity-80">
                    pts
                  </span>
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60" />
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
