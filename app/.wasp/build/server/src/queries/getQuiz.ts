import { prisma } from 'wasp/server'

import { getQuiz } from '../../../../../src/learning/quiz/operations'


export default async function (args, context) {
  return (getQuiz as any)(args, {
    ...context,
    entities: {
      Quiz: prisma.quiz,
      QuizQuestion: prisma.quizQuestion,
      Topic: prisma.topic,
    },
  })
}
