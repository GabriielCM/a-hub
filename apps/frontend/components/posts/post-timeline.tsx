'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { api, Post } from '@/lib/api';
import { PostCard } from './post-card';
import { PostCreateForm } from './post-create-form';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface PostTimelineProps {
  accessToken: string;
  currentUserId: string;
  userName: string;
  userPhoto?: string | null;
  isAdmin: boolean;
}

export function PostTimeline({
  accessToken,
  currentUserId,
  userName,
  userPhoto,
  isAdmin,
}: PostTimelineProps) {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadPosts = useCallback(
    async (cursor?: string) => {
      try {
        const response = await api.getPosts(accessToken, cursor, 10);
        if (cursor) {
          setPosts((prev) => [...prev, ...response.posts]);
        } else {
          setPosts(response.posts);
        }
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
      } catch (error) {
        console.error('Error loading posts:', error);
        toast({
          title: 'Erro',
          description: 'Nao foi possivel carregar os posts',
          variant: 'destructive',
        });
      }
    },
    [accessToken, toast]
  );

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    loadPosts().finally(() => setIsLoading(false));
  }, [loadPosts]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && nextCursor) {
          setIsLoadingMore(true);
          loadPosts(nextCursor).finally(() => setIsLoadingMore(false));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoadingMore, nextCursor, loadPosts]);

  async function handleLike(postId: string) {
    try {
      await api.likePost(postId, accessToken);
    } catch (error) {
      // The PostCard handles optimistic update, just log error
      console.error('Like error:', error);
    }
  }

  async function handleUnlike(postId: string) {
    try {
      await api.unlikePost(postId, accessToken);
    } catch (error) {
      console.error('Unlike error:', error);
    }
  }

  async function handleDelete(postId: string) {
    try {
      await api.deletePost(postId, accessToken);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast({
        title: 'Post excluido',
        description: 'O post foi excluido com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel excluir o post',
        variant: 'destructive',
      });
    }
  }

  async function handlePin(postId: string) {
    try {
      await api.togglePinPost(postId, accessToken);
      // Reload to get correct ordering
      setIsLoading(true);
      await loadPosts();
      setIsLoading(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel fixar/desafixar o post',
        variant: 'destructive',
      });
    }
  }

  function handlePostCreated() {
    // Reload posts after creation
    setIsLoading(true);
    loadPosts().finally(() => setIsLoading(false));
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PostCreateForm
          accessToken={accessToken}
          userName={userName}
          userPhoto={userPhoto}
          onPostCreated={handlePostCreated}
        />
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Post Form */}
      <PostCreateForm
        accessToken={accessToken}
        userName={userName}
        userPhoto={userPhoto}
        onPostCreated={handlePostCreated}
      />

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum post ainda.</p>
          <p className="text-sm">Seja o primeiro a compartilhar algo!</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onLike={handleLike}
            onUnlike={handleUnlike}
            onDelete={handleDelete}
            onPin={isAdmin ? handlePin : undefined}
          />
        ))
      )}

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="py-4">
        {isLoadingMore && (
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-center text-muted-foreground text-sm">
            Voce viu todas as publicacoes
          </p>
        )}
      </div>
    </div>
  );
}
