import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SpotifyCryptoService } from './spotify-crypto.service';

export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  explicit: boolean;
  uri: string;
}

export interface SpotifyPlaybackState {
  device: SpotifyDevice;
  shuffle_state: boolean;
  repeat_state: string;
  timestamp: number;
  progress_ms: number;
  is_playing: boolean;
  item: SpotifyTrack | null;
}

export interface SpotifyUserProfile {
  id: string;
  display_name: string;
  email: string;
  product: string;
}

const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
].join(' ');

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private cryptoService: SpotifyCryptoService,
  ) {
    this.clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET') || '';
    this.redirectUri = this.configService.get<string>('SPOTIFY_REDIRECT_URI') || '';
  }

  getAuthorizationUrl(state: string): string {
    if (!this.clientId) {
      throw new BadRequestException('Spotify client ID not configured');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: SPOTIFY_SCOPES,
      state: state,
      show_dialog: 'true',
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<SpotifyTokens> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to exchange code: ${error}`);
      throw new BadRequestException('Failed to exchange Spotify authorization code');
    }

    return response.json();
  }

  async getUserProfile(accessToken: string): Promise<SpotifyUserProfile> {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new BadRequestException('Failed to get Spotify user profile');
    }

    return response.json();
  }

  async getOrCreateConfig() {
    let config = await this.prisma.jukeboxConfig.findFirst();
    if (!config) {
      config = await this.prisma.jukeboxConfig.create({
        data: {},
      });
    }
    return config;
  }

  async saveTokens(tokens: SpotifyTokens, spotifyUserId: string): Promise<void> {
    const config = await this.getOrCreateConfig();

    await this.prisma.jukeboxConfig.update({
      where: { id: config.id },
      data: {
        spotifyAccessToken: this.cryptoService.encrypt(tokens.access_token),
        spotifyRefreshToken: this.cryptoService.encrypt(tokens.refresh_token),
        spotifyUserId: spotifyUserId,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });
  }

  async getValidAccessToken(): Promise<string> {
    const config = await this.prisma.jukeboxConfig.findFirst();

    if (!config?.spotifyAccessToken || !config?.spotifyRefreshToken) {
      throw new UnauthorizedException('Spotify not connected');
    }

    const now = new Date();
    const expiresAt = config.tokenExpiresAt;

    // Check if token needs refresh (with buffer)
    if (expiresAt && now.getTime() + this.REFRESH_BUFFER_MS >= expiresAt.getTime()) {
      await this.refreshAccessToken();
      const updatedConfig = await this.prisma.jukeboxConfig.findFirst();
      return this.cryptoService.decrypt(updatedConfig!.spotifyAccessToken!);
    }

    return this.cryptoService.decrypt(config.spotifyAccessToken);
  }

  async refreshAccessToken(): Promise<void> {
    const config = await this.prisma.jukeboxConfig.findFirst();

    if (!config?.spotifyRefreshToken) {
      throw new UnauthorizedException('No refresh token available');
    }

    const refreshToken = this.cryptoService.decrypt(config.spotifyRefreshToken);

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      this.logger.error('Failed to refresh Spotify token');
      await this.prisma.jukeboxConfig.update({
        where: { id: config.id },
        data: { isActive: false },
      });
      throw new UnauthorizedException('Spotify session expired. Admin must reconnect.');
    }

    const data = await response.json();

    await this.prisma.jukeboxConfig.update({
      where: { id: config.id },
      data: {
        spotifyAccessToken: this.cryptoService.encrypt(data.access_token),
        tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
        ...(data.refresh_token && {
          spotifyRefreshToken: this.cryptoService.encrypt(data.refresh_token),
        }),
      },
    });
  }

  async getDevices(): Promise<SpotifyDevice[]> {
    const accessToken = await this.getValidAccessToken();

    const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new BadRequestException('Failed to get Spotify devices');
    }

    const data = await response.json();
    return data.devices;
  }

  async searchTracks(query: string, limit: number = 5): Promise<SpotifyTrack[]> {
    const accessToken = await this.getValidAccessToken();

    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: limit.toString(),
      market: 'BR',
    });

    const response = await fetch(`https://api.spotify.com/v1/search?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new BadRequestException('Failed to search Spotify tracks');
    }

    const data = await response.json();
    return data.tracks.items;
  }

  async getPlaybackState(): Promise<SpotifyPlaybackState | null> {
    try {
      const accessToken = await this.getValidAccessToken();

      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 204) {
        return null;
      }

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      this.logger.error('Error getting playback state:', error);
      return null;
    }
  }

  async getCurrentlyPlaying(): Promise<SpotifyTrack | null> {
    try {
      const accessToken = await this.getValidAccessToken();

      const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 204) {
        return null;
      }

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.item;
    } catch (error) {
      this.logger.error('Error getting currently playing:', error);
      return null;
    }
  }

  async playTrack(trackId: string, deviceId: string): Promise<void> {
    const accessToken = await this.getValidAccessToken();
    const trackUri = `spotify:track:${trackId}`;

    const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: [trackUri],
      }),
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.text();
      this.logger.error(`Failed to play track: ${error}`);
      throw new BadRequestException('Failed to play track on Spotify');
    }
  }

  async transferPlayback(deviceId: string): Promise<void> {
    const accessToken = await this.getValidAccessToken();

    const response = await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_ids: [deviceId],
        play: false,
      }),
    });

    if (!response.ok && response.status !== 204) {
      throw new BadRequestException('Failed to transfer playback');
    }
  }

  async disconnectSpotify(): Promise<void> {
    const config = await this.prisma.jukeboxConfig.findFirst();
    if (config) {
      await this.prisma.jukeboxConfig.update({
        where: { id: config.id },
        data: {
          spotifyAccessToken: null,
          spotifyRefreshToken: null,
          spotifyUserId: null,
          tokenExpiresAt: null,
          selectedDeviceId: null,
          selectedDeviceName: null,
          isActive: false,
        },
      });
    }
  }
}
