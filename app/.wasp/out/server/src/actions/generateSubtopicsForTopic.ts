import { prisma } from 'wasp/server'

import { generateSubtopics } from '../../../../../src/server/operations/iterativeResearch'


export default async function (args, context) {
  return (generateSubtopics as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
    },
  })
}
