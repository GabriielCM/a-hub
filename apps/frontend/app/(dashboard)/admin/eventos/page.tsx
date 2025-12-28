'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, Event, CreateEventData, EventStatus } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { EventStatusBadge } from '@/components/events/event-status-badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Play,
  Square,
  Monitor,
  Calendar,
  Users,
  Gift,
} from 'lucide-react';
import Link from 'next/link';

const defaultFormData: CreateEventData = {
  name: '',
  description: '',
  startAt: '',
  endAt: '',
  totalPoints: 100,
  allowMultipleCheckins: false,
  maxCheckinsPerUser: 1,
  checkinIntervalSeconds: 300,
  displayBackgroundColor: '#1a365d',
  qrRotationSeconds: 30,
};

export default function AdminEventosPage() {
  const { accessToken } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<CreateEventData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL');

  const loadEvents = useCallback(async () => {
    if (!accessToken) return;

    try {
      const query = statusFilter !== 'ALL' ? { status: statusFilter } : undefined;
      const data = await api.getEvents(accessToken, query);
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, statusFilter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description || '',
      startAt: event.startAt.slice(0, 16),
      endAt: event.endAt.slice(0, 16),
      totalPoints: event.totalPoints,
      allowMultipleCheckins: event.allowMultipleCheckins,
      maxCheckinsPerUser: event.maxCheckinsPerUser || 1,
      checkinIntervalSeconds: event.checkinIntervalSeconds || 300,
      displayBackgroundColor: event.displayBackgroundColor || '#1a365d',
      displayLogo: event.displayLogo,
      displayLayout: event.displayLayout,
      qrRotationSeconds: event.qrRotationSeconds || 30,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (event: Event) => {
    setDeletingEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setSaving(true);
    try {
      const dataToSend = {
        ...formData,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
      };

      if (editingEvent) {
        await api.updateEvent(editingEvent.id, dataToSend, accessToken);
      } else {
        await api.createEvent(dataToSend, accessToken);
      }
      setIsDialogOpen(false);
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar evento');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!accessToken || !deletingEvent) return;

    try {
      await api.deleteEvent(deletingEvent.id, accessToken);
      setIsDeleteDialogOpen(false);
      setDeletingEvent(null);
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(error instanceof Error ? error.message : 'Erro ao excluir evento');
    }
  };

  const handleStatusChange = async (eventId: string, status: EventStatus) => {
    if (!accessToken) return;

    try {
      await api.updateEventStatus(eventId, status, accessToken);
      loadEvents();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error instanceof Error ? error.message : 'Erro ao atualizar status');
    }
  };

  // Stats
  const activeEvents = events.filter((e) => e.status === 'ACTIVE').length;
  const totalCheckins = events.reduce(
    (sum, e) => sum + (e._count?.checkins || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Gerenciar Eventos</h1>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Total de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{events.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Play className="h-4 w-4" />
              Eventos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{activeEvents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total de Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCheckins}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Label>Filtrar por status:</Label>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as EventStatus | 'ALL')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="DRAFT">Rascunho</SelectItem>
            <SelectItem value="ACTIVE">Ativo</SelectItem>
            <SelectItem value="COMPLETED">Encerrado</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead>Pontos</TableHead>
              <TableHead>Check-ins</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum evento encontrado
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{event.name}</p>
                      {event.allowMultipleCheckins && (
                        <p className="text-xs text-muted-foreground">
                          Ate {event.maxCheckinsPerUser} check-ins
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{format(new Date(event.startAt), 'dd/MM/yyyy HH:mm')}</p>
                      <p className="text-muted-foreground">
                        ate {format(new Date(event.endAt), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Gift className="h-4 w-4 text-primary" />
                      {event.totalPoints}
                    </div>
                  </TableCell>
                  <TableCell>{event._count?.checkins || 0}</TableCell>
                  <TableCell>
                    <EventStatusBadge status={event.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {event.status === 'DRAFT' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Ativar"
                          onClick={() => handleStatusChange(event.id, 'ACTIVE')}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {event.status === 'ACTIVE' && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Display"
                            asChild
                          >
                            <Link href={`/display/eventos/${event.id}`} target="_blank">
                              <Monitor className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Encerrar"
                            onClick={() => handleStatusChange(event.id, 'COMPLETED')}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Relatorio"
                        asChild
                      >
                        <Link href={`/admin/eventos/${event.id}/relatorio`}>
                          <FileText className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Editar"
                        onClick={() => handleOpenEdit(event)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Excluir"
                        onClick={() => handleOpenDelete(event)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Editar Evento' : 'Novo Evento'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do evento
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descricao</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                maxLength={1000}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startAt">Inicio *</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startAt: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endAt">Termino *</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endAt: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPoints">Total de Pontos *</Label>
              <Input
                id="totalPoints"
                type="number"
                min={1}
                value={formData.totalPoints}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    totalPoints: parseInt(e.target.value) || 0,
                  }))
                }
                required
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="allowMultiple">Multiplos Check-ins</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir mais de um check-in por usuario
                </p>
              </div>
              <Switch
                id="allowMultiple"
                checked={formData.allowMultipleCheckins}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, allowMultipleCheckins: checked }))
                }
              />
            </div>

            {formData.allowMultipleCheckins && (
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <Label htmlFor="maxCheckins">Max Check-ins *</Label>
                  <Input
                    id="maxCheckins"
                    type="number"
                    min={1}
                    max={100}
                    value={formData.maxCheckinsPerUser}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxCheckinsPerUser: parseInt(e.target.value) || 1,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interval">Intervalo (segundos) *</Label>
                  <Input
                    id="interval"
                    type="number"
                    min={60}
                    max={86400}
                    value={formData.checkinIntervalSeconds}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        checkinIntervalSeconds: parseInt(e.target.value) || 300,
                      }))
                    }
                    required
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bgColor">Cor de Fundo (Display)</Label>
                <Input
                  id="bgColor"
                  type="color"
                  value={formData.displayBackgroundColor || '#1a365d'}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      displayBackgroundColor: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qrRotation">Rotacao QR (segundos)</Label>
                <Input
                  id="qrRotation"
                  type="number"
                  min={10}
                  max={300}
                  value={formData.qrRotationSeconds || 30}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      qrRotationSeconds: parseInt(e.target.value) || 30,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : editingEvent ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o evento &quot;{deletingEvent?.name}&quot;?
              Esta acao nao pode ser desfeita e todos os check-ins serao perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
