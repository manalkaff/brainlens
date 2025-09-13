import { prisma } from 'wasp/server'

import { consumeLearningCredits } from '../../../../../src/learning/subscription/waspOperations'


export default async function (args, context) {
  return (consumeLearningCredits as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
    },
  })
}
