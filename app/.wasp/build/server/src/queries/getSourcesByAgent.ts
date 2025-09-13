import { prisma } from 'wasp/server'

import { getSourcesByAgent } from '../../../../../src/learning/sources/operations'


export default async function (args, context) {
  return (getSourcesByAgent as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      VectorDocument: prisma.vectorDocument,
    },
  })
}
