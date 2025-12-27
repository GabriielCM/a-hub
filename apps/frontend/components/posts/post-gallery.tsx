'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostGalleryProps {
  photos: string[];
}

export function PostGallery({ photos }: PostGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (photos.length === 0) return null;

  if (photos.length === 1) {
    return (
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
        <img
          src={photos[0]}
          alt="Post image"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
      <img
        src={photos[currentIndex]}
        alt={`Post image ${currentIndex + 1}`}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
          onClick={() => setCurrentIndex(currentIndex - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      {currentIndex < photos.length - 1 && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
          onClick={() => setCurrentIndex(currentIndex + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* Dots Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {photos.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}
