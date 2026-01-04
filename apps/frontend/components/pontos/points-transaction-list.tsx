'use client';

import { motion } from 'framer-motion';
import { Coins, History } from 'lucide-react';
import { PointsTransaction } from '@/lib/api';
import { PointsTransactionCard } from './points-transaction-card';
import { cn } from '@/lib/utils';

interface PointsTransactionListProps {
  transactions: PointsTransaction[];
  showHeader?: boolean;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.25,
      ease: 'easeOut',
    },
  },
};

export function PointsTransactionList({
  transactions,
  showHeader = true,
  className,
}: PointsTransactionListProps) {
  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex flex-col items-center justify-center py-12 text-center',
          className
        )}
      >
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Coins className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2 text-foreground">
          Nenhuma transacao
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Suas movimentacoes de pontos aparecerao aqui
        </p>
      </motion.div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <History className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Historico</h2>
        </div>
      )}

      {/* Transaction List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {transactions.map((transaction) => (
          <motion.div key={transaction.id} variants={itemVariants}>
            <PointsTransactionCard transaction={transaction} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
