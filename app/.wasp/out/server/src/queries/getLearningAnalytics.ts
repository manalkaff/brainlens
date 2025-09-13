import { prisma } from 'wasp/server'

import { getLearningAnalytics } from '../../../../../src/learning/subscription/waspOperations'


export default async function (args, context) {
  return (getLearningAnalytics as any)(args, {
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
