'use client';

import { useState, useCallback } from 'react';
import { api, KyoskPaymentPreview } from '@/lib/api';
import { QRScanner } from '@/components/scanner/qr-scanner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  QrCode,
  Store,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

interface KyoskPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken: string;
  userBalance: number;
  onSuccess: () => void;
}

type Step = 'scan' | 'preview' | 'success' | 'error';

export function KyoskPaymentModal({
  open,
  onOpenChange,
  accessToken,
  userBalance,
  onSuccess,
}: KyoskPaymentModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('scan');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [preview, setPreview] = useState<KyoskPaymentPreview | null>(null);
  const [qrPayload, setQrPayload] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [paymentResult, setPaymentResult] = useState<{
    orderId: string;
    totalPoints: number;
    kyoskName: string;
  } | null>(null);

  const resetState = () => {
    setStep('scan');
    setIsProcessing(false);
    setIsPaying(false);
    setPreview(null);
    setQrPayload('');
    setErrorMessage('');
    setPaymentResult(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetState, 200);
  };

  const handleScan = useCallback(
    async (data: string) => {
      if (isProcessing) return;

      setIsProcessing(true);
      setQrPayload(data);

      try {
        const previewData = await api.validateKyoskPayment(data, accessToken);
        setPreview(previewData);
        setStep('preview');
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'QR Code invalido ou expirado';
        setErrorMessage(message);
        setStep('error');
      } finally {
        setIsProcessing(false);
      }
    },
    [accessToken, isProcessing]
  );

  const handleConfirmPayment = async () => {
    if (!qrPayload || isPaying) return;

    setIsPaying(true);

    try {
      const result = await api.payKyoskOrder(qrPayload, accessToken);
      setPaymentResult({
        orderId: result.orderId,
        totalPoints: result.totalPoints,
        kyoskName: result.kyoskName,
      });
      setStep('success');
      onSuccess();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Erro ao processar pagamento. Tente novamente.';
      toast({
        title: 'Erro no pagamento',
        description: message,
        variant: 'destructive',
      });
      setErrorMessage(message);
      setStep('error');
    } finally {
      setIsPaying(false);
    }
  };

  const handleRetry = () => {
    resetState();
  };

  const formatExpiresAt = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const insufficientBalance = preview ? preview.totalPoints > userBalance : false;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {step === 'scan' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Pagar via QR Code
              </DialogTitle>
              <DialogDescription>
                Escaneie o QR Code exibido no Kyosk para realizar o pagamento
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-center py-4">
              <QRScanner
                onScan={handleScan}
                isProcessing={isProcessing}
                width={280}
              />
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Posicione o QR Code dentro da area de leitura
            </p>
          </>
        )}

        {step === 'preview' && preview && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Confirmar Pagamento
              </DialogTitle>
              <DialogDescription>
                Verifique os detalhes antes de confirmar
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Kyosk Info */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Kyosk</span>
                <span className="text-sm">{preview.kyoskName}</span>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShoppingCart className="h-4 w-4" />
                  Itens do Pedido
                </div>
                <div className="border rounded-lg divide-y">
                  {preview.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 text-sm"
                    >
                      <div>
                        <span className="font-medium">{item.productName}</span>
                        <span className="text-muted-foreground ml-2">
                          x{item.quantity}
                        </span>
                      </div>
                      <span>
                        {(item.pointsPrice * item.quantity).toLocaleString(
                          'pt-BR'
                        )}{' '}
                        pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <span className="font-medium">Total</span>
                <span className="text-lg font-bold">
                  {preview.totalPoints.toLocaleString('pt-BR')} pontos
                </span>
              </div>

              {/* Balance Info */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Seu saldo atual</span>
                <span
                  className={
                    insufficientBalance ? 'text-destructive' : 'text-green-600'
                  }
                >
                  {userBalance.toLocaleString('pt-BR')} pontos
                </span>
              </div>

              {insufficientBalance && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Saldo insuficiente para realizar esta compra</span>
                </div>
              )}

              {/* Expiration */}
              <p className="text-center text-xs text-muted-foreground">
                QR Code valido ate {formatExpiresAt(preview.expiresAt)}
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleRetry}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleConfirmPayment}
                disabled={isPaying || insufficientBalance}
              >
                {isPaying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirmar Pagamento
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'success' && paymentResult && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Pagamento Realizado!
              </DialogTitle>
            </DialogHeader>

            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>

              <div className="space-y-1">
                <p className="text-lg font-medium">
                  {paymentResult.totalPoints.toLocaleString('pt-BR')} pontos
                </p>
                <p className="text-sm text-muted-foreground">
                  Pagos no {paymentResult.kyoskName}
                </p>
              </div>

              <Badge variant="outline" className="text-xs">
                Pedido #{paymentResult.orderId.slice(0, 8)}
              </Badge>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Fechar
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'error' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Erro
              </DialogTitle>
            </DialogHeader>

            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>

              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleRetry}>Tentar Novamente</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
