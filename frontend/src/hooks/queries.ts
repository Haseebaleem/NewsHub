import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import * as bookmarksApi from '@/api/bookmarks';
import * as historyApi from '@/api/history';
import * as newsApi from '@/api/news';
import * as prefsApi from '@/api/preferences';
import * as statsApi from '@/api/stats';
import { me as fetchMe } from '@/api/auth';
import { useAuthStore } from '@/stores/auth.store';
import type {
  Bookmark,
  Paginated,
  Preferences,
  ReadingHistoryEntry,
  Stats,
  User,
} from '@/types/api';

export const queryKeys = {
  me: ['me'] as const,
  preferences: ['preferences'] as const,
  bookmarks: (page: number) => ['bookmarks', page] as const,
  history: ['history'] as const,
  stats: ['stats'] as const,
  topHeadlines: (params: newsApi.TopHeadlinesParams) =>
    ['news', 'top-headlines', params] as const,
  search: (params: newsApi.SearchParams) => ['news', 'search', params] as const,
};

export function useMe(
  options: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'> = {},
) {
  const token = useAuthStore((s) => s.token);
  return useQuery<User>({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
    enabled: token !== null && token !== '',
    ...options,
  });
}

export function usePreferences() {
  const token = useAuthStore((s) => s.token);
  return useQuery<Preferences>({
    queryKey: queryKeys.preferences,
    queryFn: prefsApi.getPreferences,
    enabled: token !== null && token !== '',
  });
}

export function useBookmarks(page: number) {
  return useQuery<Paginated<Bookmark>>({
    queryKey: queryKeys.bookmarks(page),
    queryFn: () => bookmarksApi.listBookmarks(page),
  });
}

export function useHistory() {
  return useQuery<ReadingHistoryEntry[]>({
    queryKey: queryKeys.history,
    queryFn: historyApi.listHistory,
  });
}

export function useStats() {
  return useQuery<Stats>({
    queryKey: queryKeys.stats,
    queryFn: statsApi.getStats,
  });
}
