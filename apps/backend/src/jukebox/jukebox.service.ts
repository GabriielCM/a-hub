import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SpotifyService, SpotifyTrack } from './spotify.service';
import { PointsService } from '../points/points.service';
import { QueueTrackDto, UpdateConfigDto, SelectDeviceDto } from './dto';
import { JukeboxQueueStatus, PointsTransactionType } from '@prisma/client';

export interface TrackSearchResult {
  id: string;
  name: string;
  artistName: string;
  durationMs: number;
  albumImage: string | null;
}

export interface QueueItemWithUser {
  id: string;
  trackId: string;
  trackName: string;
  artistName: string;
  durationMs: number;
  albumImage: string | null;
  status: JukeboxQueueStatus;
  pointsCost: number;
  position: number;
  startedAt: Date | null;
  playedAt: Date | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
  };
}

export interface DisplayData {
  isActive: boolean;
  nowPlaying: QueueItemWithUser | null;
  queue: QueueItemWithUser[];
  history: QueueItemWithUser[];
  playbackProgress: number | null;
}

@Injectable()
export class JukeboxService {
  private readonly logger = new Logger(JukeboxService.name);

  constructor(
    private prisma: PrismaService,
    private spotifyService: SpotifyService,
    private pointsService: PointsService,
  ) {}

  async getConfig() {
    return this.spotifyService.getOrCreateConfig();
  }

  async updateConfig(dto: UpdateConfigDto) {
    const config = await this.getConfig();
    return this.prisma.jukeboxConfig.update({
      where: { id: config.id },
      data: dto,
    });
  }

  async selectDevice(dto: SelectDeviceDto) {
    const config = await this.getConfig();
    return this.prisma.jukeboxConfig.update({
      where: { id: config.id },
      data: {
        selectedDeviceId: dto.deviceId,
        selectedDeviceName: dto.deviceName || null,
      },
    });
  }

  async searchTracks(query: string, limit: number = 5): Promise<TrackSearchResult[]> {
    const config = await this.getConfig();

    if (!config.spotifyAccessToken) {
      throw new BadRequestException('Spotify not connected');
    }

    const tracks = await this.spotifyService.searchTracks(query, limit);

    // Filter out podcasts and tracks longer than max duration
    return tracks
      .filter((track) => track.duration_ms <= config.maxDurationMs)
      .map((track) => ({
        id: track.id,
        name: track.name,
        artistName: track.artists.map((a) => a.name).join(', '),
        durationMs: track.duration_ms,
        albumImage: track.album.images[0]?.url || null,
      }));
  }

  async queueTrack(userId: string, dto: QueueTrackDto): Promise<QueueItemWithUser> {
    const config = await this.getConfig();

    // Validate jukebox is active
    if (!config.isActive) {
      throw new BadRequestException('Jukebox is not active');
    }

    // Validate duration
    if (dto.durationMs > config.maxDurationMs) {
      throw new BadRequestException(
        `Track is too long. Maximum duration is ${Math.floor(config.maxDurationMs / 60000)} minutes`,
      );
    }

    // Check if track is already in queue or playing
    const existingTrack = await this.prisma.jukeboxQueue.findFirst({
      where: {
        trackId: dto.trackId,
        status: { in: ['PENDING', 'PLAYING'] },
      },
    });

    if (existingTrack) {
      throw new ConflictException('This track is already in the queue');
    }

    // Check user's songs in queue
    const userSongsInQueue = await this.prisma.jukeboxQueue.count({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    if (userSongsInQueue >= config.maxSongsPerUser) {
      throw new BadRequestException(
        `You can only have ${config.maxSongsPerUser} songs in the queue at a time`,
      );
    }

    // Get user's balance
    const userBalance = await this.pointsService.getBalance(userId);

    if (userBalance.balance < config.pointsPerSong) {
      throw new BadRequestException(
        `Insufficient points. You need ${config.pointsPerSong} points, but have ${userBalance.balance}`,
      );
    }

    // Get next position
    const lastItem = await this.prisma.jukeboxQueue.findFirst({
      where: { status: { in: ['PENDING', 'PLAYING'] } },
      orderBy: { position: 'desc' },
    });
    const nextPosition = (lastItem?.position || 0) + 1;

    // Transaction: debit points and add to queue
    const result = await this.prisma.$transaction(async (tx) => {
      // Debit points
      await tx.pointsBalance.update({
        where: { userId },
        data: { balance: { decrement: config.pointsPerSong } },
      });

      // Create transaction record
      await tx.pointsTransaction.create({
        data: {
          pointsBalanceId: userBalance.id,
          type: PointsTransactionType.JUKEBOX_SONG,
          amount: -config.pointsPerSong,
          description: `Jukebox: ${dto.trackName} - ${dto.artistName}`,
        },
      });

      // Add to queue
      return tx.jukeboxQueue.create({
        data: {
          trackId: dto.trackId,
          trackName: dto.trackName,
          artistName: dto.artistName,
          durationMs: dto.durationMs,
          albumImage: dto.albumImage,
          userId,
          pointsCost: config.pointsPerSong,
          position: nextPosition,
        },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      });
    });

    return result;
  }

  async getQueue(): Promise<{ nowPlaying: QueueItemWithUser | null; queue: QueueItemWithUser[] }> {
    const [nowPlaying, queue] = await Promise.all([
      this.prisma.jukeboxQueue.findFirst({
        where: { status: 'PLAYING' },
        include: { user: { select: { id: true, name: true } } },
      }),
      this.prisma.jukeboxQueue.findMany({
        where: { status: 'PENDING' },
        orderBy: { position: 'asc' },
        include: { user: { select: { id: true, name: true } } },
      }),
    ]);

    return { nowPlaying, queue };
  }

  async getNowPlaying(): Promise<QueueItemWithUser | null> {
    return this.prisma.jukeboxQueue.findFirst({
      where: { status: 'PLAYING' },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async getHistory(limit: number = 10) {
    return this.prisma.jukeboxHistory.findMany({
      orderBy: { playedAt: 'desc' },
      take: limit,
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async getUserRequests(userId: string) {
    return this.prisma.jukeboxQueue.findMany({
      where: {
        userId,
        status: { in: ['PENDING', 'PLAYING'] },
      },
      orderBy: { position: 'asc' },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async getDisplayData(): Promise<DisplayData> {
    const config = await this.getConfig();

    const [nowPlaying, queue, history] = await Promise.all([
      this.prisma.jukeboxQueue.findFirst({
        where: { status: 'PLAYING' },
        include: { user: { select: { id: true, name: true } } },
      }),
      this.prisma.jukeboxQueue.findMany({
        where: { status: 'PENDING' },
        orderBy: { position: 'asc' },
        take: 5,
        include: { user: { select: { id: true, name: true } } },
      }),
      this.prisma.jukeboxHistory.findMany({
        orderBy: { playedAt: 'desc' },
        take: 5,
        include: { user: { select: { id: true, name: true } } },
      }),
    ]);

    // Get playback progress if something is playing
    let playbackProgress: number | null = null;
    if (nowPlaying && config.isActive) {
      try {
        const playbackState = await this.spotifyService.getPlaybackState();
        if (playbackState?.item?.id === nowPlaying.trackId) {
          playbackProgress = playbackState.progress_ms;
        }
      } catch (error) {
        this.logger.error('Error getting playback progress:', error);
      }
    }

    return {
      isActive: config.isActive,
      nowPlaying,
      queue,
      history: history.map((h) => ({
        id: h.id,
        trackId: h.trackId,
        trackName: h.trackName,
        artistName: h.artistName,
        durationMs: 0,
        albumImage: h.albumImage,
        status: 'PLAYED' as JukeboxQueueStatus,
        pointsCost: h.pointsCost,
        position: 0,
        startedAt: null,
        playedAt: h.playedAt,
        createdAt: h.playedAt,
        user: h.user,
      })),
      playbackProgress,
    };
  }

  // Admin: Skip current track
  async skipTrack(): Promise<void> {
    const current = await this.prisma.jukeboxQueue.findFirst({
      where: { status: 'PLAYING' },
    });

    if (current) {
      await this.prisma.$transaction([
        this.prisma.jukeboxQueue.update({
          where: { id: current.id },
          data: { status: 'PLAYED', playedAt: new Date() },
        }),
        this.prisma.jukeboxHistory.create({
          data: {
            trackId: current.trackId,
            trackName: current.trackName,
            artistName: current.artistName,
            albumImage: current.albumImage,
            userId: current.userId,
            pointsCost: current.pointsCost,
          },
        }),
      ]);
    }
  }

  // Admin: Remove from queue
  async removeFromQueue(id: string): Promise<void> {
    const item = await this.prisma.jukeboxQueue.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Queue item not found');
    }

    if (item.status === 'PLAYING') {
      throw new BadRequestException('Cannot remove currently playing track. Use skip instead.');
    }

    if (item.status === 'PLAYED') {
      throw new BadRequestException('Cannot remove already played track.');
    }

    await this.prisma.jukeboxQueue.delete({ where: { id } });
  }

  // Called by PlaybackMonitorService
  async playNextInQueue(): Promise<void> {
    const config = await this.getConfig();

    if (!config.isActive || !config.selectedDeviceId) {
      this.logger.debug('Jukebox not active or no device selected');
      return;
    }

    const nextItem = await this.prisma.jukeboxQueue.findFirst({
      where: { status: 'PENDING' },
      orderBy: { position: 'asc' },
    });

    if (!nextItem) {
      this.logger.debug('Queue is empty');
      return;
    }

    try {
      await this.spotifyService.playTrack(nextItem.trackId, config.selectedDeviceId);

      await this.prisma.jukeboxQueue.update({
        where: { id: nextItem.id },
        data: {
          status: 'PLAYING',
          startedAt: new Date(),
        },
      });

      this.logger.log(`Now playing: ${nextItem.trackName} by ${nextItem.artistName}`);
    } catch (error) {
      this.logger.error(`Failed to play track: ${error.message}`);
    }
  }

  // Called by PlaybackMonitorService when track ends
  async markTrackAsPlayed(queueItemId: string): Promise<void> {
    const item = await this.prisma.jukeboxQueue.findUnique({
      where: { id: queueItemId },
    });

    if (!item) return;

    await this.prisma.$transaction([
      this.prisma.jukeboxQueue.update({
        where: { id: queueItemId },
        data: {
          status: 'PLAYED',
          playedAt: new Date(),
        },
      }),
      this.prisma.jukeboxHistory.create({
        data: {
          trackId: item.trackId,
          trackName: item.trackName,
          artistName: item.artistName,
          albumImage: item.albumImage,
          userId: item.userId,
          pointsCost: item.pointsCost,
        },
      }),
    ]);
  }
}
