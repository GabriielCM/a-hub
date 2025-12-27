'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, MoreHorizontal, Pin } from 'lucide-react';
import { Post } from '@/lib/api';
import { PostGallery } from './post-gallery';
import { PostComments } from './post-comments';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PostCardProps {
  post: Post;
  currentUserId: string;
  isAdmin: boolean;
  onLike: (postId: string) => Promise<void>;
  onUnlike: (postId: string) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  onPin?: (postId: string) => Promise<void>;
}

export function PostCard({
  post,
  currentUserId,
  isAdmin,
  onLike,
  onUnlike,
  onDelete,
  onPin,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLikedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLiking, setIsLiking] = useState(false);

  const isOwner = post.authorId === currentUserId;
  const canDelete = isOwner || isAdmin;

  async function handleLikeToggle() {
    if (isLiking) return;
    setIsLiking(true);
    try {
      if (isLiked) {
        await onUnlike(post.id);
        setLikesCount((prev) => prev - 1);
      } else {
        await onLike(post.id);
        setLikesCount((prev) => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      // Revert on error
      console.error('Like error:', error);
    } finally {
      setIsLiking(false);
    }
  }

  return (
    <Card className={post.isPinned ? 'border-primary border-2 shadow-md' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {post.author.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm">{post.author.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {post.isPinned && (
              <Badge variant="secondary" className="gap-1">
                <Pin className="h-3 w-3" />
                Fixado
              </Badge>
            )}
            {canDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAdmin && onPin && (
                    <DropdownMenuItem onClick={() => onPin(post.id)}>
                      <Pin className="h-4 w-4 mr-2" />
                      {post.isPinned ? 'Desafixar' : 'Fixar'}
                    </DropdownMenuItem>
                  )}
                  {canDelete && onDelete && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(post.id)}
                    >
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        {/* Content */}
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>

        {/* Gallery */}
        {post.photos && post.photos.length > 0 && (
          <PostGallery photos={post.photos} />
        )}
      </CardContent>

      <CardFooter className="pt-0 flex flex-col">
        {/* Stats */}
        <div className="w-full flex items-center justify-between text-sm text-muted-foreground pb-2 border-b">
          <span>{likesCount} curtidas</span>
          <button
            className="hover:underline"
            onClick={() => setShowComments(!showComments)}
          >
            {post.commentsCount} comentarios
          </button>
        </div>

        {/* Actions */}
        <div className="w-full flex items-center gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className={`flex-1 ${isLiked ? 'text-red-500' : ''}`}
            onClick={handleLikeToggle}
            disabled={isLiking}
          >
            <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
            Curtir
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Comentar
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <PostComments postId={post.id} initialCount={post.commentsCount} />
        )}
      </CardFooter>
    </Card>
  );
}
