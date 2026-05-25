import { api } from '@/api/client';
import type { ApiSuccess, Stats } from '@/types/api';

export async function getStats(): Promise<Stats> {
  const { data } = await api.get<ApiSuccess<Stats>>('/stats');
  return data.data;
}
