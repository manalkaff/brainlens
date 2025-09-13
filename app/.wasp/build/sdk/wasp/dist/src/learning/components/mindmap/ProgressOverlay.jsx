import React from 'react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { Card, CardContent } from '../../../components/ui/card';
import { CheckCircle, Clock, Circle, TrendingUp, Target, Award, Zap } from 'lucide-react';
export function ProgressOverlay({ stats, onFocusProgress, className = '' }) {
    const notStarted = stats.total - stats.completed - stats.inProgress;
    // Achievement levels
    const getAchievementLevel = (completionRate) => {
        if (completionRate >= 90)
            return { level: 'Master', color: 'text-purple-600', icon: Award };
        if (completionRate >= 75)
            return { level: 'Expert', color: 'text-blue-600', icon: Target };
        if (completionRate >= 50)
            return { level: 'Advanced', color: 'text-green-600', icon: TrendingUp };
        if (completionRate >= 25)
            return { level: 'Learning', color: 'text-yellow-600', icon: Zap };
        return { level: 'Beginner', color: 'text-gray-600', icon: Circle };
    };
    const achievement = getAchievementLevel(stats.completionRate);
    const AchievementIcon = achievement.icon;
    return (<Card className={`${className} bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-sm border shadow-lg`}>
      <CardContent className="p-4 space-y-4">
        {/* Header with Achievement */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AchievementIcon className={`w-5 h-5 ${achievement.color}`}/>
            <div>
              <h3 className="font-semibold text-sm">Learning Progress</h3>
              <p className={`text-xs ${achievement.color}`}>{achievement.level}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {Math.round(stats.completionRate)}%
          </Badge>
        </div>

        {/* Main Progress Bar */}
        <div className="space-y-2">
          <Progress value={stats.completionRate} className="h-3 bg-gray-200"/>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{stats.completed} of {stats.total} completed</span>
            <span>{Math.round(stats.completionRate)}%</span>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Button variant="outline" size="sm" onClick={() => onFocusProgress('completed')} className="h-auto p-2 flex flex-col items-center gap-1 hover:bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600"/>
            <div className="text-center">
              <div className="font-semibold text-green-700">{stats.completed}</div>
              <div className="text-muted-foreground">Done</div>
            </div>
          </Button>

          <Button variant="outline" size="sm" onClick={() => onFocusProgress('inProgress')} className="h-auto p-2 flex flex-col items-center gap-1 hover:bg-blue-50 border-blue-200">
            <Clock className="w-4 h-4 text-blue-600"/>
            <div className="text-center">
              <div className="font-semibold text-blue-700">{stats.inProgress}</div>
              <div className="text-muted-foreground">Active</div>
            </div>
          </Button>

          <Button variant="outline" size="sm" onClick={() => onFocusProgress('notStarted')} className="h-auto p-2 flex flex-col items-center gap-1 hover:bg-gray-50 border-gray-200">
            <Circle className="w-4 h-4 text-gray-600"/>
            <div className="text-center">
              <div className="font-semibold text-gray-700">{notStarted}</div>
              <div className="text-muted-foreground">New</div>
            </div>
          </Button>
        </div>

        {/* Additional Metrics */}
        {(stats.totalTimeSpent || stats.averageSessionTime) && (<div className="space-y-2 pt-2 border-t">
            {stats.totalTimeSpent && (<div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Time Invested</span>
                <span className="font-medium">
                  {Math.round(stats.totalTimeSpent / 60)}h {stats.totalTimeSpent % 60}m
                </span>
              </div>)}
            
            {stats.averageSessionTime && (<div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Avg. Session</span>
                <span className="font-medium">
                  {Math.round(stats.averageSessionTime)} min
                </span>
              </div>)}
          </div>)}

        {/* Motivational Message */}
        {stats.completionRate > 0 && (<div className="text-xs text-center text-muted-foreground italic">
            {stats.completionRate >= 90
                ? "🎉 Almost there! You're doing amazing!"
                : stats.completionRate >= 50
                    ? "🚀 Great progress! Keep it up!"
                    : stats.completionRate >= 25
                        ? "💪 You're building momentum!"
                        : "🌱 Every expert was once a beginner!"}
          </div>)}
      </CardContent>
    </Card>);
}
// Compact version for smaller spaces
export function CompactProgressOverlay({ stats, onFocusProgress, className = '' }) {
    return (<div className={`${className} bg-white/90 backdrop-blur-sm border rounded-lg p-3 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Progress</span>
        <Badge variant="outline" className="text-xs">
          {Math.round(stats.completionRate)}%
        </Badge>
      </div>
      
      <Progress value={stats.completionRate} className="h-2 mb-2"/>
      
      <div className="flex justify-between text-xs">
        <button onClick={() => onFocusProgress('completed')} className="flex items-center gap-1 text-green-600 hover:text-green-700">
          <CheckCircle className="w-3 h-3"/>
          {stats.completed}
        </button>
        
        <button onClick={() => onFocusProgress('inProgress')} className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
          <Clock className="w-3 h-3"/>
          {stats.inProgress}
        </button>
        
        <button onClick={() => onFocusProgress('notStarted')} className="flex items-center gap-1 text-gray-600 hover:text-gray-700">
          <Circle className="w-3 h-3"/>
          {stats.total - stats.completed - stats.inProgress}
        </button>
      </div>
    </div>);
}
//# sourceMappingURL=ProgressOverlay.jsx.map