'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, PointsBalance, PointsTransaction } from '@/lib/api';

type PublicUser = { id: string; name: string; email: string };
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Settings,
  Search,
  Send,
  Loader2,
  Wallet,
  History,
  QrCode,
  Calendar,
  Store,
} from 'lucide-react';
import { KyoskPaymentModal } from '@/components/kyosk/kyosk-payment-modal';

type TransactionType = PointsTransaction['type'];

const transactionTypeConfig: Record<TransactionType, {
  label: string;
  icon: typeof ArrowUpRight;
  colorClass: string;
  bgClass: string;
  sign: '+' | '-';
}> = {
  CREDIT: {
    label: 'Credito',
    icon: ArrowDownLeft,
    colorClass: 'text-green-600',
    bgClass: 'bg-green-100',
    sign: '+',
  },
  DEBIT: {
    label: 'Debito',
    icon: ArrowUpRight,
    colorClass: 'text-red-600',
    bgClass: 'bg-red-100',
    sign: '-',
  },
  TRANSFER_IN: {
    label: 'Transferencia Recebida',
    icon: ArrowDownLeft,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-100',
    sign: '+',
  },
  TRANSFER_OUT: {
    label: 'Transferencia Enviada',
    icon: ArrowUpRight,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-100',
    sign: '-',
  },
  ADJUSTMENT: {
    label: 'Ajuste',
    icon: Settings,
    colorClass: 'text-gray-600',
    bgClass: 'bg-gray-100',
    sign: '+',
  },
  EVENT_CHECKIN: {
    label: 'Check-in Evento',
    icon: Calendar,
    colorClass: 'text-green-600',
    bgClass: 'bg-green-100',
    sign: '+',
  },
  KYOSK_PURCHASE: {
    label: 'Compra Kyosk',
    icon: Store,
    colorClass: 'text-orange-600',
    bgClass: 'bg-orange-100',
    sign: '-',
  },
};

export default function PontosPage() {
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Data states
  const [balance, setBalance] = useState<PointsBalance | null>(null);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Transfer form states
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // QR Payment modal state
  const [isQrPaymentOpen, setIsQrPaymentOpen] = useState(false);

  // Filter users based on search email
  const filteredUsers = useMemo(() => {
    if (!searchEmail.trim()) return [];
    const search = searchEmail.toLowerCase();
    return users
      .filter((u) =>
        u.id !== user?.id &&
        (u.email.toLowerCase().includes(search) || u.name.toLowerCase().includes(search))
      )
      .slice(0, 5);
  }, [users, searchEmail, user?.id]);

  // Load data
  useEffect(() => {
    async function loadData() {
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
    }

    if (!authLoading) {
      loadData();
    }
  }, [accessToken, authLoading, toast]);

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

  // Handle user selection
  const handleSelectUser = (selectedUser: PublicUser) => {
    setSelectedUser(selectedUser);
    setSearchEmail(selectedUser.email);
    setShowUserDropdown(false);
  };

  // Clear selection when search changes
  const handleSearchChange = (value: string) => {
    setSearchEmail(value);
    if (selectedUser && value !== selectedUser.email) {
      setSelectedUser(null);
    }
    setShowUserDropdown(value.length > 0);
  };

  // Validate transfer
  const validateTransfer = (): string | null => {
    if (!selectedUser) {
      return 'Selecione um usuario para transferir';
    }

    const amount = Number(transferAmount);
    if (!transferAmount || isNaN(amount) || amount <= 0) {
      return 'Informe um valor valido maior que zero';
    }

    if (balance && amount > balance.balance) {
      return 'Saldo insuficiente para esta transferencia';
    }

    return null;
  };

  // Handle transfer
  const handleTransfer = async () => {
    const error = validateTransfer();
    if (error) {
      toast({
        title: 'Erro de validacao',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    if (!accessToken || !selectedUser) return;

    setIsTransferring(true);

    try {
      await api.transferPoints(
        {
          toUserId: selectedUser.id,
          amount: Number(transferAmount),
          description: transferDescription || undefined,
        },
        accessToken
      );

      toast({
        title: 'Transferencia realizada!',
        description: `${transferAmount} pontos transferidos para ${selectedUser.name}`,
      });

      // Reload data
      const [balanceData, historyData] = await Promise.all([
        api.getMyPointsBalance(accessToken),
        api.getPointsHistory(accessToken),
      ]);

      setBalance(balanceData);
      setTransactions(historyData);

      // Reset form
      setSearchEmail('');
      setSelectedUser(null);
      setTransferAmount('');
      setTransferDescription('');
    } catch (error) {
      console.error('Transfer error:', error);
      toast({
        title: 'Erro na transferencia',
        description: error instanceof Error ? error.message : 'Nao foi possivel realizar a transferencia',
        variant: 'destructive',
      });
    } finally {
      setIsTransferring(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Format points
  const formatPoints = (amount: number, type: TransactionType) => {
    const config = transactionTypeConfig[type];
    const sign = type === 'ADJUSTMENT' ? (amount >= 0 ? '+' : '') : config.sign;
    return `${sign}${Math.abs(amount).toLocaleString('pt-BR')}`;
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Meus Pontos</h1>
        <p className="text-muted-foreground">
          Gerencie seus pontos e transfira para outros associados
        </p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary via-primary to-primary/80 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>
        <CardContent className="relative z-10 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Saldo Disponivel</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  {balance?.balance?.toLocaleString('pt-BR') ?? '0'}
                </span>
                <span className="text-white/80 text-lg">pontos</span>
              </div>
            </div>
            <div className="p-4 bg-white/20 rounded-full">
              <Wallet className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Payment Card */}
      <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setIsQrPaymentOpen(true)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <QrCode className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Pagar via QR Code</h3>
              <p className="text-sm text-muted-foreground">
                Escaneie o QR Code do Kyosk para pagar com pontos
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setIsQrPaymentOpen(true); }}>
              Escanear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content - 2 columns on desktop */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Transaction History */}
        <Card className="lg:order-1">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Historico de Transacoes</CardTitle>
                <CardDescription>Suas movimentacoes de pontos</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Coins className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Nenhuma transacao</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Suas movimentacoes de pontos aparecerao aqui
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {transactions.map((transaction) => {
                  const config = transactionTypeConfig[transaction.type];
                  const Icon = config.icon;

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      {/* Icon */}
                      <div className={`p-2 rounded-full ${config.bgClass}`}>
                        <Icon className={`h-4 w-4 ${config.colorClass}`} />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {transaction.description || config.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>

                      {/* Amount */}
                      <div className={`font-semibold ${config.colorClass}`}>
                        {formatPoints(transaction.amount, transaction.type)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transfer Section */}
        <Card className="lg:order-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ArrowRightLeft className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Transferir Pontos</CardTitle>
                <CardDescription>Envie pontos para outro associado</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Search */}
            <div className="space-y-2">
              <Label htmlFor="search-email">Destinatario</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-email"
                  type="email"
                  placeholder="Buscar por email ou nome..."
                  value={searchEmail}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchEmail.length > 0 && setShowUserDropdown(true)}
                  onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                  className="pl-10"
                />

                {/* User Dropdown */}
                {showUserDropdown && filteredUsers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectUser(u)}
                        className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex flex-col"
                      >
                        <span className="font-medium text-sm">{u.name}</span>
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected user indicator */}
              {selectedUser && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-green-600 rounded-full" />
                  Transferir para: {selectedUser.name}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="transfer-amount">Quantidade de Pontos</Label>
              <Input
                id="transfer-amount"
                type="number"
                min="1"
                max={balance?.balance ?? 0}
                placeholder="0"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Saldo disponivel: {balance?.balance?.toLocaleString('pt-BR') ?? '0'} pontos
              </p>

              {/* Insufficient balance warning */}
              {balance && Number(transferAmount) > balance.balance && (
                <p className="text-xs text-red-600">
                  Saldo insuficiente para esta transferencia
                </p>
              )}
            </div>

            {/* Description (optional) */}
            <div className="space-y-2">
              <Label htmlFor="transfer-description">
                Descricao <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="transfer-description"
                type="text"
                placeholder="Ex: Presente de aniversario"
                value={transferDescription}
                onChange={(e) => setTransferDescription(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Transfer Button */}
            <Button
              onClick={handleTransfer}
              disabled={isTransferring || !selectedUser || !transferAmount || Number(transferAmount) <= 0}
              className="w-full"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transferindo...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Transferir Pontos
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
