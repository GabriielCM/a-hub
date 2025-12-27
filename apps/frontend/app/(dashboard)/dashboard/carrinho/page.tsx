'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api, Cart, PointsBalance } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingCart, Minus, Plus, Trash2, Store, AlertCircle, Loader2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CartPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [cart, setCart] = useState<Cart | null>(null);
  const [pointsBalance, setPointsBalance] = useState<PointsBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const loadData = useCallback(async () => {
    if (!accessToken) return;

    try {
      const [cartData, balanceData] = await Promise.all([
        api.getCart(accessToken),
        api.getMyPointsBalance(accessToken),
      ]);
      setCart(cartData);
      setPointsBalance(balanceData);
    } catch (error) {
      console.error('Error loading cart data:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao carregar dados do carrinho',
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number, maxStock: number) => {
    if (!accessToken || newQuantity < 1) return;

    if (newQuantity > maxStock) {
      toast({
        variant: 'destructive',
        title: 'Estoque insuficiente',
        description: `Apenas ${maxStock} unidades disponiveis em estoque.`,
      });
      return;
    }

    setUpdatingItemId(itemId);
    try {
      const updatedCart = await api.updateCartItem(itemId, { quantity: newQuantity }, accessToken);
      setCart(updatedCart);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao atualizar quantidade',
      });
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!accessToken) return;

    setRemovingItemId(itemId);
    try {
      const updatedCart = await api.removeFromCart(itemId, accessToken);
      setCart(updatedCart);
      toast({
        title: 'Item removido',
        description: 'O item foi removido do carrinho.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao remover item do carrinho',
      });
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleCheckout = async () => {
    if (!accessToken) return;

    setIsCheckingOut(true);
    try {
      await api.checkout(accessToken);
      toast({
        title: 'Compra realizada com sucesso!',
        description: 'Seu pedido foi criado. Verifique seus pedidos para acompanhar.',
      });
      router.push('/dashboard/pedidos');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao finalizar compra';
      toast({
        variant: 'destructive',
        title: 'Erro no checkout',
        description: errorMessage,
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const currentBalance = pointsBalance?.balance ?? 0;
  const cartTotal = cart?.totalPoints ?? 0;
  const difference = currentBalance - cartTotal;
  const hasInsufficientBalance = difference < 0;
  const isCartEmpty = !cart || cart.items.length === 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Empty cart state
  if (isCartEmpty) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Carrinho de Compras</h1>
          <p className="text-muted-foreground">
            Gerencie os itens do seu carrinho
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Seu carrinho esta vazio</h2>
            <p className="text-muted-foreground mb-6 text-center">
              Explore nossa loja e adicione produtos ao seu carrinho
            </p>
            <Button asChild>
              <Link href="/dashboard/loja">
                <Store className="h-4 w-4 mr-2" />
                Ir para a Loja
              </Link>
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
        <h1 className="text-2xl font-bold">Carrinho de Compras</h1>
        <p className="text-muted-foreground">
          {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'itens'} no carrinho
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const isUpdating = updatingItemId === item.id;
            const isRemoving = removingItemId === item.id;
            const subtotal = item.storeItem.pointsPrice * item.quantity;
            const hasPhoto = item.storeItem.photos && item.storeItem.photos.length > 0;

            return (
              <Card key={item.id} className={cn(isRemoving && 'opacity-50')}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-full sm:w-24 h-24 relative rounded-lg overflow-hidden bg-muted">
                      {hasPhoto ? (
                        <Image
                          src={item.storeItem.photos[0]}
                          alt={item.storeItem.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <h3 className="font-semibold truncate">{item.storeItem.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.storeItem.pointsPrice.toLocaleString('pt-BR')} pontos cada
                          </p>
                          {item.storeItem.stock <= 5 && (
                            <p className="text-xs text-orange-600 mt-1">
                              Apenas {item.storeItem.stock} em estoque
                            </p>
                          )}
                        </div>

                        {/* Subtotal (mobile: shown here) */}
                        <div className="text-right sm:hidden">
                          <p className="font-semibold text-primary">
                            {subtotal.toLocaleString('pt-BR')} pts
                          </p>
                        </div>
                      </div>

                      {/* Quantity Controls and Actions */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.storeItem.stock)}
                              disabled={isUpdating || item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-10 text-center text-sm font-medium">
                              {isUpdating ? (
                                <Loader2 className="h-4 w-4 mx-auto animate-spin" />
                              ) : (
                                item.quantity
                              )}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.storeItem.stock)}
                              disabled={isUpdating || item.quantity >= item.storeItem.stock}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isRemoving}
                          >
                            {isRemoving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {/* Subtotal (desktop: shown here) */}
                        <div className="hidden sm:block text-right">
                          <p className="font-semibold text-primary">
                            {subtotal.toLocaleString('pt-BR')} pts
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Continue Shopping Link */}
          <div className="pt-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/loja">
                <Store className="h-4 w-4 mr-2" />
                Continuar Comprando
              </Link>
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
              <CardDescription>
                Confira os detalhes antes de finalizar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({cart.itemCount} itens)</span>
                <span className="font-medium">{cartTotal.toLocaleString('pt-BR')} pts</span>
              </div>

              <div className="border-t pt-4 space-y-3">
                {/* Current Balance */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Seu saldo atual</span>
                  <span className="font-medium">{currentBalance.toLocaleString('pt-BR')} pts</span>
                </div>

                {/* Total */}
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{cartTotal.toLocaleString('pt-BR')} pts</span>
                </div>

                {/* Remaining Balance */}
                <div className={cn(
                  "flex justify-between text-sm p-3 rounded-lg",
                  hasInsufficientBalance
                    ? "bg-destructive/10 text-destructive"
                    : "bg-green-50 text-green-700"
                )}>
                  <span>{hasInsufficientBalance ? 'Faltam' : 'Saldo restante'}</span>
                  <span className="font-semibold">
                    {hasInsufficientBalance
                      ? Math.abs(difference).toLocaleString('pt-BR')
                      : difference.toLocaleString('pt-BR')
                    } pts
                  </span>
                </div>
              </div>

              {/* Insufficient Balance Warning */}
              {hasInsufficientBalance && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Saldo insuficiente</p>
                    <p className="text-xs mt-1 opacity-80">
                      Voce precisa de mais {Math.abs(difference).toLocaleString('pt-BR')} pontos para finalizar esta compra.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={hasInsufficientBalance || isCheckingOut || isCartEmpty}
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Finalizar Compra
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
