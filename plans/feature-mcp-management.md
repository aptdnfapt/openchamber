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

**Sidebar panel + status bar indicator**

Rationale:
- MCP status is ongoing state that users should see at a glance
- Management actions should be accessible but not intrusive
- Sidebar panel provides dedicated space for server list and controls
- Status bar indicator shows quick overview

Layout:
```
┌─────────────────────────────────────────┐
│  Chat │ Diff │ Git │ Terminal  [Settings]│
├───────────────┬───────────────┬─────────┤
│               │               │  MCP: 3  │ ← Status indicator
│   Chat        │    Diff       │  ● ● ○  │   (connected/failed/disabled)
│   area        │    area       │─────────┤
│               │               │         │
│               │               │         │
├───────────────┴───────────────┤         │
│  Session Sidebar              │  MCP Panel│ ← Sidebar drawer
│  - Today                      │────────│   (tab or full panel)
│    - Session 1                │        │
│    - Session 2                │ MCPs   │
│                                │────────│
│                                │ ● filesystem-api │
│                                │   Connected      │
│                                │                 │
│                                │ ○ database-connector │
│                                │   Failed         │
│                                │   [Retry] [Config]│
│                                │                 │
│                                │ ○ weather-service │
│                                │   Disabled       │
│                                │   [Enable]       │
└─────────────────────────────────────────┘
```

Alternative: Dedicated Settings page section (like existing "Providers" section)

### User Workflow

**View MCP status:**
1. User clicks MCP indicator in status bar, or opens Session Sidebar
2. MCP panel slides in showing:
   - List of all configured MCP servers
   - Each server shows name, status icon, and description
   - Actions displayed based on status:
     - Connected: Show "Disable" button
     - Failed: Show "Retry" and "Configure" buttons
     - Disabled: Show "Enable" button
3. User can see quick details for each server

**Toggle MCP server:**
1. User clicks Enable/Disable button on a server
2. Show loading indicator while API call in progress
3. Once complete, update status icon and button text
4. Show toast: "Filesystem API enabled"

**Configure problematic MCP:**
1. User clicks "Configure" on a failed MCP
2. Open MCP configuration dialog (or navigate to appropriate settings page)
3. Edit server configuration (URL, credentials, etc.)
4. Save and retry connection
5. Status updates automatically

**MCP status from Command Palette:**
1. User opens Command Palette (Ctrl+K)
2. Types "MCP" or "status"
3. Selects "View MCP Status"
4. MCP panel opens with current status

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

- MCP panel as bottom sheet modal instead of sidebar
- Larger touch targets for enable/disable buttons
- Swipe down to close panel
- "View All MCPs" button in settings for full management
- Status indicator in top bar as small icon badge
- Pull-to-refresh to reload MCP status

---

## Technical Implementation

### Backend Requirements

**OpenCode API Check:**

Result:
- ✅ API exists: `mcp.status` → Implement UI primarily, may need configuration endpoints

API endpoint: `GET /mcp/status`
- Returns: Map of MCP server names to status objects
- Status includes: `connected | failed | disabled | needs_auth | needs_client_registration`
- For failed: includes error message

**Configuration:**
- MCP configuration likely in config file (not API)
- May need to open external config file for editing
- **Solution**: Open file in editor or provide simple form for common settings

**Store Functions:**

Create `useMcpStore` (new store):
- `mcpServers: Map<string, McpServer>` - Current status snapshot
- `loading: boolean` - Loading state
- `refreshMcpStatus()` - Fetch current status
- `toggleMcp(name: string, enabled: boolean)` - Enable/disable
- No MCP-specific API for toggle - likely uses config updates

**File to create:**
- `/home/idc/proj/openchamber-wj/packages/ui/src/stores/useMcpStore.ts`

**Alternative**: Use `useConfigStore` to manage MCP config settings directly

### Frontend Components

**New Components to Create:**

`McpStatusIndicator.tsx` - Status bar indicator showing MCP overview:
- Shows count of connected/failed MCP servers
- Color-coded: All green = good, any red = warning
- Clickable to open MCP panel
- Animated icon when loading

`McpPanel.tsx` - Sidebar panel/drawer for MCP management:
- List of MCP servers with status badges
- Enable/disable toggle buttons
- Configure/retry buttons based on status
- Search/filter input
- Refresh button
- Grouped by status sections

`McpServerItem.tsx` - Individual MCP server display:
- Server name and icon
- Status badge with color
- Description/status text
- Action buttons (enabled based on status)
- Error details shown on hover/click

`McpStatusDialog.tsx` - Dedicated dialog for MCP status (alternative to panel):
- Same content as McpPanel but in modal form
- Used when triggered from Command Palette

**Existing Components to Modify:**

`sessionSidebar.tsx` or create `McpSidebar.tsx` - Add MCP tab to sidebar:
- New "MCP" tab in session sidebar
- Shows McpPanel when selected

`StatusRow.tsx` - Add MCP indicator:
- Show McpStatusIndicator in the existing status row
- Position next to other status indicators (LSP, Git, etc.)

`CommandPalette.tsx` - Add "MCP Status" command:
- New command to open MCP panel/dialog
- Shortcut suggestion: Ctrl+Shift+M

**Radix UI Primitives to Use:**
- `Dialog`, `DialogContent`, `DialogHeader` for dialog variant
- `Switch` or `Toggle` for enable/disable
- `Tooltip`, `HoverCard` for error details
- `Select` for MCP filters/search

**File Locations:**
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
- MCP servers might handle sensitive data
- **Solution**: Don't show credentials in UI, show mask or minimal info

**Accessibility:**
- Status icons must be colorblind-friendly
- **Solution**: Use icons + color, not just color

---

## MVP vs Nice-to-Have

### MVP (Must-have)
- View list of MCP servers and their status
- Status badges (connected, failed, disabled)
- Enable/disable MCP servers (toggle)
- Status indicator in chat area
- MCP panel in session sidebar
- Error messages for failed MCPs
- Refresh/status update

### Nice-to-Have (Enhancements for Later)
- Real-time connection status via SSE animations
- Detailed MCP metrics (request count, latency)
- MCP request logs viewer
- Group MCPs by provider/use case
- Search/filter MCP servers
- Batch enable/disable multiple MCPs
- MCP configuration wizard for first-time setup
- Visual graphs showing MCP usage over time
- MCP marketplace/discovery (find new MCPs to install)
- MCP custom configuration editor (with syntax highlighting)
- MCP server health monitoring and alerts
- MCP rate limiting controls
- MCP permissions management (which tools each MCP can access)
