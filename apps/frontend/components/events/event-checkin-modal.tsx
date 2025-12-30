'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRScanner } from '@/components/scanner/qr-scanner';
import { api, CheckinResult, CheckinStatus } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { CheckCircle, XCircle, QrCode, Gift } from 'lucide-react';

interface EventCheckinModalProps {
  eventId: string;
  eventName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: CheckinResult) => void;
}

type ModalState = 'loading' | 'scanning' | 'processing' | 'success' | 'error';

export function EventCheckinModal({
  eventId,
  eventName,
  isOpen,
  onClose,
  onSuccess,
}: EventCheckinModalProps) {
  const { accessToken } = useAuth();
  const [state, setState] = useState<ModalState>('loading');
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus | null>(null);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load checkin status when modal opens
  useEffect(() => {
    if (isOpen && accessToken) {
      setState('loading');
      api
        .getCheckinStatus(eventId, accessToken)
        .then((status) => {
          setCheckinStatus(status);
          if (!status.canCheckin) {
            if (status.waitTimeSeconds > 0) {
              setError(
                `Aguarde ${status.waitTimeSeconds} segundos para o proximo check-in`
              );
              setState('error');
            } else if (status.checkinsRemaining === 0) {
              setError('Voce ja atingiu o limite de check-ins neste evento');
              setState('error');
            } else {
              setState('scanning');
            }
          } else {
            setState('scanning');
          }
        })
        .catch((err) => {
          setError(err.message || 'Erro ao carregar status');
          setState('error');
        });
    }
  }, [isOpen, eventId, accessToken]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setState('loading');
        setResult(null);
        setError(null);
      }, 300);
    }
  }, [isOpen]);

  const handleScan = useCallback(
    async (qrPayload: string) => {
      if (!accessToken || state !== 'scanning') return;

      setState('processing');
      setError(null);

      try {
        const checkinResult = await api.eventCheckin(qrPayload, accessToken);
        setResult(checkinResult);
        setState('success');
        onSuccess?.(checkinResult);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao processar check-in';
        setError(errorMessage);
        setState('error');
      }
    },
    [accessToken, state, onSuccess]
  );

  const handleRetry = useCallback(() => {
    setError(null);
    setState('scanning');
  }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Check-in
          </DialogTitle>
          <DialogDescription>{eventName}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Loading State */}
          {state === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          )}

          {/* Checkin Status Info */}
          {checkinStatus && state !== 'loading' && state !== 'success' && (
            <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
              <div className="flex justify-between">
                <span>Seus check-ins:</span>
                <span className="font-medium">
                  {checkinStatus.userCheckinCount} /{' '}
                  {checkinStatus.event.allowMultipleCheckins
                    ? checkinStatus.event.maxCheckinsPerUser
                    : 1}
                </span>
              </div>
              {checkinStatus.totalPointsEarned > 0 && (
                <div className="flex justify-between mt-1">
                  <span>Pontos ganhos:</span>
                  <span className="font-medium text-primary">
                    {checkinStatus.totalPointsEarned}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Scanning State - Keep QRScanner mounted while modal is open */}
          <div className={state === 'scanning' ? 'flex flex-col items-center' : 'hidden'}>
            {isOpen && (
              <QRScanner
                onScan={handleScan}
                isProcessing={state !== 'scanning'}
                width={280}
              />
            )}
            <p className="mt-4 text-sm text-muted-foreground text-center">
              Aponte a camera para o QR Code do evento
            </p>
          </div>

          {/* Processing State */}
          {state === 'processing' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-4" />
              <p className="text-lg font-medium">Processando check-in...</p>
            </div>
          )}

          {/* Success State */}
          {state === 'success' && result && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-600 mb-2">
                Check-in realizado!
              </h3>
              <div className="flex items-center gap-2 text-2xl font-bold text-primary mb-4">
                <Gift className="h-6 w-6" />
                +{result.pointsAwarded} pontos
              </div>
              {result.checkinsRemaining > 0 && (
                <p className="text-sm text-muted-foreground">
                  Restam {result.checkinsRemaining} check-in(s)
                </p>
              )}
              <Button onClick={handleClose} className="mt-6 w-full">
                Fechar
              </Button>
            </div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-red-600 mb-2">
                Check-in falhou
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                {error}
              </p>
              <div className="flex gap-3 w-full">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Fechar
                </Button>
                {checkinStatus?.canCheckin && (
                  <Button onClick={handleRetry} className="flex-1">
                    Tentar novamente
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
