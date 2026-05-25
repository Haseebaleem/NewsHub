import { NavLink } from 'react-router-dom';
import {
  Home,
  Search,
  Bookmark,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/lib/constants';
import { useSidebarStore } from '@/stores/sidebar.store';
import { Button } from '@/components/ui/button';

interface NavSection {
  label: string;
  items: NavItem[];
}

interface NavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
  /** Optional tone class for the icon (used to subtly color category icons). */
  tone?: string;
}

interface SidebarProps {
  onSignOut: () => void;
}

export function Sidebar({ onSignOut }: SidebarProps) {
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const closeMobile = useSidebarStore((s) => s.closeMobile);

  const sections: NavSection[] = [
    {
      label: 'Discover',
      items: [
        { to: '/feed', label: 'Home Feed', Icon: Home },
        { to: '/search', label: 'Search', Icon: Search },
      ],
    },
    {
      label: 'Categories',
      items: CATEGORIES.map(({ slug, label, Icon, tone }) => ({
        to: `/category/${slug}`,
        label,
        Icon,
        tone,
      })),
    },
    {
      label: 'Personal',
      items: [
        { to: '/bookmarks', label: 'Bookmarks', Icon: Bookmark },
        { to: '/history', label: 'Reading History', Icon: Clock },
        { to: '/stats', label: 'Stats', Icon: BarChart3 },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen ? (
        <button
          aria-label="Close navigation"
          onClick={closeMobile}
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-card transition-transform duration-200 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Primary"
      >
        {/* Brand row */}
        <div className="flex h-14 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-brand to-brand-muted text-brand-foreground">
              <NewspaperGlyph />
            </div>
            <span className="font-semibold tracking-tight">NewsHub</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={closeMobile}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section.label} className="mb-5">
              <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {section.label}
              </div>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <SidebarLink {...item} onNavigate={closeMobile} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Account footer */}
        <div className="border-t border-border px-3 py-3">
          <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Account
          </div>
          <SidebarLink to="/settings" label="Settings" Icon={Settings} onNavigate={closeMobile} />
          <button
            type="button"
            onClick={onSignOut}
            className="mt-0.5 flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

interface SidebarLinkProps extends NavItem {
  onNavigate: () => void;
}

function SidebarLink({ to, label, Icon, tone, onNavigate }: SidebarLinkProps) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors',
          isActive
            ? 'bg-accent text-foreground'
            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span
              className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand"
              aria-hidden
            />
          ) : null}
          <Icon className={cn('h-4 w-4 shrink-0', tone)} />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function NewspaperGlyph() {
  return (
    <svg
      width="14"
      height="14"
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
  );
}
