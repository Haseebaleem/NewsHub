import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import type { ApiError } from '@/types/api';

const baseURL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:8000';

export const api: AxiosInstance = axios.create({
  baseURL: `${baseURL}/api`,
  headers: { Accept: 'application/json' },
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token !== null && token !== '') {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Treat any 401 as "session is gone" — clear the store so the
    // route guard kicks the user back to /login. Skip the login
    // endpoint itself: a 401 there means wrong-credentials, not an
    // expired session.
    if (
      error.response?.status === 401 &&
      !error.config?.url?.endsWith('/auth/login')
    ) {
      useAuthStore.getState().clear();
    }
    return Promise.reject(error);
  },
);

/** Pull the user-facing message out of any axios error. */
export function describeError(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError<ApiError>(error)) {
    const body = error.response?.data;
    if (body?.errors !== undefined) {
      const first = Object.values(body.errors)[0]?.[0];
      if (first !== undefined) return first;
    }
    return body?.message ?? fallback;
  }
  return fallback;
}
