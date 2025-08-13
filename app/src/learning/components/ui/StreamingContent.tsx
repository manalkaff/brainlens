import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { 
  Loader2, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Zap,
  Brain,
  Search,
  BookOpen
} from 'lucide-react';

// Types for streaming content
interface StreamingContentProps {
  topic: {
    id: string;
    title: string;
    summary?: string;
  };
  assessment: any; // AssessmentResult type
  selectedPath: any; // LearningPath type
  onProgressUpdate: (progress: number) => Promise<void>;
  onConceptExpand: (concept: string) => void;
  content?: string;
  isStreaming?: boolean;
  isComplete?: boolean;
  error?: string | null;
  title?: string;
  subtitle?: string;
  agent?: string;
  progress?: number;
  estimatedTime?: number;
  onRetry?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  className?: string;
  showTypewriter?: boolean;
  typewriterSpeed?: number;
  showProgress?: boolean;
  showAgent?: boolean;
}

interface TypewriterTextProps {
  text: string;
  speed: number;
  isActive: boolean;
  onComplete?: () => void;
  className?: string;
}

// Typewriter effect component
const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 50,
  isActive = true,
  onComplete,
  className = '',
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startTyping = useCallback(() => {
    if (!isActive || currentIndex >= text.length) return;

    setIsTyping(true);
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= text.length) {
          setIsTyping(false);
          onComplete?.();
          return text.length;
        }
        return nextIndex;
      });
    }, speed);
  }, [text, speed, isActive, currentIndex, onComplete]);

  const stopTyping = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTyping(false);
  }, []);

  // Update displayed text based on current index
  useEffect(() => {
    setDisplayedText(text.slice(0, currentIndex));
  }, [text, currentIndex]);

  // Start typing when text changes or becomes active
  useEffect(() => {
    if (isActive && text && currentIndex < text.length) {
      startTyping();
    } else {
      stopTyping();
    }

    return () => stopTyping();
  }, [text, isActive, startTyping, stopTyping, currentIndex]);

  // Reset when text changes
  useEffect(() => {
    setCurrentIndex(0);
    setDisplayedText('');
  }, [text]);

  return (
    <div className={className}>
      {displayedText}
      {isTyping && (
        <span className="animate-pulse text-blue-500 ml-1">|</span>
      )}
    </div>
  );
};

// Loading skeleton component
const ContentSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${Math.random() * 40 + 60}%` }} />
        <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${Math.random() * 30 + 70}%` }} />
      </div>
    ))}
  </div>
);

// Agent indicator component
const AgentIndicator: React.FC<{ agent: string; isActive: boolean }> = ({ agent, isActive }) => {
  const getAgentIcon = (agentName: string) => {
    switch (agentName.toLowerCase()) {
      case 'general':
        return <Search className="w-3 h-3" />;
      case 'academic':
        return <BookOpen className="w-3 h-3" />;
      case 'computational':
        return <Brain className="w-3 h-3" />;
      case 'video':
        return <Play className="w-3 h-3" />;
      case 'community':
        return <Zap className="w-3 h-3" />;
      default:
        return <Search className="w-3 h-3" />;
    }
  };

  const getAgentColor = (agentName: string) => {
    switch (agentName.toLowerCase()) {
      case 'general':
        return 'bg-blue-100 text-blue-800';
      case 'academic':
        return 'bg-green-100 text-green-800';
      case 'computational':
        return 'bg-purple-100 text-purple-800';
      case 'video':
        return 'bg-red-100 text-red-800';
      case 'community':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Badge 
      variant="secondary" 
      className={`${getAgentColor(agent)} ${isActive ? 'animate-pulse' : ''}`}
    >
      {getAgentIcon(agent)}
      <span className="ml-1 capitalize">{agent}</span>
      {isActive && <Loader2 className="w-3 h-3 ml-1 animate-spin" />}
    </Badge>
  );
};

// Main streaming content component
export const StreamingContent: React.FC<StreamingContentProps> = ({
  topic,
  assessment,
  selectedPath,
  onProgressUpdate,
  onConceptExpand,
  content = '',
  isStreaming = false,
  isComplete = false,
  error,
  title,
  subtitle,
  agent,
  progress = 0,
  estimatedTime,
  onRetry,
  onPause,
  onResume,
  className = '',
  showTypewriter = true,
  typewriterSpeed = 30,
  showProgress = true,
  showAgent = true,
}) => {
  const [isPaused, setIsPaused] = useState(false);

  const handlePause = () => {
    setIsPaused(true);
    onPause?.();
  };

  const handleResume = () => {
    setIsPaused(false);
    onResume?.();
  };

  const handleRetry = () => {
    onRetry?.();
  };

  const formatEstimatedTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card className={`${className} transition-all duration-300`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900">
              {title || topic.title}
            </CardTitle>
            {(subtitle || topic.summary) && (
              <p className="text-sm text-gray-600 mt-1">{subtitle || topic.summary}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {showAgent && agent && (
              <AgentIndicator agent={agent} isActive={isStreaming && !isPaused} />
            )}
            
            {isStreaming && !error && (
              <div className="flex items-center gap-1">
                {!isPaused ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePause}
                    className="h-8 w-8 p-0"
                  >
                    <Pause className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResume}
                    className="h-8 w-8 p-0"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
            
            {error && onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {showProgress && (isStreaming || isComplete) && (
          <div className="space-y-2 mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {isComplete ? 'Complete' : isStreaming ? 'Generating...' : 'Ready'}
              </span>
              <div className="flex items-center gap-2 text-gray-500">
                {estimatedTime && !isComplete && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatEstimatedTime(estimatedTime)}</span>
                  </div>
                )}
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {onRetry && (
                <Button
                  variant="link"
                  className="p-0 h-auto ml-2 text-red-600"
                  onClick={handleRetry}
                >
                  Try again
                </Button>
              )}
            </AlertDescription>
          </Alert>
        ) : content ? (
          <div className="prose prose-sm max-w-none">
            {showTypewriter && isStreaming && !isPaused ? (
              <TypewriterText
                text={content}
                speed={typewriterSpeed}
                isActive={!isPaused}
                onComplete={() => {}}
                className="whitespace-pre-wrap"
              />
            ) : (
              <div className="whitespace-pre-wrap">{content}</div>
            )}
          </div>
        ) : isStreaming ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating content...</span>
            </div>
            <ContentSkeleton lines={4} />
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Learning content for "{topic.title}" will be generated based on your {selectedPath?.name || 'selected'} learning path</p>
            <div className="mt-4 text-sm">
              <p>Assessment level: {assessment?.level || 'Not assessed'}</p>
              {selectedPath && (
                <p>Learning approach: {selectedPath.name}</p>
              )}
            </div>
          </div>
        )}

        {isComplete && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">
              Content generation complete
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Multi-section streaming content component
interface StreamingSectionProps {
  sections: Array<{
    id: string;
    title: string;
    content: string;
    isComplete: boolean;
    isActive: boolean;
    agent?: string;
    progress?: number;
  }>;
  currentSectionIndex: number;
  overallProgress: number;
  isStreaming: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

// Simple streaming content props for sections
interface SimpleStreamingContentProps {
  title?: string;
  content?: string;
  isStreaming?: boolean;
  isComplete?: boolean;
  agent?: string;
  progress?: number;
  error?: string | null;
  onRetry?: () => void;
  showTypewriter?: boolean;
  showProgress?: boolean;
  className?: string;
}

// Simple streaming content component for sections
const SimpleStreamingContent: React.FC<SimpleStreamingContentProps> = ({
  title,
  content = '',
  isStreaming = false,
  isComplete = false,
  agent,
  progress = 0,
  error,
  onRetry,
  showTypewriter = true,
  showProgress = true,
  className = '',
}) => {
  return (
    <Card className={`${className} transition-all duration-300`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {title && (
              <CardTitle className="text-lg font-semibold text-gray-900">
                {title}
              </CardTitle>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {agent && (
              <AgentIndicator agent={agent} isActive={isStreaming} />
            )}
          </div>
        </div>

        {showProgress && (isStreaming || isComplete) && (
          <div className="space-y-2 mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {isComplete ? 'Complete' : isStreaming ? 'Generating...' : 'Ready'}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {onRetry && (
                <Button
                  variant="link"
                  className="p-0 h-auto ml-2 text-red-600"
                  onClick={onRetry}
                >
                  Try again
                </Button>
              )}
            </AlertDescription>
          </Alert>
        ) : content ? (
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap">{content}</div>
          </div>
        ) : isStreaming ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating content...</span>
            </div>
            <ContentSkeleton lines={4} />
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Content will appear here when generation starts</p>
          </div>
        )}

        {isComplete && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">
              Content generation complete
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const StreamingSections: React.FC<StreamingSectionProps> = ({
  sections,
  currentSectionIndex,
  overallProgress,
  isStreaming,
  error,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Content Generation Progress</h3>
            <span className="text-sm text-gray-600">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
            <span>
              Section {currentSectionIndex + 1} of {sections.length}
            </span>
            <span>
              {sections.filter(s => s.isComplete).length} completed
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Individual sections */}
      {sections.map((section, index) => (
        <SimpleStreamingContent
          key={section.id}
          title={section.title}
          content={section.content}
          isStreaming={section.isActive && isStreaming}
          isComplete={section.isComplete}
          agent={section.agent}
          progress={section.progress || 0}
          error={index === currentSectionIndex ? error : undefined}
          onRetry={index === currentSectionIndex ? onRetry : undefined}
          showTypewriter={section.isActive}
          showProgress={section.isActive || section.isComplete}
          className={`${
            section.isActive 
              ? 'ring-2 ring-blue-500 ring-opacity-50' 
              : section.isComplete 
                ? 'bg-green-50 border-green-200' 
                : 'opacity-60'
          }`}
        />
      ))}
    </div>
  );
};

export default StreamingContent;