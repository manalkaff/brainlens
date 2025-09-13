import { prisma } from 'wasp/server'

import { getResearchStats } from '../../../../../src/server/operations/iterativeResearch'


export default async function (args, context) {
  return (getResearchStats as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
      VectorDocument: prisma.vectorDocument,
    },
  })
}
