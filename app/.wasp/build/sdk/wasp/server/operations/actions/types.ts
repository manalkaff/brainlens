import {
  type _User,
  type _Task,
  type _GptResponse,
  type _File,
  type _Topic,
  type _UserTopicProgress,
  type _Message,
  type _Quiz,
  type _VectorDocument,
  type _GeneratedContent,
  type _ChatThread,
  type _QuizQuestion,
  type AuthenticatedActionDefinition,
  type Payload,
} from 'wasp/server/_types'

// PUBLIC API
export type UpdateIsUserAdminById<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GenerateGptResponse<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _Task,
      _GptResponse,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CreateTask<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Task,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DeleteTask<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Task,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdateTask<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Task,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GenerateCheckoutSession<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CreateFile<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _File,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CreateTopic<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
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

// PUBLIC API
export type UpdateTopicProgress<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _UserTopicProgress,
      _Topic,
    ],
    Input,
    Output
  >

// PUBLIC API
export type FixTopicSources<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Topic,
      _VectorDocument,
      _GeneratedContent,
    ],
    Input,
    Output
  >

// PUBLIC API
export type ExportTopicSources<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Topic,
      _VectorDocument,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GenerateAssessmentContent<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Topic,
      _UserTopicProgress,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GeneratePersonalizedPath<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Topic,
      _UserTopicProgress,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GenerateStartingPoint<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Topic,
      _UserTopicProgress,
    ],
    Input,
    Output
  >

// PUBLIC API
export type StreamAssessmentContent<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Topic,
      _UserTopicProgress,
    ],
    Input,
    Output
  >

// PUBLIC API
export type StartIterativeResearch<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Topic,
      _UserTopicProgress,
      _VectorDocument,
      _GeneratedContent,
    ],
    Input,
    Output
  >

// PUBLIC API
export type ExpandTopicDepth<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Topic,
      _UserTopicProgress,
      _VectorDocument,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GenerateSubtopicsForTopic<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Topic,
      _UserTopicProgress,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CleanupCache<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _GeneratedContent,
      _Topic,
    ],
    Input,
    Output
  >

// PUBLIC API
export type MigrateToIterativeResearch<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Topic,
      _GeneratedContent,
      _VectorDocument,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CleanupOldSystem<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _GeneratedContent,
    ],
    Input,
    Output
  >

// PUBLIC API
export type AddContentBookmark<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _UserTopicProgress,
      _Topic,
    ],
    Input,
    Output
  >

// PUBLIC API
export type RemoveContentBookmark<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _UserTopicProgress,
      _Topic,
    ],
    Input,
    Output
  >

// PUBLIC API
export type MarkContentAsRead<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _UserTopicProgress,
      _Topic,
    ],
    Input,
    Output
  >

// PUBLIC API
export type ExportTopicContent<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Topic,
      _UserTopicProgress,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CreateChatThread<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _ChatThread,
      _Topic,
    ],
    Input,
    Output
  >

// PUBLIC API
export type SendMessage<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _ChatThread,
      _Message,
      _Topic,
      _UserTopicProgress,
      _VectorDocument,
      _Quiz,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdateChatThread<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _ChatThread,
    ],
    Input,
    Output
  >

// PUBLIC API
export type ExportChatThread<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _ChatThread,
      _Message,
      _Topic,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GenerateQuiz<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _Topic,
      _Quiz,
      _QuizQuestion,
      _UserTopicProgress,
      _VectorDocument,
      _GeneratedContent,
      _Message,
    ],
    Input,
    Output
  >

// PUBLIC API
export type SubmitQuizAnswer<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Quiz,
      _QuizQuestion,
      _UserTopicProgress,
    ],
    Input,
    Output
  >

// PUBLIC API
export type ConsumeLearningCredits<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdateUserLearningQuota<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

