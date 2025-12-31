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

**Modal/Dialog overlay (reusing existing patterns)**

Rationale: Forking is a deliberate action requiring message selection. Follow the pattern from `SessionDialogs.tsx`:
- Desktop: Radix UI Dialog with max-w-[520px] (same as delete dialog)
- Mobile: MobileOverlayPanel bottom sheet (same as SessionDialogs)
- Reuse `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`

Layout (desktop):
```
┌─────────────────────────────────────┐
│  Fork from Message        [✕]       │
├─────────────────────────────────────┤
│  Search messages...                 │
│  May 12, 2:30 PM                    │
│  ┌────────────────────────────┐     │
│  │ "Fix the login bug..."     │     │
│  │ assistant: 3 responses     │[✓]  │ ← Selectable card
│  └────────────────────────────┘     │
│                                     │
│  ┌────────────────────────────┐     │
│  │ "Refactor database..."     │     │
│  │ May 10, 9:15 AM            │     │
│  └────────────────────────────┘     │
│                                     │
│         [Cancel]  [Fork]           │
└─────────────────────────────────────┘
```

Mobile: Full-height bottom sheet with swipe-to-close
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

**Trigger:** Fork button in header (next to session title) or Command Palette (Ctrl+Shift+F)

1. User clicks "Fork" button → Dialog opens
2. Shows all user messages (newest first) using reusable `SessionDialogs.tsx` patterns
3. **Each message card displays:**
   - Preview text (2 lines, truncation)
   - Timestamp (human-readable: "2 hours ago")
   - Response count badge (e.g., "3 responses")
4. **User interaction:**
   - Click to select (visual feedback: border highlight)
   - Keyboard nav: ↑↓ to select, Enter to fork, Esc to cancel
   - Search: Filter by message content in real-time
5. **Confirmation:** Selected message highlighted with checkmark icon
6. **Action:** Click "Fork" button (disabled until selection made)
7. **Result:** 
   - API call to `session.fork`
   - Auto-switch to new session
   - Toast notification: "Forked session from message"
   - Title: First 40 chars + "… (forked)"

### Web Advantages

- **Visual previews**: Each message card shows truncated preview text
- **Click to select**: Mouse clicks are faster than keyboard navigation
- **Search/filter**: Can search message content
- **Timestamp labels**: Human-readable timestamps relative to now
- **Responsive design**: Mobile shows full-height sheet, desktop shows centering modal
- **Accessibility**: Full keyboard support (arrow keys, Enter to fork, Esc to cancel)

### Mobile Considerations

**Implementation:** Reuse `MobileOverlayPanel` pattern from `SessionDialogs.tsx` (lines 772-782)

- **Bottom sheet:** Use existing `MobileOverlayPanel` component
  - Full-height: `contentMaxHeightClassName="h-[calc(100vh-8rem)]"`
  - Swipe-down to close (built into MobileOverlayPanel)
  - Backdrop blur (built-in)
  
- **Touch targets:** 
  - Message cards: min-height 72px (vs 48px desktop)
  - Buttons: 44x44px minimum (WCAG 2.1 AA)
  - Fork button: Fixed at bottom, full-width on mobile

- **Gestures:**
  - Swipe to dismiss (native MobileOverlayPanel)
  - Pull-to-refresh message list

- **Optimization:**
  - Lazy load messages (virtual scroll if >50 messages)
  - Debounced search (300ms)
  - Throttle scroll events

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
- **Extend `useSessionStore`** (reuse existing pattern from session management)
- Add state to existing session object structure:
  ```typescript
  // In SessionStore interface
  forkDialogState: {
    open: boolean;
    sourceSessionId: string | null;
    selectedMessageId: string | null;
    isLoading: boolean;
  }
  ```
- Add actions:
  ```typescript
  openForkDialog(sessionId: string): void
  closeForkDialog(): void
  selectForkMessage(messageId: string): void
  forkFromMessage(sessionId: string, messageId: string): Promise<void>
  ```

**File to modify:**
- `/home/idc/proj/openchamber-wj/packages/ui/src/stores/useSessionStore.ts` (extend existing store)

### Frontend Components

**New Components to Create:**

1. `ForkSessionDialog.tsx` - Dialog with message list for forking:
   - Reuse `SessionDialogs.tsx` pattern (770+ lines of proven dialog code)
   - Implement mobile-responsive dialog (same conditional rendering as SessionDialogs)
   - Message list with `Card` component (existing UI pattern)
   - Search input (reuse from `CommandPalette.tsx` input pattern)
   - Loading states (reuse skeleton patterns)

2. `ForkSessionButton.tsx` - Button in header:
   - Icon button with Remix icon (reuse Header button patterns)
   - Tooltip wrapper (reuse `Tooltip` component from existing patterns)
   - Disabled state when no session selected

**Existing Components to Modify:**

1. **Header.tsx** - Add fork button:
   - Add to header next to session title/actions
   - Follow existing `headerIconButtonClass` pattern (line 61)
   - Reuse tooltip patterns from same file

2. **CommandPalette.tsx** - Add commands:
   ```typescript
   // Add to CommandGroup
   <CommandItem onSelect={handleForkSession}>
     <RiGitBranchLine className="mr-2 h-4 w-4" />
     <span>Fork Session</span>
     <CommandShortcut>Ctrl+Shift+F</CommandShortcut>
   </CommandItem>
   ```

**Radix UI Primitives to Use:**
- Reuse from `@/components/ui/dialog`:
  - `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`
  - `DialogFooter`, `DialogClose`
- `MobileOverlayPanel` for mobile (existing pattern)

**File Locations:**
```
packages/ui/src/components/session/
  ├── ForkSessionDialog.tsx        (new - follows SessionDialogs pattern)
  ├── ForkSessionButton.tsx        (new)
packages/ui/src/components/layout/
  └── Header.tsx                   (modify - add fork button)
packages/ui/src/components/ui/
  └── CommandPalette.tsx           (modify - add fork command)
```

### State Management

**Zustand Store:**
- **Extend existing `useSessionStore`** (follow existing patterns from line 64+)
- Add to existing session state structure:
  ```typescript
  forkDialogState: {
    open: boolean;
    sourceSessionId: string | null;
    selectedMessageId: string | null;
    messages: Message[];  // Loaded for selection
    isLoading: boolean;
    error: string | null;
  }
  ```
- Add computed selectors (follow pattern from lines 99+):
  ```typescript
  canFork: (sessionId) => boolean
  selectedMessage: (sessionId) => Message | null
  ```
- Add actions (follow pattern from line 100+):
  ```typescript
  openForkDialog(sessionId: string): Promise<void>
  closeForkDialog(): void
  selectForkMessage(messageId: string): void
  forkFromMessage(sessionId: string, messageId: string): Promise<void>
  ```
- **Persistence:** Not needed (temporary dialog state)

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

### Accessibility (A11y)

**ARIA attributes:**
- `dialog`: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="fork-dialog-title"`
- List items: `role="option"`, `aria-selected={selected}`
- Search: `aria-label="Search messages"`

**Keyboard navigation:**
- Global: `Esc` to close dialog (built into Radix Dialog)
- List: `↑↓` to navigate messages, `Enter` to select
- Buttons: `Space`/`Enter` to activate
- Focus trap: Automatic (Radix Dialog)

**Screen readers:**
- Live region for status updates (loading, success, errors)
- Announce: "Fork dialog opened" → "X messages available" → Selection made

**Contrast & sizing:**
- Follow existing `typography-*` classes (WCAG AA compliant)
- Focus indicators: `focus-visible:ring-2` (existing pattern)

---

## MVP vs Nice-to-Have

### MVP (Must-have)
- ✅ Fork session from any user message
- ✅ Dialog showing message list with previews
- ✅ Search/filter messages
- ✅ Auto-switch to new session after fork
- ✅ Success/error toast notifications (Sonner)
- ✅ Full keyboard navigation (A11y)
- ✅ Mobile responsive (MobileOverlayPanel)

### Nice-to-Have (Enhancements for Later)
- Visual fork lineage in session sidebar (parent/child relationships)
- Bulk fork from multiple messages
- Fork with context selection (include/exclude items)
- Undo fork (delete newly created session)
- Session family tree visualization
- Fork to different directory/worktree
- Fork templates (save reusable patterns)
- Auto-rename suggestions via content analysis
