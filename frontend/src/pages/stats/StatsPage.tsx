import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  Bookmark,
  CalendarDays,
  Flame,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useHistory, useStats } from '@/hooks/queries';
import { CATEGORIES, CATEGORY_BY_SLUG } from '@/lib/constants';
import type { Category, ReadingHistoryEntry, Stats } from '@/types/api';

export function StatsPage() {
  const stats = useStats();
  const history = useHistory();

  const dailyActivity = useMemo(() => buildDailyActivity(history.data ?? []), [history.data]);
  const categoryBreakdown = useMemo(() => buildCategoryBreakdown(history.data ?? []), [history.data]);
  const streak = useMemo(() => calculateStreak(history.data ?? []), [history.data]);

  const isLoading = stats.isLoading || history.isLoading;
  const hasHistory = (history.data ?? []).length > 0;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your reading activity and saved-article count.
          </p>
        </div>
        {streak >= 2 ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-medium text-foreground">
            <Flame className="h-3.5 w-3.5 text-brand" />
            {streak}-day reading streak
          </div>
        ) : null}
      </header>

      <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          Icon={CalendarDays}
          label="Read this week"
          value={stats.data?.articles_read_this_week ?? 0}
          loading={isLoading}
        />
        <StatCard
          Icon={TrendingUp}
          label="Read this month"
          value={stats.data?.articles_read_this_month ?? 0}
          loading={isLoading}
        />
        <TopCategoryCard stats={stats.data} loading={isLoading} />
        <StatCard
          Icon={Bookmark}
          label="Total bookmarks"
          value={stats.data?.bookmark_count ?? 0}
          loading={isLoading}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Reading activity"
          caption="Last 30 days — drawn from your most recent reading history."
        >
          {!hasHistory ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailyActivity} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  width={32}
                />
                <Tooltip content={<DarkTooltip />} cursor={{ stroke: 'hsl(var(--brand))', strokeOpacity: 0.2 }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--brand))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(var(--brand))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="By category" caption={`Based on your last ${(history.data ?? []).length || 0} reads.`}>
          {!hasHistory ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryBreakdown} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="label"
                  type="category"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  width={88}
                />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'hsl(var(--accent))' }} />
                <Bar dataKey="count" fill="hsl(var(--brand))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>
    </div>
  );
}

/* ----------------------------- pieces ------------------------------ */

interface StatCardProps {
  Icon: LucideIcon;
  label: string;
  value: number;
  loading: boolean;
}

function StatCard({ Icon, label, value, loading }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      {loading ? (
        <div className="h-8 w-16 rounded-md shimmer" />
      ) : (
        <p className="text-3xl font-semibold tracking-tight text-foreground">
          {value.toLocaleString()}
        </p>
      )}
    </div>
  );
}

interface TopCategoryCardProps {
  stats: Stats | undefined;
  loading: boolean;
}

function TopCategoryCard({ stats, loading }: TopCategoryCardProps) {
  const top = stats?.top_category ?? null;
  const meta = top !== null ? CATEGORY_BY_SLUG[top] : null;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Top category
        </span>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </div>
      {loading ? (
        <div className="h-8 w-20 rounded-md shimmer" />
      ) : meta === null ? (
        <p className="text-sm text-muted-foreground">No reads yet</p>
      ) : (
        <div className="flex items-center gap-2">
          <meta.Icon className={`h-5 w-5 ${meta.tone}`} />
          <span className="text-xl font-semibold tracking-tight text-foreground">
            {meta.label}
          </span>
        </div>
      )}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  caption: string;
  children: React.ReactNode;
  className?: string;
}

function ChartCard({ title, caption, children, className }: ChartCardProps) {
  return (
    <div className={`rounded-lg border border-border bg-card p-5 ${className ?? ''}`}>
      <div className="mb-4">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>
      </div>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="grid h-[240px] place-items-center text-xs text-muted-foreground">
      Read a few articles to see your trend.
    </div>
  );
}

interface TooltipPayload {
  payload?: { label?: string; count?: number };
}

interface DarkTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

function DarkTooltip({ active, payload }: DarkTooltipProps) {
  if (active !== true || payload === undefined || payload.length === 0) return null;
  const data = payload[0]?.payload;
  if (data === undefined) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-lg shadow-black/40">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {data.label}
      </div>
      <div className="mt-0.5 font-semibold text-foreground">{data.count ?? 0} reads</div>
    </div>
  );
}

/* ---------------------------- deriving ------------------------------ */

interface DailyPoint {
  label: string;
  count: number;
}

function buildDailyActivity(history: ReadingHistoryEntry[]): DailyPoint[] {
  const days: DailyPoint[] = [];
  const counts = new Map<string, number>();

  for (const entry of history) {
    const key = format(new Date(entry.read_at), 'yyyy-MM-dd');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  for (let i = 29; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const key = format(date, 'yyyy-MM-dd');
    days.push({ label: format(date, 'MMM d'), count: counts.get(key) ?? 0 });
  }
  return days;
}

interface CategoryPoint {
  label: string;
  count: number;
  category: Category;
}

function buildCategoryBreakdown(history: ReadingHistoryEntry[]): CategoryPoint[] {
  const counts = new Map<Category, number>();
  for (const entry of history) {
    counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
  }
  return CATEGORIES.map((meta) => ({
    label: meta.label,
    count: counts.get(meta.slug) ?? 0,
    category: meta.slug,
  }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
}

function calculateStreak(history: ReadingHistoryEntry[]): number {
  if (history.length === 0) return 0;
  const days = new Set(history.map((e) => format(new Date(e.read_at), 'yyyy-MM-dd')));
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const key = format(subDays(new Date(), i), 'yyyy-MM-dd');
    if (days.has(key)) streak += 1;
    else if (i === 0) continue;
    else break;
  }
  return streak;
}
