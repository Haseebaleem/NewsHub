import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_ITEMS = 8;

interface RecentSearchesState {
  items: string[];
  add: (query: string) => void;
  remove: (query: string) => void;
  clear: () => void;
}

export const useRecentSearchesStore = create<RecentSearchesState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (query) => {
        const trimmed = query.trim();
        if (trimmed === '') return;
        const next = [trimmed, ...get().items.filter((q) => q !== trimmed)].slice(0, MAX_ITEMS);
        set({ items: next });
      },
      remove: (query) => set({ items: get().items.filter((q) => q !== query) }),
      clear: () => set({ items: [] }),
    }),
    { name: 'newshub.recentSearches' },
  ),
);
