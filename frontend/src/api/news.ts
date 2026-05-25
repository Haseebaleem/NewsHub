import { api } from '@/api/client';
import type { ApiSuccess, Category, NewsResponse } from '@/types/api';

export interface TopHeadlinesParams {
  country?: string;
  category?: Category;
  page?: number;
}

export interface SearchParams {
  q: string;
  page?: number;
}

export async function topHeadlines(params: TopHeadlinesParams): Promise<NewsResponse> {
  const { data } = await api.get<ApiSuccess<NewsResponse>>('/news/top-headlines', { params });
  return data.data;
}

export async function searchNews(params: SearchParams): Promise<NewsResponse> {
  const { data } = await api.get<ApiSuccess<NewsResponse>>('/news/search', { params });
  return data.data;
}
