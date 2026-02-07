-- Fix schema script - adds missing columns/tables from failed migration
-- Safe to run multiple times (uses IF NOT EXISTS / IF NOT EXISTS patterns)

-- Add 2FA fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_secret" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "backup_codes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add new enum values to UserRole if not exists
DO $$ BEGIN
    ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DEVELOPER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'VIEWER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create team_invitations table
CREATE TABLE IF NOT EXISTS "team_invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "token" TEXT NOT NULL,
    "invited_by_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "team_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "team_invitations_token_key" ON "team_invitations"("token");
CREATE INDEX IF NOT EXISTS "team_invitations_email_idx" ON "team_invitations"("email");

DO $$ BEGIN
    ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_invited_by_id_fkey"
        FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create sla_configs table
CREATE TABLE IF NOT EXISTS "sla_configs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "target_uptime" DOUBLE PRECISION NOT NULL DEFAULT 99.9,
    "max_response_time_ms" INTEGER NOT NULL DEFAULT 5000,
    "alert_on_breach" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sla_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sla_configs_project_id_key" ON "sla_configs"("project_id");

DO $$ BEGIN
    ALTER TABLE "sla_configs" ADD CONSTRAINT "sla_configs_project_id_fkey"
        FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add SSL/Domain monitoring fields to monitors
ALTER TABLE "monitors" ADD COLUMN IF NOT EXISTS "ssl_expires_at" TIMESTAMP(3);
ALTER TABLE "monitors" ADD COLUMN IF NOT EXISTS "domain_expires_at" TIMESTAMP(3);
ALTER TABLE "monitors" ADD COLUMN IF NOT EXISTS "last_ssl_check" TIMESTAMP(3);

-- Update maintenance_windows table
ALTER TABLE "maintenance_windows" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "maintenance_windows" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE "maintenance_windows" ADD COLUMN IF NOT EXISTS "notify_before" INTEGER NOT NULL DEFAULT 30;

CREATE INDEX IF NOT EXISTS "maintenance_windows_start_time_idx" ON "maintenance_windows"("start_time");
CREATE INDEX IF NOT EXISTS "maintenance_windows_end_time_idx" ON "maintenance_windows"("end_time");

-- Create escalation_policies table
CREATE TABLE IF NOT EXISTS "escalation_policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "levels" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "escalation_policies_pkey" PRIMARY KEY ("id")
);

-- Create monitor_escalations table
CREATE TABLE IF NOT EXISTS "monitor_escalations" (
    "monitor_id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    CONSTRAINT "monitor_escalations_pkey" PRIMARY KEY ("monitor_id","policy_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "monitor_escalations_monitor_id_key" ON "monitor_escalations"("monitor_id");

DO $$ BEGIN
    ALTER TABLE "monitor_escalations" ADD CONSTRAINT "monitor_escalations_monitor_id_fkey"
        FOREIGN KEY ("monitor_id") REFERENCES "monitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "monitor_escalations" ADD CONSTRAINT "monitor_escalations_policy_id_fkey"
        FOREIGN KEY ("policy_id") REFERENCES "escalation_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create IntegrationType enum
DO $$ BEGIN
    CREATE TYPE "IntegrationType" AS ENUM ('SLACK', 'TEAMS', 'DISCORD', 'PAGERDUTY', 'OPSGENIE', 'WEBHOOK');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create integrations table
CREATE TABLE IF NOT EXISTS "integrations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "config" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- Done
SELECT 'Schema fix completed successfully' as status;
