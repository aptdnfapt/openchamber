import React from 'react';
import { Input } from '@/components/ui/input';
import { RiSearchLine, RiLoader4Line } from '@remixicon/react';
import { DirectorySearchResults } from './DirectorySearchResults';
import { useDirectorySearch } from '@/hooks/useDirectorySearch';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface DirectorySearchInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (path: string) => void;
  homeDirectory: string | null;
  className?: string;
}

export const DirectorySearchInput: React.FC<DirectorySearchInputProps> = ({
  query,
  onQueryChange,
  onSelect,
  homeDirectory,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // Debounce the search query to avoid excessive API calls
  const debouncedQuery = useDebouncedValue(query.trim(), 300);

  // Use the directory search hook
  const { results, isLoading, error, search } = useDirectorySearch();

  // Trigger search when debounced query changes
  React.useEffect(() => {
    if (debouncedQuery.length >= 2) {
      search(debouncedQuery);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [debouncedQuery, search]);

  // Reset selected index when results change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Close results when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onQueryChange(value);
    setIsOpen(true);
    setSelectedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      // Allow Escape to close even without results
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results.length > 0 && results[selectedIndex]) {
          onSelect(results[selectedIndex]);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (index: number) => {
    if (results[index]) {
      onSelect(results[index]);
      setIsOpen(false);
    }
  };

  const handleFocus = () => {
    if (query.trim().length >= 2) {
      setIsOpen(true);
    }
  };

  return (
    <div className={className}>
      <div className="relative">
        <Input
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder="Search directories..."
          className="pl-9 typography-meta"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {isLoading && (
          <RiLoader4Line className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      <DirectorySearchResults
        results={results}
        selectedIndex={selectedIndex}
        onSelect={handleSelect}
        onHover={setSelectedIndex}
        homeDirectory={homeDirectory}
        isOpen={isOpen}
        query={query}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
};
