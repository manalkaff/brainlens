import { prisma } from 'wasp/server';
import { createAuthenticatedOperation, } from '../wrappers.js';
import { updateIsUserAdminById as updateIsUserAdminById_ext } from 'wasp/src/user/operations';
import { generateGptResponse as generateGptResponse_ext } from 'wasp/src/demo-ai-app/operations';
import { createTask as createTask_ext } from 'wasp/src/demo-ai-app/operations';
import { deleteTask as deleteTask_ext } from 'wasp/src/demo-ai-app/operations';
import { updateTask as updateTask_ext } from 'wasp/src/demo-ai-app/operations';
import { generateCheckoutSession as generateCheckoutSession_ext } from 'wasp/src/payment/operations';
import { createFile as createFile_ext } from 'wasp/src/file-upload/operations';
import { createTopic as createTopic_ext } from 'wasp/src/learning/operations';
import { updateTopicProgress as updateTopicProgress_ext } from 'wasp/src/learning/operations';
import { fixTopicSources as fixTopicSources_ext } from 'wasp/src/learning/sources/operations';
import { exportTopicSources as exportTopicSources_ext } from 'wasp/src/learning/sources/operations';
import { generateAssessmentContent as generateAssessmentContent_ext } from 'wasp/src/learning/assessment/operations';
import { generatePersonalizedPath as generatePersonalizedPath_ext } from 'wasp/src/learning/assessment/operations';
import { generateStartingPoint as generateStartingPoint_ext } from 'wasp/src/learning/assessment/operations';
import { streamAssessmentContent as streamAssessmentContent_ext } from 'wasp/src/learning/assessment/operations';
import { startIterativeResearch as startIterativeResearch_ext } from 'wasp/src/server/operations/iterativeResearch';
import { expandTopicDepth as expandTopicDepth_ext } from 'wasp/src/server/operations/iterativeResearch';
import { generateSubtopics as generateSubtopics_ext } from 'wasp/src/server/operations/iterativeResearch';
import { cleanupCache as cleanupCache_ext } from 'wasp/src/server/operations/iterativeResearch';
import { migrateToIterativeResearch as migrateToIterativeResearch_ext } from 'wasp/src/server/operations/migrateToIterativeResearch';
import { cleanupOldSystem as cleanupOldSystem_ext } from 'wasp/src/server/operations/migrateToIterativeResearch';
import { addBookmark as addBookmark_ext } from 'wasp/src/learning/bookmarks/operations';
import { removeBookmark as removeBookmark_ext } from 'wasp/src/learning/bookmarks/operations';
import { markSectionAsRead as markSectionAsRead_ext } from 'wasp/src/learning/bookmarks/operations';
import { exportTopicContent as exportTopicContent_ext } from 'wasp/src/learning/bookmarks/operations';
import { createChatThread as createChatThread_ext } from 'wasp/src/learning/chat/operations';
import { sendMessage as sendMessage_ext } from 'wasp/src/learning/chat/operations';
import { updateChatThread as updateChatThread_ext } from 'wasp/src/learning/chat/operations';
import { exportChatThread as exportChatThread_ext } from 'wasp/src/learning/chat/operations';
import { generateQuiz as generateQuiz_ext } from 'wasp/src/learning/quiz/operations';
import { submitQuizAnswer as submitQuizAnswer_ext } from 'wasp/src/learning/quiz/operations';
import { consumeLearningCredits as consumeLearningCredits_ext } from 'wasp/src/learning/subscription/waspOperations';
import { updateUserLearningQuota as updateUserLearningQuota_ext } from 'wasp/src/learning/subscription/waspOperations';
// PUBLIC API
export const updateIsUserAdminById = createAuthenticatedOperation(updateIsUserAdminById_ext, {
    User: prisma.user,
});
// PUBLIC API
export const generateGptResponse = createAuthenticatedOperation(generateGptResponse_ext, {
    User: prisma.user,
    Task: prisma.task,
    GptResponse: prisma.gptResponse,
});
// PUBLIC API
export const createTask = createAuthenticatedOperation(createTask_ext, {
    Task: prisma.task,
});
// PUBLIC API
export const deleteTask = createAuthenticatedOperation(deleteTask_ext, {
    Task: prisma.task,
});
// PUBLIC API
export const updateTask = createAuthenticatedOperation(updateTask_ext, {
    Task: prisma.task,
});
// PUBLIC API
export const generateCheckoutSession = createAuthenticatedOperation(generateCheckoutSession_ext, {
    User: prisma.user,
});
// PUBLIC API
export const createFile = createAuthenticatedOperation(createFile_ext, {
    User: prisma.user,
    File: prisma.file,
});
// PUBLIC API
export const createTopic = createAuthenticatedOperation(createTopic_ext, {
    User: prisma.user,
    Topic: prisma.topic,
    UserTopicProgress: prisma.userTopicProgress,
    Message: prisma.message,
    Quiz: prisma.quiz,
});
// PUBLIC API
export const updateTopicProgress = createAuthenticatedOperation(updateTopicProgress_ext, {
    UserTopicProgress: prisma.userTopicProgress,
    Topic: prisma.topic,
});
// PUBLIC API
export const fixTopicSources = createAuthenticatedOperation(fixTopicSources_ext, {
    Topic: prisma.topic,
    VectorDocument: prisma.vectorDocument,
    GeneratedContent: prisma.generatedContent,
});
// PUBLIC API
export const exportTopicSources = createAuthenticatedOperation(exportTopicSources_ext, {
    Topic: prisma.topic,
    VectorDocument: prisma.vectorDocument,
});
// PUBLIC API
export const generateAssessmentContent = createAuthenticatedOperation(generateAssessmentContent_ext, {
    Topic: prisma.topic,
    UserTopicProgress: prisma.userTopicProgress,
});
// PUBLIC API
export const generatePersonalizedPath = createAuthenticatedOperation(generatePersonalizedPath_ext, {
    Topic: prisma.topic,
    UserTopicProgress: prisma.userTopicProgress,
});
// PUBLIC API
export const generateStartingPoint = createAuthenticatedOperation(generateStartingPoint_ext, {
    Topic: prisma.topic,
    UserTopicProgress: prisma.userTopicProgress,
});
// PUBLIC API
export const streamAssessmentContent = createAuthenticatedOperation(streamAssessmentContent_ext, {
    Topic: prisma.topic,
    UserTopicProgress: prisma.userTopicProgress,
});
// PUBLIC API
export const startIterativeResearch = createAuthenticatedOperation(startIterativeResearch_ext, {
    Topic: prisma.topic,
    UserTopicProgress: prisma.userTopicProgress,
    VectorDocument: prisma.vectorDocument,
    GeneratedContent: prisma.generatedContent,
});
// PUBLIC API
export const expandTopicDepth = createAuthenticatedOperation(expandTopicDepth_ext, {
    Topic: prisma.topic,
    UserTopicProgress: prisma.userTopicProgress,
    VectorDocument: prisma.vectorDocument,
});
// PUBLIC API
export const generateSubtopicsForTopic = createAuthenticatedOperation(generateSubtopics_ext, {
    Topic: prisma.topic,
    UserTopicProgress: prisma.userTopicProgress,
});
// PUBLIC API
export const cleanupCache = createAuthenticatedOperation(cleanupCache_ext, {
    GeneratedContent: prisma.generatedContent,
    Topic: prisma.topic,
});
// PUBLIC API
export const migrateToIterativeResearch = createAuthenticatedOperation(migrateToIterativeResearch_ext, {
    Topic: prisma.topic,
    GeneratedContent: prisma.generatedContent,
    VectorDocument: prisma.vectorDocument,
});
// PUBLIC API
export const cleanupOldSystem = createAuthenticatedOperation(cleanupOldSystem_ext, {
    GeneratedContent: prisma.generatedContent,
});
// PUBLIC API
export const addContentBookmark = createAuthenticatedOperation(addBookmark_ext, {
    UserTopicProgress: prisma.userTopicProgress,
    Topic: prisma.topic,
});
// PUBLIC API
export const removeContentBookmark = createAuthenticatedOperation(removeBookmark_ext, {
    UserTopicProgress: prisma.userTopicProgress,
    Topic: prisma.topic,
});
// PUBLIC API
export const markContentAsRead = createAuthenticatedOperation(markSectionAsRead_ext, {
    UserTopicProgress: prisma.userTopicProgress,
    Topic: prisma.topic,
});
// PUBLIC API
export const exportTopicContent = createAuthenticatedOperation(exportTopicContent_ext, {
    Topic: prisma.topic,
    UserTopicProgress: prisma.userTopicProgress,
});
// PUBLIC API
export const createChatThread = createAuthenticatedOperation(createChatThread_ext, {
    ChatThread: prisma.chatThread,
    Topic: prisma.topic,
});
// PUBLIC API
export const sendMessage = createAuthenticatedOperation(sendMessage_ext, {
    User: prisma.user,
    ChatThread: prisma.chatThread,
    Message: prisma.message,
    Topic: prisma.topic,
    UserTopicProgress: prisma.userTopicProgress,
    VectorDocument: prisma.vectorDocument,
    Quiz: prisma.quiz,
});
// PUBLIC API
export const updateChatThread = createAuthenticatedOperation(updateChatThread_ext, {
    ChatThread: prisma.chatThread,
});
// PUBLIC API
export const exportChatThread = createAuthenticatedOperation(exportChatThread_ext, {
    ChatThread: prisma.chatThread,
    Message: prisma.message,
    Topic: prisma.topic,
});
// PUBLIC API
export const generateQuiz = createAuthenticatedOperation(generateQuiz_ext, {
    User: prisma.user,
    Topic: prisma.topic,
    Quiz: prisma.quiz,
    QuizQuestion: prisma.quizQuestion,
    UserTopicProgress: prisma.userTopicProgress,
    VectorDocument: prisma.vectorDocument,
    GeneratedContent: prisma.generatedContent,
    Message: prisma.message,
});
// PUBLIC API
export const submitQuizAnswer = createAuthenticatedOperation(submitQuizAnswer_ext, {
    Quiz: prisma.quiz,
    QuizQuestion: prisma.quizQuestion,
    UserTopicProgress: prisma.userTopicProgress,
});
// PUBLIC API
export const consumeLearningCredits = createAuthenticatedOperation(consumeLearningCredits_ext, {
    User: prisma.user,
});
// PUBLIC API
export const updateUserLearningQuota = createAuthenticatedOperation(updateUserLearningQuota_ext, {
    User: prisma.user,
});
//# sourceMappingURL=index.js.map