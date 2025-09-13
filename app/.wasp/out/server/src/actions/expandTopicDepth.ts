import { prisma } from 'wasp/server'

import { expandTopicDepth } from '../../../../../src/server/operations/iterativeResearch'


export default async function (args, context) {
  return (expandTopicDepth as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
      VectorDocument: prisma.vectorDocument,
    },
  })
}
