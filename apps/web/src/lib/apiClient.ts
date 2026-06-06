import { useSession } from 'next-auth/react';
import api from './api';
import { useCallback } from 'react';

// Hook that returns an API client with auth headers pre-attached
export function useApiClient() {
  const { data: session } = useSession();

  const get = useCallback(
    async (url: string, params?: Record<string, string | number | boolean | undefined>) => {
      const response = await api.get(url, {
        params,
        headers: session?.user?.accessToken
          ? { Authorization: `Bearer ${session.user.accessToken}` }
          : {},
      });
      return response.data;
    },
    [session]
  );

  const post = useCallback(
    async (url: string, data?: unknown) => {
      const response = await api.post(url, data, {
        headers: session?.user?.accessToken
          ? { Authorization: `Bearer ${session.user.accessToken}` }
          : {},
      });
      return response.data;
    },
    [session]
  );

  const patch = useCallback(
    async (url: string, data?: unknown) => {
      const response = await api.patch(url, data, {
        headers: session?.user?.accessToken
          ? { Authorization: `Bearer ${session.user.accessToken}` }
          : {},
      });
      return response.data;
    },
    [session]
  );

  const del = useCallback(
    async (url: string) => {
      const response = await api.delete(url, {
        headers: session?.user?.accessToken
          ? { Authorization: `Bearer ${session.user.accessToken}` }
          : {},
      });
      return response.data;
    },
    [session]
  );

  return { get, post, patch, del };
}
