import { prisma } from 'wasp/server'

import { getTopicHierarchy } from '../../../../../src/server/operations/iterativeResearch'


export default async function (args, context) {
  return (getTopicHierarchy as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
    },
  })
}
