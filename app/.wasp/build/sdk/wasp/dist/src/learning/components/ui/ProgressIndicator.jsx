import React from 'react';
import { Progress } from '../../../components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { useTopicContext } from '../../context/TopicContext';
export function ProgressIndicator({ className, showDetails = false }) {
    const { progressSummary, topic } = useTopicContext();
    if (!progressSummary || !topic) {
        return (<div className={className}>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-muted animate-pulse"/>
          <span className="text-sm text-muted-foreground">Loading progress...</span>
        </div>
      </div>);
    }
    const { userProgress, childrenProgress, hierarchyProgress } = progressSummary;
    const completionPercentage = childrenProgress.completionPercentage;
    const isCompleted = userProgress?.completed || false;
    // Format time spent
    const formatTimeSpent = (seconds) => {
        if (seconds < 60)
            return `${seconds}s`;
        if (seconds < 3600)
            return `${Math.floor(seconds / 60)}m`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    };
    if (!showDetails) {
        // Compact progress indicator
        return (<div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500' : completionPercentage > 0 ? 'bg-blue-500' : 'bg-muted'}`}/>
          <span className="text-sm font-medium">
            {completionPercentage.toFixed(0)}% Complete
          </span>
        </div>
        {hierarchyProgress.totalTimeSpent > 0 && (<span className="text-sm text-muted-foreground">
            {formatTimeSpent(hierarchyProgress.totalTimeSpent)} spent
          </span>)}
        {hierarchyProgress.totalBookmarks > 0 && (<span className="text-sm text-muted-foreground">
            {hierarchyProgress.totalBookmarks} bookmarks
          </span>)}
      </div>);
    }
    // Detailed progress card
    return (<Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${isCompleted ? 'bg-green-500' : completionPercentage > 0 ? 'bg-blue-500' : 'bg-muted'}`}/>
          Learning Progress
        </CardTitle>
        <CardDescription>
          Track your progress through this topic
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Completion</span>
            <span className="font-medium">{completionPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2"/>
        </div>

        {/* Children Progress */}
        {childrenProgress.total > 0 && (<div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600">{childrenProgress.completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">{childrenProgress.inProgress}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-muted-foreground">{childrenProgress.notStarted}</div>
              <div className="text-xs text-muted-foreground">Not Started</div>
            </div>
          </div>)}

        {/* Time and Bookmarks */}
        <div className="flex justify-between text-sm pt-2 border-t">
          <div>
            <span className="text-muted-foreground">Time Spent: </span>
            <span className="font-medium">{formatTimeSpent(hierarchyProgress.totalTimeSpent)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Bookmarks: </span>
            <span className="font-medium">{hierarchyProgress.totalBookmarks}</span>
          </div>
        </div>

        {/* Depth Progress */}
        {hierarchyProgress.deepestCompletedLevel >= 0 && (<div className="text-sm">
            <span className="text-muted-foreground">Deepest Level: </span>
            <span className="font-medium">Level {hierarchyProgress.deepestCompletedLevel + 1}</span>
          </div>)}
      </CardContent>
    </Card>);
}
//# sourceMappingURL=ProgressIndicator.jsx.map