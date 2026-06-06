-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PRIMARY_CAREGIVER', 'SECONDARY_CAREGIVER', 'FAMILY_MEMBER', 'MEDICAL_COORDINATOR', 'FINANCIAL_COORDINATOR', 'CARE_RECIPIENT');

-- CreateEnum
CREATE TYPE "CareStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EMERGENCY', 'HOSPICE', 'DECEASED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'MISSED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TaskFrequency" AS ENUM ('ONE_TIME', 'DAILY', 'TWICE_DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "LogEntryType" AS ENUM ('MEAL', 'WATER', 'MEDICATION', 'BATHROOM', 'SLEEP', 'MOOD', 'PAIN', 'FALL', 'BEHAVIORAL', 'MEDICAL_NOTE', 'VITAL_SIGNS', 'GENERAL');

-- CreateEnum
CREATE TYPE "MedicationFrequency" AS ENUM ('DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'FOUR_TIMES_DAILY', 'EVERY_OTHER_DAY', 'WEEKLY', 'AS_NEEDED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ADVANCE_DIRECTIVE', 'DNR_ORDER', 'INSURANCE_CARD', 'MEDICAL_RECORD', 'PRESCRIPTION', 'LEGAL_DOCUMENT', 'PHOTO', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'PAST_DUE', 'TRIALING', 'PAUSED');

-- CreateEnum
CREATE TYPE "BlueprintTriggerType" AS ENUM ('FALL', 'HOSPITALIZATION', 'HOSPICE_TRANSITION', 'CAREGIVER_BURNOUT', 'PRIMARY_CAREGIVER_UNAVAILABLE', 'BEHAVIORAL_CRISIS', 'CUSTOM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "emailVerified" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CareStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_team_members" (
    "id" TEXT NOT NULL,
    "careTeamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedBy" TEXT,

    CONSTRAINT "care_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_invites" (
    "id" TEXT NOT NULL,
    "careTeamId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_recipients" (
    "id" TEXT NOT NULL,
    "careTeamId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "avatarUrl" TEXT,
    "primaryDiagnosis" TEXT,
    "secondaryDiagnoses" TEXT[],
    "allergies" TEXT[],
    "bloodType" TEXT,
    "weightLbs" DOUBLE PRECISION,
    "heightInches" DOUBLE PRECISION,
    "preferredHospital" TEXT,
    "preferredPhysician" TEXT,
    "physicianPhone" TEXT,
    "insuranceProvider" TEXT,
    "insurancePolicyNumber" TEXT,
    "insuranceGroupNumber" TEXT,
    "medicareNumber" TEXT,
    "medicaidNumber" TEXT,
    "dnrStatus" BOOLEAN NOT NULL DEFAULT false,
    "advanceDirective" BOOLEAN NOT NULL DEFAULT false,
    "advanceDirectiveUrl" TEXT,
    "mobilityStatus" TEXT,
    "dietaryRestrictions" TEXT[],
    "notes" TEXT,
    "status" "CareStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "email" TEXT,
    "isLocalContact" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genericName" TEXT,
    "dosage" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "frequency" "MedicationFrequency" NOT NULL,
    "customFrequency" TEXT,
    "instructions" TEXT,
    "prescribedBy" TEXT,
    "pharmacy" TEXT,
    "pharmacyPhone" TEXT,
    "rxNumber" TEXT,
    "refillDate" TIMESTAMP(3),
    "pillsRemaining" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPRN" BOOLEAN NOT NULL DEFAULT false,
    "prnReason" TEXT,
    "sideEffects" TEXT[],
    "purpose" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_schedules" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "label" TEXT,

    CONSTRAINT "medication_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_logs" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "administeredBy" TEXT NOT NULL,
    "administeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduled" BOOLEAN NOT NULL DEFAULT true,
    "given" BOOLEAN NOT NULL DEFAULT true,
    "dosageGiven" TEXT,
    "reason" TEXT,
    "notes" TEXT,

    CONSTRAINT "medication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_logs" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "loggedBy" TEXT NOT NULL,
    "type" "LogEntryType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "mealDescription" TEXT,
    "mealAmount" TEXT,
    "waterOz" DOUBLE PRECISION,
    "urination" BOOLEAN,
    "bowelMovement" BOOLEAN,
    "bowelDescription" TEXT,
    "sleepHours" DOUBLE PRECISION,
    "sleepQuality" TEXT,
    "moodRating" INTEGER,
    "moodDescription" TEXT,
    "painLevel" INTEGER,
    "painLocation" TEXT,
    "painDescription" TEXT,
    "fallLocation" TEXT,
    "fallInjury" BOOLEAN,
    "fallInjuryDescription" TEXT,
    "emergencyContacted" BOOLEAN,
    "behaviorDescription" TEXT,
    "behaviorTrigger" TEXT,
    "behaviorIntervention" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vital_signs" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bloodPressureSystolic" INTEGER,
    "bloodPressureDiastolic" INTEGER,
    "heartRate" INTEGER,
    "temperatureF" DOUBLE PRECISION,
    "oxygenSaturation" INTEGER,
    "bloodSugar" DOUBLE PRECISION,
    "weightLbs" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "vital_signs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" "TaskFrequency" NOT NULL DEFAULT 'ONE_TIME',
    "customSchedule" TEXT,
    "dueDate" TIMESTAMP(3),
    "dueTime" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "category" TEXT,
    "instructions" TEXT,
    "suppliesNeeded" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_assignments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),
    "skipReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT,
    "specialty" TEXT,
    "location" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER,
    "notes" TEXT,
    "preparationInstructions" TEXT,
    "transportation" TEXT,
    "transportedBy" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpNotes" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minimumStock" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'units',
    "supplierName" TEXT,
    "supplierUrl" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRestocked" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "recordedBy" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_handoffs" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "giverId" TEXT NOT NULL,
    "receiverId" TEXT,
    "shiftDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shiftType" TEXT,
    "summary" TEXT NOT NULL,
    "mealsGiven" TEXT,
    "waterIntake" TEXT,
    "medicationsGiven" TEXT,
    "medicationsMissed" TEXT,
    "bowelMovements" TEXT,
    "sleep" TEXT,
    "mood" TEXT,
    "painLevel" INTEGER,
    "falls" TEXT,
    "behavioralNotes" TEXT,
    "pendingTasks" TEXT,
    "upcomingAppointments" TEXT,
    "suppliesLow" TEXT[],
    "urgentItems" TEXT,
    "generalNotes" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shift_handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "future_blueprints" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "trigger" "BlueprintTriggerType" NOT NULL,
    "customTrigger" TEXT,
    "description" TEXT,
    "steps" JSONB NOT NULL,
    "contacts" JSONB NOT NULL,
    "documents" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastReviewed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "future_blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "careTeamId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercent" INTEGER NOT NULL DEFAULT 0,
    "allowedPlans" "SubscriptionPlan"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_email_idx" ON "password_reset_tokens"("email");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "care_team_members_careTeamId_idx" ON "care_team_members"("careTeamId");

-- CreateIndex
CREATE INDEX "care_team_members_userId_idx" ON "care_team_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "care_team_members_careTeamId_userId_key" ON "care_team_members"("careTeamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "team_invites_token_key" ON "team_invites"("token");

-- CreateIndex
CREATE INDEX "team_invites_careTeamId_idx" ON "team_invites"("careTeamId");

-- CreateIndex
CREATE INDEX "team_invites_token_idx" ON "team_invites"("token");

-- CreateIndex
CREATE INDEX "team_invites_email_idx" ON "team_invites"("email");

-- CreateIndex
CREATE UNIQUE INDEX "care_recipients_careTeamId_key" ON "care_recipients"("careTeamId");

-- CreateIndex
CREATE INDEX "care_recipients_careTeamId_idx" ON "care_recipients"("careTeamId");

-- CreateIndex
CREATE INDEX "emergency_contacts_recipientId_idx" ON "emergency_contacts"("recipientId");

-- CreateIndex
CREATE INDEX "medications_recipientId_idx" ON "medications"("recipientId");

-- CreateIndex
CREATE INDEX "medications_isActive_idx" ON "medications"("isActive");

-- CreateIndex
CREATE INDEX "medication_schedules_medicationId_idx" ON "medication_schedules"("medicationId");

-- CreateIndex
CREATE INDEX "medication_logs_medicationId_idx" ON "medication_logs"("medicationId");

-- CreateIndex
CREATE INDEX "medication_logs_administeredAt_idx" ON "medication_logs"("administeredAt");

-- CreateIndex
CREATE INDEX "care_logs_recipientId_idx" ON "care_logs"("recipientId");

-- CreateIndex
CREATE INDEX "care_logs_loggedBy_idx" ON "care_logs"("loggedBy");

-- CreateIndex
CREATE INDEX "care_logs_occurredAt_idx" ON "care_logs"("occurredAt");

-- CreateIndex
CREATE INDEX "care_logs_type_idx" ON "care_logs"("type");

-- CreateIndex
CREATE INDEX "vital_signs_recipientId_idx" ON "vital_signs"("recipientId");

-- CreateIndex
CREATE INDEX "vital_signs_recordedAt_idx" ON "vital_signs"("recordedAt");

-- CreateIndex
CREATE INDEX "tasks_recipientId_idx" ON "tasks"("recipientId");

-- CreateIndex
CREATE INDEX "tasks_dueDate_idx" ON "tasks"("dueDate");

-- CreateIndex
CREATE INDEX "task_assignments_taskId_idx" ON "task_assignments"("taskId");

-- CreateIndex
CREATE INDEX "task_assignments_userId_idx" ON "task_assignments"("userId");

-- CreateIndex
CREATE INDEX "task_assignments_status_idx" ON "task_assignments"("status");

-- CreateIndex
CREATE INDEX "task_assignments_dueDate_idx" ON "task_assignments"("dueDate");

-- CreateIndex
CREATE INDEX "appointments_recipientId_idx" ON "appointments"("recipientId");

-- CreateIndex
CREATE INDEX "appointments_scheduledAt_idx" ON "appointments"("scheduledAt");

-- CreateIndex
CREATE INDEX "documents_recipientId_idx" ON "documents"("recipientId");

-- CreateIndex
CREATE INDEX "documents_type_idx" ON "documents"("type");

-- CreateIndex
CREATE INDEX "inventory_items_recipientId_idx" ON "inventory_items"("recipientId");

-- CreateIndex
CREATE INDEX "inventory_transactions_itemId_idx" ON "inventory_transactions"("itemId");

-- CreateIndex
CREATE INDEX "shift_handoffs_recipientId_idx" ON "shift_handoffs"("recipientId");

-- CreateIndex
CREATE INDEX "shift_handoffs_giverId_idx" ON "shift_handoffs"("giverId");

-- CreateIndex
CREATE INDEX "shift_handoffs_shiftDate_idx" ON "shift_handoffs"("shiftDate");

-- CreateIndex
CREATE INDEX "future_blueprints_recipientId_idx" ON "future_blueprints"("recipientId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_careTeamId_key" ON "subscriptions"("careTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeCustomerId_key" ON "subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_stripeCustomerId_idx" ON "subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_name_key" ON "feature_flags"("name");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_team_members" ADD CONSTRAINT "care_team_members_careTeamId_fkey" FOREIGN KEY ("careTeamId") REFERENCES "care_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_team_members" ADD CONSTRAINT "care_team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_careTeamId_fkey" FOREIGN KEY ("careTeamId") REFERENCES "care_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_recipients" ADD CONSTRAINT "care_recipients_careTeamId_fkey" FOREIGN KEY ("careTeamId") REFERENCES "care_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_schedules" ADD CONSTRAINT "medication_schedules_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_logs" ADD CONSTRAINT "medication_logs_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_logs" ADD CONSTRAINT "care_logs_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_logs" ADD CONSTRAINT "care_logs_loggedBy_fkey" FOREIGN KEY ("loggedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_handoffs" ADD CONSTRAINT "shift_handoffs_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_handoffs" ADD CONSTRAINT "shift_handoffs_giverId_fkey" FOREIGN KEY ("giverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_handoffs" ADD CONSTRAINT "shift_handoffs_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "future_blueprints" ADD CONSTRAINT "future_blueprints_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_careTeamId_fkey" FOREIGN KEY ("careTeamId") REFERENCES "care_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
