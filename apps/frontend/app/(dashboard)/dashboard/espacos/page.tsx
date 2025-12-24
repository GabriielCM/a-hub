'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Space } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, Search } from 'lucide-react';

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [filteredSpaces, setFilteredSpaces] = useState<Space[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSpaces() {
      try {
        const data = await api.getSpaces();
        setSpaces(data);
        setFilteredSpaces(data);
      } catch (error) {
        console.error('Error loading spaces:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSpaces();
  }, []);

  useEffect(() => {
    const filtered = spaces.filter((space) =>
      space.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSpaces(filtered);
  }, [searchQuery, spaces]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Espaços</h1>
        <p className="text-muted-foreground">
          Explore e reserve os espaços disponíveis
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar espaços..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Spaces Grid */}
      {filteredSpaces.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium">Nenhum espaço encontrado</h3>
            <p className="text-muted-foreground">
              Tente buscar com outros termos
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpaces.map((space) => (
            <Link key={space.id} href={`/dashboard/espacos/${space.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative aspect-video bg-muted">
                  {space.photos && space.photos[0] ? (
                    <img
                      src={space.photos[0]}
                      alt={space.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg">{space.name}</h3>
                  {space.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {space.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-primary font-medium">
                      R$ {space.value.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      por dia
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
