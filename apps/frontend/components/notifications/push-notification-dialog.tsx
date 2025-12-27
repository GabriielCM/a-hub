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
      if (!isAuthenticated) return false;
      if (!isSupported) return false;
      if (isSubscribed) return false;
      if (isLoading) return false;
      if (permission === 'denied') return false;

      // Check if user dismissed the prompt
      const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);
      if (dismissed) return false;

      return true;
    };

    // Show dialog after a short delay
    const timer = setTimeout(() => {
      if (shouldShow()) {
        setIsOpen(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isSupported, isSubscribed, isLoading, permission]);

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      toast({
        title: 'Notificacoes ativadas!',
        description:
          'Voce recebera alertas sobre pontos, curtidas e comentarios.',
      });
      setIsOpen(false);
    } else {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel ativar as notificacoes.',
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
