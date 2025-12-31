# Feature: Enhanced View Toggles

## Overview

**Description**
Provide granular control over UI visibility and behavior through a comprehensive settings page with toggles for username attribution, code concealment, tool details, timestamps, user message markdown, diff wrapping, and animations.

**OpenCode Terminal Implementation**
In the terminal TUI, users can toggle various UI elements via keyboard shortcuts:
- `username_toggle` - Show/hide username attribution
- `messages_toggle_conceal` - Toggle code concealment (hide/show code blocks)
- `tool_details` - Show/hide tool input/output details
- `session.toggle.timestamps` - Show/hide message timestamps
- `session.toggle.thinking` - Show/hide AI reasoning
- `session.toggle.user_message_markdown` - Render user messages as markdown
- `session.toggle.diffwrap` - Toggle diff wrapping mode (word/none)
- `session.toggle.animations` - Enable/disable animations
- `sidebar_toggle` - Show/hide session sidebar

**OpenChamber Web Status:**
- Sidebar toggle: ✅ EXISTS
- Thinking toggle: ✅ EXISTS (in ChatMessage)
- Most others: ❌ MISSING or only accessible via settings

**Value Proposition**
- Customize the UI for different workflows (debugging vs. reading)
- Reduce visual clutter for focused work
- Show more detail when debugging issues
- Personalize the experience per user preference
- Optimize for different screen sizes

---

## Web-Optimized Design

### UI Pattern

**Settings page with grouped toggles (reusing OpenChamberPage patterns)**

Rationale: Toggles should be discoverable and persistent. Follow the pattern from `OpenChamberPage.tsx`:
- Use existing Settings infrastructure (sidebar, sections, toggles)
- Group related toggles logically
- Use familiar toggle/switch components

Layout (Settings Page):
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings / OpenChamber / Display                              [✕]  │
├─────────────────────────────────────┬───────────────────────────────┤
│  Appearance                         │  Display Settings                      │
│  ├─ Theme                           │                                     │
│  ├─ Font Size                       │  ☑ Show timestamps            [?]    │
│  └─ Spacing                         │    Display message times                 │
│                                     │                                     │
│  Chat                               │  ☑ Show usernames              [?]    │
│  ├─ Default Tool Output             │    Show user/assistant names           │
│  ├─ Diff Layout                     │                                     │
│  ├─ Show reasoning traces           │  ☑ Show tool details           [?]    │
│  └─ Queue mode                      │    Display tool inputs/outputs         │
│                                     │                                     │
│  Sessions                           │  ☑ Code concealment            [?]    │
│  ├─ Default model & agent           │    Hide long code blocks               │
│  └─ Session retention               │                                     │
│                                     │  ☑ User message markdown        [?]    │
│  Display ← CURRENT                  │    Render user messages as MD          │
│  ├─ [✓] Show timestamps             │                                     │
│  ├─ [✓] Show usernames              │  ☑ Diff wrapping               [?]    │
│  ├─ [ ] Show tool details           │    Wrap long diff lines                │
│  ├─ [ ] Code concealment            │                                     │
│  ├─ [✓] User message markdown       │  ☑ Animations                   [?]    │
│  ├─ [✓] Diff wrapping               │    Enable UI animations                │
│  └─ [✓] Animations                  │                                     │
│                                     │                                     │
│                                     │  [Reset to defaults]                   │
└─────────────────────────────────────┴─────────────────────────────┘
```

### User Workflow

**Trigger:** Settings → OpenChamber → Display tab

1. User navigates to Settings → OpenChamber → Display
2. Sees list of toggle options with descriptions
3. **Each toggle shows:**
   - Toggle switch (on/off)
   - Label (e.g., "Show timestamps")
   - Description (e.g., "Display message times")
   - Info icon with tooltip explaining the setting
4. **User interaction:**
   - Click toggle to enable/disable
   - Hover for tooltip explaining feature
   - Reset button to restore defaults
5. **Changes apply:**
   - Immediately in current session
   - Persist to localStorage for future sessions
   - Sync across devices (if logged in)

**Quick Access:**
- Add Command Palette commands for common toggles
- Add keyboard shortcuts (Ctrl+Shift+T for timestamps, etc.)
- Consider header icon for quick toggle panel (nice-to-have)

### Web Advantages

- **Visual toggle switches:** More intuitive than keyboard shortcuts
- **Descriptions:** Explain what each toggle does
- **Tooltips:** Additional context on hover
- **Persistence:** Settings saved across sessions
- **Preview:** Changes visible immediately
- **Accessibility:** Screen reader friendly with ARIA labels

### Mobile Considerations

**Implementation:** Simplify for mobile, focus on most useful toggles

- **Mobile Settings Page:**
  - Fewer toggles (hide advanced ones)
  - Larger touch targets (48x48px)
  - Simplified descriptions
  
- **Hidden on Mobile:**
  - Animations toggle (useless on mobile)
  - Diff wrapping (less relevant)
  - Code concealment (already responsive)
  
- **Defaults Optimized for Mobile:**
  - Show timestamps: OFF (save space)
  - Show tool details: OFF (save space)
  - Animations: OFF (performance)

- **Quick Toggle Panel:**
  - FAB button for common toggles
  - Swipe panel from bottom
  - Show only 4-5 most-used toggles

---

## Technical Implementation

### Backend Requirements

**OpenCode API Check:**

Result:
- ✅ API exists: All toggles have UI equivalents → Frontend state only

**Store Functions:**
- **Extend `useConfigStore`** (or create new `useDisplaySettingsStore`)
- Add state for display preferences:
  ```typescript
  displaySettings: {
    showTimestamps: boolean;
    showUsernames: boolean;
    showToolDetails: boolean;
    codeConcealment: boolean;
    userMessageMarkdown: boolean;
    diffWrapping: boolean;
    animationsEnabled: boolean;
  }
  ```
- Add actions:
  - `setDisplaySetting(setting, value)` - Update setting
  - `resetDisplaySettings()` - Restore defaults
  - `exportDisplaySettings()` - For sync across devices

### Frontend Components

**New Components to Create:**

1. `DisplaySettingsPage.tsx` - Main settings page component
2. `DisplaySettingsSidebar.tsx` - Sidebar for Display section
3. `DisplayToggle.tsx` - Reusable toggle component with label and description
4. `DisplaySettingsReset.tsx` - Reset button component
5. `QuickTogglePanel.tsx` - Mobile FAB panel for common toggles (nice-to-have)

**Existing Components to Modify:**

1. `OpenChamberSidebar.tsx` - Add "Display" section link
2. `OpenChamberPage.tsx` - Add Display section routing
3. `ChatMessage.tsx` - Use display settings to control visibility
4. `MessageList.tsx` - Apply timestamps visibility
5. `DiffView.tsx` - Apply diff wrapping setting

**Radix UI Primitives to Use:**
- `Switch` for toggle controls (existing UI component)
- `Tooltip` for info icons
- `ScrollArea` for scrollable content

**File Locations:**
```
packages/ui/src/components/sections/openchamber/
  ├── DisplaySettingsPage.tsx
  ├── DisplaySettingsSidebar.tsx
  ├── DisplayToggle.tsx
  ├── DisplaySettingsReset.tsx
  └── QuickTogglePanel.tsx (nice-to-have)

packages/ui/src/stores/
  └── useConfigStore.ts (extend with displaySettings)
```

### State Management

**Zustand Store:**

Extend `useConfigStore` with:

```typescript
interface DisplaySettings {
  showTimestamps: boolean;
  showUsernames: boolean;
  showToolDetails: boolean;
  codeConcealment: boolean;
  userMessageMarkdown: boolean;
  diffWrapping: boolean;
  animationsEnabled: boolean;
}

interface ConfigStore {
  // ... existing state ...
  displaySettings: DisplaySettings;
  
  // Actions
  setDisplaySetting<K extends keyof DisplaySettings>(
    key: K, 
    value: DisplaySettings[K]
  ): void;
  resetDisplaySettings(): void;
}
```

**Persistence:**
- Save to `localStorage` key `openchamber-display-settings`
- Sync across devices via user config API (nice-to-have)
- Apply defaults on first load

**Computed Selectors:**
- `isAnyAnimationEnabled()` - Check if animations allowed
- `shouldShowDetails()` - Combine multiple settings

---

## Edge Cases & Concerns

### Performance

- **React re-renders:** Toggling settings triggers re-renders
  - Solution: Use React.memo on expensive components
  - Only re-render affected components (not whole app)
  - Debounce rapid toggle changes
  
- **Animation toggle:** Turning off animations should stop all CSS animations
  - Solution: CSS class on root element
  - Use `prefers-reduced-motion` media query

### Consistency

- **Settings sync:** Different devices have different defaults
  - Solution: Cloud sync for display settings
  - LocalStorage fallback
  
- **Session vs global:** Should settings persist per session or globally?
  - Decision: Global settings with per-session overrides (nice-to-have)
  - MVP: Global settings only

### Mobile/Responsive

- **Screen real estate:** Mobile has less space for descriptions
  - Solution: Truncate descriptions on mobile
  - Use tooltip for full description
  
- **Touch targets:**
  - Toggle switches: 48x28px minimum
  - Info icons: 32x32px touch area
  - Reset button: 44x44px

### User Confusion

- **Unclear what toggles do:**
  - Solution: Clear descriptions for each toggle
  - Tooltips with examples
  - Preview mode showing what changes (nice-to-have)
  
- **Accidentally turning off features:**
  - Solution: Confirmation dialog for destructive toggles
  - Undo toast after toggle

---

## MVP vs Nice-to-Have

### MVP (Minimum Viable Version)

**Must-have features:**
- Display settings page in Settings → OpenChamber
- All 7 toggles with labels and descriptions
- Settings persistence to localStorage
- Settings apply immediately
- Reset to defaults button
- Mobile-responsive layout
- Integration with ChatMessage, MessageList, DiffView

**Toggle list:**
1. Show timestamps
2. Show usernames
3. Show tool details
4. Code concealment
5. User message markdown
6. Diff wrapping
7. Animations

**Excluded from MVP:**
- Quick toggle panel (FAB)
- Per-session overrides
- Cloud sync
- Preview mode
- Keyboard shortcuts for individual toggles

### Nice-to-Have (Enhancements for Later)

1. **Quick Access:**
   - FAB button for common toggles
   - Keyboard shortcuts (Ctrl+Shift+T for timestamps, etc.)
   - Command palette commands
   - Header icon dropdown

2. **Advanced Features:**
   - Per-session settings (override global)
   - Settings profiles (work vs. debug mode)
   - Import/export settings
   - Cloud sync across devices

3. **Preview Mode:**
   - Show "Before/After" preview
   - Toggle with instant preview
   - Compare multiple settings

4. **Additional Toggles:**
   - Sidebar visibility
   - Compact mode (smaller UI)
   - Syntax highlighting toggle
   - Auto-scroll during streaming

5. **Accessibility:**
   - Toggle keyboard shortcuts
   - Screen reader announcements
   - Focus indicators
   - High contrast mode

---

## Accessibility

- **Keyboard navigation:**
  - Tab: Navigate between toggles
  - Space/Enter: Toggle setting
  - Arrow keys: Navigate sidebar sections
  
- **ARIA attributes:**
  - `aria-label` on toggle switches
  - `aria-describedby` linking to description
  - `role="switch"` for toggles
  - `aria-pressed` for toggle state
  
- **Focus management:**
  - Visible focus indicators
  - Focus trap in settings panel
  - Return focus on close
  
- **Screen reader:**
  - Announce toggle state changes
  - Read descriptions
  - Support tooltips

---

## Success Metrics

1. **Usage tracking:**
   - Settings page visits
   - Toggle change frequency
   - Reset button usage
   - Popular vs. unpopular toggles

2. **User feedback:**
   - Settings helpfulness rating
   - Feature requests
   - Bug reports about visibility

3. **Performance:**
   - Settings apply latency
   - Re-render time for affected components
   - Memory usage with animations disabled

---

## Implementation Order

1. **Week 1:**
   - Create DisplaySettingsPage component
   - Add display settings to useConfigStore
   - Implement all 7 toggles
   - Add localStorage persistence

2. **Week 2:**
   - Integrate with ChatMessage (thinking visibility)
   - Integrate with MessageList (timestamps)
   - Integrate with DiffView (diff wrapping)
   - Integrate with ToolOutput (tool details)

3. **Week 3:**
   - Mobile-responsive layout
   - Reset to defaults functionality
   - Tooltips and descriptions
   - Accessibility improvements

4. **Week 4 (Nice-to-Have):**
   - Quick toggle panel (FAB)
   - Keyboard shortcuts
   - Per-session overrides
   - Cloud sync

---

## Component Integration Details

### ChatMessage.tsx Integration

```typescript
// Use display settings to conditionally render
const showThinking = useConfigStore(state => state.displaySettings.showThinking);
const showToolDetails = useConfigStore(state => state.displaySettings.showToolDetails);

// Apply to message rendering
{showThinking && <ThinkingSection parts={message.parts} />}
{showToolDetails && <ToolDetailsSection message={message} />}
```

### MessageList.tsx Integration

```typescript
// Use display settings for timestamps
const showTimestamps = useConfigStore(state => state.displaySettings.showTimestamps);

// Apply to message rendering
{showTimestamps && <Timestamp timestamp={message.timestamp} />}
```

### DiffView.tsx Integration

```typescript
// Use display settings for diff wrapping
const diffWrapping = useConfigStore(state => state.displaySettings.diffWrapping);

// Apply to diff container
<div className={diffWrapping ? 'diff-wrap' : 'diff-nowrap'}>
```

### Animations

```typescript
// Root component checks animations setting
const animationsEnabled = useConfigStore(state => state.displaySettings.animationsEnabled);

// Apply CSS class to root
<div className={animationsEnabled ? '' : 'no-animations'}>
```

---

## References

- **Existing patterns:** `OpenChamberPage.tsx`, `SettingsSection.tsx`
- **Toggle component:** Reuse existing Switch/UI toggle patterns
- **Mobile pattern:** `MobileOverlayPanel` for quick toggle panel
- **Store pattern:** `useConfigStore.ts` for settings
- **Persistence:** localStorage pattern from other settings