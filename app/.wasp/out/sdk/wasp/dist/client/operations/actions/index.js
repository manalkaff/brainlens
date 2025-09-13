import { createAction } from './core';
// PUBLIC API
export const updateIsUserAdminById = createAction('operations/update-is-user-admin-by-id', ['User']);
// PUBLIC API
export const generateGptResponse = createAction('operations/generate-gpt-response', ['User', 'Task', 'GptResponse']);
// PUBLIC API
export const createTask = createAction('operations/create-task', ['Task']);
// PUBLIC API
export const deleteTask = createAction('operations/delete-task', ['Task']);
// PUBLIC API
export const updateTask = createAction('operations/update-task', ['Task']);
// PUBLIC API
export const generateCheckoutSession = createAction('operations/generate-checkout-session', ['User']);
// PUBLIC API
export const createFile = createAction('operations/create-file', ['User', 'File']);
// PUBLIC API
export const createTopic = createAction('operations/create-topic', ['User', 'Topic', 'UserTopicProgress', 'Message', 'Quiz']);
// PUBLIC API
export const updateTopicProgress = createAction('operations/update-topic-progress', ['UserTopicProgress', 'Topic']);
// PUBLIC API
export const fixTopicSources = createAction('operations/fix-topic-sources', ['Topic', 'VectorDocument', 'GeneratedContent']);
// PUBLIC API
export const exportTopicSources = createAction('operations/export-topic-sources', ['Topic', 'VectorDocument']);
// PUBLIC API
export const generateAssessmentContent = createAction('operations/generate-assessment-content', ['Topic', 'UserTopicProgress']);
// PUBLIC API
export const generatePersonalizedPath = createAction('operations/generate-personalized-path', ['Topic', 'UserTopicProgress']);
// PUBLIC API
export const generateStartingPoint = createAction('operations/generate-starting-point', ['Topic', 'UserTopicProgress']);
// PUBLIC API
export const streamAssessmentContent = createAction('operations/stream-assessment-content', ['Topic', 'UserTopicProgress']);
// PUBLIC API
export const startIterativeResearch = createAction('operations/start-iterative-research', ['Topic', 'UserTopicProgress', 'VectorDocument', 'GeneratedContent']);
// PUBLIC API
export const expandTopicDepth = createAction('operations/expand-topic-depth', ['Topic', 'UserTopicProgress', 'VectorDocument']);
// PUBLIC API
export const generateSubtopicsForTopic = createAction('operations/generate-subtopics-for-topic', ['Topic', 'UserTopicProgress']);
// PUBLIC API
export const cleanupCache = createAction('operations/cleanup-cache', ['GeneratedContent', 'Topic']);
// PUBLIC API
export const migrateToIterativeResearch = createAction('operations/migrate-to-iterative-research', ['Topic', 'GeneratedContent', 'VectorDocument']);
// PUBLIC API
export const cleanupOldSystem = createAction('operations/cleanup-old-system', ['GeneratedContent']);
// PUBLIC API
export const addContentBookmark = createAction('operations/add-content-bookmark', ['UserTopicProgress', 'Topic']);
// PUBLIC API
export const removeContentBookmark = createAction('operations/remove-content-bookmark', ['UserTopicProgress', 'Topic']);
// PUBLIC API
export const markContentAsRead = createAction('operations/mark-content-as-read', ['UserTopicProgress', 'Topic']);
// PUBLIC API
export const exportTopicContent = createAction('operations/export-topic-content', ['Topic', 'UserTopicProgress']);
// PUBLIC API
export const createChatThread = createAction('operations/create-chat-thread', ['ChatThread', 'Topic']);
// PUBLIC API
export const sendMessage = createAction('operations/send-message', ['User', 'ChatThread', 'Message', 'Topic', 'UserTopicProgress', 'VectorDocument', 'Quiz']);
// PUBLIC API
export const updateChatThread = createAction('operations/update-chat-thread', ['ChatThread']);
// PUBLIC API
export const exportChatThread = createAction('operations/export-chat-thread', ['ChatThread', 'Message', 'Topic']);
// PUBLIC API
export const generateQuiz = createAction('operations/generate-quiz', ['User', 'Topic', 'Quiz', 'QuizQuestion', 'UserTopicProgress', 'VectorDocument', 'GeneratedContent', 'Message']);
// PUBLIC API
export const submitQuizAnswer = createAction('operations/submit-quiz-answer', ['Quiz', 'QuizQuestion', 'UserTopicProgress']);
// PUBLIC API
export const consumeLearningCredits = createAction('operations/consume-learning-credits', ['User']);
// PUBLIC API
export const updateUserLearningQuota = createAction('operations/update-user-learning-quota', ['User']);
//# sourceMappingURL=index.js.map