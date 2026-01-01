import React from 'react';
import { RiRefreshLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StatusSectionProps {
  title: string;
  count: number;
  countLabel?: string;
  isLoading: boolean;
  error: string | null;
  children: React.ReactNode;
  onRefresh?: () => void;
  emptyMessage?: string;
  className?: string;
}

export const StatusSection: React.FC<StatusSectionProps> = ({
  title,
  count,
  countLabel = 'item' + (count !== 1 ? 's' : ''),
  isLoading,
  error,
  children,
  onRefresh,
  emptyMessage = `No ${title.toLowerCase()} configured`,
  className,
}) => {
  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold typography-ui-label">{title}</h2>
          <span className="text-xs text-muted-foreground typography-meta px-2 py-0.5 rounded-full bg-accent">
            {count} {countLabel}
          </span>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Refresh ${title}`}
          >
            <RiRefreshLine
              size={16}
              className={cn(isLoading && 'animate-spin')}
            />
          </button>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="border border-border rounded-lg p-3 animate-pulse"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-accent" />
                    <div className="h-4 flex-1 max-w-[200px] rounded bg-accent" />
                  </div>
                  <div className="h-3 w-32 mt-2 rounded bg-accent" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--status-error)] typography-ui-label mb-3">
                Failed to load {title.toLowerCase()}
              </p>
              <p className="text-xs text-muted-foreground typography-meta">{error}</p>
            </div>
          ) : React.Children.count(children) === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground typography-ui-label">
                {emptyMessage}
              </p>
            </div>
          ) : (
            <div className="space-y-2">{children}</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
