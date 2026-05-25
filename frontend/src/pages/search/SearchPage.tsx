import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search as SearchIcon, X, Clock } from 'lucide-react';
import { searchNews } from '@/api/news';
import { NewsGrid } from '@/components/news/NewsGrid';
import { NewsGridSkeleton } from '@/components/news/NewsCardSkeleton';
import { InfiniteSentinel } from '@/components/shared/InfiniteSentinel';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRecentSearchesStore } from '@/stores/recentSearches.store';
import type { NewsResponse } from '@/types/api';

const PAGE_SIZE = 20;
const MAX_PAGES = 10;

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get('q') ?? '';
  const [input, setInput] = useState(initial);
  const [submitted, setSubmitted] = useState(initial);

  const recent = useRecentSearchesStore((s) => s.items);
  const addRecent = useRecentSearchesStore((s) => s.add);
  const removeRecent = useRecentSearchesStore((s) => s.remove);
  const clearRecent = useRecentSearchesStore((s) => s.clear);

  // Keep input in sync with URL — supports topbar Cmd+K navigating here
  // with a fresh ?q= while the search page is already mounted.
  useEffect(() => {
    const q = params.get('q') ?? '';
    setInput(q);
    setSubmitted(q);
  }, [params]);

  const query = useInfiniteQuery<
    NewsResponse,
    Error,
    { pages: NewsResponse[] },
    readonly [string, string, string]
  >({
    queryKey: ['news', 'search', submitted] as const,
    queryFn: async ({ pageParam = 1 }) => searchNews({ q: submitted, page: pageParam as number }),
    initialPageParam: 1,
    enabled: submitted.length >= 2,
    getNextPageParam: (lastPage, allPages) => {
      if (allPages.length >= MAX_PAGES) return undefined;
      if (lastPage.articles.length < PAGE_SIZE) return undefined;
      return allPages.length + 1;
    },
  });

  const articles = useMemo(
    () => query.data?.pages.flatMap((p) => p.articles) ?? [],
    [query.data],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const next = input.trim();
    if (next === '') return;
    setParams({ q: next });
    addRecent(next);
  };

  const runRecent = useCallback(
    (q: string) => {
      setParams({ q });
      addRecent(q);
    },
    [addRecent, setParams],
  );

  const clear = (): void => {
    setInput('');
    setParams({});
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search across NewsAPI's full index. Free-tier results trail live news by ~24h.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative flex items-center">
          <SearchIcon className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Articles about AI, climate, markets, your favorite team…"
            autoFocus
            className="h-11 pl-9 pr-10 text-sm"
            aria-label="Search query"
          />
          {input !== '' ? (
            <button
              type="button"
              onClick={clear}
              className="absolute right-2 grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </form>

      {submitted === '' ? (
        <RecentSearchesPanel
          recent={recent}
          onRun={runRecent}
          onRemove={removeRecent}
          onClear={clearRecent}
        />
      ) : query.isLoading ? (
        <NewsGridSkeleton />
      ) : query.isError ? (
        <EmptyState
          Icon={SearchIcon}
          title="Search failed"
          description="The news provider rejected the request. Try a different query or come back in a minute."
        />
      ) : articles.length === 0 ? (
        <EmptyState
          Icon={SearchIcon}
          title={`No results for "${submitted}"`}
          description="Try broader terms — single keywords usually beat long phrases on NewsAPI."
          action={{ label: 'Clear search', onClick: clear }}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            Showing {articles.length}
            {query.hasNextPage === true ? '+' : ''} results for{' '}
            <span className="font-mono text-foreground">"{submitted}"</span>
          </p>
          <NewsGrid articles={articles} fallbackCategory="general" />
          <InfiniteSentinel
            hasMore={query.hasNextPage === true}
            isLoading={query.isFetchingNextPage}
            onLoadMore={() => {
              if (!query.isFetchingNextPage && query.hasNextPage === true) {
                void query.fetchNextPage();
              }
            }}
          />
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */

interface RecentSearchesPanelProps {
  recent: string[];
  onRun: (q: string) => void;
  onRemove: (q: string) => void;
  onClear: () => void;
}

function RecentSearchesPanel({ recent, onRun, onRemove, onClear }: RecentSearchesPanelProps) {
  if (recent.length === 0) {
    return (
      <EmptyState
        Icon={SearchIcon}
        title="Search the news index"
        description="Type a topic, source, or keyword to find articles."
      />
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />
          Recent searches
        </div>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear all
        </Button>
      </div>
      <ul className="space-y-1">
        {recent.map((q) => (
          <li key={q} className="group flex items-center gap-1">
            <button
              type="button"
              onClick={() => onRun(q)}
              className="flex-1 rounded-md px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
            >
              {q}
            </button>
            <button
              type="button"
              onClick={() => onRemove(q)}
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100"
              aria-label={`Remove "${q}" from recent searches`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
