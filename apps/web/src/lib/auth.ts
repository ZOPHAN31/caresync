/**
 * Auth helpers. Full NextAuth wiring lands in Phase 3.
 * These thin helpers centralize the API auth endpoints used by the
 * login/register forms today so the call sites stay stable.
 */
import api from './api';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface AuthResult {
  user: AuthUser;
  token?: string;
}

export async function loginRequest(credentials: AuthCredentials): Promise<AuthResult> {
  const { data } = await api.post('/api/v1/auth/login', credentials);
  return data?.data ?? data;
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthResult> {
  const { data } = await api.post('/api/v1/auth/register', payload);
  return data?.data ?? data;
}
