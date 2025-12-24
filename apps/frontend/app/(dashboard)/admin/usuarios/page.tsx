'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, User } from '@/lib/api';
import { Button } from '@/components/ui/button';
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
import { Trash2, Shield, User as UserIcon, Monitor } from 'lucide-react';

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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (currentUser?.role !== 'ADMIN') {
      return;
    }
    loadUsers();
  }, [currentUser]);

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
      <div>
        <h1 className="text-2xl font-bold">Usuários</h1>
        <p className="text-muted-foreground">
          Gerencie os usuários do sistema ({users.length} total)
        </p>
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
