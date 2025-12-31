# Feature: Searchable Directory Picker

## Overview

**Description**
Enhance the directory selection dialog with real-time search and autocomplete functionality, allowing users to quickly find and select project directories without manually scrolling through the entire file system tree.

**OpenCode Terminal Implementation**
OpenCode Terminal doesn't have this feature because you simply run `opencode` in the directory you want - there's no directory selection workflow in the terminal.

**Value Proposition**
- Users with large directory structures or many nested folders can quickly find their project
- Eliminates the need to manually scroll through hundreds of folders
- Reduces cognitive load when switching between projects
- Matches user expectations from modern IDEs (VS Code, JetBrains) which have searchable file/project pickers

---

## Web-Optimized Design

### UI Pattern

**Enhanced Directory Explorer Dialog** with integrated search:

```
+---------------------------------------------------+
| Select project directory                         |
| Choose the working directory for sessions...     |
+---------------------------------------------------+
| 🔍 myproject            (search input, focused)  |
| +------------------------------+                 |
| | myproject/                   |                 |
| |   src/                       |                 |
| |   package.json               | <-- results    |
| |   README.md                  |     panel      |
| |                              |                 |
| | myproject-workshops/         |                 |
| |   workshop1/                 |                 |
| |   workshop2/                 |                 |
| +------------------------------+                 |
+---------------------------------------------------+
| [Cancel]                    [Open Directory]      |
+---------------------------------------------------+
```

**Two-Panel Layout (Desktop):**
- **Left (or Top on mobile)**: Search input with real-time autocomplete dropdown showing matching directories
- **Right (or Bottom on mobile)**: Traditional DirectoryTree that updates to show/hide based on search

**Search Behavior:**
- Search input is automatically focused when dialog opens
- Type to filter directories by name
- Show up to 20 matching directories in dropdown
- Highlight matching text in results
- Press `↓` or `↑` to navigate results with keyboard
- Press `Enter` to select highlighted result
- Click any result to select it
- Press `Esc` to close search results panel

**Fuzzy Search Support:**
- Match partial directory names (e.g., "proj" matches "myproject", "projects")
- Case-insensitive
- Match against directory names at any depth level

### User Workflow

1. User opens "Select project directory" dialog
2. Search input is auto-focused
3. User types "myproj" to search
4. Dropdown shows: `myproject/`, `myproject-workshops/`, etc.
5. User can:
   - Click result to select it
   - Press arrow keys + Enter to select
   - Continue typing to narrow results
6. DirectoryTree on right automatically updates to show selected path
7. User confirms selection with "Open Directory" button

### Web Advantages

- **Visual feedback**: Real-time dropdown with highlighted matches
- **Mouse + keyboard**: Both click and keyboard navigation supported
- **Debounced search**: API calls only fire after user stops typing (300ms delay)
- **Progressive results**: Show immediate matches, update as user types
- **Mobile-friendly**: Touch-optimized list with 44px tap targets
- **Cached results**: Cache search results to avoid redundant API calls

### Mobile Considerations

- Search input always visible (no collapse)
- Results panel takes 60% of screen height
- DirectoryTree in bottom sheet below search
- Touch-friendly list items with 44px minimum height
- Swipe down on results to close
- Virtual scrolling for large result sets (if > 50 items)

---

## Technical Implementation

### Backend Requirements

**OpenCode API Check:**

✅ **API exists**: `GET /find/file` with the following parameters:

```typescript
{
  query: string;           // Search string
  dirs?: "true" | "false"; // Filter to directories only
  type?: "file" | "directory"; // Type filter
  limit?: 1-200;           // Max results
}
```

**API Request for directory search:**
```
GET /find/file?query=myproj&type=directory&limit=20
```

**Response:**
```json
["/home/user/myproject", "/home/user/myproject-workshops", ...]
```

**Backend Integration:**
- Import existing `findFile` from `@opencode-ai/sdk` in `packages/ui/src/lib/opencode/client.ts`
- Method: `opencodeClient.findFile({ query, type: 'directory', limit: 20 })`
- No backend changes needed!

---

### Frontend Components

#### New Components to Create:

**`DirectorySearchInput.tsx`** - Search input with autocomplete dropdown
```typescript
interface DirectorySearchInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (path: string) => void;
  homeDirectory: string | null;
  className?: string;
}
```

**`DirectorySearchResults.tsx`** - Dropdown showing matching directories
```typescript
interface DirectorySearchResultsProps {
  results: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
  homeDirectory: string | null;
  isOpen: boolean;
  query: string;
}
```

#### Existing Components to Modify:

**`DirectoryExplorerDialog.tsx`** - Add search panel
- Add search state: `searchQuery`, `searchResults`, `showSearchResults`
- Add debounced search hook (useDebounce)
- Call `/find/file` API when query changes
- Layout change: Split view with search on left/top, tree on right/bottom
- Update `pathInputValue` when search result selected

**`DirectoryTree.tsx`** - Keep existing behavior
- No changes needed - it already works independently
- May add prop to optionally show/hide non-matching directories (optional enhancement)

#### Radix UI Primitives to Use:

- **Command** components (from `@/components/ui/command.tsx`):
  - `Command` - Container for search results
  - `CommandInput` - Search input field
  - `CommandList` - Results list container
  - `CommandItem` - Individual result item
  - `CommandEmpty` - "No results found" state
  - `CommandGroup` - Group results by depth/category

Alternatively, use existing patterns:
- **Popover** from Radix UI for dropdown
- **Input** for search field
- Custom scrollable list with `ScrollableOverlay`

---

### File Locations

```
packages/ui/src/components/session/
├── DirectorySearchInput.tsx          (NEW)
├── DirectorySearchResults.tsx        (NEW)
├── DirectoryExplorerDialog.tsx        (MODIFY - add search)
└── DirectoryTree.tsx                  (NO CHANGE)

packages/ui/src/lib/
└── hooks.ts (or hooks/)
    └── useDirectorySearch.ts         (NEW - search hook with debounce)

packages/ui/src/stores/
└── useDirectoryStore.ts              (MODIFY - optional cache for search)
```

---

### State Management

**Zustand Store:**

**Approach 1: No state changes** (RECOMMENDED)
- Keep search state local to component
- Use React state: `searchQuery`, `searchResults`, `isLoading`
- Simpler, no store pollution

**Approach 2: Add cache to existing store**
```typescript
// packages/ui/src/stores/useDirectoryStore.ts
interface DirectoryStore {
  // ... existing properties
  searchCache: Map<string, { results: string[]; timestamp: number }>;
  setSearchCache: (query: string, results: string[]) => void;
}
```
- Cache search results with 5-minute TTL
- Avoid redundant API calls
- Useful if search is used frequently

---

## Implementation Steps

### Step 1: Create useDirectorySearch Hook

```typescript
// packages/ui/src/hooks/useDirectorySearch.ts

import { useState, useCallback } from 'react';
import { opencodeClient } from '@/lib/opencode/client';

export const useDirectorySearch = () => {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await opencodeClient.findFile({
        query,
        type: 'directory',
        limit: 20,
      });
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { results, isLoading, error, search };
};
```

### Step 2: Create DirectorySearchInput Component

```typescript
// packages/ui/src/components/session/DirectorySearchInput.tsx

import React from 'react';
import { Input } from '@/components/ui/input';
import { RiSearchLine, RiLoader4Line } from '@remixicon/react';
import { DirectorySearchResults } from './DirectorySearchResults';

export const DirectorySearchInput: React.FC<DirectorySearchInputProps> = ({
  query,
  onQueryChange,
  onSelect,
  homeDirectory,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Search hook with 300ms debounce
  const { results, isLoading } = useDirectorySearch();
  const debouncedSearch = useDebounce((q: string) => {
    if (search.search) search.search(q);
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onQueryChange(value);
    debouncedSearch(value);
    setIsOpen(true);
    setSelectedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        onSelect(results[selectedIndex]);
        setIsOpen(false);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (path: string) => {
    onSelect(path);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search directories..."
          className="pl-9"
          autoFocus
        />
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {isLoading && (
          <RiLoader4Line className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <DirectorySearchResults
          results={results}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
          onHover={setSelectedIndex}
          homeDirectory={homeDirectory}
          isOpen={isOpen}
          query={query}
        />
      )}
    </div>
  );
};
```

### Step 3: Create DirectorySearchResults Component

```typescript
// packages/ui/src/components/session/DirectorySearchResults.tsx

import React from 'react';
import { cn, formatPathForDisplay, textToHighlightedSpans } from '@/lib/utils';
import { RiFolderLine } from '@remixicon/react';

export const DirectorySearchResults: React.FC<DirectorySearchResultsProps> = ({
  results,
  selectedIndex,
  onSelect,
  onHover,
  homeDirectory,
  isOpen,
  query,
}) => {
  if (!isOpen || results.length === 0) {
    return (
      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg p-3 min-h-[60px]">
        <p className="text-sm text-muted-foreground text-center">
          {query.length >= 2 ? "No directories found" : "Type to search..."}
        </p>
      </div>
    );
  }

  return (
    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
      <ul className="py-1" role="listbox">
        {results.map((path, index) => (
          <li key={path}>
            <button
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => onSelect(index)}
              onMouseEnter={() => onHover(index)}
              className={cn(
                "w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-accent transition-colors",
                index === selectedIndex && "bg-accent"
              )}
            >
              <RiFolderLine className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="typography-meta font-mono truncate">
                {formatPathForDisplay(path, homeDirectory)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

### Step 4: Modify DirectoryExplorerDialog

```typescript
// packages/ui/src/components/session/DirectoryExplorerDialog.tsx

// Add state for search
const [searchQuery, setSearchQuery] = React.useState('');
const { results: searchResults, search } = useDirectorySearch();

// Debounced search trigger
const debouncedSearch = React.useMemo(
  () => debounce((q: string) => {
    if (q.length >= 2) {
      search(q);
    }
  }, 300),
  [search]
);

// Handle search query change
const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setSearchQuery(value);
  debouncedSearch(value);
};

// Select from search results
const handleSearchSelect = (path: string) => {
  setPendingPath(path);
  setHasUserSelection(true);
  setPathInputValue(formatPath(path));
  setSearchQuery(path.split('/').pop() || '');
};

// Update layout to include search
const contentSection = (
  <ScrollableOverlay className="directory-dialog-body flex-1 min-h-0 overflow-hidden flex flex-col gap-3">
    <DirectorySearchInput
      query={searchQuery}
      onQueryChange={handleSearchChange}
      onSelect={handleSearchSelect}
      homeDirectory={homeDirectory}
      className="flex-shrink-0"
    />
    <div className="flex items-center justify-end">
      {showHiddenToggle}
    </div>
    {treeSection}
  </ScrollableOverlay>
);
```

---

## Edge Cases & Concerns

### Performance Concerns

**Issue:** Large directory trees with thousands of folders
- **Solution:**
  - Debounce search with 300ms delay
  - Limit results to 20 directories
  - Use virtual scrolling for results list (if > 50 items)
  - Cache results with 5-minute TTL

**Issue:** Rapid typing causes many API calls
- **Solution:** Debounce with `useDebounce` hook, cancel pending requests

### Mobile Concerns

**Issue:** Small screen size for results dropdown
- **Solution:**
  - Results panel takes 50-60% of dialog height
  - DirectoryTree in collapsible section below
  - Two-tab view (Search tab | Browse tab) alternative

**Issue:** Touch interactions different from mouse
- **Solution:**
  - 44px minimum tap target size
  - Swipe down gesture to close results
  - Keyboard shortcuts less important on mobile

### User Experience Concerns

**Issue:** Search results don't show full path context
- **Solution:**
  - Show relative path from home directory
  - Show full path on hover (tooltip)
  - Use "..." truncation for very deep paths

**Issue:** Typing absolute path still important
- **Solution:**
  - Keep existing path input (rename to "Or enter absolute path")
  - Search and manual input coexist
  - Clear search results when user types path manually

### Accessibility Concerns

- Use ARIA attributes: `role="combobox"`, `role="listbox"`, `aria-expanded`, `aria-selected`
- Keyboard navigation: Arrow keys, Enter, Escape
- Focus management: Focus search input on dialog open
- Screen reader announcements: "5 results found for myproj"

### Error Handling

- API timeout: Show "Search timed out" error
- Network error: Show "Search failed. Try again." with retry button
- Empty results: Show helpful message "No directories found matching 'query'"

---

## MVP vs Nice-to-Have

### MVP (Minimum Viable Version)

**Must-have:**
- [x] Search input in DirectoryExplorerDialog
- [x] Debounced calls to `/find/file` API with type=directory
- [x] Dropdown shows up to 20 matching directories
- [x] Click to select from results
- [x] Basic keyboard navigation (arrow keys + Enter)
- [x] Loading indicator while searching
- [x] Empty state ("No directories found")
- [x] Mobile-friendly layout

**UI Patterns:**
- Desktop: Split view with search on top, tree below
- Mobile: Search on top, tree in scrollable bottom sheet
- Use existing `Input`, `ScrollableOverlay` components

### Nice-to-Have (Enhancements for Later)

**Search Features:**
- [ ] Fuzzy search (match partial words, typos)
- [ ] Recent directories (show 5 most recently used)
- [ ] Pinned directories (persist favorite directories)
- [ ] Search by path fragments (e.g., "src/utils" matches `/user/myproject/src/utils`)
- [ ] Highlight matching characters in results

**UX Improvements:**
- [ ] Virtual scrolling for large result sets (> 50 items)
- [ ] Breadcrumb trail in results (show parent folders)
- [ ] Category/grouping by depth or recent usage
- [ ] Keyboard shortcut to focus search (Cmd/Ctrl + P)
- [ ] Search history (show recent searches)

**Advanced Features:**
- [ ] Search with regex patterns
- [ ] Filter by git branch (if worktrees)
- [ ] Search across worktrees
- [ ] Directory preview (show file count, last modified)
- [ ] Drag and drop to reorder pinned directories

---

## Testing Checklist

### Functional Testing

- [ ] Search finds directories by partial name
- [ ] Search is case-insensitive
- [ ] Results appear after 300ms debounce
- [ ] Clicking result selects directory
- [ ] Keyboard navigation (arrows + Enter) works
- [ ] Empty results show "No directories found"
- [ ] Loading indicator appears during search
- [ ] Path input still works for manual entry

### Mobile Testing

- [ ] Results panel fits on small screens
- [ ] Touch targets are 44px minimum
- [ ] Swipe down closes results
- [ ] Layout works on portrait/landscape

### Accessibility Testing

- [ ] Screen reader announces results count
- [ ] Keyboard navigation works
- [ ] Focus management correct
- [ ] ARIA attributes present

### Performance Testing

- [ ] Debounce prevents excessive API calls
- [ ] Search on large repo (1000+ dirs) is responsive
- [ ] Virtual scrolling for 50+ results
- [ ] Cache works (second search is faster)

---

## Summary

This feature creates a much better user experience for selecting project directories in OpenChamber Web. The searchable directory picker:

- ✅ Uses existing `/find/file` API (no backend changes)
- ✅ Follows web-native patterns (search + autocomplete)
- ✅ Works on desktop and mobile
- ✅ Accessible with keyboard navigation
- ✅ Performant with debouncing and caching
- ✅ Extensible with future enhancements

Estimated implementation time: **4-6 hours** for MVP
