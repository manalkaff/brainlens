import { prisma } from 'wasp/server'

import { exportTopicContent } from '../../../../../src/learning/bookmarks/operations'


export default async function (args, context) {
  return (exportTopicContent as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
    },
  })
}
