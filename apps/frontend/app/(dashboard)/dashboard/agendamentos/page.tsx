'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, Booking } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, MapPin, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function MyBookingsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadBookings() {
      if (!accessToken) return;

      try {
        const data = await api.getMyBookings(accessToken);
        setBookings(data);
      } catch (error) {
        console.error('Error loading bookings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadBookings();
  }, [accessToken]);

  const handleCancel = async (bookingId: string) => {
    if (!accessToken) return;

    setCancelingId(bookingId);
    try {
      await api.updateBookingStatus(bookingId, 'CANCELLED', accessToken);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: 'CANCELLED' } : b
        )
      );
      toast({
        title: 'Reserva cancelada',
        description: 'Sua reserva foi cancelada com sucesso.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao cancelar reserva',
      });
    } finally {
      setCancelingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };

    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      APPROVED: 'Aprovado',
      REJECTED: 'Rejeitado',
      CANCELLED: 'Cancelado',
    };

    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          styles[status]
        )}
      >
        {labels[status]}
      </span>
    );
  };

  const upcomingBookings = bookings.filter(
    (b) =>
      new Date(b.date) >= new Date() &&
      (b.status === 'PENDING' || b.status === 'APPROVED')
  );

  const pastBookings = bookings.filter(
    (b) =>
      new Date(b.date) < new Date() ||
      b.status === 'REJECTED' ||
      b.status === 'CANCELLED'
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Meus Agendamentos</h1>
        <p className="text-muted-foreground">
          Gerencie suas reservas de espaços
        </p>
      </div>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximas Reservas
          </CardTitle>
          <CardDescription>
            Reservas confirmadas ou pendentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma reserva agendada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-start justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{booking.space?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.date), "EEEE, dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                      <div className="mt-2">
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>
                  </div>
                  {(booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancelingId === booking.id}
                    >
                      {cancelingId === booking.id ? (
                        'Cancelando...'
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico</CardTitle>
            <CardDescription>
              Reservas passadas ou canceladas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-start justify-between p-4 rounded-lg border opacity-60"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">{booking.space?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.date), "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                      <div className="mt-2">
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
