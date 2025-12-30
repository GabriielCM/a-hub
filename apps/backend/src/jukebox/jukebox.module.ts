import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PointsModule } from '../points/points.module';
import { JukeboxController } from './jukebox.controller';
import { JukeboxAdminController } from './jukebox-admin.controller';
import { JukeboxService } from './jukebox.service';
import { SpotifyService } from './spotify.service';
import { SpotifyCryptoService } from './spotify-crypto.service';
import { PlaybackMonitorService } from './playback-monitor.service';

@Module({
  imports: [ConfigModule, PrismaModule, PointsModule],
  controllers: [JukeboxController, JukeboxAdminController],
  providers: [
    JukeboxService,
    SpotifyService,
    SpotifyCryptoService,
    PlaybackMonitorService,
  ],
  exports: [JukeboxService],
})
export class JukeboxModule {}
