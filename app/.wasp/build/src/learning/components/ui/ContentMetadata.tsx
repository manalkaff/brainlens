import React from 'react';
import { Clock, BookOpen, Zap, TrendingUp, Target, Users, Calendar, CheckCircle, Circle } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Separator } from '../../../components/ui/separator';
import { cn } from '../../../lib/utils';
import type { TopicTreeItem } from './TopicTree';

interface SourceAttribution {
  id: string;
  title: string;
  url?: string;
  source: string;
  contentType: string;
  relevanceScore?: number;
}

interface ContentMetadataProps {
  topic: TopicTreeItem;
  parentTopic?: TopicTreeItem;
  sources?: SourceAttribution[];
  estimatedReadTime?: number;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  learningObjectives?: string[];
  topicPosition?: {
    current: number;
    total: number;
  };
  className?: string;
  compact?: boolean;
}

// Utility function to calculate estimated read time from content
export function calculateReadTime(content: string, wordsPerMinute: number = 200): number {
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Utility function to determine complexity based on topic depth and content
export function determineComplexity(topic: TopicTreeItem, content?: string): 'beginner' | 'intermediate' | 'advanced' {
  // Base complexity on topic depth
  if (topic.depth === 0) return 'beginner';
  if (topic.depth === 1) return 'intermediate';
  if (topic.depth >= 2) return 'advanced';
  
  // Could be enhanced with content analysis in the future
  return 'intermediate';
}

// Utility function to extract learning objectives from topic
export function extractLearningObjectives(topic: TopicTreeItem): string[] {
  // This could be enhanced to parse objectives from topic summary or content
  const objectives: string[] = [];
  
  if (topic.summary) {
    // Simple extraction - could be improved with NLP
    const sentences = topic.summary.split('.').filter(s => s.trim().length > 0);
    objectives.push(...sentences.slice(0, 3).map(s => s.trim()));
  }
  
  return objectives;
}

export function ContentMetadata({
  topic,
  parentTopic,
  sources = [],
  estimatedReadTime,
  complexity,
  prerequisites = [],
  learningObjectives = [],
  topicPosition,
  className,
  compact = false
}: ContentMetadataProps) {
  // Calculate derived values
  const readTime = estimatedReadTime || 5;
  const topicComplexity = complexity || determineComplexity(topic);
  const objectives = learningObjectives.length > 0 ? learningObjectives : extractLearningObjectives(topic);
  
  // Progress calculation
  const progressPercentage = topic.userProgress?.completed ? 100 : 
    topic.userProgress?.timeSpent ? Math.min((topic.userProgress.timeSpent / (readTime * 60)) * 100, 95) : 0;

  // Complexity styling
  const getComplexityStyle = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
        {/* Complexity */}
        <Badge variant="outline" className={cn("text-xs", getComplexityStyle(topicComplexity))}>
          {topicComplexity}
        </Badge>
        
        {/* Read time */}
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{readTime}min</span>
        </div>
        
        {/* Sources count */}
        {sources.length > 0 && (
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>{sources.length}</span>
          </div>
        )}
        
        {/* Progress */}
        {topic.userProgress && (
          <div className="flex items-center gap-1">
            {topic.userProgress.completed ? (
              <CheckCircle className="w-3 h-3 text-green-600" />
            ) : (
              <Circle className="w-3 h-3" />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Topic Context and Relationship */}
      {parentTopic && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Part of:</span>
          <Badge variant="outline" className="text-xs">
            {parentTopic.title}
          </Badge>
          {topicPosition && (
            <span className="text-xs">
              ({topicPosition.current} of {topicPosition.total})
            </span>
          )}
        </div>
      )}

      {/* Main Metadata Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Topic Level */}
        <Badge variant="outline" className="text-xs">
          {topic.depth === 0 ? 'Main Topic' : `Level ${topic.depth} Subtopic`}
        </Badge>
        
        {/* Complexity */}
        <Badge variant="secondary" className={cn("text-xs", getComplexityStyle(topicComplexity))}>
          <Target className="w-3 h-3 mr-1" />
          {topicComplexity}
        </Badge>
        
        {/* Estimated Read Time */}
        <Badge variant="outline" className="text-xs">
          <Clock className="w-3 h-3 mr-1" />
          {readTime} min read
        </Badge>
        
        {/* Sources Count */}
        {sources.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            <BookOpen className="w-3 h-3 mr-1" />
            {sources.length} source{sources.length !== 1 ? 's' : ''}
          </Badge>
        )}
        
        {/* Progress Status */}
        {topic.userProgress && (
          <>
            {topic.userProgress.completed ? (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            ) : topic.userProgress.timeSpent > 0 ? (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {Math.round(topic.userProgress.timeSpent / 60)}m spent
              </Badge>
            ) : null}
          </>
        )}
      </div>

      {/* Progress Bar */}
      {topic.userProgress && !topic.userProgress.completed && progressPercentage > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Reading Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      )}

      {/* Prerequisites */}
      {prerequisites.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Prerequisites</h4>
          <div className="flex flex-wrap gap-1">
            {prerequisites.map((prereq, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {prereq}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Learning Objectives */}
      {objectives.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">What you'll learn</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {objectives.slice(0, 3).map((objective, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>{objective}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Source Attribution */}
      {sources.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Sources</h4>
          <div className="space-y-1">
            {sources.slice(0, 3).map((source, index) => (
              <div key={source.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                {source.url ? (
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors underline"
                  >
                    {source.title}
                  </a>
                ) : (
                  <span>{source.title}</span>
                )}
                <Badge variant="outline" className="text-xs">
                  {source.source}
                </Badge>
                {source.relevanceScore && (
                  <span className="text-xs opacity-75">
                    {Math.round(source.relevanceScore * 100)}% relevant
                  </span>
                )}
              </div>
            ))}
            {sources.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{sources.length - 3} more sources
              </div>
            )}
          </div>
        </div>
      )}

      {/* Topic Position in Hierarchy */}
      {topicPosition && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <TrendingUp className="w-3 h-3" />
          <span>
            Topic {topicPosition.current} of {topicPosition.total} in this section
          </span>
        </div>
      )}
    </div>
  );
}

export default ContentMetadata;