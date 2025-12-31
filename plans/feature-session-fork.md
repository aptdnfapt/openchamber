# Feature: Session Fork

## Overview

**Description**
Allow users to create a new session that branches from any message in the conversation history, preserving the context up to that point while diverging from there.

**OpenCode Terminal Implementation**
In the terminal TUI, users can press the fork keybind to open "Fork from message" dialog, which shows all user messages in the session. Selecting any message creates a new session with that message as the latest prompt, carrying forward all context up to that point.

**Value Proposition**
Enables users to explore different solution paths without losing previous work. Perfect for trying multiple approaches, A/B testing AI responses, or branching off after achieving a milestone but wanting to continue experiments.

---

## Web-Optimized Design

### UI Pattern

**Modal/Dialog overlay**

Rationale: Forking is a deliberate action that requires selecting from the message history. A dialog provides:
- Full list of messages to browse
- Clear preview of what each message contains
- Confirmation to prevent accidental forks
- Space for metadata about what will be preserved

Layout:
```
┌─────────────────────────────────────┐
│  Fork from Message        [✕]       │
├─────────────────────────────────────┤
│  ┌─ Message Preview ──────────┐    │
│  │ "Fix the login bug..."     │    │
│  │                         ┌─┐ │    │
│  │ "Can you create a new  │F│ │    │
│  │  authentication flow?  │o│ │    │
│  │                        │r│ │    │
│  │                        │k│ │    │
│  └────────────────────────┴─┘ │    │
│                                 │    │
│  [Search messages...]           │    │
│  May 12, 2:30 PM                │    │
│                                 │    │
│  ┌────────────────────────────┐ │    │
│  │ "Refactor database..."     │ │    │
│  │ May 10, 9:15 AM            │ │    │
│  └────────────────────────────┘ │    │
│                                 │    │
│         [Cancel]  [Fork]       │    │
└─────────────────────────────────────┘
```

### User Workflow

1. User is in a session and clicks "Fork" button (from header menu or Command Palette)
2. Dialog opens showing all user messages in the session, newest first
3. Each message shows:
   - Content preview (first 100 chars)
   - Timestamp
   - Assistant response count (how many turns happened after)
4. User can scroll through and click to select
5. Selected message shows full preview
6. User clicks "Fork" button
7. New session is created automatically and opened:
   - Starts fresh at the selected message
   - Preserves all context up to that point
   - Has same directory, worktree settings
   - Title derived from selected message
8. Confirmation toast appears: "Forked new session from message"

### Web Advantages

- **Visual previews**: Each message card shows truncated preview text
- **Click to select**: Mouse clicks are faster than keyboard navigation
- **Search/filter**: Can search message content
- **Timestamp labels**: Human-readable timestamps relative to now
- **Responsive design**: Mobile shows full-height sheet, desktop shows centering modal
- **Accessibility**: Full keyboard support (arrow keys, Enter to fork, Esc to cancel)

### Mobile Considerations

- Bottom sheet approach instead of centered modal
- Full-height scrollable list
- Larger touch targets for message selection
- Swipe gestures for quick navigation
- "Fork Now" button fixed at bottom for easy thumb access

---

## Technical Implementation

### Backend Requirements

**OpenCode API Check:**

Result:
- ✅ API exists: `session.fork` → Implement UI only

API endpoint: `POST /session/fork`
- Takes: `sessionID` and `messageID`
- Returns: New session object with pre-populated context

**Store Functions:**
- `useSessionStore` already has session management functions
- Add: `forkSession(sessionID: string, messageID: string)` - calls backend, creates new session, switches to it
- No new store file needed - extend existing `useSessionStore`

**File to modify:**
- `/home/idc/proj/openchamber-wj/packages/ui/src/stores/useSessionStore.ts`

### Frontend Components

**New Components to Create:**

`ForkSessionDialog.tsx` - Dialog that shows message history for forking:
- Message list with previews
- Search/filter input
- Selection state management
- Fork button action
- Uses Radix Dialog

`ForkSessionButton.tsx` - Toolbar/header button to trigger fork:
- Button with fork icon
- Tooltip "Fork from message"
- Opens dialog on click

**Existing Components to Modify:**

`ChatHeader.tsx` or `SessionSidebar.tsx` - Add fork button to action menu:
- Add fork icon button to existing toolbar
- Wire up to open fork dialog

`CommandPalette.tsx` - Add "Fork Session" command:
- New menu item in CommandDialog
- Triggers fork dialog open

**Radix UI Primitives to Use:**
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`
- `DialogFooter`

**File Locations:**
```
packages/ui/src/components/chat/
  ├── ForkSessionDialog.tsx        (new)
  ├── ForkSessionButton.tsx        (new)
  ├── ChatHeader.tsx               (modify - add fork trigger)
packages/ui/src/components/ui/
  ├── CommandPalette.tsx           (modify - add fork command)
```

### State Management

**Zustand Store:**
- Existing: `useSessionStore`
- Add state:
  - `isForkDialogOpen: boolean`
  - `forkSourceSessionId: string | null`
- Add actions:
  - `openForkDialog(sessionId: string)`
  - `closeForkDialog()`
  - `forkFromMessage(sessionId: string, messageId: string)`

---

## Edge Cases & Concerns

**Performance concerns:**
- Loading all messages for large sessions could be slow
- **Solution**: Use pagination or load messages lazily as user scrolls

**Mobile/desktop differences:**
- Desktop: Centered modal
- Mobile: Bottom sheet
- **Solution**: Use separate responsive components or conditional rendering

**Forking empty session:**
- What if session has only the current message?
- **Solution**: Show empty state or disable fork button

**Forking in-flight session:**
- What if session is currently streaming a response?
- **Solution**: Allow fork, but show warning that in-work response won't be included

**Forking from already-compacted session:**
- What if messages have been summarized/compacted?
- **Solution**: API handles this - user sees available messages only

**Permission errors:**
- What if API returns error?
- **Solution**: Show error toast with specific message, keep dialog open

**Naming the forked session:**
- What should the new session title be?
- **Solution**: Use message preview (first 50 chars) + "(forked)" suffix, allow rename after

---

## MVP vs Nice-to-Have

### MVP (Must-have)
- Fork session from any user message
- Dialog showing message list with previews
- Search/filter messages
- Auto-switch to new session after fork
- Success/error toast notifications

### Nice-to-Have (Enhancements for Later)
- Visual indicator in timeline showing where fork points exist (show parent/child relationships)
- Bulk fork from multiple messages as separate sessions
- Fork with selection of which context items to include (e.g., "exclude tool outputs")
- Undo fork (delete newly created session)
- View session lineage/family tree in sidebar
- Fork from specific assistant tool calls (not just user messages)
- Auto-rename fork suggestions based on message content analysis
- Fork to different directory/worktree
- Save fork as template for reusability
