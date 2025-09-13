import { prisma } from 'wasp/server'

import { generateStartingPoint } from '../../../../../src/learning/assessment/operations'


export default async function (args, context) {
  return (generateStartingPoint as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
    },
  })
}
