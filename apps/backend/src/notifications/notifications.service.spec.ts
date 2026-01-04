import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock web-push module
jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

import * as webpush from 'web-push';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: {
            pushSubscription: {
              upsert: jest.fn(),
              deleteMany: jest.fn(),
              findMany: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                VAPID_PUBLIC_KEY: 'test-public-key',
                VAPID_PRIVATE_KEY: 'test-private-key',
                VAPID_SUBJECT: 'mailto:test@test.com',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get(PrismaService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getVapidPublicKey', () => {
    it('should return VAPID public key', () => {
      const result = service.getVapidPublicKey();
      expect(result).toBe('test-public-key');
    });
  });

  describe('subscribe', () => {
    it('should upsert push subscription', async () => {
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

      prisma.pushSubscription.upsert.mockResolvedValue(mockSubscription);

      const result = await service.subscribe('user-1', dto);

      expect(prisma.pushSubscription.upsert).toHaveBeenCalledWith({
        where: { endpoint: dto.endpoint },
        update: { userId: 'user-1', p256dh: dto.p256dh, auth: dto.auth },
        create: { userId: 'user-1', endpoint: dto.endpoint, p256dh: dto.p256dh, auth: dto.auth },
      });
      expect(result.id).toBe('sub-1');
    });
  });

  describe('unsubscribe', () => {
    it('should delete subscription by endpoint', async () => {
      prisma.pushSubscription.deleteMany.mockResolvedValue({ count: 1 });

      await service.unsubscribe('user-1', 'https://push.example.com/123');

      expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', endpoint: 'https://push.example.com/123' },
      });
    });
  });

  describe('unsubscribeAll', () => {
    it('should delete all subscriptions for user', async () => {
      prisma.pushSubscription.deleteMany.mockResolvedValue({ count: 3 });

      await service.unsubscribeAll('user-1');

      expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });

  describe('sendToUser', () => {
    it('should send notification to user subscriptions', async () => {
      const mockSubscriptions = [
        { id: 'sub-1', endpoint: 'https://push.example.com/1', p256dh: 'key1', auth: 'auth1' },
        { id: 'sub-2', endpoint: 'https://push.example.com/2', p256dh: 'key2', auth: 'auth2' },
      ];

      prisma.pushSubscription.findMany.mockResolvedValue(mockSubscriptions);
      (webpush.sendNotification as jest.Mock).mockResolvedValue({});

      await service.sendToUser('user-1', {
        type: 'POINTS_RECEIVED',
        title: 'Test',
        body: 'Test body',
        data: { url: '/test' },
      });

      expect(prisma.pushSubscription.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
    });

    it('should not send if no subscriptions', async () => {
      prisma.pushSubscription.findMany.mockResolvedValue([]);

      await service.sendToUser('user-1', {
        type: 'POINTS_RECEIVED',
        title: 'Test',
        body: 'Test body',
        data: { url: '/test' },
      });

      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });
  });

  describe('notifyPointsReceived', () => {
    it('should send points received notification', async () => {
      prisma.pushSubscription.findMany.mockResolvedValue([
        { id: 'sub-1', endpoint: 'https://push.example.com/1', p256dh: 'key1', auth: 'auth1' },
      ]);
      (webpush.sendNotification as jest.Mock).mockResolvedValue({});

      await service.notifyPointsReceived('user-1', 'John', 100);

      expect(prisma.pushSubscription.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(webpush.sendNotification).toHaveBeenCalled();
    });
  });

  describe('notifyPostLiked', () => {
    it('should send post liked notification', async () => {
      prisma.pushSubscription.findMany.mockResolvedValue([
        { id: 'sub-1', endpoint: 'https://push.example.com/1', p256dh: 'key1', auth: 'auth1' },
      ]);
      (webpush.sendNotification as jest.Mock).mockResolvedValue({});

      await service.notifyPostLiked('user-1', 'Jane', 'post-123');

      expect(webpush.sendNotification).toHaveBeenCalled();
    });
  });

  describe('notifyPostCommented', () => {
    it('should send post commented notification', async () => {
      prisma.pushSubscription.findMany.mockResolvedValue([
        { id: 'sub-1', endpoint: 'https://push.example.com/1', p256dh: 'key1', auth: 'auth1' },
      ]);
      (webpush.sendNotification as jest.Mock).mockResolvedValue({});

      await service.notifyPostCommented('user-1', 'Bob', 'post-123', 'Great post!');

      expect(webpush.sendNotification).toHaveBeenCalled();
    });
  });
});
