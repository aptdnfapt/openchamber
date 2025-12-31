# Phase 1: Feature Discovery Summary

## Executive Summary

After thorough exploration of both OpenCode Terminal TUI and OpenChamber Web, I've identified significant feature gaps that, when implemented, will bring OpenChamber Web to parity with the terminal experience and leverage web-native capabilities for an even better user experience.

---

## Features Discovered

### OpenCode Terminal TUI Features

#### Session Management
- **Session fork** - Create new session branching from any message
- **Session undo/redo** - Revert to any previous turn, restore forward actions
- **Timeline/jump to message** - Browse and jump to any point in conversation
- **Compact session** - Summarize/summarize to reduce token usage
- **Copy session transcript** - Copy entire session as markdown
- **Export session to file** - Download session with options (thinking, tool details)

#### Display Controls
- Toggle thinking display
- Toggle timestamps
- Toggle tool details
- Toggle code concealment
- Toggle user message markdown
- Toggle animations
- Toggle sidebar
- Toggle username
- Toggle scrollbar
- Toggle diff wrapping

#### Navigation
- Page up/down
- Half-page up/down
- First/last message
- Next/previous message
- Jump to last user message
- Subagent navigation (parent, next, prev)

#### MCP & System Status
- **MCP management** - View status, enable/disable servers
- **Status view** - Complete system health dashboard (MCP, LSP, Formatters, Plugins)
- Getting started tips/wizard
- Debug panel (TUI-specific)
- Console toggle (TUI-specific)

#### Prompts & Input
- **Prompt stash** - Save and retrieve frequently-used prompts
- Tag/autocomplete for files

#### UI/UX
- Command palette (extensive commands)
- Theme switcher
- Help dialog with keyboard shortcuts
- Terminal title toggle
- Suspend terminal (TUI-specific)

### OpenChamber Web Existing Features

#### Session Management
- Session sidebar with groupings
- Create/delete/rename sessions
- Session list with metadata
- Worktree support (create, delete, manage)
- Switch sessions
- Share/unshare sessions (API exists, UI partial)

#### Core Views
- Chat view with message display
- Diff view with syntax highlighting
- Git view with operations
- Terminal view
- Settings views (Agents, Commands, Git Identities, Providers, OpenChamber)

#### UI/UX
- Command palette (basic)
- Theme switching (light/dark/system)
- Keyboard shortcuts (limited)
- Mobile overlay panels
- Responsive design
- File attachments
- Directory tree
- Status indicators

---

## Feature Gap Comparison

| Feature | OpenCode Terminal | OpenChamber Web | Status | Priority |
|---------|-------------------|-----------------|--------|----------|
| **Session Fork** | ✅ Fork from any message | ❌ Missing | ❌ Missing | High |
| **Session Undo/Redo** | ✅ Revert to any turn | ❌ Missing | ❌ Missing | High |
| **Timeline/Jump to Message** | ✅ Dialog with all messages | ❌ Missing | ❌ Missing | High |
| **Compact Session** | ✅ Summarize via API | ⚠️ Partial (API exists) | ⚠️ UI missing | Medium |
| **Copy Last Assistant Message** | ✅ Copy to clipboard | ❌ Missing | ❌ Missing | Low |
| **Copy Session Transcript** | ✅ Full markdown export | ❌ Missing | ❌ Missing | Low |
| **Export Session to File** | ✅ Download with options | ❌ Missing | ❌ Missing | Low |
| **MCP Management** | ✅ View status, toggle | ❌ Missing | ❌ Missing | High |
| **Status View** | ✅ MCP/LSP/Formatter/Plugin dashboard | ❌ Missing | ❌ Missing | High |
| **Prompt Stash** | ✅ Save/retrieve prompts | ❌ Missing | ❌ Missing | Medium |
| **Toggle Thinking** | ✅ Show/hide reasoning | ⚠️ Partial (via settings) | ✅ Settings exist | Low |
| **Toggle Timestamps** | ✅ Show/hide | ⚠️ Partial (via settings) | ✅ Settings exist | Low |
| **Toggle Tool Details** | ✅ Show/hide | ⚠️ Partial (via settings) | ✅ Settings exist | Low |
| **Page Navigation** | ✅ Full keyboard nav | ⚠️ Partial (scroll only) | ⚠️ Basic scroll | Low |
| **Jump to Message** | ✅ Full timeline | ❌ Missing | ❌ Missing | Medium |
| **Subagent Navigation** | ✅ Parent/next/prev | ❌ Missing | ❌ Missing | Medium |
| **Share Session** | ✅ Share URL | ⚠️ Partial | ⚠️ UI needs work | Medium |
| **Theme Switcher** | ✅ Full theme list | ⚠️ Light/dark/system | ✅ But fewer themes | Low |
| **Help Dialog** | ✅ Full keyboard shortcuts | ⚠️ Limited help | ⚠️ Basic | Low |

**Legend:**
- ✅ Fully implemented
- ⚠️ Partial implementation
- ❌ Completely missing

---

## Plan Files Created

Detailed implementation plans have been created for the most critical missing features:

1. **feature-session-fork.md** - Create new sessions branching from any message
2. **feature-session-undo-redo.md** - Time-travel through conversation history
3. **feature-mcp-management.md** - Manage MCP servers and view their status
4. **feature-prompt-stash.md** - Save and retrieve frequently-used prompts
5. **feature-status-view.md** - Complete system health dashboard

**Location:** All plans are in `/home/idc/proj/openchamber-wj/plans/`

---

## Key Findings & Observations

### API Readiness

Good news: Most critical features have backend APIs already available:
- ✅ `session.fork` - Fork from message API exists
- ✅ `session.revert` / `session.unrevert` - Undo/redo APIs exist
- ✅ `session.share` / `session.unshare` - Share APIs exist
- ✅ `mcp.status` - MCP status API exists
- ✅ `session.summarize` - Compact session API exists
- ✅ `session.messages` - Get messages for timeline

This means **UI implementation is the primary work** for these features.

### Design Philosophy: Web-Optimization, Not Terminal Clone

Each plan emphasizes **web-first design**:
- Leverage mouse clicks, drag-and-drop, hover states
- Better mobile experience with gestures and touch
- Visual previews and rich metadata
- Real-time updates via SSE
- Accessibility improvements (ARIA, keyboard nav) over keyboard-only terminal workflows

### Prioritization Rationale

**High Priority:**
- Session fork - Fundamental capability for exploration/iteration
- Undo/redo - Essential for experimentation
- MCP management - Critical for working with external tools
- Status view - Diagnostics power user need

**Medium Priority:**
- Prompt stash - Significant productivity boost
- Timeline/jump - Navigation enhancement
- Compact session - Cost management

**Low Priority:**
- Copy/export - Manual workarounds exist (select all + copy)
- Display toggles - Many already exist in Settings
- Page navigation - Basic scroll is sufficient for most

### Technical Patterns Identified

Each plan follows consistent patterns:
1. **UI Pattern Selection** - Choose between modal, sidebar, inline, etc.
2. **User Workflow** - Step-by-step interaction design
3. **Web Advantages** - What web enables over terminal
4. **Mobile Considerations** - Responsive design approach
5. **Backend API Check** - Verify API availability
6. **Component Architecture** - New vs. modified components
7. **State Management** - Zustand store extensions
8. **Edge Cases** - Performance, errors, UX concerns
9. **MVP vs. Nice-to-Have** - Phased implementation options

---

## Issues Encountered

### Exploration Challenges

1. **TypeScript errors in OpenCode** - Reading SolidJS/TSX files without dependencies caused many diagnostic errors, but this didn't hinder exploration
2. **Large codebase** - OpenCode has extensive TUI code; required strategic file selection
3. **Command system complexity** - TUI command system uses SolidJS reactivity; needed careful tracing
4. **Partial UI implementations** - Some features (like share) have API and partial UI, need verification of completeness

### Recommendations for Phase 2

1. **Verify partial implementations** - Some features (share, export) may have more UI code than discovered
2. **API documentation review** - Double-check all identified APIs for exact parameters and responses
3. **Mobile-first validation** - Test proposed mobile UX patterns on actual devices
4. **Performance impact assessment** - Large message lists and status polling could affect performance

---

## Next Steps

This phase successfully identified all critical missing features. **Phase 2** should involve:
1. Review by team/stakeholders to validate priority and scope
2. Choose 1-2 high-priority features for initial implementation
3. Begin MVP development following the detailed plans created

---

## Appendix: Complete Feature Inventory

### OpenCode Only (Missing in OpenChamber - TUI Specific)
- Debug panel overlay
- Console toggle (for TUI debugging)
- Suspend terminal (SIGTSTP)
- Terminal title modification
- Tips display (on-screen hints)

### Web-Only (OpenChamber Advantages)
- Rich visual previews
- Click/drag interactions
- Better mobile/responsive design
- Visual tooltips and hover states
- Animations and transitions
- Browser-native downloads (export)
- Copy-to-clipboard without terminal OSC52
- Better accessibility (screen readers)

### Rough Parity (Both Have, Different UI)
- Session switching
- Command palette
- Theme switching
- Settings management
- Share/unshare
- Model/provider selection
- Agent switching

---

**Phase 1 Complete ✅**
All major feature gaps identified, documented, and prioritized with detailed implementation plans.
