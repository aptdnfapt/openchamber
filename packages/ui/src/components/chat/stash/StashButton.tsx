import React, { forwardRef } from 'react';
import { RiStarLine } from '@remixicon/react';
import { usePromptStashStore } from '@/stores/usePromptStashStore';
import { cn } from '@/lib/utils';

interface StashButtonProps {
  onClick?: () => void;
  className?: string;
}

/**
 * Button to open the prompt stash panel.
 * Shows a badge with the number of stashed prompts.
 */
export const StashButton = forwardRef<HTMLButtonElement, StashButtonProps>(({ onClick, className }, ref) => {
  const prompts = usePromptStashStore((state) => state.prompts);
  const count = prompts.length;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center',
        'h-8 w-8 rounded-md',
        'hover:bg-accent/50',
        'transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        className
      )}
      title={`Open prompt stash${count > 0 ? ` (${count} saved)` : ''}`}
      aria-label={`Open prompt stash${count > 0 ? ` (${count} saved)` : ''}`}
    >
      <RiStarLine className="h-5 w-5 text-current" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
});

StashButton.displayName = 'StashButton';
