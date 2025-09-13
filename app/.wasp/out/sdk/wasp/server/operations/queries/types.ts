
import {
  type _User,
  type _GptResponse,
  type _Task,
  type _File,
  type _DailyStats,
  type _Topic,
  type _UserTopicProgress,
  type _VectorDocument,
  type _GeneratedContent,
  type _ChatThread,
  type _Message,
  type _Quiz,
  type _QuizQuestion,
  type AuthenticatedQueryDefinition,
  type Payload,
} from 'wasp/server/_types'

// PUBLIC API
export type GetPaginatedUsers<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetGptResponses<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _GptResponse,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetAllTasksByUser<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Task,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetCustomerPortalUrl<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetAllFilesByUser<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _File,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetDownloadFileSignedURL<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _File,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetDailyStats<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _DailyStats,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetTopic<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Topic,
      _UserTopicProgress,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetTopicTree<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Topic,
      _UserTopicProgress,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetUserProgressStats<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _UserTopicProgress,
      _Topic,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetTopicProgressSummary<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Topic,
      _UserTopicProgress,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetTopicSources<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Topic,
      _VectorDocument,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DebugTopicData<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Topic,
      _VectorDocument,
      _GeneratedContent,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetSourceDetails<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _VectorDocument,
      _Topic,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetSourcesByAgent<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Topic,
      _VectorDocument,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetTopicHierarchy<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Topic,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetResearchStats<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Topic,
      _UserTopicProgress,
      _VectorDocument,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetCacheStatistics<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _GeneratedContent,
      _Topic,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CheckResearchFreshness<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Topic,
      _GeneratedContent,
    ],
    Input,
    Output
  >

// PUBLIC API
export type ValidateMigration<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Topic,
      _GeneratedContent,
      _VectorDocument,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetSubtopicContent<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Topic,
      _GeneratedContent,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetContentBookmarks<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _UserTopicProgress,
      _Topic,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetReadContent<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _UserTopicProgress,
      _Topic,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetChatThread<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _ChatThread,
      _Message,
      _Topic,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetChatThreads<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _ChatThread,
      _Message,
      _Topic,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetUserQuizzes<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Quiz,
      _QuizQuestion,
      _Topic,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetQuiz<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Quiz,
      _QuizQuestion,
      _Topic,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CheckLearningCredits<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _Topic,
      _Message,
      _Quiz,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetUserUsageStats<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _Topic,
      _Message,
      _Quiz,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetUpgradeRecommendation<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _Topic,
      _Message,
      _Quiz,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetLearningAnalytics<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _Topic,
      _UserTopicProgress,
      _Message,
      _Quiz,
    ],
    Input,
    Output
  >

