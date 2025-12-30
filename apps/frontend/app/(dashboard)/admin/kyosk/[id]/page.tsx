'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, Kyosk, KyoskProduct, CreateKyoskProductData, KyoskSalesData } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Package,
  ImagePlus,
  X,
  Coins,
  AlertTriangle,
  Download,
  Calendar,
} from 'lucide-react';

export default function AdminKyoskProductsPage() {
  const params = useParams();
  const kyoskId = params.id as string;
  const router = useRouter();
  const { accessToken, user } = useAuth();
  const [kyosk, setKyosk] = useState<Kyosk | null>(null);
  const [products, setProducts] = useState<KyoskProduct[]>([]);
  const [sales, setSales] = useState<KyoskSalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<KyoskProduct | null>(null);
  const [stockProduct, setStockProduct] = useState<KyoskProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<KyoskProduct | null>(null);
  const [formData, setFormData] = useState<CreateKyoskProductData>({
    name: '',
    description: '',
    image: '',
    pointsPrice: 0,
    stock: 0,
  });
  const [stockData, setStockData] = useState({ quantity: 0, reason: '' });
  const [salesFilter, setSalesFilter] = useState({ startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    loadData();
  }, [user, kyoskId]);

  const loadData = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const [kyoskData, productsData] = await Promise.all([
        api.getKyosk(kyoskId, accessToken),
        api.getKyoskProducts(kyoskId, accessToken),
      ]);
      setKyosk(kyoskData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSales = async () => {
    if (!accessToken) return;
    try {
      const data = await api.getKyoskSales(kyoskId, salesFilter, accessToken);
      setSales(data);
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  };

  const handleOpenDialog = (product?: KyoskProduct) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        image: product.image || '',
        pointsPrice: product.pointsPrice,
        stock: product.stock,
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', image: '', pointsPrice: 0, stock: 0 });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', description: '', image: '', pointsPrice: 0, stock: 0 });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    setUploading(true);
    try {
      const result = await api.uploadImage(file, accessToken);
      setFormData((prev) => ({ ...prev, image: result.url }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setSaving(true);
    try {
      if (editingProduct) {
        await api.updateKyoskProduct(kyoskId, editingProduct.id, {
          name: formData.name,
          description: formData.description,
          image: formData.image,
          pointsPrice: formData.pointsPrice,
        }, accessToken);
      } else {
        await api.createKyoskProduct(kyoskId, formData, accessToken);
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !stockProduct) return;

    setSaving(true);
    try {
      await api.adjustKyoskProductStock(kyoskId, stockProduct.id, stockData, accessToken);
      setIsStockDialogOpen(false);
      setStockProduct(null);
      setStockData({ quantity: 0, reason: '' });
      loadData();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Erro ao ajustar estoque');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct || !accessToken) return;

    try {
      await api.deleteKyoskProduct(kyoskId, deletingProduct.id, accessToken);
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
      loadData();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Erro ao excluir produto');
    }
  };

  const handleToggleStatus = async (product: KyoskProduct) => {
    if (!accessToken) return;

    try {
      await api.toggleKyoskProductStatus(kyoskId, product.id, accessToken);
      loadData();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleExportSales = async () => {
    if (!accessToken) return;

    try {
      const csv = await api.exportKyoskSalesCsv(kyoskId, salesFilter, accessToken);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vendas-${kyosk?.name || 'kyosk'}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Erro ao exportar');
    }
  };

  const getStockBadge = (product: KyoskProduct) => {
    if (product.status === 'INACTIVE') {
      return <Badge variant="secondary">Inativo</Badge>;
    }
    if (product.stock === 0) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" /> Sem estoque
      </Badge>;
    }
    if (kyosk && product.stock <= kyosk.lowStockThreshold) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" /> Baixo
      </Badge>;
    }
    return <Badge variant="default">Ativo</Badge>;
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Acesso restrito a administradores</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/kyosk')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{kyosk?.name}</h1>
          <p className="text-muted-foreground">{kyosk?.description || 'Gerenciar produtos e vendas'}</p>
        </div>
      </div>

      <Tabs defaultValue="products" onValueChange={(v) => v === 'sales' && loadSales()}>
        <TabsList>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} className={product.status === 'INACTIVE' ? 'opacity-60' : ''}>
                <div className="aspect-video bg-muted relative">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Package className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">{getStockBadge(product)}</div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold truncate">{product.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {product.description || 'Sem descricao'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-primary font-semibold">
                      <Coins className="h-4 w-4" />
                      {product.pointsPrice} pts
                    </span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      {product.stock} un.
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenDialog(product)}>
                      <Pencil className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      setStockProduct(product);
                      setStockData({ quantity: 0, reason: '' });
                      setIsStockDialogOpen(true);
                    }}>
                      <Package className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggleStatus(product)}>
                      {product.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => {
                      setDeletingProduct(product);
                      setIsDeleteDialogOpen(true);
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum produto cadastrado</p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" /> Criar primeiro produto
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 flex gap-4">
              <div className="space-y-2">
                <Label>Data Inicio</Label>
                <Input type="date" value={salesFilter.startDate} onChange={(e) => setSalesFilter((p) => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input type="date" value={salesFilter.endDate} onChange={(e) => setSalesFilter((p) => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadSales}>Filtrar</Button>
              <Button variant="outline" onClick={handleExportSales}>
                <Download className="h-4 w-4 mr-2" /> Exportar
              </Button>
            </div>
          </div>

          {sales && (
            <>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Total Vendas</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold">{sales.summary.totalSales}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Total Pontos</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold">{sales.summary.totalPoints.toLocaleString('pt-BR')}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Itens Vendidos</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold">{sales.summary.totalItems}</p></CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle>Historico de Vendas</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sales.orders.map((order) => (
                      <div key={order.id} className="border-b pb-4 last:border-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{order.paidByUser?.name || 'Usuario'}</p>
                            <p className="text-sm text-muted-foreground">{order.paidByUser?.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary">{order.totalPoints} pts</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(order.paidAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {order.items.map((item, i) => (
                            <span key={i}>{item.quantity}x {item.productName}{i < order.items.length - 1 ? ', ' : ''}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {sales.orders.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">Nenhuma venda no periodo</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            <DialogDescription>Preencha os dados do produto</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value.slice(0, 100) }))} maxLength={100} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descricao</Label>
                <Textarea id="description" value={formData.description || ''} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value.slice(0, 500) }))} rows={3} maxLength={500} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pointsPrice">Preco (pontos)</Label>
                  <Input id="pointsPrice" type="number" min="1" value={formData.pointsPrice} onChange={(e) => setFormData((p) => ({ ...p, pointsPrice: parseInt(e.target.value) || 0 }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Estoque Inicial</Label>
                  <Input id="stock" type="number" min="0" value={formData.stock} onChange={(e) => setFormData((p) => ({ ...p, stock: parseInt(e.target.value) || 0 }))} required disabled={!!editingProduct} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Imagem</Label>
                <div className="flex gap-2">
                  {formData.image ? (
                    <div className="relative w-20 h-20">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                      <button type="button" onClick={() => setFormData((p) => ({ ...p, image: '' }))} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary">
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                      {uploading ? <div className="animate-spin h-6 w-6 border-b-2 border-primary rounded-full"></div> : <ImagePlus className="h-6 w-6 text-muted-foreground" />}
                    </label>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : editingProduct ? 'Salvar' : 'Criar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar Estoque</DialogTitle>
            <DialogDescription>
              {stockProduct?.name} - Estoque atual: {stockProduct?.stock} un.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdjustStock}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input id="quantity" type="number" value={stockData.quantity} onChange={(e) => setStockData((p) => ({ ...p, quantity: parseInt(e.target.value) || 0 }))} required />
                <p className="text-xs text-muted-foreground">Use valores positivos para adicionar, negativos para remover</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo</Label>
                <Input id="reason" value={stockData.reason} onChange={(e) => setStockData((p) => ({ ...p, reason: e.target.value }))} placeholder="Ex: Reposicao, Avaria, etc." required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsStockDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving || stockData.quantity === 0}>{saving ? 'Salvando...' : 'Ajustar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{deletingProduct?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
