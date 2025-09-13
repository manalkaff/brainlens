-- CreateTable
CREATE TABLE "GeneratedContent" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "sources" JSONB,
    "userLevel" TEXT,
    "learningStyle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneratedContent_topicId_idx" ON "GeneratedContent"("topicId");

-- CreateIndex
CREATE INDEX "GeneratedContent_contentType_idx" ON "GeneratedContent"("contentType");

-- CreateIndex
CREATE INDEX "GeneratedContent_createdAt_idx" ON "GeneratedContent"("createdAt");

-- CreateIndex
CREATE INDEX "GeneratedContent_topicId_contentType_idx" ON "GeneratedContent"("topicId", "contentType");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedContent_topicId_contentType_userLevel_learningStyl_key" ON "GeneratedContent"("topicId", "contentType", "userLevel", "learningStyle");

-- AddForeignKey
ALTER TABLE "GeneratedContent" ADD CONSTRAINT "GeneratedContent_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
