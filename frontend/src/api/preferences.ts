import { api } from '@/api/client';
import type { ApiSuccess, Preferences } from '@/types/api';

export async function getPreferences(): Promise<Preferences> {
  const { data } = await api.get<ApiSuccess<Preferences>>('/preferences');
  return data.data;
}

export async function updatePreferences(payload: Partial<Preferences>): Promise<Preferences> {
  const { data } = await api.patch<ApiSuccess<Preferences>>('/preferences', payload);
  return data.data;
}
