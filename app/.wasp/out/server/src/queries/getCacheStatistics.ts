import { prisma } from 'wasp/server'

import { getCacheStatistics } from '../../../../../src/server/operations/iterativeResearch'


export default async function (args, context) {
  return (getCacheStatistics as any)(args, {
    ...context,
    entities: {
      GeneratedContent: prisma.generatedContent,
      Topic: prisma.topic,
    },
  })
}
