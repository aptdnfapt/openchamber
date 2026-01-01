import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { opencodeClient } from '@/lib/opencode/client';
import { getSafeStorage } from './utils/safeStorage';

// MCP Status types from OpenCode SDK
export type McpServerStatus =
  | 'connected'
  | 'disabled'
  | 'failed'
  | 'needs_auth'
  | 'needs_client_registration';

export interface McpServer {
  name: string;
  status: McpServerStatus;
  error?: string;
  lastChecked: number;
}

type McpStatusData = Record<string, McpServer>;

interface McpStore {
  mcpServers: McpStatusData;
  isLoading: boolean;
  lastRefresh: number | null;
  error: string | null;

  // Actions
  fetchMcpStatus: () => Promise<void>;
  toggleMcp: (name: string, enabled: boolean) => Promise<void>;
  retryMcp: (name: string) => Promise<void>;
  configureMcp: (name: string) => void;
  clearError: () => void;
}

export const useMcpStore = create<McpStore>()(
  devtools(
    persist(
      (set, get) => ({
        mcpServers: {},
        isLoading: false,
        lastRefresh: null,
        error: null,

        fetchMcpStatus: async () => {
          set({ isLoading: true, error: null });
          try {
            const client = opencodeClient.getApiClient();
            const result = await client.mcp.status({});
            if (result.data) {
              // Transform SDK response to our format
              const servers: McpStatusData = {};
              for (const [name, status] of Object.entries(result.data)) {
                servers[name] = {
                  name,
                  status: status.status,
                  error: (status as { error?: string }).error,
                  lastChecked: Date.now(),
                };
              }
              set({ mcpServers: servers, lastRefresh: Date.now(), isLoading: false });
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch MCP status';
            set({ error: errorMessage, isLoading: false });
            console.error('[MCP Store] Failed to fetch status:', err);
          }
        },

        toggleMcp: async (name: string, enabled: boolean) => {
          try {
            const client = opencodeClient.getApiClient();
            const mcp = client.mcp as unknown as { connect: (params: { name: string }) => Promise<unknown>; disconnect: (params: { name: string }) => Promise<unknown> };
            if (enabled) {
              await mcp.connect({ name });
            } else {
              await mcp.disconnect({ name });
            }
            // Refresh status after toggle
            await get().fetchMcpStatus();
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `Failed to ${enabled ? 'enable' : 'disable'} MCP server`;
            set({ error: errorMessage });
            console.error('[MCP Store] Failed to toggle MCP:', err);
            throw err;
          }
        },

        retryMcp: async (name: string) => {
          try {
            const client = opencodeClient.getApiClient();
            const mcp = client.mcp as unknown as { connect: (params: { name: string }) => Promise<unknown> };
            await mcp.connect({ name });
            // Refresh status after retry
            await get().fetchMcpStatus();
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to retry MCP server';
            set({ error: errorMessage });
            console.error('[MCP Store] Failed to retry MCP:', err);
            throw err;
          }
        },

        configureMcp: (name: string) => {
          // Open settings dialog or navigate to config
          // This is a placeholder - actual implementation may vary
          console.log('[MCP Store] Configure MCP:', name);
          // TODO: Implement configuration handling
        },

        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'mcp-store',
        storage: createJSONStorage(() => getSafeStorage()),
        partialize: (state) => ({
          // Persist minimal state, status will be refreshed on load
          lastRefresh: state.lastRefresh,
        }),
      },
    ),
    {
      name: 'mcp-store',
    },
  ),
);

// Helper to get MCP stats for UI
export const getMcpStats = (servers: McpStatusData) => {
  const entries = Object.values(servers);
  return {
    total: entries.length,
    connected: entries.filter((s) => s.status === 'connected').length,
    failed: entries.filter((s) => s.status === 'failed').length,
    disabled: entries.filter((s) => s.status === 'disabled').length,
    needsAuth: entries.filter((s) => s.status === 'needs_auth').length,
    needsClientRegistration: entries.filter((s) => s.status === 'needs_client_registration').length,
  };
};
