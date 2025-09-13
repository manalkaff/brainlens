import { prisma } from 'wasp/server'

import { updateChatThread } from '../../../../../src/learning/chat/operations'


export default async function (args, context) {
  return (updateChatThread as any)(args, {
    ...context,
    entities: {
      ChatThread: prisma.chatThread,
    },
  })
}
