import { type MouseEvent } from 'react';
import { Bookmark, ExternalLink, Newspaper } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { CategoryBadge } from '@/components/news/CategoryBadge';
import { cn } from '@/lib/utils';
import { relativeTime } from '@/lib/format';
import { describeError } from '@/api/client';
import {
  payloadFromArticle,
  useBookmarkInfo,
  useToggleBookmark,
} from '@/hooks/useBookmarkSync';
import { useRecordHistory } from '@/hooks/useRecordHistory';
import type { Category, NewsArticle } from '@/types/api';

interface NewsCardProps {
  article: NewsArticle;
  category: Category;
}

export function NewsCard({ article, category }: NewsCardProps) {
  const { isBookmarked, id: existingId } = useBookmarkInfo(article.url);
  const toggle = useToggleBookmark();
  const record = useRecordHistory();

  const handleToggle = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    // Snapshot the decision before mutating so the network branch
    // never has to disambiguate against an optimistically-updated cache.
    const vars =
      isBookmarked && existingId !== null
        ? ({ action: 'remove', url: article.url, id: existingId } as const)
        : ({
            action: 'add',
            url: article.url,
            payload: payloadFromArticle(article, category),
          } as const);
    toggle.mutate(vars, {
      onSuccess: ({ added }) => {
        toast.success(added ? 'Bookmarked.' : 'Bookmark removed.');
      },
      onError: (error) => {
        toast.error(describeError(error, 'Could not update bookmark.'));
      },
    });
  };

  const handleRead = (): void => {
    record.mutate({
      title: article.title,
      article_url: article.url,
      source: article.source.name,
      category,
    });
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:shadow-lg hover:shadow-black/30">
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleRead}
        className="relative block aspect-[16/9] overflow-hidden bg-muted"
      >
        {article.urlToImage !== null ? (
          <img
            src={article.urlToImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <Newspaper className="h-10 w-10 opacity-40" aria-hidden />
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <CategoryBadge category={category} />
          <span className="inline-flex max-w-[55%] items-center rounded-md border border-white/15 bg-black/55 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/90 backdrop-blur-sm">
            <span className="truncate">{article.source.name}</span>
          </span>
        </div>
      </a>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleRead}
            className="line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors hover:text-foreground hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {article.title}
          </a>
          <button
            type="button"
            onClick={handleToggle}
            disabled={toggle.isPending}
            aria-pressed={isBookmarked}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-all duration-200',
              isBookmarked
                ? 'border-brand/40 bg-brand/10 text-brand hover:bg-brand/15'
                : 'hover:border-border hover:bg-accent hover:text-foreground',
            )}
          >
            <Bookmark
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isBookmarked ? 'fill-current scale-105' : '',
              )}
            />
          </button>
        </div>

        {article.description !== null ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {article.description}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div className="flex min-w-0 flex-col text-xs text-muted-foreground">
            {article.author !== null && article.author !== '' ? (
              <span className="truncate">{article.author}</span>
            ) : null}
            <time className="font-mono text-[11px] text-muted-foreground/70">
              {relativeTime(article.publishedAt)}
            </time>
          </div>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleRead}
            >
              Read
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}
