'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';
import { api, KyoskDisplayData, KyoskOrder } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Store, Package, Coins, Plus, Minus, ShoppingCart, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const QRCodeSVG = dynamic(
  () => import('qrcode.react').then((mod) => ({ default: mod.QRCodeSVG })),
  { ssr: false }
);

interface CartItem {
  productId: string;
  productName: string;
  image?: string;
  pointsPrice: number;
  quantity: number;
  maxStock: number;
}

export default function KyoskDisplayPage() {
  const params = useParams();
  const kyoskId = params.id as string;
  const { accessToken, user } = useAuth();
  const [displayData, setDisplayData] = useState<KyoskDisplayData | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<KyoskOrder | null>(null);
  const [orderStatus, setOrderStatus] = useState<'pending' | 'completed' | 'expired'>('pending');
  const [countdown, setCountdown] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const loadDisplayData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await api.getKyoskDisplay(kyoskId, accessToken);
      setDisplayData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading display:', error);
      setLoading(false);
    }
  }, [kyoskId, accessToken]);

  useEffect(() => {
    loadDisplayData();
    const interval = setInterval(loadDisplayData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [loadDisplayData]);

  // Countdown timer for QR expiration
  useEffect(() => {
    if (!currentOrder || orderStatus !== 'pending') return;

    const expiresAt = new Date(currentOrder.expiresAt);
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) {
        setOrderStatus('expired');
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [currentOrder, orderStatus]);

  // Poll for payment status
  useEffect(() => {
    if (!currentOrder || !showCheckout || orderStatus !== 'pending' || !accessToken) return;

    const pollStatus = async () => {
      try {
        const updated = await api.getKyoskOrderStatus(kyoskId, currentOrder.id, accessToken);
        if (updated.status === 'COMPLETED') {
          setOrderStatus('completed');
        } else if (updated.status === 'EXPIRED' || updated.status === 'CANCELLED') {
          setOrderStatus('expired');
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    };

    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [currentOrder, showCheckout, orderStatus, kyoskId, accessToken]);

  const addToCart = (product: KyoskDisplayData['products'][0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        image: product.image,
        pointsPrice: product.pointsPrice,
        quantity: 1,
        maxStock: product.stock,
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.productId !== productId) return item;
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (newQty > item.maxStock) return item;
        return { ...item, quantity: newQty };
      }).filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => setCart([]);

  const totalPoints = cart.reduce((sum, item) => sum + item.pointsPrice * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (!accessToken || cart.length === 0) return;

    setCheckoutLoading(true);
    try {
      const items = cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      const order = await api.createKyoskOrder(kyoskId, { items }, accessToken);
      setCurrentOrder(order);
      setOrderStatus('pending');
      setShowCheckout(true);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Erro ao criar pedido');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    if (orderStatus === 'completed') {
      setCart([]);
      loadDisplayData();
    }
    setCurrentOrder(null);
    setOrderStatus('pending');
  };

  const getCartQuantity = (productId: string) => {
    return cart.find((item) => item.productId === productId)?.quantity || 0;
  };

  if (!accessToken || (user?.role !== 'DISPLAY' && user?.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <p className="text-lg font-medium">Acesso Restrito</p>
            <p className="text-muted-foreground mt-2">
              Esta pagina requer autenticacao com perfil DISPLAY
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!displayData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Kyosk nao encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">{displayData.kyosk.name}</h1>
              {displayData.kyosk.description && (
                <p className="text-sm opacity-90">{displayData.kyosk.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <ShoppingCart className="h-5 w-5 mr-2" />
              {totalItems} itens
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Coins className="h-5 w-5 mr-2" />
              {totalPoints.toLocaleString('pt-BR')} pts
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Products Grid */}
        <div className="lg:col-span-3">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {displayData.products.map((product) => {
              const cartQty = getCartQuantity(product.id);
              const isOutOfStock = product.stock === 0;
              const isMaxed = cartQty >= product.stock;

              return (
                <Card
                  key={product.id}
                  className={`overflow-hidden ${isOutOfStock ? 'opacity-50' : ''}`}
                >
                  <div className="aspect-square bg-muted relative">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    {cartQty > 0 && (
                      <Badge className="absolute top-2 right-2 text-lg px-3 py-1">
                        {cartQty}
                      </Badge>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive">Esgotado</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-primary font-bold text-xl flex items-center gap-1">
                        <Coins className="h-5 w-5" />
                        {product.pointsPrice}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {product.stock} disp.
                      </span>
                    </div>
                    <Button
                      className="w-full mt-4"
                      size="lg"
                      onClick={() => addToCart(product)}
                      disabled={isOutOfStock || isMaxed}
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Adicionar
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {displayData.products.length === 0 && (
            <div className="text-center py-16">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">Nenhum produto disponivel</p>
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrinho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Carrinho vazio
                </p>
              ) : (
                <>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.productId} className="flex items-center gap-3 border-b pb-3">
                        <div className="w-12 h-12 bg-muted rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.productName}</p>
                          <p className="text-sm text-primary">{item.pointsPrice} pts</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.productId, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.productId, 1)}
                            disabled={item.quantity >= item.maxStock}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary flex items-center gap-1">
                        <Coins className="h-5 w-5" />
                        {totalPoints.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={clearCart}>
                        Limpar
                      </Button>
                      <Button
                        className="flex-1"
                        size="lg"
                        onClick={handleCheckout}
                        disabled={checkoutLoading}
                      >
                        {checkoutLoading ? 'Gerando...' : 'Finalizar'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Checkout Modal with QR */}
      <Dialog open={showCheckout} onOpenChange={handleCloseCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {orderStatus === 'completed' ? 'Pagamento Confirmado!' :
               orderStatus === 'expired' ? 'QR Code Expirado' :
               'Aguardando Pagamento'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center p-4">
            {orderStatus === 'pending' && currentOrder && (
              <>
                <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
                  <QRCodeSVG value={currentOrder.qrPayload} size={250} level="H" />
                </div>
                <p className="text-2xl font-bold text-primary mb-2">
                  {currentOrder.totalPoints.toLocaleString('pt-BR')} pontos
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Escaneie o QR Code na pagina de Pontos
                </p>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(0, (countdown / 300) * 100)}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Expira em: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </p>
              </>
            )}

            {orderStatus === 'completed' && (
              <div className="text-center py-8">
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
                <p className="text-xl font-semibold">Pagamento realizado com sucesso!</p>
                <p className="text-muted-foreground mt-2">Obrigado pela compra</p>
                <Button className="mt-6" onClick={handleCloseCheckout}>
                  Nova Compra
                </Button>
              </div>
            )}

            {orderStatus === 'expired' && (
              <div className="text-center py-8">
                <XCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
                <p className="text-xl font-semibold">QR Code expirado</p>
                <p className="text-muted-foreground mt-2">Por favor, tente novamente</p>
                <Button className="mt-6" onClick={handleCloseCheckout}>
                  Tentar Novamente
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
