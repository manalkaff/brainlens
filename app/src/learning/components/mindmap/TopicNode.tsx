import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Bookmark, 
  Users, 
  Lightbulb,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { TopicTreeItem } from '../ui/TopicTree';

export interface TopicNodeData extends Record<string, unknown> {
  topic: TopicTreeItem;
  isHighlighted?: boolean;
  onClick?: (topic: TopicTreeItem) => void;
}

export interface TopicNodeProps {
  data: TopicNodeData;
  selected?: boolean;
}

export const TopicNode = memo(({ data, selected }: TopicNodeProps) => {
  const { topic, isHighlighted, onClick } = data;
  const [showDetails, setShowDetails] = useState(false);
  
  const isCompleted = topic.userProgress?.completed || false;
  const hasProgress = topic.userProgress && topic.userProgress.timeSpent > 0;
  const isBookmarked = topic.userProgress?.bookmarks && topic.userProgress.bookmarks.length > 0;
  const hasChildren = topic.children && topic.children.length > 0;

  // Calculate node size based on content depth and engagement
  const getNodeSize = () => {
    const baseSize = 120;
    const depthMultiplier = Math.max(1, 4 - topic.depth); // Larger for higher level topics
    const engagementMultiplier = topic.userProgress?.timeSpent ? 
      Math.min(1.5, 1 + (topic.userProgress.timeSpent / 3600)) : 1; // Up to 1.5x for 1+ hours
    
    const width = baseSize * depthMultiplier * engagementMultiplier;
    const height = Math.max(60, width * 0.6);
    
    return { width, height };
  };

  // Get node color based on completion status
  const getNodeColor = () => {
    if (isCompleted) return 'bg-green-100 border-green-500 text-green-900 dark:bg-green-950 dark:text-green-100';
    if (hasProgress) return 'bg-blue-100 border-blue-500 text-blue-900 dark:bg-blue-950 dark:text-blue-100';
    return 'bg-gray-100 border-gray-300 text-gray-900 dark:bg-gray-800 dark:text-gray-100';
  };

  // Get status icon
  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (hasProgress) return <Clock className="w-4 h-4 text-blue-600" />;
    return <BookOpen className="w-4 h-4 text-gray-600" />;
  };

  // Get topic type icon based on metadata or content
  const getTopicIcon = () => {
    const title = topic.title.toLowerCase();
    if (title.includes('concept') || title.includes('theory')) {
      return <Lightbulb className="w-3 h-3" />;
    }
    if (title.includes('example') || title.includes('practice')) {
      return <Users className="w-3 h-3" />;
    }
    return <BookOpen className="w-3 h-3" />;
  };

  const { width, height } = getNodeSize();

  const handleClick = () => {
    onClick?.(topic);
  };

  const handleToggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
  };

  return (
    <>
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: isCompleted ? '#10b981' : hasProgress ? '#3b82f6' : '#6b7280',
          width: 8,
          height: 8,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: isCompleted ? '#10b981' : hasProgress ? '#3b82f6' : '#6b7280',
          width: 8,
          height: 8,
        }}
      />

      {/* Main Node */}
      <div
        className={`
          relative border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105
          ${getNodeColor()}
          ${selected ? 'ring-2 ring-primary ring-offset-2 shadow-lg' : ''}
          ${isHighlighted ? 'ring-2 ring-yellow-400 ring-offset-2 shadow-yellow-200 animate-pulse' : ''}
        `}
        style={{ width, height }}
        onClick={handleClick}
      >
        {/* Node Header */}
        <div className="p-3 h-full flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              {getTopicIcon()}
            </div>
            
            <div className="flex items-center gap-1">
              {isBookmarked && <Bookmark className="w-3 h-3 text-yellow-500" />}
              {hasChildren && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {topic.children.length}
                </Badge>
              )}
            </div>
          </div>

          {/* Topic Title */}
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="font-medium text-sm leading-tight mb-1 line-clamp-2">
              {topic.title}
            </h3>
            
            {topic.summary && !showDetails && (
              <p className="text-xs opacity-75 line-clamp-2">
                {topic.summary}
              </p>
            )}
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-1">
              {topic.userProgress?.timeSpent && topic.userProgress.timeSpent > 0 && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  {Math.round(topic.userProgress.timeSpent / 60)}m
                </Badge>
              )}
              
              <Badge variant="outline" className="text-xs px-1 py-0">
                L{topic.depth}
              </Badge>
            </div>

            {/* Details Toggle */}
            {(topic.summary || topic.description) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={handleToggleDetails}
              >
                {showDetails ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Completion Progress Bar */}
        {hasProgress && !isCompleted && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ 
                width: `${Math.min(100, (topic.userProgress?.timeSpent || 0) / 60 * 10)}%` 
              }}
            />
          </div>
        )}
      </div>

      {/* Detailed Tooltip/Popup */}
      {showDetails && (topic.summary || topic.description) && (
        <div 
          className="absolute top-full left-0 mt-2 z-50 w-64 max-w-sm"
          style={{ pointerEvents: 'auto' }}
        >
          <Card className="shadow-lg border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="line-clamp-1">{topic.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleToggleDetails}
                >
                  <ChevronUp className="w-3 h-3" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {topic.summary && (
                <p className="text-sm text-muted-foreground mb-2">
                  {topic.summary}
                </p>
              )}
              
              {topic.description && (
                <p className="text-xs text-muted-foreground">
                  {topic.description.length > 150 
                    ? `${topic.description.substring(0, 150)}...` 
                    : topic.description
                  }
                </p>
              )}

              {/* Quick Stats */}
              <div className="flex items-center gap-2 mt-3 pt-2 border-t">
                <div className="flex items-center gap-1">
                  {getStatusIcon()}
                  <span className="text-xs">
                    {isCompleted ? 'Completed' : hasProgress ? 'In Progress' : 'Not Started'}
                  </span>
                </div>
                
                {topic.userProgress?.timeSpent && (
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(topic.userProgress.timeSpent / 60)} min
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
});

TopicNode.displayName = 'TopicNode';