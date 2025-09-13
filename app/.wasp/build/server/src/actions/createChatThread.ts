import { prisma } from 'wasp/server'

import { createChatThread } from '../../../../../src/learning/chat/operations'


export default async function (args, context) {
  return (createChatThread as any)(args, {
    ...context,
    entities: {
      ChatThread: prisma.chatThread,
      Topic: prisma.topic,
    },
  })
}
