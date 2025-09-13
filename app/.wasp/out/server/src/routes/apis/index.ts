import express from 'express'
import { prisma } from 'wasp/server'
import { defineHandler } from 'wasp/server/utils'
import { MiddlewareConfigFn, globalMiddlewareConfigForExpress } from '../../middleware/index.js'
import auth from 'wasp/core/auth'
import { type AuthUserData, makeAuthUserIfPossible } from 'wasp/auth/user'

import { learningApiMiddleware as _wasplearningApisnamespaceMiddlewareConfigFn } from '../../../../../../src/learning/api/middleware'

import { paymentsWebhook as _wasppaymentsWebhookfn } from '../../../../../../src/payment/webhook'
import { paymentsMiddlewareConfigFn as _wasppaymentsWebhookmiddlewareConfigFn } from '../../../../../../src/payment/webhook'
import { generateContentHandler as _wasplearningContentGenerationfn } from '../../../../../../src/learning/api/generateContent'
import { generateSubtopicsHandler as _waspgenerateSubtopicsfn } from '../../../../../../src/learning/api/generateSubtopics'
import { createStreamHandler as _waspcreateContentStreamfn } from '../../../../../../src/learning/api/streamingService'
import { streamContentHandler as _waspstreamContentfn } from '../../../../../../src/learning/api/streamingService'

const idFn: MiddlewareConfigFn = x => x

const _wasplearningContentGenerationmiddlewareConfigFn = idFn
const _waspgenerateSubtopicsmiddlewareConfigFn = idFn
const _waspcreateContentStreammiddlewareConfigFn = idFn
const _waspstreamContentmiddlewareConfigFn = idFn

const router = express.Router()

router.use('/api/learning', globalMiddlewareConfigForExpress(_wasplearningApisnamespaceMiddlewareConfigFn))

const paymentsWebhookMiddleware = globalMiddlewareConfigForExpress(_wasppaymentsWebhookmiddlewareConfigFn)
router.post(
  '/payments-webhook',
  [auth, ...paymentsWebhookMiddleware],
  defineHandler(
    (
      req: Parameters<typeof _wasppaymentsWebhookfn>[0] & { user: AuthUserData | null },
      res: Parameters<typeof _wasppaymentsWebhookfn>[1],
    ) => {
      const context = {
        user: makeAuthUserIfPossible(req.user),
        entities: {
          User: prisma.user,
        },
      }
      return _wasppaymentsWebhookfn(req, res, context)
    }
  )
)
const learningContentGenerationMiddleware = globalMiddlewareConfigForExpress(_wasplearningContentGenerationmiddlewareConfigFn)
router.post(
  '/api/learning/generate-content',
  [auth, ...learningContentGenerationMiddleware],
  defineHandler(
    (
      req: Parameters<typeof _wasplearningContentGenerationfn>[0] & { user: AuthUserData | null },
      res: Parameters<typeof _wasplearningContentGenerationfn>[1],
    ) => {
      const context = {
        user: makeAuthUserIfPossible(req.user),
        entities: {
          Topic: prisma.topic,
          UserTopicProgress: prisma.userTopicProgress,
          VectorDocument: prisma.vectorDocument,
          GeneratedContent: prisma.generatedContent,
        },
      }
      return _wasplearningContentGenerationfn(req, res, context)
    }
  )
)
const generateSubtopicsMiddleware = globalMiddlewareConfigForExpress(_waspgenerateSubtopicsmiddlewareConfigFn)
router.post(
  '/api/learning/generate-subtopics',
  [auth, ...generateSubtopicsMiddleware],
  defineHandler(
    (
      req: Parameters<typeof _waspgenerateSubtopicsfn>[0] & { user: AuthUserData | null },
      res: Parameters<typeof _waspgenerateSubtopicsfn>[1],
    ) => {
      const context = {
        user: makeAuthUserIfPossible(req.user),
        entities: {
          Topic: prisma.topic,
        },
      }
      return _waspgenerateSubtopicsfn(req, res, context)
    }
  )
)
const createContentStreamMiddleware = globalMiddlewareConfigForExpress(_waspcreateContentStreammiddlewareConfigFn)
router.get(
  '/api/learning/stream/create',
  [auth, ...createContentStreamMiddleware],
  defineHandler(
    (
      req: Parameters<typeof _waspcreateContentStreamfn>[0] & { user: AuthUserData | null },
      res: Parameters<typeof _waspcreateContentStreamfn>[1],
    ) => {
      const context = {
        user: makeAuthUserIfPossible(req.user),
        entities: {
          Topic: prisma.topic,
          UserTopicProgress: prisma.userTopicProgress,
        },
      }
      return _waspcreateContentStreamfn(req, res, context)
    }
  )
)
const streamContentMiddleware = globalMiddlewareConfigForExpress(_waspstreamContentmiddlewareConfigFn)
router.post(
  '/api/learning/stream/content',
  [auth, ...streamContentMiddleware],
  defineHandler(
    (
      req: Parameters<typeof _waspstreamContentfn>[0] & { user: AuthUserData | null },
      res: Parameters<typeof _waspstreamContentfn>[1],
    ) => {
      const context = {
        user: makeAuthUserIfPossible(req.user),
        entities: {
          Topic: prisma.topic,
          UserTopicProgress: prisma.userTopicProgress,
        },
      }
      return _waspstreamContentfn(req, res, context)
    }
  )
)

export default router
