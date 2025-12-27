'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { AdminPointsBalance } from '@/lib/api';

interface PointsBalancesTableProps {
  balances: AdminPointsBalance[];
  loading: boolean;
}

export function PointsBalancesTable({ balances, loading }: PointsBalancesTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum usuario com saldo encontrado.
      </div>
    );
  }

  // Desktop Table
  const DesktopTable = () => (
    <div className="hidden md:block rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Saldo Atual</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {balances.map((balance) => (
            <TableRow key={balance.id}>
              <TableCell className="font-medium">{balance.user.name}</TableCell>
              <TableCell className="text-muted-foreground">{balance.user.email}</TableCell>
              <TableCell className="text-right">
                <span className={`font-bold ${balance.balance > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {balance.balance.toLocaleString('pt-BR')} pts
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  // Mobile Cards
  const MobileCards = () => (
    <div className="md:hidden space-y-3">
      {balances.map((balance) => (
        <Card key={balance.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{balance.user.name}</p>
                <p className="text-sm text-muted-foreground">{balance.user.email}</p>
              </div>
              <span className={`font-bold text-lg ${balance.balance > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                {balance.balance.toLocaleString('pt-BR')} pts
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <>
      <DesktopTable />
      <MobileCards />
    </>
  );
}
