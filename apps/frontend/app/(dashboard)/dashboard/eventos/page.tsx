'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, UserEvent } from '@/lib/api';
import { EventCard } from '@/components/events/event-card';
import { EventCheckinModal } from '@/components/events/event-checkin-modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Gift, CheckCircle } from 'lucide-react';

export default function EventosPage() {
  const { accessToken } = useAuth();
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinModal, setCheckinModal] = useState<{
    isOpen: boolean;
    eventId: string;
    eventName: string;
  }>({ isOpen: false, eventId: '', eventName: '' });

  const loadEvents = useCallback(async () => {
    if (!accessToken) return;

    try {
      const data = await api.getUserEvents(accessToken);
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleOpenCheckin = (eventId: string, eventName: string) => {
    setCheckinModal({ isOpen: true, eventId, eventName });
  };

  const handleCloseCheckin = () => {
    setCheckinModal({ isOpen: false, eventId: '', eventName: '' });
  };

  const handleCheckinSuccess = () => {
    // Reload events to update check-in counts
    loadEvents();
  };

  // Calculate stats
  const totalPointsEarned = events.reduce(
    (sum, e) => sum + e.checkins.reduce((s, c) => s + c.pointsAwarded, 0),
    0
  );
  const totalCheckins = events.reduce((sum, e) => sum + e.userCheckinCount, 0);
  const eventsWithCheckin = events.filter((e) => e.userCheckinCount > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold">Eventos</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Eventos Disponiveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{events.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Seus Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalCheckins}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                em {eventsWithCheckin} evento(s)
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Pontos Ganhos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{totalPointsEarned}</p>
          </CardContent>
        </Card>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum evento disponivel</h3>
            <p className="text-muted-foreground">
              Novos eventos aparecerao aqui quando estiverem ativos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onCheckin={handleOpenCheckin}
            />
          ))}
        </div>
      )}

      {/* Check-in Modal */}
      <EventCheckinModal
        eventId={checkinModal.eventId}
        eventName={checkinModal.eventName}
        isOpen={checkinModal.isOpen}
        onClose={handleCloseCheckin}
        onSuccess={handleCheckinSuccess}
      />
    </div>
  );
}
