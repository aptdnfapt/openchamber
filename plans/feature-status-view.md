# Feature: Status View

## Overview

**Description**
Comprehensive status dashboard showing the health and state of the OpenCode system, including MCP servers, LSP servers, formatters, plugins, and other integrated services.

**OpenCode Terminal Implementation**
In TUI, users can open a "Status" dialog that shows:
- MCP servers count and connection states
- LSP servers count and active/inactive states
- Formatters list and enabled status
- Plugins list with versions
- Each item shows status icon and details

**Value Proposition**
Quickly diagnose system issues, see which services are healthy, and troubleshoot problems without diving into multiple screens or log files. Essential for advanced users managing complex setups.

---

## Web-Optimized Design

### UI Pattern

**Modal/Dialog overlay with tabbed sections**

Rationale:
- Status view is diagnostic, not primary workflow - modal is appropriate
- Tabbed sections separate concerns while keeping everything accessible
- Always accessible via Command Palette, not blocking main UI

Layout:
```
┌─────────────────────────────────────────┐
│  System Status                 [✕]      │
├─────────────────────────────────────────┤
│  ┌───┬──────────────┬────────────────┐  │
│  │MC │ MCP Servers │ LSP │ Formatters│  │ ← Tabs
│  │P  │    ● ● ○    │    │     ●     │  │   with status quick
│  └───┴──────────────┴────────────────┘  │      counts
│  │                                      │
│  │ ┌────────────────────────────────┐ │ ├── Section header
│  │ │ MCP Servers                      │ │ │
│  │ ├────────────────────────────────┤ │ │
│  │ │ ● 3 MCP Servers Online          │ │ │
│  │ │   (1 failed, 2 connected)        │ │ │
│  │ │                                 │ │ │
│  │ │ ● filesystem-api                │ │ │
│  │ │   Connected                     │ │ │
│  │ │   0.5s latency                  │ │ │
│  │ │                                 │ │ │
│  │ │ ○ database-connector            │ │ │
│  │ │   Failed - Connection timeout    │ │ │
│  │ │   [Retry] [Configure]           │ │ │
│  │ │                                 │ │ │
│  │ │ ● weather-service               │ │ │
│  │ │   Connected                     │ │ │
│  │ │   0.2s latency                  │ │ │
│  │ │                                 │ │ │
│  └────────────────────────────────┘ │ │
│                                       │ │
│  │ ┌────────────────────────────────┐ │ │
│  │ │ LSP Servers                      │ │ │
│  │ ├────────────────────────────────┤ │ │
│  │ │ ● 2 LSP Servers Active           │ │ │
│  │ │                                 │ │ │
│  │ │ ● TypeScript                     │ │ │
│  │ │   Connected                     │ │ │
│  │ │   Working directory: /src       │ │ │
│  │ │                                 │ │ │
│  │ │ ● Python                         │ │ │
│  │ │   Connected                     │ │ │
│  │ │   Working directory: /app       │ │ │
│  │ │                                 │ │ │
│  └────────────────────────────────┘ │ │
│                                       │
│  │ ┌────────────────────────────────┐ │
│  │ │ Formatters                       │ │ │
│  │ ├────────────────────────────────┤ │ │
│  │ │ ● 1 Formatter Enabled            │ │ │
│  │ │                                 │ │ │
│  │ │ ● Prettier                      │ │ │
│  │ │   Enabled - v3.2.5              │ │ │
│  │ │                                 │ │ │
│  └────────────────────────────────┘ │ │
│                                       │
│  │ ┌────────────────────────────────┐ │
│  │ │ Plugins                         │ │ │
│  │ ├────────────────────────────────┤ │ │
│  │ │ ● 2 Plugins Loaded               │ │ │
│  │ │                                 │ │ │
│  │ │ ● custom-script-plugin          │ │ │
│  │ │   Active                        │ │ │
│  │ │                                 │ │ │
│  │ │ ● database-tools                │ │ │
│  │ │   Active @2.1.0                 │ │ │
│  │ │                                 │ │ │
│  └────────────────────────────────┘ │ │
│                                       │
│              [Refresh] [Close]        │
└─────────────────────────────────────────┘
```

### User Workflow

**Open status view:**
1. User opens Command Palette (Ctrl+K)
2. Types "status" or selects "View System Status"
3. Status dialog opens showing all sections
4. Status refreshes automatically if visible

**Inspect MCP servers:**
1. In status view, click MCP tab
2. See list of all MCP servers with status icons
3. Failed servers show error details
4. Click "Retry" to reconnect
5. Click "Configure" to open MCP settings

**Inspect LSP servers:**
1. Click LSP tab
2. See which languages have active LSP servers
3. See working directory for each
4. Diagnostic counts if available (n/a from current API)

**Refresh status:**
1. Click "Refresh" button in dialog footer
2. Fetch latest status from backend
3. Update all sections with new data

### Web Advantages

- **Rich status indicators**: Color-coded badges with icons
- **Detailed tooltips**: Hover for more info (latency, version, etc.)
- **Collapsible sections**: Focus on what matters
- **Real-time updates**: Auto-refresh via SSE
- **Search across all items**: Find specific server/plugin
- **Status history**: Track when services go down/up (future)
- **Export status**: Copy full status for bug reports
- **Integration links**: Direct links to configure each service

### Mobile Considerations

- Full-screen dialog instead of tabbed modal
- Sections as separate slides/pages
- Swipe horizontally between tabs
- "View Status" floating action button
- Vertical scrollable list for each section
- Large touch targets for retry/configure buttons

---

## Technical Implementation

### Backend Requirements

**OpenCode API Check:**

Result:
- ✅ API exists: Multiple endpoints for status
  - `GET /mcp/status` - MCP servers (already checked)
  - LSP status via sync.data.lsp (likely SSE stream)
  - Formatters via sync.data.formatter
  - Plugins via config API

**Data sources:**
1. **MCP**: `/mcp/status` endpoint returns server map with status
2. **LSP**: Part of sync stream (`sync.data.lsp`)
3. **Formatters**: Part of sync stream (`sync.data.formatter`)
4. **Plugins**: Config API or sync stream

**Store Functions:**

Reuse/extend existing stores:
- `useMcpStore` - Already handling MCP status
- Create or extend for LSP/formatters/plugins

**Simplify**: Create a single `useSystemStatusStore` that aggregates from multiple sync data sources.

**File to create:**
- `/home/idc/proj/openchamber-wj/packages/ui/src/stores/useSystemStatusStore.ts`

Or extend existing:
- `/home/idc/proj/openchamber-wj/packages/ui/src/stores/useConfigStore.ts` (add system status section)

### Frontend Components

**New Components to Create:**

`StatusDialog.tsx` - Main status dialog with tabs:
- Tabbed interface (MCP, LSP, Formatters, Plugins)
- StatusCards for each item
- Overall status summary
- Refresh button
- Copy status for bug reports

`StatusCard.tsx` - Individual status item display:
- Status icon (color-coded)
- Name and version
- Status text and details
- Action buttons (Retry, Configure)
- Expandable for more details

`StatusSection.tsx` - Reusable section for each category:
- Section header with count
- List of StatusCards
- Empty state when no items
- Actions (Refresh all, Configure all)

`StatusTabs.tsx` - Tab navigation:
- Tab buttons with status badges
- Click to switch active tab
- Show count summaries (e.g., "MCPs ●●○")

`SystemStatusIndicator.tsx` - Small status summary (optional for header):
- Mini status showing overall system health
- Click to open full StatusDialog

**Existing Components to Modify:**

`CommandPalette.tsx` - Add "View System Status" command:
- New menu item
- Opens StatusDialog

`StatusRow.tsx` - Add quick link to status view:
- Add "System Status" link/icon in existing status row
- Shows mini SystemStatusIndicator

**Radix UI Primitives to Use:**
- `Dialog`, `DialogContent` for main dialog
- `Tabs`, `TabsList`, `TabsContent` for tabbed interface
- `AlertDialog` for confirmations
- `Tooltip`, `HoverCard` for details

**File Locations:**
```
packages/ui/src/stores/
  └── useSystemStatusStore.ts       (new)

packages/ui/src/components/status/  (new directory)
  ├── StatusDialog.tsx             (new)
  ├── StatusCard.tsx               (new)
  ├── StatusSection.tsx            (new)
  ├── StatusTabs.tsx               (new)
  └── SystemStatusIndicator.tsx    (new)

packages/ui/src/components/chat/
  └── StatusRow.tsx                (modify - add status link)

packages/ui/src/components/ui/
  └── CommandPalette.tsx            (modify - add status command)
```

### State Management

**Zustand Store:**
- New: `useSystemStatusStore`
- State:
  ```typescript
  interface SystemStatus {
    mcp: Map<string, McpServer>  // from useMcpStore or aggregated
    lsp: LspServer[]
    formatters: Formatter[]
    plugins: Plugin[]
    lastRefresh: number
    loading: boolean
  }

  interface SystemStatusStore {
    status: SystemStatus

    // Actions
    refreshAll(): Promise<void>
    getMcpStatus(): Promise<void>
    getLspStatus(): Promise<void>
    getFormatterStatus(): Promise<void>
    getPluginStatus(): Promise<void>
  }
  ```
- Data sources:
  - MCP: API call or sync stream
  - LSP: From sync.data.lsp (SSE)
  - Formatters: From sync.data.formatter (SSE)
  - Plugins: From config API or sync stream

---

## Edge Cases & Concerns

**Loading performance:**
- Fetching status from multiple sources could be slow
- **Solution**: Staggered loading, show spinners per section, cache results

**Data staleness:**
- Status might become outdated while dialog is open
- **Solution**: Auto-refresh via SSE, manual refresh button, show "last updated" timestamp

**Some APIs might not exist:**
- Plugin status might need config parsing, not direct API
- **Solution**: Gracefully handle missing sections, show "N/A" or "Not available"

**Mobile display:**
- Full-screen status might overwhelm
- **Solution**: Use collapsible sections, default to summary, tap for details

**Error handling:**
- What if all status endpoints fail?
- **Solution**: Show error state, offer retry, suggest checking backend logs

**Empty states:**
- No MCPs, no LSPs, etc.
- **Solution**: Helpful empty states with links to documentation/setup

**Real-time updates:**
- Should status dialog auto-update while open?
- **Solution**: Yes, subscribe to SSE streams, debounced updates every 5-10s

**User permissions:**
- Some users might not see all system info
- **Solution**: Filter based on permissions, show what's available

**Export for bug reports:**
- Users often need to share status when reporting issues
- **Solution**: "Copy Status" button formats as markdown for GitHub issues

---

## MVP vs Nice-to-Have

### MVP (Must-have)
- Status dialog with all 4 sections
- MCP status (connected/failed/disabled)
- LSP status (connected/disconnected)
- Formatters list
- Plugins list
- Status icons and descriptions
- Refresh button
- Access via Command Palette

### Nice-to-Have (Enhancements for Later)
- Status history/timeline (when services went down)
- Auto-refresh while dialog open
- Real-time latency metrics (MCP/LSP)
- Health scoring and alerts
- Service restart actions (not just reconnect)
- Detailed error logs per failed service
- Dependency graph (MCPs that depend on others)
- Configuration diff (what changed since last status)
- Export status as JSON/Markdown for bug reports
- Integration with monitoring/alerting services
- System resource usage (CPU, memory) summary
- Network connectivity check
- Quick actions bulk operations (restart all MCPs)
- Status notifications push to user (toast when service fails)
- User preferences for which sections to show
- Share status snapshot (generate URL)
- Compare status across time/different environments
