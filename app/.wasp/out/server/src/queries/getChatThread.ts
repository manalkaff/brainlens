import { prisma } from 'wasp/server'

import { getChatThread } from '../../../../../src/learning/chat/operations'


export default async function (args, context) {
  return (getChatThread as any)(args, {
    ...context,
    entities: {
      ChatThread: prisma.chatThread,
      Message: prisma.message,
      Topic: prisma.topic,
    },
  })
}
