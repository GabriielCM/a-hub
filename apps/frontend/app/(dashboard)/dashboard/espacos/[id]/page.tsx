'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api, Space, SpaceAvailability } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { PullToRefresh } from '@/components/feedback/pull-to-refresh';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { MapPin, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

function SpaceDetailSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      <div className="h-10 w-24 skeleton rounded-xl" />
      <div className="aspect-video skeleton rounded-2xl" />
      <div className="space-y-3">
        <div className="h-8 w-3/4 skeleton rounded-lg" />
        <div className="h-4 w-full skeleton rounded-lg" />
        <div className="h-4 w-2/3 skeleton rounded-lg" />
        <div className="h-7 w-32 skeleton rounded-lg mt-4" />
      </div>
      <div className="skeleton rounded-2xl h-96" />
    </div>
  );
}

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
  const [[page, direction], setPage] = useState([0, 0]);

  const spaceId = params.id as string;

  const loadSpace = useCallback(async () => {
    try {
      const data = await api.getSpace(spaceId);
      setSpace(data);
    } catch (error) {
      console.error('Error loading space:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao carregar espaco',
      });
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, toast]);

  const loadAvailability = useCallback(async () => {
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
  }, [spaceId, currentMonth]);

  useEffect(() => {
    loadSpace();
  }, [loadSpace]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([loadSpace(), loadAvailability()]);
  };

  const paginate = (newDirection: number) => {
    if (!space?.photos) return;
    const newIndex = currentPhotoIndex + newDirection;
    if (newIndex >= 0 && newIndex < space.photos.length) {
      setPage([newIndex, newDirection]);
      setCurrentPhotoIndex(newIndex);
    }
  };

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
        description: 'Sua solicitacao foi enviada e aguarda aprovacao.',
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
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMonth.toISOString()}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="grid grid-cols-7 gap-1"
        >
          {paddingDays.map((_, i) => (
            <div key={`padding-${i}`} />
          ))}
          {days.map((day) => {
            const isBooked = isDateBooked(day);
            const selectable = isDateSelectable(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <motion.button
                key={day.toISOString()}
                whileTap={selectable ? { scale: 0.9 } : undefined}
                onClick={() => handleDateSelect(day)}
                disabled={!selectable}
                className={cn(
                  'aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200',
                  !isSameMonth(day, currentMonth) && 'text-gray-300',
                  isToday(day) && 'bg-gray-100 text-gray-900',
                  isBooked && 'bg-red-100 text-red-600 cursor-not-allowed',
                  selectable && !isSelected && 'hover:bg-purple-100 cursor-pointer',
                  !selectable && !isBooked && 'text-gray-300 cursor-not-allowed',
                  isSelected && 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/25'
                )}
              >
                {format(day, 'd')}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    );
  };

  if (isLoading) {
    return <SpaceDetailSkeleton />;
  }

  if (!space) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6">
          <MapPin className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Espaco nao encontrado
        </h3>
        <p className="text-muted-foreground text-center">
          O espaco que voce procura nao existe
        </p>
      </div>
    );
  }

  return (
    <>
    <PullToRefresh onRefresh={handleRefresh}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6 pb-32"
      >
        {/* Back Button */}
        <motion.div variants={itemVariants}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-gray-100 transition-colors'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="font-medium">Voltar</span>
          </motion.button>
        </motion.div>

        {/* Photo Gallery */}
        {space.photos && space.photos.length > 0 ? (
          <motion.div
            variants={itemVariants}
            className="relative aspect-video rounded-2xl overflow-hidden bg-muted shadow-lg"
          >
            <AnimatePresence initial={false} custom={direction}>
              <motion.img
                key={page}
                src={space.photos[currentPhotoIndex]}
                alt={space.name}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>

            {space.photos.length > 1 && (
              <>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => paginate(-1)}
                  disabled={currentPhotoIndex === 0}
                  className={cn(
                    'absolute left-3 top-1/2 -translate-y-1/2',
                    'w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm',
                    'flex items-center justify-center shadow-lg',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-transform hover:scale-105'
                  )}
                >
                  <ChevronLeft className="h-5 w-5 text-gray-800" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => paginate(1)}
                  disabled={currentPhotoIndex === space.photos!.length - 1}
                  className={cn(
                    'absolute right-3 top-1/2 -translate-y-1/2',
                    'w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm',
                    'flex items-center justify-center shadow-lg',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-transform hover:scale-105'
                  )}
                >
                  <ChevronRight className="h-5 w-5 text-gray-800" />
                </motion.button>

                {/* Dot indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-2 bg-black/40 rounded-full backdrop-blur-sm">
                  {space.photos.map((_, i) => (
                    <motion.button
                      key={i}
                      onClick={() => {
                        setPage([i, i > currentPhotoIndex ? 1 : -1]);
                        setCurrentPhotoIndex(i);
                      }}
                      className={cn(
                        'w-2 h-2 rounded-full transition-all duration-200',
                        i === currentPhotoIndex
                          ? 'bg-white w-4'
                          : 'bg-white/50 hover:bg-white/70'
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={itemVariants}
            className="aspect-video rounded-2xl bg-gradient-to-br from-purple-100 to-fuchsia-100 flex items-center justify-center"
          >
            <MapPin className="h-16 w-16 text-purple-300" />
          </motion.div>
        )}

        {/* Space Info */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">{space.name}</h1>
          {space.description && (
            <p className="text-muted-foreground leading-relaxed">{space.description}</p>
          )}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              R$ {space.value.toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground">/ dia</span>
          </div>
        </motion.div>

        {/* Calendar */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl bg-white border border-gray-100 shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Disponibilidade</h3>
                  <p className="text-sm text-muted-foreground">Selecione uma data</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handlePreviousMonth}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </motion.button>
                <span className="min-w-[130px] text-center font-medium text-sm capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            {renderCalendar()}
          </div>

          {/* Legend */}
          <div className="px-4 pb-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500" />
                <span className="text-muted-foreground">Selecionado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-muted-foreground">Ocupado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-200" />
                <span className="text-muted-foreground">Hoje</span>
              </div>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </PullToRefresh>

    {/* Booking Card - Fixed at bottom */}
    <AnimatePresence>
      {selectedDate && space && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-20 md:bottom-4 left-0 right-0 px-4 z-50"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total: R$ {space.value.toFixed(2)}
                </p>
              </div>
              <Button
                onClick={handleBooking}
                disabled={isBooking}
                className={cn(
                  'rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600',
                  'hover:from-purple-700 hover:to-fuchsia-700 font-semibold'
                )}
              >
                {isBooking ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Reservando...
                  </span>
                ) : (
                  'Reservar'
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
  );
}
