import { prisma } from 'wasp/server'

import { generateQuiz } from '../../../../../src/learning/quiz/operations'


export default async function (args, context) {
  return (generateQuiz as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      Topic: prisma.topic,
      Quiz: prisma.quiz,
      QuizQuestion: prisma.quizQuestion,
      UserTopicProgress: prisma.userTopicProgress,
      VectorDocument: prisma.vectorDocument,
      GeneratedContent: prisma.generatedContent,
      Message: prisma.message,
    },
  })
}
