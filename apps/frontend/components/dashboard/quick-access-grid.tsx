'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Star, CreditCard, ShoppingBag } from 'lucide-react';

interface QuickAccessGridProps {
  pointsBalance: number;
  upcomingBookingsCount: number;
}

export function QuickAccessGrid({
  pointsBalance,
  upcomingBookingsCount,
}: QuickAccessGridProps) {
  const items = [
    {
      href: '/dashboard/agendamentos',
      label: 'Agendamentos',
      icon: Calendar,
      value: upcomingBookingsCount > 0 ? upcomingBookingsCount : undefined,
      sublabel: upcomingBookingsCount > 0 ? 'proximas reservas' : 'ver reservas',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      href: '/dashboard/pontos',
      label: 'Pontos',
      icon: Star,
      value: pointsBalance.toLocaleString('pt-BR'),
      sublabel: 'seu saldo',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      href: '/dashboard/carteirinha',
      label: 'Carteirinha',
      icon: CreditCard,
      sublabel: 'acesso digital',
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      href: '/dashboard/loja',
      label: 'Loja',
      icon: ShoppingBag,
      sublabel: 'trocar pontos',
      gradient: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href}>
            <Card
              className={`bg-gradient-to-br ${item.gradient} text-white border-0 hover:shadow-lg transition-shadow h-full`}
            >
              <CardContent className="p-4">
                <Icon className="h-6 w-6 mb-2 opacity-90" />
                {item.value !== undefined && (
                  <p className="text-2xl font-bold">{item.value}</p>
                )}
                <p className="font-medium">{item.label}</p>
                <p className="text-xs opacity-80">{item.sublabel}</p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
