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

// ─── Appointments ──────────────────────────────────────────
export function useAppointments(recipientId: string | undefined, upcoming = true) {
  const { get } = useApiClient();
  return useQuery({
    queryKey: ['appointments', recipientId, upcoming],
    queryFn: () => get('/appointments', { recipientId, upcoming }).then((r) => r.data),
    enabled: !!recipientId,
  });
}

export function useCreateAppointment() {
  const { post } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => post('/appointments', data).then((r) => r.data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['appointments', v.recipientId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCompleteAppointment() {
  const { post } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; outcome?: string; followUpRequired?: boolean }) =>
      post(`/appointments/${id}/complete`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ─── Inventory ────────────────────────────────────────────
export function useInventory(recipientId: string | undefined) {
  const { get } = useApiClient();
  return useQuery({
    queryKey: ['inventory', recipientId],
    queryFn: () => get('/inventory', { recipientId }).then((r) => r.data),
    enabled: !!recipientId,
  });
}

export function useAdjustInventory() {
  const { post } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; type: string; quantity: number; notes?: string }) =>
      post(`/inventory/${id}/adjust`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ─── Handoffs ─────────────────────────────────────────────
export function useHandoffs(recipientId: string | undefined) {
  const { get } = useApiClient();
  return useQuery({
    queryKey: ['handoffs', recipientId],
    queryFn: () => get('/handoffs', { recipientId }).then((r) => r.data),
    enabled: !!recipientId,
  });
}

export function useCreateHandoff() {
  const { post } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => post('/handoffs', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['handoffs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ─── Blueprints ───────────────────────────────────────────
export function useBlueprints(recipientId: string | undefined) {
  const { get } = useApiClient();
  return useQuery({
    queryKey: ['blueprints', recipientId],
    queryFn: () => get('/blueprints', { recipientId }).then((r) => r.data),
    enabled: !!recipientId,
  });
}

// ─── Team ─────────────────────────────────────────────────
export function useCareTeam(teamId: string | undefined) {
  const { get } = useApiClient();
  return useQuery({
    queryKey: ['care-team', teamId],
    queryFn: () => get(`/teams/${teamId}`).then((r) => r.data),
    enabled: !!teamId,
  });
}
