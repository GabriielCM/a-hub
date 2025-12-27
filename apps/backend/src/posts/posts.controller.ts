import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaginatedPostsQueryDto } from './dto/paginated-posts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.postsService.create(createPostDto, userId);
  }

  @Get()
  findAll(
    @Query() query: PaginatedPostsQueryDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.postsService.findAll(query, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.postsService.findById(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.postsService.update(id, updatePostDto, userId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.postsService.remove(id, userId, userRole);
  }

  // Like endpoints
  @Post(':id/like')
  likePost(@Param('id') postId: string, @CurrentUser('sub') userId: string) {
    return this.postsService.likePost(postId, userId);
  }

  @Delete(':id/like')
  unlikePost(@Param('id') postId: string, @CurrentUser('sub') userId: string) {
    return this.postsService.unlikePost(postId, userId);
  }

  // Comment endpoints
  @Get(':id/comments')
  getComments(@Param('id') postId: string) {
    return this.postsService.getComments(postId);
  }

  @Post(':id/comments')
  createComment(
    @Param('id') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.postsService.createComment(postId, createCommentDto, userId);
  }

  @Delete(':id/comments/:commentId')
  deleteComment(
    @Param('id') postId: string,
    @Param('commentId') commentId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.postsService.deleteComment(postId, commentId, userId, userRole);
  }

  // Pin endpoint (Admin only)
  @Patch(':id/pin')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  togglePin(@Param('id') postId: string, @CurrentUser('sub') adminId: string) {
    return this.postsService.togglePin(postId, adminId);
  }
}
