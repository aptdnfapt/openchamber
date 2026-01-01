import React from 'react';
import { cn, formatPathForDisplay } from '@/lib/utils';
import { RiFolderLine } from '@remixicon/react';

interface DirectorySearchResultsProps {
  results: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
  homeDirectory: string | null;
  isOpen: boolean;
  query: string;
  isLoading: boolean;
  error: string | null;
}

export const DirectorySearchResults: React.FC<DirectorySearchResultsProps> = ({
  results,
  selectedIndex,
  onSelect,
  onHover,
  homeDirectory,
  isOpen,
  query,
  isLoading,
  error,
}) => {
  // Don't show results if not open or loading or if query is too short
  if (!isOpen || isLoading || query.trim().length < 2) {
    return null;
  }

  // Show error state
  if (error) {
    return (
      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg p-3 min-h-[60px]">
        <p className="text-sm text-destructive text-center">
          {error}
        </p>
      </div>
    );
  }

  // Show empty state when no results
  if (results.length === 0) {
    return (
      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg p-3 min-h-[60px]">
        <p className="text-sm text-muted-foreground text-center">
          No directories found
        </p>
      </div>
    );
  }

  // Show results
  return (
    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
      <ul className="py-1" role="listbox" aria-label="Search results">
        {results.map((path, index) => (
          <li key={path}>
            <button
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => onSelect(index)}
              onMouseEnter={() => onHover(index)}
              className={cn(
                "w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-accent transition-colors min-h-[44px]",
                index === selectedIndex && "bg-accent"
              )}
            >
              <RiFolderLine className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="typography-meta font-mono truncate">
                {formatPathForDisplay(path, homeDirectory)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
