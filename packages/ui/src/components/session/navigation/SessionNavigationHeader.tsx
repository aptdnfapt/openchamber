import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiArrowUpLine,
} from '@remixicon/react';
import { useSessionStore } from '@/stores/useSessionStore';
import { useDeviceInfo } from '@/lib/device';

export const SessionNavigationHeader: React.FC = () => {
  const { isMobile } = useDeviceInfo();
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const sessionHierarchy = useSessionStore((state) => state.sessionHierarchy);
  const fetchSessionHierarchy = useSessionStore((state) => state.fetchSessionHierarchy);
  const navigateToParent = useSessionStore((state) => state.navigateToParent);
  const navigateToSibling = useSessionStore((state) => state.navigateToSibling);

  const hierarchy = React.useMemo(() => {
    if (!currentSessionId) return null;
    return sessionHierarchy.get(currentSessionId);
  }, [currentSessionId, sessionHierarchy]);

  const hasParent = hierarchy?.parentSession != null;
  const hasNextSibling = hierarchy ? hierarchy.siblingIndex < hierarchy.siblingSessions.length - 1 : false;
  const hasPrevSibling = hierarchy ? hierarchy.siblingIndex > 0 : false;

  const siblingPosition = hierarchy
    ? `${hierarchy.siblingIndex + 1}/${hierarchy.siblingSessions.length}`
    : null;

  // Fetch hierarchy when session changes
  React.useEffect(() => {
    if (currentSessionId) {
      fetchSessionHierarchy(currentSessionId);
    }
  }, [currentSessionId, fetchSessionHierarchy]);

  const handleParentClick = React.useCallback(async () => {
    await navigateToParent();
  }, [navigateToParent]);

  const handleNextSiblingClick = React.useCallback(async () => {
    await navigateToSibling('next');
  }, [navigateToSibling]);

  const handlePrevSiblingClick = React.useCallback(async () => {
    await navigateToSibling('prev');
  }, [navigateToSibling]);

  const navButtonClass =
    'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50 typography-ui-label';

  if (isMobile) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {/* Parent navigation */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleParentClick}
            disabled={!hasParent}
            aria-label="Go to parent session"
            className={navButtonClass}
          >
            <RiArrowUpLine className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        {hierarchy?.parentSession && (
          <TooltipContent>
            <p>Go to parent session</p>
            <p className="text-xs text-muted-foreground">
              {hierarchy.parentSession.title || 'Untitled'}
            </p>
          </TooltipContent>
        )}
      </Tooltip>

      {/* Previous sibling */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handlePrevSiblingClick}
            disabled={!hasPrevSibling}
            aria-label="Go to previous sibling session"
            className={navButtonClass}
          >
            <RiArrowLeftLine className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        {hasPrevSibling && hierarchy?.siblingSessions[hierarchy.siblingIndex - 1] && (
          <TooltipContent>
            <p>Previous sibling</p>
            <p className="text-xs text-muted-foreground">
              {hierarchy.siblingSessions[hierarchy.siblingIndex - 1].title || 'Untitled'}
            </p>
            {siblingPosition && (
              <p className="text-xs text-muted-foreground">{siblingPosition}</p>
            )}
          </TooltipContent>
        )}
      </Tooltip>

      {/* Next sibling */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleNextSiblingClick}
            disabled={!hasNextSibling}
            aria-label="Go to next sibling session"
            className={navButtonClass}
          >
            <RiArrowRightLine className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        {hasNextSibling && hierarchy?.siblingSessions[hierarchy.siblingIndex + 1] && (
          <TooltipContent>
            <p>Next sibling</p>
            <p className="text-xs text-muted-foreground">
              {hierarchy.siblingSessions[hierarchy.siblingIndex + 1].title || 'Untitled'}
            </p>
            {siblingPosition && (
              <p className="text-xs text-muted-foreground">{siblingPosition}</p>
            )}
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
};
