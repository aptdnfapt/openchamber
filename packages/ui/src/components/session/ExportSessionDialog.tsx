import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { RiFileCopyLine, RiDownloadLine, RiCheckboxBlankLine, RiCheckboxLine } from '@remixicon/react';
import { MobileOverlayPanel } from '@/components/ui/MobileOverlayPanel';
import { useSessionStore } from '@/stores/useSessionStore';
import { useDeviceInfo } from '@/lib/device';

export const ExportSessionDialog: React.FC = () => {
    const { isMobile } = useDeviceInfo();
    const {
        exportDialogState,
        setExportFilename,
        setExportOption,
        copyTranscript,
        exportToFile,
        closeExportDialog,
    } = useSessionStore();

    const handleCopy = async () => {
        await copyTranscript();
        if (!exportDialogState.error) {
            toast.success('Copied to clipboard');
        }
    };

    const handleExport = async () => {
        await exportToFile();
        if (!exportDialogState.error) {
            toast.success(`Exported: ${exportDialogState.filename}`);
        }
    };

    const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setExportFilename(e.target.value);
    };

    const handleThinkingToggle = () => {
        setExportOption('thinking', !exportDialogState.includeThinking);
    };

    const handleToolDetailsToggle = () => {
        setExportOption('toolDetails', !exportDialogState.includeToolDetails);
    };

    const content = (
        <>
            <DialogHeader>
                <DialogTitle>Export Session</DialogTitle>
                <DialogDescription>
                    Export this session as a markdown file or copy to clipboard
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <label htmlFor="export-filename" className="text-sm font-medium">
                        Filename
                    </label>
                    <Input
                        id="export-filename"
                        value={exportDialogState.filename}
                        onChange={handleFilenameChange}
                        placeholder="session-abc123.md"
                        disabled={exportDialogState.isLoading}
                    />
                </div>

                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={handleThinkingToggle}
                        disabled={exportDialogState.isLoading}
                        className="flex items-start gap-3 w-full text-left group focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-md p-2 hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="mt-0.5 flex-shrink-0">
                            {exportDialogState.includeThinking ? (
                                <RiCheckboxLine className="h-4 w-4 text-primary" />
                            ) : (
                                <RiCheckboxBlankLine className="h-4 w-4" />
                            )}
                        </span>
                        <div>
                            <div className="text-sm font-medium">Include thinking blocks</div>
                            <div className="text-xs text-muted-foreground">
                                Show AI reasoning content
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={handleToolDetailsToggle}
                        disabled={exportDialogState.isLoading}
                        className="flex items-start gap-3 w-full text-left group focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-md p-2 hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="mt-0.5 flex-shrink-0">
                            {exportDialogState.includeToolDetails ? (
                                <RiCheckboxLine className="h-4 w-4 text-primary" />
                            ) : (
                                <RiCheckboxBlankLine className="h-4 w-4" />
                            )}
                        </span>
                        <div>
                            <div className="text-sm font-medium">Include tool details</div>
                            <div className="text-xs text-muted-foreground">
                                Show tool inputs, outputs, and errors
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {exportDialogState.error && (
                <div className="text-sm text-destructive mb-4">
                    {exportDialogState.error}
                </div>
            )}

            <DialogFooter className={isMobile ? 'flex-col gap-2' : undefined}>
                <Button
                    variant="ghost"
                    onClick={closeExportDialog}
                    disabled={exportDialogState.isLoading}
                    className={isMobile ? 'w-full' : undefined}
                >
                    Cancel
                </Button>
                <Button
                    variant="outline"
                    onClick={handleCopy}
                    disabled={exportDialogState.isLoading}
                    className={isMobile ? 'w-full' : undefined}
                >
                    <RiFileCopyLine className="mr-2 h-4 w-4" />
                    Copy
                </Button>
                <Button
                    onClick={handleExport}
                    disabled={exportDialogState.isLoading}
                    className={isMobile ? 'w-full' : undefined}
                >
                    <RiDownloadLine className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </DialogFooter>
        </>
    );

    if (isMobile) {
        return (
            <MobileOverlayPanel
                open={exportDialogState.open}
                title="Export Session"
                onClose={closeExportDialog}
                contentMaxHeightClassName="h-[calc(100vh-12rem)]"
            >
                {content}
            </MobileOverlayPanel>
        );
    }

    return (
        <Dialog open={exportDialogState.open} onOpenChange={closeExportDialog}>
            <DialogContent className="max-w-[480px]">
                {content}
            </DialogContent>
        </Dialog>
    );
};
