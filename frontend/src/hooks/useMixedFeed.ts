import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { topHeadlines } from '@/api/news';
import type { Category, NewsArticle, NewsResponse } from '@/types/api';

interface UseMixedFeedArgs {
  country: string;
  categories: Category[];
}

interface MixedFeedResult {
  isLoading: boolean;
  isError: boolean;
  articles: NewsArticle[];
  categoryByUrl: Map<string, Category>;
  failingCategories: Category[];
}

/**
 * Issues one top-headlines call per category in parallel, then
 * interleaves the results by publishedAt (newest first) and de-dupes
 * by URL — different categories occasionally surface the same story.
 *
 * The map of url → category lets the NewsCard show the right badge
 * even though the article doesn't carry a category natively.
 */
export function useMixedFeed({ country, categories }: UseMixedFeedArgs): MixedFeedResult {
  const queries = useQueries({
    queries: categories.map((category) => ({
      queryKey: ['news', country, category, 'page-1'] as const,
      queryFn: () => topHeadlines({ country, category, page: 1 }),
      staleTime: 5 * 60_000,
    })),
  });

  return useMemo<MixedFeedResult>(() => {
    const isLoading = queries.some((q) => q.isLoading);
    const isError = queries.some((q) => q.isError);
    const failingCategories: Category[] = queries
      .map((q, i) => (q.isError ? categories[i] : undefined))
      .filter((c): c is Category => c !== undefined);

    const categoryByUrl = new Map<string, Category>();
    const merged: NewsArticle[] = [];

    queries.forEach((query, i) => {
      const data = query.data as NewsResponse | undefined;
      const cat = categories[i];
      if (data === undefined || cat === undefined) return;
      for (const article of data.articles) {
        if (article.url === null || article.url === '') continue;
        if (categoryByUrl.has(article.url)) continue;
        categoryByUrl.set(article.url, cat);
        merged.push(article);
      }
    });

    merged.sort((a, b) => {
      const ta = a.publishedAt !== null && a.publishedAt !== '' ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt !== null && b.publishedAt !== '' ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    });

    return { isLoading, isError, articles: merged, categoryByUrl, failingCategories };
  }, [queries, categories]);
}
