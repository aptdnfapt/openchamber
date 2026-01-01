import React, { useState } from 'react';
import { RiLoader4Line, RiCheckLine, RiDeleteBinLine, RiEyeLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import type { StashedPrompt } from '@/stores/usePromptStashStore';

interface StashedPromptCardProps {
  prompt: StashedPrompt;
  onLoad: () => void;
  onDelete: () => void;
  onPreview?: () => void;
  className?: string;
}

/**
 * Card component for an individual stashed prompt.
 * Shows title, preview, timestamp, and actions.
 */
export const StashedPromptCard: React.FC<StashedPromptCardProps> = ({
  prompt,
  onLoad,
  onDelete,
  onPreview,
  className,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Format timestamp to relative time
  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Get preview text (first 2 lines or 100 chars)
  const getPreview = (): string => {
    const lines = prompt.text.split('\n');
    if (lines.length > 1) {
      const preview = lines.slice(0, 2).join('\n');
      return preview.length > 100 ? preview.slice(0, 100) + '\u2026' : preview;
    }
    return prompt.text.length > 100 ? prompt.text.slice(0, 100) + '\u2026' : prompt.text;
  };

  const handleLoad = () => {
    setIsLoading(true);
    onLoad();
    // Reset loading state after a short delay
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${prompt.title}" from stash?`)) return;
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-2 rounded-md border border-border/60 bg-background/50 p-3',
        'hover:border-primary/60 hover:bg-accent/30',
        'transition-all duration-200',
        className
      )}
      role="option"
      aria-label={prompt.title}
    >
      {/* Header: title + actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col">
          <h4 className="typography-ui-label font-medium text-foreground truncate">
            {prompt.title}
          </h4>
          <div className="flex items-center gap-2">
            <span className="typography-micro text-muted-foreground">
              {formatTimestamp(prompt.timestamp)}
            </span>
            {prompt.usageCount > 0 && (
              <span className="typography-micro text-muted-foreground/60">
                · {prompt.usageCount} {prompt.usageCount === 1 ? 'use' : 'uses'}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              className="inline-flex h-6 w-6 items-center justify-center rounded-sm hover:bg-accent/60 transition-colors"
              title="Preview full text"
              aria-label="Preview full text"
            >
              <RiEyeLine className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex h-6 w-6 items-center justify-center rounded-sm hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
            title="Delete prompt"
            aria-label={`Delete "${prompt.title}"`}
          >
            {isDeleting ? (
              <RiLoader4Line className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RiDeleteBinLine className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Preview text */}
      <div className="flex flex-1 items-center gap-2">
        <button
          type="button"
          onClick={handleLoad}
          disabled={isLoading}
          className={cn(
            'flex min-w-0 flex-1 items-center justify-start rounded-sm px-2 py-1.5 text-left',
            'text-sm text-muted-foreground/80',
            'hover:bg-accent/50 hover:text-foreground',
            'transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
            isLoading && 'opacity-70'
          )}
        >
          <span className="line-clamp-2 whitespace-pre-wrap">
            {getPreview()}
          </span>
        </button>

        {/* Load button */}
        <button
          type="button"
          onClick={handleLoad}
          disabled={isLoading}
          className={cn(
            'flex-shrink-0 inline-flex items-center justify-center gap-1',
            'rounded-sm px-2 py-1.5 text-sm font-medium',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
            'transition-colors',
            isLoading && 'opacity-70'
          )}
        >
          {isLoading ? (
            <RiLoader4Line className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RiCheckLine className="h-3.5 w-3.5" />
          )}
          <span className="typography-micro">Load</span>
        </button>
      </div>
    </div>
  );
};
