# Feature: Prompt Stash

## Overview

**Description**
Save, organize, and quickly retrieve frequently-used prompts or in-progress prompts. Users can stash the current input to restore later, and browse a history of stashed prompts.

**OpenCode Terminal Implementation**
In TUI, users can open a "Stash" dialog showing a list of previously stashed prompts with timestamps and line counts. Selecting a prompt loads it back into the input, removes it from stash. Keybind to open stash anytime.

**Value Proposition**
Eliminates re-typing common prompts. Allows users to "park" a complex prompt they're working on without losing it. Great for templates, repeated tasks, or when switching contexts mid-prompt.

---

## Web-Optimized Design

### UI Pattern

**Dropdown/combobox + saved prompts sidebar**

Rationale:
- Stash should be quick to access but not take up screen space
- Web allows visual previews and richer organization than TUI
- Drag-and-drop for prioritization
- Better than dialog because can be persistent or collapsible side panel

Layout:
```
┌─────────────────────────────────────────┐
│  [Input field with current prompt]      │
│  [Send]  [Save to Stash ↓]  [Clear]    │ ← Stash button
├─────────────────────────────────────────┤
│  Chat messages...                       │
└─────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ Stash ▼ [+] [Refresh]             [✕]   │ ← Stash dropdown/panel
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐  │
│ │ Fix authentication bug (2min ago) │  │
│ │ Can you investigate the login...  │  │
│ │                                  │  │
│ │                [Load] [Delete]   │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ Deploy to production (1hr ago)    │  │
│ │ Review the deployment checklist...│  │
│ │                                  │  │
│ │                [Load] [Delete]   │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ Code review template               │  │
│ │ Review this PR focusing on...    │  │
│ │                                  │  │
│ │                [Load] [Delete]   │  │
│ └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

Alternative approaches:
1. **Persistent sidebar panel** - Always visible, collapsible
2. **Settings page section** - "Saved Prompts" tab
3. **Bottom drawer** - Slide up from bottom

### User Workflow

**Save to stash:**
1. User types a prompt in the input field
2. User doesn't want to send yet but wants to save it
3. User clicks "Save to Stash" button (dropdown icon)
4. Stash panel opens showing saved prompts
5. Current prompt is automatically saved to top of list
6. Success toast: "Prompt saved to stash"
7. Input field is optionally cleared (user preference)

**Load from stash:**
1. User opens stash (via button or Command Palette)
2. Sees list of saved prompts sorted by recency
3. User can:
   - Click "Load" on a prompt to replace current input
   - Click on prompt card to preview and load
   - Drag prompt to input field (advanced)
4. Loaded prompt appears in input field
5. Prompt is removed from stash (TUI behavior, or keep as option)
6. User can edit before sending

**Delete from stash:**
1. User opens stash panel
2. Clicks "Delete" on a saved prompt
3. Confirmation: "Delete this saved prompt?"
4. Prompt removed from stash

**Organize stash:**
1. User can add tags/labels to saved prompts
2. Filter stash by tags or search text
3. Reorder prompts by drag-and-drop
4. Pin important templates to top

**Command Palette integration:**
1. User opens Command Palette
2. Types "stash" or "saved"
3. Sees "Open Prompt Stash" and list of recent prompts
4. Can type to search and load directly without opening panel

### Web Advantages

- **Visual previews**: Show truncated prompt text with hover for full content
- **Rich metadata**: Timestamp, source session, tags, usage count
- **Search/filter**: Full-text search across all stashed prompts
- **Rich text formatting**: If prompts include markdown, show preview
- **Tags/categories**: Organize prompts by project, type, etc.
- **Keyboard shortcuts**: Quick load with arrow keys + Enter
- **Drag-and-drop**: Load prompt by dragging to input field
- **Export/import**: Share saved prompts between users/devices
- **Quick actions**: Right-click menu for load/delete/edit

### Mobile Considerations

- Stash as bottom sheet instead of dropdown
- Swipe up to open, swipe down to close
- Full-height scrollable list
- "Add to Stash" floating action button (FAB)
- Larger touch targets for load/delete buttons
- Pull-to-refresh to reload stash
- Search bar auto-focus panel open

---

## Technical Implementation

### Backend Requirements

**OpenCode API Check:**

Result:
- ❌ API missing - Stash is client-side in TUI (uses KV store)

Backend does NOT provide stash API. Store prompt stash entirely on client side.

**Client-side storage options:**
1. **localStorage** - Simple, persists across sessions
2. **IndexedDB** - Better for larger stash with many items
3. **Browser-synced** - Sync with user account (if OpenCode adds account system)

**Decision**: Use localStorage for MVP, can migrate to IndexedDB or sync API later.

**Store Functions:**

Create `usePromptStash` (new store, or hook using localStorage):
- `stashedPrompts: StashedPrompt[]` - Array of saved prompts
- `saveToStash(text: string, metadata?: object)` - Add new prompt
- `loadFromStash(id: string): string` - Get and optionally remove
- `deleteFromStash(id: string)` - Remove without loading
- `search(query: string): StashedPrompt[]` - Filter stash

**File to create:**
- `/home/idc/proj/openchamber-wj/packages/ui/src/stores/usePromptStash.ts`

Or implement as hook:
- `/home/idc/proj/openchamber-wj/packages/ui/src/hooks/usePromptStash.ts`

### Frontend Components

**New Components to Create:**

`StashButton.tsx` - Button to open stash dropdown:
- Button with saved icon
- Badge showing count of stashed prompts
- Opens/stashes panel

`StashPanel.tsx` - Dropdown/panel showing saved prompts:
- List of StashedPromptCard components
- Search/filter input
- "Add current prompt" button
- Refresh/delete all buttons
- Empty state message

`StashedPromptCard.tsx` - Individual saved prompt display:
- Truncated prompt preview (first 2-3 lines)
- Metadata (timestamp, source session)
- Tags/labels
- Load and Delete buttons
- Click to load

`StashEmptyState.tsx` - Empty state when no prompts saved:
- Prompt with example use cases
- "Learn more about stash" link to documentation

**Existing Components to Modify:**

`ChatInput.tsx` - Add stash button:
- Add StashButton next to Send button
- Wire up stash actions
- Persist stash state

`CommandPalette.tsx` - Add stash commands:
- "Open Prompt Stash" command
- "Save to Stash" command
- List of recent prompts as shortcuts to load

**Radix UI Primitives to Use:**
- `Popover` or `DropdownMenu` for stash panel
- `Dialog` for alternative full-screen view (mobile)
- `AlertDialog` for delete confirmation
- `Combobox` for search/filter interface if using command palette pattern

**File Locations:**
```
packages/ui/src/stores/
  └── usePromptStash.ts             (new)

packages/ui/src/components/chat/
  ├── ChatInput.tsx                 (modify - add stash button)
  ├── stash/                       (new directory)
  │   ├── StashButton.tsx           (new)
  │   ├── StashPanel.tsx            (new)
  │   ├── StashedPromptCard.tsx     (new)
  │   └── StashEmptyState.tsx       (new)

packages/ui/src/components/ui/
  └── CommandPalette.tsx            (modify - add stash commands)
```

### State Management

**Zustand Store:**
- New: `usePromptStash`
- State:
  ```typescript
  interface StashedPrompt {
    id: string
    text: string
    timestamp: number
    sourceSessionId?: string
    tags?: string[]
    usageCount: number
  }

  interface PromptStashStore {
    stashedPrompts: StashedPrompt[]
    loading: boolean

    // Actions
    savePrompt(text: string, metadata?: Partial<StashedPrompt>): void
    loadPrompt(id: string): string | null
    deletePrompt(id: string): void
    searchPrompts(query: string): StashedPrompt[]
    clearAll(): void
    reorderPrompts(promptIds: string[]): void
  }
  ```
- Persistence: Save to localStorage on every change
- Load from localStorage on mount

**Alternative**: Implement as React hook with `useState` + `useEffect` if simpler

---

## Edge Cases & Concerns

**Storage limits:**
- localStorage has 5-10MB limit
- Large text could exceed quickly
- **Solution**: 
  - Truncate very long prompts (warn user)
  - Use IndexedDB for larger stash (future)
  - Limit stash count (e.g., max 100 items)

**Per-device sync:**
- Stash stored locally won't sync across devices
- **Solution**: Document this limitation, plan for cloud sync if account system added

**Sensitive data:**
- Users might save prompts with secrets/API keys
- **Solution**: Warning about not saving sensitive data, consider client-side encryption if needed

**Duplicate detection:**
- Users might save same prompt twice
- **Solution**: Show warning "Similar prompt already saved", offer to overwrite or keep both

**Stash sharing:**
- Users might want to share stashed templates
- **Solution**: Export/import JSON file of stash (nice-to-have)

**Prompt formatting:**
- Saved prompts might include markdown, code blocks, etc.
- **Solution**: Store as plain text, render preview with markdown if desired

**Persistence across reloads:**
- Stash should persist between page refreshes
- **Solution**: localStorage handles this automatically

**Large stash performance:**
- Loading huge list of prompts could be slow
- **Solution**: Virtual scroll for list, lazy render cards

**Mobile limits:**
- Even smaller storage on some mobile browsers
- **Solution**: Aggressive cleanup of old unused prompts

---

## MVP vs Nice-to-Have

### MVP (Must-have)
- Save current prompt to stash
- Load stashed prompt to input
- List all saved prompts with metadata
- Delete individual prompts
- Search/filter stash
- Persist stash in localStorage
- Command Palette integration

### Nice-to-Have (Enhancements for Later)
- Save with tags/labels
- Filter by tags
- Reorder prompts by drag-and-drop
- Pin important templates
- Export/import stash to JSON
- Share stash snippets (via share link)
- Prompt templates with placeholders (e.g., "Review {PR_NUMBER}")
- Auto-categorize by session/directory
- Show usage statistics (how often loaded)
- Auto-suggest similar stashed prompts when typing
- Rich text editor for editing stashed prompts
- Collaboration features (share stash with team)
- Sync stash across devices via account
- Stash analytics (most used prompts)
- Quick-add from AI suggestion responses
