import { Test, TestingModule } from '@nestjs/testing';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';
import { createMockSpace } from '../../test/factories';

describe('SpacesController', () => {
  let controller: SpacesController;
  let spacesService: jest.Mocked<SpacesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpacesController],
      providers: [
        {
          provide: SpacesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getAvailability: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SpacesController>(SpacesController);
    spacesService = module.get(SpacesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /spaces', () => {
    it('should create a new space', async () => {
      const createDto = { name: 'New Space', value: 500 };
      const mockSpace = createMockSpace(createDto);
      spacesService.create.mockResolvedValue(mockSpace);

      const result = await controller.create(createDto);

      expect(spacesService.create).toHaveBeenCalledWith(createDto);
      expect(result.name).toBe('New Space');
    });
  });

  describe('GET /spaces', () => {
    it('should return all spaces', async () => {
      const mockSpaces = [createMockSpace(), createMockSpace()];
      spacesService.findAll.mockResolvedValue(mockSpaces);

      const result = await controller.findAll();

      expect(spacesService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('GET /spaces/:id', () => {
    it('should return a space by id', async () => {
      const mockSpace = { ...createMockSpace({ id: 'space-1' }), bookings: [] };
      spacesService.findById.mockResolvedValue(mockSpace);

      const result = await controller.findOne('space-1');

      expect(spacesService.findById).toHaveBeenCalledWith('space-1');
      expect(result.id).toBe('space-1');
    });
  });

  describe('GET /spaces/:id/availability', () => {
    it('should return availability with provided month and year', async () => {
      const mockAvailability = {
        spaceId: 'space-1',
        month: 6,
        year: 2024,
        bookedDates: [],
      };
      spacesService.getAvailability.mockResolvedValue(mockAvailability);

      const result = await controller.getAvailability('space-1', '6', '2024');

      expect(spacesService.getAvailability).toHaveBeenCalledWith('space-1', 6, 2024);
      expect(result.month).toBe(6);
      expect(result.year).toBe(2024);
    });

    it('should use current month and year when not provided', async () => {
      const currentDate = new Date();
      const expectedMonth = currentDate.getMonth() + 1;
      const expectedYear = currentDate.getFullYear();

      const mockAvailability = {
        spaceId: 'space-1',
        month: expectedMonth,
        year: expectedYear,
        bookedDates: [],
      };
      spacesService.getAvailability.mockResolvedValue(mockAvailability);

      await controller.getAvailability('space-1', '', '');

      expect(spacesService.getAvailability).toHaveBeenCalledWith(
        'space-1',
        expectedMonth,
        expectedYear,
      );
    });
  });

  describe('PATCH /spaces/:id', () => {
    it('should update a space', async () => {
      const updateDto = { value: 600 };
      const mockSpace = createMockSpace({ id: 'space-1', value: 600 });
      spacesService.update.mockResolvedValue(mockSpace);

      const result = await controller.update('space-1', updateDto);

      expect(spacesService.update).toHaveBeenCalledWith('space-1', updateDto);
      expect(result.value).toBe(600);
    });
  });

  describe('DELETE /spaces/:id', () => {
    it('should delete a space', async () => {
      const mockSpace = createMockSpace({ id: 'space-1' });
      spacesService.remove.mockResolvedValue(mockSpace);

      const result = await controller.remove('space-1');

      expect(spacesService.remove).toHaveBeenCalledWith('space-1');
      expect(result.id).toBe('space-1');
    });
  });
});
