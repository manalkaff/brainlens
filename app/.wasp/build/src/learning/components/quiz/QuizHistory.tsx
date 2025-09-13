import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Calendar, Clock, Target, TrendingUp, Eye } from 'lucide-react';
import type { Quiz, Topic } from 'wasp/entities';

interface QuizHistoryProps {
  quizzes: (Quiz & {
    topic: {
      id: string;
      title: string;
      slug: string;
    };
    _count: {
      questions: number;
    };
  })[];
  onViewQuiz: (quiz: Quiz) => void;
  onRetakeQuiz: (topicId: string) => void;
}

export function QuizHistory({ quizzes, onViewQuiz, onRetakeQuiz }: QuizHistoryProps) {
  // Calculate overall statistics
  const completedQuizzes = quizzes.filter(q => q.completed);
  const totalQuizzes = quizzes.length;
  const averageScore = completedQuizzes.length > 0 
    ? completedQuizzes.reduce((sum, quiz) => sum + (quiz.score || 0), 0) / completedQuizzes.length 
    : 0;

  // Group quizzes by topic
  const quizzesByTopic = quizzes.reduce((acc, quiz) => {
    const topicId = quiz.topic.id;
    if (!acc[topicId]) {
      acc[topicId] = {
        topic: quiz.topic,
        quizzes: []
      };
    }
    acc[topicId].quizzes.push(quiz);
    return acc;
  }, {} as Record<string, { topic: { id: string; title: string; slug: string }; quizzes: typeof quizzes }>);

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time
  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get performance color
  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Calculate improvement trend
  const getImprovementTrend = (quizzes: Quiz[]) => {
    const sortedQuizzes = quizzes
      .filter(q => q.completed && q.score !== null)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    if (sortedQuizzes.length < 2) return null;
    
    const firstScore = sortedQuizzes[0].score || 0;
    const lastScore = sortedQuizzes[sortedQuizzes.length - 1].score || 0;
    const improvement = lastScore - firstScore;
    
    return {
      improvement,
      isImproving: improvement > 0,
      isStable: Math.abs(improvement) < 5
    };
  };

  if (quizzes.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No Quizzes Yet</h3>
              <p className="text-muted-foreground">
                Generate your first quiz to start tracking your progress
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quiz Statistics</CardTitle>
          <CardDescription>Your overall quiz performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{totalQuizzes}</div>
              <div className="text-xs text-muted-foreground">Total Quizzes</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{completedQuizzes.length}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{Math.round(averageScore)}%</div>
              <div className="text-xs text-muted-foreground">Average Score</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(quizzesByTopic).length}
              </div>
              <div className="text-xs text-muted-foreground">Topics Covered</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quizzes by Topic */}
      {Object.entries(quizzesByTopic).map(([topicId, { topic, quizzes: topicQuizzes }]) => {
        const trend = getImprovementTrend(topicQuizzes);
        const latestQuiz = topicQuizzes
          .filter(q => q.completed)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        return (
          <Card key={topicId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{topic.title}</CardTitle>
                  <CardDescription>
                    {topicQuizzes.length} quiz{topicQuizzes.length !== 1 ? 'es' : ''} taken
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {trend && (
                    <Badge variant="outline" className={
                      trend.isImproving ? 'text-green-600 border-green-200' :
                      trend.isStable ? 'text-blue-600 border-blue-200' :
                      'text-red-600 border-red-200'
                    }>
                      <TrendingUp className={`w-3 h-3 mr-1 ${
                        trend.isImproving ? '' : 
                        trend.isStable ? 'rotate-90' : 'rotate-180'
                      }`} />
                      {trend.isImproving ? '+' : trend.isStable ? '±' : ''}
                      {Math.abs(Math.round(trend.improvement))}%
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRetakeQuiz(topicId)}
                  >
                    New Quiz
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topicQuizzes
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((quiz) => (
                    <div key={quiz.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{quiz.title}</span>
                          {quiz.completed ? (
                            <Badge className={`text-xs ${getPerformanceColor(quiz.score || 0)}`}>
                              {Math.round(quiz.score || 0)}%
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              In Progress
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(quiz.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(quiz.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="w-3 h-3" />
                            <span>{quiz._count.questions} questions</span>
                          </div>
                        </div>
                        {quiz.completed && quiz.score !== null && (
                          <Progress value={quiz.score} className="w-full h-1" />
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewQuiz(quiz)}
                        className="ml-4"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}