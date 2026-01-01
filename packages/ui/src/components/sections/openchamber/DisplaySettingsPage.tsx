import React from 'react';
import { SettingsPageLayout } from '../shared/SettingsPageLayout';
import { SettingsSection } from '../shared/SettingsSection';
import { DisplayToggle } from './DisplayToggle';
import { DisplaySettingsReset } from './DisplaySettingsReset';
import { useUIStore } from '@/stores/useUIStore';

/**
 * Display settings page component.
 * Provides toggle controls for various UI visibility settings.
 */
export const DisplaySettingsPage: React.FC = () => {
  const {
    showTimestamps,
    showUsernames,
    showToolDetails,
    codeConcealment,
    userMessageMarkdown,
    diffWrapLines,
    animationsEnabled,
    setShowTimestamps,
    setShowUsernames,
    setShowToolDetails,
    setCodeConcealment,
    setUserMessageMarkdown,
    setDiffWrapLines,
    setAnimationsEnabled,
    resetDisplaySettings,
  } = useUIStore();

  return (
    <SettingsPageLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="typography-ui-header font-semibold text-foreground">
            Display Settings
          </h2>
          <p className="typography-meta text-muted-foreground">
            Customize what information is shown in the UI
          </p>
        </div>

        <DisplaySettingsReset onReset={resetDisplaySettings} />
      </div>

      <SettingsSection title="Timing & Attribution">
        <div className="space-y-4">
          <DisplayToggle
            checked={showTimestamps}
            onChange={setShowTimestamps}
            label="Show timestamps"
            description="Display message times in the chat view"
            tooltip="When enabled, each message shows when it was sent or received"
          />

          <DisplayToggle
            checked={showUsernames}
            onChange={setShowUsernames}
            label="Show usernames"
            description="Show user and assistant names on messages"
            tooltip="When enabled, messages display the name of the sender (You or the agent)"
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Content Visibility" divider>
        <div className="space-y-4">
          <DisplayToggle
            checked={showToolDetails}
            onChange={setShowToolDetails}
            label="Show tool details"
            description="Display tool inputs and outputs"
            tooltip="When enabled, shows detailed information about tool calls including inputs and returned outputs"
          />

          <DisplayToggle
            checked={codeConcealment}
            onChange={setCodeConcealment}
            label="Code concealment"
            description="Hide long code blocks by default"
            tooltip="When enabled, code blocks are collapsed by default to reduce clutter. Click to expand."
          />

          <DisplayToggle
            checked={userMessageMarkdown}
            onChange={setUserMessageMarkdown}
            label="User message markdown"
            description="Render user messages as markdown"
            tooltip="When enabled, formatting in user messages (bold, code blocks, etc.) is rendered"
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Diff & Animations" divider>
        <div className="space-y-4">
          <DisplayToggle
            checked={diffWrapLines}
            onChange={setDiffWrapLines}
            label="Diff wrapping"
            description="Wrap long diff lines"
            tooltip="When enabled, long lines in diffs wrap instead of requiring horizontal scrolling"
          />

          <DisplayToggle
            checked={animationsEnabled}
            onChange={setAnimationsEnabled}
            label="Animations"
            description="Enable UI animations"
            tooltip="When disabled, all UI transitions and animations are skipped for better performance"
          />
        </div>
      </SettingsSection>
    </SettingsPageLayout>
  );
};
