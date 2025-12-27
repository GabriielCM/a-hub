'use client';

import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  photo?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function UserAvatar({ name, photo, size = 'md', className }: UserAvatarProps) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={cn(
          sizeClasses[size],
          'rounded-full object-cover flex-shrink-0',
          className
        )}
      />
    );
  }

  // Fallback: Inicial do nome
  return (
    <div
      className={cn(
        sizeClasses[size],
        'rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0',
        className
      )}
    >
      <span className="font-medium text-primary">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
