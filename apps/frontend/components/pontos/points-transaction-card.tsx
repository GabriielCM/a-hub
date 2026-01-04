'use client';

import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  Calendar,
  Store,
} from 'lucide-react';
import { PointsTransaction } from '@/lib/api';
import { cn } from '@/lib/utils';

type TransactionType = PointsTransaction['type'];

const transactionTypeConfig: Record<
  TransactionType,
  {
    label: string;
    icon: typeof ArrowUpRight;
    colorClass: string;
    bgClass: string;
    sign: '+' | '-';
  }
> = {
  CREDIT: {
    label: 'Credito',
    icon: ArrowDownLeft,
    colorClass: 'text-green-600',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    sign: '+',
  },
  DEBIT: {
    label: 'Debito',
    icon: ArrowUpRight,
    colorClass: 'text-red-600',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    sign: '-',
  },
  TRANSFER_IN: {
    label: 'Transferencia Recebida',
    icon: ArrowDownLeft,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    sign: '+',
  },
  TRANSFER_OUT: {
    label: 'Transferencia Enviada',
    icon: ArrowUpRight,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    sign: '-',
  },
  ADJUSTMENT: {
    label: 'Ajuste',
    icon: Settings,
    colorClass: 'text-gray-600',
    bgClass: 'bg-gray-100 dark:bg-gray-800/50',
    sign: '+',
  },
  EVENT_CHECKIN: {
    label: 'Check-in Evento',
    icon: Calendar,
    colorClass: 'text-green-600',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    sign: '+',
  },
  KYOSK_PURCHASE: {
    label: 'Compra Kyosk',
    icon: Store,
    colorClass: 'text-orange-600',
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    sign: '-',
  },
};

interface PointsTransactionCardProps {
  transaction: PointsTransaction;
  className?: string;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatPoints(amount: number, type: TransactionType) {
  const config = transactionTypeConfig[type];
  const sign = type === 'ADJUSTMENT' ? (amount >= 0 ? '+' : '') : config.sign;
  return `${sign}${Math.abs(amount).toLocaleString('pt-BR')}`;
}

export function PointsTransactionCard({
  transaction,
  className,
}: PointsTransactionCardProps) {
  const config = transactionTypeConfig[transaction.type];
  const Icon = config.icon;
  const isPositive =
    transaction.type === 'ADJUSTMENT'
      ? transaction.amount >= 0
      : config.sign === '+';

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'flex items-center gap-3 p-4 rounded-2xl border bg-card',
        'cursor-pointer transition-colors hover:bg-accent/50',
        className
      )}
    >
      {/* Icon */}
      <div className={cn('p-2.5 rounded-full flex-shrink-0', config.bgClass)}>
        <Icon className={cn('h-5 w-5', config.colorClass)} />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="font-medium text-sm truncate text-foreground">
          {transaction.description || config.label}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(transaction.createdAt)}
        </p>
      </div>

      {/* Amount */}
      <div
        className={cn(
          'font-semibold text-base flex-shrink-0 tabular-nums',
          isPositive ? 'text-green-600' : 'text-red-600'
        )}
      >
        {formatPoints(transaction.amount, transaction.type)}
      </div>
    </motion.div>
  );
}

export { transactionTypeConfig };
