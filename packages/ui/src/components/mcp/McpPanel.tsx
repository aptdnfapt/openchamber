import React from 'react';
import { toast } from 'sonner';
import { RiLoader4Line, RiRefreshLine, RiPlug2Line } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useMcpStore, getMcpStats } from '@/stores/useMcpStore';
import { McpServerItem } from './McpServerItem';

type McpFilter = 'all' | 'connected' | 'failed' | 'disabled' | 'needs_auth';

const FILTER_LABELS: Record<McpFilter, string> = {
  all: 'All',
  connected: 'Connected',
  failed: 'Failed',
  disabled: 'Disabled',
  needs_auth: 'Needs Auth',
};

export const McpPanel: React.FC<{ className?: string }> = ({ className }) => {
  const { mcpServers, isLoading, fetchMcpStatus, toggleMcp, retryMcp } = useMcpStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filter, setFilter] = React.useState<McpFilter>('all');
  const [togglingServer, setTogglingServer] = React.useState<string | null>(null);
  const [retryingServer, setRetryingServer] = React.useState<string | null>(null);

  const stats = React.useMemo(() => getMcpStats(mcpServers), [mcpServers]);

  const filteredServers = React.useMemo(() => {
    let servers = Object.values(mcpServers);

    // Apply status filter
    if (filter !== 'all') {
      servers = servers.filter((server) => {
        if (filter === 'needs_auth') {
          return (
            server.status === 'needs_auth' ||
            server.status === 'needs_client_registration'
          );
        }
        return server.status === filter;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      servers = servers.filter((server) =>
        server.name.toLowerCase().includes(query)
      );
    }

    return servers.sort((a, b) => a.name.localeCompare(b.name));
  }, [mcpServers, filter, searchQuery]);

  const handleToggle = async (name: string, enabled: boolean) => {
    setTogglingServer(name);
    try {
      await toggleMcp(name, enabled);
      toast.success(
        enabled ? `Enabled ${name}` : `Disabled ${name}`,
        { description: 'MCP server status updated' }
      );
    } catch (error) {
      toast.error(
        enabled ? `Failed to enable ${name}` : `Failed to disable ${name}`,
        { description: error instanceof Error ? error.message : 'Unknown error' }
      );
    } finally {
      setTogglingServer(null);
    }
  };

  const handleRetry = async (name: string) => {
    setRetryingServer(name);
    try {
      await retryMcp(name);
      toast.success(`Retried ${name}`, { description: 'MCP server reconnected' });
    } catch (error) {
      toast.error(
        `Failed to retry ${name}`,
        { description: error instanceof Error ? error.message : 'Unknown error' }
      );
    } finally {
      setRetryingServer(null);
    }
  };

  const handleRefresh = async () => {
    await fetchMcpStatus();
    toast.success('Refreshed', { description: 'MCP server status updated' });
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <RiPlug2Line className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">MCP Servers</h3>
          {stats.total > 0 && (
            <span className="text-xs text-muted-foreground">
              ({stats.connected} / {stats.total})
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-8 w-8"
          aria-label="Refresh MCP status"
        >
          <RiRefreshLine
            className={cn('h-4 w-4', isLoading && 'animate-spin')}
          />
        </Button>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-3 border-b">
        <Input
          placeholder="Search MCP servers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8"
        />

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FILTER_LABELS) as McpFilter[]).map((filterKey) => {
            const count = filterKey === 'all'
              ? stats.total
              : filterKey === 'needs_auth'
                ? stats.needsAuth + stats.needsClientRegistration
                : stats[filterKey as keyof typeof stats] as number;

            if (count === 0 && filterKey !== 'all') {
              return null;
            }

            const isActive = filter === filterKey;

            return (
              <button
                key={filterKey}
                type="button"
                onClick={() => setFilter(filterKey)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-accent border-muted-foreground/30 text-muted-foreground hover:text-foreground'
                )}
              >
                {FILTER_LABELS[filterKey]}
                <span
                  className={cn(
                    'flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full',
                    isActive
                      ? 'bg-white/20'
                      : 'bg-muted-foreground/20 text-muted-foreground'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Server list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {isLoading && filteredServers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <RiLoader4Line className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Loading MCP servers...</p>
            </div>
          ) : filteredServers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <RiPlug2Line className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No MCP servers found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Configure MCP servers in your OpenCode config
              </p>
            </div>
          ) : (
            filteredServers.map((server) => (
              <McpServerItem
                key={server.name}
                server={server}
                isToggling={togglingServer === server.name}
                isRetrying={retryingServer === server.name}
                onToggle={handleToggle}
                onRetry={handleRetry}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
