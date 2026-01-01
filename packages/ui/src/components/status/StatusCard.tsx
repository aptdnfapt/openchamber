import React from 'react';
import { cn } from '@/lib/utils';
import { RiRefreshLine, RiSettings3Line } from '@remixicon/react';
import type { McpServer, McpServerStatus } from '@/stores/useMcpStore';
import type { LspServerStatus } from '@/stores/useSystemStatusStore';

interface StatusCardProps {
  name: string;
  status: McpServerStatus | 'connected' | 'error' | 'disabled';
  details?: React.ReactNode;
  error?: string;
  metadata?: string;
  onRetry?: () => void;
  onConfigure?: () => void;
  className?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  name,
  status,
  details,
  error,
  metadata,
  onRetry,
  onConfigure,
  className,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: '●',
          color: 'text-[var(--status-success)]',
          label: 'Connected',
        };
      case 'error':
      case 'failed':
        return {
          icon: '✗',
          color: 'text-[var(--status-error)]',
          label: 'Failed',
        };
      case 'disabled':
        return {
          icon: '○',
          color: 'text-[var(--status-disabled)]',
          label: 'Disabled',
        };
      case 'needs_auth':
      case 'needs_client_registration':
        return {
          icon: '⚠',
          color: 'text-[var(--status-warning)]',
          label: 'Needs Attention',
        };
      default:
        return {
          icon: '?',
          color: 'text-muted-foreground',
          label: 'Unknown',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={cn(
        'border border-border rounded-lg p-3 hover:bg-accent/50 transition-colors',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm', config.color)}>{config.icon}</span>
            <span className="font-medium typography-ui-label truncate">{name}</span>
          </div>
          {metadata && (
            <p className="text-xs text-muted-foreground mt-1 typography-meta truncate">
              {metadata}
            </p>
          )}
          {error && isExpanded && (
            <p className="text-xs text-[var(--status-error)] mt-1 typography-meta break-words">
              {error}
            </p>
          )}
          {details && isExpanded && (
            <div className="mt-2 text-xs text-muted-foreground">{details}</div>
          )}
        </div>
        {(onRetry || onConfigure || error) && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {onRetry && status === 'failed' && (
              <button
                type="button"
                onClick={onRetry}
                className="p-1.5 rounded-md hover:bg-accent text-foreground transition-colors"
                aria-label={`Retry ${name}`}
                title="Retry"
              >
                <RiRefreshLine size={16} />
              </button>
            )}
            {onConfigure && (
              <button
                type="button"
                onClick={onConfigure}
                className="p-1.5 rounded-md hover:bg-accent text-foreground transition-colors"
                aria-label={`Configure ${name}`}
                title="Configure"
              >
                <RiSettings3Line size={16} />
              </button>
            )}
            {error && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors text-xs"
                aria-label={isExpanded ? 'Hide error details' : 'Show error details'}
              >
                {isExpanded ? 'Less' : 'More'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// MCP-specific card
export const McpStatusCard: React.FC<{
  server: McpServer;
  onRetry?: () => void;
  onConfigure?: () => void;
}> = ({ server, onRetry, onConfigure }) => {
  return (
    <StatusCard
      name={server.name}
      status={server.status}
      error={server.error}
      metadata={`Last checked: ${new Date(server.lastChecked).toLocaleTimeString()}`}
      onRetry={onRetry}
      onConfigure={onConfigure}
    />
  );
};

// LSP-specific card
export const LspStatusCard: React.FC<{
  server: LspServerStatus;
}> = ({ server }) => {
  return (
    <StatusCard
      name={server.name}
      status={server.status}
      metadata={server.root}
      details={
        <div className="space-y-1">
          <div>
            <span className="font-medium">ID:</span> {server.id}
          </div>
          <div>
            <span className="font-medium">Root:</span> {server.root}
          </div>
        </div>
      }
    />
  );
};
