import { prisma } from 'wasp/server'

import { cleanupCache } from '../../../../../src/server/operations/iterativeResearch'


export default async function (args, context) {
  return (cleanupCache as any)(args, {
    ...context,
    entities: {
      GeneratedContent: prisma.generatedContent,
      Topic: prisma.topic,
    },
  })
}
