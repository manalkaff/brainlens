import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { useTopicContext } from '../../context/TopicContext';

export function QuizTab() {
  const { topic, isLoading } = useTopicContext();

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

  return (
    <div className="space-y-6">
      {/* Quiz Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
            Generate Quiz
          </CardTitle>
          <CardDescription>
            Create adaptive quizzes based on your learning progress for {topic.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg text-center">
                <div className="text-sm font-medium">Quick Quiz</div>
                <div className="text-xs text-muted-foreground">5 questions</div>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <div className="text-sm font-medium">Comprehensive</div>
                <div className="text-xs text-muted-foreground">15 questions</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Question Types</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2 opacity-50">
                  <input type="checkbox" disabled className="rounded" />
                  <span className="text-sm">Multiple Choice</span>
                </div>
                <div className="flex items-center space-x-2 opacity-50">
                  <input type="checkbox" disabled className="rounded" />
                  <span className="text-sm">True/False</span>
                </div>
                <div className="flex items-center space-x-2 opacity-50">
                  <input type="checkbox" disabled className="rounded" />
                  <span className="text-sm">Fill in the Blank</span>
                </div>
                <div className="flex items-center space-x-2 opacity-50">
                  <input type="checkbox" disabled className="rounded" />
                  <span className="text-sm">Code Challenges</span>
                </div>
              </div>
            </div>
            
            <Button disabled className="w-full">
              Generate Quiz (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quiz History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-3" />
            Quiz History & Progress
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
                <div className="text-2xl font-bold text-muted-foreground">0</div>
                <div className="text-xs text-muted-foreground">Quizzes Taken</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-muted-foreground">0%</div>
                <div className="text-xs text-muted-foreground">Average Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-muted-foreground">0</div>
                <div className="text-xs text-muted-foreground">Badges Earned</div>
              </div>
            </div>
            
            {/* Progress Chart Placeholder */}
            <div className="h-32 border rounded-lg bg-muted/20 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Progress chart will appear after taking quizzes
              </p>
            </div>
            
            {/* Recent Quizzes */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recent Quizzes</h4>
              <div className="text-center text-muted-foreground text-sm py-4">
                No quizzes taken yet. Generate your first quiz above!
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-3" />
            Achievements & Badges
          </CardTitle>
          <CardDescription>
            Unlock badges and achievements as you learn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Achievement Badges */}
            <div className="text-center p-3 border rounded-lg opacity-50">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                🏆
              </div>
              <div className="text-xs font-medium">First Quiz</div>
              <div className="text-xs text-muted-foreground">Complete your first quiz</div>
            </div>
            
            <div className="text-center p-3 border rounded-lg opacity-50">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                🎯
              </div>
              <div className="text-xs font-medium">Perfect Score</div>
              <div className="text-xs text-muted-foreground">Score 100% on a quiz</div>
            </div>
            
            <div className="text-center p-3 border rounded-lg opacity-50">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                🔥
              </div>
              <div className="text-xs font-medium">Quiz Streak</div>
              <div className="text-xs text-muted-foreground">Take quizzes 5 days in a row</div>
            </div>
            
            <div className="text-center p-3 border rounded-lg opacity-50">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                📚
              </div>
              <div className="text-xs font-medium">Knowledge Master</div>
              <div className="text-xs text-muted-foreground">Complete all topic quizzes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Study Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-purple-500 mr-3" />
            Study Recommendations
          </CardTitle>
          <CardDescription>
            Personalized suggestions based on quiz performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg opacity-50">
              <div className="font-medium text-sm">Review Fundamentals</div>
              <div className="text-xs text-muted-foreground">
                Focus on basic concepts before taking advanced quizzes
              </div>
            </div>
            <div className="p-3 border rounded-lg opacity-50">
              <div className="font-medium text-sm">Practice More Examples</div>
              <div className="text-xs text-muted-foreground">
                Work through practical applications to improve understanding
              </div>
            </div>
            <div className="p-3 border rounded-lg opacity-50">
              <div className="font-medium text-sm">Explore Related Topics</div>
              <div className="text-xs text-muted-foreground">
                Expand your knowledge with connected concepts
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}