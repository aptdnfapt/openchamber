import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RiArrowGoForwardLine } from '@remixicon/react';
import { useSessionStore } from '@/stores/useSessionStore';
import { opencodeClient } from '@/lib/opencode/client';
import { toast } from 'sonner';

/**
 * UndoIndicator - Visual divider showing current undo point in message history
 * Appears in message list when a revert state is active
 */
export const UndoIndicator: React.FC = () => {
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const sessions = useSessionStore((state) => state.sessions);

  // Get revert state for current session
  const revertState = React.useMemo(() => {
    if (!currentSessionId) return null;
    const session = sessions.find((s) => s.id === currentSessionId);
    return session?.revert || null;
  }, [currentSessionId, sessions]);

  const handleRedo = React.useCallback(async () => {
    if (!currentSessionId) return;

    try {
      await opencodeClient.unrevertSession(currentSessionId);
      toast.success('Redo successful');
    } catch (error) {
      console.error('Failed to redo:', error);
      toast.error('Failed to redo');
    }
  }, [currentSessionId]);

  if (!revertState) {
    return null;
  }

  return (
    <div className="relative my-4 py-2">
      {/* Red dashed line */}
      <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-[var(--status-error)]" />

      {/* Center label with dropdown */}
      <div className="relative z-10 mx-auto flex w-fit items-center gap-2 rounded-full bg-background px-4 py-1.5 shadow-sm border border-[var(--status-error)]/20">
        <span className="typography-ui-label text-xs font-medium text-[var(--status-error)]">
          Undo point
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full p-0.5 hover:bg-[var(--status-error)]/10 transition-colors"
              aria-label="Redo options"
            >
              <RiArrowGoForwardLine className="h-3 w-3 text-[var(--status-error)]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="bottom">
            <DropdownMenuItem onClick={handleRedo}>
              <RiArrowGoForwardLine className="mr-2 h-4 w-4" />
              <span>Redo (restore)</span>
              <span className="ml-auto text-xs text-muted-foreground">Ctrl+Y</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
