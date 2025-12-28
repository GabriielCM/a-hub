import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaginatedPostsQueryDto } from './dto/paginated-posts.dto';
import { Role } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createPostDto: CreatePostDto, authorId: string) {
    return this.prisma.post.create({
      data: {
        ...createPostDto,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            memberCard: { select: { photo: true } },
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });
  }

  async findAll(query: PaginatedPostsQueryDto, userId: string) {
    const { cursor, limit = 10 } = query;

    // Get pinned posts first (separate query)
    const pinnedPosts = await this.prisma.post.findMany({
      where: { isPinned: true },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            memberCard: { select: { photo: true } },
          },
        },
        likes: { where: { userId }, select: { id: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { pinnedAt: 'desc' },
    });

    // Get regular posts with cursor pagination
    const regularPosts = await this.prisma.post.findMany({
      where: {
        isPinned: false,
        ...(cursor && {
          createdAt: {
            lt: (await this.prisma.post.findUnique({ where: { id: cursor } }))
              ?.createdAt,
          },
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            memberCard: { select: { photo: true } },
          },
        },
        likes: { where: { userId }, select: { id: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = regularPosts.length > limit;
    const posts = hasMore ? regularPosts.slice(0, -1) : regularPosts;
    const nextCursor = hasMore ? posts[posts.length - 1].id : null;

    // Combine pinned and regular posts
    const allPosts = cursor ? posts : [...pinnedPosts, ...posts];

    return {
      posts: allPosts.map((post) => ({
        id: post.id,
        content: post.content,
        photos: post.photos,
        authorId: post.authorId,
        author: post.author,
        isPinned: post.isPinned,
        pinnedAt: post.pinnedAt,
        isLikedByMe: post.likes.length > 0,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      })),
      nextCursor,
      hasMore,
    };
  }

  async findById(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            memberCard: { select: { photo: true } },
          },
        },
        likes: { where: { userId }, select: { id: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return {
      id: post.id,
      content: post.content,
      photos: post.photos,
      authorId: post.authorId,
      author: post.author,
      isPinned: post.isPinned,
      pinnedAt: post.pinnedAt,
      isLikedByMe: post.likes.length > 0,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  async update(id: string, updatePostDto: UpdatePostDto, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            memberCard: { select: { photo: true } },
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });
  }

  async remove(id: string, userId: string, userRole: Role) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({
      where: { id },
    });

    return { message: 'Post deleted successfully' };
  }

  // Like methods
  async likePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    try {
      await this.prisma.postLike.create({
        data: {
          postId,
          userId,
        },
      });

      // Send push notification to post author (if not self-like and first time)
      if (post.authorId !== userId) {
        // Check if notification was already sent for this like (anti-spam)
        const existingNotification =
          await this.prisma.likeNotificationHistory.findUnique({
            where: {
              userId_postId: { userId, postId },
            },
          });

        if (!existingNotification) {
          // First time like - send notification and record it
          const liker = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
          });

          // Record notification history
          await this.prisma.likeNotificationHistory.create({
            data: { userId, postId },
          });

          // Send notification
          this.notificationsService
            .notifyPostLiked(post.authorId, liker?.name || 'Alguem', postId)
            .catch((err) => {
              console.error('Failed to send push notification:', err);
            });
        }
        // If existingNotification exists, skip notification (re-like scenario)
      }

      return { message: 'Post liked successfully' };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('You already liked this post');
      }
      throw error;
    }
  }

  async unlikePost(postId: string, userId: string) {
    const like = await this.prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!like) {
      throw new NotFoundException('Like not found');
    }

    await this.prisma.postLike.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    return { message: 'Post unliked successfully' };
  }

  // Comment methods
  async getComments(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.prisma.postComment.findMany({
      where: { postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            memberCard: { select: { photo: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createComment(
    postId: string,
    createCommentDto: CreateCommentDto,
    authorId: string,
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = await this.prisma.postComment.create({
      data: {
        ...createCommentDto,
        postId,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            memberCard: { select: { photo: true } },
          },
        },
      },
    });

    // Send push notification to post author (if not self-comment)
    if (post.authorId !== authorId) {
      const commentPreview =
        createCommentDto.content.substring(0, 50) +
        (createCommentDto.content.length > 50 ? '...' : '');
      this.notificationsService
        .notifyPostCommented(
          post.authorId,
          comment.author.name,
          postId,
          commentPreview,
        )
        .catch((err) => {
          console.error('Failed to send push notification:', err);
        });
    }

    return comment;
  }

  async deleteComment(
    postId: string,
    commentId: string,
    userId: string,
    userRole: Role,
  ) {
    const comment = await this.prisma.postComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.postId !== postId) {
      throw new NotFoundException('Comment not found in this post');
    }

    if (comment.authorId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.postComment.delete({
      where: { id: commentId },
    });

    return { message: 'Comment deleted successfully' };
  }

  // Pin methods (Admin only)
  async togglePin(postId: string, adminId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: {
        isPinned: !post.isPinned,
        pinnedAt: !post.isPinned ? new Date() : null,
        pinnedById: !post.isPinned ? adminId : null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            memberCard: { select: { photo: true } },
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });
  }
}
