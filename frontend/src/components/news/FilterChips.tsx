import { cn } from '@/lib/utils';
import { CATEGORY_BY_SLUG } from '@/lib/constants';
import type { Category } from '@/types/api';

export type FilterChipValue = 'all' | Category;

interface FilterChipsProps {
  values: Category[];
  active: FilterChipValue;
  onChange: (next: FilterChipValue) => void;
  /** Optional "All" label override (e.g. "All categories"). */
  allLabel?: string;
}

export function FilterChips({ values, active, onChange, allLabel = 'All' }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip
        active={active === 'all'}
        onClick={() => onChange('all')}
        label={allLabel}
      />
      {values.map((slug) => {
        const meta = CATEGORY_BY_SLUG[slug];
        return (
          <Chip
            key={slug}
            active={active === slug}
            onClick={() => onChange(slug)}
            label={meta.label}
            Icon={
              <meta.Icon className={cn('h-3 w-3', active === slug ? meta.tone : '')} />
            }
          />
        );
      })}
    </div>
  );
}

interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  Icon?: React.ReactNode;
}

function Chip({ label, active, onClick, Icon }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-brand/40 bg-brand/10 text-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground',
      )}
    >
      {Icon}
      {label}
    </button>
  );
}
