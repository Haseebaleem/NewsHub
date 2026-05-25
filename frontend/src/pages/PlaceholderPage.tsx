interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
}

export function PlaceholderPage({ title, subtitle }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle !== undefined ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </header>
      <div className="grid place-items-center rounded-lg border border-dashed border-border bg-card/50 py-24 text-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            page placeholder
          </p>
          <p className="mt-2 text-lg font-medium">Coming in next commit</p>
        </div>
      </div>
    </div>
  );
}
