import { prisma } from 'wasp/server'

import { updateUserLearningQuota } from '../../../../../src/learning/subscription/waspOperations'


export default async function (args, context) {
  return (updateUserLearningQuota as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
    },
  })
}
