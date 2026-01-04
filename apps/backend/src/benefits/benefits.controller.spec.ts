import { Test, TestingModule } from '@nestjs/testing';
import { BenefitType } from '@prisma/client';
import { BenefitsController } from './benefits.controller';
import { BenefitsService } from './benefits.service';

describe('BenefitsController', () => {
  let controller: BenefitsController;
  let benefitsService: jest.Mocked<BenefitsService>;

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
      controllers: [BenefitsController],
      providers: [
        {
          provide: BenefitsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BenefitsController>(BenefitsController);
    benefitsService = module.get(BenefitsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /benefits', () => {
    it('should create a new benefit', async () => {
      const createDto = {
        name: 'New Benefit',
        description: 'A new benefit',
        type: BenefitType.DISCOUNT,
        discountPercentage: 15,
      };
      const mockBenefit = createMockBenefit(createDto);
      benefitsService.create.mockResolvedValue(mockBenefit);

      const result = await controller.create(createDto);

      expect(benefitsService.create).toHaveBeenCalledWith(createDto);
      expect(result.name).toBe('New Benefit');
    });
  });

  describe('GET /benefits', () => {
    it('should return all benefits', async () => {
      const mockBenefits = [createMockBenefit(), createMockBenefit({ id: 'benefit-2' })];
      benefitsService.findAll.mockResolvedValue(mockBenefits);

      const result = await controller.findAll();

      expect(benefitsService.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(2);
    });

    it('should return benefits filtered by type', async () => {
      const mockBenefits = [createMockBenefit({ type: BenefitType.DISCOUNT })];
      benefitsService.findAll.mockResolvedValue(mockBenefits);

      const result = await controller.findAll(BenefitType.DISCOUNT);

      expect(benefitsService.findAll).toHaveBeenCalledWith(BenefitType.DISCOUNT);
      expect(result).toHaveLength(1);
    });
  });

  describe('GET /benefits/:id', () => {
    it('should return a benefit by id', async () => {
      const mockBenefit = createMockBenefit({ id: 'benefit-1' });
      benefitsService.findOne.mockResolvedValue(mockBenefit);

      const result = await controller.findOne('benefit-1');

      expect(benefitsService.findOne).toHaveBeenCalledWith('benefit-1');
      expect(result.id).toBe('benefit-1');
    });
  });

  describe('PATCH /benefits/:id', () => {
    it('should update a benefit', async () => {
      const updateDto = { name: 'Updated Benefit', discountPercentage: 20 };
      const mockBenefit = createMockBenefit({ id: 'benefit-1', ...updateDto });
      benefitsService.update.mockResolvedValue(mockBenefit);

      const result = await controller.update('benefit-1', updateDto);

      expect(benefitsService.update).toHaveBeenCalledWith('benefit-1', updateDto);
      expect(result.name).toBe('Updated Benefit');
    });
  });

  describe('DELETE /benefits/:id', () => {
    it('should delete a benefit', async () => {
      const mockBenefit = createMockBenefit({ id: 'benefit-1' });
      benefitsService.remove.mockResolvedValue(mockBenefit);

      const result = await controller.remove('benefit-1');

      expect(benefitsService.remove).toHaveBeenCalledWith('benefit-1');
      expect(result.id).toBe('benefit-1');
    });
  });
});
