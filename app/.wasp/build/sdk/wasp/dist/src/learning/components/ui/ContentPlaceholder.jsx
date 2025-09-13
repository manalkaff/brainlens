import React from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Zap, BookOpen, RefreshCw } from 'lucide-react';
import { ErrorDisplay } from './ErrorDisplay';
import { LoadingState } from './SkeletonLoaders';
export function ContentPlaceholder({ topic, onGenerateContent, isGeneratingContent, error, onClearError }) {
    if (isGeneratingContent) {
        return (<div className="flex-1 flex items-center justify-center p-8">
        <LoadingState message="Generating content for this topic..." showSpinner={true}/>
      </div>);
    }
    if (error) {
        return (<div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <ErrorDisplay error={{
                type: 'content_generation',
                message: error,
                topicId: topic.id,
                retryable: true,
                timestamp: new Date()
            }} onRetry={onGenerateContent} onDismiss={onClearError} isRetrying={isGeneratingContent}/>
          </CardContent>
        </Card>
      </div>);
    }
    return (<div className="flex-1 flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-primary"/>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Ready to Explore</h3>
            <p className="text-sm text-muted-foreground">
              Generate comprehensive content for "{topic.title}" to start learning.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={onGenerateContent} disabled={isGeneratingContent} className="w-full">
              {isGeneratingContent ? (<>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin"/>
                  Generating...
                </>) : (<>
                  <Zap className="w-4 h-4 mr-2"/>
                  Generate Content
                </>)}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Our AI will research and create detailed content tailored to your learning level.
            </p>
          </div>

          {topic.summary && (<div className="mt-6 p-4 bg-muted/50 rounded-lg text-left">
              <h4 className="font-medium text-sm mb-2">Topic Overview</h4>
              <p className="text-xs text-muted-foreground">{topic.summary}</p>
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
//# sourceMappingURL=ContentPlaceholder.jsx.map