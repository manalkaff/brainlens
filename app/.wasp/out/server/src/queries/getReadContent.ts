import { prisma } from 'wasp/server'

import { getReadSections } from '../../../../../src/learning/bookmarks/operations'


export default async function (args, context) {
  return (getReadSections as any)(args, {
    ...context,
    entities: {
      UserTopicProgress: prisma.userTopicProgress,
      Topic: prisma.topic,
    },
  })
}
