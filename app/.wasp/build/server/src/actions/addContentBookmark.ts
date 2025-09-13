import { prisma } from 'wasp/server'

import { addBookmark } from '../../../../../src/learning/bookmarks/operations'


export default async function (args, context) {
  return (addBookmark as any)(args, {
    ...context,
    entities: {
      UserTopicProgress: prisma.userTopicProgress,
      Topic: prisma.topic,
    },
  })
}
