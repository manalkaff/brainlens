-- CreateEnum
CREATE TYPE "CacheStatus" AS ENUM ('FRESH', 'STALE', 'REFRESHING', 'ERROR');

-- AlterTable
ALTER TABLE "GeneratedContent" ADD COLUMN     "accessCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cacheKey" TEXT,
ADD COLUMN     "freshnessTtl" INTEGER,
ADD COLUMN     "lastAccess" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "researchVersion" TEXT;

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "cacheStatus" "CacheStatus" NOT NULL DEFAULT 'STALE',
ADD COLUMN     "lastResearched" TIMESTAMP(3),
ADD COLUMN     "researchPriority" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "researchVersion" TEXT,
ADD COLUMN     "subtopicsGenerated" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "GeneratedContent_cacheKey_idx" ON "GeneratedContent"("cacheKey");

-- CreateIndex
CREATE INDEX "GeneratedContent_lastAccess_idx" ON "GeneratedContent"("lastAccess");

-- CreateIndex
CREATE INDEX "GeneratedContent_accessCount_idx" ON "GeneratedContent"("accessCount");

-- CreateIndex
CREATE INDEX "GeneratedContent_contentType_createdAt_idx" ON "GeneratedContent"("contentType", "createdAt");

-- CreateIndex
CREATE INDEX "Topic_lastResearched_idx" ON "Topic"("lastResearched");

-- CreateIndex
CREATE INDEX "Topic_cacheStatus_idx" ON "Topic"("cacheStatus");

-- CreateIndex
CREATE INDEX "Topic_researchPriority_idx" ON "Topic"("researchPriority");

-- CreateIndex
CREATE INDEX "Topic_cacheStatus_lastResearched_idx" ON "Topic"("cacheStatus", "lastResearched");

-- CreateIndex
CREATE INDEX "Topic_status_researchPriority_idx" ON "Topic"("status", "researchPriority");
