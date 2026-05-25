import { cn } from '@/lib/utils';
import { initials as toInitials } from '@/lib/format';

interface AvatarProps {
  name: string | null | undefined;
  size?: 'sm' | 'md';
  className?: string;
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full border border-border bg-secondary font-medium text-secondary-foreground',
        size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-8 w-8 text-xs',
        className,
      )}
      aria-hidden
    >
      {toInitials(name)}
    </span>
  );
}
