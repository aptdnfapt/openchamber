import React, { useState } from 'react';
import type { Session } from '@opencode-ai/sdk';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiParentLine,
  RiGitBranchLine,
} from '@remixicon/react';
import { useSessionStore } from '@/stores/useSessionStore';
import { cn } from '@/lib/utils';
import { formatPathForDisplay } from '@/lib/utils';

interface SessionHierarchyItemProps {
  session: Session;
  isCurrent?: boolean;
  onClick: () => void;
}

const SessionHierarchyItem: React.FC<SessionHierarchyItemProps> = ({
  session,
  isCurrent = false,
  onClick,
}) => {
  const title = session.title || 'Untitled';
  const formattedPath = session.directory
    ? formatPathForDisplay(session.directory)
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isCurrent && 'bg-accent text-accent-foreground font-medium'
      )}
    >
      <div className="flex items-center gap-2">
        {isCurrent ? (
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        ) : (
          <div className="h-1.5 w-1.5 rounded-full border border-muted-foreground" />
        )}
        <span className="truncate flex-1">{title}</span>
      </div>
      {formattedPath && (
        <div className="text-xs text-muted-foreground ml-5 mt-0.5 truncate">
          {formattedPath}
        </div>
      )}
    </button>
  );
};

export const RelatedSessionsSection: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const sessions = useSessionStore((state) => state.sessions);
  const sessionHierarchy = useSessionStore((state) => state.sessionHierarchy);
  const fetchSessionHierarchy = useSessionStore((state) => state.fetchSessionHierarchy);
  const navigateToSession = useSessionStore((state) => state.navigateToSession);

  const hierarchy = React.useMemo(() => {
    if (!currentSessionId) return null;
    return sessionHierarchy.get(currentSessionId);
  }, [currentSessionId, sessionHierarchy]);

  // Fetch hierarchy when session changes
  React.useEffect(() => {
    if (currentSessionId) {
      fetchSessionHierarchy(currentSessionId);
    }
  }, [currentSessionId, fetchSessionHierarchy]);

  const handleSessionClick = React.useCallback(
    async (sessionId: string) => {
      await navigateToSession(sessionId);
    },
    [navigateToSession]
  );

  if (!hierarchy || hierarchy.isLoading) {
    return (
      <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
    );
  }

  const hasParent = hierarchy.parentSession != null;
  const hasSiblings = hierarchy.siblingSessions.length > 0;

  if (!hasParent && !hasSiblings) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-1.5 px-3 py-2 w-full hover:bg-accent hover:text-accent-foreground text-sm font-medium">
        {isOpen ? (
          <RiArrowDownSLine className="h-4 w-4" />
        ) : (
          <RiArrowRightSLine className="h-4 w-4" />
        )}
        Related Sessions
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-4 px-1 pb-2">
          {/* Parent */}
          {hasParent && hierarchy.parentSession && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <RiParentLine className="h-3 w-3" />
                Parent
              </div>
              <SessionHierarchyItem
                session={hierarchy.parentSession}
                onClick={() => handleSessionClick(hierarchy.parentSession!.id)}
              />
            </div>
          )}

          {/* Current Session */}
          {currentSessionId && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Current
              </div>
              {(() => {
                const current = sessions.find(s => s.id === currentSessionId);
                return current ? (
                  <SessionHierarchyItem
                    session={current}
                    isCurrent
                    onClick={() => {}}
                  />
                ) : null;
              })()}
            </div>
          )}

          {/* Siblings */}
          {hasSiblings && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <RiGitBranchLine className="h-3 w-3" />
                Siblings
                <span className="ml-auto">
                  {hierarchy.siblingSessions.length}
                </span>
              </div>
              <div className="space-y-1">
                {hierarchy.siblingSessions.map((session) => (
                  <SessionHierarchyItem
                    key={session.id}
                    session={session}
                    isCurrent={session.id === currentSessionId}
                    onClick={() => handleSessionClick(session.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
