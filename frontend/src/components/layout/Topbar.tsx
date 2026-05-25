import { useEffect, useRef, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useSidebarStore } from '@/stores/sidebar.store';
import type { User } from '@/types/api';

interface TopbarProps {
  user: User | null;
  onSignOut: () => void;
}

export function Topbar({ user, onSignOut }: TopbarProps) {
  const openMobile = useSidebarStore((s) => s.openMobile);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Cmd+K (and Ctrl+K) focuses the search field — same shortcut Linear/Raycast
  // use, so muscle memory carries over from those tools.
  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const q = String(data.get('q') ?? '').trim();
    if (q !== '') navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={openMobile}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Link
        to="/feed"
        className="font-semibold tracking-tight text-foreground lg:hidden"
      >
        NewsHub
      </Link>

      <form onSubmit={submit} className="ml-auto flex max-w-md flex-1 lg:mx-auto">
        <label className="group relative flex w-full items-center">
          <Search
            className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-foreground"
            aria-hidden
          />
          <input
            ref={inputRef}
            name="q"
            type="search"
            placeholder="Search news, topics, sources…"
            aria-label="Search"
            className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          <kbd className="pointer-events-none absolute right-2 hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline-flex">
            ⌘K
          </kbd>
        </label>
      </form>

      <div className="flex items-center gap-1">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Open account menu"
            >
              <Avatar name={user?.name ?? null} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5 normal-case tracking-normal">
                <span className="text-sm font-medium text-foreground">
                  {user?.name ?? 'Signed in'}
                </span>
                {user?.email !== undefined ? (
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </span>
                ) : null}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/stats')}>
              Your stats
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onSignOut}
              className="text-destructive focus:text-destructive"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
