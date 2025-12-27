'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Coins, Users } from 'lucide-react';
import { PointsSystemSummary } from '@/lib/api';

interface PointsSummaryCardsProps {
  summary: PointsSystemSummary | null;
  loading: boolean;
}

export function PointsSummaryCards({ summary, loading }: PointsSummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-16 bg-muted rounded" />
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-16 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Total de Pontos no Sistema</p>
              <p className="text-3xl font-bold">
                {summary?.totalPoints.toLocaleString('pt-BR') ?? 0}
              </p>
            </div>
            <Coins className="h-10 w-10 opacity-80" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Usuarios com Saldo</p>
              <p className="text-3xl font-bold">
                {summary?.totalUsers ?? 0}
              </p>
            </div>
            <Users className="h-10 w-10 opacity-80" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
