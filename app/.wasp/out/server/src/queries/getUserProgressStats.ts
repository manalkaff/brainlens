import { prisma } from 'wasp/server'

import { getUserProgressStats } from '../../../../../src/learning/operations'


export default async function (args, context) {
  return (getUserProgressStats as any)(args, {
    ...context,
    entities: {
      UserTopicProgress: prisma.userTopicProgress,
      Topic: prisma.topic,
    },
  })
}
