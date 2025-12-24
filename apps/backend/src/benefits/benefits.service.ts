import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBenefitDto } from './dto/create-benefit.dto';
import { UpdateBenefitDto } from './dto/update-benefit.dto';
import { BenefitType } from '@prisma/client';

@Injectable()
export class BenefitsService {
  constructor(private prisma: PrismaService) {}

  async create(createBenefitDto: CreateBenefitDto) {
    return this.prisma.benefit.create({
      data: createBenefitDto,
    });
  }

  async findAll(type?: BenefitType) {
    return this.prisma.benefit.findMany({
      where: type ? { type } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const benefit = await this.prisma.benefit.findUnique({
      where: { id },
    });

    if (!benefit) {
      throw new NotFoundException('Benefit not found');
    }

    return benefit;
  }

  async update(id: string, updateBenefitDto: UpdateBenefitDto) {
    await this.findOne(id);

    return this.prisma.benefit.update({
      where: { id },
      data: updateBenefitDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.benefit.delete({
      where: { id },
    });
  }
}
