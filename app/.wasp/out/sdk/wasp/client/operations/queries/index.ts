import { type QueryFor, createQuery } from './core'
import { GetPaginatedUsers_ext } from 'wasp/server/operations/queries'
import { GetGptResponses_ext } from 'wasp/server/operations/queries'
import { GetAllTasksByUser_ext } from 'wasp/server/operations/queries'
import { GetCustomerPortalUrl_ext } from 'wasp/server/operations/queries'
import { GetAllFilesByUser_ext } from 'wasp/server/operations/queries'
import { GetDownloadFileSignedURL_ext } from 'wasp/server/operations/queries'
import { GetDailyStats_ext } from 'wasp/server/operations/queries'
import { GetTopic_ext } from 'wasp/server/operations/queries'
import { GetTopicTree_ext } from 'wasp/server/operations/queries'
import { GetUserProgressStats_ext } from 'wasp/server/operations/queries'
import { GetTopicProgressSummary_ext } from 'wasp/server/operations/queries'
import { GetTopicSources_ext } from 'wasp/server/operations/queries'
import { DebugTopicData_ext } from 'wasp/server/operations/queries'
import { GetSourceDetails_ext } from 'wasp/server/operations/queries'
import { GetSourcesByAgent_ext } from 'wasp/server/operations/queries'
import { GetTopicHierarchy_ext } from 'wasp/server/operations/queries'
import { GetResearchStats_ext } from 'wasp/server/operations/queries'
import { GetCacheStatistics_ext } from 'wasp/server/operations/queries'
import { CheckResearchFreshness_ext } from 'wasp/server/operations/queries'
import { ValidateMigration_ext } from 'wasp/server/operations/queries'
import { GetSubtopicContent_ext } from 'wasp/server/operations/queries'
import { GetContentBookmarks_ext } from 'wasp/server/operations/queries'
import { GetReadContent_ext } from 'wasp/server/operations/queries'
import { GetChatThread_ext } from 'wasp/server/operations/queries'
import { GetChatThreads_ext } from 'wasp/server/operations/queries'
import { GetUserQuizzes_ext } from 'wasp/server/operations/queries'
import { GetQuiz_ext } from 'wasp/server/operations/queries'
import { CheckLearningCredits_ext } from 'wasp/server/operations/queries'
import { GetUserUsageStats_ext } from 'wasp/server/operations/queries'
import { GetUpgradeRecommendation_ext } from 'wasp/server/operations/queries'
import { GetLearningAnalytics_ext } from 'wasp/server/operations/queries'

// PUBLIC API
export const getPaginatedUsers: QueryFor<GetPaginatedUsers_ext> = createQuery<GetPaginatedUsers_ext>(
  'operations/get-paginated-users',
  ['User'],
)

// PUBLIC API
export const getGptResponses: QueryFor<GetGptResponses_ext> = createQuery<GetGptResponses_ext>(
  'operations/get-gpt-responses',
  ['User', 'GptResponse'],
)

// PUBLIC API
export const getAllTasksByUser: QueryFor<GetAllTasksByUser_ext> = createQuery<GetAllTasksByUser_ext>(
  'operations/get-all-tasks-by-user',
  ['Task'],
)

// PUBLIC API
export const getCustomerPortalUrl: QueryFor<GetCustomerPortalUrl_ext> = createQuery<GetCustomerPortalUrl_ext>(
  'operations/get-customer-portal-url',
  ['User'],
)

// PUBLIC API
export const getAllFilesByUser: QueryFor<GetAllFilesByUser_ext> = createQuery<GetAllFilesByUser_ext>(
  'operations/get-all-files-by-user',
  ['User', 'File'],
)

// PUBLIC API
export const getDownloadFileSignedURL: QueryFor<GetDownloadFileSignedURL_ext> = createQuery<GetDownloadFileSignedURL_ext>(
  'operations/get-download-file-signed-url',
  ['User', 'File'],
)

// PUBLIC API
export const getDailyStats: QueryFor<GetDailyStats_ext> = createQuery<GetDailyStats_ext>(
  'operations/get-daily-stats',
  ['User', 'DailyStats'],
)

// PUBLIC API
export const getTopic: QueryFor<GetTopic_ext> = createQuery<GetTopic_ext>(
  'operations/get-topic',
  ['Topic', 'UserTopicProgress'],
)

// PUBLIC API
export const getTopicTree: QueryFor<GetTopicTree_ext> = createQuery<GetTopicTree_ext>(
  'operations/get-topic-tree',
  ['Topic', 'UserTopicProgress'],
)

// PUBLIC API
export const getUserProgressStats: QueryFor<GetUserProgressStats_ext> = createQuery<GetUserProgressStats_ext>(
  'operations/get-user-progress-stats',
  ['UserTopicProgress', 'Topic'],
)

// PUBLIC API
export const getTopicProgressSummary: QueryFor<GetTopicProgressSummary_ext> = createQuery<GetTopicProgressSummary_ext>(
  'operations/get-topic-progress-summary',
  ['Topic', 'UserTopicProgress'],
)

// PUBLIC API
export const getTopicSources: QueryFor<GetTopicSources_ext> = createQuery<GetTopicSources_ext>(
  'operations/get-topic-sources',
  ['Topic', 'VectorDocument'],
)

// PUBLIC API
export const debugTopicData: QueryFor<DebugTopicData_ext> = createQuery<DebugTopicData_ext>(
  'operations/debug-topic-data',
  ['Topic', 'VectorDocument', 'GeneratedContent'],
)

// PUBLIC API
export const getSourceDetails: QueryFor<GetSourceDetails_ext> = createQuery<GetSourceDetails_ext>(
  'operations/get-source-details',
  ['VectorDocument', 'Topic'],
)

// PUBLIC API
export const getSourcesByAgent: QueryFor<GetSourcesByAgent_ext> = createQuery<GetSourcesByAgent_ext>(
  'operations/get-sources-by-agent',
  ['Topic', 'VectorDocument'],
)

// PUBLIC API
export const getTopicHierarchy: QueryFor<GetTopicHierarchy_ext> = createQuery<GetTopicHierarchy_ext>(
  'operations/get-topic-hierarchy',
  ['Topic'],
)

// PUBLIC API
export const getResearchStats: QueryFor<GetResearchStats_ext> = createQuery<GetResearchStats_ext>(
  'operations/get-research-stats',
  ['Topic', 'UserTopicProgress', 'VectorDocument'],
)

// PUBLIC API
export const getCacheStatistics: QueryFor<GetCacheStatistics_ext> = createQuery<GetCacheStatistics_ext>(
  'operations/get-cache-statistics',
  ['GeneratedContent', 'Topic'],
)

// PUBLIC API
export const checkResearchFreshness: QueryFor<CheckResearchFreshness_ext> = createQuery<CheckResearchFreshness_ext>(
  'operations/check-research-freshness',
  ['Topic', 'GeneratedContent'],
)

// PUBLIC API
export const validateMigration: QueryFor<ValidateMigration_ext> = createQuery<ValidateMigration_ext>(
  'operations/validate-migration',
  ['Topic', 'GeneratedContent', 'VectorDocument'],
)

// PUBLIC API
export const getSubtopicContent: QueryFor<GetSubtopicContent_ext> = createQuery<GetSubtopicContent_ext>(
  'operations/get-subtopic-content',
  ['Topic', 'GeneratedContent'],
)

// PUBLIC API
export const getContentBookmarks: QueryFor<GetContentBookmarks_ext> = createQuery<GetContentBookmarks_ext>(
  'operations/get-content-bookmarks',
  ['UserTopicProgress', 'Topic'],
)

// PUBLIC API
export const getReadContent: QueryFor<GetReadContent_ext> = createQuery<GetReadContent_ext>(
  'operations/get-read-content',
  ['UserTopicProgress', 'Topic'],
)

// PUBLIC API
export const getChatThread: QueryFor<GetChatThread_ext> = createQuery<GetChatThread_ext>(
  'operations/get-chat-thread',
  ['ChatThread', 'Message', 'Topic'],
)

// PUBLIC API
export const getChatThreads: QueryFor<GetChatThreads_ext> = createQuery<GetChatThreads_ext>(
  'operations/get-chat-threads',
  ['ChatThread', 'Message', 'Topic'],
)

// PUBLIC API
export const getUserQuizzes: QueryFor<GetUserQuizzes_ext> = createQuery<GetUserQuizzes_ext>(
  'operations/get-user-quizzes',
  ['Quiz', 'QuizQuestion', 'Topic'],
)

// PUBLIC API
export const getQuiz: QueryFor<GetQuiz_ext> = createQuery<GetQuiz_ext>(
  'operations/get-quiz',
  ['Quiz', 'QuizQuestion', 'Topic'],
)

// PUBLIC API
export const checkLearningCredits: QueryFor<CheckLearningCredits_ext> = createQuery<CheckLearningCredits_ext>(
  'operations/check-learning-credits',
  ['User', 'Topic', 'Message', 'Quiz'],
)

// PUBLIC API
export const getUserUsageStats: QueryFor<GetUserUsageStats_ext> = createQuery<GetUserUsageStats_ext>(
  'operations/get-user-usage-stats',
  ['User', 'Topic', 'Message', 'Quiz'],
)

// PUBLIC API
export const getUpgradeRecommendation: QueryFor<GetUpgradeRecommendation_ext> = createQuery<GetUpgradeRecommendation_ext>(
  'operations/get-upgrade-recommendation',
  ['User', 'Topic', 'Message', 'Quiz'],
)

// PUBLIC API
export const getLearningAnalytics: QueryFor<GetLearningAnalytics_ext> = createQuery<GetLearningAnalytics_ext>(
  'operations/get-learning-analytics',
  ['User', 'Topic', 'UserTopicProgress', 'Message', 'Quiz'],
)

// PRIVATE API (used in SDK)
export { buildAndRegisterQuery } from './core'
