import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { HelpCircle, X } from 'lucide-react';

interface ContextualTooltipProps {
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: React.ReactNode;
  className?: string;
}

export function ContextualTooltip({ 
  title, 
  content, 
  position = 'top',
  trigger,
  className = ''
}: ContextualTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
      onClick={() => setIsVisible(!isVisible)}
    >
      <HelpCircle className="h-4 w-4" />
    </Button>
  );

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div onClick={() => setIsVisible(!isVisible)}>
        {trigger || defaultTrigger}
      </div>
      
      {isVisible && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-40 md:hidden" 
            onClick={() => setIsVisible(false)}
          />
          
          {/* Tooltip */}
          <Card className={`absolute z-50 w-80 max-w-sm shadow-lg ${positionClasses[position]}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-sm">{title}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 -mt-1 -mr-1"
                  onClick={() => setIsVisible(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {content}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// Predefined tooltips for common features
export const HelpTooltips = {
  knowledgeAssessment: {
    title: "Knowledge Assessment",
    content: "This quick assessment helps us understand your current knowledge level and learning preferences to create a personalized learning experience tailored just for you."
  },
  
  learningPaths: {
    title: "Learning Paths",
    content: "Based on your assessment, we recommend different learning approaches. Choose the one that matches your preferred learning style and available time."
  },
  
  streamingContent: {
    title: "Streaming Content",
    content: "Content is generated in real-time by our AI. You'll see it appear progressively as our system researches and structures the information for optimal learning."
  },
  
  conceptExpansion: {
    title: "Concept Expansion",
    content: "Click on highlighted concepts to get detailed explanations, examples, and related information without losing your place in the main content."
  },
  
  topicTree: {
    title: "Topic Tree",
    content: "Navigate through the hierarchical structure of your topic. Green indicators show completed sections, while gray indicates unexplored areas."
  },
  
  vectorSearch: {
    title: "AI-Powered Search",
    content: "Our AI understands the context of your questions and searches through all researched content to provide relevant, accurate answers."
  },
  
  mindMapNavigation: {
    title: "Mind Map Navigation",
    content: "Use mouse wheel to zoom, click and drag to pan. Different colors represent completion status, and node sizes indicate content depth."
  },
  
  adaptiveQuiz: {
    title: "Adaptive Quizzing",
    content: "Questions are generated based on what you've studied and adapt in difficulty based on your performance. This ensures optimal challenge level."
  },
  
  progressTracking: {
    title: "Progress Tracking",
    content: "Your learning progress is automatically tracked, including time spent, completion status, and areas of strength or improvement."
  },
  
  bookmarking: {
    title: "Bookmarking",
    content: "Save interesting sections or important concepts for quick access later. All bookmarks are synced across your devices."
  }
};

// Quick access component for common tooltips
interface QuickHelpProps {
  type: keyof typeof HelpTooltips;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function QuickHelp({ type, position = 'top', className }: QuickHelpProps) {
  const tooltip = HelpTooltips[type];
  
  return (
    <ContextualTooltip
      title={tooltip.title}
      content={tooltip.content}
      position={position}
      className={className}
    />
  );
}