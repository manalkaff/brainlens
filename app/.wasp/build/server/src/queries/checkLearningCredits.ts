import { prisma } from 'wasp/server'

import { checkLearningCredits } from '../../../../../src/learning/subscription/waspOperations'


export default async function (args, context) {
  return (checkLearningCredits as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      Topic: prisma.topic,
      Message: prisma.message,
      Quiz: prisma.quiz,
    },
  })
}
