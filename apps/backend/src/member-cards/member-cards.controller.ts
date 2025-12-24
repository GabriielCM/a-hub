import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MemberCardsService } from './member-cards.service';
import { CreateMemberCardDto } from './dto/create-member-card.dto';
import { UpdateMemberCardDto } from './dto/update-member-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('member-cards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MemberCardsController {
  constructor(private readonly memberCardsService: MemberCardsService) {}

  /**
   * Create a new member card (Admin only)
   */
  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createMemberCardDto: CreateMemberCardDto) {
    return this.memberCardsService.create(createMemberCardDto);
  }

  /**
   * List all member cards (Admin only)
   */
  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.memberCardsService.findAll();
  }

  /**
   * Get current user's member card
   */
  @Get('my')
  findMy(@CurrentUser('sub') userId: string) {
    return this.memberCardsService.findByUserId(userId);
  }

  /**
   * Get a member card by ID (Admin only)
   */
  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.memberCardsService.findOne(id);
  }

  /**
   * Update a member card (Admin only)
   */
  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateMemberCardDto: UpdateMemberCardDto,
  ) {
    return this.memberCardsService.update(id, updateMemberCardDto);
  }

  /**
   * Delete a member card (Admin only)
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.memberCardsService.remove(id);
  }
}
