import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JukeboxService } from './jukebox.service';
import { SpotifyService } from './spotify.service';
import { UpdateConfigDto, SelectDeviceDto } from './dto';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Controller('jukebox/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class JukeboxAdminController {
  constructor(
    private readonly jukeboxService: JukeboxService,
    private readonly spotifyService: SpotifyService,
    private readonly configService: ConfigService,
  ) {}

  @Get('auth-url')
  getAuthUrl() {
    const state = crypto.randomUUID();
    const url = this.spotifyService.getAuthorizationUrl(state);
    return { url, state };
  }

  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://localhost:3000';

    if (error) {
      return res.redirect(`${frontendUrl}/admin/integracoes/spotify?error=spotify_denied`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}/admin/integracoes/spotify?error=no_code`);
    }

    try {
      const tokens = await this.spotifyService.exchangeCodeForTokens(code);
      const profile = await this.spotifyService.getUserProfile(tokens.access_token);

      // Verify user has Spotify Premium
      if (profile.product !== 'premium') {
        return res.redirect(
          `${frontendUrl}/admin/integracoes/spotify?error=premium_required`,
        );
      }

      await this.spotifyService.saveTokens(tokens, profile.id);

      return res.redirect(`${frontendUrl}/admin/integracoes/spotify?success=connected`);
    } catch (err) {
      console.error('Spotify callback error:', err);
      return res.redirect(`${frontendUrl}/admin/integracoes/spotify?error=auth_failed`);
    }
  }

  @Get('config')
  async getConfig() {
    const config = await this.jukeboxService.getConfig();
    // Don't expose tokens
    return {
      id: config.id,
      isConnected: !!config.spotifyAccessToken,
      spotifyUserId: config.spotifyUserId,
      selectedDeviceId: config.selectedDeviceId,
      selectedDeviceName: config.selectedDeviceName,
      pointsPerSong: config.pointsPerSong,
      maxSongsPerUser: config.maxSongsPerUser,
      maxDurationMs: config.maxDurationMs,
      isActive: config.isActive,
    };
  }

  @Patch('config')
  updateConfig(@Body() dto: UpdateConfigDto) {
    return this.jukeboxService.updateConfig(dto);
  }

  @Get('devices')
  getDevices() {
    return this.spotifyService.getDevices();
  }

  @Patch('device')
  selectDevice(@Body() dto: SelectDeviceDto) {
    return this.jukeboxService.selectDevice(dto);
  }

  @Delete('disconnect')
  async disconnect() {
    await this.spotifyService.disconnectSpotify();
    return { message: 'Spotify disconnected successfully' };
  }

  @Post('skip')
  async skipTrack() {
    await this.jukeboxService.skipTrack();
    await this.jukeboxService.playNextInQueue();
    return { message: 'Track skipped' };
  }

  @Delete('queue/:id')
  async removeFromQueue(@Param('id') id: string) {
    await this.jukeboxService.removeFromQueue(id);
    return { message: 'Track removed from queue' };
  }
}
