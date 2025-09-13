import { prisma } from 'wasp/server'

import { generatePersonalizedPath } from '../../../../../src/learning/assessment/operations'


export default async function (args, context) {
  return (generatePersonalizedPath as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
    },
  })
}
