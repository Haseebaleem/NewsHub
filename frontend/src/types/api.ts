/**
 * Shared API response types. The Laravel backend uses a consistent envelope:
 *   success: { data: T, message: string, meta?: ... }
 *   error:   { error: string, message: string, errors?: Record<string, string[]> }
 */

export interface ApiSuccess<T> {
  data: T;
  message: string;
}

export interface ApiError {
  error: string;
  message: string;
  errors?: Record<string, string[]>;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

/* ---------- domain types ---------- */

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type ThemeName = 'light' | 'dark';

export type Category =
  | 'business'
  | 'entertainment'
  | 'general'
  | 'health'
  | 'science'
  | 'sports'
  | 'technology';

export interface Preferences {
  default_country: string;
  default_categories: Category[];
  theme: ThemeName;
}

export interface NewsArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

export interface NewsResponse {
  total_results: number;
  articles: NewsArticle[];
}

export interface Bookmark {
  id: number;
  title: string;
  description: string | null;
  article_url: string;
  image_url: string | null;
  source: string;
  author: string | null;
  published_at: string | null;
  category: Category;
  created_at: string;
  updated_at: string;
}

export interface ReadingHistoryEntry {
  id: number;
  title: string;
  article_url: string;
  source: string;
  category: Category;
  read_at: string;
}

export interface Stats {
  articles_read_this_week: number;
  articles_read_this_month: number;
  top_category: Category | null;
  bookmark_count: number;
}
