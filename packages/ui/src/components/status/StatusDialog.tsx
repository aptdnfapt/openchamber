import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusTabs, type StatusTabValue } from './StatusTabs';
import { StatusSection } from './StatusSection';
import { McpStatusCard, LspStatusCard, StatusCard } from './StatusCard';
import { StatusExportButton } from './StatusExportButton';
import { Button } from '@/components/ui/button';
import { RiRefreshLine } from '@remixicon/react';
import { useSystemStatusStore } from '@/stores/useSystemStatusStore';
import { cn } from '@/lib/utils';

export interface StatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StatusDialog: React.FC<StatusDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [activeTab, setActiveTab] = React.useState<StatusTabValue>('mcp');
  const {
    mcp,
    lsp,
    formatters,
    plugins,
    refreshMcpStatus,
    refreshLspStatus,
    refreshFormatterStatus,
    refreshPluginStatus,
    refreshAll,
    getExportableStatus,
  } = useSystemStatusStore();

  // Refresh status when dialog opens
  React.useEffect(() => {
    if (open && mcp.lastRefresh === null) {
      void refreshAll();
    }
  }, [open, mcp.lastRefresh, refreshAll]);

  const handleRefreshAll = () => {
    void refreshAll();
  };

  const mcpCount = Object.keys(mcp.servers).length;
  const lspCount = lsp.servers.length;
  const formatterCount = formatters.items.length;
  const pluginCount = plugins.items.length;

  const counts = {
    mcp: mcpCount,
    lsp: lspCount,
    formatters: formatterCount,
    plugins: pluginCount,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[80vh] flex flex-col p-0 gap-0"
        showCloseButton={true}
      >
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>System Status</DialogTitle>
          </div>
          <StatusTabs
            value={activeTab}
            onValueChange={setActiveTab}
            counts={counts}
            className="mt-4"
          />
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {activeTab === 'mcp' && (
            <StatusSection
              title="MCP Servers"
              count={mcpCount}
              countLabel={mcpCount === 1 ? 'server' : 'servers'}
              isLoading={mcp.isLoading}
              error={mcp.error}
              onRefresh={refreshMcpStatus}
              emptyMessage="No MCP servers configured"
            >
              {Object.values(mcp.servers).map((server) => (
                <McpStatusCard
                  key={server.name}
                  server={server}
                  onRetry={() => {
                    void refreshMcpStatus();
                  }}
                />
              ))}
            </StatusSection>
          )}

          {activeTab === 'lsp' && (
            <StatusSection
              title="LSP Servers"
              count={lspCount}
              countLabel={lspCount === 1 ? 'server' : 'servers'}
              isLoading={lsp.isLoading}
              error={lsp.error}
              onRefresh={refreshLspStatus}
              emptyMessage="No LSP servers running"
            >
              {lsp.servers.map((server) => (
                <LspStatusCard key={server.id} server={server} />
              ))}
            </StatusSection>
          )}

          {activeTab === 'formatters' && (
            <StatusSection
              title="Formatters"
              count={formatterCount}
              countLabel={formatterCount === 1 ? 'formatter' : 'formatters'}
              isLoading={formatters.isLoading}
              error={formatters.error}
              onRefresh={refreshFormatterStatus}
              emptyMessage="No formatters configured"
            >
              {formatters.items.map((fmt, idx) => (
                <StatusCard
                  key={`${fmt.name}-${idx}`}
                  name={fmt.name}
                  status="connected"
                  details={`Last checked: ${new Date(fmt.lastChecked).toLocaleTimeString()}`}
                />
              ))}
            </StatusSection>
          )}

          {activeTab === 'plugins' && (
            <StatusSection
              title="Plugins"
              count={pluginCount}
              countLabel={pluginCount === 1 ? 'plugin' : 'plugins'}
              isLoading={plugins.isLoading}
              error={plugins.error}
              onRefresh={refreshPluginStatus}
              emptyMessage="No plugins configured"
            >
              {plugins.items.map((plugin) => (
                <StatusCard
                  key={plugin.name}
                  name={plugin.name}
                  status={plugin.enabled ? 'connected' : 'disabled'}
                  details={
                    <div className="space-y-1">
                      <div>
                        <span className="font-medium">Status:</span>{' '}
                        {plugin.enabled ? 'Enabled' : 'Disabled'}
                      </div>
                      {plugin.version && (
                        <div>
                          <span className="font-medium">Version:</span> v{plugin.version}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Last checked:</span>{' '}
                        {new Date(plugin.lastChecked).toLocaleString()}
                      </div>
                    </div>
                  }
                />
              ))}
            </StatusSection>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground typography-meta">
              {mcp.lastRefresh && (
                `Last updated: ${new Date(mcp.lastRefresh).toLocaleTimeString()}`
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefreshAll}
                disabled={
                  mcp.isLoading || lsp.isLoading || formatters.isLoading || plugins.isLoading
                }
              >
                <RiRefreshLine
                  className={cn(
                    'mr-2',
                    (mcp.isLoading || lsp.isLoading || formatters.isLoading || plugins.isLoading) &&
                      'animate-spin'
                  )}
                  size={16}
                />
                Refresh All
              </Button>
              <StatusExportButton
                getStatusContent={getExportableStatus}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
