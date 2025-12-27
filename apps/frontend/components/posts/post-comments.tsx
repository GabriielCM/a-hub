'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, PostComment } from '@/lib/api';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useToast } from '@/components/ui/use-toast';

interface PostCommentsProps {
  postId: string;
  initialCount: number;
}

export function PostComments({ postId, initialCount }: PostCommentsProps) {
  const { user, accessToken } = useAuth();
  const { toast } = useToast();

  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    async function loadComments() {
      if (!accessToken) return;
      try {
        const data = await api.getPostComments(postId, accessToken);
        setComments(data);
      } catch (error) {
        console.error('Error loading comments:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadComments();
  }, [postId, accessToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !accessToken) return;

    setIsSubmitting(true);
    try {
      const comment = await api.createComment(
        postId,
        { content: newComment.trim() },
        accessToken
      );
      setComments((prev) => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel adicionar o comentario',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!accessToken) return;

    setDeletingId(commentId);
    try {
      await api.deleteComment(postId, commentId, accessToken);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel excluir o comentario',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="w-full py-4 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full border-t pt-3 mt-2 space-y-3">
      {/* Comments List */}
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            Nenhum comentario ainda. Seja o primeiro!
          </p>
        ) : (
          comments.map((comment) => {
            const canDelete = comment.authorId === user?.id || isAdmin;

            return (
              <div key={comment.id} className="flex gap-2 group">
                <UserAvatar
                  name={comment.author.name}
                  photo={comment.author.memberCard?.photo}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                      >
                        {deletingId === comment.id ? (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        ) : (
                          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Adicione um comentario..."
          className="flex-1"
          disabled={isSubmitting}
          maxLength={1000}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isSubmitting || !newComment.trim()}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
