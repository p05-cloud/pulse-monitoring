-- Performance Optimization: Add Database Indexes
-- Run this with: psql -U pulse -d pulse -f scripts/add-indexes.sql

-- ============================================
-- MONITORS
-- ============================================

-- Index for finding monitors by project
CREATE INDEX IF NOT EXISTS idx_monitors_project_id ON "monitors"("project_id");

-- Index for finding active monitors
CREATE INDEX IF NOT EXISTS idx_monitors_is_active ON "monitors"("is_active");

-- Index for finding monitors by status
CREATE INDEX IF NOT EXISTS idx_monitors_current_status ON "monitors"("current_status");

-- Composite index for project + active monitors
CREATE INDEX IF NOT EXISTS idx_monitors_project_active ON "monitors"("project_id", "is_active");

-- Index for last check time (for scheduler)
CREATE INDEX IF NOT EXISTS idx_monitors_last_check ON "monitors"("last_check_at");

-- GIN index for tags array search
CREATE INDEX IF NOT EXISTS idx_monitors_tags ON "monitors" USING GIN("tags");

-- ============================================
-- CHECK RESULTS
-- ============================================

-- Index for finding checks by monitor and time (most common query)
CREATE INDEX IF NOT EXISTS idx_check_results_monitor_time ON "check_results"("monitor_id", "checked_at" DESC);

-- Index for finding recent checks (for dashboard)
CREATE INDEX IF NOT EXISTS idx_check_results_checked_at ON "check_results"("checked_at" DESC);

-- Composite index for monitor + success (for uptime calculations)
CREATE INDEX IF NOT EXISTS idx_check_results_monitor_success ON "check_results"("monitor_id", "success");

-- ============================================
-- INCIDENTS
-- ============================================

-- Index for finding incidents by monitor
CREATE INDEX IF NOT EXISTS idx_incidents_monitor_id ON "incidents"("monitor_id");

-- Index for finding incidents by status
CREATE INDEX IF NOT EXISTS idx_incidents_status ON "incidents"("status");

-- Composite index for monitor + status (for open incidents)
CREATE INDEX IF NOT EXISTS idx_incidents_monitor_status ON "incidents"("monitor_id", "status");

-- Index for recent incidents (for dashboard)
CREATE INDEX IF NOT EXISTS idx_incidents_started_at ON "incidents"("started_at" DESC);

-- Composite index for open/acknowledged incidents (most common query)
CREATE INDEX IF NOT EXISTS idx_incidents_active ON "incidents"("status") WHERE "status" IN ('OPEN', 'ACKNOWLEDGED');

-- ============================================
-- NOTIFICATION LOGS
-- ============================================

-- Index for finding notifications by incident
CREATE INDEX IF NOT EXISTS idx_notification_logs_incident_id ON "notification_logs"("incident_id");

-- Index for finding notifications by alert contact
CREATE INDEX IF NOT EXISTS idx_notification_logs_alert_contact_id ON "notification_logs"("alert_contact_id");

-- Index for finding failed notifications (for retry)
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON "notification_logs"("status");

-- Index for recent notifications
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON "notification_logs"("created_at" DESC);

-- ============================================
-- ACTIVITY LOGS
-- ============================================

-- Index for finding logs by user
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON "activity_logs"("user_id");

-- Index for finding logs by entity
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON "activity_logs"("entity_type", "entity_id");

-- Index for recent activity (for dashboard)
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON "activity_logs"("created_at" DESC);

-- ============================================
-- PROJECTS
-- ============================================

-- Index for finding projects by name (for search)
CREATE INDEX IF NOT EXISTS idx_projects_name ON "projects"("name");

-- ============================================
-- USERS
-- ============================================

-- Index for finding users by email (for login)
CREATE INDEX IF NOT EXISTS idx_users_email ON "users"("email");

-- Index for finding active users
CREATE INDEX IF NOT EXISTS idx_users_is_active ON "users"("is_active");

-- Composite index for active users by role
CREATE INDEX IF NOT EXISTS idx_users_active_role ON "users"("is_active", "role");

-- ============================================
-- REPORT SCHEDULES
-- ============================================

-- Index for finding schedules due for execution
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON "report_schedules"("is_active", "next_run_at");

-- ============================================
-- MAINTENANCE WINDOWS
-- ============================================

-- Index for finding active maintenance windows
CREATE INDEX IF NOT EXISTS idx_maintenance_windows_active ON "maintenance_windows"("is_active", "start_time", "end_time");

-- GIN index for monitor IDs array search
CREATE INDEX IF NOT EXISTS idx_maintenance_windows_monitors ON "maintenance_windows" USING GIN("monitor_ids");

-- ============================================
-- STATISTICS
-- ============================================

-- Analyze tables to update statistics for query planner
ANALYZE "users";
ANALYZE "projects";
ANALYZE "monitors";
ANALYZE "check_results";
ANALYZE "incidents";
ANALYZE "activity_logs";
ANALYZE "notification_logs";
ANALYZE "alert_contacts";
ANALYZE "report_schedules";
ANALYZE "maintenance_windows";

-- Show index usage statistics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM
    pg_stat_user_indexes
WHERE
    schemaname = 'public'
ORDER BY
    idx_scan DESC;
