// Wasp internally uses the types defined in this file for typing entity maps in
// operation contexts.
//
// We must explicitly tag all entities with their name to avoid issues with
// structural typing. See https://github.com/wasp-lang/wasp/pull/982 for details.
import { 
  type Entity, 
  type EntityName,
  type User,
  type GptResponse,
  type Task,
  type File,
  type DailyStats,
  type PageViewSource,
  type Logs,
  type ContactFormMessage,
  type Topic,
  type GeneratedContent,
  type UserTopicProgress,
  type ChatThread,
  type Message,
  type Quiz,
  type QuizQuestion,
  type VectorDocument,
} from 'wasp/entities'

export type _User = WithName<User, "User">
export type _GptResponse = WithName<GptResponse, "GptResponse">
export type _Task = WithName<Task, "Task">
export type _File = WithName<File, "File">
export type _DailyStats = WithName<DailyStats, "DailyStats">
export type _PageViewSource = WithName<PageViewSource, "PageViewSource">
export type _Logs = WithName<Logs, "Logs">
export type _ContactFormMessage = WithName<ContactFormMessage, "ContactFormMessage">
export type _Topic = WithName<Topic, "Topic">
export type _GeneratedContent = WithName<GeneratedContent, "GeneratedContent">
export type _UserTopicProgress = WithName<UserTopicProgress, "UserTopicProgress">
export type _ChatThread = WithName<ChatThread, "ChatThread">
export type _Message = WithName<Message, "Message">
export type _Quiz = WithName<Quiz, "Quiz">
export type _QuizQuestion = WithName<QuizQuestion, "QuizQuestion">
export type _VectorDocument = WithName<VectorDocument, "VectorDocument">

export type _Entity = 
  | _User
  | _GptResponse
  | _Task
  | _File
  | _DailyStats
  | _PageViewSource
  | _Logs
  | _ContactFormMessage
  | _Topic
  | _GeneratedContent
  | _UserTopicProgress
  | _ChatThread
  | _Message
  | _Quiz
  | _QuizQuestion
  | _VectorDocument
  | never

type WithName<E extends Entity, Name extends EntityName> = 
  E & { _entityName: Name }
