import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JukeboxService } from './jukebox.service';
import { SearchTracksDto, QueueTrackDto } from './dto';

@Controller('jukebox')
export class JukeboxController {
  constructor(private readonly jukeboxService: JukeboxService) {}

  @Get('search')
  @UseGuards(JwtAuthGuard)
  searchTracks(@Query() dto: SearchTracksDto) {
    return this.jukeboxService.searchTracks(dto.q, dto.limit);
  }

  @Post('queue')
  @UseGuards(JwtAuthGuard)
  queueTrack(@CurrentUser('sub') userId: string, @Body() dto: QueueTrackDto) {
    return this.jukeboxService.queueTrack(userId, dto);
  }

  @Get('queue')
  @UseGuards(JwtAuthGuard)
  getQueue() {
    return this.jukeboxService.getQueue();
  }

  @Get('now-playing')
  @UseGuards(JwtAuthGuard)
  getNowPlaying() {
    return this.jukeboxService.getNowPlaying();
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  getHistory(@Query('limit') limit?: string) {
    return this.jukeboxService.getHistory(limit ? parseInt(limit, 10) : 10);
  }

  @Get('my-requests')
  @UseGuards(JwtAuthGuard)
  getMyRequests(@CurrentUser('sub') userId: string) {
    return this.jukeboxService.getUserRequests(userId);
  }

  @Get('display')
  getDisplayData() {
    return this.jukeboxService.getDisplayData();
  }
}
