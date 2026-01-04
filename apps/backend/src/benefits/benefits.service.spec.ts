import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BenefitType } from '@prisma/client';
import { BenefitsService } from './benefits.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BenefitsService', () => {
  let service: BenefitsService;
  let prisma: jest.Mocked<PrismaService>;

  const createMockBenefit = (overrides = {}) => ({
    id: 'benefit-1',
    name: 'Test Benefit',
    description: 'A test benefit',
    type: BenefitType.DISCOUNT,
    discountPercentage: 10,
    partnerName: null,
    partnerLogo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BenefitsService,
        {
          provide: PrismaService,
          useValue: {
            benefit: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BenefitsService>(BenefitsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a benefit', async () => {
      const createDto = {
        name: 'New Benefit',
        description: 'A new benefit',
        type: BenefitType.DISCOUNT,
        discountPercentage: 15,
      };
      const mockBenefit = createMockBenefit(createDto);

      prisma.benefit.create.mockResolvedValue(mockBenefit);

      const result = await service.create(createDto);

      expect(prisma.benefit.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(result.name).toBe('New Benefit');
    });
  });

  describe('findAll', () => {
    it('should return all benefits ordered by name', async () => {
      const mockBenefits = [
        createMockBenefit({ name: 'Alpha Benefit' }),
        createMockBenefit({ name: 'Beta Benefit' }),
      ];

      prisma.benefit.findMany.mockResolvedValue(mockBenefits);

      const result = await service.findAll();

      expect(prisma.benefit.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should filter by type when provided', async () => {
      const mockBenefits = [
        createMockBenefit({ type: BenefitType.DISCOUNT }),
      ];

      prisma.benefit.findMany.mockResolvedValue(mockBenefits);

      const result = await service.findAll(BenefitType.DISCOUNT);

      expect(prisma.benefit.findMany).toHaveBeenCalledWith({
        where: { type: BenefitType.DISCOUNT },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a benefit by id', async () => {
      const mockBenefit = createMockBenefit();

      prisma.benefit.findUnique.mockResolvedValue(mockBenefit);

      const result = await service.findOne(mockBenefit.id);

      expect(prisma.benefit.findUnique).toHaveBeenCalledWith({
        where: { id: mockBenefit.id },
      });
      expect(result.id).toBe(mockBenefit.id);
    });

    it('should throw NotFoundException if benefit not found', async () => {
      prisma.benefit.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Benefit not found',
      );
    });
  });

  describe('update', () => {
    it('should update a benefit', async () => {
      const mockBenefit = createMockBenefit();
      const updateDto = { name: 'Updated Benefit', discountPercentage: 20 };

      prisma.benefit.findUnique.mockResolvedValue(mockBenefit);
      prisma.benefit.update.mockResolvedValue({
        ...mockBenefit,
        ...updateDto,
      });

      const result = await service.update(mockBenefit.id, updateDto);

      expect(prisma.benefit.update).toHaveBeenCalledWith({
        where: { id: mockBenefit.id },
        data: updateDto,
      });
      expect(result.name).toBe('Updated Benefit');
      expect(result.discountPercentage).toBe(20);
    });

    it('should throw NotFoundException if benefit not found', async () => {
      prisma.benefit.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a benefit', async () => {
      const mockBenefit = createMockBenefit();

      prisma.benefit.findUnique.mockResolvedValue(mockBenefit);
      prisma.benefit.delete.mockResolvedValue(mockBenefit);

      const result = await service.remove(mockBenefit.id);

      expect(prisma.benefit.delete).toHaveBeenCalledWith({
        where: { id: mockBenefit.id },
      });
      expect(result.id).toBe(mockBenefit.id);
    });

    it('should throw NotFoundException if benefit not found', async () => {
      prisma.benefit.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
