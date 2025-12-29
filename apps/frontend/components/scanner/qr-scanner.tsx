'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  isProcessing?: boolean;
  width?: number;
}

export function QRScanner({
  onScan,
  onError,
  isProcessing = false,
  width = 300,
}: QRScannerProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScannedRef = useRef<string>('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleScan = useCallback(
    (decodedText: string) => {
      // Prevent duplicate scans
      if (decodedText === lastScannedRef.current || isProcessing) {
        return;
      }

      // Debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        lastScannedRef.current = decodedText;
        onScan(decodedText);
      }, 300);
    },
    [onScan, isProcessing]
  );

  const startScanner = useCallback(async () => {
    if (!containerRef.current || scannerRef.current) return;

    try {
      const scanner = new Html5Qrcode('qr-reader-container');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minEdge * 0.7);
            return { width: size, height: size };
          },
          // SEM aspectRatio - deixar camera usar formato nativo (fix mobile)
        },
        handleScan,
        () => {
          // Ignore scan errors (no QR in frame)
        }
      );

      setIsStarted(true);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao acessar camera';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [handleScan, onError]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // Ignore stop errors
      }
      scannerRef.current = null;
      setIsStarted(false);
    }
  }, []);

  // Start scanner on mount
  useEffect(() => {
    startScanner();

    return () => {
      stopScanner();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [startScanner, stopScanner]);

  // Pause/resume based on isProcessing
  useEffect(() => {
    if (!scannerRef.current) return;

    try {
      const state = scannerRef.current.getState();
      if (isProcessing && state === Html5QrcodeScannerState.SCANNING) {
        scannerRef.current.pause();
      } else if (!isProcessing && state === Html5QrcodeScannerState.PAUSED) {
        scannerRef.current.resume();
        // Reset last scanned to allow re-scanning after processing
        lastScannedRef.current = '';
      }
    } catch {
      // Ignore state errors
    }
  }, [isProcessing]);

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{ width, height: width }}
    >
      <div
        id="qr-reader-container"
        ref={containerRef}
        className="[&_video]:object-cover [&_video]:!w-full [&_video]:!h-full"
        style={{ width: '100%', height: '100%' }}
      />

      {!isStarted && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Iniciando camera...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 rounded-lg p-4">
          <div className="text-center">
            <p className="text-sm text-destructive font-medium mb-2">
              {error}
            </p>
            <button
              onClick={() => {
                setError(null);
                startScanner();
              }}
              className="text-sm text-primary underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
          <div className="text-center text-white">
            <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm">Processando...</p>
          </div>
        </div>
      )}
    </div>
  );
}
