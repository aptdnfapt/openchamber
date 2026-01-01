import React from 'react';
import { RiStarLine } from '@remixicon/react';
import { cn } from '@/lib/utils';

interface StashEmptyStateProps {
  className?: string;
}

/**
 * Empty state shown when no prompts are saved.
 */
export const StashEmptyState: React.FC<StashEmptyStateProps> = ({ className }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="mb-3 inline-flex items-center justify-center rounded-full bg-accent/30 p-3">
        <RiStarLine className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <h3 className="typography-ui-label font-medium text-foreground mb-1">
        No saved prompts
      </h3>
      <p className="typography-micro text-muted-foreground max-w-[200px]">
        Type a prompt and click ★ to save it
      </p>
    </div>
  );
};
