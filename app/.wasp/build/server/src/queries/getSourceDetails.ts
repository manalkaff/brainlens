import { prisma } from 'wasp/server'

import { getSourceDetails } from '../../../../../src/learning/sources/operations'


export default async function (args, context) {
  return (getSourceDetails as any)(args, {
    ...context,
    entities: {
      VectorDocument: prisma.vectorDocument,
      Topic: prisma.topic,
    },
  })
}
