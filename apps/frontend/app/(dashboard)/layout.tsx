'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { ModernBottomNav } from '@/components/navigation/modern-bottom-nav';
import { PushNotificationDialog } from '@/components/notifications/push-notification-dialog';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          {/* Modern animated spinner */}
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            {/* Inner glow */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/20 to-transparent animate-pulse-soft" />
          </div>
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" />

      {/* Main Content */}
      <main className="md:pl-64 pb-20 md:pb-0 overflow-x-hidden">
        <div className="p-4 md:p-6 max-w-4xl mx-auto">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <ModernBottomNav className="md:hidden" />

      {/* Push Notification Permission Dialog */}
      <PushNotificationDialog />
    </div>
  );
}
