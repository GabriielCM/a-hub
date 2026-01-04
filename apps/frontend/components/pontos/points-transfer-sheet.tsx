'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Send,
  Loader2,
  CheckCircle2,
  User,
  AlertCircle,
} from 'lucide-react';
import { BottomSheet } from '@/components/feedback/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type PublicUser = { id: string; name: string; email: string };

interface TransferData {
  toUserId: string;
  amount: number;
  description?: string;
}

interface PointsTransferSheetProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  users: PublicUser[];
  currentUserId?: string;
  onTransfer: (data: TransferData) => Promise<void>;
}

type TransferState = 'form' | 'loading' | 'success' | 'error';

export function PointsTransferSheet({
  isOpen,
  onClose,
  balance,
  users,
  currentUserId,
  onTransfer,
}: PointsTransferSheetProps) {
  // Form states
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // UI states
  const [transferState, setTransferState] = useState<TransferState>('form');
  const [errorMessage, setErrorMessage] = useState('');

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchEmail.trim()) return [];
    const search = searchEmail.toLowerCase();
    return users
      .filter(
        (u) =>
          u.id !== currentUserId &&
          (u.email.toLowerCase().includes(search) ||
            u.name.toLowerCase().includes(search))
      )
      .slice(0, 5);
  }, [users, searchEmail, currentUserId]);

  // Reset form
  const resetForm = useCallback(() => {
    setSearchEmail('');
    setSelectedUser(null);
    setTransferAmount('');
    setTransferDescription('');
    setTransferState('form');
    setErrorMessage('');
    setShowUserDropdown(false);
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Handle user selection
  const handleSelectUser = (user: PublicUser) => {
    setSelectedUser(user);
    setSearchEmail(user.email);
    setShowUserDropdown(false);
  };

  // Handle search change
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
    if (amount > balance) {
      return 'Saldo insuficiente para esta transferencia';
    }
    return null;
  };

  // Handle transfer
  const handleTransfer = async () => {
    const error = validateTransfer();
    if (error) {
      setErrorMessage(error);
      setTransferState('error');
      setTimeout(() => setTransferState('form'), 2000);
      return;
    }

    if (!selectedUser) return;

    setTransferState('loading');

    try {
      await onTransfer({
        toUserId: selectedUser.id,
        amount: Number(transferAmount),
        description: transferDescription || undefined,
      });
      setTransferState('success');
      // Auto close after success
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel realizar a transferencia'
      );
      setTransferState('error');
      setTimeout(() => setTransferState('form'), 2000);
    }
  };

  const amount = Number(transferAmount);
  const isInsufficientBalance = !isNaN(amount) && amount > balance;
  const isValidForm =
    selectedUser && !isNaN(amount) && amount > 0 && !isInsufficientBalance;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Transferir Pontos"
      snapPoints={[0.7, 0.9]}
    >
      <AnimatePresence mode="wait">
        {/* Success State */}
        {transferState === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <CheckCircle2 className="w-20 h-20 text-green-500" />
            </motion.div>
            <h3 className="text-xl font-semibold mt-4 text-foreground">
              Transferencia realizada!
            </h3>
            <p className="text-muted-foreground text-center mt-2">
              {transferAmount} pontos transferidos para {selectedUser?.name}
            </p>
          </motion.div>
        )}

        {/* Error State */}
        {transferState === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <AlertCircle className="w-20 h-20 text-red-500" />
            </motion.div>
            <h3 className="text-xl font-semibold mt-4 text-foreground">Erro</h3>
            <p className="text-muted-foreground text-center mt-2">
              {errorMessage}
            </p>
          </motion.div>
        )}

        {/* Form State */}
        {(transferState === 'form' || transferState === 'loading') && (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* User Search */}
            <div className="space-y-2">
              <Label htmlFor="search-email" className="text-foreground">
                Destinatario
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-email"
                  type="text"
                  placeholder="Buscar por email ou nome..."
                  value={searchEmail}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchEmail.length > 0 && setShowUserDropdown(true)}
                  onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                  className="pl-10"
                  disabled={transferState === 'loading'}
                />

                {/* User Dropdown */}
                <AnimatePresence>
                  {showUserDropdown && filteredUsers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-10 w-full mt-1 bg-popover border rounded-xl shadow-lg max-h-48 overflow-y-auto"
                    >
                      {filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectUser(u)}
                          className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3 first:rounded-t-xl last:rounded-b-xl"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm text-foreground block truncate">
                              {u.name}
                            </span>
                            <span className="text-xs text-muted-foreground truncate block">
                              {u.email}
                            </span>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Selected user indicator */}
              <AnimatePresence>
                {selectedUser && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-sm text-green-600"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Transferir para: {selectedUser.name}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="transfer-amount" className="text-foreground">
                Quantidade de Pontos
              </Label>
              <Input
                id="transfer-amount"
                type="number"
                min="1"
                max={balance}
                placeholder="0"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                disabled={transferState === 'loading'}
                className={cn(isInsufficientBalance && 'border-red-500 focus-visible:ring-red-500')}
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Saldo disponivel: {balance.toLocaleString('pt-BR')} pontos
                </span>
                {isInsufficientBalance && (
                  <span className="text-red-600">Saldo insuficiente</span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="transfer-description" className="text-foreground">
                Descricao{' '}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </Label>
              <Input
                id="transfer-description"
                type="text"
                placeholder="Ex: Presente de aniversario"
                value={transferDescription}
                onChange={(e) => setTransferDescription(e.target.value)}
                maxLength={100}
                disabled={transferState === 'loading'}
              />
            </div>

            {/* Transfer Button */}
            <Button
              onClick={handleTransfer}
              disabled={transferState === 'loading' || !isValidForm}
              className="w-full h-12 text-base"
            >
              {transferState === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Transferindo...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Transferir Pontos
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </BottomSheet>
  );
}
