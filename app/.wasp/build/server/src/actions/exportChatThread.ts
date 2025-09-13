import { prisma } from 'wasp/server'

import { exportChatThread } from '../../../../../src/learning/chat/operations'


export default async function (args, context) {
  return (exportChatThread as any)(args, {
    ...context,
    entities: {
      ChatThread: prisma.chatThread,
      Message: prisma.message,
      Topic: prisma.topic,
    },
  })
}
