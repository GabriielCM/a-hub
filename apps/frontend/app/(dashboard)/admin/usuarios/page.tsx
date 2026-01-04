'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, User, CreateUserData } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Plus, Trash2, Shield, User as UserIcon, Monitor } from 'lucide-react';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  COLLABORATOR: 'Colaborador',
  DISPLAY: 'Display',
};

const roleIcons: Record<string, React.ReactNode> = {
  ADMIN: <Shield className="h-4 w-4" />,
  COLLABORATOR: <UserIcon className="h-4 w-4" />,
  DISPLAY: <Monitor className="h-4 w-4" />,
};

export default function AdminUsuariosPage() {
  const { accessToken, user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<CreateUserData>({
    name: '',
    email: '',
    password: '',
    role: 'COLLABORATOR',
  });

  useEffect(() => {
    if (!accessToken || currentUser?.role !== 'ADMIN') {
      return;
    }
    loadUsers();
  }, [accessToken, currentUser]);

  const loadUsers = async () => {
    if (!accessToken) return;
    try {
      const data = await api.getUsers(accessToken);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!accessToken) return;
    try {
      await api.updateUser(userId, { role: newRole as User['role'] }, accessToken);
      loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Erro ao atualizar cargo do usuário');
    }
  };

  const handleDelete = async () => {
    if (!deletingUser || !accessToken) return;

    try {
      await api.deleteUser(deletingUser.id, accessToken);
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erro ao excluir usuário');
    }
  };

  const handleOpenCreateDialog = () => {
    setFormData({ name: '', email: '', password: '', role: 'COLLABORATOR' });
    setIsCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setFormData({ name: '', email: '', password: '', role: 'COLLABORATOR' });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (formData.password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres',
      });
      return;
    }

    setCreating(true);
    try {
      await api.createUser(formData, accessToken);
      toast({
        title: 'Sucesso',
        description: 'Usuário criado com sucesso',
      });
      handleCloseCreateDialog();
      loadUsers();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar usuário',
        description: error instanceof Error ? error.message : 'Erro ao criar usuário',
      });
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários do sistema ({users.length} total)
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                    disabled={user.id === currentUser?.id}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">
                        <span className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Administrador
                        </span>
                      </SelectItem>
                      <SelectItem value="COLLABORATOR">
                        <span className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          Colaborador
                        </span>
                      </SelectItem>
                      <SelectItem value="DISPLAY">
                        <span className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          Display
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={user.id === currentUser?.id}
                    onClick={() => {
                      setDeletingUser(user);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <div key={user.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                {roleIcons[user.role]}
                {roleLabels[user.role]}
              </Badge>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                Criado em {formatDate(user.createdAt)}
              </span>
              <div className="flex gap-2">
                <Select
                  value={user.role}
                  onValueChange={(value) => handleRoleChange(user.id, value)}
                  disabled={user.id === currentUser?.id}
                >
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="COLLABORATOR">Colaborador</SelectItem>
                    <SelectItem value="DISPLAY">Display</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive h-8"
                  disabled={user.id === currentUser?.id}
                  onClick={() => {
                    setDeletingUser(user);
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

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum usuário encontrado</p>
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do usuário"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Cargo</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as User['role'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COLLABORATOR">
                      <span className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Colaborador
                      </span>
                    </SelectItem>
                    <SelectItem value="ADMIN">
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Administrador
                      </span>
                    </SelectItem>
                    <SelectItem value="DISPLAY">
                      <span className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Display
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseCreateDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Criando...' : 'Criar Usuário'}
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
              Tem certeza que deseja excluir o usuário "{deletingUser?.name}"?
              Todos os agendamentos deste usuário também serão removidos.
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
