'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, Booking } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  MoreHorizontal,
  Check,
  X,
  Clock,
  Filter,
  Calendar,
  Coins,
} from 'lucide-react';
import { PointsReport } from '@/components/reports/points-report';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  CANCELLED: 'Cancelado',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export default function AdminRelatoriosPage() {
  const { accessToken, user } = useAuth();
  const [activeReport, setActiveReport] = useState<'bookings' | 'points'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!accessToken || user?.role !== 'ADMIN') {
      return;
    }
    loadBookings();
  }, [accessToken, user]);

  const loadBookings = async () => {
    if (!accessToken) return;
    try {
      const data = await api.getAllBookings(accessToken);
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    if (!accessToken) return;
    try {
      await api.updateBookingStatus(bookingId, newStatus, accessToken);
      loadBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const handleExportCSV = async () => {
    if (!accessToken) return;
    setExporting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/bookings/export`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const csvContent = await response.text();

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `agendamentos_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Erro ao exportar relatorio');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const filteredBookings =
    statusFilter === 'ALL'
      ? bookings
      : bookings.filter((b) => b.status === statusFilter);

  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Acesso restrito a administradores</p>
      </div>
    );
  }

  if (loading && activeReport === 'bookings') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatorios</h1>
        <p className="text-muted-foreground">
          Gerencie agendamentos e acompanhe movimentacoes de pontos
        </p>
      </div>

      <Tabs value={activeReport} onValueChange={(v: string) => setActiveReport(v as 'bookings' | 'points')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="bookings" className="gap-2">
            <Calendar className="h-4 w-4" />
            Agendamentos
          </TabsTrigger>
          <TabsTrigger value="points" className="gap-2">
            <Coins className="h-4 w-4" />
            Pontos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-6">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <p className="text-muted-foreground">
                {bookings.length} agendamentos
                {pendingCount > 0 && (
                  <span className="text-yellow-600 ml-2">
                    ({pendingCount} pendentes)
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="PENDING">Pendentes</SelectItem>
                    <SelectItem value="APPROVED">Aprovados</SelectItem>
                    <SelectItem value="REJECTED">Rejeitados</SelectItem>
                    <SelectItem value="CANCELLED">Cancelados</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  disabled={exporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? 'Exportando...' : 'Exportar CSV'}
                </Button>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Espaco</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {formatDate(booking.date)}
                      </TableCell>
                      <TableCell>{booking.space?.name}</TableCell>
                      <TableCell>R$ {booking.space?.value?.toFixed(2)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.user?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.user?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[booking.status]}>
                          {statusLabels[booking.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {booking.status === 'PENDING' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(booking.id, 'APPROVED')
                                }
                              >
                                <Check className="h-4 w-4 mr-2 text-green-600" />
                                Aprovar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(booking.id, 'REJECTED')
                                }
                              >
                                <X className="h-4 w-4 mr-2 text-red-600" />
                                Rejeitar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{booking.space?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(booking.date)}
                      </p>
                    </div>
                    <Badge className={statusColors[booking.status]}>
                      {statusLabels[booking.status]}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <p>
                      <span className="text-muted-foreground">Usuario:</span>{' '}
                      {booking.user?.name}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Email:</span>{' '}
                      {booking.user?.email}
                    </p>
                    <p className="font-medium text-primary">
                      R$ {booking.space?.value?.toFixed(2)}
                    </p>
                  </div>
                  {booking.status === 'PENDING' && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusChange(booking.id, 'APPROVED')}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleStatusChange(booking.id, 'REJECTED')}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredBookings.length === 0 && (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground mt-4">
                  Nenhum agendamento encontrado
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="points" className="mt-6">
          {accessToken && <PointsReport accessToken={accessToken} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
