# Feature: Session Export

## Overview

**Description**
Allow users to export session transcripts as markdown files or copy them to clipboard, with options to include thinking blocks and tool details.

**OpenCode Terminal Implementation**
In the terminal TUI, users can:
- Run `session.copy` to copy entire session transcript as markdown to clipboard
- Run `session.export` to export session to markdown file with options:
  - Choose filename (default: `session-{id}[:8].md`)
  - Toggle: Include thinking/reasoning
  - Toggle: Include tool details (input/output/errors)
  - Opens in external editor for review before saving

**Value Proposition**
- Share conversations with team members who don't have OpenChamber access
- Archive important sessions for compliance or future reference
- Create documentation from AI-assisted work sessions
- Debug issues by sharing full session context with developers

---

## Web-Optimized Design

### UI Pattern

**Dialog with inline options (reusing existing SessionDialogs pattern)**

Rationale: Export is a deliberate action requiring filename and options. Follow the pattern from `SessionDialogs.tsx`:
- Desktop: Radix UI Dialog with max-w-[480px] (slightly smaller than fork dialog)
- Mobile: MobileOverlayPanel bottom sheet (same as SessionDialogs)
- Reuse `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`

Layout (desktop):
```
┌─────────────────────────────────────┐
│  Export Session            [✕]       │
├─────────────────────────────────────┤
│  Name: [session-abc1234     ]        │  ← Input field
│                                     │
│  ☑ Include thinking blocks          │  ← Checkbox
│    Show AI reasoning content        │
│                                     │
│  ☑ Include tool details             │  ← Checkbox
│    Show tool inputs/outputs/errors  │
│                                     │
│         [Cancel]  [Copy]  [Export]  │  ← Two action buttons
└─────────────────────────────────────┘
```

Mobile: Full-height bottom sheet
```
┌─────────────────────────────────────┐
│  Export Session            [✕]       │
├─────────────────────────────────────┤
│  Name: [session-abc...   ]          │
│                                     │
│  ☐ Include thinking blocks         │
│    Show AI reasoning content       │
│                                     │
│  ☐ Include tool details            │
│    Show tool inputs/outputs/errors │
│                                     │
│  ┌───────────────────────────────┐  │
│  │       [Copy to Clipboard]     │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │         [Download]            │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### User Workflow

**Trigger:** Export button in SessionSidebar context menu, or Command Palette (Ctrl+Shift+E)

1. User clicks "Export Session" → Dialog opens with defaults
2. **Filename field:** Pre-filled with `session-{id}[:8].md`, editable
3. **Options checkboxes:**
   - "Include thinking blocks" (default: off)
   - "Include tool details" (default: off)
4. **User interaction:**
   - Edit filename
   - Toggle checkboxes
   - Keyboard nav: Tab between fields
5. **Actions:**
   - **Copy:** Generate markdown, copy to clipboard, show toast "Copied to clipboard"
   - **Export:** Generate markdown, trigger browser download, show toast "Downloaded file"
6. **Result:** Toast notification with filename and content size

### Web Advantages

- **Visual checkboxes**: Toggle switches are more intuitive than terminal prompts
- **Browser-native downloads**: Web can use `URL.createObjectURL()` for instant downloads
- **Clipboard API**: Copy to clipboard without terminal OSC52 escape sequences
- **Preview before export**: Can show markdown preview in dialog (nice-to-have)
- **Responsive design**: Mobile bottom sheet with full-width action buttons

### Mobile Considerations

**Implementation:** Reuse `MobileOverlayPanel` pattern from `SessionDialogs.tsx` (lines 772-782)

- **Bottom sheet:** Use existing `MobileOverlayPanel` component
  - Full-height: `contentMaxHeightClassName="h-[calc(100vh-12rem)]"`
  - Swipe-down to close (built into MobileOverlayPanel)
  
- **Touch targets:**
  - Checkboxes: 44x44px touch area
  - Action buttons: Full-width, 56px height at bottom
  
- **Gestures:**
  - Swipe to dismiss (native MobileOverlayPanel)
  - Long-press copy button for "Copy as plain text" option

- **Optimization:**
  - Debounced filename validation (300ms)
  - Estimate content size before generation
  - Lazy load markdown generation

---

## Technical Implementation

### Backend Requirements

**OpenCode API Check:**

Result:
- ✅ API exists: `session.copy` and `session.export` → Implement UI only

API endpoints:
- `POST /session/{id}/copy` - Returns markdown content
- `POST /session/{id}/export` - Returns markdown file as stream

**Store Functions:**
- **Extend `useSessionStore`**
- Add state for export dialog:
  ```typescript
  exportDialogState: {
    open: boolean;
    sessionId: string | null;
    filename: string;
    includeThinking: boolean;
    includeToolDetails: boolean;
    isExporting: boolean;
  }
  ```
- Add actions:
  - `openExportDialog(sessionId)`
  - `closeExportDialog()`
  - `setExportOption(option, value)`
  - `copyTranscript()` → calls API, uses `navigator.clipboard.writeText()`
  - `exportToFile()` → generates Blob, creates download link

### Frontend Components

**New Components to Create:**

1. `ExportSessionDialog.tsx` - Main dialog with filename input and checkboxes
2. `ExportFilenameInput.tsx` - Styled input with validation and preset suggestions
3. `ExportOptions.tsx` - Checkbox group for thinking/tool details toggles
4. `ExportActions.tsx` - Copy and Export buttons with loading states
5. `ExportSuccessToast.tsx` - Custom toast with filename and size info

**Existing Components to Modify:**

1. `SessionSidebar.tsx` - Add "Export" option to session context menu (around line 400)
2. `CommandPalette.tsx` - Add "Export session" command (Ctrl+Shift+E)
3. `toast` usage - Import and configure toast notifications

**Radix UI Primitives to Use:**
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`
- `Checkbox` (custom component following SettingsSection patterns)
- `Input` for filename field

**File Locations:**
```
packages/ui/src/components/session/
  ├── ExportSessionDialog.tsx
  ├── ExportFilenameInput.tsx
  ├── ExportOptions.tsx
  ├── ExportActions.tsx
  └── index.ts

packages/ui/src/stores/
  └── useSessionStore.ts (extend with exportDialogState)
```

### State Management

**Zustand Store:**

Extend `useSessionStore` with:

```typescript
interface ExportDialogState {
  open: boolean;
  sessionId: string | null;
  filename: string;
  includeThinking: boolean;
  includeToolDetails: boolean;
  isLoading: boolean;
  error: string | null;
}

interface SessionStore {
  // ... existing state ...
  exportDialogState: ExportDialogState;
  
  // Actions
  openExportDialog(sessionId: string): void;
  closeExportDialog(): void;
  setExportFilename(filename: string): void;
  setExportOption(option: 'thinking' | 'toolDetails', value: boolean): void;
  copyTranscript(): Promise<void>;
  exportToFile(): Promise<void>;
}
```

**Computed Selectors:**
- `getExportContentSize()` - Estimate markdown size before generation
- `isValidFilename()` - Validate filename format

---

## Edge Cases & Concerns

### Performance

- **Large sessions:** 1000+ messages could generate 5MB+ markdown
  - Solution: Chunk generation, show progress, limit export to last N messages option
  - Alternative: Warn user and offer to export last 100 messages
  
- **Memory usage:** Generating markdown in browser
  - Solution: Use streaming/chunking for very large sessions
  - Alternative: Server-side generation with download redirect

### Error Handling

- **Clipboard permission denied:**
  - Show error toast: "Clipboard access denied. Try downloading instead."
  - Fallback: Auto-trigger download instead
  
- **Download blocked:**
  - Check `window.navigator.msSaveBlob` for IE fallback
  - Show manual instructions if all methods fail
  
- **Session empty:**
  - Disable export button, show tooltip: "No messages to export"
  - Alternative: Export with placeholder "Empty session"

### Mobile/Responsive

- **File downloads on mobile:**
  - iOS: May not support direct download, need to share sheet
  - Solution: Use Web Share API if available, fallback to download
  
- **Clipboard on mobile:**
  - iOS requires user interaction (button tap), which we have
  - Show confirmation after copy completes

### Privacy/Security

- **Sensitive data in transcript:**
  - Add warning dialog: "This transcript may contain sensitive data"
  - Option to redact before export (nice-to-have)
  
- **API tokens in tool output:**
  - Tool output could contain secrets
  - Add "Redact secrets" toggle (nice-to-have)

---

## MVP vs Nice-to-Have

### MVP (Minimum Viable Version)

**Must-have features:**
- Export dialog with filename input
- Copy to clipboard button
- Download as file button
- Basic markdown formatting (message roles, timestamps, content)
- Error handling with toast notifications
- Mobile bottom sheet layout
- Command Palette integration

**Excluded from MVP:**
- Include thinking blocks option
- Include tool details option
- Preview markdown before export
- Redact secrets
- Export last N messages option

### Nice-to-Have (Enhancements for Later)

1. **Toggle options:**
   - Include thinking blocks (collapsed by default)
   - Include tool details (collapsed by default)
   - Include timestamps (collapsed by default)
   - Include message IDs (collapsed by default)

2. **Advanced export:**
   - Export last N messages only
   - Export selected date range
   - Export specific message range

3. **Preview:**
   - Show markdown preview in dialog
   - Syntax highlighting for code blocks in preview
   - Collapsible sections in preview

4. **Sharing:**
   - Share via Web Share API (mobile)
   - Email export directly
   - Upload to cloud storage

5. **Formatting:**
   - Multiple export formats (JSON, HTML, PDF via print)
   - Custom template support
   - Theme selection for export (dark/light)

6. **Redaction:**
   - Auto-redact API keys in tool output
   - Manual selection of content to exclude
   - Pattern-based redaction (regex)

---

## Accessibility

- **Keyboard shortcuts:**
  - Ctrl+Shift+E: Open export dialog
  - Tab: Navigate between fields
  - Space/Enter: Toggle checkboxes, activate buttons
  - Esc: Close dialog
  
- **ARIA attributes:**
  - `aria-label` on filename input
  - `aria-label` on checkboxes
  - `aria-live` on status/toast notifications
  - `role="dialog"`, `aria-modal="true"`
  
- **Focus management:**
  - Focus filename input when dialog opens
  - Trap focus within dialog
  - Return focus to trigger button on close
  
- **Screen reader:**
  - Announce dialog title and purpose
  - Describe checkbox states (checked/unchecked)
  - Announce copy/export completion
  - Support reading export progress

---

## Success Metrics

1. **Usage tracking:**
   - Export dialog opened (analytics)
   - Copy button clicked
   - Export button clicked
   - Error rate (failed exports/copies)

2. **User feedback:**
   - Export success toast rating (thumbs up/down)
   - Feature request submissions

3. **Performance:**
   - Export time for various session sizes
   - Memory usage during export
   - Clipboard API latency

---

## Implementation Order

1. **Week 1:**
   - Create ExportSessionDialog component
   - Add export dialog state to useSessionStore
   - Connect to `session.copy` API
   - Implement copy to clipboard

2. **Week 2:**
   - Implement download to file
   - Add filename input with validation
   - Mobile bottom sheet layout
   - Command Palette integration

3. **Week 3 (Nice-to-Have):**
   - Add include thinking/tool details options
   - Add markdown preview
   - Add advanced export options (date range, etc.)

---

## References

- **Existing patterns:** `SessionDialogs.tsx` (fork dialog, delete dialog)
- **Mobile pattern:** `MobileOverlayPanel` component
- **Settings pattern:** `SettingsSection.tsx` for checkbox components
- **API client:** `/packages/ui/src/lib/opencode/client.ts`
- **Store pattern:** `useSessionStore.ts` for state management