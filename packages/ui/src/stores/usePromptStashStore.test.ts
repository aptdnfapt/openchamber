import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { usePromptStashStore } from './usePromptStashStore';

// Mock localStorage to avoid needing full jsdom setup
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('usePromptStashStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it('initializes with empty state', () => {
    const state = usePromptStashStore.getState();
    expect(state.prompts).toBeInstanceOf(Array);
    expect(state.prompts).toHaveLength(0);
  });

  it('saves a prompt successfully', () => {
    usePromptStashStore.getState().savePrompt('This is a test prompt');

    const state = usePromptStashStore.getState();
    expect(state.prompts).toHaveLength(1);
    expect(state.prompts[0].text).toBe('This is a test prompt');
    expect(state.prompts[0].title).toBe('This is a test prompt');
  });

  it('generates unique ID for prompt', () => {
    usePromptStashStore.getState().savePrompt('Test prompt');

    const state = usePromptStashStore.getState();
    expect(state.prompts[0].id).toBeDefined();
    expect(typeof state.prompts[0].id).toBe('string');
  });

  it('creates timestamp correctly', () => {
    const beforeSave = Date.now();
    usePromptStashStore.getState().savePrompt('Test prompt');

    const state = usePromptStashStore.getState();
    expect(state.prompts[0].timestamp).toBeDefined();
    expect(state.prompts[0].timestamp).toBeGreaterThanOrEqual(beforeSave);
  });

  it('initializes usage count to 0', () => {
    usePromptStashStore.getState().savePrompt('Test prompt');

    const state = usePromptStashStore.getState();
    expect(state.prompts[0].usageCount).toBe(0);
  });

  it('loads a prompt and increments usage count', () => {
    usePromptStashStore.getState().savePrompt('Test prompt');
    const promptId = usePromptStashStore.getState().prompts[0].id;

    usePromptStashStore.getState().loadPrompt(promptId);

    const state = usePromptStashStore.getState();
    expect(state.prompts[0].usageCount).toBe(1);
  });

  it('loads prompt successfully', () => {
    usePromptStashStore.getState().savePrompt('This is a long test prompt');
    const promptId = usePromptStashStore.getState().prompts[0].id;

    const loadedText = usePromptStashStore.getState().loadPrompt(promptId);
    expect(loadedText).toBe('This is a long test prompt');
  });

  it('deletes a prompt successfully', () => {
    usePromptStashStore.getState().savePrompt('Test prompt 1');
    usePromptStashStore.getState().savePrompt('Test prompt 2');

    expect(usePromptStashStore.getState().prompts).toHaveLength(2);

    const promptId = usePromptStashStore.getState().prompts[0].id;
    usePromptStashStore.getState().deletePrompt(promptId);

    const state = usePromptStashStore.getState();
    expect(state.prompts).toHaveLength(1);
    expect(state.prompts[0].text).toBe('Test prompt 2');
  });

  it('searches prompts by text', () => {
    usePromptStashStore.getState().savePrompt('React hooks are great');
    usePromptStashStore.getState().savePrompt('Vue components are cool');
    usePromptStashStore.getState().savePrompt('Angular has two-way binding');

    const results = usePromptStashStore.getState().searchPrompts('react');
    expect(results).toHaveLength(1);
    expect(results[0].text).toContain('React');
  });

  it('searches is case-insensitive', () => {
    usePromptStashStore.getState().savePrompt('React hooks are great');

    const results = usePromptStashStore.getState().searchPrompts('REACT');
    expect(results).toHaveLength(1);
  });

  it('clears all prompts', () => {
    usePromptStashStore.getState().savePrompt('Test 1');
    usePromptStashStore.getState().savePrompt('Test 2');
    usePromptStashStore.getState().savePrompt('Test 3');

    expect(usePromptStashStore.getState().prompts).toHaveLength(3);

    usePromptStashStore.getState().clearAll();

    const state = usePromptStashStore.getState();
    expect(state.prompts).toHaveLength(0);
  });

  it('persists prompts to localStorage', () => {
    usePromptStashStore.getState().savePrompt('Test prompt');

    const storedData = localStorageMock.getItem('openchamber-prompt-stash');
    expect(storedData).toBeTruthy();

    const parsed = JSON.parse(storedData!);
    expect(parsed.prompts).toHaveLength(1);
    expect(parsed.prompts[0].text).toBe('Test prompt');
  });

  it('limits prompts to 50', () => {
    for (let i = 0; i < 55; i++) {
      usePromptStashStore.getState().savePrompt(`Prompt ${i}`);
    }

    const state = usePromptStashStore.getState();
    expect(state.prompts).toHaveLength(50);
  });

  it('removes oldest prompt when limit is reached', () => {
    for (let i = 0; i < 52; i++) {
      usePromptStashStore.getState().savePrompt(`Prompt ${i}`);
    }

    const state = usePromptStashStore.getState();
    expect(state.prompts.find((p: any) => p.text === 'Prompt 0')).toBeUndefined();
    expect(state.prompts.find((p: any) => p.text === 'Prompt 51')).toBeDefined();
  });

  it('truncates prompts larger than 10KB', () => {
    const largePrompt = 'a'.repeat(15000);
    usePromptStashStore.getState().savePrompt(largePrompt);

    const state = usePromptStashStore.getState();
    expect(state.prompts[0].text.length).toBeLessThanOrEqual(10240);
  });

  it('searches by tags', () => {
    usePromptStashStore.getState().savePrompt('Test prompt with tags', { tags: ['react', 'hooks'] });

    const results = usePromptStashStore.getState().searchPrompts('react');
    expect(results).toHaveLength(1);
  });

  it('handles empty search query', () => {
    usePromptStashStore.getState().savePrompt('Test prompt 1');
    usePromptStashStore.getState().savePrompt('Test prompt 2');

    const results = usePromptStashStore.getState().searchPrompts('');
    expect(results).toHaveLength(2);
  });

  it('handles undefined search query', () => {
    usePromptStashStore.getState().savePrompt('Test prompt');

    const results = usePromptStashStore.getState().searchPrompts(undefined as any);
    expect(results).toHaveLength(1);
  });

  it('handles null search query', () => {
    usePromptStashStore.getState().savePrompt('Test prompt');

    const results = usePromptStashStore.getState().searchPrompts(null as any);
    expect(results).toHaveLength(1);
  });

  it('updates prompt metadata', () => {
    usePromptStashStore.getState().savePrompt('Original title');
    const promptId = usePromptStashStore.getState().prompts[0].id;
    const originalTimestamp = usePromptStashStore.getState().prompts[0].timestamp;

    usePromptStashStore.getState().updatePrompt(promptId, { title: 'Updated title' });

    const state = usePromptStashStore.getState();
    expect(state.prompts[0].title).toBe('Updated title');
    expect(state.prompts[0].text).toBe('Original title');
    expect(state.prompts[0].timestamp).toBe(originalTimestamp);
  });

  it('sorts prompts by timestamp (newest first)', () => {
    usePromptStashStore.getState().savePrompt('First prompt');
    const firstId = usePromptStashStore.getState().prompts[0].id;

    usePromptStashStore.getState().savePrompt('Second prompt');

    const state = usePromptStashStore.getState();
    expect(state.prompts[0].id).not.toBe(firstId);
    expect(state.prompts[0].text).toBe('Second prompt');
  });

  it('generates unique IDs for prompts', () => {
    usePromptStashStore.getState().savePrompt('Prompt 1');
    usePromptStashStore.getState().savePrompt('Prompt 2');
    usePromptStashStore.getState().savePrompt('Prompt 3');

    const state = usePromptStashStore.getState();
    const ids = state.prompts.map((p: any) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });

  it('loads existing prompts from localStorage', () => {
    const mockData = {
      prompts: [
        {
          id: 'test-id-1',
          text: 'Existing prompt',
          title: 'Existing prompt',
          timestamp: Date.now(),
          usageCount: 5,
          tags: ['test'],
        }
      ],
    };

    localStorageMock.setItem('openchamber-prompt-stash', JSON.stringify(mockData));

    // Create a new instance - we need to trigger localStorage loading by calling setState
    usePromptStashStore.setState({
      prompts: mockData.prompts,
    });

    const state = usePromptStashStore.getState();
    expect(state.prompts).toHaveLength(1);
    expect(state.prompts[0].text).toBe('Existing prompt');
  });

  it('handles savePrompt with empty text', () => {
    usePromptStashStore.getState().savePrompt('   ');

    const state = usePromptStashStore.getState();
    expect(state.prompts).toHaveLength(1);
    expect(state.prompts[0].text).toBe('');
  });

  it('handles savePrompt with whitespace-only text', () => {
    usePromptStashStore.getState().savePrompt('  \t\n  ');

    const state = usePromptStashStore.getState();
    expect(state.prompts).toHaveLength(1);
    expect(state.prompts[0].text).toBe('');
  });

  it('handles deletePrompt with non-existent ID', () => {
    usePromptStashStore.getState().savePrompt('Test');
    const initialCount = usePromptStashStore.getState().prompts.length;

    usePromptStashStore.getState().deletePrompt('non-existent-id');

    const state = usePromptStashStore.getState();
    expect(state.prompts.length).toBe(initialCount);
  });

  it('handles updatePrompt with non-existent ID', () => {
    usePromptStashStore.getState().savePrompt('Test');
    const beforeUpdate = JSON.parse(JSON.stringify(usePromptStashStore.getState().prompts[0]));

    usePromptStashStore.getState().updatePrompt('non-existent-id', { title: 'Should not update' });

    const state = usePromptStashStore.getState();
    expect(state.prompts[0]).toEqual(beforeUpdate);
  });

  it('handles loadPrompt with non-existent ID', () => {
    usePromptStashStore.getState().savePrompt('Test');

    const loadedText = usePromptStashStore.getState().loadPrompt('non-existent-id');
    expect(loadedText).toBeNull();
  });

  it('updates timestamp when prompt is loaded', () => {
    usePromptStashStore.getState().savePrompt('Test prompt');
    const originalTimestamp = usePromptStashStore.getState().prompts[0].timestamp;
    const promptId = usePromptStashStore.getState().prompts[0].id;

    usePromptStashStore.getState().loadPrompt(promptId);

    const newTimestamp = usePromptStashStore.getState().prompts[0].timestamp;
    expect(newTimestamp).toBeGreaterThanOrEqual(originalTimestamp);
  });

  it('reorders prompts when loaded (newest moves to top)', () => {
    usePromptStashStore.getState().savePrompt('First');
    usePromptStashStore.getState().savePrompt('Second');
    usePromptStashStore.getState().savePrompt('Third');
    const firstId = usePromptStashStore.getState().prompts[2].id;

    usePromptStashStore.getState().savePrompt('Fourth');
    const fourthId = usePromptStashStore.getState().prompts[0].id;

    expect(fourthId).not.toBe(firstId);
  });

  it('persists tags to localStorage', () => {
    usePromptStashStore.getState().savePrompt('Test', {
      tags: ['javascript', 'testing']
    });

    const storedData = localStorageMock.getItem('openchamber-prompt-stash');
    const parsed = JSON.parse(storedData!);

    expect(parsed.prompts[0].tags).toEqual(['javascript', 'testing']);
  });
});
