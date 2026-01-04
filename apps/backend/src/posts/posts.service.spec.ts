import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('PostsService', () => {
  let service: PostsService;
  let prisma: jest.Mocked<PrismaService>;
  let notificationsService: jest.Mocked<NotificationsService>;

  const createMockPost = (overrides = {}) => ({
    id: 'post-1',
    content: 'Test post content',
    photos: [],
    authorId: 'user-1',
    isPinned: false,
    pinnedAt: null,
    pinnedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockComment = (overrides = {}) => ({
    id: 'comment-1',
    content: 'Test comment',
    postId: 'post-1',
    authorId: 'user-2',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: {
            post: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            postLike: {
              create: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
            },
            postComment: {
              findMany: jest.fn(),
              create: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
            },
            likeNotificationHistory: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            notifyPostLiked: jest.fn().mockResolvedValue(undefined),
            notifyPostCommented: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prisma = module.get(PrismaService);
    notificationsService = module.get(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a post', async () => {
      const dto = { content: 'New post content', photos: [] };
      const mockPost = {
        ...createMockPost({ content: dto.content }),
        author: { id: 'user-1', name: 'Test User', email: 'test@test.com', memberCard: null },
        _count: { likes: 0, comments: 0 },
      };

      prisma.post.create.mockResolvedValue(mockPost);

      const result = await service.create(dto, 'user-1');

      expect(prisma.post.create).toHaveBeenCalledWith({
        data: { ...dto, authorId: 'user-1' },
        include: expect.any(Object),
      });
      expect(result.content).toBe(dto.content);
    });
  });

  describe('findAll', () => {
    it('should return paginated posts with pinned first', async () => {
      const pinnedPost = {
        ...createMockPost({ id: 'pinned-1', isPinned: true, pinnedAt: new Date() }),
        author: { id: 'user-1', name: 'Test', email: 'test@test.com', memberCard: null },
        likes: [],
        _count: { likes: 0, comments: 0 },
      };
      const regularPost = {
        ...createMockPost({ id: 'regular-1' }),
        author: { id: 'user-2', name: 'Test2', email: 'test2@test.com', memberCard: null },
        likes: [{ id: 'like-1' }],
        _count: { likes: 1, comments: 2 },
      };

      prisma.post.findMany
        .mockResolvedValueOnce([pinnedPost])
        .mockResolvedValueOnce([regularPost]);

      const result = await service.findAll({ limit: 10 }, 'user-1');

      expect(result.posts).toHaveLength(2);
      expect(result.posts[0].isPinned).toBe(true);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('findById', () => {
    it('should return post by id', async () => {
      const mockPost = {
        ...createMockPost(),
        author: { id: 'user-1', name: 'Test', email: 'test@test.com', memberCard: null },
        likes: [],
        _count: { likes: 5, comments: 3 },
      };

      prisma.post.findUnique.mockResolvedValue(mockPost);

      const result = await service.findById('post-1', 'user-1');

      expect(result.id).toBe('post-1');
      expect(result.likesCount).toBe(5);
      expect(result.commentsCount).toBe(3);
    });

    it('should throw NotFoundException if post not found', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update post by owner', async () => {
      const mockPost = createMockPost();
      const updateDto = { content: 'Updated content' };
      const updatedPost = {
        ...mockPost,
        ...updateDto,
        author: { id: 'user-1', name: 'Test', email: 'test@test.com', memberCard: null },
        _count: { likes: 0, comments: 0 },
      };

      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.post.update.mockResolvedValue(updatedPost);

      const result = await service.update('post-1', updateDto, 'user-1');

      expect(result.content).toBe('Updated content');
    });

    it('should throw NotFoundException if post not found', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { content: 'test' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not owner', async () => {
      const mockPost = createMockPost({ authorId: 'other-user' });
      prisma.post.findUnique.mockResolvedValue(mockPost);

      await expect(
        service.update('post-1', { content: 'test' }, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete post by owner', async () => {
      const mockPost = createMockPost();
      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.post.delete.mockResolvedValue(mockPost);

      const result = await service.remove('post-1', 'user-1', Role.COLLABORATOR);

      expect(result.message).toBe('Post deleted successfully');
    });

    it('should allow admin to delete any post', async () => {
      const mockPost = createMockPost({ authorId: 'other-user' });
      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.post.delete.mockResolvedValue(mockPost);

      const result = await service.remove('post-1', 'admin-1', Role.ADMIN);

      expect(result.message).toBe('Post deleted successfully');
    });

    it('should throw ForbiddenException if not owner and not admin', async () => {
      const mockPost = createMockPost({ authorId: 'other-user' });
      prisma.post.findUnique.mockResolvedValue(mockPost);

      await expect(
        service.remove('post-1', 'user-1', Role.COLLABORATOR),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('likePost', () => {
    it('should like a post', async () => {
      const mockPost = createMockPost();
      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.postLike.create.mockResolvedValue({
        id: 'like-1',
        userId: 'user-2',
        postId: 'post-1',
        createdAt: new Date(),
      });
      prisma.likeNotificationHistory.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ id: 'user-2', name: 'Liker' });
      prisma.likeNotificationHistory.create.mockResolvedValue({
        id: 'history-1',
        userId: 'user-2',
        postId: 'post-1',
        createdAt: new Date(),
      });

      const result = await service.likePost('post-1', 'user-2');

      expect(result.message).toBe('Post liked successfully');
      expect(notificationsService.notifyPostLiked).toHaveBeenCalled();
    });

    it('should throw NotFoundException if post not found', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(service.likePost('non-existent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if already liked', async () => {
      const mockPost = createMockPost();
      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.postLike.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.likePost('post-1', 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('unlikePost', () => {
    it('should unlike a post', async () => {
      const mockLike = {
        id: 'like-1',
        userId: 'user-1',
        postId: 'post-1',
        createdAt: new Date(),
      };
      prisma.postLike.findUnique.mockResolvedValue(mockLike);
      prisma.postLike.delete.mockResolvedValue(mockLike);

      const result = await service.unlikePost('post-1', 'user-1');

      expect(result.message).toBe('Post unliked successfully');
    });

    it('should throw NotFoundException if like not found', async () => {
      prisma.postLike.findUnique.mockResolvedValue(null);

      await expect(service.unlikePost('post-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getComments', () => {
    it('should return comments for a post', async () => {
      const mockPost = createMockPost();
      const mockComments = [
        {
          ...createMockComment(),
          author: { id: 'user-2', name: 'Commenter', email: 'c@test.com', memberCard: null },
        },
      ];

      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.postComment.findMany.mockResolvedValue(mockComments);

      const result = await service.getComments('post-1');

      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException if post not found', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(service.getComments('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createComment', () => {
    it('should create a comment', async () => {
      const mockPost = createMockPost();
      const dto = { content: 'New comment' };
      const mockComment = {
        ...createMockComment({ content: dto.content }),
        author: { id: 'user-2', name: 'Commenter', email: 'c@test.com', memberCard: null },
      };

      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.postComment.create.mockResolvedValue(mockComment);

      const result = await service.createComment('post-1', dto, 'user-2');

      expect(result.content).toBe(dto.content);
      expect(notificationsService.notifyPostCommented).toHaveBeenCalled();
    });

    it('should throw NotFoundException if post not found', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(
        service.createComment('non-existent', { content: 'test' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteComment', () => {
    it('should delete comment by owner', async () => {
      const mockComment = createMockComment();
      prisma.postComment.findUnique.mockResolvedValue(mockComment);
      prisma.postComment.delete.mockResolvedValue(mockComment);

      const result = await service.deleteComment('post-1', 'comment-1', 'user-2', Role.COLLABORATOR);

      expect(result.message).toBe('Comment deleted successfully');
    });

    it('should allow admin to delete any comment', async () => {
      const mockComment = createMockComment({ authorId: 'other-user' });
      prisma.postComment.findUnique.mockResolvedValue(mockComment);
      prisma.postComment.delete.mockResolvedValue(mockComment);

      const result = await service.deleteComment('post-1', 'comment-1', 'admin-1', Role.ADMIN);

      expect(result.message).toBe('Comment deleted successfully');
    });

    it('should throw NotFoundException if comment not found', async () => {
      prisma.postComment.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteComment('post-1', 'non-existent', 'user-1', Role.COLLABORATOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not owner and not admin', async () => {
      const mockComment = createMockComment({ authorId: 'other-user' });
      prisma.postComment.findUnique.mockResolvedValue(mockComment);

      await expect(
        service.deleteComment('post-1', 'comment-1', 'user-1', Role.COLLABORATOR),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('togglePin', () => {
    it('should pin an unpinned post', async () => {
      const mockPost = createMockPost({ isPinned: false });
      const pinnedPost = {
        ...mockPost,
        isPinned: true,
        pinnedAt: new Date(),
        pinnedById: 'admin-1',
        author: { id: 'user-1', name: 'Test', email: 'test@test.com', memberCard: null },
        _count: { likes: 0, comments: 0 },
      };

      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.post.update.mockResolvedValue(pinnedPost);

      const result = await service.togglePin('post-1', 'admin-1');

      expect(result.isPinned).toBe(true);
    });

    it('should unpin a pinned post', async () => {
      const mockPost = createMockPost({ isPinned: true, pinnedAt: new Date() });
      const unpinnedPost = {
        ...mockPost,
        isPinned: false,
        pinnedAt: null,
        pinnedById: null,
        author: { id: 'user-1', name: 'Test', email: 'test@test.com', memberCard: null },
        _count: { likes: 0, comments: 0 },
      };

      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.post.update.mockResolvedValue(unpinnedPost);

      const result = await service.togglePin('post-1', 'admin-1');

      expect(result.isPinned).toBe(false);
    });

    it('should throw NotFoundException if post not found', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(service.togglePin('non-existent', 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
