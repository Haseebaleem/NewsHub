import { useMe } from '@/hooks/queries';
import { greeting } from '@/lib/format';

export function FeedPage() {
  const { data: user } = useMe();
  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          {greeting(user?.name)}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Based on your preferences. Articles land here once the feed wiring lands in a later commit.
        </p>
      </header>
      <Placeholder label="Home Feed" />
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-border bg-card/50 py-24 text-center">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          page placeholder
        </p>
        <p className="mt-2 text-lg font-medium">{label}</p>
      </div>
    </div>
  );
}

export { Placeholder };
