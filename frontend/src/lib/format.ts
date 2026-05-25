import { formatDistanceToNowStrict } from 'date-fns';

/** "2h ago", "3d ago" — never "about 2 hours ago" or "in 3 minutes". */
export function relativeTime(iso: string | null | undefined): string {
  if (iso === null || iso === undefined || iso === '') return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${formatDistanceToNowStrict(date)} ago`;
}

/** "Good morning, Casey" — picks greeting by local hour. */
export function greeting(name: string | null | undefined): string {
  const hour = new Date().getHours();
  const prefix =
    hour < 5 ? 'Up late' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return name !== null && name !== undefined && name !== '' ? `${prefix}, ${name.split(' ')[0]}` : prefix;
}

/** Picks the strongest first letter we can use for an avatar. */
export function initials(name: string | null | undefined): string {
  if (name === null || name === undefined || name.trim() === '') return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0] ?? '').slice(0, 2).toUpperCase();
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
}
