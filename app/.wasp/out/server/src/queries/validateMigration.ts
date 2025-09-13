import { prisma } from 'wasp/server'

import { validateMigration } from '../../../../../src/server/operations/migrateToIterativeResearch'


export default async function (args, context) {
  return (validateMigration as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      GeneratedContent: prisma.generatedContent,
      VectorDocument: prisma.vectorDocument,
    },
  })
}
