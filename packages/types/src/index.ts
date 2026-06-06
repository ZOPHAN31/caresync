// ─── User roles ───────────────────────────────────────────────
export type UserRole =
  | 'PRIMARY_CAREGIVER'
  | 'SECONDARY_CAREGIVER'
  | 'FAMILY_MEMBER'
  | 'MEDICAL_COORDINATOR'
  | 'FINANCIAL_COORDINATOR'
  | 'CARE_RECIPIENT';

// ─── Care status ──────────────────────────────────────────────
export type CareStatus = 'ACTIVE' | 'INACTIVE' | 'EMERGENCY';

// ─── Medication frequency ─────────────────────────────────────
export type MedicationFrequency =
  | 'DAILY'
  | 'TWICE_DAILY'
  | 'THREE_TIMES_DAILY'
  | 'FOUR_TIMES_DAILY'
  | 'WEEKLY'
  | 'AS_NEEDED'
  | 'CUSTOM';

// ─── Log entry types ──────────────────────────────────────────
export type LogEntryType =
  | 'MEAL'
  | 'WATER'
  | 'MEDICATION'
  | 'BATHROOM'
  | 'SLEEP'
  | 'MOOD'
  | 'PAIN'
  | 'FALL'
  | 'BEHAVIORAL'
  | 'MEDICAL_NOTE'
  | 'GENERAL';

// ─── Task status ──────────────────────────────────────────────
export type TaskStatus = 'PENDING' | 'COMPLETED' | 'MISSED' | 'SKIPPED';

// ─── API response wrapper ─────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
  meta?: {
    pagination?: PaginationMeta;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── User ─────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Care team ────────────────────────────────────────────────
export interface CareTeam {
  id: string;
  name: string;
  recipientId: string;
  members: CareTeamMember[];
  createdAt: string;
}

export interface CareTeamMember {
  userId: string;
  user: User;
  role: UserRole;
  joinedAt: string;
}
