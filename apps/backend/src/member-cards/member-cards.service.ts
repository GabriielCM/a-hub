import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberCardDto } from './dto/create-member-card.dto';
import { UpdateMemberCardDto } from './dto/update-member-card.dto';
import { Role } from '@prisma/client';

@Injectable()
export class MemberCardsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Select fields for user data (excludes sensitive fields)
   */
  private readonly userSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    createdAt: true,
    updatedAt: true,
  };

  /**
   * Creates a new member card for a user
   * @throws ConflictException if user already has a card or matricula is taken
   * @throws NotFoundException if user does not exist
   * @throws BadRequestException if user role is DISPLAY
   */
  async create(createMemberCardDto: CreateMemberCardDto) {
    const { userId, matricula, photo } = createMemberCardDto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user role is allowed (not DISPLAY)
    if (user.role === Role.DISPLAY) {
      throw new BadRequestException(
        'Users with DISPLAY role cannot have a member card',
      );
    }

    // Check if user already has a card
    const existingCard = await this.prisma.memberCard.findUnique({
      where: { userId },
    });

    if (existingCard) {
      throw new ConflictException('User already has a member card');
    }

    // Check if matricula is unique
    const existingMatricula = await this.prisma.memberCard.findUnique({
      where: { matricula },
    });

    if (existingMatricula) {
      throw new ConflictException('Matricula already exists');
    }

    return this.prisma.memberCard.create({
      data: {
        userId,
        matricula,
        photo,
      },
      include: {
        user: {
          select: this.userSelect,
        },
      },
    });
  }

  /**
   * Returns all member cards with user data
   */
  async findAll() {
    return this.prisma.memberCard.findMany({
      include: {
        user: {
          select: this.userSelect,
        },
      },
      orderBy: {
        matricula: 'asc',
      },
    });
  }

  /**
   * Returns a single member card by ID
   * @throws NotFoundException if card does not exist
   */
  async findOne(id: string) {
    const card = await this.prisma.memberCard.findUnique({
      where: { id },
      include: {
        user: {
          select: this.userSelect,
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Member card not found');
    }

    return card;
  }

  /**
   * Returns a member card by user ID
   * @throws NotFoundException if card does not exist
   */
  async findByUserId(userId: string) {
    const card = await this.prisma.memberCard.findUnique({
      where: { userId },
      include: {
        user: {
          select: this.userSelect,
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Member card not found for this user');
    }

    return card;
  }

  /**
   * Updates a member card
   * @throws NotFoundException if card does not exist
   * @throws ConflictException if new matricula is already taken
   */
  async update(id: string, updateMemberCardDto: UpdateMemberCardDto) {
    // Check if card exists
    await this.findOne(id);

    const { matricula, photo } = updateMemberCardDto;

    // If matricula is being updated, check uniqueness
    if (matricula !== undefined) {
      const existingMatricula = await this.prisma.memberCard.findFirst({
        where: {
          matricula,
          NOT: { id },
        },
      });

      if (existingMatricula) {
        throw new ConflictException('Matricula already exists');
      }
    }

    return this.prisma.memberCard.update({
      where: { id },
      data: {
        ...(matricula !== undefined && { matricula }),
        ...(photo !== undefined && { photo }),
      },
      include: {
        user: {
          select: this.userSelect,
        },
      },
    });
  }

  /**
   * Deletes a member card
   * @throws NotFoundException if card does not exist
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.memberCard.delete({
      where: { id },
    });
  }
}
