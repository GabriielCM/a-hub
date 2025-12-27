'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, PointsBalance, Booking } from '@/lib/api';
import { QuickAccessGrid } from '@/components/dashboard/quick-access-grid';
import { PostTimeline } from '@/components/posts/post-timeline';

export default function DashboardPage() {
  const { user, accessToken } = useAuth();
  const [pointsBalance, setPointsBalance] = useState<PointsBalance | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
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

        // Filter upcoming bookings
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
    }

    loadData();
  }, [accessToken]);

  if (isLoading || !accessToken || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Welcome Header - Mobile Optimized */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-4 text-white">
        <h1 className="text-xl font-bold">Ola, {user.name?.split(' ')[0]}!</h1>
        <p className="text-sm opacity-90">Bem-vindo ao A-hub</p>
      </div>

      {/* Quick Access Cards - 2x2 Grid */}
      <QuickAccessGrid
        pointsBalance={pointsBalance?.balance ?? 0}
        upcomingBookingsCount={upcomingBookings.length}
      />

      {/* Timeline Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Feed</h2>
        <PostTimeline
          accessToken={accessToken}
          currentUserId={user.id}
          userName={user.name}
          userPhoto={userPhoto}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
