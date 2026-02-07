-- CreateEnum
CREATE TYPE "MonitorType" AS ENUM ('SIMPLE', 'AGGREGATOR');

-- AlterTable
ALTER TABLE "check_results" ADD COLUMN     "sub_monitor_data" JSONB,
ADD COLUMN     "sub_monitor_name" TEXT;

-- AlterTable
ALTER TABLE "monitors" ADD COLUMN     "aggregator_config" JSONB,
ADD COLUMN     "monitor_type" "MonitorType" NOT NULL DEFAULT 'SIMPLE';

-- CreateIndex
CREATE INDEX "check_results_monitor_id_sub_monitor_name_idx" ON "check_results"("monitor_id", "sub_monitor_name");

-- CreateIndex
CREATE INDEX "monitors_monitor_type_idx" ON "monitors"("monitor_type");
