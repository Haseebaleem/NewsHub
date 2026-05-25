import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import {
  createBookmark,
  deleteBookmark,
  type CreateBookmarkPayload,
} from '@/api/bookmarks';
import { useAuthStore } from '@/stores/auth.store';
import type { Bookmark } from '@/types/api';

interface BookmarkIndexEntry {
  id: number;
  url: string;
}

/**
 * Lightweight per-user lookup: just (id, article_url) pairs so cards
 * can render the right state and the toggle mutation knows which id
 * to DELETE. Backend caps per_page at 50; for now we accept that
 * limit (heaviest users hit the dedicated /bookmarks page anyway).
 */
async function fetchBookmarkIndex(): Promise<BookmarkIndexEntry[]> {
  const { data } = await api.get<{ data: Bookmark[] }>('/bookmarks', {
    params: { per_page: 50 },
  });
  return data.data.map((b) => ({ id: b.id, url: b.article_url }));
}

const indexKey = ['bookmarks', 'index'] as const;

export function useBookmarkIndex() {
  const token = useAuthStore((s) => s.token);
  return useQuery<BookmarkIndexEntry[]>({
    queryKey: indexKey,
    queryFn: fetchBookmarkIndex,
    enabled: token !== null && token !== '',
    staleTime: 30_000,
  });
}

export function useBookmarkedUrlSet(): Set<string> {
  const { data } = useBookmarkIndex();
  return useMemo(() => new Set(data?.map((d) => d.url) ?? []), [data]);
}

/**
 * Single mutation that toggles a bookmark by URL.
 * Optimistic: updates the index cache immediately, rolls back on error.
 */
export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation<
    { added: boolean },
    Error,
    { url: string; payload: CreateBookmarkPayload },
    { previous: BookmarkIndexEntry[] | undefined; existingId: number | null }
  >({
    mutationFn: async ({ url, payload }) => {
      const cache = queryClient.getQueryData<BookmarkIndexEntry[]>(indexKey) ?? [];
      const existing = cache.find((b) => b.url === url);
      if (existing !== undefined) {
        await deleteBookmark(existing.id);
        return { added: false };
      }
      await createBookmark(payload);
      return { added: true };
    },
    onMutate: async ({ url }) => {
      await queryClient.cancelQueries({ queryKey: indexKey });
      const previous = queryClient.getQueryData<BookmarkIndexEntry[]>(indexKey);
      const existing = previous?.find((b) => b.url === url) ?? null;

      if (existing !== null) {
        queryClient.setQueryData<BookmarkIndexEntry[]>(
          indexKey,
          (prev) => prev?.filter((b) => b.url !== url) ?? [],
        );
      } else {
        queryClient.setQueryData<BookmarkIndexEntry[]>(indexKey, (prev) => [
          { id: -Date.now(), url },
          ...(prev ?? []),
        ]);
      }

      return { previous, existingId: existing?.id ?? null };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(indexKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

/** Helper: build a CreateBookmarkPayload from a NewsArticle. */
export function payloadFromArticle(
  article: {
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    source: { name: string };
    author: string | null;
    publishedAt: string;
  },
  category: CreateBookmarkPayload['category'],
): CreateBookmarkPayload {
  return {
    title: article.title,
    description: article.description,
    article_url: article.url,
    image_url: article.urlToImage,
    source: article.source.name,
    author: article.author,
    published_at: article.publishedAt,
    category,
  };
}

