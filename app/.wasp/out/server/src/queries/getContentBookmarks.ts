import { prisma } from 'wasp/server'

import { getTopicBookmarks } from '../../../../../src/learning/bookmarks/operations'


export default async function (args, context) {
  return (getTopicBookmarks as any)(args, {
    ...context,
    entities: {
      UserTopicProgress: prisma.userTopicProgress,
      Topic: prisma.topic,
    },
  })
}
