import React from 'react';
import { cn } from '@/lib/utils';
import { AnimatedTabs, type AnimatedTabOption } from '@/components/ui/animated-tabs';

export type StatusTabValue = 'mcp' | 'lsp' | 'formatters' | 'plugins';

interface StatusTabsProps {
  value: StatusTabValue;
  onValueChange: (value: StatusTabValue) => void;
  counts: {
    mcp: number;
    lsp: number;
    formatters: number;
    plugins: number;
  };
  className?: string;
}

const tabs: AnimatedTabOption<StatusTabValue>[] = [
  { value: 'mcp', label: 'MCP' },
  { value: 'lsp', label: 'LSP' },
  { value: 'formatters', label: 'Formatters' },
  { value: 'plugins', label: 'Plugins' },
];

export const StatusTabs: React.FC<StatusTabsProps> = ({
  value,
  onValueChange,
  counts,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      < AnimatedTabs
        tabs={tabs}
        value={value}
        onValueChange={onValueChange}
        className="flex-1"
      />
      {/* Show active count badge */}
      <div className="text-sm text-muted-foreground typography-meta">
        {counts[value]} {counts[value] === 1 ? 'item' : 'items'}
      </div>
    </div>
  );
};
