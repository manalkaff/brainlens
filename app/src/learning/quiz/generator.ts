import { QuestionType } from '@prisma/client';
import type { Topic, UserTopicProgress, VectorDocument, GeneratedContent } from 'wasp/entities';
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export interface QuizQuestion {
  question: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface GeneratedQuiz {
  title: string;
  questions: QuizQuestion[];
}

export interface QuizGenerationOptions {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionCount: number;
  questionTypes: QuestionType[];
  focusAreas?: string[];
}

// AI-powered quiz generation using OpenAI
export async function generateQuizWithAI(
  topic: Topic,
  userProgress: UserTopicProgress | null,
  vectorDocuments: VectorDocument[],
  generatedContent: GeneratedContent[],
  options: QuizGenerationOptions
): Promise<GeneratedQuiz> {
  const { difficulty, questionCount, questionTypes } = options;

  // Extract content from both vector documents and generated content for context
  let topicContent = '';
  
  if (vectorDocuments.length > 0) {
    topicContent = vectorDocuments
      .map(doc => doc.content)
      .join('\n\n');
  } else if (generatedContent.length > 0) {
    topicContent = generatedContent
      .map(content => content.content)
      .join('\n\n');
  } else {
    // Fallback content if no documents available
    topicContent = `This quiz is about ${topic.title}. ${topic.summary || ''} ${topic.description || ''}`.trim();
  }
  
  topicContent = topicContent.slice(0, 8000); // Limit content to avoid token limits

  // Create AI prompt for quiz generation
  const prompt = createQuizGenerationPrompt(topic, topicContent, difficulty, questionCount, questionTypes);

  try {
    // Use real OpenAI API to generate quiz questions
    const result = await generateText({
      model: openai("gpt-4-turbo-preview"),
      prompt: prompt,
      temperature: 0.7,
    });

    // Parse the AI response as JSON with error handling
    let parsedResponse;
    try {
      // Try to extract JSON from response in case there's extra text
      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : result.text;
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('Invalid AI response format');
    }
    
    // Validate and format the questions
    const questions: QuizQuestion[] = parsedResponse.map((q: any, index: number) => ({
      question: q.question || `Question ${index + 1} about ${topic.title}`,
      type: q.type || questionTypes[index % questionTypes.length], // Use AI's type or fallback
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: q.correctAnswer || "",
      explanation: q.explanation || `This relates to key concepts in ${topic.title}.`
    }));

    return {
      title: `${topic.title} - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Assessment`,
      questions: questions.slice(0, questionCount) // Ensure we don't exceed the requested count
    };
  } catch (error) {
    console.error('AI quiz generation failed, falling back to template-based generation:', error);
    return generateTemplateBasedQuiz(topic, difficulty, questionCount, questionTypes);
  }
}

function createQuizGenerationPrompt(
  topic: Topic,
  content: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  questionCount: number,
  questionTypes: QuestionType[]
): string {
  const difficultyDescriptions = {
    beginner: 'basic understanding and recall of fundamental concepts',
    intermediate: 'application and analysis of concepts in different contexts',
    advanced: 'synthesis, evaluation, and critical thinking about complex scenarios'
  };

  const questionTypeInstructions = questionTypes.map(type => {
    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        return 'Multiple choice questions with 4 options (A, B, C, D) where only one is correct';
      case QuestionType.TRUE_FALSE:
        return 'True/False questions that test specific factual knowledge';
      case QuestionType.FILL_BLANK:
        return 'Fill-in-the-blank questions with one or two key terms missing';
      case QuestionType.CODE_CHALLENGE:
        return 'Code-based questions if the topic involves programming concepts';
      default:
        return 'Standard questions appropriate for the topic';
    }
  }).join(', ');

  return `Create a ${difficulty}-level quiz about "${topic.title}" with ${questionCount} unique and diverse questions.

Topic Summary: ${topic.summary || 'No summary provided'}
Topic Description: ${topic.description || 'No description provided'}

Content Context:
${content}

Requirements:
- Difficulty Level: ${difficulty} (focus on ${difficultyDescriptions[difficulty]})
- Question Types: ${questionTypeInstructions}
- Each question must be UNIQUE and cover DIFFERENT aspects of the topic
- Base questions on the provided content context
- Include detailed explanations for why answers are correct
- Ensure factual accuracy
- Make questions specific to "${topic.title}", not generic

Question Generation Rules:
1. NO duplicate or similar questions
2. Each question should test a different concept/aspect
3. Use specific examples from the content when possible
4. Vary question difficulty within the ${difficulty} level
5. For multiple choice: make distractors plausible but clearly incorrect
6. For true/false: test specific factual statements
7. For fill-in-blank: focus on key terms/concepts

Response Format: Return ONLY a JSON array of exactly ${questionCount} questions in this format:
[
  {
    "question": "Specific question text based on content",
    "type": "MULTIPLE_CHOICE",
    "options": ["option1", "option2", "option3", "option4"],
    "correctAnswer": "option1",
    "explanation": "Detailed explanation referencing the content"
  }
]

Important: Return only the JSON array, no other text. Each question must be unique and content-specific.`;
}

// Mock AI implementation for development/testing
async function mockAIQuizGeneration(
  prompt: string,
  topic: Topic,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  questionCount: number,
  questionTypes: QuestionType[]
): Promise<{ questions: QuizQuestion[] }> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const questions: QuizQuestion[] = [];
  
  for (let i = 0; i < questionCount; i++) {
    const questionType = questionTypes[i % questionTypes.length];
    const question = generateMockQuestion(topic, questionType, difficulty, i + 1);
    questions.push(question);
  }

  return { questions };
}

function generateMockQuestion(
  topic: Topic,
  type: QuestionType,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  questionNumber: number
): QuizQuestion {
  const topicTitle = topic.title;
  const difficultyModifier = {
    beginner: 'basic',
    intermediate: 'practical',
    advanced: 'complex'
  }[difficulty];

  switch (type) {
    case QuestionType.MULTIPLE_CHOICE:
      return {
        question: `Which of the following best describes a ${difficultyModifier} aspect of ${topicTitle}?`,
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          `${topicTitle} involves systematic analysis and structured approaches`,
          `${topicTitle} is purely theoretical with no practical applications`,
          `${topicTitle} only applies to specific, narrow use cases`,
          `${topicTitle} requires no prior knowledge or preparation`
        ],
        correctAnswer: `${topicTitle} involves systematic analysis and structured approaches`,
        explanation: `This is correct because ${topicTitle} typically requires a methodical approach that combines both theoretical understanding and practical application. The systematic nature allows for better comprehension and implementation of the concepts involved.`
      };

    case QuestionType.TRUE_FALSE:
      const isTrue = Math.random() > 0.5;
      return {
        question: `${topicTitle} requires ${difficultyModifier} understanding of underlying principles to be effectively applied.`,
        type: QuestionType.TRUE_FALSE,
        options: ['True', 'False'],
        correctAnswer: isTrue ? 'True' : 'False',
        explanation: isTrue 
          ? `This statement is true. ${topicTitle} indeed requires a solid understanding of its underlying principles to be applied effectively. Without this foundation, attempts at implementation often lead to suboptimal results.`
          : `This statement is false. While understanding principles is helpful, ${topicTitle} can often be applied effectively through practical experience and guided learning, even without deep theoretical knowledge initially.`
      };

    case QuestionType.FILL_BLANK:
      return {
        question: `The primary goal of ${topicTitle} is to _______ and provide _______ solutions to real-world challenges.`,
        type: QuestionType.FILL_BLANK,
        options: [],
        correctAnswer: 'analyze, practical',
        explanation: `The correct answers are "analyze" and "practical". ${topicTitle} fundamentally involves analyzing complex situations or problems and then providing practical, actionable solutions that can be implemented in real-world scenarios.`
      };

    case QuestionType.CODE_CHALLENGE:
      return {
        question: `If you were to implement a basic function related to ${topicTitle}, what would be the most important consideration?`,
        type: QuestionType.CODE_CHALLENGE,
        options: [
          'Error handling and input validation',
          'Code readability and documentation',
          'Performance optimization',
          'All of the above'
        ],
        correctAnswer: 'All of the above',
        explanation: `All of these considerations are important when implementing functions related to ${topicTitle}. Error handling ensures robustness, readability aids maintenance, and performance optimization ensures efficiency. A well-designed implementation considers all these aspects.`
      };

    default:
      return generateMockQuestion(topic, QuestionType.MULTIPLE_CHOICE, difficulty, questionNumber);
  }
}

// Fallback template-based quiz generation
function generateTemplateBasedQuiz(
  topic: Topic,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  questionCount: number,
  questionTypes: QuestionType[]
): GeneratedQuiz {
  const questions: QuizQuestion[] = [];
  
  const templates = getQuestionTemplates(topic, difficulty);
  
  for (let i = 0; i < questionCount; i++) {
    const questionType = questionTypes[i % questionTypes.length];
    const template = templates[questionType] || templates[QuestionType.MULTIPLE_CHOICE];
    const question = template[i % template.length];
    questions.push(question);
  }

  return {
    title: `${topic.title} - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Quiz`,
    questions
  };
}

function getQuestionTemplates(
  topic: Topic,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Record<QuestionType, QuizQuestion[]> {
  const topicTitle = topic.title;
  
  return {
    [QuestionType.MULTIPLE_CHOICE]: [
      {
        question: `What is the primary focus of ${topicTitle}?`,
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          `Understanding core concepts and principles`,
          `Memorizing specific facts and figures`,
          `Following rigid procedures without variation`,
          `Avoiding practical applications`
        ],
        correctAnswer: `Understanding core concepts and principles`,
        explanation: `The primary focus of ${topicTitle} is understanding core concepts and principles, which provides the foundation for practical application and deeper learning.`
      },
      {
        question: `Which approach is most effective when learning ${topicTitle}?`,
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          `Combining theory with practical examples`,
          `Only reading theoretical materials`,
          `Skipping foundational concepts`,
          `Avoiding hands-on practice`
        ],
        correctAnswer: `Combining theory with practical examples`,
        explanation: `The most effective approach combines theoretical understanding with practical examples, as this reinforces learning and demonstrates real-world applications.`
      }
    ],
    [QuestionType.TRUE_FALSE]: [
      {
        question: `${topicTitle} can be effectively learned through a combination of study and practice.`,
        type: QuestionType.TRUE_FALSE,
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: `This is true. Most subjects, including ${topicTitle}, benefit from a balanced approach that includes both theoretical study and practical application.`
      },
      {
        question: `Understanding ${topicTitle} requires extensive prior knowledge in related fields.`,
        type: QuestionType.TRUE_FALSE,
        options: ['True', 'False'],
        correctAnswer: difficulty === 'advanced' ? 'True' : 'False',
        explanation: difficulty === 'advanced' 
          ? `This is true for advanced study of ${topicTitle}, which typically builds upon extensive foundational knowledge.`
          : `This is false. While some background knowledge is helpful, ${topicTitle} can be learned by beginners with proper guidance and structured learning.`
      }
    ],
    [QuestionType.FILL_BLANK]: [
      {
        question: `When studying ${topicTitle}, it's important to focus on _______ understanding rather than _______ memorization.`,
        type: QuestionType.FILL_BLANK,
        options: [],
        correctAnswer: 'conceptual, rote',
        explanation: `The correct answers are "conceptual" and "rote". Conceptual understanding allows for flexible application of knowledge, while rote memorization provides limited utility in real-world scenarios.`
      }
    ],
    [QuestionType.CODE_CHALLENGE]: [
      {
        question: `What would be a key consideration when implementing a solution related to ${topicTitle}?`,
        type: QuestionType.CODE_CHALLENGE,
        options: [
          'Scalability and maintainability',
          'Quick implementation without planning',
          'Ignoring edge cases',
          'Avoiding documentation'
        ],
        correctAnswer: 'Scalability and maintainability',
        explanation: `Scalability and maintainability are crucial considerations in any implementation. They ensure the solution can grow with requirements and be easily modified or debugged in the future.`
      }
    ]
  };
}

// Adaptive difficulty adjustment based on user performance
export function adjustDifficultyBasedOnPerformance(
  currentDifficulty: 'beginner' | 'intermediate' | 'advanced',
  recentScores: number[]
): 'beginner' | 'intermediate' | 'advanced' {
  if (recentScores.length === 0) {
    return currentDifficulty;
  }

  const averageScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
  
  // Adjust difficulty based on performance
  if (averageScore >= 85 && currentDifficulty !== 'advanced') {
    // High performance - increase difficulty
    return currentDifficulty === 'beginner' ? 'intermediate' : 'advanced';
  } else if (averageScore <= 60 && currentDifficulty !== 'beginner') {
    // Low performance - decrease difficulty
    return currentDifficulty === 'advanced' ? 'intermediate' : 'beginner';
  }
  
  return currentDifficulty;
}

// Generate question type distribution based on difficulty
export function getQuestionTypeDistribution(difficulty: 'beginner' | 'intermediate' | 'advanced'): QuestionType[] {
  switch (difficulty) {
    case 'beginner':
      return [
        QuestionType.MULTIPLE_CHOICE,
        QuestionType.TRUE_FALSE,
        QuestionType.FILL_BLANK,
        QuestionType.MULTIPLE_CHOICE,
        QuestionType.TRUE_FALSE
      ];
    case 'intermediate':
      return [
        QuestionType.MULTIPLE_CHOICE,
        QuestionType.TRUE_FALSE,
        QuestionType.FILL_BLANK,
        QuestionType.CODE_CHALLENGE,
        QuestionType.MULTIPLE_CHOICE,
        QuestionType.FILL_BLANK,
        QuestionType.TRUE_FALSE,
        QuestionType.CODE_CHALLENGE
      ];
    case 'advanced':
      return [
        QuestionType.MULTIPLE_CHOICE,
        QuestionType.FILL_BLANK,
        QuestionType.CODE_CHALLENGE,
        QuestionType.TRUE_FALSE,
        QuestionType.MULTIPLE_CHOICE,
        QuestionType.CODE_CHALLENGE,
        QuestionType.FILL_BLANK,
        QuestionType.TRUE_FALSE,
        QuestionType.CODE_CHALLENGE,
        QuestionType.MULTIPLE_CHOICE
      ];
    default:
      return [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE];
  }
}