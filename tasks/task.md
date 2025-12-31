# Task: Feature Gap Analysis & Implementation Planning

## Objective

Discover what features OpenCode Terminal TUI has that OpenChamber Web is missing, then create detailed implementation plans for adding those features to OpenChamber.

**CRITICAL**: You will ONLY work on OpenChamber. Do NOT modify the OpenCode project directory - you can READ from it to understand features, but all changes will be in OpenChamber.

---

## Phase 1: Feature Discovery

### Step 1: Explore OpenCode Terminal TUI

Location: `/home/idc/proj/opencode`

Thoroughness: **very thorough**

What to find:
- All slash commands and what they do
- All interactive workflows (keyboard shortcuts, menus, dialogs)
- All unique capabilities and features
- How features are implemented in the terminal TUI

Key directories:
- `packages/opencode/src/cli/cmd/tui/` - TUI components
- `packages/opencode/src/cli/cmd/tui/routes/session/` - Session-related TUI
- `packages/opencode/src/command/` - Command definitions

**Look for**: Patterns like `/command`, `<leader>key`, dialog components, special workflows

---

### Step 2: Explore OpenChamber Web

Location: `/home/idc/proj/openchamber-wj`

Thoroughness: **very thorough**

What to find:
- All currently implemented features
- All slash commands available
- Current UI patterns (modals, overlays, sidebars, etc.)
- How things are structured in the web UI

Key directories:
- `packages/ui/src/components/` - React components
- `packages/ui/src/components/chat/` - Chat interface
- `packages/ui/src/stores/` - State management
- `packages/ui/src/lib/opencode/` - API client

**Look for**: Existing similar features to compare against

---

### Step 3: Compare and Identify Gaps

Create a comparison list:

| Feature | OpenCode Terminal | OpenChamber Web | Status |
|---------|-------------------|-----------------|--------|
| Example | Has X | Has X (via different UI) | ✅ Not missing |
| Example | Has Y | Missing entirely | ❌ Missing |

**Rules**:
- If OpenChamber can do the same thing (even with different UI), it's **NOT missing**
- Only list features that **truly don't exist** in OpenChamber
- Don't count "doesn't have slash command X" if the same feature exists via button/menu

---

## Phase 2: Create Implementation Plans

For **each missing feature** you discover, create a plan file.

### Plan Directory Structure

Create directory: `plans/` in `/home/idc/proj/openchamber-wj/plans/`

### Plan File Naming

```
plans/feature-{feature-name}.md
```

Use lowercase, hyphenated names based on the feature.

### Plan File Template

```markdown
# Feature: {Feature Name}

## Overview

**Description**
{1-2 sentences explaining what the feature does}

**OpenCode Terminal Implementation**
{How it works in the terminal TUI}

**Value Proposition**
{Why this feature matters for OpenChamber users}

---

## Web-Optimized Design

### UI Pattern

Choose the best pattern for web UI:
- Modal/Dialog overlay
- Sidebar panel
- Inline input action
- Keyboard shortcut + overlay
- Command palette entry
- Context menu on hover
- Status bar indicator
- Multi-panel split view
- Other (explain)

{Explain your choice and the layout}

### User Workflow

Step-by-step journey:
1. User does X
2. UI shows Y
3. Result is Z

### Web Advantages

How web UI improves on terminal:
- {e.g., visual previews, click interactions, animations}
- {e.g., keyboard shortcuts + mouse support}
- {e.g., better mobile experience}

### Mobile Considerations

How this works on small screens:
- {Adaptation for mobile}
- {Touch gestures or alternative UI}

---

## Technical Implementation

### Backend Requirements

**OpenCode API Check:**

Check if API exists in `/home/idc/proj/opencode/packages/opencode/src/server/server.ts`

Result:
- ✅ API exists: `API endpoint name` → Implement UI only
- ❌ API missing: Note that backend work is required (but do not implement)

**Store Functions:**
- {New store functions needed OR existing ones to use}
- {Which file to modify}

### Frontend Components

**New Components to Create:**
`{ComponentName}.tsx` - {What it does}

**Existing Components to Modify:**
`{filename}` - {What to change}

**Radix UI Primitives to Use:**
- {Dialog, AlertDialog, Popover, etc.}

**File Locations:**
```
packages/ui/src/components/{category}/
  ├── NewComponent1.tsx
  ├── NewComponent2.tsx
  └── index.ts
```

### State Management

**Zustand Store:**
- New store or existing store to modify
- What state to track

---

## Edge Cases & Concerns

What could go wrong?
- {Performance concerns}
- {Mobile/responsive issues}
- {Accessibility concerns}
- {Error handling}

---

## MVP vs Nice-to-Have

### MVP (Minimum Viable Version)
- {Must-have features for first implementation}

### Nice-to-Have (Enhancements for Later)
- {Improvements to add later}
```

---

## IMPORTANT CONSTRAINTS

### Do NOT Modify OpenCode
- You can READ from `/home/idc/proj/opencode/`
- You CANNOT write, edit, create files in `/home/idc/proj/opencode/`
- All implementation plans are for OpenChamber Web ONLY

### API Reality Check

When checking OpenCode API (`/home/idc/proj/opencode/packages/opencode/src/server/server.ts`):

1. **If API exists** → Your plan focuses on UI implementation
2. **If API doesn't exist** → Your plan notes that backend work is needed, but you still design the UI

### Web-First Mindset

When designing:
- Don't copy terminal patterns 1:1
- Leverage web capabilities: click, drag-drop, hover, context menus, animations
- Consider desktop AND mobile
- Use accessibility (ARIA, keyboard navigation)
- Follow OpenChamber's existing UI patterns

### Existing Patterns to Follow

Review these in OpenChamber:
- Modals → Use Radix Dialog
- Mobile overlays → Use `MobileOverlayPanel`
- Command palette → Use existing CommandPalette
- Sidebar items → Use `SettingsSidebarItem` patterns
- Keyboard shortcuts → Follow existing keybinding patterns

---

## Deliverables Checklist

Before completing this task:

- [ ] Created `plans/` directory
- [ ] Explored OpenCode Terminal TUI (thorough)
- [ ] Explored OpenChamber Web (thorough)
- [ ] Created comparison list of features
- [ ] Created one plan file per missing feature
- [ ] Each plan follows the template structure
- [ ] Designs are web-optimized (not terminal clones)
- [ ] Technical details reference exact file paths
- [ ] Checked API availability for each feature
- [ ] Considered mobile/responsive implications

---

## Getting Started

1. Explore OpenCode Terminal → find all features
2. Explore OpenChamber Web → find all features
3. Compare → identify what's truly missing
4. For each missing feature → create implementation plan

Good luck! 🚀
