import { prisma } from 'wasp/server'

import { submitQuizAnswer } from '../../../../../src/learning/quiz/operations'


export default async function (args, context) {
  return (submitQuizAnswer as any)(args, {
    ...context,
    entities: {
      Quiz: prisma.quiz,
      QuizQuestion: prisma.quizQuestion,
      UserTopicProgress: prisma.userTopicProgress,
    },
  })
}
