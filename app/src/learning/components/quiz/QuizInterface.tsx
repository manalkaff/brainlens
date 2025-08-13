import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { CheckCircle, XCircle, Clock, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { submitQuizAnswer } from 'wasp/client/operations';
import type { Quiz, QuizQuestion } from 'wasp/entities';
import { QuestionType } from '@prisma/client';

interface QuizInterfaceProps {
  quiz: Quiz & { questions: QuizQuestion[] };
  onQuizComplete: (finalScore: number) => void;
  onExit: () => void;
}

interface QuestionResult {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  currentScore: number;
  totalQuestions: number;
  isQuizCompleted: boolean;
}

export function QuizInterface({ quiz, onQuizComplete, onExit }: QuizInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [questionResults, setQuestionResults] = useState<Record<string, QuestionResult>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Timer effect
  useEffect(() => {
    if (quizCompleted) return;
    
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [quizCompleted]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer selection
  const handleAnswerChange = (value: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  // Submit answer for current question
  const handleSubmitAnswer = async () => {
    const userAnswer = userAnswers[currentQuestion.id];
    if (!userAnswer || userAnswer.trim() === '') {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitQuizAnswer({
        quizId: quiz.id,
        questionId: currentQuestion.id,
        userAnswer: userAnswer.trim()
      });

      setQuestionResults(prev => ({
        ...prev,
        [currentQuestion.id]: result
      }));

      setShowExplanation(true);

      // Check if quiz is completed
      if (result.isQuizCompleted) {
        setQuizCompleted(true);
        setTimeout(() => {
          onQuizComplete(result.currentScore);
        }, 3000); // Show final explanation for 3 seconds
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowExplanation(false);
    }
  };

  // Navigate to previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowExplanation(false);
    }
  };

  // Check if current question is answered
  const isCurrentQuestionAnswered = currentQuestion.id in questionResults;
  const currentResult = questionResults[currentQuestion.id];

  // Calculate current score
  const answeredQuestions = Object.keys(questionResults).length;
  const correctAnswers = Object.values(questionResults).filter(r => r.isCorrect).length;
  const currentScore = answeredQuestions > 0 ? (correctAnswers / answeredQuestions) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quiz Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{quiz.title}</CardTitle>
              <CardDescription>
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeElapsed)}</span>
              </div>
              <Button variant="outline" size="sm" onClick={onExit}>
                Exit Quiz
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress: {Math.round(progress)}%</span>
              <span>Score: {Math.round(currentScore)}%</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">
              {currentQuestion.type.replace('_', ' ').toLowerCase()}
            </Badge>
            {isCurrentQuestionAnswered && (
              <Badge variant={currentResult.isCorrect ? 'default' : 'destructive'}>
                {currentResult.isCorrect ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <XCircle className="w-3 h-3 mr-1" />
                )}
                {currentResult.isCorrect ? 'Correct' : 'Incorrect'}
              </Badge>
            )}
          </div>
          <CardTitle className="text-base font-medium leading-relaxed">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Answer Input Based on Question Type */}
          {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && (
            <RadioGroup
              value={userAnswers[currentQuestion.id] || ''}
              onValueChange={handleAnswerChange}
              disabled={isCurrentQuestionAnswered}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === QuestionType.TRUE_FALSE && (
            <RadioGroup
              value={userAnswers[currentQuestion.id] || ''}
              onValueChange={handleAnswerChange}
              disabled={isCurrentQuestionAnswered}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="True" id="true" />
                <Label htmlFor="true" className="cursor-pointer">True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="False" id="false" />
                <Label htmlFor="false" className="cursor-pointer">False</Label>
              </div>
            </RadioGroup>
          )}

          {currentQuestion.type === QuestionType.FILL_BLANK && (
            <div className="space-y-2">
              <Label htmlFor="fill-blank">Your Answer:</Label>
              <Input
                id="fill-blank"
                value={userAnswers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                disabled={isCurrentQuestionAnswered}
                placeholder="Type your answer here..."
              />
            </div>
          )}

          {currentQuestion.type === QuestionType.CODE_CHALLENGE && (
            <div className="space-y-2">
              <Label htmlFor="code-answer">Your Answer:</Label>
              <Textarea
                id="code-answer"
                value={userAnswers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                disabled={isCurrentQuestionAnswered}
                placeholder="Type your answer here..."
                rows={4}
                className="font-mono"
              />
            </div>
          )}

          {/* Submit Button */}
          {!isCurrentQuestionAnswered && (
            <Button
              onClick={handleSubmitAnswer}
              disabled={!userAnswers[currentQuestion.id] || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </Button>
          )}

          {/* Explanation */}
          {showExplanation && currentResult && (
            <Card className={`border-l-4 ${currentResult.isCorrect ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {currentResult.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {currentResult.isCorrect ? 'Correct!' : 'Incorrect'}
                    </span>
                  </div>
                  {!currentResult.isCorrect && (
                    <p className="text-sm">
                      <strong>Correct answer:</strong> {currentResult.correctAnswer}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {currentResult.explanation}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex space-x-2">
          {isCurrentQuestionAnswered && currentQuestionIndex < totalQuestions - 1 && (
            <Button onClick={handleNextQuestion}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          
          {quizCompleted && (
            <Button onClick={() => onQuizComplete(currentScore)}>
              View Results
            </Button>
          )}
        </div>
      </div>

      {/* Quiz Completion Message */}
      {quizCompleted && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
              <h3 className="text-lg font-semibold text-green-800">Quiz Completed!</h3>
              <p className="text-green-700">
                Final Score: {Math.round(currentScore)}% ({correctAnswers}/{totalQuestions} correct)
              </p>
              <p className="text-sm text-green-600">
                Time taken: {formatTime(timeElapsed)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}