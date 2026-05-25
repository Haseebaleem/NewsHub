import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Frown } from 'lucide-react';
import { useMe, usePreferences } from '@/hooks/queries';
import { useMixedFeed } from '@/hooks/useMixedFeed';
import { useInfiniteCategoryNews } from '@/hooks/useInfiniteCategoryNews';
import { NewsGrid } from '@/components/news/NewsGrid';
import { NewsGridSkeleton } from '@/components/news/NewsCardSkeleton';
import { FilterChips, type FilterChipValue } from '@/components/news/FilterChips';
import { EmptyState } from '@/components/shared/EmptyState';
import { InfiniteSentinel } from '@/components/shared/InfiniteSentinel';
import { greeting } from '@/lib/format';
import { CATEGORY_BY_SLUG } from '@/lib/constants';
import type { Category } from '@/types/api';

export function FeedPage() {
  const { data: user } = useMe();
  const { data: prefs, isLoading: prefsLoading } = usePreferences();
  const [active, setActive] = useState<FilterChipValue>('all');
  const navigate = useNavigate();

  const country = prefs?.default_country ?? 'in';
  const categories: Category[] = prefs?.default_categories ?? ['general', 'technology'];

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          {greeting(user?.name)}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Based on your preferences ·{' '}
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground/70">
            {country}
          </span>
        </p>
      </header>

      {prefsLoading ? (
        <>
          <div className="mb-6 flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-7 w-20 rounded-full shimmer" />
            ))}
          </div>
          <NewsGridSkeleton />
        </>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <FilterChips values={categories} active={active} onChange={setActive} />
          </div>

          {active === 'all' ? (
            <MixedFeed country={country} categories={categories} onBrowse={() => navigate('/search')} />
          ) : (
            <CategoryFeed country={country} category={active} />
          )}
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */

interface MixedFeedProps {
  country: string;
  categories: Category[];
  onBrowse: () => void;
}

function MixedFeed({ country, categories, onBrowse }: MixedFeedProps) {
  const { isLoading, articles, categoryByUrl, failingCategories } = useMixedFeed({
    country,
    categories,
  });

  if (isLoading) return <NewsGridSkeleton />;
  if (articles.length === 0) {
    return (
      <EmptyState
        Icon={Frown}
        title="No articles to show right now"
        description={
          failingCategories.length > 0
            ? "We couldn't reach the news provider for some of your categories. Try again in a moment."
            : "NewsAPI's free tier returns thin results for some country/category combinations. Try search or adjust your preferences."
        }
        action={{ label: 'Open search', onClick: onBrowse }}
      />
    );
  }

  // Default fallbackCategory is the first preferred category — the map
  // override usually wins, this is only used if a URL slipped past dedup.
  return (
    <NewsGrid
      articles={articles}
      fallbackCategory={categories[0] ?? 'general'}
      categoryByUrl={categoryByUrl}
    />
  );
}

/* ---------------------------------------------------------------- */

interface CategoryFeedProps {
  country: string;
  category: Category;
}

function CategoryFeed({ country, category }: CategoryFeedProps) {
  const navigate = useNavigate();
  const query = useInfiniteCategoryNews({ country, category });

  const handleLoadMore = useCallback((): void => {
    if (!query.isFetchingNextPage && query.hasNextPage === true) {
      void query.fetchNextPage();
    }
  }, [query]);

  if (query.isLoading) return <NewsGridSkeleton />;

  const articles = query.data?.articles ?? [];
  const meta = CATEGORY_BY_SLUG[category];

  if (articles.length === 0) {
    return (
      <EmptyState
        Icon={meta.Icon}
        title={`No ${meta.label} headlines right now`}
        description={`NewsAPI returned no ${meta.label.toLowerCase()} stories for ${country.toUpperCase()}. Coverage is patchy on the free tier — try the search page or another category.`}
        action={{ label: 'Open search', onClick: () => navigate('/search') }}
      />
    );
  }

  return (
    <>
      <NewsGrid articles={articles} fallbackCategory={category} />
      <InfiniteSentinel
        hasMore={query.hasNextPage === true}
        isLoading={query.isFetchingNextPage}
        onLoadMore={handleLoadMore}
      />
    </>
  );
}

