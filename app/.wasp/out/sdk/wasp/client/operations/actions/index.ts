import { type ActionFor, createAction } from './core'
import { UpdateIsUserAdminById_ext } from 'wasp/server/operations/actions'
import { GenerateGptResponse_ext } from 'wasp/server/operations/actions'
import { CreateTask_ext } from 'wasp/server/operations/actions'
import { DeleteTask_ext } from 'wasp/server/operations/actions'
import { UpdateTask_ext } from 'wasp/server/operations/actions'
import { GenerateCheckoutSession_ext } from 'wasp/server/operations/actions'
import { CreateFile_ext } from 'wasp/server/operations/actions'
import { CreateTopic_ext } from 'wasp/server/operations/actions'
import { UpdateTopicProgress_ext } from 'wasp/server/operations/actions'
import { FixTopicSources_ext } from 'wasp/server/operations/actions'
import { ExportTopicSources_ext } from 'wasp/server/operations/actions'
import { GenerateAssessmentContent_ext } from 'wasp/server/operations/actions'
import { GeneratePersonalizedPath_ext } from 'wasp/server/operations/actions'
import { GenerateStartingPoint_ext } from 'wasp/server/operations/actions'
import { StreamAssessmentContent_ext } from 'wasp/server/operations/actions'
import { StartIterativeResearch_ext } from 'wasp/server/operations/actions'
import { ExpandTopicDepth_ext } from 'wasp/server/operations/actions'
import { GenerateSubtopicsForTopic_ext } from 'wasp/server/operations/actions'
import { CleanupCache_ext } from 'wasp/server/operations/actions'
import { MigrateToIterativeResearch_ext } from 'wasp/server/operations/actions'
import { CleanupOldSystem_ext } from 'wasp/server/operations/actions'
import { AddContentBookmark_ext } from 'wasp/server/operations/actions'
import { RemoveContentBookmark_ext } from 'wasp/server/operations/actions'
import { MarkContentAsRead_ext } from 'wasp/server/operations/actions'
import { ExportTopicContent_ext } from 'wasp/server/operations/actions'
import { CreateChatThread_ext } from 'wasp/server/operations/actions'
import { SendMessage_ext } from 'wasp/server/operations/actions'
import { UpdateChatThread_ext } from 'wasp/server/operations/actions'
import { ExportChatThread_ext } from 'wasp/server/operations/actions'
import { GenerateQuiz_ext } from 'wasp/server/operations/actions'
import { SubmitQuizAnswer_ext } from 'wasp/server/operations/actions'
import { ConsumeLearningCredits_ext } from 'wasp/server/operations/actions'
import { UpdateUserLearningQuota_ext } from 'wasp/server/operations/actions'

// PUBLIC API
export const updateIsUserAdminById: ActionFor<UpdateIsUserAdminById_ext> = createAction<UpdateIsUserAdminById_ext>(
  'operations/update-is-user-admin-by-id',
  ['User'],
)

// PUBLIC API
export const generateGptResponse: ActionFor<GenerateGptResponse_ext> = createAction<GenerateGptResponse_ext>(
  'operations/generate-gpt-response',
  ['User', 'Task', 'GptResponse'],
)

// PUBLIC API
export const createTask: ActionFor<CreateTask_ext> = createAction<CreateTask_ext>(
  'operations/create-task',
  ['Task'],
)

// PUBLIC API
export const deleteTask: ActionFor<DeleteTask_ext> = createAction<DeleteTask_ext>(
  'operations/delete-task',
  ['Task'],
)

// PUBLIC API
export const updateTask: ActionFor<UpdateTask_ext> = createAction<UpdateTask_ext>(
  'operations/update-task',
  ['Task'],
)

// PUBLIC API
export const generateCheckoutSession: ActionFor<GenerateCheckoutSession_ext> = createAction<GenerateCheckoutSession_ext>(
  'operations/generate-checkout-session',
  ['User'],
)

// PUBLIC API
export const createFile: ActionFor<CreateFile_ext> = createAction<CreateFile_ext>(
  'operations/create-file',
  ['User', 'File'],
)

// PUBLIC API
export const createTopic: ActionFor<CreateTopic_ext> = createAction<CreateTopic_ext>(
  'operations/create-topic',
  ['User', 'Topic', 'UserTopicProgress', 'Message', 'Quiz'],
)

// PUBLIC API
export const updateTopicProgress: ActionFor<UpdateTopicProgress_ext> = createAction<UpdateTopicProgress_ext>(
  'operations/update-topic-progress',
  ['UserTopicProgress', 'Topic'],
)

// PUBLIC API
export const fixTopicSources: ActionFor<FixTopicSources_ext> = createAction<FixTopicSources_ext>(
  'operations/fix-topic-sources',
  ['Topic', 'VectorDocument', 'GeneratedContent'],
)

// PUBLIC API
export const exportTopicSources: ActionFor<ExportTopicSources_ext> = createAction<ExportTopicSources_ext>(
  'operations/export-topic-sources',
  ['Topic', 'VectorDocument'],
)

// PUBLIC API
export const generateAssessmentContent: ActionFor<GenerateAssessmentContent_ext> = createAction<GenerateAssessmentContent_ext>(
  'operations/generate-assessment-content',
  ['Topic', 'UserTopicProgress'],
)

// PUBLIC API
export const generatePersonalizedPath: ActionFor<GeneratePersonalizedPath_ext> = createAction<GeneratePersonalizedPath_ext>(
  'operations/generate-personalized-path',
  ['Topic', 'UserTopicProgress'],
)

// PUBLIC API
export const generateStartingPoint: ActionFor<GenerateStartingPoint_ext> = createAction<GenerateStartingPoint_ext>(
  'operations/generate-starting-point',
  ['Topic', 'UserTopicProgress'],
)

// PUBLIC API
export const streamAssessmentContent: ActionFor<StreamAssessmentContent_ext> = createAction<StreamAssessmentContent_ext>(
  'operations/stream-assessment-content',
  ['Topic', 'UserTopicProgress'],
)

// PUBLIC API
export const startIterativeResearch: ActionFor<StartIterativeResearch_ext> = createAction<StartIterativeResearch_ext>(
  'operations/start-iterative-research',
  ['Topic', 'UserTopicProgress', 'VectorDocument', 'GeneratedContent'],
)

// PUBLIC API
export const expandTopicDepth: ActionFor<ExpandTopicDepth_ext> = createAction<ExpandTopicDepth_ext>(
  'operations/expand-topic-depth',
  ['Topic', 'UserTopicProgress', 'VectorDocument'],
)

// PUBLIC API
export const generateSubtopicsForTopic: ActionFor<GenerateSubtopicsForTopic_ext> = createAction<GenerateSubtopicsForTopic_ext>(
  'operations/generate-subtopics-for-topic',
  ['Topic', 'UserTopicProgress'],
)

// PUBLIC API
export const cleanupCache: ActionFor<CleanupCache_ext> = createAction<CleanupCache_ext>(
  'operations/cleanup-cache',
  ['GeneratedContent', 'Topic'],
)

// PUBLIC API
export const migrateToIterativeResearch: ActionFor<MigrateToIterativeResearch_ext> = createAction<MigrateToIterativeResearch_ext>(
  'operations/migrate-to-iterative-research',
  ['Topic', 'GeneratedContent', 'VectorDocument'],
)

// PUBLIC API
export const cleanupOldSystem: ActionFor<CleanupOldSystem_ext> = createAction<CleanupOldSystem_ext>(
  'operations/cleanup-old-system',
  ['GeneratedContent'],
)

// PUBLIC API
export const addContentBookmark: ActionFor<AddContentBookmark_ext> = createAction<AddContentBookmark_ext>(
  'operations/add-content-bookmark',
  ['UserTopicProgress', 'Topic'],
)

// PUBLIC API
export const removeContentBookmark: ActionFor<RemoveContentBookmark_ext> = createAction<RemoveContentBookmark_ext>(
  'operations/remove-content-bookmark',
  ['UserTopicProgress', 'Topic'],
)

// PUBLIC API
export const markContentAsRead: ActionFor<MarkContentAsRead_ext> = createAction<MarkContentAsRead_ext>(
  'operations/mark-content-as-read',
  ['UserTopicProgress', 'Topic'],
)

// PUBLIC API
export const exportTopicContent: ActionFor<ExportTopicContent_ext> = createAction<ExportTopicContent_ext>(
  'operations/export-topic-content',
  ['Topic', 'UserTopicProgress'],
)

// PUBLIC API
export const createChatThread: ActionFor<CreateChatThread_ext> = createAction<CreateChatThread_ext>(
  'operations/create-chat-thread',
  ['ChatThread', 'Topic'],
)

// PUBLIC API
export const sendMessage: ActionFor<SendMessage_ext> = createAction<SendMessage_ext>(
  'operations/send-message',
  ['User', 'ChatThread', 'Message', 'Topic', 'UserTopicProgress', 'VectorDocument', 'Quiz'],
)

// PUBLIC API
export const updateChatThread: ActionFor<UpdateChatThread_ext> = createAction<UpdateChatThread_ext>(
  'operations/update-chat-thread',
  ['ChatThread'],
)

// PUBLIC API
export const exportChatThread: ActionFor<ExportChatThread_ext> = createAction<ExportChatThread_ext>(
  'operations/export-chat-thread',
  ['ChatThread', 'Message', 'Topic'],
)

// PUBLIC API
export const generateQuiz: ActionFor<GenerateQuiz_ext> = createAction<GenerateQuiz_ext>(
  'operations/generate-quiz',
  ['User', 'Topic', 'Quiz', 'QuizQuestion', 'UserTopicProgress', 'VectorDocument', 'GeneratedContent', 'Message'],
)

// PUBLIC API
export const submitQuizAnswer: ActionFor<SubmitQuizAnswer_ext> = createAction<SubmitQuizAnswer_ext>(
  'operations/submit-quiz-answer',
  ['Quiz', 'QuizQuestion', 'UserTopicProgress'],
)

// PUBLIC API
export const consumeLearningCredits: ActionFor<ConsumeLearningCredits_ext> = createAction<ConsumeLearningCredits_ext>(
  'operations/consume-learning-credits',
  ['User'],
)

// PUBLIC API
export const updateUserLearningQuota: ActionFor<UpdateUserLearningQuota_ext> = createAction<UpdateUserLearningQuota_ext>(
  'operations/update-user-learning-quota',
  ['User'],
)
