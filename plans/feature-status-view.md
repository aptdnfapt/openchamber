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

**Modal dialog with tabs (reusing existing patterns)**

Rationale: Status view is diagnostic → modal dialog with tabbed sections
- Reuse `Dialog` component (Radix UI)
- Reuse `Tabs` pattern from existing settings pages
- Command Palette entry for quick access

Layout (desktop):
```
┌─────────────────────────────────────────┐
│  System Status                 [✕]      │
├─────────────────────────────────────────┤
│  [MCP ●●○] [LSP ●●] [Fmt ●] [Plugins ●●]│ ← Tab bar with counts
├─────────────────────────────────────────┤
│                                       │
│  ┌─────────────────────────────────┐   │
│  │ MCP Servers                     │   │
│  ├─────────────────────────────────┤   │
│  │ ● 3 MCP Servers Online          │   │
│  │   (1 failed, 2 connected)       │   │
│  │                                 │   │
│  │ ● filesystem-api          [✓]  │   │ ← Status card
│  │   Connected  ·  0.5s latency    │   │
│  │                                 │   │
│  │ ○ database-connector       [✗]  │   │
│  │   Failed - Connection timeout   │   │
│  │   [Retry]  [Configure]          │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                       │
│              [Refresh]  [Copy]  [Close]│ ← Footer buttons
└─────────────────────────────────────────┘
```

**Implementation patterns:**
- Reuse `SettingsPage.tsx` tab patterns (Radix Tabs)
- Reuse `StatusRow.tsx` status badge patterns
- Reuse `SettingsSidebarItem.tsx` for server cards

### User Workflow

**Trigger:** Command Palette (Ctrl+K → "System Status") or Settings → "Status"

**Open status view:**
1. Ctrl+K → Type "status" → Select "View System Status"
2. Dialog opens with default tab (last selected or MCP)
3. Status auto-refreshes every 5 seconds (configurable)

**Navigate sections:**
1. **Tab bar:** Click tab (MCP, LSP, Formatters, Plugins)
2. **Badges:** Each tab shows status counts (e.g., "MCP ●●○")
3. **Quick scan:** Summary in each tab header

**Inspect items:**
1. Each server/plugin shows:
   - Name + version
   - Status badge (Connected/Failed/Disabled)
   - Details: latency, directory, error message
2. **Failed items:** Show error details (expandable)
3. **Actions:** Retry, Configure buttons (context-dependent)

**Refresh status:**
1. Click "Refresh" button (footer)
2. Loading state: tabs gray out, spinner appears
3. Updated data appears with fade-in animation

**Export for bug reports:**
1. Click "Copy Status" button (footer)
2. Formats as Markdown (ready for GitHub issues)
3. Toast: "Status copied to clipboard"

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

**Implementation:** Reuse existing mobile patterns

- **Full-screen dialog:**
  - Use `MobileOverlayPanel` (full-height)
  - Tab bar at top (scrollable if many tabs)
  - Swipe left/right between tabs (carousel)
  - Back button returns to previous tab

- **Status cards:**
  - Larger touch targets (48x48px buttons)
  - Full-width cards
  - Visible actions (Retry, Configure)
  - Expandable error details (tap to expand)

- **FAB (Floating Action Button):**
  - "View Status" button (bottom right corner)
  - Shows when status has issues (red badge)
  - Opens StatusView immediately

- **Performance:**
  - Lazy load sections (load only active tab)
  - Debounced refresh (max once per 10s)
  - Virtual scroll for long lists

- **Export:**
  - "Copy Status" button in footer
  - Toast confirmation (longer duration)
  - Ready for sharing

---

## Technical Implementation

### Backend Requirements

**OpenCode API Check:**

Result:
- ✅ APIs exist for all status types (mostly via sync stream)

**Data sources:**
1. **MCP**: `GET /mcp.status` or `sync.data.mcp`
2. **LSP**: `sync.data.lsp` (SSE stream)
3. **Formatters**: `sync.data.formatter` (SSE stream)
4. **Plugins**: `config.get('plugins')` or `sync.data.plugins`

**Store Functions:**

**Create `useSystemStatusStore`** (aggregate from multiple sources):
```typescript
interface SystemStatus {
  mcp: {
    servers: Map<string, McpServerStatus>;
    lastRefresh: number;
    isLoading: boolean;
  };
  lsp: {
    servers: Map<string, LspServerStatus>;
    lastRefresh: number;
    isLoading: boolean;
  };
  formatters: {
    items: Map<string, FormatterStatus>;
    lastRefresh: number;
    isLoading: boolean;
  };
  plugins: {
    items: Map<string, PluginStatus>;
    lastRefresh: number;
    isLoading: boolean;
  };
}

interface SystemStatusStore {
  status: SystemStatus;
  
  // Actions
  refreshAll(): Promise<void>
  refreshMcp(): Promise<void>
  refreshLsp(): Promise<void>
  refreshFormatters(): Promise<void>
  refreshPlugins(): Promise<void>
  getExportableStatus(): string  // Markdown for bug reports
}
```

**Integration with sync streams:**
```typescript
// Subscribe to all sync data types
sync.on('data.mcp', (data) => useSystemStatusStore.getState().updateMcp(data));
sync.on('data.lsp', (data) => useSystemStatusStore.getState().updateLsp(data));
sync.on('data.formatter', (data) => useSystemStatusStore.getState().updateFormatters(data));
sync.on('data.plugins', (data) => useSystemStatusStore.getState().updatePlugins(data));
```

**File to create:**
- `/home/idc/proj/openchamber-wj/packages/ui/src/stores/useSystemStatusStore.ts`

**Alternative:** Could reuse/extend `useMcpStore` for MCP data

### Frontend Components

**New Components to Create:**

1. **StatusDialog.tsx** - Main dialog:
   - Reuse `Dialog` component (Radix UI)
   - Reuse `Tabs` pattern from Settings pages
   - Max width: `max-w-[600px]` (larger than standard dialog)
   - Footer: Refresh, Copy, Close buttons
   - Loading states (skeleton screens)

2. **StatusTabs.tsx** - Tab navigation:
   - Reuse `animated-tabs.tsx` pattern
   - Tab badges showing status counts (e.g., "MCP ●●○")
   - Color-coded badges (green/red/gray)

3. **StatusSection.tsx** - Reusable section for each category:
   - Header: Title + count badge
   - List: StatusCard components
   - Empty state: "No MCP servers configured"
   - Footer: "Refresh all" button

4. **StatusCard.tsx** - Individual item display:
   - Reuse `SettingsSidebarItem.tsx` pattern
   - Status badge (color-coded chip)
   - Name + version/info
   - Action buttons (Retry, Configure) - context-dependent
   - Expandable for error details

5. **StatusExportButton.tsx** - Copy for bug reports:
   - Formats status as Markdown
   - Toast: "Status copied to clipboard"
   - Ready for GitHub issues

**Existing Components to Modify:**

1. **CommandPalette.tsx** - Add command:
   ```typescript
   <CommandGroup heading="System">
     <CommandItem onSelect={handleOpenStatus}>
       <RiDashboard3Line className="mr-2 h-4 w-4" />
       <span>System Status</span>
       <CommandShortcut>Ctrl+Shift+S</CommandShortcut>
     </CommandItem>
   </CommandGroup>
   ```

2. **StatusRow.tsx** - Add status link:
   - Add "Status" link in status row (line 227)
   - Click opens StatusDialog
   - Could show mini indicator (optional)

**Radix UI Primitives to Use:**
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`
- `Tabs`, `TabsList`, `TabsContent` (from `@/components/ui/tabs`)
- `ScrollArea` for section content (existing pattern)

**File Locations:**
```
packages/ui/src/stores/
  └── useSystemStatusStore.ts       (new)

packages/ui/src/components/status/  (new directory)
  ├── StatusDialog.tsx             (new)
  ├── StatusTabs.tsx               (new)
  ├── StatusSection.tsx            (new)
  ├── StatusCard.tsx               (new)
  ├── StatusExportButton.tsx       (new)

packages/ui/src/components/ui/
  ├── CommandPalette.tsx           (modify - add command)
packages/ui/src/components/chat/
  └── StatusRow.tsx                (modify - add status link)
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
- "Copy Status" formats as Markdown (GitHub-ready)
- Includes all sections, versions, errors
- Toast confirmation on copy

---

### Accessibility (A11y)

**Keyboard navigation:**
- `Ctrl+Shift+S`: Open status dialog (global)
- `Esc`: Close dialog
- `Tab` through sections, cards, buttons
- Arrow keys within tab bar

**ARIA attributes:**
- Dialog: `role="dialog"`, `aria-modal="true"`, `aria-label="System Status"`
- Tabs: `role="tablist"`, `role="tab"`, `aria-selected`
- Cards: Proper heading structure (h3 for server name)
- Status badges: `aria-label="Status: Connected"`

**Focus management:**
- Focus moves to dialog on open
- Focus returns to trigger on close
- Focus trap within dialog

**Screen readers:**
- Tab counts announced: "MCP tab, 3 servers, 2 connected"
- Status changes announced: "filesystem-api connected"
- Export announcement: "Status copied to clipboard"

---

## MVP vs Nice-to-Have

### MVP (Must-have)
- ✅ Status dialog with all 4 sections
- ✅ MCP status (connected/failed/disabled)
- ✅ LSP status (connected/disconnected)
- ✅ Formatters list
- ✅ Plugins list
- ✅ Status badges + descriptions
- ✅ Refresh button (manual)
- ✅ Command Palette access (Ctrl+Shift+S)
- ✅ Export for bug reports (Copy Markdown)
- ✅ Real-time updates (SSE)

### Nice-to-Have (Enhancements for Later)
- Status history/timeline
- Auto-refresh while open (configurable interval)
- Latency metrics (MCP/LSP response times)
- Health scoring + alerts
- Service restart actions
- Detailed error logs
- Dependency visualization
- Configuration diff
- Integration with monitoring tools
- System resource usage (CPU, memory)
- Network connectivity check
- Bulk operations (restart all)
- Push notifications (toast on failure)
- User preferences (show/hide sections)
- Share via URL
- Status comparison across time
