import React from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { BookOpen, Search, History, ArrowRight } from 'lucide-react';

interface EnhancedEmptyStateProps {
  onStartExploring: () => void;
  hasRecentTopics: boolean;
}

export function EnhancedEmptyState({
  onStartExploring,
  hasRecentTopics
}: EnhancedEmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-xl">Ready to Learn?</h3>
            <p className="text-muted-foreground">
              Select a topic from the sidebar to start exploring comprehensive, AI-generated content.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onStartExploring}
              className="w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              Browse Topics
            </Button>
            
            {hasRecentTopics && (
              <Button
                variant="outline"
                onClick={() => onStartExploring()}
                className="w-full"
              >
                <History className="w-4 h-4 mr-2" />
                View Recent Topics
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 pt-4 border-t">
            <div className="text-left p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <ArrowRight className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">AI-Powered Learning</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Our AI researches topics comprehensively and generates personalized content for your learning level.
              </p>
            </div>
            
            <div className="text-left p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <ArrowRight className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Interactive Navigation</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Explore subtopics, bookmark content, and track your learning progress seamlessly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}