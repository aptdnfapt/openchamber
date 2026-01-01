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

      // Get the raw API client to access findFile
      const apiClient = opencodeClient.getApiClient();

      // Call findFile endpoint with type=directory to filter to directories only
      const response = await (apiClient as unknown as { find: (params: unknown) => Promise<{ data: unknown }> }).find({
        query: {
          query: trimmedQuery,
          type: 'directory',
          limit: 20,
        }
      });

      if (response.data && Array.isArray(response.data)) {
        setResults(response.data);
      } else {
        setResults([]);
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
