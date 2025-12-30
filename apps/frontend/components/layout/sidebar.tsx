'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Calendar,
  MapPin,
  Users,
  FileText,
  LogOut,
  Settings,
  CreditCard,
  Gift,
  ShoppingBag,
  ShoppingCart,
  Star,
  Package,
  PartyPopper,
  Store,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const userLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/espacos', label: 'Espaços', icon: MapPin },
  { href: '/dashboard/agendamentos', label: 'Meus Agendamentos', icon: Calendar },
  { href: '/dashboard/eventos', label: 'Eventos', icon: PartyPopper },
  { href: '/dashboard/carteirinha', label: 'Minha Carteirinha', icon: CreditCard },
  { href: '/dashboard/loja', label: 'Loja', icon: ShoppingBag },
  { href: '/dashboard/carrinho', label: 'Carrinho', icon: ShoppingCart },
  { href: '/dashboard/pedidos', label: 'Meus Pedidos', icon: Package },
  { href: '/dashboard/pontos', label: 'Meus Pontos', icon: Star },
];

const adminLinks = [
  { href: '/admin/espacos', label: 'Gerenciar Espaços', icon: Settings },
  { href: '/admin/usuarios', label: 'Usuários', icon: Users },
  { href: '/admin/carteirinhas', label: 'Carteirinhas', icon: CreditCard },
  { href: '/admin/beneficios', label: 'Benefícios', icon: Gift },
  { href: '/admin/eventos', label: 'Eventos', icon: PartyPopper },
  { href: '/admin/loja', label: 'Loja do Associado', icon: ShoppingBag },
  { href: '/admin/kyosk', label: 'Kyosk (PDV)', icon: Store },
  { href: '/admin/relatorios', label: 'Relatórios', icon: FileText },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === 'ADMIN';

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r flex flex-col',
        className
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-lg font-bold text-white">A</span>
          </div>
          <span className="text-xl font-semibold text-primary">A-hub</span>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.role === 'ADMIN' ? 'Administrador' : 'Colaborador'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {userLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administração
              </p>
            </div>
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => logout()}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
