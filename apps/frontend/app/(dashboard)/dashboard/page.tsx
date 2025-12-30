'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, PointsBalance, Booking } from '@/lib/api';
import { HeroCard } from '@/components/dashboard/hero-card';
import { QuickAccessGrid } from '@/components/dashboard/quick-access-grid';
import { ShortcutCarousel } from '@/components/dashboard/shortcut-carousel';
import { PostTimeline } from '@/components/posts/post-timeline';
import { PullToRefresh } from '@/components/feedback/pull-to-refresh';
import { FloatingActionButton } from '@/components/navigation/floating-action-button';
import { Calendar, QrCode } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [pointsBalance, setPointsBalance] = useState<PointsBalance | null>(
    null
  );
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      const [balanceData, bookingsData, memberCardData] = await Promise.all([
        api.getMyPointsBalance(accessToken).catch(() => null),
        api.getMyBookings(accessToken),
        api.getMyMemberCard(accessToken).catch(() => null),
      ]);

      setPointsBalance(balanceData);
      setUserPhoto(memberCardData?.photo || null);

      const upcoming = bookingsData.filter(
        (b) =>
          new Date(b.date) >= new Date() &&
          (b.status === 'PENDING' || b.status === 'APPROVED')
      );
      setUpcomingBookings(upcoming);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    await loadData();
  };

  if (isLoading || !accessToken || !user) {
    return <DashboardSkeleton />;
  }

  const isAdmin = user.role === 'ADMIN';

  const fabActions = [
    {
      icon: Calendar,
      label: 'Nova Reserva',
      onClick: () => router.push('/dashboard/espacos'),
      bgColor: 'bg-blue-500',
      color: 'text-white',
    },
    {
      icon: QrCode,
      label: 'Check-in Evento',
      onClick: () => router.push('/dashboard/eventos'),
      bgColor: 'bg-pink-500',
      color: 'text-white',
    },
  ];

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6 pb-8"
        >
          {/* Hero Card - Greeting + Balance */}
          <motion.div variants={itemVariants}>
            <HeroCard
              userName={user.name || 'Usuário'}
              userPhoto={userPhoto}
              balance={pointsBalance?.balance ?? 0}
            />
          </motion.div>

          {/* Quick Actions - 2x2 Grid */}
          <motion.div variants={itemVariants}>
            <QuickAccessGrid
              pointsBalance={pointsBalance?.balance ?? 0}
              upcomingBookingsCount={upcomingBookings.length}
            />
          </motion.div>

          {/* Shortcuts Carousel */}
          <motion.div variants={itemVariants}>
            <ShortcutCarousel />
          </motion.div>

          {/* Feed Section */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Feed</h2>
            </div>
            <PostTimeline
              accessToken={accessToken}
              currentUserId={user.id}
              userName={user.name}
              userPhoto={userPhoto}
              isAdmin={isAdmin}
            />
          </motion.div>
        </motion.div>
      </PullToRefresh>

      {/* Floating Action Button - Outside PullToRefresh to maintain fixed position */}
      <FloatingActionButton actions={fabActions} />
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      {/* Hero skeleton */}
      <div className="h-44 rounded-3xl skeleton" />

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl skeleton" />
        ))}
      </div>

      {/* Carousel skeleton */}
      <div>
        <div className="h-4 w-24 rounded skeleton mb-3" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl skeleton" />
              <div className="w-12 h-3 rounded skeleton" />
            </div>
          ))}
        </div>
      </div>

      {/* Feed skeleton */}
      <div>
        <div className="h-5 w-12 rounded skeleton mb-4" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl skeleton h-48" />
          ))}
        </div>
      </div>
    </div>
  );
}
