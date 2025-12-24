'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, Space, CreateSpaceData } from '@/lib/api';
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
import { Plus, Pencil, Trash2, ImagePlus, X } from 'lucide-react';

export default function AdminEspacosPage() {
  const { accessToken, user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [deletingSpace, setDeletingSpace] = useState<Space | null>(null);
  const [formData, setFormData] = useState<CreateSpaceData>({
    name: '',
    value: 0,
    description: '',
    photos: [],
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      return;
    }
    loadSpaces();
  }, [user]);

  const loadSpaces = async () => {
    try {
      const data = await api.getSpaces();
      setSpaces(data);
    } catch (error) {
      console.error('Error loading spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (space?: Space) => {
    if (space) {
      setEditingSpace(space);
      setFormData({
        name: space.name,
        value: space.value,
        description: space.description || '',
        photos: space.photos || [],
      });
    } else {
      setEditingSpace(null);
      setFormData({ name: '', value: 0, description: '', photos: [] });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSpace(null);
    setFormData({ name: '', value: 0, description: '', photos: [] });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

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
      if (editingSpace) {
        await api.updateSpace(editingSpace.id, formData, accessToken);
      } else {
        await api.createSpace(formData, accessToken);
      }
      handleCloseDialog();
      loadSpaces();
    } catch (error) {
      console.error('Error saving space:', error);
      alert('Erro ao salvar espaço');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSpace || !accessToken) return;

    try {
      await api.deleteSpace(deletingSpace.id, accessToken);
      setIsDeleteDialogOpen(false);
      setDeletingSpace(null);
      loadSpaces();
    } catch (error) {
      console.error('Error deleting space:', error);
      alert('Erro ao excluir espaço');
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Espaços</h1>
          <p className="text-muted-foreground">Adicione, edite ou remova espaços</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Espaço
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {spaces.map((space) => (
          <div
            key={space.id}
            className="border rounded-lg overflow-hidden bg-white"
          >
            <div className="aspect-video bg-muted relative">
              {space.photos && space.photos.length > 0 ? (
                <img
                  src={space.photos[0]}
                  alt={space.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Sem imagem
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold">{space.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {space.description || 'Sem descrição'}
              </p>
              <p className="text-lg font-bold text-primary mt-2">
                R$ {space.value.toFixed(2)}
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenDialog(space)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    setDeletingSpace(space);
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

      {spaces.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum espaço cadastrado</p>
          <Button className="mt-4" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Criar primeiro espaço
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSpace ? 'Editar Espaço' : 'Novo Espaço'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do espaço
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
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Nome do espaço"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Valor (R$)</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      value: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Descrição do espaço"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Fotos</Label>
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
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : editingSpace ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o espaço "{deletingSpace?.name}"?
              Esta ação não pode ser desfeita.
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
