import { prisma } from 'wasp/server'

import { debugTopicData } from '../../../../../src/learning/sources/operations'


export default async function (args, context) {
  return (debugTopicData as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      VectorDocument: prisma.vectorDocument,
      GeneratedContent: prisma.generatedContent,
    },
  })
}
