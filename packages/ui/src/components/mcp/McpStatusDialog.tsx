import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { McpPanel } from './McpPanel';
import { RiPlug2Line } from '@remixicon/react';

interface McpStatusDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const McpStatusDialog: React.FC<McpStatusDialogProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <RiPlug2Line className="h-5 w-5" />
            MCP Servers
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <McpPanel className="h-full" />
        </div>
      </DialogContent>
    </Dialog>
  );
};
