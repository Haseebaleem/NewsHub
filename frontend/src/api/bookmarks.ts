import { api } from '@/api/client';
import type {
  ApiSuccess,
  Bookmark,
  Category,
  Paginated,
} from '@/types/api';

export interface CreateBookmarkPayload {
  title: string;
  description?: string | null;
  article_url: string;
  image_url?: string | null;
  source: string;
  author?: string | null;
  published_at?: string | null;
  category: Category;
}

export async function listBookmarks(page = 1): Promise<Paginated<Bookmark>> {
  const { data } = await api.get<Paginated<Bookmark>>('/bookmarks', { params: { page } });
  return data;
}

export async function createBookmark(payload: CreateBookmarkPayload): Promise<Bookmark> {
  const { data } = await api.post<ApiSuccess<Bookmark>>('/bookmarks', payload);
  return data.data;
}

export async function deleteBookmark(id: number): Promise<void> {
  await api.delete(`/bookmarks/${id}`);
}
