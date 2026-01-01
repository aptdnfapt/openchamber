import React from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { RiGitBranchLine } from '@remixicon/react';
import { useSessionStore } from '@/stores/useSessionStore';
import { useDeviceInfo } from '@/lib/device';
import { cn } from '@/lib/utils';

export const ForkSessionButton: React.FC = () => {
    const { isMobile } = useDeviceInfo();
    const currentSessionId = useSessionStore((state) => state.currentSessionId);
    const openForkDialog = useSessionStore((state) => state.openForkDialog);
    const forkDialogState = useSessionStore((state) => state.forkDialogState);

    const handleForkClick = React.useCallback(() => {
        if (currentSessionId) {
            openForkDialog(currentSessionId);
        }
    }, [currentSessionId, openForkDialog]);

    const buttonClassName = React.useMemo(() => {
        return cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50 typography-ui-label',
            forkDialogState.isLoading && 'animate-pulse'
        );
    }, [forkDialogState.isLoading]);

    return (
        <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={handleForkClick}
                    disabled={!currentSessionId || isMobile}
                    aria-label="Fork session"
                    className={buttonClassName}
                >
                    <RiGitBranchLine className="h-4 w-4" />
                </button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Fork session</p>
                <p className="text-xs text-muted-foreground">Create a copy from any message</p>
            </TooltipContent>
        </Tooltip>
    );
};
