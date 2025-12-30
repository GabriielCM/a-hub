'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, Kyosk, CreateKyoskData, LowStockAlert } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Pencil,
  Trash2,
  Store,
  Package,
  ShoppingCart,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

export default function AdminKyoskPage() {
  const router = useRouter();
  const { accessToken, user } = useAuth();
  const [kyosks, setKyosks] = useState<Kyosk[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingKyosk, setEditingKyosk] = useState<Kyosk | null>(null);
  const [deletingKyosk, setDeletingKyosk] = useState<Kyosk | null>(null);
  const [formData, setFormData] = useState<CreateKyoskData>({
    name: '',
    description: '',
    lowStockThreshold: 5,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const [kyosksData, alertsData] = await Promise.all([
        api.getKyosks(accessToken),
        api.getLowStockAlerts(accessToken),
      ]);
      setKyosks(kyosksData);
      setLowStockAlerts(alertsData);
    } catch (error) {
      console.error('Error loading kyosks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (kyosk?: Kyosk) => {
    if (kyosk) {
      setEditingKyosk(kyosk);
      setFormData({
        name: kyosk.name,
        description: kyosk.description || '',
        lowStockThreshold: kyosk.lowStockThreshold,
      });
    } else {
      setEditingKyosk(null);
      setFormData({ name: '', description: '', lowStockThreshold: 5 });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingKyosk(null);
    setFormData({ name: '', description: '', lowStockThreshold: 5 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setSaving(true);
    try {
      if (editingKyosk) {
        await api.updateKyosk(editingKyosk.id, formData, accessToken);
      } else {
        await api.createKyosk(formData, accessToken);
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Error saving kyosk:', error);
      alert('Erro ao salvar Kyosk');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingKyosk || !accessToken) return;

    try {
      await api.deleteKyosk(deletingKyosk.id, accessToken);
      setIsDeleteDialogOpen(false);
      setDeletingKyosk(null);
      loadData();
    } catch (error) {
      console.error('Error deleting kyosk:', error);
      alert('Erro ao excluir Kyosk');
    }
  };

  const handleToggleStatus = async (kyosk: Kyosk) => {
    if (!accessToken) return;

    try {
      await api.toggleKyoskStatus(kyosk.id, accessToken);
      loadData();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Erro ao alterar status');
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Acesso restrito a administradores</p>
      </div>
    );
  }

  if (loading && kyosks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kyosks</h1>
          <p className="text-muted-foreground">
            Gerencie os pontos de venda fisicos
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Kyosk
        </Button>
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-4 w-4" />
              Alertas de Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {lowStockAlerts.slice(0, 5).map((alert) => (
                <div key={alert.productId} className="flex items-center justify-between text-sm">
                  <span className="text-yellow-800">
                    <strong>{alert.kyoskName}</strong>: {alert.productName}
                  </span>
                  <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                    {alert.currentStock} un.
                  </Badge>
                </div>
              ))}
              {lowStockAlerts.length > 5 && (
                <p className="text-xs text-yellow-600">
                  +{lowStockAlerts.length - 5} alertas
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kyosks Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {kyosks.map((kyosk) => (
          <Card
            key={kyosk.id}
            className={kyosk.status === 'INACTIVE' ? 'opacity-60' : ''}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  {kyosk.name}
                </CardTitle>
                <Badge variant={kyosk.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {kyosk.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                {kyosk.description || 'Sem descricao'}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  {kyosk._count?.products || 0} produtos
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingCart className="h-4 w-4" />
                  {kyosk._count?.orders || 0} vendas
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/admin/kyosk/${kyosk.id}`)}
                >
                  <Package className="h-4 w-4 mr-1" />
                  Produtos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(kyosk)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(kyosk)}
                >
                  {kyosk.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    setDeletingKyosk(kyosk);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => window.open(`/display/kyosk/${kyosk.id}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Abrir Display
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {kyosks.length === 0 && !loading && (
        <div className="text-center py-12">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum Kyosk cadastrado</p>
          <Button className="mt-4" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Criar primeiro Kyosk
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingKyosk ? 'Editar Kyosk' : 'Novo Kyosk'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do ponto de venda
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      name: e.target.value.slice(0, 100),
                    }))
                  }
                  placeholder="Nome do Kyosk"
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descricao</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value.slice(0, 500),
                    }))
                  }
                  placeholder="Descricao do Kyosk"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Limite de Estoque Baixo</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="1"
                  value={formData.lowStockThreshold}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lowStockThreshold: parseInt(e.target.value) || 5,
                    }))
                  }
                  placeholder="5"
                />
                <p className="text-xs text-muted-foreground">
                  Alerta quando estoque for menor ou igual a este valor
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : editingKyosk ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o Kyosk "{deletingKyosk?.name}"?
              Todos os produtos e vendas serao excluidos. Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
