import { prisma } from 'wasp/server'

import { fixTopicSources } from '../../../../../src/learning/sources/operations'


export default async function (args, context) {
  return (fixTopicSources as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      VectorDocument: prisma.vectorDocument,
      GeneratedContent: prisma.generatedContent,
    },
  })
}
