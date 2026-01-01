import React from 'react';
import { RiFileCopy2Line } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StatusExportButtonProps {
  getStatusContent: () => string;
  className?: string;
}

export const StatusExportButton: React.FC<StatusExportButtonProps> = ({
  getStatusContent,
  className,
}) => {
  const [isCopied, setIsCopied] = React.useState(false);

  const handleExport = async () => {
    const content = getStatusContent();

    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);

      toast.success('Status copied to clipboard', {
        description: 'Paste it in your bug report or share with support.',
      });

      // Reset after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy status', {
        description: err instanceof Error ? err.message : 'Unknown error occurred',
      });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isCopied}
      className={className}
    >
      <RiFileCopy2Line
        size={16}
        className={cn('mr-2', isCopied && 'text-[var(--status-success)]')}
      />
      {isCopied ? 'Copied!' : 'Copy Status'}
    </Button>
  );
};
