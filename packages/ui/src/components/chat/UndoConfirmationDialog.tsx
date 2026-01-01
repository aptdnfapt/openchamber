import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMessageStore } from '@/stores/messageStore';
import { useSessionStore } from '@/stores/useSessionStore';

/**
 * UndoConfirmationDialog - Confirmation dialog for destructive undo actions
 * Shows message preview and count of messages to be removed
 */
export const UndoConfirmationDialog: React.FC = () => {
  const { isUndoDialogOpen, setUndoDialogOpen, revertToMessage, currentSessionId, sessions } =
    useSessionStore();
  const messages = useMessageStore((state) => state.messages);

  // Calculate messages to be removed on undo
  const messagesToBeRemoved = React.useMemo(() => {
    if (!currentSessionId) return 0;

    const sessionMessages = messages.get(currentSessionId) || [];
    const session = sessions.find((s) => s.id === currentSessionId);

    // Get the last user message before reverting
    const userMessages = sessionMessages.filter((m) => m.info.role === 'user');
    const revertMessageIndex = session?.revert?.messageID
      ? sessionMessages.findIndex((m) => m.info.id === session.revert?.messageID)
      : userMessages.length - 2; // Default to second-to-last user message

    if (revertMessageIndex !== -1) {
      return sessionMessages.length - revertMessageIndex - 1;
    }

    return sessionMessages.filter((m) => m.info.role === 'user').length;
  }, [currentSessionId, messages, sessions]);

  const handleConfirm = async () => {
    if (!currentSessionId) return;

    try {
      const session = sessions.find((s) => s.id === currentSessionId);
      const targetMessageId = session?.revert?.messageID || '';
      if (!targetMessageId) {
        // Find the message to undo to
        const sessionMessages = messages.get(currentSessionId) || [];
        const userMessages = sessionMessages.filter((m) => m.info.role === 'user');
        if (userMessages.length > 1) {
          await revertToMessage(currentSessionId, userMessages[userMessages.length - 2].info.id);
        }
      } else {
        await revertToMessage(currentSessionId, targetMessageId);
      }
      setUndoDialogOpen(false);
    } catch (error) {
      console.error('Failed to revert:', error);
    }
  };

  return (
    <Dialog open={isUndoDialogOpen} onOpenChange={setUndoDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Undo</DialogTitle>
          <DialogDescription>
            This will undo to the previous message. {messagesToBeRemoved > 0 && `${messagesToBeRemoved} message${messagesToBeRemoved > 1 ? 's' : ''} will be removed.`}
            <br />
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setUndoDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              void handleConfirm();
            }}
          >
            Undo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
