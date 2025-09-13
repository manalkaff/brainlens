import { prisma } from 'wasp/server'

import { streamAssessmentContent } from '../../../../../src/learning/assessment/operations'


export default async function (args, context) {
  return (streamAssessmentContent as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
    },
  })
}
