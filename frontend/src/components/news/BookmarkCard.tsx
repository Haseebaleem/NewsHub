import { type MouseEvent } from 'react';
import { ExternalLink, Newspaper, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { CategoryBadge } from '@/components/news/CategoryBadge';
import { deleteBookmark } from '@/api/bookmarks';
import { describeError } from '@/api/client';
import { useRecordHistory } from '@/hooks/useRecordHistory';
import { relativeTime } from '@/lib/format';
import type { Bookmark } from '@/types/api';

interface BookmarkCardProps {
  bookmark: Bookmark;
}

export function BookmarkCard({ bookmark }: BookmarkCardProps) {
  const queryClient = useQueryClient();
  const record = useRecordHistory();

  const remove = useMutation({
    mutationFn: () => deleteBookmark(bookmark.id),
    onSuccess: () => {
      toast.success('Bookmark removed.');
      void queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (error) => {
      toast.error(describeError(error, 'Could not remove bookmark.'));
    },
  });

  const handleRead = (): void => {
    record.mutate({
      title: bookmark.title,
      article_url: bookmark.article_url,
      source: bookmark.source,
      category: bookmark.category,
    });
  };

  const handleRemove = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    remove.mutate();
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:shadow-lg hover:shadow-black/30">
      <a
        href={bookmark.article_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleRead}
        className="relative block aspect-[16/9] overflow-hidden bg-muted"
      >
        {bookmark.image_url !== null && bookmark.image_url !== '' ? (
          <img
            src={bookmark.image_url}
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
          <CategoryBadge category={bookmark.category} />
          <span className="inline-flex max-w-[55%] items-center rounded-md border border-white/15 bg-black/55 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/90 backdrop-blur-sm">
            <span className="truncate">{bookmark.source}</span>
          </span>
        </div>
      </a>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <a
            href={bookmark.article_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleRead}
            className="line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors hover:text-foreground hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {bookmark.title}
          </a>
          <button
            type="button"
            onClick={handleRemove}
            disabled={remove.isPending}
            aria-label="Remove bookmark"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-all duration-200 hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {bookmark.description !== null && bookmark.description !== '' ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {bookmark.description}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div className="flex min-w-0 flex-col text-xs text-muted-foreground">
            {bookmark.author !== null && bookmark.author !== '' ? (
              <span className="truncate">{bookmark.author}</span>
            ) : null}
            <time className="font-mono text-[11px] text-muted-foreground/70">
              Saved {relativeTime(bookmark.created_at)}
            </time>
          </div>

          <Button asChild variant="ghost" size="sm" className="shrink-0 text-muted-foreground hover:text-foreground">
            <a
              href={bookmark.article_url}
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
