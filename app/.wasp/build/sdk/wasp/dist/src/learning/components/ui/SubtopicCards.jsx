import React from 'react';
import { ChevronRight, Clock, Star, BookOpen, Zap } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../lib/utils';
const complexityConfig = {
    beginner: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        icon: BookOpen,
        label: 'Beginner'
    },
    intermediate: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        icon: Zap,
        label: 'Intermediate'
    },
    advanced: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        icon: Star,
        label: 'Advanced'
    }
};
const priorityConfig = {
    1: { label: 'Low', color: 'text-muted-foreground' },
    2: { label: 'Medium', color: 'text-blue-600 dark:text-blue-400' },
    3: { label: 'High', color: 'text-orange-600 dark:text-orange-400' },
    4: { label: 'Critical', color: 'text-red-600 dark:text-red-400' },
    5: { label: 'Essential', color: 'text-purple-600 dark:text-purple-400' }
};
export function SubtopicCards({ subtopics, onSubtopicClick, selectedSubtopicId, isGeneratingContent = false, className }) {
    if (subtopics.length === 0) {
        return null;
    }
    const handleCardClick = (subtopic) => {
        if (isGeneratingContent)
            return;
        onSubtopicClick(subtopic.topic);
    };
    const handleKeyDown = (event, subtopic) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleCardClick(subtopic);
        }
    };
    return (<div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Explore Further</h2>
        <Badge variant="outline" className="text-xs">
          {subtopics.length} subtopic{subtopics.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subtopics.map((subtopic) => {
            const complexityInfo = complexityConfig[subtopic.complexity];
            const priorityInfo = priorityConfig[subtopic.priority] || priorityConfig[1];
            const ComplexityIcon = complexityInfo.icon;
            const isSelected = selectedSubtopicId === subtopic.id;
            const isDisabled = isGeneratingContent;
            return (<Card key={subtopic.id} className={cn("cursor-pointer transition-all duration-200 hover:shadow-md group", "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2", isSelected && "ring-2 ring-primary ring-offset-2 shadow-md", isDisabled && "opacity-50 cursor-not-allowed", !subtopic.hasContent && "border-dashed border-2")} onClick={() => handleCardClick(subtopic)} onKeyDown={(e) => handleKeyDown(e, subtopic)} tabIndex={isDisabled ? -1 : 0} role="button" aria-label={`Navigate to ${subtopic.title} subtopic`} aria-pressed={isSelected} aria-disabled={isDisabled}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header with title and complexity */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {subtopic.title}
                      </h3>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant="secondary" className={cn("text-xs", complexityInfo.color)}>
                        <ComplexityIcon className="w-3 h-3 mr-1"/>
                        {complexityInfo.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {subtopic.description}
                  </p>

                  {/* Metadata row */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {/* Priority indicator */}
                      <div className="flex items-center gap-1">
                        <div className={cn("w-2 h-2 rounded-full", priorityInfo.color.replace('text-', 'bg-'))} aria-label={`Priority: ${priorityInfo.label}`}/>
                        <span className={priorityInfo.color}>
                          {priorityInfo.label}
                        </span>
                      </div>

                      {/* Estimated read time */}
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3"/>
                        <span>{subtopic.estimatedReadTime}min</span>
                      </div>
                    </div>

                    {/* Navigation arrow */}
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"/>
                  </div>

                  {/* Content status indicator */}
                  {!subtopic.hasContent && (<div className="mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3"/>
                        <span>Click to generate content</span>
                      </div>
                    </div>)}

                  {/* Progress indicator if available */}
                  {subtopic.topic.userProgress && (<div className="mt-2 flex items-center gap-2">
                      {subtopic.topic.userProgress.completed ? (<Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Completed
                        </Badge>) : subtopic.topic.userProgress.timeSpent > 0 ? (<Badge variant="outline" className="text-xs">
                          {Math.round(subtopic.topic.userProgress.timeSpent / 60)}m spent
                        </Badge>) : null}
                    </div>)}
                </div>
              </CardContent>
            </Card>);
        })}
      </div>

      {/* Loading state overlay */}
      {isGeneratingContent && (<div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"/>
            <span>Generating content...</span>
          </div>
        </div>)}
    </div>);
}
// Helper function to convert TopicTreeItem to SubtopicCard
export function topicToSubtopicCard(topic) {
    // Extract metadata or use defaults
    const metadata = topic.metadata || {};
    return {
        id: topic.id,
        title: topic.title,
        description: topic.summary || topic.description || 'Explore this subtopic to learn more.',
        complexity: metadata.complexity || 'beginner',
        priority: metadata.priority || 1,
        estimatedReadTime: metadata.estimatedReadTime || 5,
        hasContent: Boolean(metadata.hasContent || topic.status === 'completed'),
        topic
    };
}
// Helper function to convert multiple topics to subtopic cards
export function topicsToSubtopicCards(topics) {
    return topics.map(topicToSubtopicCard);
}
//# sourceMappingURL=SubtopicCards.jsx.map