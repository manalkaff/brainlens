import { prisma } from 'wasp/server'

import { getUpgradeRecommendation } from '../../../../../src/learning/subscription/waspOperations'


export default async function (args, context) {
  return (getUpgradeRecommendation as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      Topic: prisma.topic,
      Message: prisma.message,
      Quiz: prisma.quiz,
    },
  })
}
