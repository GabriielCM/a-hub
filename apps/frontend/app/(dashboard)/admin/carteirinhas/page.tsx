'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, User, MemberCard, CreateMemberCardData, UpdateMemberCardData } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, ImagePlus, X, QrCode, CreditCard } from 'lucide-react';

interface FormData {
  userId: string;
  matricula: number;
  photo: string;
}

export default function AdminCarteirinhasPage() {
  const { accessToken, user: currentUser } = useAuth();
  const [cards, setCards] = useState<MemberCard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<MemberCard | null>(null);
  const [deletingCard, setDeletingCard] = useState<MemberCard | null>(null);
  const [formData, setFormData] = useState<FormData>({
    userId: '',
    matricula: 0,
    photo: '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken || currentUser?.role !== 'ADMIN') {
      return;
    }
    loadData();
  }, [accessToken, currentUser]);

  const loadData = async () => {
    if (!accessToken) return;
    try {
      const [cardsData, usersData] = await Promise.all([
        api.getMemberCards(accessToken),
        api.getUsers(accessToken),
      ]);
      setCards(cardsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get users who don't have a card yet and are not DISPLAY role
  const getAvailableUsers = () => {
    const usersWithCards = new Set(cards.map((card) => card.userId));
    return users.filter(
      (user) => !usersWithCards.has(user.id) && user.role !== 'DISPLAY'
    );
  };

  const handleOpenDialog = (card?: MemberCard) => {
    if (card) {
      setEditingCard(card);
      setFormData({
        userId: card.userId,
        matricula: card.matricula,
        photo: card.photo || '',
      });
    } else {
      setEditingCard(null);
      setFormData({ userId: '', matricula: 0, photo: '' });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCard(null);
    setFormData({ userId: '', matricula: 0, photo: '' });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    setUploading(true);
    try {
      const result = await api.uploadImage(file, accessToken);
      setFormData((prev) => ({
        ...prev,
        photo: result.url,
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      photo: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    // Validate matricula
    if (formData.matricula < 1 || formData.matricula > 9999) {
      alert('A matricula deve estar entre 1 e 9999');
      return;
    }

    setSaving(true);
    try {
      if (editingCard) {
        const updateData: UpdateMemberCardData = {
          matricula: formData.matricula,
        };
        if (formData.photo) {
          updateData.photo = formData.photo;
        }
        await api.updateMemberCard(editingCard.id, updateData, accessToken);
      } else {
        if (!formData.userId) {
          alert('Selecione um usuario');
          setSaving(false);
          return;
        }
        const createData: CreateMemberCardData = {
          userId: formData.userId,
          matricula: formData.matricula,
        };
        if (formData.photo) {
          createData.photo = formData.photo;
        }
        await api.createMemberCard(createData, accessToken);
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Error saving member card:', error);
      alert('Erro ao salvar carteirinha');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCard || !accessToken) return;

    try {
      await api.deleteMemberCard(deletingCard.id, accessToken);
      setIsDeleteDialogOpen(false);
      setDeletingCard(null);
      loadData();
    } catch (error) {
      console.error('Error deleting member card:', error);
      alert('Erro ao excluir carteirinha');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatMatricula = (matricula: number) => {
    return matricula.toString().padStart(4, '0');
  };

  const truncateQrCode = (qrCode: string) => {
    if (qrCode.length <= 12) return qrCode;
    return `${qrCode.substring(0, 8)}...`;
  };

  if (currentUser?.role !== 'ADMIN') {
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

  const availableUsers = getAvailableUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Carteirinhas</h1>
          <p className="text-muted-foreground">
            Gerencie as carteirinhas de associados ({cards.length} total)
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} disabled={availableUsers.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Carteirinha
        </Button>
      </div>

      {availableUsers.length === 0 && cards.length > 0 && (
        <div className="bg-muted/50 border rounded-lg p-4 text-sm text-muted-foreground">
          Todos os usuarios elegiveis ja possuem carteirinha.
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Foto</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Matricula</TableHead>
              <TableHead>QR Code</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-[100px]">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.map((card) => (
              <TableRow key={card.id}>
                <TableCell>
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    {card.photo ? (
                      <img
                        src={card.photo}
                        alt={card.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <CreditCard className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{card.user.name}</TableCell>
                <TableCell>{card.user.email}</TableCell>
                <TableCell>
                  <span className="font-mono">{formatMatricula(card.matricula)}</span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs flex items-center gap-1">
                    <QrCode className="h-4 w-4" />
                    {truncateQrCode(card.qrCode)}
                  </span>
                </TableCell>
                <TableCell>{formatDate(card.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(card)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setDeletingCard(card);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {cards.map((card) => (
          <div key={card.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                {card.photo ? (
                  <img
                    src={card.photo}
                    alt={card.user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{card.user.name}</p>
                <p className="text-sm text-muted-foreground truncate">{card.user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                    {formatMatricula(card.matricula)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <QrCode className="h-3 w-3" />
                  {truncateQrCode(card.qrCode)}
                </span>
                <span className="text-xs text-muted-foreground">
                  | {formatDate(card.createdAt)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => handleOpenDialog(card)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive h-8"
                  onClick={() => {
                    setDeletingCard(card);
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

      {cards.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma carteirinha cadastrada</p>
          {availableUsers.length > 0 && (
            <Button className="mt-4" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira carteirinha
            </Button>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCard ? 'Editar Carteirinha' : 'Nova Carteirinha'}
            </DialogTitle>
            <DialogDescription>
              {editingCard
                ? 'Edite os dados da carteirinha'
                : 'Preencha os dados para criar uma nova carteirinha'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="user">Usuario</Label>
                {editingCard ? (
                  <Input
                    id="user"
                    value={editingCard.user.name}
                    disabled
                    className="bg-muted"
                  />
                ) : (
                  <Select
                    value={formData.userId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, userId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <span className="flex flex-col">
                            <span>{user.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="matricula">Matricula (1-9999)</Label>
                <Input
                  id="matricula"
                  type="number"
                  min="1"
                  max="9999"
                  value={formData.matricula || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      matricula: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="0001"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  A matricula sera exibida com 4 digitos (ex: 0001)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Foto</Label>
                <div className="flex items-start gap-4">
                  {formData.photo ? (
                    <div className="relative">
                      <div className="w-24 h-24 rounded-lg overflow-hidden">
                        <img
                          src={formData.photo}
                          alt="Foto do usuario"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
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
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Faca upload de uma foto para a carteirinha. A foto sera
                      exibida no cartao de associado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || uploading}>
                {saving ? 'Salvando...' : editingCard ? 'Salvar' : 'Criar'}
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
              Tem certeza que deseja excluir a carteirinha de "{deletingCard?.user.name}"?
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
