import React from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useUIStore } from '@/stores/useUIStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { useDirectoryStore } from '@/stores/useDirectoryStore';
import { usePromptStashStore } from '@/stores/usePromptStashStore';
import { useThemeSystem } from '@/contexts/useThemeSystem';
import { useDeviceInfo } from '@/lib/device';
import { RiAddLine, RiArrowGoBackLine, RiArrowGoForwardLine, RiChatAi3Line, RiCheckLine, RiCodeLine, RiComputerLine, RiDashboard3Line, RiDownloadLine, RiGitBranchLine, RiLayoutLeftLine, RiMoonLine, RiQuestionLine, RiRestartLine, RiSettings3Line, RiStarLine, RiStarSLine, RiSunLine, RiTerminalBoxLine } from '@remixicon/react';
import { reloadOpenCodeConfiguration } from '@/stores/useAgentsStore';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setHelpDialogOpen,
    setSessionCreateDialogOpen,
    setActiveMainTab,
    setSettingsDialogOpen,
    setSessionSwitcherOpen,
    setStatusDialogOpen,
    toggleSidebar,
  } = useUIStore();

  const {
    openNewSessionDraft,
    setCurrentSession,
    getSessionsByDirectory,
    pendingInputText,
    setPendingInputText,
    currentSessionId,
    openExportDialog,
    openForkDialog,
    revertToMessage,
    setUndoDialogOpen,
    sessions,
  } = useSessionStore();

  const prompts = usePromptStashStore((state) => state.prompts);
  const savePrompt = usePromptStashStore((state) => state.savePrompt);
  const loadPrompt = usePromptStashStore((state) => state.loadPrompt);

  const { currentDirectory } = useDirectoryStore();
  const { themeMode, setThemeMode } = useThemeSystem();

  const handleClose = () => {
    setCommandPaletteOpen(false);
  };

  const handleCreateSession = async () => {
    setActiveMainTab('chat');
    setSessionSwitcherOpen(false);
    openNewSessionDraft();
    handleClose();
  };

  const handleOpenSession = (sessionId: string) => {
    setCurrentSession(sessionId);
    handleClose();
  };

  const handleSetThemeMode = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    handleClose();
  };

  const handleShowHelp = () => {
    setHelpDialogOpen(true);
    handleClose();
  };

  const handleOpenAdvancedSession = () => {
    setSessionCreateDialogOpen(true);
    handleClose();
  };

  const handleExportCurrentSession = () => {
    if (currentSessionId) {
      openExportDialog(currentSessionId);
      handleClose();
    }
  };

  const handleForkSession = () => {
    if (currentSessionId) {
      openForkDialog(currentSessionId);
      handleClose();
    }
  };

  const { isMobile } = useDeviceInfo();

  const handleOpenSessionList = () => {
    if (isMobile) {
      const { isSessionSwitcherOpen } = useUIStore.getState();
      setSessionSwitcherOpen(!isSessionSwitcherOpen);
    } else {
      toggleSidebar();
    }
    handleClose();
  };

  const handleOpenDiffPanel = () => {
    setActiveMainTab('diff');
    handleClose();
  };

  const handleOpenGitPanel = () => {
    setActiveMainTab('git');
    handleClose();
  };

  const handleOpenTerminal = () => {
    setActiveMainTab('terminal');
    handleClose();
  };

  const handleOpenSettings = () => {
    setSettingsDialogOpen(true);
    handleClose();
  };

  const handleOpenStatus = () => {
    setStatusDialogOpen(true);
    handleClose();
  };

  const handleReloadConfiguration = () => {
    reloadOpenCodeConfiguration();
    handleClose();
  };

  const handleSaveToStash = () => {
    const text = pendingInputText?.trim();
    if (text) {
      savePrompt(text);
      handleClose();
    }
  };

  const handleLoadPrompt = (id: string) => {
    const text = loadPrompt(id);
    if (text) {
      setPendingInputText(text);
      handleClose();
      // Focus on input after loading
      // Note: This would require ref to ChatInput textarea, which isn't available here
      // The store change will trigger the update automatically
    }
  };

  const handleUndo = () => {
    setUndoDialogOpen(true);
    handleClose();
  };

  const handleRedo = async () => {
    if (currentSessionId) {
      try {
        // Revert with empty messageId triggers unrevert (redo)
        await revertToMessage(currentSessionId, '');
      } catch (error) {
        console.error('Failed to redo:', error);
      }
      handleClose();
    }
  };

  const canUndo = React.useMemo(() => {
    if (!currentSessionId) return false;
    const session = sessions.find((s) => s.id === currentSessionId);
    return !session?.revert;
  }, [currentSessionId, sessions]);

  const canRedo = React.useMemo(() => {
    if (!currentSessionId) return false;
    const session = sessions.find((s) => s.id === currentSessionId);
    return Boolean(session?.revert);
  }, [currentSessionId, sessions]);

  const directorySessions = getSessionsByDirectory(currentDirectory ?? '');
  const currentSessions = React.useMemo(() => {
    return directorySessions.slice(0, 5);
  }, [directorySessions]);

  return (
    <CommandDialog open={isCommandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={handleOpenSessionList}>
            <RiLayoutLeftLine className="mr-2 h-4 w-4" />
            <span>Open Session List</span>
            <CommandShortcut>Ctrl + L</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleCreateSession}>
            <RiAddLine className="mr-2 h-4 w-4" />
            <span>New Session</span>
            <CommandShortcut>Ctrl + N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleOpenAdvancedSession}>
            <RiGitBranchLine className="mr-2 h-4 w-4" />
            <span>New Session with Worktree</span>
            <CommandShortcut>Shift + Ctrl + N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleUndo} disabled={!canUndo}>
            <RiArrowGoBackLine className="mr-2 h-4 w-4" />
            <span>Undo</span>
            <CommandShortcut>Ctrl + Z</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleRedo} disabled={!canRedo}>
            <RiArrowGoForwardLine className="mr-2 h-4 w-4" />
            <span>Redo</span>
            <CommandShortcut>Ctrl + Y</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleExportCurrentSession} disabled={!currentSessionId}>
            <RiDownloadLine className="mr-2 h-4 w-4" />
            <span>Export Session</span>
            <CommandShortcut>Ctrl + Shift + E</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleForkSession} disabled={!currentSessionId}>
            <RiGitBranchLine className="mr-2 h-4 w-4" />
            <span>Fork Session</span>
            <CommandShortcut>Ctrl + Shift + F</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleShowHelp}>
            <RiQuestionLine className="mr-2 h-4 w-4" />
            <span>Keyboard Shortcuts</span>
            <CommandShortcut>Ctrl + H</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleOpenDiffPanel}>
            <RiCodeLine className="mr-2 h-4 w-4" />
            <span>Open Diff Panel</span>
            <CommandShortcut>Ctrl + E</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleOpenGitPanel}>
            <RiGitBranchLine className="mr-2 h-4 w-4" />
            <span>Open Git Panel</span>
            <CommandShortcut>Ctrl + G</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleOpenTerminal}>
            <RiTerminalBoxLine className="mr-2 h-4 w-4" />
            <span>Open Terminal</span>
            <CommandShortcut>Ctrl + T</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleOpenSettings}>
            <RiSettings3Line className="mr-2 h-4 w-4" />
            <span>Open Settings</span>
            <CommandShortcut>Ctrl + ,</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleOpenStatus}>
            <RiDashboard3Line className="mr-2 h-4 w-4" />
            <span>System Status</span>
            <CommandShortcut>Ctrl + Shift + S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleReloadConfiguration}>
            <RiRestartLine className="mr-2 h-4 w-4" />
            <span>Reload OpenCode Configuration</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Prompt Stash">
          <CommandItem onSelect={handleSaveToStash} disabled={!pendingInputText?.trim()}>
            <RiStarSLine className="mr-2 h-4 w-4" />
            <span>Save Current Input</span>
            <CommandShortcut>Ctrl + S</CommandShortcut>
          </CommandItem>
          {prompts.length > 0 && (
            <>
              <CommandSeparator />
              {/* Show up to 5 recent prompts */}
              {prompts.slice(0, 5).map((prompt) => (
                <CommandItem
                  key={prompt.id}
                  onSelect={() => handleLoadPrompt(prompt.id)}
                >
                  <RiStarLine className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate flex-1">
                    {prompt.title}
                  </span>
                  <span className="typography-micro text-muted-foreground/60 ml-2">
                    {new Date(prompt.timestamp).toLocaleDateString()}
                  </span>
                </CommandItem>
              ))}
            </>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => handleSetThemeMode('light')}>
            <RiSunLine className="mr-2 h-4 w-4" />
            <span>Light Theme</span>
            {themeMode === 'light' && <RiCheckLine className="ml-auto h-4 w-4" />}
          </CommandItem>
          <CommandItem onSelect={() => handleSetThemeMode('dark')}>
            <RiMoonLine className="mr-2 h-4 w-4" />
            <span>Dark Theme</span>
            {themeMode === 'dark' && <RiCheckLine className="ml-auto h-4 w-4" />}
          </CommandItem>
          <CommandItem onSelect={() => handleSetThemeMode('system')}>
            <RiComputerLine className="mr-2 h-4 w-4" />
            <span>System Theme</span>
            {themeMode === 'system' && <RiCheckLine className="ml-auto h-4 w-4" />}
          </CommandItem>
        </CommandGroup>

        {currentSessions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Sessions">
              {currentSessions.map((session) => (
                <CommandItem
                  key={session.id}
                  onSelect={() => handleOpenSession(session.id)}
                >
                  <RiChatAi3Line className="mr-2 h-4 w-4" />
                  <span className="truncate">
                    {session.title || 'Untitled Session'}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {}
      </CommandList>
    </CommandDialog>
  );
};
