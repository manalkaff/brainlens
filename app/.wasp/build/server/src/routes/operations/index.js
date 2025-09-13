import express from 'express'

import auth from 'wasp/core/auth'

import updateIsUserAdminById from './updateIsUserAdminById.js'
import generateGptResponse from './generateGptResponse.js'
import createTask from './createTask.js'
import deleteTask from './deleteTask.js'
import updateTask from './updateTask.js'
import generateCheckoutSession from './generateCheckoutSession.js'
import createFile from './createFile.js'
import createTopic from './createTopic.js'
import updateTopicProgress from './updateTopicProgress.js'
import fixTopicSources from './fixTopicSources.js'
import exportTopicSources from './exportTopicSources.js'
import generateAssessmentContent from './generateAssessmentContent.js'
import generatePersonalizedPath from './generatePersonalizedPath.js'
import generateStartingPoint from './generateStartingPoint.js'
import streamAssessmentContent from './streamAssessmentContent.js'
import startIterativeResearch from './startIterativeResearch.js'
import expandTopicDepth from './expandTopicDepth.js'
import generateSubtopicsForTopic from './generateSubtopicsForTopic.js'
import cleanupCache from './cleanupCache.js'
import migrateToIterativeResearch from './migrateToIterativeResearch.js'
import cleanupOldSystem from './cleanupOldSystem.js'
import addContentBookmark from './addContentBookmark.js'
import removeContentBookmark from './removeContentBookmark.js'
import markContentAsRead from './markContentAsRead.js'
import exportTopicContent from './exportTopicContent.js'
import createChatThread from './createChatThread.js'
import sendMessage from './sendMessage.js'
import updateChatThread from './updateChatThread.js'
import exportChatThread from './exportChatThread.js'
import generateQuiz from './generateQuiz.js'
import submitQuizAnswer from './submitQuizAnswer.js'
import consumeLearningCredits from './consumeLearningCredits.js'
import updateUserLearningQuota from './updateUserLearningQuota.js'
import getPaginatedUsers from './getPaginatedUsers.js'
import getGptResponses from './getGptResponses.js'
import getAllTasksByUser from './getAllTasksByUser.js'
import getCustomerPortalUrl from './getCustomerPortalUrl.js'
import getAllFilesByUser from './getAllFilesByUser.js'
import getDownloadFileSignedURL from './getDownloadFileSignedURL.js'
import getDailyStats from './getDailyStats.js'
import getTopic from './getTopic.js'
import getTopicTree from './getTopicTree.js'
import getUserProgressStats from './getUserProgressStats.js'
import getTopicProgressSummary from './getTopicProgressSummary.js'
import getTopicSources from './getTopicSources.js'
import debugTopicData from './debugTopicData.js'
import getSourceDetails from './getSourceDetails.js'
import getSourcesByAgent from './getSourcesByAgent.js'
import getTopicHierarchy from './getTopicHierarchy.js'
import getResearchStats from './getResearchStats.js'
import getCacheStatistics from './getCacheStatistics.js'
import checkResearchFreshness from './checkResearchFreshness.js'
import validateMigration from './validateMigration.js'
import getSubtopicContent from './getSubtopicContent.js'
import getContentBookmarks from './getContentBookmarks.js'
import getReadContent from './getReadContent.js'
import getChatThread from './getChatThread.js'
import getChatThreads from './getChatThreads.js'
import getUserQuizzes from './getUserQuizzes.js'
import getQuiz from './getQuiz.js'
import checkLearningCredits from './checkLearningCredits.js'
import getUserUsageStats from './getUserUsageStats.js'
import getUpgradeRecommendation from './getUpgradeRecommendation.js'
import getLearningAnalytics from './getLearningAnalytics.js'

const router = express.Router()

router.post('/update-is-user-admin-by-id', auth, updateIsUserAdminById)
router.post('/generate-gpt-response', auth, generateGptResponse)
router.post('/create-task', auth, createTask)
router.post('/delete-task', auth, deleteTask)
router.post('/update-task', auth, updateTask)
router.post('/generate-checkout-session', auth, generateCheckoutSession)
router.post('/create-file', auth, createFile)
router.post('/create-topic', auth, createTopic)
router.post('/update-topic-progress', auth, updateTopicProgress)
router.post('/fix-topic-sources', auth, fixTopicSources)
router.post('/export-topic-sources', auth, exportTopicSources)
router.post('/generate-assessment-content', auth, generateAssessmentContent)
router.post('/generate-personalized-path', auth, generatePersonalizedPath)
router.post('/generate-starting-point', auth, generateStartingPoint)
router.post('/stream-assessment-content', auth, streamAssessmentContent)
router.post('/start-iterative-research', auth, startIterativeResearch)
router.post('/expand-topic-depth', auth, expandTopicDepth)
router.post('/generate-subtopics-for-topic', auth, generateSubtopicsForTopic)
router.post('/cleanup-cache', auth, cleanupCache)
router.post('/migrate-to-iterative-research', auth, migrateToIterativeResearch)
router.post('/cleanup-old-system', auth, cleanupOldSystem)
router.post('/add-content-bookmark', auth, addContentBookmark)
router.post('/remove-content-bookmark', auth, removeContentBookmark)
router.post('/mark-content-as-read', auth, markContentAsRead)
router.post('/export-topic-content', auth, exportTopicContent)
router.post('/create-chat-thread', auth, createChatThread)
router.post('/send-message', auth, sendMessage)
router.post('/update-chat-thread', auth, updateChatThread)
router.post('/export-chat-thread', auth, exportChatThread)
router.post('/generate-quiz', auth, generateQuiz)
router.post('/submit-quiz-answer', auth, submitQuizAnswer)
router.post('/consume-learning-credits', auth, consumeLearningCredits)
router.post('/update-user-learning-quota', auth, updateUserLearningQuota)
router.post('/get-paginated-users', auth, getPaginatedUsers)
router.post('/get-gpt-responses', auth, getGptResponses)
router.post('/get-all-tasks-by-user', auth, getAllTasksByUser)
router.post('/get-customer-portal-url', auth, getCustomerPortalUrl)
router.post('/get-all-files-by-user', auth, getAllFilesByUser)
router.post('/get-download-file-signed-url', auth, getDownloadFileSignedURL)
router.post('/get-daily-stats', auth, getDailyStats)
router.post('/get-topic', auth, getTopic)
router.post('/get-topic-tree', auth, getTopicTree)
router.post('/get-user-progress-stats', auth, getUserProgressStats)
router.post('/get-topic-progress-summary', auth, getTopicProgressSummary)
router.post('/get-topic-sources', auth, getTopicSources)
router.post('/debug-topic-data', auth, debugTopicData)
router.post('/get-source-details', auth, getSourceDetails)
router.post('/get-sources-by-agent', auth, getSourcesByAgent)
router.post('/get-topic-hierarchy', auth, getTopicHierarchy)
router.post('/get-research-stats', auth, getResearchStats)
router.post('/get-cache-statistics', auth, getCacheStatistics)
router.post('/check-research-freshness', auth, checkResearchFreshness)
router.post('/validate-migration', auth, validateMigration)
router.post('/get-subtopic-content', auth, getSubtopicContent)
router.post('/get-content-bookmarks', auth, getContentBookmarks)
router.post('/get-read-content', auth, getReadContent)
router.post('/get-chat-thread', auth, getChatThread)
router.post('/get-chat-threads', auth, getChatThreads)
router.post('/get-user-quizzes', auth, getUserQuizzes)
router.post('/get-quiz', auth, getQuiz)
router.post('/check-learning-credits', auth, checkLearningCredits)
router.post('/get-user-usage-stats', auth, getUserUsageStats)
router.post('/get-upgrade-recommendation', auth, getUpgradeRecommendation)
router.post('/get-learning-analytics', auth, getLearningAnalytics)

export default router
