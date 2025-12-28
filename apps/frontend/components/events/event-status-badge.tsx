'use client';

import { Badge } from '@/components/ui/badge';
import { EventStatus } from '@/lib/api';

interface EventStatusBadgeProps {
  status: EventStatus;
}

const statusConfig: Record<
  EventStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  DRAFT: { label: 'Rascunho', variant: 'secondary' },
  ACTIVE: { label: 'Ativo', variant: 'default' },
  COMPLETED: { label: 'Encerrado', variant: 'outline' },
  CANCELLED: { label: 'Cancelado', variant: 'destructive' },
};

export function EventStatusBadge({ status }: EventStatusBadgeProps) {
  const config = statusConfig[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
