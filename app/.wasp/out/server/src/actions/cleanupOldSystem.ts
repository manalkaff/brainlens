import { prisma } from 'wasp/server'

import { cleanupOldSystem } from '../../../../../src/server/operations/migrateToIterativeResearch'


export default async function (args, context) {
  return (cleanupOldSystem as any)(args, {
    ...context,
    entities: {
      GeneratedContent: prisma.generatedContent,
    },
  })
}
