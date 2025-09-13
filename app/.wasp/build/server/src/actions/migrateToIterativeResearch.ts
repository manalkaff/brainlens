import { prisma } from 'wasp/server'

import { migrateToIterativeResearch } from '../../../../../src/server/operations/migrateToIterativeResearch'


export default async function (args, context) {
  return (migrateToIterativeResearch as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      GeneratedContent: prisma.generatedContent,
      VectorDocument: prisma.vectorDocument,
    },
  })
}
