import { prisma } from 'wasp/server'

import { getTopicProgressSummary } from '../../../../../src/learning/operations'


export default async function (args, context) {
  return (getTopicProgressSummary as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
    },
  })
}
