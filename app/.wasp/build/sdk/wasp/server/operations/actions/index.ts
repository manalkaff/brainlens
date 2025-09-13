
import { prisma } from 'wasp/server'
import {
  type UnauthenticatedOperationFor,
  createUnauthenticatedOperation,
  type AuthenticatedOperationFor,
  createAuthenticatedOperation,
} from '../wrappers.js'
import { updateIsUserAdminById as updateIsUserAdminById_ext } from 'wasp/src/user/operations'
import { generateGptResponse as generateGptResponse_ext } from 'wasp/src/demo-ai-app/operations'
import { createTask as createTask_ext } from 'wasp/src/demo-ai-app/operations'
import { deleteTask as deleteTask_ext } from 'wasp/src/demo-ai-app/operations'
import { updateTask as updateTask_ext } from 'wasp/src/demo-ai-app/operations'
import { generateCheckoutSession as generateCheckoutSession_ext } from 'wasp/src/payment/operations'
import { createFile as createFile_ext } from 'wasp/src/file-upload/operations'
import { createTopic as createTopic_ext } from 'wasp/src/learning/operations'
import { updateTopicProgress as updateTopicProgress_ext } from 'wasp/src/learning/operations'
import { fixTopicSources as fixTopicSources_ext } from 'wasp/src/learning/sources/operations'
import { exportTopicSources as exportTopicSources_ext } from 'wasp/src/learning/sources/operations'
import { generateAssessmentContent as generateAssessmentContent_ext } from 'wasp/src/learning/assessment/operations'
import { generatePersonalizedPath as generatePersonalizedPath_ext } from 'wasp/src/learning/assessment/operations'
import { generateStartingPoint as generateStartingPoint_ext } from 'wasp/src/learning/assessment/operations'
import { streamAssessmentContent as streamAssessmentContent_ext } from 'wasp/src/learning/assessment/operations'
import { startIterativeResearch as startIterativeResearch_ext } from 'wasp/src/server/operations/iterativeResearch'
import { expandTopicDepth as expandTopicDepth_ext } from 'wasp/src/server/operations/iterativeResearch'
import { generateSubtopics as generateSubtopics_ext } from 'wasp/src/server/operations/iterativeResearch'
import { cleanupCache as cleanupCache_ext } from 'wasp/src/server/operations/iterativeResearch'
import { migrateToIterativeResearch as migrateToIterativeResearch_ext } from 'wasp/src/server/operations/migrateToIterativeResearch'
import { cleanupOldSystem as cleanupOldSystem_ext } from 'wasp/src/server/operations/migrateToIterativeResearch'
import { addBookmark as addBookmark_ext } from 'wasp/src/learning/bookmarks/operations'
import { removeBookmark as removeBookmark_ext } from 'wasp/src/learning/bookmarks/operations'
import { markSectionAsRead as markSectionAsRead_ext } from 'wasp/src/learning/bookmarks/operations'
import { exportTopicContent as exportTopicContent_ext } from 'wasp/src/learning/bookmarks/operations'
import { createChatThread as createChatThread_ext } from 'wasp/src/learning/chat/operations'
import { sendMessage as sendMessage_ext } from 'wasp/src/learning/chat/operations'
import { updateChatThread as updateChatThread_ext } from 'wasp/src/learning/chat/operations'
import { exportChatThread as exportChatThread_ext } from 'wasp/src/learning/chat/operations'
import { generateQuiz as generateQuiz_ext } from 'wasp/src/learning/quiz/operations'
import { submitQuizAnswer as submitQuizAnswer_ext } from 'wasp/src/learning/quiz/operations'
import { consumeLearningCredits as consumeLearningCredits_ext } from 'wasp/src/learning/subscription/waspOperations'
import { updateUserLearningQuota as updateUserLearningQuota_ext } from 'wasp/src/learning/subscription/waspOperations'

// PRIVATE API
export type UpdateIsUserAdminById_ext = typeof updateIsUserAdminById_ext

// PUBLIC API
export const updateIsUserAdminById: AuthenticatedOperationFor<UpdateIsUserAdminById_ext> =
  createAuthenticatedOperation(
    updateIsUserAdminById_ext,
    {
      User: prisma.user,
    },
  )

// PRIVATE API
export type GenerateGptResponse_ext = typeof generateGptResponse_ext

// PUBLIC API
export const generateGptResponse: AuthenticatedOperationFor<GenerateGptResponse_ext> =
  createAuthenticatedOperation(
    generateGptResponse_ext,
    {
      User: prisma.user,
      Task: prisma.task,
      GptResponse: prisma.gptResponse,
    },
  )

// PRIVATE API
export type CreateTask_ext = typeof createTask_ext

// PUBLIC API
export const createTask: AuthenticatedOperationFor<CreateTask_ext> =
  createAuthenticatedOperation(
    createTask_ext,
    {
      Task: prisma.task,
    },
  )

// PRIVATE API
export type DeleteTask_ext = typeof deleteTask_ext

// PUBLIC API
export const deleteTask: AuthenticatedOperationFor<DeleteTask_ext> =
  createAuthenticatedOperation(
    deleteTask_ext,
    {
      Task: prisma.task,
    },
  )

// PRIVATE API
export type UpdateTask_ext = typeof updateTask_ext

// PUBLIC API
export const updateTask: AuthenticatedOperationFor<UpdateTask_ext> =
  createAuthenticatedOperation(
    updateTask_ext,
    {
      Task: prisma.task,
    },
  )

// PRIVATE API
export type GenerateCheckoutSession_ext = typeof generateCheckoutSession_ext

// PUBLIC API
export const generateCheckoutSession: AuthenticatedOperationFor<GenerateCheckoutSession_ext> =
  createAuthenticatedOperation(
    generateCheckoutSession_ext,
    {
      User: prisma.user,
    },
  )

// PRIVATE API
export type CreateFile_ext = typeof createFile_ext

// PUBLIC API
export const createFile: AuthenticatedOperationFor<CreateFile_ext> =
  createAuthenticatedOperation(
    createFile_ext,
    {
      User: prisma.user,
      File: prisma.file,
    },
  )

// PRIVATE API
export type CreateTopic_ext = typeof createTopic_ext

// PUBLIC API
export const createTopic: AuthenticatedOperationFor<CreateTopic_ext> =
  createAuthenticatedOperation(
    createTopic_ext,
    {
      User: prisma.user,
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
      Message: prisma.message,
      Quiz: prisma.quiz,
    },
  )

// PRIVATE API
export type UpdateTopicProgress_ext = typeof updateTopicProgress_ext

// PUBLIC API
export const updateTopicProgress: AuthenticatedOperationFor<UpdateTopicProgress_ext> =
  createAuthenticatedOperation(
    updateTopicProgress_ext,
    {
      UserTopicProgress: prisma.userTopicProgress,
      Topic: prisma.topic,
    },
  )

// PRIVATE API
export type FixTopicSources_ext = typeof fixTopicSources_ext

// PUBLIC API
export const fixTopicSources: AuthenticatedOperationFor<FixTopicSources_ext> =
  createAuthenticatedOperation(
    fixTopicSources_ext,
    {
      Topic: prisma.topic,
      VectorDocument: prisma.vectorDocument,
      GeneratedContent: prisma.generatedContent,
    },
  )

// PRIVATE API
export type ExportTopicSources_ext = typeof exportTopicSources_ext

// PUBLIC API
export const exportTopicSources: AuthenticatedOperationFor<ExportTopicSources_ext> =
  createAuthenticatedOperation(
    exportTopicSources_ext,
    {
      Topic: prisma.topic,
      VectorDocument: prisma.vectorDocument,
    },
  )

// PRIVATE API
export type GenerateAssessmentContent_ext = typeof generateAssessmentContent_ext

// PUBLIC API
export const generateAssessmentContent: AuthenticatedOperationFor<GenerateAssessmentContent_ext> =
  createAuthenticatedOperation(
    generateAssessmentContent_ext,
    {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
    },
  )

// PRIVATE API
export type GeneratePersonalizedPath_ext = typeof generatePersonalizedPath_ext

// PUBLIC API
export const generatePersonalizedPath: AuthenticatedOperationFor<GeneratePersonalizedPath_ext> =
  createAuthenticatedOperation(
    generatePersonalizedPath_ext,
    {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
    },
  )

// PRIVATE API
export type GenerateStartingPoint_ext = typeof generateStartingPoint_ext

// PUBLIC API
export const generateStartingPoint: AuthenticatedOperationFor<GenerateStartingPoint_ext> =
  createAuthenticatedOperation(
    generateStartingPoint_ext,
    {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
    },
  )

// PRIVATE API
export type StreamAssessmentContent_ext = typeof streamAssessmentContent_ext

// PUBLIC API
export const streamAssessmentContent: AuthenticatedOperationFor<StreamAssessmentContent_ext> =
  createAuthenticatedOperation(
    streamAssessmentContent_ext,
    {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
    },
  )

// PRIVATE API
export type StartIterativeResearch_ext = typeof startIterativeResearch_ext

// PUBLIC API
export const startIterativeResearch: AuthenticatedOperationFor<StartIterativeResearch_ext> =
  createAuthenticatedOperation(
    startIterativeResearch_ext,
    {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
      VectorDocument: prisma.vectorDocument,
      GeneratedContent: prisma.generatedContent,
    },
  )

// PRIVATE API
export type ExpandTopicDepth_ext = typeof expandTopicDepth_ext

// PUBLIC API
export const expandTopicDepth: AuthenticatedOperationFor<ExpandTopicDepth_ext> =
  createAuthenticatedOperation(
    expandTopicDepth_ext,
    {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
      VectorDocument: prisma.vectorDocument,
    },
  )

// PRIVATE API
export type GenerateSubtopicsForTopic_ext = typeof generateSubtopics_ext

// PUBLIC API
export const generateSubtopicsForTopic: AuthenticatedOperationFor<GenerateSubtopicsForTopic_ext> =
  createAuthenticatedOperation(
    generateSubtopics_ext,
    {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
    },
  )

// PRIVATE API
export type CleanupCache_ext = typeof cleanupCache_ext

// PUBLIC API
export const cleanupCache: AuthenticatedOperationFor<CleanupCache_ext> =
  createAuthenticatedOperation(
    cleanupCache_ext,
    {
      GeneratedContent: prisma.generatedContent,
      Topic: prisma.topic,
    },
  )

// PRIVATE API
export type MigrateToIterativeResearch_ext = typeof migrateToIterativeResearch_ext

// PUBLIC API
export const migrateToIterativeResearch: AuthenticatedOperationFor<MigrateToIterativeResearch_ext> =
  createAuthenticatedOperation(
    migrateToIterativeResearch_ext,
    {
      Topic: prisma.topic,
      GeneratedContent: prisma.generatedContent,
      VectorDocument: prisma.vectorDocument,
    },
  )

// PRIVATE API
export type CleanupOldSystem_ext = typeof cleanupOldSystem_ext

// PUBLIC API
export const cleanupOldSystem: AuthenticatedOperationFor<CleanupOldSystem_ext> =
  createAuthenticatedOperation(
    cleanupOldSystem_ext,
    {
      GeneratedContent: prisma.generatedContent,
    },
  )

// PRIVATE API
export type AddContentBookmark_ext = typeof addBookmark_ext

// PUBLIC API
export const addContentBookmark: AuthenticatedOperationFor<AddContentBookmark_ext> =
  createAuthenticatedOperation(
    addBookmark_ext,
    {
      UserTopicProgress: prisma.userTopicProgress,
      Topic: prisma.topic,
    },
  )

// PRIVATE API
export type RemoveContentBookmark_ext = typeof removeBookmark_ext

// PUBLIC API
export const removeContentBookmark: AuthenticatedOperationFor<RemoveContentBookmark_ext> =
  createAuthenticatedOperation(
    removeBookmark_ext,
    {
      UserTopicProgress: prisma.userTopicProgress,
      Topic: prisma.topic,
    },
  )

// PRIVATE API
export type MarkContentAsRead_ext = typeof markSectionAsRead_ext

// PUBLIC API
export const markContentAsRead: AuthenticatedOperationFor<MarkContentAsRead_ext> =
  createAuthenticatedOperation(
    markSectionAsRead_ext,
    {
      UserTopicProgress: prisma.userTopicProgress,
      Topic: prisma.topic,
    },
  )

// PRIVATE API
export type ExportTopicContent_ext = typeof exportTopicContent_ext

// PUBLIC API
export const exportTopicContent: AuthenticatedOperationFor<ExportTopicContent_ext> =
  createAuthenticatedOperation(
    exportTopicContent_ext,
    {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
    },
  )

// PRIVATE API
export type CreateChatThread_ext = typeof createChatThread_ext

// PUBLIC API
export const createChatThread: AuthenticatedOperationFor<CreateChatThread_ext> =
  createAuthenticatedOperation(
    createChatThread_ext,
    {
      ChatThread: prisma.chatThread,
      Topic: prisma.topic,
    },
  )

// PRIVATE API
export type SendMessage_ext = typeof sendMessage_ext

// PUBLIC API
export const sendMessage: AuthenticatedOperationFor<SendMessage_ext> =
  createAuthenticatedOperation(
    sendMessage_ext,
    {
      User: prisma.user,
      ChatThread: prisma.chatThread,
      Message: prisma.message,
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
      VectorDocument: prisma.vectorDocument,
      Quiz: prisma.quiz,
    },
  )

// PRIVATE API
export type UpdateChatThread_ext = typeof updateChatThread_ext

// PUBLIC API
export const updateChatThread: AuthenticatedOperationFor<UpdateChatThread_ext> =
  createAuthenticatedOperation(
    updateChatThread_ext,
    {
      ChatThread: prisma.chatThread,
    },
  )

// PRIVATE API
export type ExportChatThread_ext = typeof exportChatThread_ext

// PUBLIC API
export const exportChatThread: AuthenticatedOperationFor<ExportChatThread_ext> =
  createAuthenticatedOperation(
    exportChatThread_ext,
    {
      ChatThread: prisma.chatThread,
      Message: prisma.message,
      Topic: prisma.topic,
    },
  )

// PRIVATE API
export type GenerateQuiz_ext = typeof generateQuiz_ext

// PUBLIC API
export const generateQuiz: AuthenticatedOperationFor<GenerateQuiz_ext> =
  createAuthenticatedOperation(
    generateQuiz_ext,
    {
      User: prisma.user,
      Topic: prisma.topic,
      Quiz: prisma.quiz,
      QuizQuestion: prisma.quizQuestion,
      UserTopicProgress: prisma.userTopicProgress,
      VectorDocument: prisma.vectorDocument,
      GeneratedContent: prisma.generatedContent,
      Message: prisma.message,
    },
  )

// PRIVATE API
export type SubmitQuizAnswer_ext = typeof submitQuizAnswer_ext

// PUBLIC API
export const submitQuizAnswer: AuthenticatedOperationFor<SubmitQuizAnswer_ext> =
  createAuthenticatedOperation(
    submitQuizAnswer_ext,
    {
      Quiz: prisma.quiz,
      QuizQuestion: prisma.quizQuestion,
      UserTopicProgress: prisma.userTopicProgress,
    },
  )

// PRIVATE API
export type ConsumeLearningCredits_ext = typeof consumeLearningCredits_ext

// PUBLIC API
export const consumeLearningCredits: AuthenticatedOperationFor<ConsumeLearningCredits_ext> =
  createAuthenticatedOperation(
    consumeLearningCredits_ext,
    {
      User: prisma.user,
    },
  )

// PRIVATE API
export type UpdateUserLearningQuota_ext = typeof updateUserLearningQuota_ext

// PUBLIC API
export const updateUserLearningQuota: AuthenticatedOperationFor<UpdateUserLearningQuota_ext> =
  createAuthenticatedOperation(
    updateUserLearningQuota_ext,
    {
      User: prisma.user,
    },
  )
