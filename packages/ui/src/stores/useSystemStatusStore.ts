import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { opencodeClient } from '@/lib/opencode/client';
import { getSafeStorage } from './utils/safeStorage';
import type { McpServer, McpServerStatus } from './useMcpStore';

// System Status Types
export type SystemStatus = 'connected' | 'error' | 'disabled' | 'unknown';

export interface LspServerStatus {
  id: string;
  name: string;
  root: string;
  status: 'connected' | 'error';
  lastChecked: number;
}

export interface FormatterItem {
  name: string;
  lastChecked: number;
}

export interface PluginItem {
  name: string;
  version?: string;
  enabled: boolean;
  lastChecked: number;
}

// Status aggregation state
export interface SystemStatusState {
  mcp: {
    servers: Record<string, McpServer>;
    lastRefresh: number | null;
    isLoading: boolean;
    error: string | null;
  };
  lsp: {
    servers: LspServerStatus[];
    lastRefresh: number | null;
    isLoading: boolean;
    error: string | null;
  };
  formatters: {
    items: FormatterItem[];
    lastRefresh: number | null;
    isLoading: boolean;
    error: string | null;
  };
  plugins: {
    items: PluginItem[];
    lastRefresh: number | null;
    isLoading: boolean;
    error: string | null;
  };
}

interface SystemStatusStore extends SystemStatusState {
  // Actions - Individual refreshes
  refreshMcpStatus: () => Promise<void>;
  refreshLspStatus: () => Promise<void>;
  refreshFormatterStatus: () => Promise<void>;
  refreshPluginStatus: () => Promise<void>;

  // Actions - Bulk operations
  refreshAll: () => Promise<void>;

  // Actions - Export
  getExportableStatus: () => string;
}

export const useSystemStatusStore = create<SystemStatusStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        mcp: {
          servers: {},
          lastRefresh: null,
          isLoading: false,
          error: null,
        },
        lsp: {
          servers: [],
          lastRefresh: null,
          isLoading: false,
          error: null,
        },
        formatters: {
          items: [],
          lastRefresh: null,
          isLoading: false,
          error: null,
        },
        plugins: {
          items: [],
          lastRefresh: null,
          isLoading: false,
          error: null,
        },

        // Refresh MCP status
        refreshMcpStatus: async () => {
          set((state) => ({ mcp: { ...state.mcp, isLoading: true, error: null } }));
          try {
            const client = opencodeClient.getApiClient();
            const result = await client.mcp.status({});
            if (result.data) {
              const servers: Record<string, McpServer> = {};
              for (const [name, status] of Object.entries(result.data)) {
                servers[name] = {
                  name,
                  status: status.status as McpServerStatus,
                  error: (status as { error?: string }).error,
                  lastChecked: Date.now(),
                };
              }
              set({
                mcp: {
                  servers,
                  lastRefresh: Date.now(),
                  isLoading: false,
                  error: null,
                },
              });
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch MCP status';
            set((state) => ({ mcp: { ...state.mcp, error: errorMessage, isLoading: false } }));
            console.error('[SystemStatusStore] Failed to fetch MCP status:', err);
          }
        },

        // Refresh LSP status
        refreshLspStatus: async () => {
          set((state) => ({ lsp: { ...state.lsp, isLoading: true, error: null } }));
          try {
            const client = opencodeClient.getApiClient();
            const result = await client.lsp.status({});
            if (result.data) {
              const servers: LspServerStatus[] = result.data.map((lsp) => ({
                id: lsp.id,
                name: lsp.name,
                root: lsp.root,
                status: lsp.status as 'connected' | 'error',
                lastChecked: Date.now(),
              }));
              set({
                lsp: {
                  servers,
                  lastRefresh: Date.now(),
                  isLoading: false,
                  error: null,
                },
              });
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch LSP status';
            set((state) => ({ lsp: { ...state.lsp, error: errorMessage, isLoading: false } }));
            console.error('[SystemStatusStore] Failed to fetch LSP status:', err);
          }
        },

        // Refresh Formatter status
        refreshFormatterStatus: async () => {
          set((state) => ({ formatters: { ...state.formatters, isLoading: true, error: null } }));
          try {
            const client = opencodeClient.getApiClient();
            const result = await client.formatter.status({});
            if (result.data) {
              const items: FormatterItem[] = result.data.map((fmt) => ({
                name: fmt.name,
                lastChecked: Date.now(),
              }));
              set({
                formatters: {
                  items,
                  lastRefresh: Date.now(),
                  isLoading: false,
                  error: null,
                },
              });
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch formatter status';
            set((state) => ({ formatters: { ...state.formatters, error: errorMessage, isLoading: false } }));
            console.error('[SystemStatusStore] Failed to fetch formatter status:', err);
          }
        },

        // Refresh Plugin status
        refreshPluginStatus: async () => {
          set((state) => ({ plugins: { ...state.plugins, isLoading: true, error: null } }));
          try {
            const client = opencodeClient.getApiClient();
            // Try to get plugin config/status
            const result = await client.config.get({});
            if (result.data?.plugin) {
              // plugin is an array of strings - names of enabled plugins
              const items: PluginItem[] = (result.data.plugin as string[]).map((name) => ({
                name,
                enabled: true,
                lastChecked: Date.now(),
              }));
              set({
                plugins: {
                  items,
                  lastRefresh: Date.now(),
                  isLoading: false,
                  error: null,
                },
              });
            } else {
              // No plugins configured
              set({
                plugins: {
                  items: [],
                  lastRefresh: Date.now(),
                  isLoading: false,
                  error: null,
                },
              });
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch plugin status';
            set((state) => ({ plugins: { ...state.plugins, error: errorMessage, isLoading: false } }));
            console.error('[SystemStatusStore] Failed to fetch plugin status:', err);
          }
        },

        // Refresh all status
        refreshAll: async () => {
          await Promise.all([
            get().refreshMcpStatus(),
            get().refreshLspStatus(),
            get().refreshFormatterStatus(),
            get().refreshPluginStatus(),
          ]);
        },

        // Export status as markdown for bug reports
        getExportableStatus: () => {
          const { mcp, lsp, formatters, plugins } = get();
          const timestamp = new Date().toISOString();

          let markdown = `# System Status Report\n\n`;
          markdown += `**Generated:** ${timestamp}\n\n`;

          // MCP Section
          markdown += `## MCP Servers\n\n`;
          const mcpEntries = Object.values(mcp.servers);
          if (mcpEntries.length === 0) {
            markdown += `No MCP servers configured.\n\n`;
          } else {
            markdown += `**Total:** ${mcpEntries.length}\n`;
            markdown += `**Connected:** ${mcpEntries.filter((s) => s.status === 'connected').length}\n`;
            markdown += `**Failed:** ${mcpEntries.filter((s) => s.status === 'failed').length}\n`;
            markdown += `**Disabled:** ${mcpEntries.filter((s) => s.status === 'disabled').length}\n\n`;

            mcpEntries.forEach((server) => {
              markdown += `- **${server.name}**: ${server.status}`;
              if (server.error) {
                markdown += ` - Error: ${server.error}`;
              }
              markdown += `\n`;
            });
            markdown += `\n`;
          }

          // LSP Section
          markdown += `## LSP Servers\n\n`;
          if (lsp.servers.length === 0) {
            markdown += `No LSP servers running.\n\n`;
          } else {
            markdown += `**Total:** ${lsp.servers.length}\n`;
            markdown += `**Connected:** ${lsp.servers.filter((s) => s.status === 'connected').length}\n`;
            markdown += `**Error:** ${lsp.servers.filter((s) => s.status === 'error').length}\n\n`;

            lsp.servers.forEach((server) => {
              markdown += `- **${server.name}**: ${server.status}\n`;
              markdown += `  - Root: ${server.root}\n`;
            });
            markdown += `\n`;
          }

          // Formatters Section
          markdown += `## Formatters\n\n`;
          if (formatters.items.length === 0) {
            markdown += `No formatters configured.\n\n`;
          } else {
            markdown += `**Total:** ${formatters.items.length}\n\n`;
            formatters.items.forEach((fmt) => {
              markdown += `- ${fmt.name}\n`;
            });
            markdown += `\n`;
          }

          // Plugins Section
          markdown += `## Plugins\n\n`;
          if (plugins.items.length === 0) {
            markdown += `No plugins configured.\n\n`;
          } else {
            markdown += `**Total:** ${plugins.items.length}\n`;
            markdown += `**Enabled:** ${plugins.items.filter((p) => p.enabled).length}\n\n`;
            plugins.items.forEach((plugin) => {
              markdown += `- **${plugin.name}**: `;
              markdown += plugin.enabled ? '✅ Enabled' : '❌ Disabled';
              if (plugin.version) {
                markdown += ` (v${plugin.version})`;
              }
              markdown += `\n`;
            });
            markdown += `\n`;
          }

          return markdown;
        },
      }),
      {
        name: 'system-status-store',
        storage: createJSONStorage(() => getSafeStorage()),
        partialize: (state) => ({
          // Only persist lastRefresh timestamps, data is always refreshed
          mcp: { lastRefresh: state.mcp.lastRefresh },
          lsp: { lastRefresh: state.lsp.lastRefresh },
          formatters: { lastRefresh: state.formatters.lastRefresh },
          plugins: { lastRefresh: state.plugins.lastRefresh },
        }),
      },
    ),
    {
      name: 'system-status-store',
    },
  ),
);

// Helper to get overall system health
export const getSystemHealth = (state: SystemStatusState): 'healthy' | 'degraded' | 'offline' => {
  const mcpValues = Object.values(state.mcp.servers);
  const mcpHasFailed = mcpValues.some((s) => s.status === 'failed');
  const mcpHasConnected = mcpValues.some((s) => s.status === 'connected');

  const lspHasFailed = state.lsp.servers.some((s) => s.status === 'error');
  const lspHasConnected = state.lsp.servers.some((s) => s.status === 'connected');

  // Offline: nothing is connected
  if (!mcpHasConnected && !lspHasConnected) {
    return 'offline';
  }

  // Degraded: at least one has failed
  if (mcpHasFailed || lspHasFailed) {
    return 'degraded';
  }

  // Healthy: everything is connected
  return 'healthy';
};
