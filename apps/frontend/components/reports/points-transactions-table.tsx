'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, ArrowDownLeft, ArrowUpRight, Settings } from 'lucide-react';
import { AdminPointsTransaction } from '@/lib/api';

interface PointsTransactionsTableProps {
  transactions: AdminPointsTransaction[];
  loading: boolean;
}

const typeConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  CREDIT: { label: 'Credito', color: 'bg-green-100 text-green-800', icon: ArrowUp },
  DEBIT: { label: 'Debito', color: 'bg-red-100 text-red-800', icon: ArrowDown },
  TRANSFER_IN: { label: 'Transferencia Recebida', color: 'bg-blue-100 text-blue-800', icon: ArrowDownLeft },
  TRANSFER_OUT: { label: 'Transferencia Enviada', color: 'bg-blue-100 text-blue-800', icon: ArrowUpRight },
  ADJUSTMENT: { label: 'Ajuste', color: 'bg-yellow-100 text-yellow-800', icon: Settings },
};

export function PointsTransactionsTable({ transactions, loading }: PointsTransactionsTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma transacao encontrada.
      </div>
    );
  }

  // Desktop Table
  const DesktopTable = () => (
    <div className="hidden md:block rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Quantidade</TableHead>
            <TableHead>Descricao</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const config = typeConfig[transaction.type];
            const Icon = config.icon;
            const isPositive = transaction.amount > 0;

            return (
              <TableRow key={transaction.id}>
                <TableCell className="whitespace-nowrap">
                  {new Date(transaction.createdAt).toLocaleString('pt-BR')}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{transaction.pointsBalance.user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.pointsBalance.user.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`${config.color} gap-1`}>
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{transaction.amount.toLocaleString('pt-BR')}
                  </span>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {transaction.description}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  // Mobile Cards
  const MobileCards = () => (
    <div className="md:hidden space-y-3">
      {transactions.map((transaction) => {
        const config = typeConfig[transaction.type];
        const Icon = config.icon;
        const isPositive = transaction.amount > 0;

        return (
          <Card key={transaction.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium">{transaction.pointsBalance.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <span className={`font-bold text-lg ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{transaction.amount.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className={`${config.color} gap-1`}>
                  <Icon className="h-3 w-3" />
                  {config.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {transaction.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <>
      <DesktopTable />
      <MobileCards />
    </>
  );
}
