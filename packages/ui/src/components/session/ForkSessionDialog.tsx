import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { RiCheckboxBlankLine, RiCheckboxLine, RiGitBranchLine, RiLoaderLine } from '@remixicon/react';
import { MobileOverlayPanel } from '@/components/ui/MobileOverlayPanel';
import { useSessionStore } from '@/stores/useSessionStore';
import { useDeviceInfo } from '@/lib/device';
import { cn } from '@/lib/utils';
import type { Message } from '@opencode-ai/sdk';

// Format timestamp for display
const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: diffDays < 365 ? undefined : 'numeric' });
};

// Count how many assistant messages came after this user message
const countResponsesAfter = (messages: Message[], targetMessageId: string): number => {
    const index = messages.findIndex(m => m.id === targetMessageId);
    if (index === -1) return 0;
    // Count assistant messages that come after this message
    let count = 0;
    for (let i = index + 1; i < messages.length; i++) {
        if (messages[i].role === 'assistant') {
            count++;
        }
    }
    return count;
};

export const ForkSessionDialog: React.FC = () => {
    const { isMobile } = useDeviceInfo();
    const forkDialogState = useSessionStore((state) => state.forkDialogState);
    const closeForkDialog = useSessionStore((state) => state.closeForkDialog);
    const setForkSearchQuery = useSessionStore((state) => state.setForkSearchQuery);
    const selectForkMessage = useSessionStore((state) => state.selectForkMessage);
    const forkFromMessage = useSessionStore((state) => state.forkFromMessage);
    const messages = useSessionStore((state) => state.messages.get(forkDialogState.sourceSessionId ?? ''));

    const filteredMessages = React.useMemo(() => {
        const query = forkDialogState.searchQuery.toLowerCase().trim();
        if (!query) return forkDialogState.messages;
        return forkDialogState.messages.filter(msg => {
            // Get message parts from the full messages map
            const fullMessage = messages?.find(m => m.info.id === msg.id);
            if (!fullMessage) return false;

            // Search in text parts
            const textContent = fullMessage.parts
                .filter(p => p.type === 'text')
                .map(p => (p as { text?: string }).text || '')
                .join(' ')
                .toLowerCase();

            return textContent.includes(query);
        });
    }, [forkDialogState.messages, forkDialogState.searchQuery, messages]);

    const handleFork = React.useCallback(async () => {
        if (!forkDialogState.sourceSessionId || !forkDialogState.selectedMessageId) {
            return;
        }
        await forkFromMessage(forkDialogState.sourceSessionId, forkDialogState.selectedMessageId);
    }, [forkDialogState.sourceSessionId, forkDialogState.selectedMessageId, forkFromMessage]);

    const handleMessageClick = React.useCallback((messageId: string) => {
        selectForkMessage(messageId);
    }, [selectForkMessage]);

    const renderMessageCard = (message: Message) => {
        const isSelected = forkDialogState.selectedMessageId === message.id;
        const fullMessage = messages?.find(m => m.info.id === message.id);
        const textContent = fullMessage?.parts
            .filter(p => p.type === 'text')
            .map(p => (p as { text?: string }).text || '')
            .join(' ') || '';
        const preview = textContent.slice(0, 100) + (textContent.length > 100 ? '...' : '');
        const responseCount = countResponsesAfter(forkDialogState.messages, message.id);

        return (
            <button
                key={message.id}
                type="button"
                onClick={() => handleMessageClick(message.id)}
                className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all duration-200",
                    "hover:bg-accent hover:border-accent-foreground/20",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border"
                )}
                aria-pressed={isSelected}
                role="option"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm typography-body line-clamp-2 break-words">
                            {preview || <span className="text-muted-foreground italic">No text content</span>}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatTimestamp(message.time.created.toString())}</span>
                            {responseCount > 0 && (
                                <>
                                    <span>•</span>
                                    <span>{responseCount} response{responseCount !== 1 ? 's' : ''}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        {isSelected ? (
                            <RiCheckboxLine className="h-5 w-5 text-primary" />
                        ) : (
                            <RiCheckboxBlankLine className="h-5 w-5 text-muted-foreground" />
                        )}
                    </div>
                </div>
            </button>
        );
    };

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
        if (forkDialogState.isLoading) return;

        const visibleMessages = filteredMessages;
        const currentIndex = visibleMessages.findIndex(m => m.id === forkDialogState.selectedMessageId);

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentIndex < visibleMessages.length - 1) {
                selectForkMessage(visibleMessages[currentIndex + 1].id);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentIndex > 0) {
                selectForkMessage(visibleMessages[currentIndex - 1].id);
            }
        } else if (e.key === 'Enter' && forkDialogState.selectedMessageId) {
            e.preventDefault();
            handleFork();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeForkDialog();
        }
    }, [filteredMessages, forkDialogState.selectedMessageId, forkDialogState.isLoading, selectForkMessage, closeForkDialog, handleFork]);

    const dialogContent = (
        <>
            {forkDialogState.isLoading && filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <RiLoaderLine className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="mt-4 text-sm typography-text text-muted-foreground">Loading messages...</p>
                </div>
            ) : filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-sm typography-text text-muted-foreground">
                        {forkDialogState.searchQuery ? 'No matching messages found' : 'No messages to fork from'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto" onKeyDown={handleKeyDown}>
                    {filteredMessages.map(renderMessageCard)}
                </div>
            )}

            {forkDialogState.error && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{forkDialogState.error}</p>
                </div>
            )}
        </>
    );

    const dialogActions = (
        <>
            <Button
                type="button"
                variant="outline"
                onClick={closeForkDialog}
                disabled={forkDialogState.isLoading}
            >
                Cancel
            </Button>
            <Button
                type="button"
                onClick={handleFork}
                disabled={!forkDialogState.selectedMessageId || forkDialogState.isLoading}
                className="gap-2"
            >
                {forkDialogState.isLoading ? (
                    <>
                        <RiLoaderLine className="h-4 w-4 animate-spin" />
                        Forking...
                    </>
                ) : (
                    <>
                        <RiGitBranchLine className="h-4 w-4" />
                        Fork
                    </>
                )}
            </Button>
        </>
    );

    const searchInput = (
        <div className="relative">
            <Input
                type="text"
                placeholder="Search messages..."
                value={forkDialogState.searchQuery}
                onChange={(e) => setForkSearchQuery(e.target.value)}
                className="w-full"
                disabled={forkDialogState.isLoading}
            />
        </div>
    );

    return (
        <>
            {isMobile ? (
                <MobileOverlayPanel
                    open={forkDialogState.open}
                    onClose={closeForkDialog}
                    title="Fork from Message"
                    footer={<div className="flex justify-end gap-2">{dialogActions}</div>}
                >
                    <div className="space-y-4">
                        {searchInput}
                        {dialogContent}
                    </div>
                </MobileOverlayPanel>
            ) : (
                <Dialog open={forkDialogState.open} onOpenChange={(open) => {
                    if (!open) closeForkDialog();
                }}>
                    <DialogContent className="max-w-[min(520px,100vw-2rem)] space-y-2 pb-2 overflow-hidden">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <RiGitBranchLine className="h-5 w-5" />
                                Fork from Message
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            {searchInput}
                            {dialogContent}
                        </div>
                        <DialogFooter className="mt-2 gap-2 pt-1 pb-1">{dialogActions}</DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};
