import { prisma } from 'wasp/server'

import { generateAssessmentContent } from '../../../../../src/learning/assessment/operations'


export default async function (args, context) {
  return (generateAssessmentContent as any)(args, {
    ...context,
    entities: {
      Topic: prisma.topic,
      UserTopicProgress: prisma.userTopicProgress,
    },
  })
}
