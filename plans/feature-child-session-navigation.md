# Feature: Child Session Navigation

## Overview

**Description**
Allow users to navigate between sibling sessions (created via fork or worktrees) and jump to parent sessions, showing the session hierarchy with breadcrumbs and navigation controls.

**OpenCode Terminal Implementation**
In the terminal TUI, users can:
- Run `session.child.cycle` to navigate to next sibling session
- Run `session.child.cycle_reverse` to navigate to previous sibling session
- Run `session.parent` to navigate to parent session
- Sessions are linked via `parentID` field in session metadata
- Shows current position in session hierarchy in status bar

**Value Proposition**
- Explore multiple solution branches created via forking without losing context
- Compare AI responses across different approach paths
- Navigate back and forth between experiments in a worktree
- Understand session lineage and relationships at a glance

---

## Web-Optimized Design

### UI Pattern

**Header breadcrumb navigation + Sidebar relationship section**

Rationale: Navigation should be visible and accessible without opening dialogs. Two-part implementation:
1. **Header navigation:** Arrow buttons for quick parent/child navigation
2. **Session sidebar:** "Related Sessions" section showing hierarchy

Desktop Layout (Header):
```
┌─────────────────────────────────────────────────────────────────────┐
│  ← [Parent]  │  Feature/feature-login  │  [Child 1]  →  [Child 2] → │
│              └─────────────────────────┘                             │
└─────────────────────────────────────────────────────────────────────┘
```

Desktop Layout (Session Sidebar):
```
┌─────────────────────────────────────┐
│  Related Sessions                   │
│  ┌─── Parent ───────────────────┐   │
│  │  ← feature/authentication    │   │
│  └───────────────────────────────┘   │
│                                     │
│  ┌─── Current ──────────────────┐   │
│  │  ▶ feature/feature-login     │   │
│  │    (selected)                │   │
│  └───────────────────────────────┘   │
│                                     │
│  ┌─── Siblings ─────────────────┐   │
│  │  ○ feature/login-api         │   │
│  │  ● feature/login-frontend    │   │
│  │  ○ feature/login-experimental│   │
│  └───────────────────────────────┘   │
│                                     │
│  ┌─── Children ─────────────────┐   │
│  │  ○ feature/login-refactor    │   │
│  │  (created from fork)         │   │
│  └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

### User Workflow

**Trigger 1: Header arrow buttons**

1. User sees ← (parent) and → (next sibling) buttons in header
2. **Parent button:**
   - Shows parent session name in tooltip
   - Click to navigate to parent session
   - Disabled if no parent session
3. **Sibling buttons:**
   - → (next sibling): Navigate to next session in worktree
   - ← (previous sibling): Navigate to previous session in worktree
   - Shows current position (e.g., "2/5") in tooltip
   - Disabled at boundaries

**Trigger 2: Session sidebar "Related Sessions"**

1. User opens session sidebar (if not visible)
2. Expands "Related Sessions" section (collapsible)
3. Sees hierarchy grouped by:
   - **Parent:** One level up
   - **Siblings:** Same parent, different branches
   - **Children:** Sessions forked from current
4. **Interaction:**
   - Click any session to navigate
   - Current session highlighted
   - Hover shows session metadata (last active, message count)

**Trigger 3: Command Palette**

1. Press Ctrl+Shift+P (or Cmd+Shift+P on Mac)
2. Type "next session" or "previous session"
3. Select command to navigate

### Web Advantages

- **Visual hierarchy:** Sidebar shows complete relationship graph
- **Click navigation:** Mouse clicks are faster than keyboard cycling
- **Breadcrumb trail:** Shows full path from root session
- **Visual indicators:** Icons distinguish parent/sibling/child
- **Drag-and-drop:** Reorder siblings (nice-to-have)

### Mobile Considerations

**Implementation:** Use header controls + bottom sheet navigation

- **Header:** Simplified navigation bar at top
  ```
  ┌─────────────────────────────────────┐
  │  ← Parent  │  Current Session  │ →  │
  └─────────────────────────────────────┘
  ```
  
- **Bottom sheet:** Long-press header for full navigation sheet
  ```
  ┌─────────────────────────────────────┐
  │  Navigate Session           [✕]     │
  ├─────────────────────────────────────┤
  │  ┌─ Parent ────────────────────┐   │
  │  │ ← feature/authentication    │   │
  │  └───────────────────────────────┘   │
  │                                     │
  │  ┌─ Current ────────────────────┐   │
  │  │ ● feature/feature-login      │   │
  │  │   (2 messages)               │   │
  │  └───────────────────────────────┘   │
  │                                     │
  │  ┌─ Siblings ───────────────────┐   │
  │  │ ○ feature/login-api          │   │
  │  │ ○ feature/login-frontend     │   │
  │  └───────────────────────────────┘   │
  │                                     │
  │  ┌─ Children ───────────────────┐   │
  │  │ ○ feature/login-refactor     │   │
  │  └───────────────────────────────┘   │
  │                                     │
  │    [Previous]  [Current]  [Next]    │
  └─────────────────────────────────────┘
  ```

- **Gestures:**
  - Swipe left/right on header to navigate siblings
  - Long-press header to open navigation sheet
  - Pull-to-refresh related sessions

---

## Technical Implementation

### Backend Requirements

**OpenCode API Check:**

Result:
- ✅ API exists: `session.children`, `session.parent` → Implement UI only

API endpoints:
- `GET /session/{id}/children` - Returns list of child sessions
- `GET /session/{id}/parent` - Returns parent session object
- `GET /session/{id}/siblings` - Returns list of sibling sessions
- `POST /session/{id}/child/{childId}` - Navigate to child session (optional)

**Store Functions:**
- **Extend `useSessionStore`**
- Add state for navigation:
  ```typescript
  sessionNavigationState: {
    currentSessionId: string | null;
    parentSession: Session | null;
    childSessions: Session[];
    siblingSessions: Session[];
    siblingIndex: number; // Position in sibling list
    isLoading: boolean;
  }
  ```
- Add actions:
  - `fetchSessionHierarchy(sessionId)` - Load all related sessions
  - `navigateToParent()` - Navigate to parent session
  - `navigateToSibling(direction: 'next' | 'prev')` - Cycle through siblings
  - `navigateToSession(sessionId)` - Navigate to specific session

### Frontend Components

**New Components to Create:**

1. `SessionNavigationHeader.tsx` - Arrow buttons and current session display
2. `SessionBreadcrumb.tsx` - Full path from root to current session
3. `RelatedSessionsSection.tsx` - Sidebar section with hierarchy
4. `SessionHierarchyItem.tsx` - Individual session in hierarchy tree
5. `SessionNavigationSheet.tsx` - Mobile bottom sheet navigation

**Existing Components to Modify:**

1. `Header.tsx` - Add SessionNavigationHeader component (line ~84+)
2. `SessionSidebar.tsx` - Add RelatedSessionsSection (around line 450+)
3. `CommandPalette.tsx` - Add navigation commands (next/prev/parent/children)
4. `SessionSwitcherDialog.tsx` - Link to parent/child sessions

**Radix UI Primitives to Use:**
- `Collapsible` for sidebar section
- `Tooltip` for button tooltips
- `DropdownMenu` for session actions menu

**File Locations:**
```
packages/ui/src/components/session/
  ├── SessionNavigationHeader.tsx
  ├── SessionBreadcrumb.tsx
  ├── RelatedSessionsSection.tsx
  ├── SessionHierarchyItem.tsx
  ├── SessionNavigationSheet.tsx
  └── index.ts

packages/ui/src/components/layout/
  └── Header.tsx (modify)
```

### State Management

**Zustand Store:**

Extend `useSessionStore` with:

```typescript
interface SessionHierarchy {
  parentId: string | null;
  parentSession: Session | null;
  childIds: string[];
  childSessions: Map<string, Session>;
  siblingIds: string[];
  siblingSessions: Map<string, Session>;
  siblingIndex: number;
}

interface SessionStore {
  // ... existing state ...
  sessionHierarchy: Map<string, SessionHierarchy>;
  navigationLoading: Set<string>;
  
  // Actions
  fetchSessionHierarchy(sessionId: string): Promise<void>;
  navigateToParent(): Promise<void>;
  navigateToSibling(direction: 'next' | 'prev'): Promise<void>;
  navigateToSession(sessionId: string): Promise<void>;
  getSessionPath(sessionId: string): Session[];
}
```

**Computed Selectors:**
- `hasParent()` - Check if parent exists
- `hasNextSibling()` - Check if next sibling exists
- `hasPrevSibling()` - Check if previous sibling exists
- `getSessionPosition()` - Returns "2/5" style position string
- `getSessionPath()` - Returns array from root to current

---

## Edge Cases & Concerns

### Performance

- **Deep hierarchies:** 10+ levels deep
  - Solution: Fetch only immediate parent/siblings/children
  - Lazy load deeper levels on demand
  
- **Many siblings:** 50+ siblings in worktree
  - Solution: Virtual scroll in sidebar section
  - Pagination for navigation sheet
  
- **Circular references:** Sessions linked in loop (shouldn't happen but defensive)
  - Solution: Detect cycles, limit navigation depth
  - Show warning, break at cycle

### Error Handling

- **Session deleted:** Parent/child/sibling was deleted
  - Solution: Filter out deleted sessions from hierarchy
  - Show "(Deleted)" placeholder with option to remove
  
- **Permission denied:** Can't access parent/child session
  - Solution: Show "Access denied" with reason
  - Disable navigation, show tooltip explaining why
  
- **Network error:** Failed to fetch hierarchy
  - Solution: Retry button with exponential backoff
  - Show cached data if available

### Mobile/Responsive

- **Screen width:** Very narrow screens
  - Solution: Hide sibling navigation in header
  - Use hamburger menu for navigation
  
- **Touch targets:**
  - Arrow buttons: 44x44px minimum
  - Sidebar items: 48px minimum
  - Navigation sheet: Large touch targets

### Session Naming

- **Unnamed sessions:** Forked sessions initially have no name
  - Solution: Use first message preview as name
  - Show "(Untitled)" with message preview tooltip
  
- **Duplicate names:** Multiple sessions with same auto-generated name
  - Solution: Append timestamp or ID suffix
  - Show full name on hover

---

## MVP vs Nice-to-Have

### MVP (Minimum Viable Version)

**Must-have features:**
- Header navigation buttons (parent, next sibling, prev sibling)
- Basic tooltip showing session names
- Session sidebar "Related Sessions" section
- Fetch and display parent session
- Fetch and display sibling sessions
- Keyboard shortcuts (Ctrl+Shift+N/P)
- Command Palette integration
- Loading states
- Error handling

**Excluded from MVP:**
- Children sessions display
- Full breadcrumb trail (root to current)
- Session hierarchy visualization tree
- Drag-and-drop reordering
- Navigation history (back/forward)

### Nice-to-Have (Enhancements for Later)

1. **Full hierarchy:**
   - Children sessions section
   - Grandparent sessions
   - Root session indicator
   - "Show in tree" visualization

2. **Visual enhancements:**
   - Session tree diagram in sidebar
   - Timeline view of session creation
   - Color-coded by session status (active, archived)
   - Session preview cards on hover

3. **Advanced navigation:**
   - Navigation history (back/forward buttons)
   - Jump to any ancestor
   - Compare two sessions side-by-side
   - Merge sessions (nice-to-have)

4. **Session management:**
   - Create new fork from current point
   - Rename sessions from hierarchy view
   - Delete sessions from hierarchy view
   - Mark sessions as "important" in hierarchy

5. **Keyboard shortcuts:**
   - Ctrl+Shift+Up: Go to parent
   - Ctrl+Shift+Down: Go to first child
   - Alt+Number: Jump to Nth sibling
   - Ctrl+Shift+H: Show hierarchy

---

## Accessibility

- **Keyboard shortcuts:**
  - Ctrl+Shift+N: Next sibling
  - Ctrl+Shift+P: Previous sibling
  - Ctrl+Shift+Up: Parent session
  - Tab: Navigate between buttons
  - Enter/Space: Activate navigation
  
- **ARIA attributes:**
  - `aria-label` on navigation buttons with session names
  - `aria-live` for navigation feedback
  - `role="navigation"` for header component
  - `aria-expanded` for collapsible sidebar section
  - `aria-level` for hierarchy nesting depth
  
- **Focus management:**
  - Focus follows navigation
  - Announce new session name after navigation
  - Skip link to main content after navigation
  
- **Screen reader:**
  - Announce navigation action: "Navigated to parent session: feature/authentication"
  - Read sibling position: "Session 2 of 5"
  - Describe relationship: "Child of feature/authentication"

---

## Success Metrics

1. **Usage tracking:**
   - Navigation button clicks (parent, next, prev)
   - Sidebar section expansion
   - Keyboard shortcut usage
   - Command palette usage

2. **User feedback:**
   - Navigation helpfulness rating
   - Feature request submissions
   - Bug reports about hierarchy

3. **Performance:**
   - Hierarchy fetch time
   - Time to first meaningful paint after navigation
   - Memory usage for deep hierarchies

---

## Implementation Order

1. **Week 1:**
   - Create navigation state in useSessionStore
   - Create SessionNavigationHeader component
   - Add API calls to fetch parent/siblings
   - Implement header buttons with tooltips

2. **Week 2:**
   - Add RelatedSessionsSection to SessionSidebar
   - Implement sibling navigation logic
   - Add keyboard shortcuts (Ctrl+Shift+N/P)
   - Add Command Palette commands

3. **Week 3:**
   - Mobile bottom sheet navigation
   - Loading and error states
   - Polish and accessibility
   - Children sessions display

4. **Week 4 (Nice-to-Have):**
   - Full breadcrumb trail
   - Session hierarchy visualization
   - Navigation history
   - Advanced keyboard shortcuts

---

## References

- **Existing patterns:** `Header.tsx` (header buttons), `SessionSidebar.tsx` (sections)
- **Mobile pattern:** `MobileOverlayPanel` component
- **Tooltip pattern:** Existing Tooltip component usage
- **Store pattern:** `useSessionStore.ts` for state management
- **API client:** `/packages/ui/src/lib/opencode/client.ts`
- **Command palette:** `CommandPalette.tsx` integration