'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { api, PointsBalance, PointsTransaction } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { PullToRefresh } from '@/components/feedback/pull-to-refresh';
import { KyoskPaymentModal } from '@/components/kyosk/kyosk-payment-modal';
import {
  PointsSkeleton,
  PointsHeroCard,
  PointsQuickActions,
  PointsTransactionList,
  PointsTransferSheet,
} from '@/components/pontos';

type PublicUser = { id: string; name: string; email: string };

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: 'easeOut',
    },
  },
};

export default function PontosPage() {
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const historyRef = useRef<HTMLDivElement>(null);

  // Data states
  const [balance, setBalance] = useState<PointsBalance | null>(null);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isQrPaymentOpen, setIsQrPaymentOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // Load data function
  const loadData = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const [balanceData, historyData, usersData] = await Promise.all([
        api.getMyPointsBalance(accessToken),
        api.getPointsHistory(accessToken),
        api.searchUsers(accessToken),
      ]);

      setBalance(balanceData);
      setTransactions(historyData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Nao foi possivel carregar seus pontos. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken, toast]);

  // Initial load
  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, loadData]);

  // Pull to refresh handler
  const handleRefresh = async () => {
    await loadData();
  };

  // Reload data after QR payment
  const handleQrPaymentSuccess = async () => {
    if (!accessToken) return;
    try {
      const [balanceData, historyData] = await Promise.all([
        api.getMyPointsBalance(accessToken),
        api.getPointsHistory(accessToken),
      ]);
      setBalance(balanceData);
      setTransactions(historyData);
      toast({
        title: 'Pagamento realizado!',
        description: 'Sua compra foi processada com sucesso.',
      });
    } catch (error) {
      console.error('Error reloading data:', error);
    }
  };

  // Handle transfer
  const handleTransfer = async (data: {
    toUserId: string;
    amount: number;
    description?: string;
  }) => {
    if (!accessToken) return;

    await api.transferPoints(data, accessToken);

    // Reload data after successful transfer
    const [balanceData, historyData] = await Promise.all([
      api.getMyPointsBalance(accessToken),
      api.getPointsHistory(accessToken),
    ]);
    setBalance(balanceData);
    setTransactions(historyData);

    toast({
      title: 'Transferencia realizada!',
      description: `${data.amount} pontos transferidos com sucesso.`,
    });
  };

  // Scroll to history
  const scrollToHistory = () => {
    historyRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Loading state
  if (loading || authLoading) {
    return <PointsSkeleton />;
  }

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6 pb-8"
        >
          {/* Page Header */}
          <motion.div variants={itemVariants}>
            <h1 className="text-2xl font-bold text-foreground">Meus Pontos</h1>
            <p className="text-muted-foreground">
              Gerencie seus pontos e transfira para outros associados
            </p>
          </motion.div>

          {/* Hero Balance Card */}
          <motion.div variants={itemVariants}>
            <PointsHeroCard balance={balance?.balance ?? 0} />
          </motion.div>

          {/* Quick Actions Carousel */}
          <motion.div variants={itemVariants}>
            <PointsQuickActions
              onQrPay={() => setIsQrPaymentOpen(true)}
              onTransfer={() => setIsTransferOpen(true)}
              onHistory={scrollToHistory}
              onStatement={scrollToHistory}
            />
          </motion.div>

          {/* Transaction List */}
          <motion.div variants={itemVariants} ref={historyRef}>
            <PointsTransactionList
              transactions={transactions}
              showHeader={true}
            />
          </motion.div>
        </motion.div>
      </PullToRefresh>

      {/* Transfer Sheet - Outside PullToRefresh */}
      <PointsTransferSheet
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        balance={balance?.balance ?? 0}
        users={users}
        currentUserId={user?.id}
        onTransfer={handleTransfer}
      />

      {/* QR Payment Modal */}
      {accessToken && (
        <KyoskPaymentModal
          open={isQrPaymentOpen}
          onOpenChange={setIsQrPaymentOpen}
          accessToken={accessToken}
          userBalance={balance?.balance ?? 0}
          onSuccess={handleQrPaymentSuccess}
        />
      )}
    </>
  );
}
