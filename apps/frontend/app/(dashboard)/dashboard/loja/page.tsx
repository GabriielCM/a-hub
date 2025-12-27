'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api, StoreItem, PointsBalance, Cart } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  Coins,
  ShoppingCart,
  Package,
  AlertTriangle,
  ShoppingBag,
} from 'lucide-react';

type SortOption = 'all' | 'price-asc' | 'price-desc';

export default function LojaPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<StoreItem[]>([]);
  const [pointsBalance, setPointsBalance] = useState<PointsBalance | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('all');

  // Carregar dados iniciais
  useEffect(() => {
    async function loadData() {
      if (!accessToken) return;

      try {
        const [itemsData, balanceData, cartData] = await Promise.all([
          api.getStoreItems(),
          api.getMyPointsBalance(accessToken),
          api.getCart(accessToken),
        ]);

        // Filtrar apenas itens ativos
        setItems(itemsData.filter((item) => item.isActive));
        setPointsBalance(balanceData);
        setCart(cartData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Nao foi possivel carregar os dados da loja.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [accessToken, toast]);

  // Ordenar itens
  const sortedItems = useMemo(() => {
    const sorted = [...items];
    switch (sortOption) {
      case 'price-asc':
        return sorted.sort((a, b) => a.pointsPrice - b.pointsPrice);
      case 'price-desc':
        return sorted.sort((a, b) => b.pointsPrice - a.pointsPrice);
      default:
        return sorted;
    }
  }, [items, sortOption]);

  // Adicionar ao carrinho
  async function handleAddToCart(item: StoreItem) {
    if (!accessToken) return;

    setAddingToCart(item.id);
    try {
      const updatedCart = await api.addToCart(
        { storeItemId: item.id, quantity: 1 },
        accessToken
      );
      setCart(updatedCart);
      toast({
        title: 'Adicionado ao carrinho',
        description: `${item.name} foi adicionado ao seu carrinho.`,
      });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast({
        title: 'Erro ao adicionar',
        description: 'Nao foi possivel adicionar o item ao carrinho.',
        variant: 'destructive',
      });
    } finally {
      setAddingToCart(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com link para o carrinho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Loja do Associado</h1>
          <p className="text-muted-foreground">
            Troque seus pontos por produtos exclusivos
          </p>
        </div>

        <Link href="/dashboard/carrinho">
          <Button variant="outline" className="relative">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Carrinho
            {cart && cart.itemCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {cart.itemCount}
              </Badge>
            )}
          </Button>
        </Link>
      </div>

      {/* Card de Saldo de Pontos */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 rounded-full p-3">
              <Coins className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Seu saldo</p>
              <p className="text-3xl font-bold text-primary">
                {pointsBalance?.balance.toLocaleString('pt-BR') ?? 0}
                <span className="text-lg font-normal ml-1">pontos</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtro de ordenacao */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Ordenar por:</span>
        <Select
          value={sortOption}
          onValueChange={(value: SortOption) => setSortOption(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="price-asc">Menor preco</SelectItem>
            <SelectItem value="price-desc">Maior preco</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid de Produtos */}
      {sortedItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium">Nenhum produto disponivel</h3>
            <p className="text-muted-foreground">
              Novos produtos serao adicionados em breve!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedItems.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden hover:shadow-lg transition-shadow group"
            >
              {/* Imagem do produto */}
              <div className="relative aspect-square bg-muted">
                {item.photos && item.photos[0] ? (
                  <img
                    src={item.photos[0]}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                {/* Badge de estoque baixo */}
                {item.stock > 0 && item.stock < 5 && (
                  <Badge
                    variant="destructive"
                    className="absolute top-2 right-2 gap-1"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Ultimas unidades
                  </Badge>
                )}

                {/* Badge de sem estoque */}
                {item.stock === 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Badge variant="secondary" className="text-sm">
                      Esgotado
                    </Badge>
                  </div>
                )}
              </div>

              {/* Conteudo do card */}
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm sm:text-base line-clamp-1">
                  {item.name}
                </h3>

                {item.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[2.5rem]">
                    {item.description}
                  </p>
                )}

                {/* Preco em pontos */}
                <div className="mt-3 flex items-center gap-1">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="text-lg font-bold text-primary">
                    {item.pointsPrice.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-xs text-muted-foreground">pontos</span>
                </div>

                {/* Botao adicionar ao carrinho */}
                <Button
                  className="w-full mt-3"
                  size="sm"
                  disabled={
                    item.stock === 0 ||
                    addingToCart === item.id ||
                    (pointsBalance?.balance ?? 0) < item.pointsPrice
                  }
                  onClick={() => handleAddToCart(item)}
                >
                  {addingToCart === item.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : item.stock === 0 ? (
                    'Indisponivel'
                  ) : (pointsBalance?.balance ?? 0) < item.pointsPrice ? (
                    'Pontos insuficientes'
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Adicionar
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
