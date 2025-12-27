'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  api,
  AdminPointsTransaction,
  AdminPointsBalance,
  PointsSystemSummary,
  PointsReportFilters,
  User,
} from '@/lib/api';
import { PointsSummaryCards } from './points-summary-cards';
import { PointsFilters } from './points-filters';
import { PointsTransactionsTable } from './points-transactions-table';
import { PointsBalancesTable } from './points-balances-table';

interface PointsReportProps {
  accessToken: string;
}

export function PointsReport({ accessToken }: PointsReportProps) {
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<AdminPointsTransaction[]>([]);
  const [balances, setBalances] = useState<AdminPointsBalance[]>([]);
  const [summary, setSummary] = useState<PointsSystemSummary | null>(null);
  const [users, setUsers] = useState<Pick<User, 'id' | 'name' | 'email'>[]>([]);
  const [filters, setFilters] = useState<PointsReportFilters>({});
  const [activeTab, setActiveTab] = useState<'transactions' | 'balances'>('transactions');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [transactionsData, balancesData, summaryData, usersData] = await Promise.all([
        api.getAdminPointsTransactions(filters, accessToken),
        api.getAdminPointsBalances(accessToken),
        api.getPointsSystemSummary(accessToken),
        api.searchUsers(accessToken),
      ]);

      setTransactions(transactionsData);
      setBalances(balancesData);
      setSummary(summaryData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading points data:', error);
      toast({
        title: 'Erro',
        description: 'Nao foi possivel carregar os dados de pontos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const csvContent = await api.exportPointsReport(filters, accessToken);

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `pontos_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: 'Exportado',
        description: 'Relatorio exportado com sucesso.',
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: 'Erro',
        description: 'Nao foi possivel exportar o relatorio.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  // Calculate filtered balance for selected user
  const selectedUserBalance = filters.userId
    ? balances.find((b) => b.userId === filters.userId)?.balance ?? 0
    : null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <PointsSummaryCards summary={summary} loading={loading} />

      {/* Selected User Balance */}
      {selectedUserBalance !== null && (
        <div className="bg-primary/10 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Saldo do usuario selecionado</p>
          <p className="text-2xl font-bold text-primary">
            {selectedUserBalance.toLocaleString('pt-BR')} pts
          </p>
        </div>
      )}

      {/* Filters */}
      <PointsFilters
        filters={filters}
        users={users}
        onFiltersChange={setFilters}
        onClear={handleClearFilters}
      />

      {/* Tabs and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Tabs
          value={activeTab}
          onValueChange={(v: string) => setActiveTab(v as 'transactions' | 'balances')}
          className="w-full sm:w-auto"
        >
          <TabsList>
            <TabsTrigger value="transactions">
              Movimentacoes ({transactions.length})
            </TabsTrigger>
            <TabsTrigger value="balances">
              Saldos ({balances.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          onClick={handleExportCSV}
          disabled={exporting || loading}
          variant="outline"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'transactions' ? (
        <PointsTransactionsTable transactions={transactions} loading={loading} />
      ) : (
        <PointsBalancesTable balances={balances} loading={loading} />
      )}
    </div>
  );
}
