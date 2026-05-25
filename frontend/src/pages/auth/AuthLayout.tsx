import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  footer: {
    prompt: string;
    href: string;
    cta: string;
  };
}

export function AuthLayout({ children, title, subtitle, footer }: AuthLayoutProps) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      {/* Subtle ambient gradients — never compete with the form */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-brand-muted/10 blur-3xl"
      />

      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-10">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-brand to-brand-muted text-brand-foreground">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M4 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
              <path d="M18 8h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2" />
              <path d="M8 8h6M8 12h6M8 16h4" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">NewsHub</span>
        </div>

        <div className="w-full max-w-sm rounded-xl border border-border bg-card/80 p-7 shadow-2xl shadow-black/40 backdrop-blur-md">
          <div className="mb-6 space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {footer.prompt}{' '}
          <Link
            to={footer.href}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {footer.cta}
          </Link>
        </p>
      </div>
    </div>
  );
}
