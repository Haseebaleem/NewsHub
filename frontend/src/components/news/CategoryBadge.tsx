import { cn } from '@/lib/utils';
import { CATEGORY_BY_SLUG } from '@/lib/constants';
import type { Category } from '@/types/api';

interface CategoryBadgeProps {
  category: Category;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const meta = CATEGORY_BY_SLUG[category];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-black/55 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/90 backdrop-blur-sm',
        className,
      )}
    >
      <meta.Icon className={cn('h-3 w-3', meta.tone)} />
      {meta.label}
    </span>
  );
}
