-- CreateIndex
CREATE INDEX "Topic_depth_idx" ON "Topic"("depth");

-- CreateIndex
CREATE INDEX "Topic_createdAt_idx" ON "Topic"("createdAt");

-- CreateIndex
CREATE INDEX "Topic_updatedAt_idx" ON "Topic"("updatedAt");

-- CreateIndex
CREATE INDEX "Topic_status_depth_idx" ON "Topic"("status", "depth");

-- CreateIndex
CREATE INDEX "Topic_parentId_depth_idx" ON "Topic"("parentId", "depth");

-- CreateIndex
CREATE INDEX "UserTopicProgress_completed_idx" ON "UserTopicProgress"("completed");

-- CreateIndex
CREATE INDEX "UserTopicProgress_userId_completed_idx" ON "UserTopicProgress"("userId", "completed");

-- CreateIndex
CREATE INDEX "UserTopicProgress_userId_lastAccessed_idx" ON "UserTopicProgress"("userId", "lastAccessed");

-- CreateIndex
CREATE INDEX "UserTopicProgress_topicId_completed_idx" ON "UserTopicProgress"("topicId", "completed");

-- CreateIndex
CREATE INDEX "VectorDocument_topicId_createdAt_idx" ON "VectorDocument"("topicId", "createdAt");
