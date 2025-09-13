import { prisma } from 'wasp/server'

import { checkResearchFreshness } from '../../../../../src/server/operations/iterativeResearch'


export default async function (args, context) {
  return (checkResearchFreshness as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      GeneratedContent: prisma.generatedContent,
    },
  })
}
