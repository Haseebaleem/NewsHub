import { useInfiniteQuery } from '@tanstack/react-query';
import { topHeadlines } from '@/api/news';
import type { Category, NewsArticle, NewsResponse } from '@/types/api';

interface UseInfiniteCategoryNewsArgs {
  country: string;
  category: Category;
}

const PAGE_SIZE = 20;
/** Backend pageSize is 20, page <= 10. We page just up to that ceiling. */
const MAX_PAGES = 10;

export function useInfiniteCategoryNews({ country, category }: UseInfiniteCategoryNewsArgs) {
  return useInfiniteQuery<
    NewsResponse,
    Error,
    { pages: NewsResponse[]; articles: NewsArticle[] },
    readonly [string, string, Category]
  >({
    queryKey: ['news', country, category] as const,
    queryFn: async ({ pageParam = 1 }) =>
      topHeadlines({ country, category, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.length * PAGE_SIZE;
      if (allPages.length >= MAX_PAGES) return undefined;
      if (lastPage.articles.length < PAGE_SIZE) return undefined;
      if (fetched >= (lastPage.total_results ?? Number.POSITIVE_INFINITY)) return undefined;
      return allPages.length + 1;
    },
    select: (data) => ({
      pages: data.pages,
      articles: data.pages.flatMap((p) => p.articles),
    }),
  });
}
