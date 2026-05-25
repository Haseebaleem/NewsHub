import { Fragment, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { format, isThisWeek, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';
import { useHistory } from '@/hooks/queries';
import { clearHistory } from '@/api/history';
import { describeError } from '@/api/client';
import { CATEGORY_BY_SLUG } from '@/lib/constants';
import { relativeTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import type { ReadingHistoryEntry } from '@/types/api';

type GroupLabel = 'Today' | 'Yesterday' | 'Earlier this week' | 'Earlier';
const GROUP_ORDER: GroupLabel[] = ['Today', 'Yesterday', 'Earlier this week', 'Earlier'];

function groupOf(iso: string): GroupLabel {
  const date = new Date(iso);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date, { weekStartsOn: 1 })) return 'Earlier this week';
  return 'Earlier';
}

export function HistoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: entries = [], isLoading } = useHistory();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const clearMutation = useMutation({
    mutationFn: clearHistory,
    onSuccess: () => {
      toast.success('Reading history cleared.');
      void queryClient.invalidateQueries({ queryKey: ['history'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
      setConfirmOpen(false);
    },
    onError: (error) => toast.error(describeError(error, 'Could not clear history.')),
  });

  const grouped = useMemo<Map<GroupLabel, ReadingHistoryEntry[]>>(() => {
    const map = new Map<GroupLabel, ReadingHistoryEntry[]>();
    for (const entry of entries) {
      const key = groupOf(entry.read_at);
      const bucket = map.get(key) ?? [];
      bucket.push(entry);
      map.set(key, bucket);
    }
    return map;
  }, [entries]);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Reading History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {entries.length === 0
              ? 'Articles you open will appear here.'
              : `Last ${entries.length} article${entries.length === 1 ? '' : 's'} you opened.`}
          </p>
        </div>

        {entries.length > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear history
          </Button>
        ) : null}
      </header>

      {isLoading ? (
        <TimelineSkeleton />
      ) : entries.length === 0 ? (
        <EmptyState
          Icon={Clock}
          title="Your reading history is empty"
          description="Click 'Read' on any article and it will appear here."
          action={{ label: 'Browse the feed', onClick: () => navigate('/feed') }}
        />
      ) : (
        <ol className="relative space-y-8 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
          {GROUP_ORDER.map((label) => {
            const items = grouped.get(label);
            if (items === undefined || items.length === 0) return null;
            return (
              <Fragment key={label}>
                <li className="relative pl-8">
                  <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-brand bg-background" aria-hidden />
                  <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {label}
                  </h2>
                </li>
                {items.map((entry) => (
                  <TimelineRow key={entry.id} entry={entry} />
                ))}
              </Fragment>
            );
          })}
        </ol>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Clear reading history?"
        description="This permanently removes every entry from your reading history. Your bookmarks aren't affected."
        confirmLabel={clearMutation.isPending ? 'Clearing…' : 'Clear history'}
        destructive
        isPending={clearMutation.isPending}
        onConfirm={() => clearMutation.mutate()}
      />
    </div>
  );
}

function TimelineRow({ entry }: { entry: ReadingHistoryEntry }) {
  const meta = CATEGORY_BY_SLUG[entry.category];
  return (
    <li className="group relative pl-8">
      <span className="absolute left-0 top-3 h-2 w-2 -translate-x-[3px] rounded-full bg-border transition-colors group-hover:bg-foreground/60" aria-hidden />
      <a
        href={entry.article_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start justify-between gap-4 rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-card"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className={`inline-flex items-center gap-1 ${meta.tone}`}>
              <meta.Icon className="h-3 w-3" aria-hidden />
              <span className="font-mono text-[10px] uppercase tracking-wider">{meta.label}</span>
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="truncate">{entry.source}</span>
            <span className="text-muted-foreground/60">·</span>
            <time
              className="font-mono text-[11px] text-muted-foreground/70"
              dateTime={entry.read_at}
              title={format(new Date(entry.read_at), 'PPP p')}
            >
              {relativeTime(entry.read_at)}
            </time>
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground transition-colors group-hover:underline">
            {entry.title}
          </p>
        </div>
        <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
      </a>
    </li>
  );
}

function TimelineSkeleton() {
  return (
    <ol className="relative space-y-4 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
      {Array.from({ length: 5 }, (_, i) => (
        <li key={i} className="relative pl-8">
          <span className="absolute left-0 top-3 h-2 w-2 -translate-x-[3px] rounded-full bg-border" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-1/3 rounded-md shimmer" />
            <div className="h-4 w-5/6 rounded-md shimmer" />
          </div>
        </li>
      ))}
      <li className="relative pl-8 pt-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      </li>
    </ol>
  );
}
