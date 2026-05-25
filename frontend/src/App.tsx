import { Newspaper } from 'lucide-react';

function App() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="flex max-w-xl flex-col items-center gap-6 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-xl border border-border bg-card">
          <Newspaper className="h-7 w-7 text-brand" aria-hidden />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">NewsHub</h1>
          <p className="text-sm text-muted-foreground">
            Tailwind + shadcn theme tokens wired up. App shell, routing, and pages
            land in the next commits.
          </p>
        </div>

        <code className="rounded-md border border-border bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground">
          <span className="text-brand">●</span> dark theme · amber accent · Geist
          ready
        </code>
      </div>
    </main>
  );
}

export default App;
