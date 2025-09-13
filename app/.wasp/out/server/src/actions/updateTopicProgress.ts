import { prisma } from 'wasp/server'

import { updateTopicProgress } from '../../../../../src/learning/operations'


export default async function (args, context) {
  return (updateTopicProgress as any)(args, {
    ...context,
    entities: {
      UserTopicProgress: prisma.userTopicProgress,
      Topic: prisma.topic,
    },
  })
}
