'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, Benefit, CreateBenefitData, UpdateBenefitData } from '@/lib/api';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, ImagePlus, X, Percent, Handshake, MapPin } from 'lucide-react';

type TabType = 'all' | 'DISCOUNT' | 'PARTNERSHIP';

const typeLabels = {
  DISCOUNT: 'Desconto',
  PARTNERSHIP: 'Convenio',
};

const MAX_PHOTOS = 5;

export default function AdminBeneficiosPage() {
  const { accessToken, user } = useAuth();
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [deletingBenefit, setDeletingBenefit] = useState<Benefit | null>(null);
  const [formData, setFormData] = useState<CreateBenefitData>({
    type: 'DISCOUNT',
    name: '',
    description: '',
    photos: [],
    city: '',
    street: '',
    number: '',
    neighborhood: '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      return;
    }
    loadBenefits();
  }, [user, activeTab]);

  const loadBenefits = async () => {
    try {
      setLoading(true);
      const typeFilter = activeTab === 'all' ? undefined : activeTab;
      const data = await api.getBenefits(typeFilter);
      setBenefits(data);
    } catch (error) {
      console.error('Error loading benefits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (benefit?: Benefit) => {
    if (benefit) {
      setEditingBenefit(benefit);
      setFormData({
        type: benefit.type,
        name: benefit.name,
        description: benefit.description || '',
        photos: benefit.photos || [],
        city: benefit.city,
        street: benefit.street,
        number: benefit.number,
        neighborhood: benefit.neighborhood,
      });
    } else {
      setEditingBenefit(null);
      setFormData({
        type: 'DISCOUNT',
        name: '',
        description: '',
        photos: [],
        city: '',
        street: '',
        number: '',
        neighborhood: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBenefit(null);
    setFormData({
      type: 'DISCOUNT',
      name: '',
      description: '',
      photos: [],
      city: '',
      street: '',
      number: '',
      neighborhood: '',
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
      if (editingBenefit) {
        const updateData: UpdateBenefitData = {
          type: formData.type,
          name: formData.name,
          description: formData.description,
          photos: formData.photos,
          city: formData.city,
          street: formData.street,
          number: formData.number,
          neighborhood: formData.neighborhood,
        };
        await api.updateBenefit(editingBenefit.id, updateData, accessToken);
      } else {
        await api.createBenefit(formData, accessToken);
      }
      handleCloseDialog();
      loadBenefits();
    } catch (error) {
      console.error('Error saving benefit:', error);
      alert('Erro ao salvar beneficio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBenefit || !accessToken) return;

    try {
      await api.deleteBenefit(deletingBenefit.id, accessToken);
      setIsDeleteDialogOpen(false);
      setDeletingBenefit(null);
      loadBenefits();
    } catch (error) {
      console.error('Error deleting benefit:', error);
      alert('Erro ao excluir beneficio');
    }
  };

  const getTypeIcon = (type: 'DISCOUNT' | 'PARTNERSHIP') => {
    return type === 'DISCOUNT' ? (
      <Percent className="h-3 w-3" />
    ) : (
      <Handshake className="h-3 w-3" />
    );
  };

  const getTypeBadgeVariant = (type: 'DISCOUNT' | 'PARTNERSHIP') => {
    return type === 'DISCOUNT' ? 'default' : 'secondary';
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Acesso restrito a administradores</p>
      </div>
    );
  }

  if (loading && benefits.length === 0) {
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
          <h1 className="text-2xl font-bold">Gerenciar Beneficios</h1>
          <p className="text-muted-foreground">Adicione, edite ou remova descontos e convenios</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Beneficio
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('all')}
        >
          Todos
        </Button>
        <Button
          variant={activeTab === 'DISCOUNT' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('DISCOUNT')}
        >
          <Percent className="h-4 w-4 mr-2" />
          Descontos
        </Button>
        <Button
          variant={activeTab === 'PARTNERSHIP' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('PARTNERSHIP')}
        >
          <Handshake className="h-4 w-4 mr-2" />
          Convenios
        </Button>
      </div>

      {/* Benefits Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit) => (
          <div
            key={benefit.id}
            className="border rounded-lg overflow-hidden bg-white"
          >
            <div className="aspect-video bg-muted relative">
              {benefit.photos && benefit.photos.length > 0 ? (
                <img
                  src={benefit.photos[0]}
                  alt={benefit.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Sem imagem
                </div>
              )}
              <Badge
                variant={getTypeBadgeVariant(benefit.type)}
                className="absolute top-2 right-2 flex items-center gap-1"
              >
                {getTypeIcon(benefit.type)}
                {typeLabels[benefit.type]}
              </Badge>
            </div>
            <div className="p-4">
              <h3 className="font-semibold">{benefit.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                <span>{benefit.city}, {benefit.neighborhood}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                {benefit.description || 'Sem descricao'}
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenDialog(benefit)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    setDeletingBenefit(benefit);
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

      {benefits.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {activeTab === 'all'
              ? 'Nenhum beneficio cadastrado'
              : `Nenhum ${typeLabels[activeTab].toLowerCase()} cadastrado`}
          </p>
          <Button className="mt-4" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Criar primeiro beneficio
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBenefit ? 'Editar Beneficio' : 'Novo Beneficio'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do beneficio
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'DISCOUNT' | 'PARTNERSHIP') =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISCOUNT">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Desconto
                      </div>
                    </SelectItem>
                    <SelectItem value="PARTNERSHIP">
                      <div className="flex items-center gap-2">
                        <Handshake className="h-4 w-4" />
                        Convenio
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                  placeholder="Nome do beneficio"
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
                  placeholder="Descricao do beneficio"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {(formData.description || '').length}/500 caracteres
                </p>
              </div>

              {/* Address Fields */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Endereco</Label>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, city: e.target.value }))
                      }
                      placeholder="Cidade"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          neighborhood: e.target.value,
                        }))
                      }
                      placeholder="Bairro"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="street">Rua</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, street: e.target.value }))
                      }
                      placeholder="Nome da rua"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Numero</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, number: e.target.value }))
                      }
                      placeholder="N"
                      required
                    />
                  </div>
                </div>
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
                {saving ? 'Salvando...' : editingBenefit ? 'Salvar' : 'Criar'}
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
              Tem certeza que deseja excluir o beneficio "{deletingBenefit?.name}"?
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
