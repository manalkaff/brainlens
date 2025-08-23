import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { Label } from '../../../components/ui/label';
import { Loader2, Trophy, Target, BookOpen, Brain } from 'lucide-react';
import { useTopicContext } from '../../context/TopicContext';
import { generateQuiz, getUserQuizzes, useQuery } from 'wasp/client/operations';
import { QuizInterface } from '../quiz/QuizInterface';
import { QuizResults } from '../quiz/QuizResults';
import { QuizHistory } from '../quiz/QuizHistory';
import type { Quiz, QuizQuestion } from 'wasp/entities';
import { QuestionType } from '@prisma/client';

type QuizView = 'overview' | 'taking' | 'results' | 'history';

export function QuizTab() {
  const { topic, isLoading } = useTopicContext();
  const [currentView, setCurrentView] = useState<QuizView>('overview');
  const [currentQuiz, setCurrentQuiz] = useState<(Quiz & { questions: QuizQuestion[] }) | null>(null);
  const [quizTimeElapsed, setQuizTimeElapsed] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuestionType[]>([
    QuestionType.MULTIPLE_CHOICE,
    QuestionType.TRUE_FALSE
  ]);

  // Fetch user's quizzes for this topic
  const { 
    data: userQuizzesData, 
    isLoading: isLoadingQuizzes,
    refetch: refetchQuizzes 
  } = useQuery(getUserQuizzes, 
    topic ? { topicId: topic.id } : undefined,
    { enabled: !!topic }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Topic not found</p>
        </CardContent>
      </Card>
    );
  }

  const quizzes = userQuizzesData?.quizzes || [];
  const completedQuizzes = quizzes.filter(q => q.completed);
  const averageScore = completedQuizzes.length > 0 
    ? completedQuizzes.reduce((sum, quiz) => sum + (quiz.score || 0), 0) / completedQuizzes.length 
    : 0;

  // Handle quiz generation
  const handleGenerateQuiz = async () => {
    if (!topic) return;
    
    setIsGenerating(true);
    try {
      const quiz = await generateQuiz({
        topicId: topic.id,
        difficulty: selectedDifficulty
      });
      
      setCurrentQuiz(quiz as Quiz & { questions: QuizQuestion[] });
      setCurrentView('taking');
      setQuizTimeElapsed(0);
      refetchQuizzes();
    } catch (error) {
      console.error('Failed to generate quiz:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle quiz completion
  const handleQuizComplete = (finalScore: number) => {
    setCurrentView('results');
    refetchQuizzes();
  };

  // Handle question type selection
  const handleQuestionTypeChange = (questionType: QuestionType, checked: boolean) => {
    if (checked) {
      setSelectedQuestionTypes(prev => [...prev, questionType]);
    } else {
      setSelectedQuestionTypes(prev => prev.filter(type => type !== questionType));
    }
  };

  // Render based on current view
  if (currentView === 'taking' && currentQuiz) {
    return (
      <QuizInterface
        quiz={currentQuiz}
        onQuizComplete={handleQuizComplete}
        onExit={() => {
          setCurrentView('overview');
          setCurrentQuiz(null);
        }}
      />
    );
  }

  if (currentView === 'results' && currentQuiz) {
    return (
      <QuizResults
        quiz={currentQuiz}
        timeElapsed={quizTimeElapsed}
        onRetakeQuiz={() => {
          setCurrentView('overview');
          setCurrentQuiz(null);
        }}
        onBackToQuizzes={() => {
          setCurrentView('overview');
          setCurrentQuiz(null);
        }}
      />
    );
  }

  if (currentView === 'history') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Quiz History</h2>
          <Button variant="outline" onClick={() => setCurrentView('overview')}>
            Back to Overview
          </Button>
        </div>
        <QuizHistory
          quizzes={quizzes}
          onViewQuiz={(quiz) => {
            setCurrentQuiz(quiz as Quiz & { questions: QuizQuestion[] });
            setCurrentView('results');
          }}
          onRetakeQuiz={(topicId) => {
            setCurrentView('overview');
          }}
        />
      </div>
    );
  }

  // Overview view (default)
  return (
    <div className="space-y-6">
      {/* Quiz Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center font-platform">
            <Brain className="w-5 h-5 mr-2 text-primary" />
            Generate Quiz
          </CardTitle>
          <CardDescription>
            Create adaptive quizzes based on your learning progress for {topic.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Difficulty Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Difficulty Level</Label>
              <RadioGroup
                value={selectedDifficulty}
                onValueChange={(value) => setSelectedDifficulty(value as 'beginner' | 'intermediate' | 'advanced')}
              >
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="beginner" id="beginner" />
                    <Label htmlFor="beginner" className="flex-1 cursor-pointer">
                      <div className="font-medium text-sm">Beginner</div>
                      <div className="text-xs text-muted-foreground">5-6 questions</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="intermediate" id="intermediate" />
                    <Label htmlFor="intermediate" className="flex-1 cursor-pointer">
                      <div className="font-medium text-sm">Intermediate</div>
                      <div className="text-xs text-muted-foreground">8-9 questions</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="advanced" id="advanced" />
                    <Label htmlFor="advanced" className="flex-1 cursor-pointer">
                      <div className="font-medium text-sm">Advanced</div>
                      <div className="text-xs text-muted-foreground">10+ questions</div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            {/* Question Types */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Question Types</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="multiple-choice"
                    checked={selectedQuestionTypes.includes(QuestionType.MULTIPLE_CHOICE)}
                    onCheckedChange={(checked) => 
                      handleQuestionTypeChange(QuestionType.MULTIPLE_CHOICE, checked as boolean)
                    }
                  />
                  <Label htmlFor="multiple-choice" className="text-sm cursor-pointer">
                    Multiple Choice
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="true-false"
                    checked={selectedQuestionTypes.includes(QuestionType.TRUE_FALSE)}
                    onCheckedChange={(checked) => 
                      handleQuestionTypeChange(QuestionType.TRUE_FALSE, checked as boolean)
                    }
                  />
                  <Label htmlFor="true-false" className="text-sm cursor-pointer">
                    True/False
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fill-blank"
                    checked={selectedQuestionTypes.includes(QuestionType.FILL_BLANK)}
                    onCheckedChange={(checked) => 
                      handleQuestionTypeChange(QuestionType.FILL_BLANK, checked as boolean)
                    }
                  />
                  <Label htmlFor="fill-blank" className="text-sm cursor-pointer">
                    Fill in the Blank
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="code-challenge"
                    checked={selectedQuestionTypes.includes(QuestionType.CODE_CHALLENGE)}
                    onCheckedChange={(checked) => 
                      handleQuestionTypeChange(QuestionType.CODE_CHALLENGE, checked as boolean)
                    }
                  />
                  <Label htmlFor="code-challenge" className="text-sm cursor-pointer">
                    Code Challenges
                  </Label>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleGenerateQuiz}
              disabled={isGenerating || selectedQuestionTypes.length === 0}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                'Generate Quiz'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quiz Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-success" />
              Quiz Statistics
            </div>
            {quizzes.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setCurrentView('history')}>
                View All
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Track your quiz performance and improvement over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{quizzes.length}</div>
                <div className="text-xs text-muted-foreground">Quizzes Taken</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success font-platform">
                  {Math.round(averageScore)}%
                </div>
                <div className="text-xs text-muted-foreground">Average Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning font-platform">
                  {completedQuizzes.filter(q => (q.score || 0) >= 90).length}
                </div>
                <div className="text-xs text-muted-foreground">Perfect Scores</div>
              </div>
            </div>
            
            {/* Recent Quizzes */}
            {quizzes.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recent Quizzes</h4>
                <div className="space-y-2">
                  {quizzes.slice(0, 3).map((quiz) => (
                    <div key={quiz.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{quiz.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(quiz.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {quiz.completed && (
                        <Badge variant={
                          (quiz.score || 0) >= 90 ? 'default' :
                          (quiz.score || 0) >= 70 ? 'secondary' :
                          'destructive'
                        } className="text-xs font-platform">
                          {Math.round(quiz.score || 0)}%
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">
                <BookOpen className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                <p>No quizzes taken yet.</p>
                <p>Generate your first quiz above!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center font-platform">
            <Trophy className="w-5 h-5 mr-2 text-warning" />
            Achievements & Badges
          </CardTitle>
          <CardDescription>
            Unlock badges and achievements as you learn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Achievement Badges */}
            <div className={`text-center p-3 border rounded-lg ${
              quizzes.length > 0 ? 'bg-success/10 border-success/20' : 'opacity-50'
            }`}>
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                🏆
              </div>
              <div className="text-xs font-medium">First Quiz</div>
              <div className="text-xs text-muted-foreground">Complete your first quiz</div>
              {quizzes.length > 0 && (
                <Badge className="mt-1 text-xs font-platform" variant="default">Earned!</Badge>
              )}
            </div>
            
            <div className={`text-center p-3 border rounded-lg ${
              completedQuizzes.some(q => (q.score || 0) === 100) ? 'bg-warning/10 border-warning/20' : 'opacity-50'
            }`}>
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                🎯
              </div>
              <div className="text-xs font-medium">Perfect Score</div>
              <div className="text-xs text-muted-foreground">Score 100% on a quiz</div>
              {completedQuizzes.some(q => (q.score || 0) === 100) && (
                <Badge className="mt-1 text-xs font-platform" variant="secondary">Earned!</Badge>
              )}
            </div>
            
            <div className="text-center p-3 border rounded-lg opacity-50">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                🔥
              </div>
              <div className="text-xs font-medium">Quiz Streak</div>
              <div className="text-xs text-muted-foreground">Take quizzes 5 days in a row</div>
            </div>
            
            <div className={`text-center p-3 border rounded-lg ${
              completedQuizzes.length >= 5 ? 'bg-secondary/10 border-secondary/20' : 'opacity-50'
            }`}>
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                📚
              </div>
              <div className="text-xs font-medium">Knowledge Master</div>
              <div className="text-xs text-muted-foreground">Complete 5 quizzes</div>
              {completedQuizzes.length >= 5 && (
                <Badge className="mt-1 text-xs font-platform" variant="outline">Earned!</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}