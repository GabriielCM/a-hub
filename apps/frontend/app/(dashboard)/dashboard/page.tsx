'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api, Space, Booking } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, ArrowRight, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DashboardPage() {
  const { user, accessToken } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [spacesData, bookingsData] = await Promise.all([
          api.getSpaces(),
          accessToken ? api.getMyBookings(accessToken) : Promise.resolve([]),
        ]);
        setSpaces(spacesData);
        setBookings(bookingsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [accessToken]);

  const upcomingBookings = bookings
    .filter(
      (b) =>
        new Date(b.date) >= new Date() &&
        (b.status === 'PENDING' || b.status === 'APPROVED')
    )
    .slice(0, 3);

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
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">
          Olá, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="mt-1 opacity-90">
          Bem-vindo ao A-hub. Gerencie seus agendamentos de espaços.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold">{spaces.length}</p>
                <p className="text-sm text-muted-foreground">Espaços</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold">{upcomingBookings.length}</p>
                <p className="text-sm text-muted-foreground">Reservas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Próximas Reservas</CardTitle>
            <CardDescription>Seus agendamentos confirmados</CardDescription>
          </div>
          <Link href="/dashboard/agendamentos">
            <Button variant="ghost" size="sm">
              Ver todas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma reserva agendada</p>
              <Link href="/dashboard/espacos">
                <Button variant="link" className="mt-2">
                  Explorar espaços
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{booking.space?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.date), "dd 'de' MMMM", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Spaces */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Espaços Disponíveis</CardTitle>
            <CardDescription>Explore e reserve</CardDescription>
          </div>
          <Link href="/dashboard/espacos">
            <Button variant="ghost" size="sm">
              Ver todos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {spaces.slice(0, 4).map((space) => (
              <Link
                key={space.id}
                href={`/dashboard/espacos/${space.id}`}
                className="group"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  {space.photos && space.photos[0] ? (
                    <img
                      src={space.photos[0]}
                      alt={space.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-medium text-white">{space.name}</h3>
                    <p className="text-sm text-white/80">
                      R$ {space.value.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
