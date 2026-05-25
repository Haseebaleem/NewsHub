import { useCallback } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useInfiniteCategoryNews } from '@/hooks/useInfiniteCategoryNews';
import { usePreferences } from '@/hooks/queries';
import { NewsGrid } from '@/components/news/NewsGrid';
import { NewsGridSkeleton } from '@/components/news/NewsCardSkeleton';
import { InfiniteSentinel } from '@/components/shared/InfiniteSentinel';
import { EmptyState } from '@/components/shared/EmptyState';
import { CATEGORY_BY_SLUG, CATEGORIES } from '@/lib/constants';
import type { Category } from '@/types/api';

export function CategoryPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: prefs } = usePreferences();

  const isValid = CATEGORIES.some((c) => c.slug === slug);
  if (!isValid) {
    return <Navigate to="/feed" replace />;
  }

  const category = slug as Category;
  const meta = CATEGORY_BY_SLUG[category];
  const country = prefs?.default_country ?? 'in';

  return <CategoryFeed category={category} country={country} onSearch={() => navigate('/search')} meta={meta} />;
}

interface CategoryFeedProps {
  category: Category;
  country: string;
  onSearch: () => void;
  meta: (typeof CATEGORY_BY_SLUG)[Category];
}

function CategoryFeed({ category, country, onSearch, meta }: CategoryFeedProps) {
  const query = useInfiniteCategoryNews({ country, category });
  const articles = query.data?.articles ?? [];

  const handleLoadMore = useCallback((): void => {
    if (!query.isFetchingNextPage && query.hasNextPage === true) {
      void query.fetchNextPage();
    }
  }, [query]);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1">
            <meta.Icon className={`h-4 w-4 ${meta.tone}`} aria-hidden />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Category
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{meta.label}</h1>
          {!query.isLoading ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Top headlines · {country.toUpperCase()}
              {articles.length > 0 ? (
                <span className="ml-2 font-mono text-xs text-muted-foreground/70">
                  {articles.length}{query.hasNextPage === true ? '+' : ''} articles
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      </header>

      {query.isLoading ? (
        <NewsGridSkeleton />
      ) : articles.length === 0 ? (
        <EmptyState
          Icon={meta.Icon}
          title={`No ${meta.label} headlines for ${country.toUpperCase()}`}
          description={`NewsAPI returned an empty list for this country/category combo. Coverage is patchy on the free tier — try a different category or use search.`}
          action={{ label: 'Open search', onClick: onSearch }}
        />
      ) : (
        <>
          <NewsGrid articles={articles} fallbackCategory={category} />
          <InfiniteSentinel
            hasMore={query.hasNextPage === true}
            isLoading={query.isFetchingNextPage}
            onLoadMore={handleLoadMore}
          />
        </>
      )}
    </div>
  );
}
