'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, JukeboxConfig, SpotifyDevice } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Music2,
  Wifi,
  WifiOff,
  Monitor,
  Smartphone,
  Speaker,
  Tv,
  RefreshCw,
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function SpotifyIntegrationPage() {
  const { user, accessToken } = useAuth();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [config, setConfig] = useState<JukeboxConfig | null>(null);
  const [devices, setDevices] = useState<SpotifyDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [pointsPerSong, setPointsPerSong] = useState(10);
  const [maxSongsPerUser, setMaxSongsPerUser] = useState(3);
  const [maxDurationMinutes, setMaxDurationMinutes] = useState(7);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Check for callback params
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'connected') {
      toast({
        title: 'Spotify conectado',
        description: 'Conta Spotify conectada com sucesso!',
      });
      // Clean URL
      window.history.replaceState({}, '', '/admin/integracoes/spotify');
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        spotify_denied: 'Acesso ao Spotify negado',
        no_code: 'Codigo de autorizacao nao recebido',
        premium_required: 'Spotify Premium e necessario para usar o Jukebox',
        auth_failed: 'Falha na autenticacao com Spotify',
      };
      toast({
        title: 'Erro',
        description: errorMessages[error] || 'Erro ao conectar Spotify',
        variant: 'destructive',
      });
      window.history.replaceState({}, '', '/admin/integracoes/spotify');
    }
  }, [searchParams, toast]);

  useEffect(() => {
    if (accessToken && user?.role === 'ADMIN') {
      loadConfig();
    }
  }, [accessToken, user]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await api.getJukeboxConfig(accessToken!);
      setConfig(data);
      setPointsPerSong(data.pointsPerSong);
      setMaxSongsPerUser(data.maxSongsPerUser);
      setMaxDurationMinutes(Math.floor(data.maxDurationMs / 60000));
      setIsActive(data.isActive);

      if (data.isConnected) {
        loadDevices();
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar configuracoes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async () => {
    try {
      setLoadingDevices(true);
      const data = await api.getSpotifyDevices(accessToken!);
      setDevices(data);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const { url } = await api.getSpotifyAuthUrl(accessToken!);
      window.location.href = url;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao iniciar conexao com Spotify',
        variant: 'destructive',
      });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Tem certeza que deseja desconectar o Spotify?')) return;

    try {
      await api.disconnectSpotify(accessToken!);
      toast({
        title: 'Desconectado',
        description: 'Spotify desconectado com sucesso',
      });
      loadConfig();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao desconectar Spotify',
        variant: 'destructive',
      });
    }
  };

  const handleSelectDevice = async (device: SpotifyDevice) => {
    try {
      await api.selectSpotifyDevice(device.id, device.name, accessToken!);
      toast({
        title: 'Dispositivo selecionado',
        description: `${device.name} selecionado como dispositivo de reproducao`,
      });
      loadConfig();
    } catch (error) {
      console.error('Error selecting device:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao selecionar dispositivo',
        variant: 'destructive',
      });
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      await api.updateJukeboxConfig(
        {
          pointsPerSong,
          maxSongsPerUser,
          maxDurationMs: maxDurationMinutes * 60000,
          isActive,
        },
        accessToken!
      );
      toast({
        title: 'Configuracoes salvas',
        description: 'As configuracoes do Jukebox foram atualizadas',
      });
      loadConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configuracoes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'computer':
        return <Monitor className="h-5 w-5" />;
      case 'smartphone':
        return <Smartphone className="h-5 w-5" />;
      case 'speaker':
        return <Speaker className="h-5 w-5" />;
      case 'tv':
        return <Tv className="h-5 w-5" />;
      default:
        return <Speaker className="h-5 w-5" />;
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <p className="text-lg font-medium">Acesso Restrito</p>
            <p className="text-muted-foreground mt-2">
              Apenas administradores podem acessar esta pagina.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Music2 className="h-8 w-8 text-green-500" />
        <div>
          <h1 className="text-2xl font-bold">Integracao Spotify</h1>
          <p className="text-muted-foreground">Gerencie a conexao do Jukebox com Spotify</p>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {config?.isConnected ? (
              <>
                <Wifi className="h-5 w-5 text-green-500" />
                Conectado
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-muted-foreground" />
                Desconectado
              </>
            )}
          </CardTitle>
          <CardDescription>
            {config?.isConnected
              ? `Conectado como ${config.spotifyUserId}`
              : 'Conecte uma conta Spotify Premium para usar o Jukebox'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {config?.isConnected ? (
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Spotify Premium
              </Badge>
              <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                Desconectar
              </Button>
            </div>
          ) : (
            <Button onClick={handleConnect} disabled={connecting} className="bg-green-600 hover:bg-green-700">
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Music2 className="h-4 w-4 mr-2" />
              )}
              Conectar com Spotify
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Devices */}
      {config?.isConnected && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dispositivos Disponiveis</CardTitle>
                <CardDescription>
                  Selecione o dispositivo onde as musicas serao reproduzidas
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadDevices} disabled={loadingDevices}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingDevices ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingDevices ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Speaker className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum dispositivo encontrado</p>
                <p className="text-sm mt-2">
                  Abra o Spotify em um dispositivo e toque algo para ele aparecer aqui
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      config.selectedDeviceId === device.id
                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(device.type)}
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{device.type}</p>
                      </div>
                      {device.is_active && (
                        <Badge variant="secondary" className="ml-2">
                          Ativo
                        </Badge>
                      )}
                    </div>
                    {config.selectedDeviceId === device.id ? (
                      <Badge className="bg-green-600">Selecionado</Badge>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleSelectDevice(device)}>
                        Selecionar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Settings */}
      {config?.isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuracoes do Jukebox
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Jukebox Ativo</Label>
                <p className="text-sm text-muted-foreground">
                  Ative para permitir que usuarios adicionem musicas
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="pointsPerSong">Pontos por musica</Label>
                <Input
                  id="pointsPerSong"
                  type="number"
                  min={1}
                  max={100}
                  value={pointsPerSong}
                  onChange={(e) => setPointsPerSong(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxSongsPerUser">Max. musicas por usuario</Label>
                <Input
                  id="maxSongsPerUser"
                  type="number"
                  min={1}
                  max={10}
                  value={maxSongsPerUser}
                  onChange={(e) => setMaxSongsPerUser(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDuration">Duracao maxima (min)</Label>
                <Input
                  id="maxDuration"
                  type="number"
                  min={1}
                  max={10}
                  value={maxDurationMinutes}
                  onChange={(e) => setMaxDurationMinutes(parseInt(e.target.value) || 7)}
                />
              </div>
            </div>

            <Button onClick={handleSaveConfig} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar Configuracoes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
