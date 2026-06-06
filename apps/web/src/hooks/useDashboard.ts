import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/apiClient';

export function useDashboard(teamId: string | undefined) {
  const { get } = useApiClient();
  return useQuery({
    queryKey: ['dashboard', teamId],
    queryFn: () => get(`/dashboard/${teamId}`).then((r) => r.data),
    enabled: !!teamId,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });
}

export function useCareLogs(
  recipientId: string | undefined,
  options?: { type?: string; limit?: number }
) {
  const { get } = useApiClient();
  return useQuery({
    queryKey: ['care-logs', recipientId, options],
    queryFn: () => get('/care-logs', { recipientId, ...options }).then((r) => r.data),
    enabled: !!recipientId,
  });
}

export function useCreateCareLog() {
  const { post } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => post('/care-logs', data).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['care-logs', variables.recipientId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useMedications(recipientId: string | undefined) {
  const { get } = useApiClient();
  return useQuery({
    queryKey: ['medications', recipientId],
    queryFn: () => get('/medications', { recipientId }).then((r) => r.data),
    enabled: !!recipientId,
  });
}

export function useLogMedication() {
  const { post } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      medicationId,
      ...data
    }: {
      medicationId: string;
      given: boolean;
      notes?: string;
    }) => post(`/medications/${medicationId}/log`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useMyTasks() {
  const { get, patch } = useApiClient();
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => get('/tasks/my-tasks').then((r) => r.data),
    staleTime: 30 * 1000,
  });

  const completeTask = useMutation({
    mutationFn: ({
      assignmentId,
      status,
      notes,
    }: {
      assignmentId: string;
      status: 'COMPLETED' | 'SKIPPED';
      notes?: string;
    }) => patch(`/tasks/assignments/${assignmentId}`, { status, notes }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return { ...tasksQuery, completeTask };
}
