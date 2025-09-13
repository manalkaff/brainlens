import { prisma } from 'wasp/server'

import { getUserQuizzes } from '../../../../../src/learning/quiz/operations'


export default async function (args, context) {
  return (getUserQuizzes as any)(args, {
    ...context,
    entities: {
      Quiz: prisma.quiz,
      QuizQuestion: prisma.quizQuestion,
      Topic: prisma.topic,
    },
  })
}
