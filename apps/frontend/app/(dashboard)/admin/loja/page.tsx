'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, StoreItem, CreateStoreItemData, UpdateStoreItemData } from '@/lib/api';
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
import {
  Plus,
  Pencil,
  Trash2,
  ImagePlus,
  X,
  Package,
  Coins,
  AlertTriangle,
  Calendar,
} from 'lucide-react';

const MAX_PHOTOS = 5;

export default function AdminLojaPage() {
  const { accessToken, user } = useAuth();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<StoreItem | null>(null);
  const [formData, setFormData] = useState<CreateStoreItemData>({
    name: '',
    description: '',
    pointsPrice: 0,
    stock: 0,
    photos: [],
    offerEndsAt: undefined,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      return;
    }
    loadItems();
  }, [user]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await api.getStoreItems();
      setItems(data);
    } catch (error) {
      console.error('Error loading store items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: StoreItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        pointsPrice: item.pointsPrice,
        stock: item.stock,
        photos: item.photos || [],
        offerEndsAt: item.offerEndsAt ? item.offerEndsAt.split('T')[0] : undefined,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        pointsPrice: 0,
        stock: 0,
        photos: [],
        offerEndsAt: undefined,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      pointsPrice: 0,
      stock: 0,
      photos: [],
      offerEndsAt: undefined,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    if ((formData.photos?.length || 0) >= MAX_PHOTOS) {
      alert(`Maximo de ${MAX_PHOTOS} fotos permitidas`);
      return;
    }

    setUploading(true);
    try {
      const result = await api.uploadImage(file, accessToken);
      setFormData((prev) => ({
        ...prev,
        photos: [...(prev.photos || []), result.url],
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setSaving(true);
    try {
      if (editingItem) {
        const updateData: UpdateStoreItemData = {
          name: formData.name,
          description: formData.description,
          pointsPrice: formData.pointsPrice,
          photos: formData.photos,
          offerEndsAt: formData.offerEndsAt || undefined,
        };
        await api.updateStoreItem(editingItem.id, updateData, accessToken);
      } else {
        await api.createStoreItem(formData, accessToken);
      }
      handleCloseDialog();
      loadItems();
    } catch (error) {
      console.error('Error saving store item:', error);
      alert('Erro ao salvar item da loja');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem || !accessToken) return;

    try {
      await api.deleteStoreItem(deletingItem.id, accessToken);
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
      loadItems();
    } catch (error) {
      console.error('Error deleting store item:', error);
      alert('Erro ao excluir item da loja');
    }
  };

  const handleToggleActive = async (item: StoreItem) => {
    if (!accessToken) return;

    try {
      await api.updateStoreItem(item.id, { isActive: !item.isActive }, accessToken);
      loadItems();
    } catch (error) {
      console.error('Error toggling item status:', error);
      alert('Erro ao alterar status do item');
    }
  };

  const getStatusBadge = (item: StoreItem) => {
    if (!item.isActive) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          Inativo
        </Badge>
      );
    }
    if (item.stock === 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Sem estoque
        </Badge>
      );
    }
    if (item.stock <= 5) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-600">
          <AlertTriangle className="h-3 w-3" />
          Estoque baixo
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="flex items-center gap-1">
        Ativo
      </Badge>
    );
  };

  const isOfferExpired = (offerEndsAt?: string) => {
    if (!offerEndsAt) return false;
    return new Date(offerEndsAt) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Acesso restrito a administradores</p>
      </div>
    );
  }

  if (loading && items.length === 0) {
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
          <h1 className="text-2xl font-bold">Loja do Associado</h1>
          <p className="text-muted-foreground">
            Gerencie os itens disponiveis para resgate com pontos
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Item
        </Button>
      </div>

      {/* Items Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`border rounded-lg overflow-hidden bg-white ${
              !item.isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="aspect-video bg-muted relative">
              {item.photos && item.photos.length > 0 ? (
                <img
                  src={item.photos[0]}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Package className="h-12 w-12" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                {getStatusBadge(item)}
              </div>
              {item.offerEndsAt && (
                <div className="absolute top-2 left-2">
                  <Badge
                    variant={isOfferExpired(item.offerEndsAt) ? 'destructive' : 'outline'}
                    className="flex items-center gap-1 bg-white/90"
                  >
                    <Calendar className="h-3 w-3" />
                    {isOfferExpired(item.offerEndsAt) ? 'Expirado' : `Ate ${formatDate(item.offerEndsAt)}`}
                  </Badge>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold truncate">{item.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[40px]">
                {item.description || 'Sem descricao'}
              </p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1 text-primary font-semibold">
                  <Coins className="h-4 w-4" />
                  <span>{item.pointsPrice} pts</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>{item.stock} em estoque</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenDialog(item)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(item)}
                >
                  {item.isActive ? 'Desativar' : 'Ativar'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    setDeletingItem(item);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum item cadastrado na loja</p>
          <Button className="mt-4" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Criar primeiro item
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Item' : 'Novo Item'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do item da loja
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
                  placeholder="Nome do item"
                  maxLength={100}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.name.length}/100 caracteres
                </p>
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
                  placeholder="Descricao do item"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {(formData.description || '').length}/500 caracteres
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pointsPrice">Preco em Pontos</Label>
                  <Input
                    id="pointsPrice"
                    type="number"
                    min="0"
                    value={formData.pointsPrice}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pointsPrice: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Estoque Inicial</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        stock: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                    required
                    disabled={!!editingItem}
                  />
                  {editingItem && (
                    <p className="text-xs text-muted-foreground">
                      Use ajuste de estoque para alterar
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="offerEndsAt">Prazo da Oferta (opcional)</Label>
                <Input
                  id="offerEndsAt"
                  type="date"
                  value={formData.offerEndsAt || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      offerEndsAt: e.target.value || undefined,
                    }))
                  }
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para item sem prazo
                </p>
              </div>

              <div className="space-y-2">
                <Label>Fotos (maximo {MAX_PHOTOS})</Label>
                <div className="grid grid-cols-3 gap-2">
                  {formData.photos?.map((photo, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={photo}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {(formData.photos?.length || 0) < MAX_PHOTOS && (
                    <label className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      {uploading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      ) : (
                        <ImagePlus className="h-6 w-6 text-muted-foreground" />
                      )}
                    </label>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : editingItem ? 'Salvar' : 'Criar'}
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
              Tem certeza que deseja excluir o item "{deletingItem?.name}"?
              Esta acao nao pode ser desfeita.
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
