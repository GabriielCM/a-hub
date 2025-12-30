'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api, Space } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { PullToRefresh } from '@/components/feedback/pull-to-refresh';
import { MapPin, Search } from 'lucide-react';
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

function SpacesSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <div className="h-8 w-32 skeleton rounded-lg" />
        <div className="h-4 w-64 skeleton rounded-lg mt-2" />
      </div>
      <div className="h-12 skeleton rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton rounded-2xl h-72" />
        ))}
      </div>
    </div>
  );
}

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [filteredSpaces, setFilteredSpaces] = useState<Space[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadSpaces = useCallback(async () => {
    try {
      const data = await api.getSpaces();
      setSpaces(data);
      setFilteredSpaces(data);
    } catch (error) {
      console.error('Error loading spaces:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSpaces();
  }, [loadSpaces]);

  useEffect(() => {
    const filtered = spaces.filter((space) =>
      space.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSpaces(filtered);
  }, [searchQuery, spaces]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadSpaces();
  };

  if (isLoading) {
    return <SpacesSkeleton />;
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
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold">Espacos</h1>
          <p className="text-muted-foreground">
            Explore e reserve os espacos disponiveis
          </p>
        </motion.div>

        {/* Search */}
        <motion.div variants={itemVariants} className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            placeholder="Buscar espacos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'pl-12 h-12 rounded-xl bg-white border-gray-200',
              'focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500',
              'transition-all duration-200'
            )}
          />
        </motion.div>

        {/* Spaces Grid */}
        {filteredSpaces.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center justify-center py-16 px-4"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-fuchsia-100 flex items-center justify-center mb-6">
              <MapPin className="h-10 w-10 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum espaco encontrado
            </h3>
            <p className="text-muted-foreground text-center">
              Tente buscar com outros termos
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredSpaces.map((space) => (
              <Link key={space.id} href={`/dashboard/espacos/${space.id}`}>
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'relative overflow-hidden rounded-2xl bg-white',
                    'shadow-lg hover:shadow-xl transition-all duration-300',
                    'border border-gray-100 cursor-pointer'
                  )}
                >
                  {/* Image container with gradient overlay */}
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    {space.photos && space.photos[0] ? (
                      <img
                        src={space.photos[0]}
                        alt={space.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-fuchsia-100">
                        <MapPin className="h-12 w-12 text-purple-300" />
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-foreground">
                      {space.name}
                    </h3>
                    {space.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {space.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                        R$ {space.value.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
                        por dia
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        )}
      </motion.div>
    </PullToRefresh>
  );
}
