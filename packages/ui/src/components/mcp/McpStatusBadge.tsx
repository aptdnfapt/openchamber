import React from 'react';
import { cn } from '@/lib/utils';
import { RiCheckLine, RiErrorWarningLine } from '@remixicon/react';
import type { McpServerStatus } from '@/stores/useMcpStore';

interface McpStatusBadgeProps {
  status: McpServerStatus;
  className?: string;
}

export const McpStatusBadge: React.FC<McpStatusBadgeProps> = ({ status, className }) => {
  const config: Record<McpServerStatus, { label: string; icon: React.ReactNode; className: string }> = {
    connected: {
      label: 'Connected',
      icon: <RiCheckLine className="h-3.5 w-3.5" />,
      className: 'bg-status-success/10 text-status-success border-status-success/20',
    },
    disabled: {
      label: 'Disabled',
      icon: <div className="h-2 w-2 rounded-full bg-muted-foreground" />,
      className: 'bg-muted/50 text-muted-foreground border-border',
    },
    failed: {
      label: 'Failed',
      icon: <RiErrorWarningLine className="h-3.5 w-3.5" />,
      className: 'bg-status-error/10 text-status-error border-status-error/20',
    },
    needs_auth: {
      label: 'Needs Auth',
      icon: <RiErrorWarningLine className="h-3.5 w-3.5" />,
      className: 'bg-status-warning/10 text-status-warning border-status-warning/20',
    },
    needs_client_registration: {
      label: 'Needs Registration',
      icon: <RiErrorWarningLine className="h-3.5 w-3.5" />,
      className: 'bg-status-warning/10 text-status-warning border-status-warning/20',
    },
  };

  const { label, icon, className: statusClassName } = config[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        statusClassName,
        className
      )}
      role="status"
      aria-label={`Status: ${label}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};
