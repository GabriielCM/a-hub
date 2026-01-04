import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let notificationsService: jest.Mocked<NotificationsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: {
            getVapidPublicKey: jest.fn(),
            subscribe: jest.fn(),
            unsubscribe: jest.fn(),
            unsubscribeAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    notificationsService = module.get(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /notifications/vapid-public-key', () => {
    it('should return VAPID public key', () => {
      notificationsService.getVapidPublicKey.mockReturnValue('test-public-key');

      const result = controller.getVapidPublicKey();

      expect(notificationsService.getVapidPublicKey).toHaveBeenCalled();
      expect(result.publicKey).toBe('test-public-key');
    });
  });

  describe('POST /notifications/subscribe', () => {
    it('should subscribe to push notifications', async () => {
      const dto = {
        endpoint: 'https://push.example.com/123',
        p256dh: 'p256dh-key',
        auth: 'auth-key',
      };
      const mockSubscription = {
        id: 'sub-1',
        userId: 'user-1',
        ...dto,
        createdAt: new Date(),
      };

      notificationsService.subscribe.mockResolvedValue(mockSubscription);

      const result = await controller.subscribe('user-1', dto);

      expect(notificationsService.subscribe).toHaveBeenCalledWith('user-1', dto);
      expect(result.id).toBe('sub-1');
    });
  });

  describe('DELETE /notifications/unsubscribe', () => {
    it('should unsubscribe from push notifications', async () => {
      const dto = { endpoint: 'https://push.example.com/123' };
      notificationsService.unsubscribe.mockResolvedValue({ count: 1 });

      const result = await controller.unsubscribe('user-1', dto);

      expect(notificationsService.unsubscribe).toHaveBeenCalledWith('user-1', dto.endpoint);
      expect(result.count).toBe(1);
    });
  });

  describe('DELETE /notifications/unsubscribe-all', () => {
    it('should unsubscribe all devices', async () => {
      notificationsService.unsubscribeAll.mockResolvedValue({ count: 3 });

      const result = await controller.unsubscribeAll('user-1');

      expect(notificationsService.unsubscribeAll).toHaveBeenCalledWith('user-1');
      expect(result.count).toBe(3);
    });
  });
});
