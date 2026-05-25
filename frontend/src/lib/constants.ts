import {
  Briefcase,
  Film,
  HeartPulse,
  Microscope,
  Trophy,
  Cpu,
  Globe,
  type LucideIcon,
} from 'lucide-react';
import type { Category } from '@/types/api';

export interface CategoryMeta {
  slug: Category;
  label: string;
  Icon: LucideIcon;
  /** Tailwind text color used for badges + icons. Picked once so every
   *  surface shows the same chip color for a given category. */
  tone: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { slug: 'business', label: 'Business', Icon: Briefcase, tone: 'text-emerald-400' },
  { slug: 'entertainment', label: 'Entertainment', Icon: Film, tone: 'text-pink-400' },
  { slug: 'health', label: 'Health', Icon: HeartPulse, tone: 'text-rose-400' },
  { slug: 'science', label: 'Science', Icon: Microscope, tone: 'text-sky-400' },
  { slug: 'sports', label: 'Sports', Icon: Trophy, tone: 'text-amber-400' },
  { slug: 'technology', label: 'Technology', Icon: Cpu, tone: 'text-violet-400' },
  { slug: 'general', label: 'General', Icon: Globe, tone: 'text-zinc-400' },
];

export const CATEGORY_BY_SLUG: Record<Category, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
) as Record<Category, CategoryMeta>;

export interface CountryMeta {
  code: string;
  label: string;
}

/** Matches the backend's Preference::VALID_COUNTRIES list. */
export const COUNTRIES: CountryMeta[] = [
  { code: 'in', label: 'India' },
  { code: 'us', label: 'United States' },
  { code: 'gb', label: 'United Kingdom' },
  { code: 'ca', label: 'Canada' },
  { code: 'au', label: 'Australia' },
  { code: 'de', label: 'Germany' },
  { code: 'fr', label: 'France' },
  { code: 'jp', label: 'Japan' },
  { code: 'ru', label: 'Russia' },
  { code: 'cn', label: 'China' },
  { code: 'br', label: 'Brazil' },
  { code: 'mx', label: 'Mexico' },
  { code: 'it', label: 'Italy' },
  { code: 'es', label: 'Spain' },
  { code: 'nl', label: 'Netherlands' },
  { code: 'se', label: 'Sweden' },
  { code: 'no', label: 'Norway' },
  { code: 'pk', label: 'Pakistan' },
  { code: 'ae', label: 'UAE' },
  { code: 'sg', label: 'Singapore' },
];
