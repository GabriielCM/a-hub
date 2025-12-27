'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, Order } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, ChevronDown, ChevronUp, ShoppingBag, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Pendente',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  COMPLETED: {
    label: 'Concluido',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  CANCELLED: {
    label: 'Cancelado',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

export default function OrdersPage() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      if (!accessToken) return;

      try {
        const data = await api.getMyOrders(accessToken);
        // Sort by date descending (most recent first)
        const sortedOrders = data.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sortedOrders);
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadOrders();
  }, [accessToken]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const formatOrderDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy, 'as' HH:mm", {
      locale: ptBR,
    });
  };

  const getStatusBadge = (status: OrderStatus) => {
    const config = statusConfig[status];
    return (
      <Badge variant="outline" className={cn('font-medium', config.className)}>
        {config.label}
      </Badge>
    );
  };

  const getItemsSummary = (order: Order) => {
    const maxItems = 2;
    const items = order.items.slice(0, maxItems);
    const remaining = order.items.length - maxItems;

    const summary = items.map((item) => `${item.storeItem.name} x${item.quantity}`).join(', ');

    if (remaining > 0) {
      return `${summary} e mais ${remaining} ${remaining === 1 ? 'item' : 'itens'}`;
    }

    return summary;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Meus Pedidos</h1>
          <p className="text-muted-foreground">Acompanhe seus pedidos da loja de pontos</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhum pedido encontrado</h2>
            <p className="text-muted-foreground mb-6 text-center">
              Voce ainda nao realizou nenhum pedido na loja de pontos
            </p>
            <Button asChild>
              <a href="/dashboard/loja">
                <Package className="h-4 w-4 mr-2" />
                Ir para a Loja
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Meus Pedidos</h1>
        <p className="text-muted-foreground">
          {orders.length} {orders.length === 1 ? 'pedido realizado' : 'pedidos realizados'}
        </p>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedOrderId === order.id;

          return (
            <Card key={order.id} className="overflow-hidden">
              {/* Order Header - Always visible */}
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpand(order.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">
                          Pedido #{order.id.slice(-8).toUpperCase()}
                        </CardTitle>
                        {getStatusBadge(order.status)}
                      </div>
                      <CardDescription className="mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatOrderDate(order.createdAt)}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pl-10 sm:pl-0">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-semibold text-primary">
                        {order.totalPoints.toLocaleString('pt-BR')} pts
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Items Summary - Only when collapsed */}
                {!isExpanded && (
                  <p className="text-sm text-muted-foreground mt-2 pl-10 truncate">
                    {getItemsSummary(order)}
                  </p>
                )}
              </CardHeader>

              {/* Order Details - Expanded */}
              {isExpanded && (
                <CardContent className="border-t bg-muted/20">
                  <div className="pt-4 space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Itens do Pedido
                    </h4>

                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-background rounded-lg border"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                              {item.storeItem.photos && item.storeItem.photos.length > 0 ? (
                                <img
                                  src={item.storeItem.photos[0]}
                                  alt={item.storeItem.name}
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{item.storeItem.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.pointsPrice.toLocaleString('pt-BR')} pts x {item.quantity}
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 ml-4">
                            <p className="font-semibold">
                              {(item.pointsPrice * item.quantity).toLocaleString('pt-BR')} pts
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Total */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="font-medium">Total do Pedido</span>
                      <span className="text-lg font-bold text-primary">
                        {order.totalPoints.toLocaleString('pt-BR')} pontos
                      </span>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
