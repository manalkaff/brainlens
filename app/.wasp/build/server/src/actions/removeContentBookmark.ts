import { prisma } from 'wasp/server'

import { removeBookmark } from '../../../../../src/learning/bookmarks/operations'


export default async function (args, context) {
  return (removeBookmark as any)(args, {
    ...context,
    entities: {
      UserTopicProgress: prisma.userTopicProgress,
      Topic: prisma.topic,
    },
  })
}
