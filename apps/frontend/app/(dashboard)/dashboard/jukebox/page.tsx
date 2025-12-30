'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  api,
  JukeboxQueueItem,
  JukeboxTrackSearchResult,
  PointsBalance,
} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  Music,
  Search,
  Coins,
  Clock,
  User,
  Loader2,
  AlertCircle,
  Play,
  ListMusic,
  Plus,
} from 'lucide-react';

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function JukeboxPage() {
  const { user, accessToken } = useAuth();
  const { toast } = useToast();

  const [nowPlaying, setNowPlaying] = useState<JukeboxQueueItem | null>(null);
  const [queue, setQueue] = useState<JukeboxQueueItem[]>([]);
  const [balance, setBalance] = useState<PointsBalance | null>(null);
  const [pointsCost, setPointsCost] = useState(10);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<JukeboxTrackSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Confirm state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<JukeboxTrackSearchResult | null>(null);
  const [queueing, setQueueing] = useState(false);

  const loadData = useCallback(async () => {
    if (!accessToken) return;

    try {
      const [queueData, balanceData, configData] = await Promise.all([
        api.getJukeboxQueue(accessToken),
        api.getMyPointsBalance(accessToken),
        api.getJukeboxConfig(accessToken).catch(() => null),
      ]);

      setNowPlaying(queueData.nowPlaying);
      setQueue(queueData.queue);
      setBalance(balanceData);
      if (configData) {
        setPointsCost(configData.pointsPerSong);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadData();

    // Poll for updates every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      if (!accessToken) return;

      try {
        setSearching(true);
        const results = await api.searchJukeboxTracks(searchQuery, accessToken);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao buscar musicas',
          variant: 'destructive',
        });
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, accessToken, toast]);

  const handleSelectTrack = (track: JukeboxTrackSearchResult) => {
    setSelectedTrack(track);
    setSearchOpen(false);
    setConfirmOpen(true);
  };

  const handleConfirmQueue = async () => {
    if (!selectedTrack || !accessToken) return;

    try {
      setQueueing(true);
      await api.queueJukeboxTrack(
        {
          trackId: selectedTrack.id,
          trackName: selectedTrack.name,
          artistName: selectedTrack.artistName,
          durationMs: selectedTrack.durationMs,
          albumImage: selectedTrack.albumImage || undefined,
        },
        accessToken
      );

      toast({
        title: 'Musica adicionada',
        description: `${selectedTrack.name} foi adicionada a fila!`,
      });

      setConfirmOpen(false);
      setSelectedTrack(null);
      setSearchQuery('');
      setSearchResults([]);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar musica',
        variant: 'destructive',
      });
    } finally {
      setQueueing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Music className="h-8 w-8 text-green-500" />
          <div>
            <h1 className="text-2xl font-bold">Jukebox</h1>
            <p className="text-muted-foreground">Escolha suas musicas favoritas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold">{balance?.balance || 0} pts</span>
        </div>
      </div>

      {/* Now Playing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Play className="h-5 w-5 text-green-500" />
            Agora Tocando
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nowPlaying ? (
            <div className="flex items-center gap-4">
              {nowPlaying.albumImage && (
                <img
                  src={nowPlaying.albumImage}
                  alt={nowPlaying.trackName}
                  className="w-20 h-20 rounded-lg shadow-md"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{nowPlaying.trackName}</h3>
                <p className="text-muted-foreground truncate">{nowPlaying.artistName}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Pedido por {nowPlaying.user.name}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma musica tocando</p>
              <p className="text-sm">Seja o primeiro a escolher uma musica!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListMusic className="h-5 w-5" />
            Proximas ({queue.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queue.length > 0 ? (
            <div className="space-y-3">
              {queue.slice(0, 5).map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <span className="text-lg font-bold text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  {item.albumImage && (
                    <img
                      src={item.albumImage}
                      alt={item.trackName}
                      className="w-12 h-12 rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.trackName}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.artistName}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{formatDuration(item.durationMs)}</p>
                    <p className="truncate">{item.user.name}</p>
                  </div>
                </div>
              ))}
              {queue.length > 5 && (
                <p className="text-center text-sm text-muted-foreground">
                  + {queue.length - 5} mais na fila
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>Fila vazia</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Song Button */}
      <Button
        size="lg"
        className="w-full bg-green-600 hover:bg-green-700"
        onClick={() => setSearchOpen(true)}
      >
        <Search className="h-5 w-5 mr-2" />
        Escolher Musica ({pointsCost} pts)
      </Button>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Buscar Musica</DialogTitle>
            <DialogDescription>
              Digite o nome da musica ou artista
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-[200px]">
            {searching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => handleSelectTrack(track)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    {track.albumImage && (
                      <img
                        src={track.albumImage}
                        alt={track.name}
                        className="w-12 h-12 rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{track.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {track.artistName}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{formatDuration(track.durationMs)}</p>
                      <Badge variant="secondary" className="mt-1">
                        {pointsCost} pts
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma musica encontrada</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Digite pelo menos 2 caracteres</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar</DialogTitle>
            <DialogDescription>
              Deseja adicionar esta musica a fila?
            </DialogDescription>
          </DialogHeader>

          {selectedTrack && (
            <div className="flex items-center gap-4 py-4">
              {selectedTrack.albumImage && (
                <img
                  src={selectedTrack.albumImage}
                  alt={selectedTrack.name}
                  className="w-16 h-16 rounded-lg"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{selectedTrack.name}</p>
                <p className="text-muted-foreground truncate">{selectedTrack.artistName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {formatDuration(selectedTrack.durationMs)}
                </p>
              </div>
            </div>
          )}

          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custo:</span>
              <span className="font-semibold">{pointsCost} pontos</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saldo atual:</span>
              <span>{balance?.balance || 0} pontos</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saldo apos:</span>
              <span className={`font-semibold ${(balance?.balance || 0) - pointsCost < 0 ? 'text-red-500' : 'text-green-600'}`}>
                {(balance?.balance || 0) - pointsCost} pontos
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmQueue}
              disabled={queueing || (balance?.balance || 0) < pointsCost}
              className="bg-green-600 hover:bg-green-700"
            >
              {queueing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
