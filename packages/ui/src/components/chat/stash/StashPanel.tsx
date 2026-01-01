import React, { useState, useRef, useEffect } from 'react';
import { RiSearchLine, RiAddLine, RiLoader4Line } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { usePromptStashStore } from '@/stores/usePromptStashStore';
import { StashedPromptCard } from './StashedPromptCard';
import { StashEmptyState } from './StashEmptyState';

interface StashPanelProps {
  onLoadPrompt: (text: string) => void;
  currentInput?: string;
  className?: string;
}

/**
 * Popover panel showing all stashed prompts.
 * Includes search, save current, and list of prompts.
 */
export const StashPanel: React.FC<StashPanelProps> = ({
  onLoadPrompt,
  currentInput = '',
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { prompts, savePrompt, loadPrompt, deletePrompt } = usePromptStashStore();

  // Focus search input when panel opens
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Filter prompts based on search query
  const filteredPrompts = React.useMemo(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return prompts;
    }

    const lowerQuery = searchQuery.toLowerCase().trim();
    return prompts.filter((p) =>
      p.text.toLowerCase().includes(lowerQuery) ||
      p.title.toLowerCase().includes(lowerQuery) ||
      p.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }, [searchQuery, prompts]);

  // Handle save current input
  const handleSaveCurrent = async () => {
    const trimmedInput = currentInput.trim();
    if (!trimmedInput) return;

    setIsSaving(true);
    savePrompt(trimmedInput);
    // Clear search and show toast after save
    setSearchQuery('');
    setIsSaving(false);

    // Note: In a real implementation, we'd show a toast notification here
    // For now, we can use a simple console log or add toast integration later
    console.log('Prompt saved to stash');
  };

  // Handle load prompt
  const handleLoadPrompt = (id: string) => {
    const text = loadPrompt(id);
    if (text) {
      onLoadPrompt(text);
    }
  };

  // Handle delete prompt
  const handleDeletePrompt = (id: string) => {
    deletePrompt(id);
  };

  const hasCurrentInput = currentInput.trim().length > 0;
  const isEmpty = filteredPrompts.length === 0;

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border border-border/60 bg-background shadow-lg',
        'w-[340px] max-h-[400px]',
        className
      )}
      role="dialog"
      aria-label="Prompt stash"
    >
      {/* Header with title, search, and save button */}
      <div className="flex flex-col gap-2 border-b border-border/60 p-3">
        <div className="flex items-center justify-between">
          <h3 className="typography-ui-label font-medium text-foreground">
            Prompt Stash ({prompts.length})
          </h3>
          <button
            type="button"
            onClick={handleSaveCurrent}
            disabled={!hasCurrentInput || isSaving}
            className={cn(
              'inline-flex items-center justify-center gap-1',
              'rounded-sm px-2 py-1 text-sm font-medium',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
            )}
            title={hasCurrentInput ? 'Save current input to stash' : 'Type prompt to save'}
            aria-label="Save current input to stash"
          >
            {isSaving ? (
              <RiLoader4Line className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <RiAddLine className="h-3.5 w-3.5" />
                <span className="typography-micro">Save</span>
              </>
            )}
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <RiSearchLine className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts..."
            className={cn(
              'w-full rounded-md border border-border/60 bg-input/30 py-1.5 pl-8 pr-2.5',
              'typography-ui-label text-foreground placeholder:text-muted-foreground/50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
              'transition-all'
            )}
            aria-label="Search prompts"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Prompt list */}
      <div className="flex-1 overflow-y-auto p-3">
        {isEmpty ? (
          <StashEmptyState />
        ) : (
          <div className="flex flex-col gap-2">
            {filteredPrompts.map((prompt) => (
              <StashedPromptCard
                key={prompt.id}
                prompt={prompt}
                onLoad={() => handleLoadPrompt(prompt.id)}
                onDelete={() => handleDeletePrompt(prompt.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {prompts.length > 0 && (
        <div className="border-t border-border/60 p-2">
          <p className="typography-micro text-center text-muted-foreground/60">
            {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''} shown
          </p>
        </div>
      )}
    </div>
  );
};
