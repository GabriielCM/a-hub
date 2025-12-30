'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { api, Space, CreateSpaceData } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PullToRefresh } from '@/components/feedback/pull-to-refresh';
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
import { Plus, Pencil, Trash2, ImagePlus, X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

function AdminSpacesSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 skeleton rounded-lg" />
          <div className="h-4 w-64 skeleton rounded-lg mt-2" />
        </div>
        <div className="h-10 w-32 skeleton rounded-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton rounded-2xl h-80" />
        ))}
      </div>
    </div>
  );
}

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

  const loadSpaces = useCallback(async () => {
    try {
      const data = await api.getSpaces();
      setSpaces(data);
    } catch (error) {
      console.error('Error loading spaces:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      return;
    }
    loadSpaces();
  }, [user, loadSpaces]);

  const handleRefresh = async () => {
    setLoading(true);
    await loadSpaces();
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
      alert('Erro ao salvar espaco');
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
      alert('Erro ao excluir espaco');
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center mb-6">
          <X className="h-10 w-10 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Acesso Restrito</h3>
        <p className="text-muted-foreground text-center">
          Esta pagina e restrita a administradores
        </p>
      </div>
    );
  }

  if (loading) {
    return <AdminSpacesSkeleton />;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6 pb-8"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold">Gerenciar Espacos</h1>
            <p className="text-muted-foreground">Adicione, edite ou remova espacos</p>
          </div>
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => handleOpenDialog()}
              className={cn(
                'rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600',
                'hover:from-purple-700 hover:to-fuchsia-700',
                'shadow-lg shadow-purple-500/25 transition-all duration-200'
              )}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Espaco
            </Button>
          </motion.div>
        </motion.div>

        {/* Spaces Grid */}
        {spaces.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center justify-center py-16 px-4"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-fuchsia-100 flex items-center justify-center mb-6">
              <MapPin className="h-10 w-10 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum espaco cadastrado
            </h3>
            <p className="text-muted-foreground text-center mb-6">
              Comece adicionando seu primeiro espaco
            </p>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => handleOpenDialog()}
                className={cn(
                  'rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600',
                  'hover:from-purple-700 hover:to-fuchsia-700'
                )}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro espaco
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {spaces.map((space) => (
                <motion.div
                  key={space.id}
                  layout
                  variants={itemVariants}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -4 }}
                  className={cn(
                    'relative overflow-hidden rounded-2xl bg-white',
                    'shadow-lg hover:shadow-xl transition-all duration-300',
                    'border border-gray-100'
                  )}
                >
                  {/* Image */}
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {space.photos && space.photos.length > 0 ? (
                      <img
                        src={space.photos[0]}
                        alt={space.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <MapPin className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    {/* Photo count badge */}
                    {space.photos && space.photos.length > 1 && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 rounded-full text-white text-xs backdrop-blur-sm">
                        +{space.photos.length - 1} fotos
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{space.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {space.description || 'Sem descricao'}
                    </p>
                    <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent mt-3">
                      R$ {space.value.toFixed(2)}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-xl border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                          onClick={() => handleOpenDialog(space)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </motion.div>
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                          onClick={() => {
                            setDeletingSpace(space);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingSpace ? 'Editar Espaco' : 'Novo Espaco'}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do espaco
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Nome do espaco"
                    className="rounded-xl h-12 focus:ring-2 focus:ring-purple-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value" className="text-sm font-medium">
                    Valor (R$)
                  </Label>
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
                    className="rounded-xl h-12 focus:ring-2 focus:ring-purple-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Descricao
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Descricao do espaco"
                    rows={3}
                    className="rounded-xl focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fotos</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {formData.photos?.map((photo, index) => (
                      <motion.div
                        key={index}
                        className="relative aspect-square"
                        whileHover={{ scale: 1.02 }}
                      >
                        <img
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                        >
                          <X className="h-3 w-3" />
                        </motion.button>
                      </motion.div>
                    ))}
                    <motion.label
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'aspect-square border-2 border-dashed border-gray-300 rounded-xl',
                        'flex items-center justify-center cursor-pointer',
                        'hover:border-purple-400 hover:bg-purple-50 transition-colors'
                      )}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      {uploading ? (
                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ImagePlus className="h-6 w-6 text-gray-400" />
                      )}
                    </motion.label>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className={cn(
                    'rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600',
                    'hover:from-purple-700 hover:to-fuchsia-700'
                  )}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </span>
                  ) : editingSpace ? (
                    'Salvar'
                  ) : (
                    'Criar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o espaco "{deletingSpace?.name}"?
                Esta acao nao pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="rounded-xl bg-red-500 hover:bg-red-600"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </PullToRefresh>
  );
}
