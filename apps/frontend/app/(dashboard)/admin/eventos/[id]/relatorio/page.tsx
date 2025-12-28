'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, EventReport } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventStatusBadge } from '@/components/events/event-status-badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Download,
  Users,
  CheckCircle,
  Gift,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

export default function EventoRelatorioPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { accessToken } = useAuth();
  const [report, setReport] = useState<EventReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
  });

  const loadReport = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const data = await api.getEventReport(eventId, filters, accessToken);
      setReport(data);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, eventId, filters]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportCsv = async () => {
    if (!accessToken) return;

    setExporting(true);
    try {
      const csv = await api.exportEventReportCsv(eventId, filters, accessToken);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `evento_${eventId}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Erro ao exportar relatorio');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-4 md:p-6">
        <p>Evento nao encontrado</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/eventos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{report.event.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(report.event.startAt), "dd/MM/yyyy 'as' HH:mm", {
                locale: ptBR,
              })}{' '}
              -{' '}
              {format(new Date(report.event.endAt), "dd/MM/yyyy 'as' HH:mm", {
                locale: ptBR,
              })}
              <EventStatusBadge status={report.event.status} />
            </div>
          </div>
        </div>
        <Button onClick={handleExportCsv} disabled={exporting}>
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report.totalCheckins}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report.uniqueUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Pontos Distribuidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {report.totalPointsDistributed}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pontos Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report.event.totalPoints}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setFilters({ startDate: '', endDate: '' })}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="checkins" className="space-y-4">
        <TabsList>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="users">Por Usuario</TabsTrigger>
        </TabsList>

        <TabsContent value="checkins">
          <Card>
            <CardHeader>
              <CardTitle>Historico de Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Check-in #</TableHead>
                      <TableHead>Pontos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.checkins.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Nenhum check-in encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      report.checkins.map((checkin) => (
                        <TableRow key={checkin.id}>
                          <TableCell>
                            {format(
                              new Date(checkin.createdAt),
                              "dd/MM/yyyy 'as' HH:mm:ss",
                              { locale: ptBR }
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {checkin.userName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {checkin.userEmail}
                          </TableCell>
                          <TableCell>{checkin.checkinNumber}</TableCell>
                          <TableCell className="text-primary font-medium">
                            +{checkin.pointsAwarded}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Ranking por Usuario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Check-ins</TableHead>
                      <TableHead>Pontos</TableHead>
                      <TableHead>Primeiro</TableHead>
                      <TableHead>Ultimo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.userStats.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Nenhum usuario encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      report.userStats.map((user, index) => (
                        <TableRow key={user.userId}>
                          <TableCell className="font-bold">{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {user.userName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.userEmail}
                          </TableCell>
                          <TableCell>{user.checkinCount}</TableCell>
                          <TableCell className="text-primary font-medium">
                            {user.totalPoints}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(user.firstCheckin), 'dd/MM HH:mm')}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(user.lastCheckin), 'dd/MM HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
