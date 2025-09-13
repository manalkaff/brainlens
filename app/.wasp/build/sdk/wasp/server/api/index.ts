
import { type ParamsDictionary as ExpressParams, type Query as ExpressQuery } from 'express-serve-static-core'

import {
  type _User,
  type _Topic,
  type _UserTopicProgress,
  type _VectorDocument,
  type _GeneratedContent,
  type AuthenticatedApi,
} from '../_types'


// PUBLIC API
export type PaymentsWebhook<
  P extends ExpressParams = ExpressParams,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends ExpressQuery = ExpressQuery,
  Locals extends Record<string, any> = Record<string, any>
> =
  AuthenticatedApi<
    [
      _User,
    ],
    P,
    ResBody,
    ReqBody,
    ReqQuery,
    Locals
  >
export type LearningContentGeneration<
  P extends ExpressParams = ExpressParams,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends ExpressQuery = ExpressQuery,
  Locals extends Record<string, any> = Record<string, any>
> =
  AuthenticatedApi<
    [
      _Topic,
      _UserTopicProgress,
      _VectorDocument,
      _GeneratedContent,
    ],
    P,
    ResBody,
    ReqBody,
    ReqQuery,
    Locals
  >
export type GenerateSubtopics<
  P extends ExpressParams = ExpressParams,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends ExpressQuery = ExpressQuery,
  Locals extends Record<string, any> = Record<string, any>
> =
  AuthenticatedApi<
    [
      _Topic,
    ],
    P,
    ResBody,
    ReqBody,
    ReqQuery,
    Locals
  >
export type CreateContentStream<
  P extends ExpressParams = ExpressParams,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends ExpressQuery = ExpressQuery,
  Locals extends Record<string, any> = Record<string, any>
> =
  AuthenticatedApi<
    [
      _Topic,
      _UserTopicProgress,
    ],
    P,
    ResBody,
    ReqBody,
    ReqQuery,
    Locals
  >
export type StreamContent<
  P extends ExpressParams = ExpressParams,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends ExpressQuery = ExpressQuery,
  Locals extends Record<string, any> = Record<string, any>
> =
  AuthenticatedApi<
    [
      _Topic,
      _UserTopicProgress,
    ],
    P,
    ResBody,
    ReqBody,
    ReqQuery,
    Locals
  >
