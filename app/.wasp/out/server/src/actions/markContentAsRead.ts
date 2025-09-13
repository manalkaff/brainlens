import { prisma } from 'wasp/server'

import { markSectionAsRead } from '../../../../../src/learning/bookmarks/operations'


export default async function (args, context) {
  return (markSectionAsRead as any)(args, {
    ...context,
    entities: {
      UserTopicProgress: prisma.userTopicProgress,
      Topic: prisma.topic,
    },
  })
}
