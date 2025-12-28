'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserEvent } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Gift, QrCode, CheckCircle } from 'lucide-react';

interface EventCardProps {
  event: UserEvent;
  onCheckin: (eventId: string, eventName: string) => void;
}

export function EventCard({ event, onCheckin }: EventCardProps) {
  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);
  const now = new Date();
  const isActive = now >= startDate && now <= endDate;

  const maxCheckins = event.allowMultipleCheckins
    ? event.maxCheckinsPerUser ?? 1
    : 1;

  const pointsPerCheckin = Math.floor(event.totalPoints / maxCheckins);

  return (
    <Card className={!isActive ? 'opacity-70' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{event.name}</CardTitle>
          {isActive ? (
            <Badge variant="default">Ativo</Badge>
          ) : now < startDate ? (
            <Badge variant="secondary">Em breve</Badge>
          ) : (
            <Badge variant="outline">Encerrado</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        {event.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {format(startDate, "dd 'de' MMM", { locale: ptBR })} -{' '}
              {format(endDate, "dd 'de' MMM", { locale: ptBR })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {format(startDate, 'HH:mm', { locale: ptBR })} -{' '}
              {format(endDate, 'HH:mm', { locale: ptBR })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            <span className="font-medium text-primary">
              {pointsPerCheckin} pontos por check-in
            </span>
          </div>
        </div>

        {/* Check-in progress */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Seus check-ins</span>
            <span className="text-sm">
              {event.userCheckinCount} / {maxCheckins}
            </span>
          </div>
          <div className="w-full bg-background rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{
                width: `${(event.userCheckinCount / maxCheckins) * 100}%`,
              }}
            />
          </div>
          {event.checkins.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              Ultimo: {format(new Date(event.checkins[0].createdAt), "dd/MM 'as' HH:mm")}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        {event.canCheckin && isActive ? (
          <Button
            onClick={() => onCheckin(event.id, event.name)}
            className="w-full"
          >
            <QrCode className="h-4 w-4 mr-2" />
            Fazer Check-in
          </Button>
        ) : event.userCheckinCount >= maxCheckins ? (
          <Button disabled className="w-full" variant="secondary">
            <CheckCircle className="h-4 w-4 mr-2" />
            Todos check-ins realizados
          </Button>
        ) : !isActive ? (
          <Button disabled className="w-full" variant="outline">
            Evento {now < startDate ? 'nao iniciou' : 'encerrado'}
          </Button>
        ) : (
          <Button disabled className="w-full" variant="outline">
            Aguarde para proximo check-in
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
