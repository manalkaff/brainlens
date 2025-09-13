import { prisma } from 'wasp/server'

import { getSubtopicContentQuery } from '../../../../../src/learning/operations'


export default async function (args, context) {
  return (getSubtopicContentQuery as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      GeneratedContent: prisma.generatedContent,
    },
  })
}
