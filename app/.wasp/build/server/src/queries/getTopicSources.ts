import { prisma } from 'wasp/server'

import { getTopicSources } from '../../../../../src/learning/sources/operations'


export default async function (args, context) {
  return (getTopicSources as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      VectorDocument: prisma.vectorDocument,
    },
  })
}
