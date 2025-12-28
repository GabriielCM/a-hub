'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePushNotifications } from '@/lib/hooks/use-push-notifications';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';

const PROMPT_DISMISSED_KEY = 'push-notification-prompt-dismissed';
const PROMPT_ACCEPTED_KEY = 'push-notification-prompt-accepted';

export function PushNotificationDialog() {
  const { isAuthenticated } = useAuth();
  const { isSupported, permission, isSubscribed, isLoading, subscribe } =
    usePushNotifications();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if we should show the dialog
    const shouldShow = () => {
      if (typeof window === 'undefined') return false;
      if (!isAuthenticated) {
        console.log('[PushDialog] Not showing: not authenticated');
        return false;
      }
      if (!isSupported) {
        console.log('[PushDialog] Not showing: push not supported');
        return false;
      }
      if (isSubscribed) {
        console.log('[PushDialog] Not showing: already subscribed');
        return false;
      }
      // Removed isLoading check - show dialog even while loading
      if (permission === 'denied') {
        console.log('[PushDialog] Not showing: permission denied');
        return false;
      }

      // Check if user dismissed the prompt
      const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);
      if (dismissed) {
        console.log('[PushDialog] Not showing: user dismissed before');
        return false;
      }

      // Check if user already accepted
      const accepted = localStorage.getItem(PROMPT_ACCEPTED_KEY);
      if (accepted) {
        console.log('[PushDialog] Not showing: user already accepted');
        return false;
      }

      console.log('[PushDialog] All conditions met, will show dialog');
      return true;
    };

    let attempts = 0;
    const maxAttempts = 10;
    let intervalId: NodeJS.Timeout | null = null;

    // Try to show dialog
    const tryShowDialog = () => {
      if (attempts >= maxAttempts) {
        console.log('[PushDialog] Max attempts reached');
        if (intervalId) clearInterval(intervalId);
        return;
      }
      attempts++;
      console.log(`[PushDialog] Attempt ${attempts}/${maxAttempts}`);

      if (shouldShow() && !isOpen) {
        setIsOpen(true);
        if (intervalId) clearInterval(intervalId);
      }
    };

    // Initial delay of 5 seconds (wait for password save dialog to close)
    const timer = setTimeout(() => {
      tryShowDialog();

      // If not open yet, retry every 3 seconds
      if (!isOpen) {
        intervalId = setInterval(tryShowDialog, 3000);
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthenticated, isSupported, isSubscribed, permission, isOpen]);

  const handleEnable = async () => {
    // Keep dialog open while subscribing - wait for completion
    const success = await subscribe();

    // Now close and mark as accepted
    localStorage.setItem(PROMPT_ACCEPTED_KEY, 'true');
    setIsOpen(false);

    if (success) {
      toast({
        title: 'Notificacoes ativadas!',
        description:
          'Voce recebera alertas sobre pontos, curtidas e comentarios.',
      });
    } else {
      toast({
        title: 'Erro ao ativar notificacoes',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
    setIsOpen(false);
  };

  // Don't render if conditions aren't met
  if (
    !isAuthenticated ||
    !isSupported ||
    isSubscribed ||
    permission === 'denied'
  ) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">
            Ativar Notificacoes
          </DialogTitle>
          <DialogDescription className="text-center">
            Receba alertas em tempo real quando voce receber transferencias de
            pontos, curtidas ou comentarios nas suas publicacoes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2 mt-4">
          <Button variant="outline" onClick={handleDismiss}>
            Agora nao
          </Button>
          <Button onClick={handleEnable} disabled={isLoading}>
            {isLoading ? 'Ativando...' : 'Ativar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
