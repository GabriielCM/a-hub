import { Test, TestingModule } from '@nestjs/testing';
import { MemberCardsController } from './member-cards.controller';
import { MemberCardsService } from './member-cards.service';

describe('MemberCardsController', () => {
  let controller: MemberCardsController;
  let memberCardsService: jest.Mocked<MemberCardsService>;

  const createMockMemberCard = (overrides = {}) => ({
    id: 'card-1',
    userId: 'user-1',
    matricula: '12345',
    photo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'user-1', name: 'Test User', email: 'test@test.com' },
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MemberCardsController],
      providers: [
        {
          provide: MemberCardsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findByUserId: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MemberCardsController>(MemberCardsController);
    memberCardsService = module.get(MemberCardsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /member-cards', () => {
    it('should create a new member card', async () => {
      const createDto = { userId: 'user-1', matricula: '12345' };
      const mockCard = createMockMemberCard(createDto);
      memberCardsService.create.mockResolvedValue(mockCard);

      const result = await controller.create(createDto);

      expect(memberCardsService.create).toHaveBeenCalledWith(createDto);
      expect(result.matricula).toBe('12345');
    });
  });

  describe('GET /member-cards', () => {
    it('should return all member cards', async () => {
      const mockCards = [createMockMemberCard(), createMockMemberCard({ id: 'card-2' })];
      memberCardsService.findAll.mockResolvedValue(mockCards);

      const result = await controller.findAll();

      expect(memberCardsService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('GET /member-cards/my', () => {
    it('should return current user member card', async () => {
      const mockCard = createMockMemberCard({ userId: 'user-1' });
      memberCardsService.findByUserId.mockResolvedValue(mockCard);

      const result = await controller.findMy('user-1');

      expect(memberCardsService.findByUserId).toHaveBeenCalledWith('user-1');
      expect(result.userId).toBe('user-1');
    });
  });

  describe('GET /member-cards/:id', () => {
    it('should return a member card by id', async () => {
      const mockCard = createMockMemberCard({ id: 'card-1' });
      memberCardsService.findOne.mockResolvedValue(mockCard);

      const result = await controller.findOne('card-1');

      expect(memberCardsService.findOne).toHaveBeenCalledWith('card-1');
      expect(result.id).toBe('card-1');
    });
  });

  describe('PATCH /member-cards/:id', () => {
    it('should update a member card', async () => {
      const updateDto = { matricula: '99999' };
      const mockCard = createMockMemberCard({ id: 'card-1', matricula: '99999' });
      memberCardsService.update.mockResolvedValue(mockCard);

      const result = await controller.update('card-1', updateDto);

      expect(memberCardsService.update).toHaveBeenCalledWith('card-1', updateDto);
      expect(result.matricula).toBe('99999');
    });
  });

  describe('DELETE /member-cards/:id', () => {
    it('should delete a member card', async () => {
      const mockCard = createMockMemberCard({ id: 'card-1' });
      memberCardsService.remove.mockResolvedValue(mockCard);

      const result = await controller.remove('card-1');

      expect(memberCardsService.remove).toHaveBeenCalledWith('card-1');
      expect(result.id).toBe('card-1');
    });
  });
});
