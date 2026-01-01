import React from 'react';
import { cn } from '@/lib/utils';
import { RiPlug2Line } from '@remixicon/react';
import { useMcpStore, getMcpStats } from '@/stores/useMcpStore';

interface McpStatusIndicatorProps {
  className?: string;
  onClick?: () => void;
}

export const McpStatusIndicator: React.FC<McpStatusIndicatorProps> = ({
  className,
  onClick,
}) => {
  const { mcpServers, isLoading } = useMcpStore();
  const stats = React.useMemo(() => getMcpStats(mcpServers), [mcpServers]);

  // Don't show indicator if no MCP servers configured
  if (stats.total === 0) {
    return null;
  }

  const hasFailed = stats.failed > 0;
  const statusColor = hasFailed ? 'bg-status-error' : stats.connected > 0 ? 'bg-status-success' : 'bg-muted-foreground';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none',
        className
      )}
      aria-label={`MCP Status: ${stats.connected} connected, ${stats.failed} failed`}
    >
      <RiPlug2Line className="h-4 w-4" />
      <span>MCP</span>
      {isLoading ? (
        <span className="h-2 w-2 rounded-full animate-pulse bg-muted-foreground" />
      ) : (
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            statusColor
          )}
        />
      )}
      {hasFailed && (
        <span className="sr-only">({stats.failed} failed)</span>
      )}
    </button>
  );
};
