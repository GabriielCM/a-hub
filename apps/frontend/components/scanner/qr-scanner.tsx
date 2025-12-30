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
  const isMountedRef = useRef(true);

  // Store callbacks in refs to avoid stale closures
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  // Keep refs updated
  useEffect(() => {
    onScanRef.current = onScan;
    onErrorRef.current = onError;
  }, [onScan, onError]);

  // Scan handler using refs - stable, no deps
  const handleScanInternal = useCallback((decodedText: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (decodedText !== lastScannedRef.current && isMountedRef.current) {
        lastScannedRef.current = decodedText;
        onScanRef.current(decodedText);
      }
    }, 300);
  }, []);

  // Stop scanner - access video element directly for iOS compatibility
  const stopScannerSync = useCallback(() => {
    // 1. FIRST: Stop tracks directly on the video element (iOS requires this)
    const videoElement = document.querySelector(
      '#qr-reader-container video'
    ) as HTMLVideoElement;

    if (videoElement) {
      // Stop all tracks from MediaStream
      if (videoElement.srcObject instanceof MediaStream) {
        videoElement.srcObject.getTracks().forEach((track) => {
          track.stop();
        });
        // Clear srcObject (critical for iOS to release camera hardware)
        videoElement.srcObject = null;
      }
      // Pause the video element
      videoElement.pause();
    }

    // 2. THEN: Call library's cleanup (redundant but safe)
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (
          state === Html5QrcodeScannerState.SCANNING ||
          state === Html5QrcodeScannerState.PAUSED
        ) {
          scannerRef.current.stop().catch(() => {});
        }
        scannerRef.current.clear();
      } catch {
        // Ignore cleanup errors
      }
      scannerRef.current = null;
    }
  }, []);

  // Mount/unmount effect - stable deps ensure cleanup runs properly
  useEffect(() => {
    isMountedRef.current = true;

    const startScanner = async () => {
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
          },
          handleScanInternal,
          () => {
            // Ignore scan errors (no QR in frame)
          }
        );

        if (isMountedRef.current) {
          setIsStarted(true);
          setError(null);
        }
      } catch (err) {
        if (isMountedRef.current) {
          const errorMessage =
            err instanceof Error ? err.message : 'Erro ao acessar camera';
          setError(errorMessage);
          onErrorRef.current?.(errorMessage);
        }
      }
    };

    startScanner();

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      stopScannerSync();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [handleScanInternal, stopScannerSync]);

  // Pause/resume based on isProcessing
  useEffect(() => {
    if (!scannerRef.current) return;

    try {
      const state = scannerRef.current.getState();
      if (isProcessing && state === Html5QrcodeScannerState.SCANNING) {
        scannerRef.current.pause();
      } else if (!isProcessing && state === Html5QrcodeScannerState.PAUSED) {
        scannerRef.current.resume();
        lastScannedRef.current = '';
      }
    } catch {
      // Ignore state errors
    }
  }, [isProcessing]);

  // Handle retry - restart scanner
  const handleRetry = useCallback(() => {
    setError(null);

    if (!scannerRef.current && containerRef.current) {
      const scanner = new Html5Qrcode('qr-reader-container');
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const size = Math.floor(minEdge * 0.7);
              return { width: size, height: size };
            },
          },
          handleScanInternal,
          () => {}
        )
        .then(() => {
          if (isMountedRef.current) {
            setIsStarted(true);
          }
        })
        .catch((err) => {
          if (isMountedRef.current) {
            const errorMessage =
              err instanceof Error ? err.message : 'Erro ao acessar camera';
            setError(errorMessage);
          }
        });
    }
  }, [handleScanInternal]);

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
              onClick={handleRetry}
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
