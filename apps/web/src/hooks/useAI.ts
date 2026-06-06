'use client';

import { useMutation } from '@tanstack/react-query';
import { useApiClient } from '@/lib/apiClient';

export function useAskQuestion() {
  const { post } = useApiClient();
  return useMutation({
    mutationFn: (data: { recipientId: string; question: string }) =>
      post('/ai/ask', data).then((r) => r.data),
  });
}

export function useGenerateCarePlan() {
  const { post } = useApiClient();
  return useMutation({
    mutationFn: (data: {
      recipientId: string;
      caregiverSchedules: string;
      specificChallenges: string;
    }) => post('/ai/care-plan', data).then((r) => r.data),
  });
}

export function useMediateDisagreement() {
  const { post } = useApiClient();
  return useMutation({
    mutationFn: (data: { recipientId: string; situation: string; context?: string }) =>
      post('/ai/mediate', data).then((r) => r.data),
  });
}

export function useGenerateDailySummary() {
  const { post } = useApiClient();
  return useMutation({
    mutationFn: (data: { recipientId: string }) =>
      post('/ai/daily-summary', data).then((r) => r.data),
  });
}

export function useBurnoutCheck() {
  const { post } = useApiClient();
  return useMutation({
    mutationFn: (data: { selfReportedStress?: string; recentChallenges?: string }) =>
      post('/ai/burnout-check', data).then((r) => r.data),
  });
}
