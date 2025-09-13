import { prisma } from 'wasp/server'

import { getChatThreads } from '../../../../../src/learning/chat/operations'


export default async function (args, context) {
  return (getChatThreads as any)(args, {
    ...context,
    entities: {
      ChatThread: prisma.chatThread,
      Message: prisma.message,
      Topic: prisma.topic,
    },
  })
}
