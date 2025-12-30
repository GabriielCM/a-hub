import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SpotifyService } from './spotify.service';
import { JukeboxService } from './jukebox.service';

@Injectable()
export class PlaybackMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PlaybackMonitorService.name);
  private monitorInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 3000; // 3 seconds
  private lastPlayingTrackId: string | null = null;

  constructor(
    private prisma: PrismaService,
    private spotifyService: SpotifyService,
    private jukeboxService: JukeboxService,
  ) {}

  async onModuleInit() {
    this.startMonitoring();
  }

  onModuleDestroy() {
    this.stopMonitoring();
  }

  startMonitoring(): void {
    if (this.monitorInterval) return;

    this.logger.log('Starting Jukebox playback monitor');

    this.monitorInterval = setInterval(async () => {
      try {
        await this.checkPlaybackState();
      } catch (error) {
        // Don't log errors for unconnected Spotify
        if (!error.message?.includes('not connected')) {
          this.logger.error('Playback monitor error:', error.message);
        }
      }
    }, this.POLL_INTERVAL_MS);
  }

  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      this.logger.log('Stopped Jukebox playback monitor');
    }
  }

  private async checkPlaybackState(): Promise<void> {
    const config = await this.prisma.jukeboxConfig.findFirst();

    // Skip if not active or not connected
    if (!config?.isActive || !config?.spotifyAccessToken) {
      return;
    }

    // Get currently playing item from our queue
    const currentQueueItem = await this.prisma.jukeboxQueue.findFirst({
      where: { status: 'PLAYING' },
    });

    // Get playback state from Spotify
    const playbackState = await this.spotifyService.getPlaybackState();

    // Case 1: Nothing playing from our queue, but we have pending items
    if (!currentQueueItem) {
      const hasPendingItems = await this.prisma.jukeboxQueue.count({
        where: { status: 'PENDING' },
      });

      if (hasPendingItems > 0) {
        // Check if Spotify is idle or playing something else
        if (!playbackState || !playbackState.is_playing) {
          this.logger.log('Queue has pending items and Spotify is idle. Playing next...');
          await this.jukeboxService.playNextInQueue();
        }
      }
      return;
    }

    // Case 2: We have a playing item, check if it finished
    if (currentQueueItem) {
      const spotifyTrackId = playbackState?.item?.id;
      const isPlaying = playbackState?.is_playing;
      const progressMs = playbackState?.progress_ms || 0;

      // Track changed or finished
      if (spotifyTrackId !== currentQueueItem.trackId) {
        // Our track is no longer playing
        if (this.lastPlayingTrackId === currentQueueItem.trackId) {
          this.logger.log(`Track finished: ${currentQueueItem.trackName}`);
          await this.jukeboxService.markTrackAsPlayed(currentQueueItem.id);
          await this.jukeboxService.playNextInQueue();
        }
      }
      // Check if track is near the end and not playing (finished naturally)
      else if (
        spotifyTrackId === currentQueueItem.trackId &&
        !isPlaying &&
        progressMs >= currentQueueItem.durationMs - 3000
      ) {
        this.logger.log(`Track finished naturally: ${currentQueueItem.trackName}`);
        await this.jukeboxService.markTrackAsPlayed(currentQueueItem.id);
        await this.jukeboxService.playNextInQueue();
      }

      this.lastPlayingTrackId = spotifyTrackId || null;
    }
  }
}
