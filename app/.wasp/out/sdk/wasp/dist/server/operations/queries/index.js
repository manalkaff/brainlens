import { prisma } from 'wasp/server';
import { createAuthenticatedOperation, } from '../wrappers.js';
import { getPaginatedUsers as getPaginatedUsers_ext } from 'wasp/src/user/operations';
import { getGptResponses as getGptResponses_ext } from 'wasp/src/demo-ai-app/operations';
import { getAllTasksByUser as getAllTasksByUser_ext } from 'wasp/src/demo-ai-app/operations';
import { getCustomerPortalUrl as getCustomerPortalUrl_ext } from 'wasp/src/payment/operations';
import { getAllFilesByUser as getAllFilesByUser_ext } from 'wasp/src/file-upload/operations';
import { getDownloadFileSignedURL as getDownloadFileSignedURL_ext } from 'wasp/src/file-upload/operations';
import { getDailyStats as getDailyStats_ext } from 'wasp/src/analytics/operations';
import { getTopic as getTopic_ext } from 'wasp/src/learning/operations';
import { getTopicTree as getTopicTree_ext } from 'wasp/src/learning/operations';
import { getUserProgressStats as getUserProgressStats_ext } from 'wasp/src/learning/operations';
import { getTopicProgressSummary as getTopicProgressSummary_ext } from 'wasp/src/learning/operations';
import { getTopicSources as getTopicSources_ext } from 'wasp/src/learning/sources/operations';
import { debugTopicData as debugTopicData_ext } from 'wasp/src/learning/sources/operations';
import { getSourceDetails as getSourceDetails_ext } from 'wasp/src/learning/sources/operations';
import { getSourcesByAgent as getSourcesByAgent_ext } from 'wasp/src/learning/sources/operations';
import { getTopicHierarchy as getTopicHierarchy_ext } from 'wasp/src/server/operations/iterativeResearch';
import { getResearchStats as getResearchStats_ext } from 'wasp/src/server/operations/iterativeResearch';
import { getCacheStatistics as getCacheStatistics_ext } from 'wasp/src/server/operations/iterativeResearch';
import { checkResearchFreshness as checkResearchFreshness_ext } from 'wasp/src/server/operations/iterativeResearch';
import { validateMigration as validateMigration_ext } from 'wasp/src/server/operations/migrateToIterativeResearch';
import { getSubtopicContentQuery as getSubtopicContentQuery_ext } from 'wasp/src/learning/operations';
import { getTopicBookmarks as getTopicBookmarks_ext } from 'wasp/src/learning/bookmarks/operations';
import { getReadSections as getReadSections_ext } from 'wasp/src/learning/bookmarks/operations';
import { getChatThread as getChatThread_ext } from 'wasp/src/learning/chat/operations';
import { getChatThreads as getChatThreads_ext } from 'wasp/src/learning/chat/operations';
import { getUserQuizzes as getUserQuizzes_ext } from 'wasp/src/learning/quiz/operations';
import { getQuiz as getQuiz_ext } from 'wasp/src/learning/quiz/operations';
import { checkLearningCredits as checkLearningCredits_ext } from 'wasp/src/learning/subscription/waspOperations';
import { getUserUsageStats as getUserUsageStats_ext } from 'wasp/src/learning/subscription/waspOperations';
import { getUpgradeRecommendation as getUpgradeRecommendation_ext } from 'wasp/src/learning/subscription/waspOperations';
import { getLearningAnalytics as getLearningAnalytics_ext } from 'wasp/src/learning/subscription/waspOperations';
// PUBLIC API
export const getPaginatedUsers = createAuthenticatedOperation(getPaginatedUsers_ext, {
    User: prisma.user,
});
// PUBLIC API
export const getGptResponses = createAuthenticatedOperation(getGptResponses_ext, {
    User: prisma.user,
    GptResponse: prisma.gptResponse,
});
// PUBLIC API
export const getAllTasksByUser = createAuthenticatedOperation(getAllTasksByUser_ext, {
    Task: prisma.task,
});
// PUBLIC API
export const getCustomerPortalUrl = createAuthenticatedOperation(getCustomerPortalUrl_ext, {
    User: prisma.user,
});
// PUBLIC API
export const getAllFilesByUser = createAuthenticatedOperation(getAllFilesByUser_ext, {
    User: prisma.user,
    File: prisma.file,
});
// PUBLIC API
export const getDownloadFileSignedURL = createAuthenticatedOperation(getDownloadFileSignedURL_ext, {
    User: prisma.user,
    File: prisma.file,
});
// PUBLIC API
export const getDailyStats = createAuthenticatedOperation(getDailyStats_ext, {
    User: prisma.user,
    DailyStats: prisma.dailyStats,
});
// PUBLIC API
export const getTopic = createAuthenticatedOperation(getTopic_ext, {
    Topic: prisma.topic,
    UserTopicProgress: prisma.userTopicProgress,
});
// PUBLIC API
export const getTopicTree = createAuthenticatedOperation(getTopicTree_ext, {
    Topic: prisma.topic,
    UserTopicProgress: prisma.userTopicProgress,
});
// PUBLIC API
export const getUserProgressStats = createAuthenticatedOperation(getUserProgressStats_ext, {
    UserTopicProgress: prisma.userTopicProgress,
    Topic: prisma.topic,
});
// PUBLIC API
export const getTopicProgressSummary = createAuthenticatedOperation(getTopicProgressSummary_ext, {
    Topic: prisma.topic,
    UserTopicProgress: prisma.userTopicProgress,
});
// PUBLIC API
export const getTopicSources = createAuthenticatedOperation(getTopicSources_ext, {
    Topic: prisma.topic,
    VectorDocument: prisma.vectorDocument,
});
// PUBLIC API
export const debugTopicData = createAuthenticatedOperation(debugTopicData_ext, {
    Topic: prisma.topic,
    VectorDocument: prisma.vectorDocument,
    GeneratedContent: prisma.generatedContent,
});
// PUBLIC API
export const getSourceDetails = createAuthenticatedOperation(getSourceDetails_ext, {
    VectorDocument: prisma.vectorDocument,
    Topic: prisma.topic,
});
// PUBLIC API
export const getSourcesByAgent = createAuthenticatedOperation(getSourcesByAgent_ext, {
    Topic: prisma.topic,
    VectorDocument: prisma.vectorDocument,
});
// PUBLIC API
export const getTopicHierarchy = createAuthenticatedOperation(getTopicHierarchy_ext, {
    Topic: prisma.topic,
});
// PUBLIC API
export const getResearchStats = createAuthenticatedOperation(getResearchStats_ext, {
    Topic: prisma.topic,
    UserTopicProgress: prisma.userTopicProgress,
    VectorDocument: prisma.vectorDocument,
});
// PUBLIC API
export const getCacheStatistics = createAuthenticatedOperation(getCacheStatistics_ext, {
    GeneratedContent: prisma.generatedContent,
    Topic: prisma.topic,
});
// PUBLIC API
export const checkResearchFreshness = createAuthenticatedOperation(checkResearchFreshness_ext, {
    Topic: prisma.topic,
    GeneratedContent: prisma.generatedContent,
});
// PUBLIC API
export const validateMigration = createAuthenticatedOperation(validateMigration_ext, {
    Topic: prisma.topic,
    GeneratedContent: prisma.generatedContent,
    VectorDocument: prisma.vectorDocument,
});
// PUBLIC API
export const getSubtopicContent = createAuthenticatedOperation(getSubtopicContentQuery_ext, {
    Topic: prisma.topic,
    GeneratedContent: prisma.generatedContent,
});
// PUBLIC API
export const getContentBookmarks = createAuthenticatedOperation(getTopicBookmarks_ext, {
    UserTopicProgress: prisma.userTopicProgress,
    Topic: prisma.topic,
});
// PUBLIC API
export const getReadContent = createAuthenticatedOperation(getReadSections_ext, {
    UserTopicProgress: prisma.userTopicProgress,
    Topic: prisma.topic,
});
// PUBLIC API
export const getChatThread = createAuthenticatedOperation(getChatThread_ext, {
    ChatThread: prisma.chatThread,
    Message: prisma.message,
    Topic: prisma.topic,
});
// PUBLIC API
export const getChatThreads = createAuthenticatedOperation(getChatThreads_ext, {
    ChatThread: prisma.chatThread,
    Message: prisma.message,
    Topic: prisma.topic,
});
// PUBLIC API
export const getUserQuizzes = createAuthenticatedOperation(getUserQuizzes_ext, {
    Quiz: prisma.quiz,
    QuizQuestion: prisma.quizQuestion,
    Topic: prisma.topic,
});
// PUBLIC API
export const getQuiz = createAuthenticatedOperation(getQuiz_ext, {
    Quiz: prisma.quiz,
    QuizQuestion: prisma.quizQuestion,
    Topic: prisma.topic,
});
// PUBLIC API
export const checkLearningCredits = createAuthenticatedOperation(checkLearningCredits_ext, {
    User: prisma.user,
    Topic: prisma.topic,
    Message: prisma.message,
    Quiz: prisma.quiz,
});
// PUBLIC API
export const getUserUsageStats = createAuthenticatedOperation(getUserUsageStats_ext, {
    User: prisma.user,
    Topic: prisma.topic,
    Message: prisma.message,
    Quiz: prisma.quiz,
});
// PUBLIC API
export const getUpgradeRecommendation = createAuthenticatedOperation(getUpgradeRecommendation_ext, {
    User: prisma.user,
    Topic: prisma.topic,
    Message: prisma.message,
    Quiz: prisma.quiz,
});
// PUBLIC API
export const getLearningAnalytics = createAuthenticatedOperation(getLearningAnalytics_ext, {
    User: prisma.user,
    Topic: prisma.topic,
    UserTopicProgress: prisma.userTopicProgress,
    Message: prisma.message,
    Quiz: prisma.quiz,
});
//# sourceMappingURL=index.js.map