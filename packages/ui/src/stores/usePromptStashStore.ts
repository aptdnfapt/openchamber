import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Generate a simple UUID-like ID using crypto.randomUUID or fallback
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export interface StashedPrompt {
  id: string;
  text: string;
  title: string; // First 40 chars of text
  timestamp: number;
  usageCount: number;
  tags?: string[];
}

interface PromptStashState {
  prompts: StashedPrompt[];
}

interface PromptStashActions {
  savePrompt: (text: string, metadata?: Partial<StashedPrompt>) => void;
  loadPrompt: (id: string) => string | null;
  deletePrompt: (id: string) => void;
  searchPrompts: (query: string) => StashedPrompt[];
  updatePrompt: (id: string, updates: Partial<StashedPrompt>) => void;
  clearAll: () => void;
}

const MAX_PROMPTS = 50;
const MAX_TEXT_LENGTH = 10000; // ~10KB
const STORAGE_KEY = 'openchamber-prompt-stash';

export const usePromptStashStore = create<PromptStashState & PromptStashActions>()(
  persist(
    (set, get) => ({
      prompts: [],

      savePrompt: (text: string, metadata?: Partial<StashedPrompt>) => {
        const trimmedText = text.trim();
        if (!trimmedText) return;

        // Truncate if too long
        const safeText = trimmedText.length > MAX_TEXT_LENGTH
          ? trimmedText.slice(0, MAX_TEXT_LENGTH)
          : trimmedText;

        // Generate title from first line or first 40 chars
        const firstLine = safeText.split('\n')[0].trim();
        const title = firstLine.slice(0, 40) + (firstLine.length > 40 ? '\u2026' : '');

        const newPrompt: StashedPrompt = {
          id: generateId(),
          text: safeText,
          title,
          timestamp: Date.now(),
          usageCount: 0,
          ...metadata,
        };

        // Add to beginning and enforce limit
        set((state) => ({
          prompts: [newPrompt, ...state.prompts.slice(0, MAX_PROMPTS - 1)],
        }));
      },

      loadPrompt: (id: string) => {
        const prompt = get().prompts.find((p) => p.id === id);
        if (!prompt) return null;

        // Increment usage count and move to top
        set((state) => ({
          prompts: state.prompts
            .map((p) =>
              p.id === id
                ? { ...p, usageCount: p.usageCount + 1, timestamp: Date.now() }
                : p
            )
            .sort((a, b) => b.timestamp - a.timestamp),
        }));

        return prompt.text;
      },

      deletePrompt: (id: string) => {
        set((state) => ({
          prompts: state.prompts.filter((p) => p.id !== id),
        }));
      },

      searchPrompts: (query: string) => {
        if (!query) return get().prompts;
        const lowerQuery = query.toLowerCase().trim();
        if (!lowerQuery) return get().prompts;

        return get().prompts.filter((p) =>
          p.text.toLowerCase().includes(lowerQuery) ||
          p.title.toLowerCase().includes(lowerQuery) ||
          p.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
        );
      },

      updatePrompt: (id: string, updates: Partial<StashedPrompt>) => {
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      clearAll: () => {
        set({ prompts: [] });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ prompts: state.prompts }),
    }
  )
);
