import { prisma } from 'wasp/server'

import { getTopicTree } from '../../../../../src/learning/operations'


export default async function (args, context) {
  return (getTopicTree as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
    },
  })
}
