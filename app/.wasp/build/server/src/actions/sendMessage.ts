import { prisma } from 'wasp/server'

import { sendMessage } from '../../../../../src/learning/chat/operations'


export default async function (args, context) {
  return (sendMessage as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      ChatThread: prisma.chatThread,
      Message: prisma.message,
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
      VectorDocument: prisma.vectorDocument,
      Quiz: prisma.quiz,
    },
  })
}
