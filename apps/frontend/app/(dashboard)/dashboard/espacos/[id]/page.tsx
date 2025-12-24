'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { api, Space, SpaceAvailability } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { MapPin, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function SpaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [space, setSpace] = useState<Space | null>(null);
  const [availability, setAvailability] = useState<SpaceAvailability | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const spaceId = params.id as string;

  useEffect(() => {
    async function loadSpace() {
      try {
        const data = await api.getSpace(spaceId);
        setSpace(data);
      } catch (error) {
        console.error('Error loading space:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Erro ao carregar espaço',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadSpace();
  }, [spaceId, toast]);

  useEffect(() => {
    async function loadAvailability() {
      try {
        const data = await api.getSpaceAvailability(
          spaceId,
          currentMonth.getMonth() + 1,
          currentMonth.getFullYear()
        );
        setAvailability(data);
      } catch (error) {
        console.error('Error loading availability:', error);
      }
    }

    loadAvailability();
  }, [spaceId, currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isDateBooked = (date: Date) => {
    if (!availability) return false;
    return availability.bookedDates.some((bd) =>
      isSameDay(new Date(bd.date), date)
    );
  };

  const isDateSelectable = (date: Date) => {
    const today = startOfDay(new Date());
    return !isBefore(date, today) && !isToday(date) && !isDateBooked(date);
  };

  const handleDateSelect = (date: Date) => {
    if (isDateSelectable(date)) {
      setSelectedDate(date);
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !accessToken) return;

    setIsBooking(true);
    try {
      await api.createBooking(
        {
          date: format(selectedDate, 'yyyy-MM-dd'),
          spaceId,
        },
        accessToken
      );

      toast({
        title: 'Reserva solicitada!',
        description: 'Sua solicitação foi enviada e aguarda aprovação.',
      });

      router.push('/dashboard/agendamentos');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao fazer reserva',
      });
    } finally {
      setIsBooking(false);
    }
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startPadding = monthStart.getDay();
    const paddingDays = Array.from({ length: startPadding }, (_, i) => null);

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
        {paddingDays.map((_, i) => (
          <div key={`padding-${i}`} />
        ))}
        {days.map((day) => {
          const isBooked = isDateBooked(day);
          const selectable = isDateSelectable(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateSelect(day)}
              disabled={!selectable}
              className={cn(
                'aspect-square flex items-center justify-center rounded-lg text-sm transition-colors',
                !isSameMonth(day, currentMonth) && 'text-muted-foreground',
                isToday(day) && 'bg-muted font-semibold',
                isBooked && 'bg-red-100 text-red-800 cursor-not-allowed',
                selectable && 'hover:bg-primary/10 cursor-pointer',
                !selectable && !isBooked && 'text-muted-foreground cursor-not-allowed',
                isSelected && 'bg-primary text-white hover:bg-primary'
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Espaço não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar
      </Button>

      {/* Photo Gallery */}
      {space.photos && space.photos.length > 0 ? (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          <img
            src={space.photos[currentPhotoIndex]}
            alt={space.name}
            className="w-full h-full object-cover"
          />
          {space.photos.length > 1 && (
            <>
              <button
                onClick={() =>
                  setCurrentPhotoIndex((i) =>
                    i === 0 ? space.photos!.length - 1 : i - 1
                  )
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() =>
                  setCurrentPhotoIndex((i) =>
                    i === space.photos!.length - 1 ? 0 : i + 1
                  )
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {space.photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhotoIndex(i)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      i === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
          <MapPin className="h-16 w-16 text-muted-foreground" />
        </div>
      )}

      {/* Space Info */}
      <div>
        <h1 className="text-2xl font-bold">{space.name}</h1>
        {space.description && (
          <p className="text-muted-foreground mt-2">{space.description}</p>
        )}
        <p className="text-xl font-semibold text-primary mt-4">
          R$ {space.value.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">/ dia</span>
        </p>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Disponibilidade
              </CardTitle>
              <CardDescription>
                Selecione uma data para reservar
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[140px] text-center font-medium">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderCalendar()}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary" />
              <span>Selecionado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100" />
              <span>Ocupado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted" />
              <span>Hoje</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Button */}
      {selectedDate && (
        <Card className="sticky bottom-20 md:bottom-4 bg-white/95 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {format(selectedDate, "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total: R$ {space.value.toFixed(2)}
                </p>
              </div>
              <Button onClick={handleBooking} disabled={isBooking}>
                {isBooking ? 'Reservando...' : 'Reservar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
