# Feature: MCP Management (Model Context Protocol)

## Overview

**Description**
View and manage MCP (Model Context Protocol) servers - external tools that provide additional capabilities to the AI assistant. Enable/disable MCP servers, view their status, and troubleshoot connection issues.

**OpenCode Terminal Implementation**
In TUI, users press keybind to open MCP status dialog showing all configured MCP servers with their connection states (connected, failed, disabled, needs auth, needs client registration). Users can toggle MCP enablement with spacebar.

**Value Proposition**
MCP servers extend AI capabilities with external tools like databases, APIs, file systems, etc. Being able to manage them without leaving OpenCode simplifies the workflow and allows quick troubleshooting of connection issues.

---

## Web-Optimized Design

### UI Pattern

**Sidebar tab + status indicator (reusing existing patterns)**

Rationale: MCP is secondary information → sidebar tab + status bar
- **Status bar**: Quick overview (connected/failed counts)
- **Sidebar tab**: Detailed management (like existing session sidebar tabs)
- **Settings page alternative**: Like "Providers" section (existing pattern)

Layout (desktop):
```
┌─────────────────────────────────────────┐
│  Chat │ Diff │ Git │ Terminal  [Settings]│
├───────────────┬───────────────┬─────────┤
│               │               │ MCP ●●○ │ ← Status indicator
│   Chat        │    Diff       │ LSP ●   │   (color-coded badges)
│   area        │    area       │─────────┤
│               │               │         │
├───────────────┴───────────────┤         │
│  Session Sidebar              │ MCPs    │ ← Tab content
│  [Sessions│MCPs│Git]          │─────────│
│  ─────────────────            │ ● filesystem-api │
│  - Today                      │   Connected ✓   │ ← Status badge
│    - Session 1                │   [Disable]     │
│    - Session 2                │                 │
│                                │ ○ database-connector │
│                                │   Failed ✗       │
│                                │   [Retry] [Config]│
│                                │                 │
│                                │ ○ weather-service │
│                                │   Disabled -     │
│                                │   [Enable]       │
└─────────────────────────────────────────┘
```

**Implementation patterns:**
- Reuse `SessionSidebar.tsx` tab structure
- Reuse `StatusRow.tsx` status badge patterns
- Reuse `SettingsSidebarItem.tsx` for server list items

### User Workflow

**Trigger:** Status bar indicator, sidebar tab, or Command Palette (Ctrl+K → "MCP Status")

**View MCP status:**
1. **Quick view:** Status bar shows summary (e.g., "MCP ●●○")
   - Green ● = Connected
   - Red ● = Failed  
   - Gray ○ = Disabled
   - Click to open sidebar tab
2. **Full view:** Sidebar MCP tab shows:
   - Grouped by status (Connected, Failed, Disabled)
   - Each server card with name, status badge, description
   - Action buttons based on status
   - Error details on hover/click

**Toggle server (enable/disable):**
1. Click toggle button on server card
2. Loading spinner (button disabled)
3. Toast notification: "Enabled filesystem-api" / "Disabled filesystem-api"
4. Status badge updates immediately
5. Auto-refresh status (SSE)

**Fix failed server:**
1. Failed server shows error badge + "Retry" button
2. Click "Retry" → Loading → Success/Failure toast
3. Hover/click for error details (full error message)
4. Click "Configure" → Opens settings or file editor

**Real-time updates:**
- Status indicator updates automatically (SSE stream)
- Failed servers trigger browser notification (optional)
- Toast: "Connection restored - filesystem-api"

### Web Advantages

- **Status badges**: Color-coded status indicators (green connected, red failed, gray disabled)
- **Quick actions**: Enable/disable with one click
- **Real-time updates**: SSE streams update MCP status in real-time
- **Group by status**: "Connected" section, "Failed" section for easy scanning
- **Search/filter**: Filter MCP servers by name
- **Detailed error messages**: Hover over failed servers to see error details
- **Configuration links**: Direct links to configuration when needed
- **Batch actions**: Toggle all MCPs or filter by status for bulk operations

### Mobile Considerations

**Implementation:** Reuse existing mobile patterns

- **MCP panel as bottom sheet:**
  - Use `MobileOverlayPanel` (same as SessionDialogs)
  - Full-height: `contentMaxHeightClassName="h-[calc(100vh-4rem)]"`
  - Swipe down to dismiss (built-in)
  - Fixed "Add MCP" button at top

- **Server cards:**
  - Larger touch targets: 48x48px for buttons
  - Full-width cards for better visibility
  - Status badges more visible (larger chips)

- **Status indicator:**
  - Top bar icon badge (smaller than desktop)
  - Tap to open bottom sheet
  - Badge color visible at small size

- **Pull-to-refresh:**
  - Server list supports pull-to-refresh (mobile pattern)
  - Shows spinner, updates indicator

- **Error handling:**
  - Expandable cards (tap to expand)
  - Error messages larger text
  - "Copy" button for bug reports (easier on mobile)

---

## Technical Implementation

### Backend Requirements

**OpenCode API Check:**

Result:
- ✅ API exists: `mcp.status` → Implement UI primarily
- Status via sync stream: `sync.data.mcp` events

API endpoints:
- `GET /mcp/status` - Returns map of server statuses
- Status types: `connected | failed | disabled | needs_auth | needs_client_registration`
- Failed: includes error message

**Store Functions:**

**Create `useMcpStore`** (new store, follow existing patterns):
```typescript
interface McpServer {
  name: string;
  status: McpServerStatus;
  error?: string;
  lastChecked: number;
  latency?: number;  // Connection latency in ms
}

interface McpStore {
  servers: Map<string, McpServer>;
  isLoading: boolean;
  lastRefresh: number | null;
  
  // Actions
  fetchStatus(): Promise<void>
  toggleServer(name: string, enabled: boolean): Promise<void>
  retryServer(name: string): Promise<void>
  configureServer(name: string): void  // Open config file
  clearError(name: string): void
}
```

**Integration with sync stream:**
```typescript
// Subscribe to SSE events in app initialization
sync.on('data.mcp', (update) => {
  useMcpStore.getState().handleMcpUpdate(update);
});
```

**File to create:**
- `/home/idc/proj/openchamber-wj/packages/ui/src/stores/useMcpStore.ts`

**Alternative consideration:** Could extend `useConfigStore`, but separate store cleaner for async status

### Frontend Components

**New Components to Create:**

1. **McpStatusIndicator.tsx** - Status bar badge:
   - Reuse `StatusRow.tsx` pattern (lines 173-197)
   - Clickable badge showing counts: "●●○"
   - Color-coded (green/red/gray)
   - Tooltip with full status summary
   - Animation on status change

2. **McpPanel.tsx** - Sidebar tab content:
   - Reuse `SessionSidebar.tsx` tab content patterns
   - Search input (reuse `CommandPalette.tsx` input)
   - Filter tabs: All | Connected | Failed | Disabled
   - Server list with group headers
   - Refresh button (loading state)

3. **McpServerItem.tsx** - Individual server card:
   - Reuse `SettingsSidebarItem.tsx` pattern
   - Status badge (color-coded chip)
   - Name + description
   - Action buttons based on status:
     - Connected: Disable (Switch)
     - Failed: Retry, Configure
     - Disabled: Enable
   - Expandable error details

4. **McpErrorTooltip.tsx** - Error details on hover:
   - Reuse `Tooltip` component (existing patterns)
   - Full error message, timestamp
   - "Copy error" button for bug reports

**Existing Components to Modify:**

1. **SessionSidebar.tsx** - Add MCP tab:
   ```typescript
   // Add tab configuration
   { id: 'mcp', label: 'MCP', icon: RiPlug2Line, badge: mcpFailureCount }
   ```
   - Shows McpPanel when tab selected
   - Badge showing failed count

2. **StatusRow.tsx** - Add MCP indicator:
   - Add `McpStatusIndicator` to right side (line 227)
   - Only show when MCP servers exist
   - Click to open sidebar MCP tab

3. **CommandPalette.tsx** - Add commands:
   ```typescript
   <CommandGroup heading="System">
     <CommandItem onSelect={handleOpenMcpStatus}>
       <RiPlug2Line className="mr-2 h-4 w-4" />
       <span>MCP Status</span>
       <CommandShortcut>Ctrl+Shift+M</CommandShortcut>
     </CommandItem>
   </CommandGroup>
   ```

**Radix UI Primitives to Use:**
- `Switch` (from `@/components/ui/switch`) for enable/disable
- `Tooltip` (existing) for error details
- `ScrollArea` for server list (existing pattern)

**File Locations:**
```
packages/ui/src/stores/
  └── useMcpStore.ts               (new)

packages/ui/src/components/mcp/    (new directory - follows chat/ pattern)
  ├── McpStatusIndicator.tsx        (new)
  ├── McpPanel.tsx                 (new)
  ├── McpServerItem.tsx            (new)
  ├── McpErrorTooltip.tsx          (new)

packages/ui/src/components/session/
  └── SessionSidebar.tsx           (modify - add MCP tab)

packages/ui/src/components/chat/
  └── StatusRow.tsx                (modify - add indicator)

packages/ui/src/components/ui/
  └── CommandPalette.tsx           (modify - add commands)
```
packages/ui/src/stores/
  ├── useMcpStore.ts               (new, for MCP state)

packages/ui/src/components/mcp/    (new directory)
  ├── McpStatusIndicator.tsx        (new)
  ├── McpPanel.tsx                 (new)
  ├── McpServerItem.tsx            (new)
  ├── McpStatusDialog.tsx          (new)

packages/ui/src/components/chat/
  ├── StatusRow.tsx                (modify - add MCP indicator)

packages/ui/src/components/
  ├── session/SessionSidebar.tsx   (modify - add MCP tab)
  └── ui/CommandPalette.tsx        (modify - add MCP command)
```

### State Management

**Zustand Store:**
- New: `useMcpStore`
- State:
  ```typescript
  type McpServerStatus = 'connected' | 'failed' | 'disabled' | 'needs_auth' | 'needs_client_registration'

  type McpServer = {
    name: string
    status: McpServerStatus
    error?: string
  }

  interface McpStore {
    mcpServers: Map<string, McpServer>
    loading: boolean
    lastRefresh: number

    // Actions
    fetchMcpStatus(): Promise<void>
    toggleMcp(name: string, enabled: boolean): Promise<void>
    retryMcp(name: string): Promise<void>
    configureMcp(name: string): void
  }
  ```
- Persistence: Refresh periodically via SSE or polling

**Integration:**
- Subscribe to sync events for MCP status updates (SSE)
- Auto-refresh when switching to session with MCPs configured

---

## Edge Cases & Concerns

**Performance concerns:**
- Polling for MCP status could be expensive
- **Solution**: Use SSE streams (likely already available), cache responses

**Configuration complexity:**
- MCP configuration might require editing config files, not API endpoints
- **Solution Link to/open config file in editor for advanced config, provide simple form for common settings

**MCPs without UI management:**
- Some MCPs may not support enable/disable via API
- **Solution**: Show "Edit configuration" instead, redirect to config file

**Multiple MCP providers:**
- Different APIs for different MCP backends
- **Solution**: Standardize on OpenCode's unified MCP status endpoint

**Real-time updates:**
- Need to update status as MCP servers reconnect/fail
- **Solution**: Use SSE streams (sync.data.mcp events)

**Error handling:**
- What if all MCPs fail to load?
- **Solution**: Show error state in panel, allow retry

**No MCP servers configured:**
- Empty state should be helpful
- **Solution**: Show "No MCP servers configured" with link to documentation

**Security:**
- MCP servers handle sensitive data
- Never show credentials in UI
- Mask sensitive fields, show minimal info
- Confirm before major changes

**Accessibility:**
- Status icons: Use icons + color (colorblind-friendly)
- Use `aria-label` for status badges
- Server cards: Proper heading structure
- Focus order: Status indicator → Server list → Actions

---

### Accessibility (A11y)

**Status indicators:**
- Color + icon (not just color)
- `aria-label="3 MCP servers connected, 1 failed"`
- Badge: `role="status"`, `aria-live="polite"`

**Server cards:**
- Heading: Server name
- Status: `aria-label="Status: Connected"`
- Buttons: Clear `aria-label` ("Enable filesystem-api")

**Keyboard navigation:**
- Tab through server list
- Arrow keys within filter tabs
- Enter/Space to toggle enable/disable
- Escape to close panel

**Screen readers:**
- Live region for status changes
- Announce: "Filesystem-api connected" on reconnect
- Toast notifications announced

---

## MVP vs Nice-to-Have

### MVP (Must-have)
- ✅ View MCP servers + status list
- ✅ Status badges (connected/failed/disabled)
- ✅ Enable/disable toggles (Switch)
- ✅ Status indicator in status bar
- ✅ Sidebar tab (SessionSidebar pattern)
- ✅ Error messages + retry
- ✅ Real-time updates (SSE)
- ✅ Full keyboard navigation (A11y)

### Nice-to-Have (Enhancements for Later)
- Real-time connection animations
- Detailed metrics (request count, latency)
- MCP request logs viewer
- Group by provider/use case
- Search/filter servers
- Batch operations (enable/disable multiple)
- Configuration wizard
- Usage graphs
- MCP marketplace/discovery
- Custom config editor
- Health monitoring + alerts
- Rate limiting controls
- Permissions management
