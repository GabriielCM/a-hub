'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, JukeboxDisplayData } from '@/lib/api';
import { Music, User, ListMusic, History, WifiOff } from 'lucide-react';

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatProgress(progressMs: number | null, durationMs: number): string {
  if (progressMs === null) return '0:00';
  const minutes = Math.floor(progressMs / 60000);
  const seconds = Math.floor((progressMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function JukeboxDisplayPage() {
  const [data, setData] = useState<JukeboxDisplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const displayData = await api.getJukeboxDisplay();
      setData(displayData);
      setError(false);
    } catch (err) {
      console.error('Error loading display data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Poll every 3 seconds for real-time updates
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <Music className="h-16 w-16 mx-auto mb-4 animate-pulse text-green-500" />
          <p className="text-xl">Carregando Jukebox...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <WifiOff className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <p className="text-xl">Erro ao conectar</p>
          <p className="text-gray-400 mt-2">Tentando reconectar...</p>
        </div>
      </div>
    );
  }

  if (!data.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <Music className="h-16 w-16 mx-auto mb-4 text-gray-500" />
          <p className="text-2xl">Jukebox Desativado</p>
          <p className="text-gray-400 mt-2">Aguardando ativacao pelo administrador</p>
        </div>
      </div>
    );
  }

  const progressPercent = data.nowPlaying && data.playbackProgress
    ? Math.min((data.playbackProgress / data.nowPlaying.durationMs) * 100, 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white overflow-hidden">
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Now Playing Section - Left/Top */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12">
          {data.nowPlaying ? (
            <>
              {/* Album Art */}
              <div className="relative mb-8">
                {data.nowPlaying.albumImage ? (
                  <img
                    src={data.nowPlaying.albumImage}
                    alt={data.nowPlaying.trackName}
                    className="w-64 h-64 lg:w-80 lg:h-80 rounded-2xl shadow-2xl shadow-green-500/20"
                  />
                ) : (
                  <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-2xl bg-gray-800 flex items-center justify-center">
                    <Music className="h-24 w-24 text-gray-600" />
                  </div>
                )}
                {/* Playing indicator */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-green-500 text-black px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-black rounded-full animate-pulse" />
                  Tocando Agora
                </div>
              </div>

              {/* Track Info */}
              <div className="text-center max-w-lg">
                <h1 className="text-3xl lg:text-4xl font-bold mb-2 truncate">
                  {data.nowPlaying.trackName}
                </h1>
                <p className="text-xl lg:text-2xl text-gray-400 mb-4 truncate">
                  {data.nowPlaying.artistName}
                </p>

                {/* Progress Bar */}
                <div className="w-full max-w-md mx-auto mb-4">
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-1000 ease-linear"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>{formatProgress(data.playbackProgress, data.nowPlaying.durationMs)}</span>
                    <span>{formatDuration(data.nowPlaying.durationMs)}</span>
                  </div>
                </div>

                {/* Requested By */}
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <User className="h-5 w-5" />
                  <span>Pedido por <span className="text-white font-medium">{data.nowPlaying.user.name}</span></span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <Music className="h-24 w-24 mx-auto mb-6 text-gray-600" />
              <h2 className="text-2xl font-semibold text-gray-400">Nenhuma musica tocando</h2>
              <p className="text-gray-500 mt-2">Escaneie o QR Code para escolher uma musica!</p>
            </div>
          )}
        </div>

        {/* Queue Section - Right/Bottom */}
        <div className="w-full lg:w-96 bg-black/50 backdrop-blur p-6 lg:p-8 flex flex-col">
          {/* Next Up */}
          <div className="mb-8">
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-4 text-green-400">
              <ListMusic className="h-5 w-5" />
              Proximas
            </h2>
            {data.queue.length > 0 ? (
              <div className="space-y-3">
                {data.queue.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-2xl font-bold text-gray-600 w-8">
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
                      <p className="text-sm text-gray-400 truncate">{item.artistName}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Fila vazia</p>
              </div>
            )}
          </div>

          {/* History */}
          {data.history.length > 0 && (
            <div className="mt-auto">
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-4 text-gray-400">
                <History className="h-5 w-5" />
                Historico
              </h2>
              <div className="space-y-2">
                {data.history.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-white/5 opacity-60"
                  >
                    {item.albumImage && (
                      <img
                        src={item.albumImage}
                        alt={item.trackName}
                        className="w-10 h-10 rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.trackName}</p>
                      <p className="text-xs text-gray-500 truncate">{item.artistName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent py-4 px-6">
        <div className="flex items-center justify-center gap-3 text-gray-500 text-sm">
          <Music className="h-4 w-4 text-green-500" />
          <span>Powered by Spotify</span>
          <span className="mx-2">|</span>
          <span>Associacao Cristofoli Jukebox</span>
        </div>
      </div>
    </div>
  );
}
