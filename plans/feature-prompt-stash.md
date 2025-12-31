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

**Dropdown/Popover + Command Palette integration**

Rationale: Stash is quick access → dropdown from input toolbar
- **Popover panel**: Collapsible, shows on click
- **Command Palette**: Quick search + load without opening panel
- **Web advantage**: Rich previews, search, drag-and-drop (future)

Layout (desktop):
```
┌─────────────────────────────────────────┐
│  [Input field with current prompt]      │
│  [Send]  [★ Stash ▼]  [Clear]          │ ← Stash dropdown button
├─────────────────────────────────────────┤
│  Chat messages...                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ★ Stash (3)            [Search...] [+]  │ ← Popover panel
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Fix auth bug (2m ago)          [📋]│ │ ← Prompt card
│ │ "Can you investigate the..."        │ │
│ │                     [Load] [Delete]│ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Deploy to prod (1h ago)        [📋]│ │
│ │ "Review the checklist..."           │ │
│ │                     [Load] [Delete]│ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Code review template (2d ago)  [📋]│ │
│ │ "Review this PR focusing on..."     │ │
│ │                     [Load] [Delete]│ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Implementation patterns:**
- Reuse `ChatInput.tsx` dropdown pattern (lines 1081-1113)
- Reuse `DropdownMenu` component (existing Radix UI)
- Reuse `CommandPalette.tsx` search pattern

### User Workflow

**Trigger:** Stash button in input toolbar (★ icon) or Command Palette (Ctrl+K → "Stash")

**Save to stash:**
1. User types prompt in input field
2. Clicks "★ Stash" button (input toolbar)
3. **Auto-save:** Current input saved to stash top
4. Toast: "Saved to stash"
5. Input optionally cleared (toggle in settings)

**Load from stash:**
1. Click "★ Stash" → Popover opens
2. Shows stashed prompts (newest first)
3. **Card displays:**
   - Title (first 40 chars)
   - Preview (first 2 lines)
   - Timestamp (human-readable)
   - Usage count badge (if tracked)
4. **Actions:**
   - Click "Load" → Replaces input, focus textarea
   - Click card → Preview modal → Load
   - Drag to input (future nice-to-have)
5. **Option:** Remove from stash on load (toggle)

**Delete from stash:**
1. Hover over prompt card → "Delete" button appears
2. Click → Confirmation dialog
3. Confirm → Removed from stash
4. Toast: "Removed from stash"

**Search stash:**
1. Click "★ Stash" or Ctrl+K → "Search stash"
2. Type to filter prompts (real-time)
3. Results show matching prompts
4. Load directly from search results

**Command Palette integration:**
```
Ctrl+K → "Stash" shows:
- "Open Prompt Stash" (opens popover)
- "Fix authentication bug" (direct load)
- "Deploy to production" (direct load)
- "Save current input to stash"
```

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

**Implementation:** Reuse existing mobile patterns

- **Stash panel as bottom sheet:**
  - Use `MobileOverlayPanel` (same as other dialogs)
  - Full-height: `contentMaxHeightClassName="h-[calc(100vh-8rem)]"`
  - Swipe down to dismiss (built-in)
  - FAB for "Save current" if input has content

- **Prompt cards:**
  - Larger touch targets (48x48px buttons)
  - Full-width cards
  - Visible actions (not just on hover)
  - Swipe left to delete (common mobile pattern)

- **Search:**
  - Auto-focus search bar when panel opens
  - Large search input (44px height)
  - Clear button visible

- **FAB (Floating Action Button):**
  - Show when input has content
  - "Save to stash" button (bottom right)
  - Ripple effect on press

- **Keyboard handling:**
  - Hide panel when keyboard opens
  - Restore panel after keyboard dismiss
  - Quick save via keyboard shortcut (if keyboard visible)

---

## Technical Implementation

### Backend Requirements

**OpenCode API Check:**

Result:
- ❌ API missing - Stash is client-side only

**Decision:** Use `localStorage` for MVP (simple, persists across sessions)

**Store Functions:**

**Create `usePromptStashStore`** (new Zustand store):
```typescript
interface StashedPrompt {
  id: string;
  text: string;
  title: string;           // First 40 chars of text
  timestamp: number;
  usageCount: number;
  tags?: string[];
}

interface PromptStashStore {
  prompts: StashedPrompt[];
  
  // Actions
  savePrompt(text: string): void
  loadPrompt(id: string): string | null
  deletePrompt(id: string): void
  searchPrompts(query: string): StashedPrompt[]
  updatePrompt(id: string, updates: Partial<StashedPrompt>): void
  clearAll(): void
  reorderPrompts(promptIds: string[]): void  // For drag-and-drop (future)
}
```

**Persistence:** 
- Save to `localStorage` key `openchamber-prompt-stash`
- Load on store initialization
- Auto-save on every change

**File to create:**
- `/home/idc/proj/openchamber-wj/packages/ui/src/stores/usePromptStashStore.ts`

**Storage limits:**
- Max 50 prompts (configurable)
- Max 10KB per prompt (truncate with warning)
- Total storage: ~500KB (well under 5MB localStorage limit)

### Frontend Components

**New Components to Create:**

1. **StashButton.tsx** - Input toolbar button:
   - Reuse `ChatInput.tsx` icon button patterns (lines 1089-1091)
   - Badge showing stash count (like `SessionSidebar.tsx` badges)
   - Tooltip: "Save to stash (Ctrl+S)"
   - Opens StashPanel on click

2. **StashPanel.tsx** - Popover panel:
   - Reuse `DropdownMenu` pattern (existing Radix UI)
   - Position: align-end (bottom-right of button)
   - Max height: `max-h-[400px]` with scroll
   - Search input at top (reuse CommandPalette input)
   - "Save current" button
   - Prompt list with StashedPromptCard

3. **StashedPromptCard.tsx** - Individual prompt item:
   - Reuse `SettingsSidebarItem.tsx` pattern
   - Title (first line, bold)
   - Preview (second line, truncated)
   - Timestamp (bottom right)
   - Hover actions: Load, Delete
   - Click to load

4. **StashEmptyState.tsx** - Empty state:
   - Show when no prompts saved
   - Icon + message: "No saved prompts"
   - Tip: "Type a prompt and click ★ to save it"
   - Link to documentation

**Existing Components to Modify:**

1. **ChatInput.tsx** - Add stash button:
   - Add to input toolbar (line 1303-1308)
   - Next to send button (like attachment menu)
   - Toggle panel on click
   - Keyboard shortcut: Ctrl+S (save), Ctrl+Shift+S (open)

2. **CommandPalette.tsx** - Add stash commands:
   ```typescript
   <CommandGroup heading="Prompt Stash">
     <CommandItem onSelect={handleOpenStash}>
       <RiStarLine className="mr-2 h-4 w-4" />
       <span>Open Prompt Stash</span>
       <CommandShortcut>Ctrl+Shift+S</CommandShortcut>
     </CommandItem>
     <CommandItem onSelect={handleSaveToStash}>
       <RiStarSLine className="mr-2 h-4 w-4" />
       <span>Save Current Input</span>
       <CommandShortcut>Ctrl+S</CommandShortcut>
     </CommandItem>
     <CommandSeparator />
     {/* Recent prompts */}
     <CommandItem onSelect={() => handleLoadPrompt(prompt.id)}>
       <span>{truncate(prompt.title, 30)}</span>
     </CommandItem>
   </CommandGroup>
   ```

**Radix UI Primitives to Use:**
- `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger`
- `AlertDialog` for delete confirmation
- Existing scroll patterns

**File Locations:**
```
packages/ui/src/stores/
  └── usePromptStashStore.ts        (new)

packages/ui/src/components/chat/
  ├── ChatInput.tsx                 (modify - add button)
  ├── stash/                       (new directory)
  │   ├── StashButton.tsx           (new)
  │   ├── StashPanel.tsx            (new)
  │   ├── StashedPromptCard.tsx     (new)
  │   └── StashEmptyState.tsx       (new)

packages/ui/src/components/ui/
  └── CommandPalette.tsx            (modify - add commands)
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
- localStorage handles this automatically
- Store initialization loads from localStorage

**Large stash performance:**
- Virtual scroll for list (React Window if needed)
- Lazy render cards (render only visible)

**Mobile limits:**
- Smaller storage on some mobile browsers
- Cap: max 20 prompts on mobile
- Auto-delete oldest if limit reached

---

### Accessibility (A11y)

**Keyboard shortcuts:**
- `Ctrl+S` / `Cmd+S`: Save current input to stash
- `Ctrl+Shift+S` / `Cmd+Shift+S`: Open stash panel
- Arrow keys to navigate stash list
- Enter to load selected prompt

**ARIA attributes:**
- Button: `aria-label="Save to stash (3 prompts saved)"`
- Panel: `role="dialog"`, `aria-label="Prompt stash"`
- Cards: `role="option"`, `aria-label={prompt title}`
- Delete button: `aria-label="Delete prompt: {title}"`

**Focus management:**
- Focus moves to search when panel opens
- Focus returns to input after load
- Escape closes panel (returns focus to button)

**Screen readers:**
- Live region for actions: "Saved prompt to stash"
- Announce count: "3 prompts in stash"
- Clear button labels

---

## MVP vs Nice-to-Have

### MVP (Must-have)
- ✅ Save current prompt to stash
- ✅ Load stashed prompt to input
- ✅ List all saved prompts (newest first)
- ✅ Delete individual prompts
- ✅ Search/filter stash
- ✅ Persist in localStorage
- ✅ Command Palette integration
- ✅ Keyboard shortcuts (Ctrl+S)
- ✅ Mobile responsive (bottom sheet)

### Nice-to-Have (Enhancements for Later)
- Tags/labels for prompts
- Filter by tags
- Drag-and-drop reordering
- Pin important templates
- Export/import JSON
- Share via link
- Template placeholders (e.g., "{PR_NUMBER}")
- Auto-categorize by session
- Usage statistics
- Auto-suggest similar prompts
- Rich text editor
- Team collaboration
- Cross-device sync
- Stash analytics
