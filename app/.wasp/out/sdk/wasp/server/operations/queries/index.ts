
import { prisma } from 'wasp/server'
import {
  type UnauthenticatedOperationFor,
  createUnauthenticatedOperation,
  type AuthenticatedOperationFor,
  createAuthenticatedOperation,
} from '../wrappers.js'
import { getPaginatedUsers as getPaginatedUsers_ext } from 'wasp/src/user/operations'
import { getGptResponses as getGptResponses_ext } from 'wasp/src/demo-ai-app/operations'
import { getAllTasksByUser as getAllTasksByUser_ext } from 'wasp/src/demo-ai-app/operations'
import { getCustomerPortalUrl as getCustomerPortalUrl_ext } from 'wasp/src/payment/operations'
import { getAllFilesByUser as getAllFilesByUser_ext } from 'wasp/src/file-upload/operations'
import { getDownloadFileSignedURL as getDownloadFileSignedURL_ext } from 'wasp/src/file-upload/operations'
import { getDailyStats as getDailyStats_ext } from 'wasp/src/analytics/operations'
import { getTopic as getTopic_ext } from 'wasp/src/learning/operations'
import { getTopicTree as getTopicTree_ext } from 'wasp/src/learning/operations'
import { getUserProgressStats as getUserProgressStats_ext } from 'wasp/src/learning/operations'
import { getTopicProgressSummary as getTopicProgressSummary_ext } from 'wasp/src/learning/operations'
import { getTopicSources as getTopicSources_ext } from 'wasp/src/learning/sources/operations'
import { debugTopicData as debugTopicData_ext } from 'wasp/src/learning/sources/operations'
import { getSourceDetails as getSourceDetails_ext } from 'wasp/src/learning/sources/operations'
import { getSourcesByAgent as getSourcesByAgent_ext } from 'wasp/src/learning/sources/operations'
import { getTopicHierarchy as getTopicHierarchy_ext } from 'wasp/src/server/operations/iterativeResearch'
import { getResearchStats as getResearchStats_ext } from 'wasp/src/server/operations/iterativeResearch'
import { getCacheStatistics as getCacheStatistics_ext } from 'wasp/src/server/operations/iterativeResearch'
import { checkResearchFreshness as checkResearchFreshness_ext } from 'wasp/src/server/operations/iterativeResearch'
import { validateMigration as validateMigration_ext } from 'wasp/src/server/operations/migrateToIterativeResearch'
import { getSubtopicContentQuery as getSubtopicContentQuery_ext } from 'wasp/src/learning/operations'
import { getTopicBookmarks as getTopicBookmarks_ext } from 'wasp/src/learning/bookmarks/operations'
import { getReadSections as getReadSections_ext } from 'wasp/src/learning/bookmarks/operations'
import { getChatThread as getChatThread_ext } from 'wasp/src/learning/chat/operations'
import { getChatThreads as getChatThreads_ext } from 'wasp/src/learning/chat/operations'
import { getUserQuizzes as getUserQuizzes_ext } from 'wasp/src/learning/quiz/operations'
import { getQuiz as getQuiz_ext } from 'wasp/src/learning/quiz/operations'
import { checkLearningCredits as checkLearningCredits_ext } from 'wasp/src/learning/subscription/waspOperations'
import { getUserUsageStats as getUserUsageStats_ext } from 'wasp/src/learning/subscription/waspOperations'
import { getUpgradeRecommendation as getUpgradeRecommendation_ext } from 'wasp/src/learning/subscription/waspOperations'
import { getLearningAnalytics as getLearningAnalytics_ext } from 'wasp/src/learning/subscription/waspOperations'

// PRIVATE API
export type GetPaginatedUsers_ext = typeof getPaginatedUsers_ext

// PUBLIC API
export const getPaginatedUsers: AuthenticatedOperationFor<GetPaginatedUsers_ext> =
  createAuthenticatedOperation(
    getPaginatedUsers_ext,
    {
      User: prisma.user,
    },
  )


// PRIVATE API
export type GetGptResponses_ext = typeof getGptResponses_ext

// PUBLIC API
export const getGptResponses: AuthenticatedOperationFor<GetGptResponses_ext> =
  createAuthenticatedOperation(
    getGptResponses_ext,
    {
      User: prisma.user,
      GptResponse: prisma.gptResponse,
    },
  )


// PRIVATE API
export type GetAllTasksByUser_ext = typeof getAllTasksByUser_ext

// PUBLIC API
export const getAllTasksByUser: AuthenticatedOperationFor<GetAllTasksByUser_ext> =
  createAuthenticatedOperation(
    getAllTasksByUser_ext,
    {
      Task: prisma.task,
    },
  )


// PRIVATE API
export type GetCustomerPortalUrl_ext = typeof getCustomerPortalUrl_ext

// PUBLIC API
export const getCustomerPortalUrl: AuthenticatedOperationFor<GetCustomerPortalUrl_ext> =
  createAuthenticatedOperation(
    getCustomerPortalUrl_ext,
    {
      User: prisma.user,
    },
  )


// PRIVATE API
export type GetAllFilesByUser_ext = typeof getAllFilesByUser_ext

// PUBLIC API
export const getAllFilesByUser: AuthenticatedOperationFor<GetAllFilesByUser_ext> =
  createAuthenticatedOperation(
    getAllFilesByUser_ext,
    {
      User: prisma.user,
      File: prisma.file,
    },
  )


// PRIVATE API
export type GetDownloadFileSignedURL_ext = typeof getDownloadFileSignedURL_ext

// PUBLIC API
export const getDownloadFileSignedURL: AuthenticatedOperationFor<GetDownloadFileSignedURL_ext> =
  createAuthenticatedOperation(
    getDownloadFileSignedURL_ext,
    {
      User: prisma.user,
      File: prisma.file,
    },
  )


// PRIVATE API
export type GetDailyStats_ext = typeof getDailyStats_ext

// PUBLIC API
export const getDailyStats: AuthenticatedOperationFor<GetDailyStats_ext> =
  createAuthenticatedOperation(
    getDailyStats_ext,
    {
      User: prisma.user,
      DailyStats: prisma.dailyStats,
    },
  )


// PRIVATE API
export type GetTopic_ext = typeof getTopic_ext

// PUBLIC API
export const getTopic: AuthenticatedOperationFor<GetTopic_ext> =
  createAuthenticatedOperation(
    getTopic_ext,
    {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
    },
  )


// PRIVATE API
export type GetTopicTree_ext = typeof getTopicTree_ext

// PUBLIC API
export const getTopicTree: AuthenticatedOperationFor<GetTopicTree_ext> =
  createAuthenticatedOperation(
    getTopicTree_ext,
    {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
    },
  )


// PRIVATE API
export type GetUserProgressStats_ext = typeof getUserProgressStats_ext

// PUBLIC API
export const getUserProgressStats: AuthenticatedOperationFor<GetUserProgressStats_ext> =
  createAuthenticatedOperation(
    getUserProgressStats_ext,
    {
      UserTopicProgress: prisma.userTopicProgress,
      Topic: prisma.topic,
    },
  )


// PRIVATE API
export type GetTopicProgressSummary_ext = typeof getTopicProgressSummary_ext

// PUBLIC API
export const getTopicProgressSummary: AuthenticatedOperationFor<GetTopicProgressSummary_ext> =
  createAuthenticatedOperation(
    getTopicProgressSummary_ext,
    {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
    },
  )


// PRIVATE API
export type GetTopicSources_ext = typeof getTopicSources_ext

// PUBLIC API
export const getTopicSources: AuthenticatedOperationFor<GetTopicSources_ext> =
  createAuthenticatedOperation(
    getTopicSources_ext,
    {
      Topic: prisma.topic,
      VectorDocument: prisma.vectorDocument,
    },
  )


// PRIVATE API
export type DebugTopicData_ext = typeof debugTopicData_ext

// PUBLIC API
export const debugTopicData: AuthenticatedOperationFor<DebugTopicData_ext> =
  createAuthenticatedOperation(
    debugTopicData_ext,
    {
      Topic: prisma.topic,
      VectorDocument: prisma.vectorDocument,
      GeneratedContent: prisma.generatedContent,
    },
  )


// PRIVATE API
export type GetSourceDetails_ext = typeof getSourceDetails_ext

// PUBLIC API
export const getSourceDetails: AuthenticatedOperationFor<GetSourceDetails_ext> =
  createAuthenticatedOperation(
    getSourceDetails_ext,
    {
      VectorDocument: prisma.vectorDocument,
      Topic: prisma.topic,
    },
  )


// PRIVATE API
export type GetSourcesByAgent_ext = typeof getSourcesByAgent_ext

// PUBLIC API
export const getSourcesByAgent: AuthenticatedOperationFor<GetSourcesByAgent_ext> =
  createAuthenticatedOperation(
    getSourcesByAgent_ext,
    {
      Topic: prisma.topic,
      VectorDocument: prisma.vectorDocument,
    },
  )


// PRIVATE API
export type GetTopicHierarchy_ext = typeof getTopicHierarchy_ext

// PUBLIC API
export const getTopicHierarchy: AuthenticatedOperationFor<GetTopicHierarchy_ext> =
  createAuthenticatedOperation(
    getTopicHierarchy_ext,
    {
      Topic: prisma.topic,
    },
  )


// PRIVATE API
export type GetResearchStats_ext = typeof getResearchStats_ext

// PUBLIC API
export const getResearchStats: AuthenticatedOperationFor<GetResearchStats_ext> =
  createAuthenticatedOperation(
    getResearchStats_ext,
    {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
      VectorDocument: prisma.vectorDocument,
    },
  )


// PRIVATE API
export type GetCacheStatistics_ext = typeof getCacheStatistics_ext

// PUBLIC API
export const getCacheStatistics: AuthenticatedOperationFor<GetCacheStatistics_ext> =
  createAuthenticatedOperation(
    getCacheStatistics_ext,
    {
      GeneratedContent: prisma.generatedContent,
      Topic: prisma.topic,
    },
  )


// PRIVATE API
export type CheckResearchFreshness_ext = typeof checkResearchFreshness_ext

// PUBLIC API
export const checkResearchFreshness: AuthenticatedOperationFor<CheckResearchFreshness_ext> =
  createAuthenticatedOperation(
    checkResearchFreshness_ext,
    {
      Topic: prisma.topic,
      GeneratedContent: prisma.generatedContent,
    },
  )


// PRIVATE API
export type ValidateMigration_ext = typeof validateMigration_ext

// PUBLIC API
export const validateMigration: AuthenticatedOperationFor<ValidateMigration_ext> =
  createAuthenticatedOperation(
    validateMigration_ext,
    {
      Topic: prisma.topic,
      GeneratedContent: prisma.generatedContent,
      VectorDocument: prisma.vectorDocument,
    },
  )


// PRIVATE API
export type GetSubtopicContent_ext = typeof getSubtopicContentQuery_ext

// PUBLIC API
export const getSubtopicContent: AuthenticatedOperationFor<GetSubtopicContent_ext> =
  createAuthenticatedOperation(
    getSubtopicContentQuery_ext,
    {
      Topic: prisma.topic,
      GeneratedContent: prisma.generatedContent,
    },
  )


// PRIVATE API
export type GetContentBookmarks_ext = typeof getTopicBookmarks_ext

// PUBLIC API
export const getContentBookmarks: AuthenticatedOperationFor<GetContentBookmarks_ext> =
  createAuthenticatedOperation(
    getTopicBookmarks_ext,
    {
      UserTopicProgress: prisma.userTopicProgress,
      Topic: prisma.topic,
    },
  )


// PRIVATE API
export type GetReadContent_ext = typeof getReadSections_ext

// PUBLIC API
export const getReadContent: AuthenticatedOperationFor<GetReadContent_ext> =
  createAuthenticatedOperation(
    getReadSections_ext,
    {
      UserTopicProgress: prisma.userTopicProgress,
      Topic: prisma.topic,
    },
  )


// PRIVATE API
export type GetChatThread_ext = typeof getChatThread_ext

// PUBLIC API
export const getChatThread: AuthenticatedOperationFor<GetChatThread_ext> =
  createAuthenticatedOperation(
    getChatThread_ext,
    {
      ChatThread: prisma.chatThread,
      Message: prisma.message,
      Topic: prisma.topic,
    },
  )


// PRIVATE API
export type GetChatThreads_ext = typeof getChatThreads_ext

// PUBLIC API
export const getChatThreads: AuthenticatedOperationFor<GetChatThreads_ext> =
  createAuthenticatedOperation(
    getChatThreads_ext,
    {
      ChatThread: prisma.chatThread,
      Message: prisma.message,
      Topic: prisma.topic,
    },
  )


// PRIVATE API
export type GetUserQuizzes_ext = typeof getUserQuizzes_ext

// PUBLIC API
export const getUserQuizzes: AuthenticatedOperationFor<GetUserQuizzes_ext> =
  createAuthenticatedOperation(
    getUserQuizzes_ext,
    {
      Quiz: prisma.quiz,
      QuizQuestion: prisma.quizQuestion,
      Topic: prisma.topic,
    },
  )


// PRIVATE API
export type GetQuiz_ext = typeof getQuiz_ext

// PUBLIC API
export const getQuiz: AuthenticatedOperationFor<GetQuiz_ext> =
  createAuthenticatedOperation(
    getQuiz_ext,
    {
      Quiz: prisma.quiz,
      QuizQuestion: prisma.quizQuestion,
      Topic: prisma.topic,
    },
  )


// PRIVATE API
export type CheckLearningCredits_ext = typeof checkLearningCredits_ext

// PUBLIC API
export const checkLearningCredits: AuthenticatedOperationFor<CheckLearningCredits_ext> =
  createAuthenticatedOperation(
    checkLearningCredits_ext,
    {
      User: prisma.user,
      Topic: prisma.topic,
      Message: prisma.message,
      Quiz: prisma.quiz,
    },
  )


// PRIVATE API
export type GetUserUsageStats_ext = typeof getUserUsageStats_ext

// PUBLIC API
export const getUserUsageStats: AuthenticatedOperationFor<GetUserUsageStats_ext> =
  createAuthenticatedOperation(
    getUserUsageStats_ext,
    {
      User: prisma.user,
      Topic: prisma.topic,
      Message: prisma.message,
      Quiz: prisma.quiz,
    },
  )


// PRIVATE API
export type GetUpgradeRecommendation_ext = typeof getUpgradeRecommendation_ext

// PUBLIC API
export const getUpgradeRecommendation: AuthenticatedOperationFor<GetUpgradeRecommendation_ext> =
  createAuthenticatedOperation(
    getUpgradeRecommendation_ext,
    {
      User: prisma.user,
      Topic: prisma.topic,
      Message: prisma.message,
      Quiz: prisma.quiz,
    },
  )


// PRIVATE API
export type GetLearningAnalytics_ext = typeof getLearningAnalytics_ext

// PUBLIC API
export const getLearningAnalytics: AuthenticatedOperationFor<GetLearningAnalytics_ext> =
  createAuthenticatedOperation(
    getLearningAnalytics_ext,
    {
      User: prisma.user,
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
      Message: prisma.message,
      Quiz: prisma.quiz,
    },
  )

