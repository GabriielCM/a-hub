'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { UserAvatar } from '@/components/ui/user-avatar';

interface PostCreateFormProps {
  accessToken: string;
  userName: string;
  userPhoto?: string | null;
  onPostCreated: () => void;
}

export function PostCreateForm({
  accessToken,
  userName,
  userPhoto,
  onPostCreated,
}: PostCreateFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      toast({
        title: 'Limite excedido',
        description: 'Voce pode adicionar no maximo 5 fotos.',
        variant: 'destructive',
      });
      return;
    }

    const newFiles = [...selectedFiles, ...files].slice(0, 5);
    setSelectedFiles(newFiles);

    // Generate preview URLs
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    // Clean up old preview URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls(newPreviews);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function removeFile(index: number) {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    URL.revokeObjectURL(previewUrls[index]);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
  }

  async function handleSubmit() {
    if (!content.trim() && selectedFiles.length === 0) {
      toast({
        title: 'Post vazio',
        description: 'Adicione texto ou imagens ao seu post.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrls: string[] = [];

      // Upload images if any
      if (selectedFiles.length > 0) {
        const uploadResults = await api.uploadUserImages(selectedFiles, accessToken);
        photoUrls = uploadResults.map((r) => r.url);
      }

      // Create post
      await api.createPost(
        {
          content: content.trim(),
          photos: photoUrls,
        },
        accessToken
      );

      // Reset form
      setContent('');
      setSelectedFiles([]);
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPreviewUrls([]);

      toast({
        title: 'Post criado',
        description: 'Seu post foi publicado com sucesso.',
      });

      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Erro ao criar post',
        description: 'Nao foi possivel publicar seu post.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <UserAvatar name={userName} photo={userPhoto} size="md" />

          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="O que voce quer compartilhar?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px] resize-none border-0 p-0 focus-visible:ring-0"
              disabled={isSubmitting}
              maxLength={2000}
            />

            {/* Image Previews */}
            {previewUrls.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                      onClick={() => removeFile(index)}
                      disabled={isSubmitting}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={isSubmitting}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || selectedFiles.length >= 5}
              >
                <ImagePlus className="h-5 w-5 mr-2" />
                Foto ({selectedFiles.length}/5)
              </Button>

              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting || (!content.trim() && selectedFiles.length === 0)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  'Publicar'
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
