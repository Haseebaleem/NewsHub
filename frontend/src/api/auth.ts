import { api } from '@/api/client';
import type { ApiSuccess, AuthResponse, User } from '@/types/api';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/register', payload);
  return data.data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/login', payload);
  return data.data;
}

export async function me(): Promise<User> {
  const { data } = await api.get<ApiSuccess<User>>('/user');
  return data.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}
