import { createQuery } from './core';
// PUBLIC API
export const getPaginatedUsers = createQuery('operations/get-paginated-users', ['User']);
// PUBLIC API
export const getGptResponses = createQuery('operations/get-gpt-responses', ['User', 'GptResponse']);
// PUBLIC API
export const getAllTasksByUser = createQuery('operations/get-all-tasks-by-user', ['Task']);
// PUBLIC API
export const getCustomerPortalUrl = createQuery('operations/get-customer-portal-url', ['User']);
// PUBLIC API
export const getAllFilesByUser = createQuery('operations/get-all-files-by-user', ['User', 'File']);
// PUBLIC API
export const getDownloadFileSignedURL = createQuery('operations/get-download-file-signed-url', ['User', 'File']);
// PUBLIC API
export const getDailyStats = createQuery('operations/get-daily-stats', ['User', 'DailyStats']);
// PUBLIC API
export const getTopic = createQuery('operations/get-topic', ['Topic', 'UserTopicProgress']);
// PUBLIC API
export const getTopicTree = createQuery('operations/get-topic-tree', ['Topic', 'UserTopicProgress']);
// PUBLIC API
export const getUserProgressStats = createQuery('operations/get-user-progress-stats', ['UserTopicProgress', 'Topic']);
// PUBLIC API
export const getTopicProgressSummary = createQuery('operations/get-topic-progress-summary', ['Topic', 'UserTopicProgress']);
// PUBLIC API
export const getTopicSources = createQuery('operations/get-topic-sources', ['Topic', 'VectorDocument']);
// PUBLIC API
export const debugTopicData = createQuery('operations/debug-topic-data', ['Topic', 'VectorDocument', 'GeneratedContent']);
// PUBLIC API
export const getSourceDetails = createQuery('operations/get-source-details', ['VectorDocument', 'Topic']);
// PUBLIC API
export const getSourcesByAgent = createQuery('operations/get-sources-by-agent', ['Topic', 'VectorDocument']);
// PUBLIC API
export const getTopicHierarchy = createQuery('operations/get-topic-hierarchy', ['Topic']);
// PUBLIC API
export const getResearchStats = createQuery('operations/get-research-stats', ['Topic', 'UserTopicProgress', 'VectorDocument']);
// PUBLIC API
export const getCacheStatistics = createQuery('operations/get-cache-statistics', ['GeneratedContent', 'Topic']);
// PUBLIC API
export const checkResearchFreshness = createQuery('operations/check-research-freshness', ['Topic', 'GeneratedContent']);
// PUBLIC API
export const validateMigration = createQuery('operations/validate-migration', ['Topic', 'GeneratedContent', 'VectorDocument']);
// PUBLIC API
export const getSubtopicContent = createQuery('operations/get-subtopic-content', ['Topic', 'GeneratedContent']);
// PUBLIC API
export const getContentBookmarks = createQuery('operations/get-content-bookmarks', ['UserTopicProgress', 'Topic']);
// PUBLIC API
export const getReadContent = createQuery('operations/get-read-content', ['UserTopicProgress', 'Topic']);
// PUBLIC API
export const getChatThread = createQuery('operations/get-chat-thread', ['ChatThread', 'Message', 'Topic']);
// PUBLIC API
export const getChatThreads = createQuery('operations/get-chat-threads', ['ChatThread', 'Message', 'Topic']);
// PUBLIC API
export const getUserQuizzes = createQuery('operations/get-user-quizzes', ['Quiz', 'QuizQuestion', 'Topic']);
// PUBLIC API
export const getQuiz = createQuery('operations/get-quiz', ['Quiz', 'QuizQuestion', 'Topic']);
// PUBLIC API
export const checkLearningCredits = createQuery('operations/check-learning-credits', ['User', 'Topic', 'Message', 'Quiz']);
// PUBLIC API
export const getUserUsageStats = createQuery('operations/get-user-usage-stats', ['User', 'Topic', 'Message', 'Quiz']);
// PUBLIC API
export const getUpgradeRecommendation = createQuery('operations/get-upgrade-recommendation', ['User', 'Topic', 'Message', 'Quiz']);
// PUBLIC API
export const getLearningAnalytics = createQuery('operations/get-learning-analytics', ['User', 'Topic', 'UserTopicProgress', 'Message', 'Quiz']);
// PRIVATE API (used in SDK)
export { buildAndRegisterQuery } from './core';
//# sourceMappingURL=index.js.map