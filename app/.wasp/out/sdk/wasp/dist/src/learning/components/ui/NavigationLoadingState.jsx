import React from 'react';
import { Loader2, Navigation, Zap, BookOpen } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../lib/utils';
const loadingConfig = {
    navigation: {
        icon: Navigation,
        title: 'Navigating...',
        defaultMessage: 'Loading topic content...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950'
    },
    content_generation: {
        icon: Zap,
        title: 'Generating Content...',
        defaultMessage: 'AI is creating comprehensive learning material...',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-950'
    },
    subtopic_expansion: {
        icon: BookOpen,
        title: 'Loading Subtopics...',
        defaultMessage: 'Expanding topic structure...',
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950'
    }
};
export function NavigationLoadingState({ type, message, progress, topicTitle, className }) {
    const config = loadingConfig[type];
    const Icon = config.icon;
    const displayMessage = message || config.defaultMessage;
    return (<div className={cn("flex items-center justify-center py-8", className)}>
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center space-y-4">
          {/* Loading Icon */}
          <div className={cn("w-12 h-12 mx-auto rounded-full flex items-center justify-center", config.bgColor)}>
            <Icon className={cn("w-6 h-6", config.color)}/>
            <Loader2 className={cn("w-4 h-4 animate-spin absolute", config.color)}/>
          </div>
          
          {/* Title and Message */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{config.title}</h3>
            {topicTitle && (<Badge variant="outline" className="text-xs">
                {topicTitle}
              </Badge>)}
            <p className="text-sm text-muted-foreground">
              {displayMessage}
            </p>
          </div>

          {/* Progress Bar */}
          {typeof progress === 'number' && (<div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div className={cn("h-2 rounded-full transition-all duration-500 ease-out", type === 'navigation' ? 'bg-blue-600' :
                type === 'content_generation' ? 'bg-purple-600' :
                    'bg-green-600')} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}/>
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round(progress)}% complete
              </p>
            </div>)}

          {/* Animated dots for indeterminate progress */}
          {typeof progress !== 'number' && (<div className="flex justify-center space-x-1">
              <div className={cn("w-2 h-2 rounded-full animate-bounce", type === 'navigation' ? 'bg-blue-600' :
                type === 'content_generation' ? 'bg-purple-600' :
                    'bg-green-600')} style={{ animationDelay: '0ms' }}/>
              <div className={cn("w-2 h-2 rounded-full animate-bounce", type === 'navigation' ? 'bg-blue-600' :
                type === 'content_generation' ? 'bg-purple-600' :
                    'bg-green-600')} style={{ animationDelay: '150ms' }}/>
              <div className={cn("w-2 h-2 rounded-full animate-bounce", type === 'navigation' ? 'bg-blue-600' :
                type === 'content_generation' ? 'bg-purple-600' :
                    'bg-green-600')} style={{ animationDelay: '300ms' }}/>
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
export function CompactNavigationLoading({ type, message, className }) {
    const config = loadingConfig[type];
    const Icon = config.icon;
    const displayMessage = message || config.defaultMessage;
    return (<div className={cn("flex items-center gap-2 text-sm", config.color, className)}>
      <div className="relative">
        <Icon className="w-4 h-4"/>
        <Loader2 className="w-3 h-3 animate-spin absolute -top-0.5 -right-0.5"/>
      </div>
      <span>{displayMessage}</span>
    </div>);
}
export function NavigationLoadingOverlay({ type, message, progress, className }) {
    const config = loadingConfig[type];
    const Icon = config.icon;
    const displayMessage = message || config.defaultMessage;
    return (<div className={cn("absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10", className)}>
      <div className={cn("flex items-center gap-3 px-4 py-2 rounded-lg shadow-sm", config.bgColor)}>
        <div className="relative">
          <Icon className={cn("w-5 h-5", config.color)}/>
          <Loader2 className={cn("w-4 h-4 animate-spin absolute -top-0.5 -right-0.5", config.color)}/>
        </div>
        <div className="space-y-1">
          <p className={cn("text-sm font-medium", config.color)}>
            {displayMessage}
          </p>
          {typeof progress === 'number' && (<div className="w-32 bg-muted rounded-full h-1">
              <div className={cn("h-1 rounded-full transition-all duration-300", type === 'navigation' ? 'bg-blue-600' :
                type === 'content_generation' ? 'bg-purple-600' :
                    'bg-green-600')} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}/>
            </div>)}
        </div>
      </div>
    </div>);
}
export default NavigationLoadingState;
//# sourceMappingURL=NavigationLoadingState.jsx.map