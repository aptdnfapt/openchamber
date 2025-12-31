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

**Inline input action + visual timeline indicator**

Rationale:
- Undo/redo is a frequent action that should be always accessible
- Visual indicator in timeline shows current position
- Inline buttons near input provide always-visible access
- Combines with existing timeline/jump functionality

Layout:
```
┌─────────────────────────────────────────┐
│ [Undo] [Redo]    Session Title           │ ← Header buttons
├─────────────────────────────────────────┤
│  User: Fix the login bug                 │
│  Assistant: Here's the fix...            │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │ ← Current position (undo point)
│                                         │
│  User: Actually, can you use OAuth?     │ ← Messages after undo point
│  Assistant: Let me refactor...          │    (can be deleted with undo)
│  [Streamed response...]                 │
├─────────────────────────────────────────┤
│  [Input field with current prompt]      │
│         [Undo disabled] [Redo active]  │ ← Inline buttons near input
└─────────────────────────────────────────┘
```

Alternative positions for undo/redo buttons:
1. **Header**: Always visible, next to session title
2. **Input toolbar**: Next to "Send" button, contextually relevant
3. **Command Palette**: Accessible via keyboard

### User Workflow

**Undo flow:**
1. User is in a session with multiple turns after the message they want to go back to
2. User clicks "Undo" in header or input toolbar (or uses keyboard shortcut)
3. System confirms: "Undo to message: 'Fix the login bug'?"
4. User confirms
5. System calls `session.revert(messageId)` API
6. All messages after that turn are removed
7. The selected message's prompt is restored to input field
8. Visual indicator shows current turn position
9. User can edit prompt and submit again

**Redo flow:**
1. User has undone and is at an earlier point in history
2. User clicks "Redo" button
3. System either:
   - Restores next turn forward (if still in memory)
   - Shows "Nothing to redo" if no revert active
4. Session state is restored

**Timeline jump alternative:**
1. User clicks any message in timeline
2. Context menu appears with options:
   - "Revert to this point"
   - "Fork from this point"
3. Selecting "Revert" performs undo to that message

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

- Larger touch targets for undo/redo buttons
- Swipe down on input field to undo (gesture)
- Double-tap on message to undo to it
- Bottom sheet showing undo options instead of context menu
- Haptic feedback on undo/redone
- "Undo" button prominently visible in mobile toolbar

---

## Technical Implementation

### Backend Requirements

**OpenCode API Check:**

Result:
- ✅ API exists: `session.revert` and `session.unrevert` → Implement UI only

API endpoints:
- `POST /session/revert` - Revert to specific message ID, removing all after
- `POST /session.unrevert` - Clear revert state, remove undo point marker

Both endpoints handle the actual message deletion and state management.

**Store Functions:**

Extend `useSessionStore`:
- `undoSession(sessionId: string, messageId: string)` - calls revert API
- `redoSession(sessionId: string)` - calls unrevert or restores next turn
- No new store file needed - modify existing

**File to modify:**
- `/home/idc/proj/openchamber-wj/packages/ui/src/stores/useSessionStore.ts`

**State to track:**
- `revertMarker: Map<sessionId, messageId>` - Which session is currently in undo state
- `canUndo(sessionId)` - Check if undo available
- `canRedo(sessionId)` - Check if redo available

### Frontend Components

**New Components to Create:**

`UndoRedoControls.tsx` - Undo/redo button pair:
- Shows undo/redo buttons with disabled states
- Displays count of available undo/redo steps
- Keyboard shortcuts working
- Tooltip hints

`UndoIndicator.tsx` - Visual divider showing undo point in timeline:
- Separator line through message list
- "Reverted to this point" label
- Click to see options (resume, redo)
- Positioned between message lists

**Existing Components to Modify:**

`MessageList.tsx` - Add undo indicator render:
- Check for revert state for current session
- Insert UndoIndicator at correct position
- Style messages after undo point differently (faded, with "undo" badge)

`ChatInput.tsx` - Add undo/redo buttons to toolbar:
- Place near send button
- Update based on session state

`CommandPalette.tsx` - Add undo/redo commands:
- "Undo last turn" and "Redo" menu items
- Show keyboard shortcuts

`Sidebar/Session item` - Show undo state badge:
- Display icon/mark on sessions with active undo

**Radix UI Primitives to Use:**
- Previously used: No new primitives needed
- Maybe `AlertDialog` for undo confirmation

**File Locations:**
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

---

## MVP vs Nice-to-Have

### MVP (Must-have)
- Undo session to any previous message
- Redo (clear undo state)
- Visual indicator in timeline
- Undo/redo buttons in header and near input
- Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- Confirmation dialog before destructive undo
- Success/error toasts

### Nice-to-Have (Enhancements for Later)
- Step-by-step undo/redo (not just jump to point)
- Undo queue visualization (show branching paths)
- Undo different parts of session independently (e.g., undo tool calls only)
- Save undo point as named checkpoint
- Share undo point with others (create shared checkpoint)
- Visual diff showing what would be undone
- Redo to specific alternative paths (if multiple were explored)
- Undo history sidebar showing all branches
- Merge branches (combine work from two undo paths)
- Auto-save checkpoint periodically
- Export/import entire undo tree
