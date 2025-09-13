import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Trophy, Target, Clock, BookOpen, TrendingUp, RotateCcw } from 'lucide-react';
const achievements = [
    {
        id: 'first_quiz',
        title: 'First Steps',
        description: 'Complete your first quiz',
        icon: '🎯',
        earned: false,
        condition: () => true
    },
    {
        id: 'perfect_score',
        title: 'Perfect Score',
        description: 'Score 100% on a quiz',
        icon: '🏆',
        earned: false,
        condition: (score) => score === 100
    },
    {
        id: 'speed_demon',
        title: 'Speed Demon',
        description: 'Complete a quiz in under 5 minutes',
        icon: '⚡',
        earned: false,
        condition: (score, timeElapsed) => timeElapsed < 300 && score >= 70
    },
    {
        id: 'knowledge_seeker',
        title: 'Knowledge Seeker',
        description: 'Score above 80% on a quiz',
        icon: '📚',
        earned: false,
        condition: (score) => score >= 80
    },
    {
        id: 'persistent_learner',
        title: 'Persistent Learner',
        description: 'Complete a challenging quiz',
        icon: '💪',
        earned: false,
        condition: (score, timeElapsed, quiz) => {
            const quizWithQuestions = quiz;
            return (quizWithQuestions.questions?.length || 0) >= 10 && score >= 60;
        }
    }
];
export function QuizResults({ quiz, timeElapsed, onRetakeQuiz, onBackToQuizzes }) {
    // Ensure questions exist, fallback to empty array if not
    const questions = quiz.questions || [];
    const answeredQuestions = questions.filter(q => q.userAnswer !== null);
    const correctAnswers = answeredQuestions.filter(q => q.isCorrect === true);
    const incorrectAnswers = answeredQuestions.filter(q => q.isCorrect === false);
    const score = quiz.score || 0;
    const totalQuestions = questions.length;
    const correctCount = correctAnswers.length;
    const incorrectCount = incorrectAnswers.length;
    // Format time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    // Determine performance level
    const getPerformanceLevel = (score) => {
        if (score >= 90)
            return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
        if (score >= 80)
            return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
        if (score >= 70)
            return { level: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
        return { level: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-100' };
    };
    const performance = getPerformanceLevel(score);
    // Check earned achievements
    const earnedAchievements = achievements.filter(achievement => achievement.condition(score, timeElapsed, quiz));
    // Generate study recommendations
    const getStudyRecommendations = () => {
        const recommendations = [];
        if (score < 70) {
            recommendations.push({
                title: 'Review Fundamentals',
                description: 'Focus on basic concepts and definitions',
                priority: 'high'
            });
        }
        if (incorrectCount > correctCount / 2) {
            recommendations.push({
                title: 'Practice More Examples',
                description: 'Work through additional practice problems',
                priority: 'medium'
            });
        }
        if (score >= 80) {
            recommendations.push({
                title: 'Explore Advanced Topics',
                description: 'Ready to tackle more challenging concepts',
                priority: 'low'
            });
        }
        return recommendations;
    };
    const recommendations = getStudyRecommendations();
    return (<div className="max-w-4xl mx-auto space-y-6">
      {/* Overall Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Quiz Results</CardTitle>
              <CardDescription>{quiz.title}</CardDescription>
            </div>
            <Badge className={`${performance.bgColor} ${performance.color} border-0`}>
              {performance.level}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Score Display */}
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">
                {Math.round(score)}%
              </div>
              <div className="text-muted-foreground">
                {correctCount} out of {totalQuestions} questions correct
              </div>
              <Progress value={score} className="w-full max-w-md mx-auto"/>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Target className="w-6 h-6 mx-auto mb-2 text-green-600"/>
                <div className="text-2xl font-bold text-green-600">{correctCount}</div>
                <div className="text-xs text-muted-foreground">Correct</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="w-6 h-6 mx-auto mb-2 rounded-full bg-red-100 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-red-600"></div>
                </div>
                <div className="text-2xl font-bold text-red-600">{incorrectCount}</div>
                <div className="text-xs text-muted-foreground">Incorrect</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600"/>
                <div className="text-2xl font-bold text-blue-600">{formatTime(timeElapsed)}</div>
                <div className="text-xs text-muted-foreground">Time Taken</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <BookOpen className="w-6 h-6 mx-auto mb-2 text-purple-600"/>
                <div className="text-2xl font-bold text-purple-600">{totalQuestions}</div>
                <div className="text-xs text-muted-foreground">Total Questions</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Question Breakdown</CardTitle>
          <CardDescription>Review your answers and explanations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {questions.map((question, index) => (<div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        Question {index + 1}
                      </Badge>
                      <Badge variant={question.isCorrect ? 'default' : 'destructive'} className="text-xs">
                        {question.isCorrect ? 'Correct' : 'Incorrect'}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{question.question}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Your answer: </span>
                    <span className={question.isCorrect ? 'text-green-600' : 'text-red-600'}>
                      {question.userAnswer || 'Not answered'}
                    </span>
                  </div>
                  
                  {!question.isCorrect && (<div>
                      <span className="font-medium">Correct answer: </span>
                      <span className="text-green-600">{question.correctAnswer}</span>
                    </div>)}
                  
                  {question.explanation && (<div className="p-2 bg-muted rounded text-xs">
                      <span className="font-medium">Explanation: </span>
                      {question.explanation}
                    </div>)}
                </div>
              </div>))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      {earnedAchievements.length > 0 && (<Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-600"/>
              Achievements Unlocked!
            </CardTitle>
            <CardDescription>You've earned new badges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {earnedAchievements.map((achievement) => (<div key={achievement.id} className="text-center p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                  <div className="text-2xl mb-2">{achievement.icon}</div>
                  <div className="font-medium text-sm">{achievement.title}</div>
                  <div className="text-xs text-muted-foreground">{achievement.description}</div>
                </div>))}
            </div>
          </CardContent>
        </Card>)}

      {/* Study Recommendations */}
      {recommendations.length > 0 && (<Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600"/>
              Study Recommendations
            </CardTitle>
            <CardDescription>Personalized suggestions to improve your understanding</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (<div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${rec.priority === 'high' ? 'bg-red-500' :
                    rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}/>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{rec.title}</div>
                    <div className="text-xs text-muted-foreground">{rec.description}</div>
                  </div>
                </div>))}
            </div>
          </CardContent>
        </Card>)}

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        <Button variant="outline" onClick={onRetakeQuiz}>
          <RotateCcw className="w-4 h-4 mr-2"/>
          Retake Quiz
        </Button>
        <Button onClick={onBackToQuizzes}>
          Back to Quizzes
        </Button>
      </div>
    </div>);
}
//# sourceMappingURL=QuizResults.jsx.map