import { api } from '@/api/client';
import type { ApiSuccess, Category, ReadingHistoryEntry } from '@/types/api';

export interface RecordHistoryPayload {
  title: string;
  article_url: string;
  source: string;
  category: Category;
}

export async function listHistory(): Promise<ReadingHistoryEntry[]> {
  const { data } = await api.get<ApiSuccess<ReadingHistoryEntry[]>>('/reading-history');
  return data.data;
}

export async function recordHistory(payload: RecordHistoryPayload): Promise<ReadingHistoryEntry> {
  const { data } = await api.post<ApiSuccess<ReadingHistoryEntry>>('/reading-history', payload);
  return data.data;
}

export async function clearHistory(): Promise<void> {
  await api.delete('/reading-history');
}
