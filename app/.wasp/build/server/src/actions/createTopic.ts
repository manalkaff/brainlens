import { prisma } from 'wasp/server'

import { createTopic } from '../../../../../src/learning/operations'


export default async function (args, context) {
  return (createTopic as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
      Message: prisma.message,
      Quiz: prisma.quiz,
    },
  })
}
