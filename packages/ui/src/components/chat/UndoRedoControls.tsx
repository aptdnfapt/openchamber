import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RiArrowGoBackLine, RiArrowGoForwardLine } from '@remixicon/react';
import { useSessionStore } from '@/stores/useSessionStore';
import { cn } from '@/lib/utils';

/**
 * UndoRedoControls - Provides undo/redo buttons for session history navigation
 * Can be used in both header and input toolbar contexts
 */
export const UndoRedoControls: React.FC<{
  variant?: 'header' | 'toolbar';
  compact?: boolean;
}> = ({ variant = 'toolbar', compact = false }) => {
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const sessions = useSessionStore((state) => state.sessions);
  const revertToMessage = useSessionStore((state) => state.revertToMessage);
  const setUndoDialogOpen = useSessionStore((state) => state.setUndoDialogOpen);

  // Check if we can undo (not at the first message)
  const canUndo = React.useMemo(() => {
    if (!currentSessionId) return false;
    const session = sessions.find((s) => s.id === currentSessionId);
    if (!session) return false;
    // Can undo if there are messages and no revert state already
    return !session.revert;
  }, [currentSessionId, sessions]);

  // Check if we can redo (revert state exists)
  const canRedo = React.useMemo(() => {
    if (!currentSessionId) return false;
    const session = sessions.find((s) => s.id === currentSessionId);
    if (!session) return false;
    // Can redo if revert state exists
    return Boolean(session.revert);
  }, [currentSessionId, sessions]);

  const handleUndo = React.useCallback(async () => {
    if (!currentSessionId || !canUndo) return;

    // Open the undo dialog instead of immediate undo
    setUndoDialogOpen(true);
  }, [currentSessionId, canUndo, setUndoDialogOpen]);

  const handleRedo = React.useCallback(async () => {
    if (!currentSessionId || !canRedo) return;

    try {
      await revertToMessage(currentSessionId, '');
    } catch (error) {
      console.error('Failed to redo:', error);
    }
  }, [currentSessionId, canRedo, revertToMessage]);

  // Header variant styling
  const headerButtonClass = 'app-region-no-drag inline-flex h-9 w-9 items-center justify-center gap-2 p-2 typography-ui-label font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 hover:text-foreground';

  // Toolbar variant styling
  const toolbarButtonClass = 'flex items-center justify-center text-muted-foreground transition-none outline-none focus:outline-none flex-shrink-0';

  const buttonClass = variant === 'header'
    ? headerButtonClass
    : cn(
        toolbarButtonClass,
        compact ? 'h-[22px] w-[22px]' : 'h-7 w-7',
        compact ? 'h-4 w-4' : 'h-[18px] w-[18px]'
      );

  const iconSizeClass = variant === 'header'
    ? 'h-5 w-5'
    : (compact ? 'h-4 w-4' : 'h-[18px] w-[18px]');

  return (
    <>
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            aria-label="Undo last action"
            className={buttonClass}
          >
            <RiArrowGoBackLine className={iconSizeClass} />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Undo {variant === 'header' && '(Ctrl+Z)'}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            aria-label="Redo last undone action"
            className={buttonClass}
          >
            <RiArrowGoForwardLine className={iconSizeClass} />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Redo {variant === 'header' && '(Ctrl+Y)'}</p>
        </TooltipContent>
      </Tooltip>
    </>
  );
};
