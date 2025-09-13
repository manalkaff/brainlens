import { prisma } from 'wasp/server'

import { exportTopicSources } from '../../../../../src/learning/sources/operations'


export default async function (args, context) {
  return (exportTopicSources as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      VectorDocument: prisma.vectorDocument,
    },
  })
}
