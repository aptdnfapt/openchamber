import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RiLoader4Line, RiRefreshLine, RiErrorWarningLine } from '@remixicon/react';
import { McpStatusBadge } from './McpStatusBadge';
import type { McpServer } from '@/stores/useMcpStore';

interface McpServerItemProps {
  server: McpServer;
  isToggling?: boolean;
  isRetrying?: boolean;
  onToggle?: (name: string, enabled: boolean) => void;
  onRetry?: (name: string) => void;
  className?: string;
}

export const McpServerItem: React.FC<McpServerItemProps> = ({
  server,
  isToggling = false,
  isRetrying = false,
  onToggle,
  onRetry,
  className,
}) => {
  const isEnabled = server.status === 'connected';
  const canRetry = server.status === 'failed' || server.status === 'needs_auth';
  const showRetry = canRetry && !isToggling && onRetry;
  const showToggle = !isRetrying && onToggle;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50',
        className
      )}
    >
      {/* Server info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm truncate">{server.name}</h4>
          <McpStatusBadge status={server.status} />
        </div>

        {/* Error message if failed */}
        {server.error && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <RiErrorWarningLine className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-status-error" />
            <p className="line-clamp-2">{server.error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {showRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRetry?.(server.name)}
              disabled={isToggling || isRetrying}
              className="h-7 text-xs"
            >
              {isRetrying ? (
                <>
                  <RiLoader4Line className="h-3.5 w-3.5 mr-1 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RiRefreshLine className="h-3.5 w-3.5 mr-1" />
                  Retry
                </>
              )}
            </Button>
          )}

          {showToggle && (
            <div
              className={cn(
                'flex items-center gap-2 text-xs',
                isToggling && 'opacity-50'
              )}
            >
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked: boolean) => onToggle?.(server.name, checked)}
                disabled={isToggling}
              />
              <span className="text-muted-foreground">
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          )}

          {isToggling && !isRetrying && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RiLoader4Line className="h-3.5 w-3.5 animate-spin" />
              <span>{isEnabled ? 'Disabling...' : 'Enabling...'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
