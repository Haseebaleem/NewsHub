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
 * Caller-supplied snapshot of "what we're about to do". Making the
 * action explicit avoids a subtle bug where the mutationFn would
 * re-read the cache AFTER onMutate had already injected an optimistic
 * placeholder, then mistake the placeholder for an existing bookmark
 * and try to DELETE a negative ID.
 */
export type ToggleBookmarkVars =
  | { action: 'add'; url: string; payload: CreateBookmarkPayload }
  | { action: 'remove'; url: string; id: number };

/**
 * Toggle a bookmark by URL. The decision (add vs remove) is computed
 * by the caller from the bookmark index and passed in via `action`,
 * so the network branch never has to disambiguate against an
 * optimistically-updated cache.
 */
export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation<
    { added: boolean },
    Error,
    ToggleBookmarkVars,
    { previous: BookmarkIndexEntry[] | undefined }
  >({
    mutationFn: async (vars) => {
      if (vars.action === 'remove') {
        await deleteBookmark(vars.id);
        return { added: false };
      }
      await createBookmark(vars.payload);
      return { added: true };
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: indexKey });
      const previous = queryClient.getQueryData<BookmarkIndexEntry[]>(indexKey);

      if (vars.action === 'remove') {
        queryClient.setQueryData<BookmarkIndexEntry[]>(
          indexKey,
          (prev) => prev?.filter((b) => b.url !== vars.url) ?? [],
        );
      } else {
        // Negative placeholder id — gets replaced by the real one when
        // the index query is refetched in onSettled.
        queryClient.setQueryData<BookmarkIndexEntry[]>(indexKey, (prev) => [
          { id: -Date.now(), url: vars.url },
          ...(prev ?? []),
        ]);
      }

      return { previous };
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

/**
 * Resolves what the toggle button on a given URL should do right now.
 * Caller passes the URL; we return `{ isBookmarked, id }` so the caller
 * can hand both to `useToggleBookmark`'s mutate() with full information.
 */
export function useBookmarkInfo(url: string): { isBookmarked: boolean; id: number | null } {
  const { data } = useBookmarkIndex();
  return useMemo(() => {
    // Ignore optimistic placeholders (negative IDs from onMutate). They
    // shouldn't drive a remove action — the server has nothing to delete.
    const found = data?.find((b) => b.url === url && b.id > 0);
    return {
      isBookmarked: found !== undefined,
      id: found?.id ?? null,
    };
  }, [data, url]);
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
