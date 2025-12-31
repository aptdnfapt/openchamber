# Feature: Session Undo/Redo

## Overview

**Description**
Allow users to revert session state to any previous turn (undo), then restore forward actions (redo), effectively time-traveling through the conversation history.

**OpenCode Terminal Implementation**
In TUI, pressing the undo keybind reverts to the last user message before the current turn, restoring that message content to the input field. Redo restores the reverted turn. Visual indicators show the current position in history.

**Value Proposition**
Enables experimentation without fear - try approaches, revert if they don't work, iterate quickly. Critical for working with AI where responses can be wrong or go in unintended directions.

---

## Web-Optimized Design

### UI Pattern

**Inline toolbar + timeline divider (combining existing patterns)**

Rationale: Undo/redo is frequent → visible buttons + visual timeline indicator
- **Header**: Undo/redo buttons (always visible, next to title)
- **Input toolbar**: Contextually near send button (reuse `ChatInput.tsx` footer pattern)
- **Timeline divider**: Visual line showing undo point in message list
- **Command Palette**: Keyboard-only fallback (Ctrl+Z / Ctrl+Y)

Layout (desktop):
```
┌─────────────────────────────────────────┐
│ [↩ Undo] [↪ Redo]  Session Title        │ ← Header buttons
├─────────────────────────────────────────┤
│  User: Fix the login bug                 │
│  Assistant: Here's the fix...            │
│                                         │
│  ════════════════════════════════════   │ ← Undo divider (red)
│  "Undo point - 3 messages will be removed" │
│  ────────────────────────────────────── │
│                                         │
│  User: Actually, can you use OAuth?     │ ← Faded (to be removed)
│  Assistant: Let me refactor...          │
│  [Streamed response...]                 │
├─────────────────────────────────────────┤
│  [Input field with current prompt]      │
│         [↩ Undo disabled] [↪ Redo ✓]   │ ← Input toolbar
└─────────────────────────────────────────┘
```

**Component reuse:**
- Header buttons: Reuse `Header.tsx` button patterns (line 61)
- Input toolbar: Reuse `ChatInput.tsx` footer (lines 1280-1311)
- Divider: Reuse `StatusRow.tsx` divider patterns (line 201)
- Tooltips: Existing `Tooltip` component

### User Workflow

**Trigger:** Header buttons, input toolbar, or keyboard shortcuts (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)

**Undo flow:**
1. User clicks "Undo" button (header or input toolbar)
2. **Option A - Quick undo:** Reverts to last message immediately
3. **Option B - Selective undo:** Dialog opens showing message tree:
   - Visual timeline of all messages
   - Click any message to undo to that point
   - Preview: "This will remove X messages"
4. **Confirmation dialog** (if messages will be deleted):
   ```typescript
   // Reuse AlertDialog pattern from Radix UI
   "Undo to 'Fix the login bug'?"
   "This will remove 3 messages. This action cannot be undone."
   [Cancel] [Undo]
   ```
5. API call to `session.revert(messageId)`
6. Messages after undo point fade out and animate away
7. Selected message's prompt restored to input field
8. Visual divider shows new "undo point"

**Redo flow:**
1. User clicks "Redo" button (previously disabled)
2. Restores previously undone messages
3. Divider moves back to original position
4. Button state updates (disabled if no more redo available)

**Keyboard shortcuts:**
- `Ctrl+Z` (or `Cmd+Z`): Undo
- `Ctrl+Y` or `Ctrl+Shift+Z`: Redo
- Both work globally (even when input not focused)

### Web Advantages

- **Visual timeline**: Show clear divider line for undo point
- **Clickable undo point**: Click any message to undo to it
- **Context menus**: Right-click on messages for quick undo options
- **Undo/redo queue visualization**: Show how many steps available
- **Hover effects**: Preview what will happen on hover
- **Keyboard shortcuts**: `Ctrl+Z` for undo, `Ctrl+Y` or `Ctrl+Shift+Z` for redo
- **Confirmation dialogs**: Prevent accidental destructive actions
- **Smooth animations**: Animated removal/restoration of messages

### Mobile Considerations

**Implementation:** Follow existing mobile patterns from `ChatInput.tsx`

- **Buttons:**
  - Larger touch targets: 48x48px (vs 36px desktop)
  - Fixed in input toolbar (always visible on mobile)
  - Haptic feedback on press (Web Vibration API)
  
- **Gestures:**
  - Swipe left on input field: Undo
  - Swipe right on input field: Redo
  - Long-press message: Show bottom sheet with "Revert here" option
  
- **Bottom sheet** (reuse MobileOverlayPanel):
  - Shows undo timeline when triggered
  - Full-height for long undo histories
  - Swipe to dismiss (built-in)

- **Visual changes:**
  - Undo divider: Thicker line, more visible
  - Faded messages: Lower opacity (0.3) for better visibility on small screens
  - Toast notifications: Longer duration (5s vs 3s)

- **Optimization:**
  - Max 10 undo steps shown in UI (full history in store)
  - Debounced animations (60fps on mobile)

---

## Technical Implementation

### Backend Requirements

**OpenCode API Check:**

Result:
- ✅ API exists: `session.revert` and `session.unrevert` → Implement UI only

API endpoints:
- `POST /session/revert` - Revert to specific message ID, removing all after
- `POST /session.unrevert` - Clear revert state, remove undo point marker

**Store Functions:**

**Extend `useSessionStore`** (follow existing patterns):
```typescript
// Add to SessionStore interface
undoState: {
  revertMarker: Map<sessionId, messageId>;  // Current undo point
  redoStack: Map<sessionId, messageId[]>;   // History for redo
  isUndoDialogOpen: boolean;
  selectedUndoTarget: string | null;        // Message ID for selective undo
}
```

Add computed selectors:
```typescript
canUndo: (sessionId) => boolean
canRedo: (sessionId) => boolean  
currentUndoMessage: (sessionId) => Message | null
undoHistoryCount: (sessionId) => number
```

Add actions:
```typescript
undoToMessage(sessionId: string, messageId: string): Promise<void>
redo(sessionId: string): Promise<void>
clearUndoState(sessionId: string): void
openUndoDialog(sessionId: string): void
closeUndoDialog(): void
```

**File to modify:**
- `/home/idc/proj/openchamber-wj/packages/ui/src/stores/useSessionStore.ts` (extend existing store)

### Frontend Components

**New Components to Create:**

1. **UndoRedoControls.tsx** - Button pair (header + input toolbar):
   - Reuse `Header.tsx` button patterns
   - Reuse `ChatInput.tsx` footer icon patterns
   - Disabled state with visual feedback
   - Badge showing undo count (e.g., "↩ 3")
   - Tooltip with keyboard shortcut hint

2. **UndoIndicator.tsx** - Visual divider in message list:
   - Reuse `StatusRow.tsx` divider patterns
   - Animated line (red, dashed)
   - "Reverted to here" label
   - Click to show context menu (redo options)
   - Use `DropdownMenu` for options

3. **UndoConfirmationDialog.tsx** - Alert dialog for destructive undo:
   - Reuse `AlertDialog` pattern (Radix UI)
   - Shows message preview and count of messages to remove
   - "Undo" button with destructive variant
   - Escape key cancels, Enter confirms

**Existing Components to Modify:**

1. **Header.tsx** - Add undo/redo buttons:
   - Add to right side of header (before settings)
   - Follow existing `headerIconButtonClass` pattern (line 61)
   - Only show when undo/redo available

2. **ChatInput.tsx** - Add to input toolbar:
   - Add near send button (line 1306)
   - Use existing icon button patterns
   - Sync disabled state with session store

3. **MessageList.tsx** - Add undo indicator:
   - Check `undoState.revertMarker` for current session
   - Insert `UndoIndicator` at correct position
   - Fade messages after undo point (opacity 0.5)

4. **CommandPalette.tsx** - Add commands:
   ```typescript
   <CommandItem onSelect={handleUndo}>
     <RiArrowGoBackLine className="mr-2 h-4 w-4" />
     <span>Undo</span>
     <CommandShortcut>Ctrl+Z</CommandShortcut>
   </CommandItem>
   <CommandItem onSelect={handleRedo}>
     <RiArrowGoForwardLine className="mr-2 h-4 w-4" />
     <span>Redo</span>
     <CommandShortcut>Ctrl+Y</CommandShortcut>
   </CommandItem>
   ```

**Radix UI Primitives to Use:**
- `AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogAction`
- `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem` (for undo options)
- Existing tooltip patterns

**File Locations:**
```
packages/ui/src/components/chat/
  ├── UndoRedoControls.tsx            (new - header + input buttons)
  ├── UndoIndicator.tsx              (new - timeline divider)
  ├── UndoConfirmationDialog.tsx     (new - destructive action confirm)
  ├── MessageList.tsx                (modify - add indicator)
  ├── ChatInput.tsx                  (modify - add toolbar buttons)
packages/ui/src/components/layout/
  └── Header.tsx                     (modify - add header buttons)
packages/ui/src/components/ui/
  └── CommandPalette.tsx             (modify - add commands)
```
packages/ui/src/components/chat/
  ├── UndoRedoControls.tsx            (new)
  ├── UndoIndicator.tsx              (new)
  ├── MessageList.tsx                (modify - add undo indicator)
  ├── ChatInput.tsx                  (modify - add undo/redo buttons)
packages/ui/src/components/ui/
  ├── CommandPalette.tsx             (modify - add undo/redo commands)
```

### State Management

**Zustand Store:**
- Existing: `useSessionStore`
- Add to session-specific state:
  - `revertMessageId: messageId | null` - Current undo point
- Add actions:
  - `undoToMessage(sessionId: string, messageId: string)`
  - `redoTurn(sessionId: string)`
  - `clearUndoState(sessionId: string)`
- Computed selectors:
  - `canUndo(sessionId)` - true if not at earliest message
  - `canRedo(sessionId)` - true if revert state exists

---

## Edge Cases & Concerns

**Performance concerns:**
- Undoing many messages means re-rendering large message list
- **Solution**: Virtual scrolling already handles this, animate smoothly

**Mobile/desktop differences:**
- Context menus don't exist on touch
- **Solution**: Long-press to show bottom sheet with undo options

**Undoing while streaming:**
- What if AI is still responding?
- **Solution**: Abort stream first, show warning "Current response will be discarded"

**Undoing shared sessions:**
- What if session is shared with others?
- **Solution**: Allow local undo only, warn that others won't see changes, offer to unshare

**Undo history limits:**
- How many undo steps to track?
- **Solution**: Full session history via API, but UI shows last 10 for quick access

**Persistence across refresh:**
- Undo state should persist
- **Solution**: Backend maintains revert state, UI re-synchronizes on load

**Concurrent undo by collaborators:**
- What if two users undo different sessions?
- **Solution**: Not applicable (OpenCode doesn't have real-time collaboration)

**Error on undo API:**
- What if revert API fails?
- **Solution**: Show error toast, keep UI in current state

### Accessibility (A11y)

**Keyboard shortcuts (global):**
- `Ctrl+Z` / `Cmd+Z`: Undo (works anywhere in app)
- `Ctrl+Y` / `Cmd+Y` or `Ctrl+Shift+Z` / `Cmd+Shift+Z`: Redo
- Focus remains in current input (no focus trap)

**ARIA attributes:**
- Buttons: `aria-label="Undo to message: 'Fix the login bug'"` (when active)
- Divider: `role="separator"`, `aria-label="Undo point"`
- Faded messages: `aria-hidden="true"` (or keep with `aria-label="Message removed by undo"`)

**Screen readers:**
- Live region: Announce "Undo available - 3 messages can be undone"
- On undo: "Undone 3 messages, restored prompt to input"
- Confirmation dialog: Focus trap, announced properly

**Focus management:**
- After undo: Focus textarea, select all text
- After confirmation dialog: Return focus to trigger button

---

## MVP vs Nice-to-Have

### MVP (Must-have)
- ✅ Undo session to any previous message
- ✅ Redo (clear undo state)
- ✅ Visual divider in timeline
- ✅ Undo/redo buttons (header + input toolbar)
- ✅ Keyboard shortcuts (Ctrl+Z/Y globally)
- ✅ Confirmation dialog for destructive undo
- ✅ Toast notifications (Sonner)
- ✅ Mobile gestures + larger touch targets

### Nice-to-Have (Enhancements for Later)
- Step-by-step undo/redo (sequential)
- Undo branching visualization (multiple paths)
- Selective undo (message types, tool calls)
- Named checkpoints (save undo point)
- Visual diff preview before undo
- Undo history sidebar
- Merge branches (combine paths)
- Auto-checkpoints (periodic saves)
