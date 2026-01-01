import { useState, useCallback } from 'react';
import { opencodeClient } from '@/lib/opencode/client';

export const useDirectorySearch = () => {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');

  const search = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const trimmedQuery = query.trim();
    setCurrentQuery(trimmedQuery);

      try {
        setIsLoading(true);
        setError(null);

        // Use the SDK's searchFiles method with directory parameter
        const results = await opencodeClient.searchFiles(trimmedQuery, {
          type: 'directory',
          limit: 20,
        });

        setResults(results);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
    setCurrentQuery('');
  }, []);

  return { results, isLoading, error, search, clear, currentQuery };
};
