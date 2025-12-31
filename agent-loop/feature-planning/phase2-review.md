# Phase 2 Review: UX/UI Improvements

## Overview

This document summarizes the UX/UI review and improvements made to all 5 feature implementation plans during Phase 2 of the ORCH workflow.

## Plans Reviewed

1. **feature-session-fork.md** - Session fork capability
2. **feature-session-undo-redo.md** - Time-travel undo/redo
3. **feature-mcp-management.md** - MCP server management
4. **feature-prompt-stash.md** - Prompt saving/retrieval
5. **feature-status-view.md** - System health dashboard

---

## Common Improvements Applied to All Plans

### 1. **Specific Component References**
All plans now include:
- Exact file paths for new components
- Exact file paths for existing components to modify
- Reuse of existing patterns (e.g., "reuse SessionDialogs.tsx pattern")
- Specific UI component names (Button, Dialog, MobileOverlayPanel, etc.)

**Example:**
```typescript
// Before: "Create a dialog component"
// After: "ForkSessionDialog.tsx - reuse SessionDialogs.tsx pattern (770+ lines)"
```

### 2. **Mobile Patterns**
All plans now specify:
- Reuse of `MobileOverlayPanel` component (bottom sheet)
- Larger touch targets (48x48px minimum)
- Full-height panels for mobile
- Gesture support (swipe to dismiss)
- Performance optimizations (lazy loading, virtual scroll)

**Reference:** SessionDialogs.tsx (lines 772-782)

### 3. **Accessibility (A11y)**
Added comprehensive accessibility sections:
- Keyboard shortcuts (global, not just in input)
- ARIA attributes (roles, labels, live regions)
- Focus management (trap, return focus)
- Screen reader announcements
- Color contrast compliance (WCAG AA)
- Focus indicators (existing patterns)

### 4. **State Management Patterns**
All plans now specify:
- Extend existing Zustand stores where possible
- Specific store structure additions
- Computed selectors pattern
- Async actions with loading states
- Integration with SSE/sync streams

**Reference:** useSessionStore.ts (lines 64+)

### 5. **Technical Implementation Details**
Enhanced with:
- Specific API endpoint details
- Store interface definitions (TypeScript)
- Component file locations with directory structure
- Reuse of existing UI patterns (Dialog, Button, etc.)
- File modification hints

---

## Individual Plan Improvements

### 1. Session Fork - Improvements Made

#### Before (Original)
- Generic "Modal/Dialog overlay" description
- No specific component references
- Basic user workflow
- No accessibility details

#### After (Improved)
**UI Pattern:**
- Specific pattern: "reuse SessionDialogs.tsx pattern"
- Desktop: Radix UI Dialog with max-w-[520px]
- Mobile: MobileOverlayPanel bottom sheet

**Technical Implementation:**
- Extend `useSessionStore` with `forkDialogState`
- Add specific actions: `openForkDialog()`, `selectForkMessage()`, `forkFromMessage()`
- File: `/home/idc/proj/openchamber-wj/packages/ui/src/stores/useSessionStore.ts`

**Components:**
- New: `ForkSessionDialog.tsx`, `ForkSessionButton.tsx`
- Modify: `Header.tsx`, `CommandPalette.tsx`
- Reuse: `Card`, `Dialog`, `MobileOverlayPanel`, `Tooltip`

**Accessibility:**
- Keyboard: `Esc` close, `↑↓` navigate, `Enter` select
- ARIA: `role="dialog"`, `aria-modal="true"`, `aria-selected`
- Screen reader announcements for dialog state

**Mobile:**
- Full-height bottom sheet
- Touch targets: 72px message cards, 44x44px buttons
- Pull-to-refresh support

---

### 2. Session Undo/Redo - Improvements Made

#### Before (Original)
- Generic "Inline input action + visual timeline"
- No keyboard shortcut details
- Basic dialog for confirmation

#### After (Improved)
**UI Pattern:**
- Multi-location buttons: Header + Input toolbar
- Visual divider in message list (red, dashed)
- Follows existing `StatusRow.tsx` divider patterns

**Technical Implementation:**
- Store: `undoState` with `revertMarker`, `redoStack`
- Actions: `undoToMessage()`, `redo()`, `clearUndoState()`
- Integration with `MessageList.tsx` for divider

**Components:**
- New: `UndoRedoControls.tsx`, `UndoIndicator.tsx`, `UndoConfirmationDialog.tsx`
- Modify: `Header.tsx`, `ChatInput.tsx`, `MessageList.tsx`, `CommandPalette.tsx`
- Reuse: `AlertDialog` for confirmation, `DropdownMenu` for options

**Keyboard Shortcuts (Global):**
- `Ctrl+Z` / `Cmd+Z`: Undo (works anywhere)
- `Ctrl+Y` / `Cmd+Y` or `Ctrl+Shift+Z`: Redo
- Focus remains in current input (no trap)

**Mobile:**
- Swipe gestures on input field (left=undo, right=redo)
- Long-press messages for "Revert here" bottom sheet
- Larger touch targets (48x48px)

---

### 3. MCP Management - Improvements Made

#### Before (Original)
- Generic "Sidebar panel + status bar indicator"
- No specific tab pattern

#### After (Improved)
**UI Pattern:**
- Specific: "reuse SessionSidebar.tsx tab structure"
- Status bar badge + sidebar tab
- Reuse `StatusRow.tsx` badge patterns

**Technical Implementation:**
- New store: `useMcpStore.ts`
- Integration with SSE: `sync.on('data.mcp', ...)`
- Server types: `connected | failed | disabled | needs_auth`

**Components:**
- New: `McpStatusIndicator.tsx`, `McpPanel.tsx`, `McpServerItem.tsx`, `McpErrorTooltip.tsx`
- Modify: `SessionSidebar.tsx` (add MCP tab), `StatusRow.tsx` (add indicator), `CommandPalette.tsx`
- Reuse: `SettingsSidebarItem.tsx`, `Switch` for toggles, `Tooltip`

**Status Badge System:**
- Green ● = Connected
- Red ● = Failed
- Gray ○ = Disabled
- Example: "MCP ●●○" (2 connected, 1 failed)

**Mobile:**
- Full-height bottom sheet
- Pull-to-refresh support
- Expandable error cards

---

### 4. Prompt Stash - Improvements Made

#### Before (Original)
- Generic "Dropdown/combobox + sidebar"
- Basic localStorage mention

#### After (Improved)
**UI Pattern:**
- Specific: "reuse ChatInput.tsx dropdown pattern"
- Popover panel from input toolbar
- Reuse `DropdownMenu` component

**Technical Implementation:**
- New store: `usePromptStashStore.ts` with localStorage persistence
- Limits: Max 50 prompts, 10KB per prompt
- Actions: `savePrompt()`, `loadPrompt()`, `deletePrompt()`, `searchPrompts()`

**Components:**
- New: `StashButton.tsx`, `StashPanel.tsx`, `StashedPromptCard.tsx`, `StashEmptyState.tsx`
- Modify: `ChatInput.tsx` (add toolbar button), `CommandPalette.tsx`
- Reuse: `DropdownMenu`, `AlertDialog` for delete

**Keyboard Shortcuts:**
- `Ctrl+S` / `Cmd+S`: Save current input
- `Ctrl+Shift+S` / `Cmd+Shift+S`: Open stash panel
- Arrow keys + Enter to navigate and load

**Mobile:**
- FAB for "Save to stash" when input has content
- Swipe left to delete (mobile pattern)
- Auto-focus search bar

---

### 5. Status View - Improvements Made

#### Before (Original)
- Generic "Modal/Dialog overlay with tabs"
- No specific tab component reference

#### After (Improved)
**UI Pattern:**
- Specific: "reuse SettingsPage.tsx tab patterns"
- Radix UI Tabs component
- Reuse `animated-tabs.tsx` pattern

**Technical Implementation:**
- New store: `useSystemStatusStore.ts`
- Aggregates from multiple sources: MCP, LSP, Formatters, Plugins
- Integration with SSE streams for real-time updates
- Markdown export for bug reports

**Components:**
- New: `StatusDialog.tsx`, `StatusTabs.tsx`, `StatusSection.tsx`, `StatusCard.tsx`, `StatusExportButton.tsx`
- Modify: `CommandPalette.tsx`, `StatusRow.tsx`
- Reuse: `Dialog`, `Tabs`, `SettingsSidebarItem.tsx`, `ScrollArea`

**Export Format:**
```markdown
## MCP Servers
- filesystem-api: Connected (0.5s latency)
- database-connector: Failed - Connection timeout

## LSP Servers
- TypeScript: Connected (/src)
- Python: Connected (/app)

## Formatters
- Prettier: Enabled v3.2.5

## Plugins
- custom-script-plugin: Active @2.1.0
```

**Mobile:**
- Full-height MobileOverlayPanel
- Swipe carousel between tabs
- FAB with red badge when issues exist

---

## Cross-Plan Consistency

All 5 plans now follow consistent patterns:

### 1. **Dialog Patterns**
- Desktop: Radix UI Dialog with standard sizing
- Mobile: MobileOverlayPanel bottom sheet
- Footer: Action buttons (Cancel/Confirm)
- Loading states with spinners/skeletons

**Reference:** SessionDialogs.tsx (770+ lines of proven pattern)

### 2. **State Management**
- Extend existing stores where logical
- New stores for independent features
- Consistent TypeScript interfaces
- Computed selectors pattern
- Async actions with error handling

**Reference:** useSessionStore.ts

### 3. **Component Organization**
```
packages/ui/src/components/{feature}/
  ├── NewComponent1.tsx
  ├── NewComponent2.tsx
  └── index.ts
```

### 4. **Accessibility**
- Global keyboard shortcuts (Ctrl/Cmd + key)
- ARIA attributes on all interactive elements
- Focus management (trap + return)
- Screen reader live regions
- WCAG AA contrast compliance

### 5. **Mobile Support**
- Touch targets: 44-48px minimum
- Bottom sheets: MobileOverlayPanel
- Gestures: Swipe to dismiss, pull-to-refresh
- Performance: Lazy loading, debouncing

---

## Issues Found & Resolved

### 1. **Original Plans Were Too Generic**
- ✅ Fixed: All plans now reference exact files and components
- ✅ Fixed: Specific patterns identified (e.g., "SessionDialogs.tsx pattern")

### 2. **Missing Mobile Details**
- ✅ Fixed: Added MobileOverlayPanel usage to all plans
- ✅ Fixed: Touch target sizes specified (44-48px)
- ✅ Fixed: Gesture support documented

### 3. **No Accessibility Planning**
- ✅ Added comprehensive A11y sections to all plans
- ✅ Keyboard shortcuts specified (global, not just in input)
- ✅ ARIA attributes defined for all components
- ✅ Focus management patterns documented

### 4. **State Management Inconsistent**
- ✅ All plans now specify exact store additions
- ✅ Store patterns follow existing codebase conventions
- ✅ TypeScript interfaces included
- ✅ SSE integration where applicable

### 5. **Missing Component Reuse**
- ✅ All plans identify existing components to reuse
- ✅ Specific file paths and line numbers where helpful
- ✅ Reuse patterns documented (e.g., "SettingsSidebarItem.tsx pattern")

---

## Technical Consistency Achieved

### 1. **Store Patterns**
All stores follow the same structure:
```typescript
interface FeatureStore {
  state: {
    items: Map<string, Item>;
    isLoading: boolean;
    error: string | null;
  };
  
  // Actions
  fetchData(): Promise<void>
  updateItem(id: string, data: Partial<Item>): Promise<void>
  deleteItem(id: string): Promise<void>
}
```

### 2. **Component Patterns**
All new components follow:
- Functional components with React.FC
- Hooks for state/effects
- Proper TypeScript typing
- Reuse existing UI components
- Mobile-responsive variants

### 3. **API Integration**
All plans specify:
- Exact API endpoints
- Integration with SSE streams
- Error handling patterns
- Loading state management

---

## Ready for Next Phase

All 5 plans are now **Phase 2 Complete** and ready for Phase 3 (Implementation Planning):

✅ **Session Fork** - Detailed UX/UI with component references
✅ **Session Undo/Redo** - Multi-location controls with accessibility
✅ **MCP Management** - Sidebar tab + status indicators
✅ **Prompt Stash** - Dropdown panel with localStorage persistence
✅ **Status View** - Tabbed dialog with export functionality

**All plans include:**
- Specific component file paths
- Existing pattern references
- Mobile implementation details
- Accessibility requirements
- State management specifications
- Keyboard shortcut documentation

---

## Summary

Phase 2 successfully transformed generic feature descriptions into detailed, implementable UX/UI specifications that:

1. **Follow OpenChamber patterns** - All components reuse existing codebase conventions
2. **Are mobile-ready** - MobileOverlayPanel and touch targets specified
3. **Are accessible** - Comprehensive A11y planning with ARIA and keyboard support
4. **Are technically accurate** - Specific file paths, store structures, API endpoints
5. **Are consistent** - All 5 plans follow the same structure and patterns

The plans are now ready for Phase 3 implementation planning.

---

**Phase 2 Review Complete ✅**
All 5 feature plans reviewed, improved, and are ready for the next phase.