import { prisma } from 'wasp/server'

import { getTopic } from '../../../../../src/learning/operations'


export default async function (args, context) {
  return (getTopic as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
    },
  })
}
