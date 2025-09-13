import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent } from '../../../components/ui/dialog';
import { Progress } from '../../../components/ui/progress';
import { useTopicContext } from '../../context/TopicContext';
import { KnowledgeAssessment, AssessmentResult } from '../ui/KnowledgeAssessment';
import { StartingPointRecommendation, LearningPath } from '../ui/StartingPointRecommendation';
import { StreamingContent } from '../ui/StreamingContent';
import { ConceptExpansion } from '../ui/ConceptExpansion';
import { 
  updateTopicProgress
  // generateAssessmentContent,
  // generatePersonalizedPath,
  // generateStartingPoint,
  // streamAssessmentContent
} from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';

type LearningPhase = 'assessment' | 'recommendation' | 'learning';

export function LearnTab() {
  const { topic, isLoading, userProgress, refreshTopic } = useTopicContext();
  const { data: user } = useAuth();
  const [currentPhase, setCurrentPhase] = useState<LearningPhase>('assessment');
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedConcept, setExpandedConcept] = useState<string | null>(null);
  const [learningProgress, setLearningProgress] = useState(0);

  // Check if user has already completed assessment
  useEffect(() => {
    if (userProgress?.preferences && Object.keys(userProgress.preferences).length > 0) {
      // User has existing preferences, skip to learning phase
      setCurrentPhase('learning');
      // Try to reconstruct assessment from stored preferences
      const storedPrefs = userProgress.preferences as any;
      if (storedPrefs.assessment) {
        setAssessment(storedPrefs.assessment);
      }
      if (storedPrefs.selectedPath) {
        setSelectedPath(storedPrefs.selectedPath);
      }
    }
  }, [userProgress]);

  const handleAssessmentComplete = async (result: AssessmentResult) => {
    if (!topic || !user) return;

    setIsSaving(true);
    try {
      // Store assessment results in user preferences
      const preferences = {
        assessment: result,
        completedAt: new Date().toISOString(),
        knowledgeLevel: result.knowledgeLevel,
        learningStyles: result.learningStyles,
        startingPoint: result.startingPoint,
        ...result.preferences
      };

      await updateTopicProgress({
        topicId: topic.id,
        preferences
      });

      // Generate personalized content based on assessment
      // TODO: Uncomment when operations are available
      // try {
      //   const assessmentContent = await generateAssessmentContent({
      //     topicId: topic.id,
      //     assessment: result
      //   });

      //   // Store generated content in preferences
      //   const updatedPreferences = {
      //     ...preferences,
      //     generatedContent: assessmentContent,
      //     contentGeneratedAt: new Date().toISOString()
      //   };

      //   await updateTopicProgress({
      //     topicId: topic.id,
      //     preferences: updatedPreferences
      //   });

      //   console.log('Generated assessment content:', assessmentContent);
      // } catch (contentError) {
      //   console.error('Failed to generate assessment content:', contentError);
      //   // Continue with basic assessment flow even if content generation fails
      // }

      setAssessment(result);
      setCurrentPhase('recommendation');
      refreshTopic();
    } catch (error) {
      console.error('Failed to save assessment:', error);
      // TODO: Show error toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartLearning = async (path: LearningPath) => {
    if (!topic || !user || !assessment) return;

    setIsSaving(true);
    try {
      // Generate detailed personalized learning path
      let enhancedPath = path;
      // TODO: Uncomment when operations are available
      // try {
      //   const personalizedPath = await generatePersonalizedPath({
      //     topicId: topic.id,
      //     assessment,
      //     includeContent: true
      //   });

      //   // Merge the generated path with the selected path
      //   enhancedPath = {
      //     ...path,
      //     id: personalizedPath.id,
      //     title: personalizedPath.title,
      //     description: personalizedPath.description,
      //     estimatedTime: personalizedPath.estimatedTime,
      //     topics: personalizedPath.topics
      //   };

      //   console.log('Generated personalized path:', personalizedPath);
      // } catch (pathError) {
      //   console.error('Failed to generate personalized path:', pathError);
      //   // Continue with basic path if generation fails
      // }

      // Store selected learning path
      const currentPrefs = (userProgress?.preferences as Record<string, any>) || {};
      const updatedPreferences = {
        ...currentPrefs,
        selectedPath: enhancedPath,
        pathStartedAt: new Date().toISOString()
      };

      await updateTopicProgress({
        topicId: topic.id,
        preferences: updatedPreferences
      });

      setSelectedPath(enhancedPath);
      setCurrentPhase('learning');
      refreshTopic();
    } catch (error) {
      console.error('Failed to save learning path:', error);
      // TODO: Show error toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestartAssessment = () => {
    setCurrentPhase('assessment');
    setAssessment(null);
    setSelectedPath(null);
    setExpandedConcept(null);
    setLearningProgress(0);
  };

  const handleProgressUpdate = async (progress: number) => {
    setLearningProgress(progress);
    
    // Update user progress in database
    if (topic && progress > 0) {
      try {
        const timeSpent = Math.floor(progress * 0.5); // Estimate time spent based on progress
        await updateTopicProgress({
          topicId: topic.id,
          timeSpent,
          completed: progress >= 100
        });
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    }
  };

  const handleConceptExpand = (concept: string) => {
    setExpandedConcept(concept);
  };

  const handleConceptClose = () => {
    setExpandedConcept(null);
  };

  const handleNavigateToSubtopic = (subtopic: string) => {
    // This would navigate to a deeper subtopic
    console.log('Navigate to subtopic:', subtopic);
    // TODO: Implement navigation to subtopic
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Topic not found</p>
        </CardContent>
      </Card>
    );
  }

  // Render different phases
  if (currentPhase === 'assessment') {
    return (
      <div className="space-y-6">
        <KnowledgeAssessment 
          onComplete={handleAssessmentComplete}
          isLoading={isSaving}
        />
      </div>
    );
  }

  if (currentPhase === 'recommendation' && assessment) {
    return (
      <div className="space-y-6">
        <StartingPointRecommendation
          assessment={assessment}
          onStartLearning={handleStartLearning}
          isLoading={isSaving}
        />
      </div>
    );
  }

  // Learning phase - show personalized learning interface
  return (
    <div className="space-y-6">
      {/* Learning Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center font-platform">
                <div className="w-2 h-2 rounded-full bg-success mr-3" />
                Your Learning Journey
              </CardTitle>
              <CardDescription>
                {selectedPath ? `Following: ${selectedPath.title}` : 'Personalized learning experience'}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRestartAssessment}>
              Retake Assessment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assessment && (
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="font-platform">
                  Level: {assessment.knowledgeLevel <= 2 ? 'Beginner' : 
                         assessment.knowledgeLevel <= 3 ? 'Intermediate' : 'Advanced'}
                </Badge>
                <Badge variant="outline" className="font-platform">
                  Styles: {assessment.learningStyles.join(', ')}
                </Badge>
                <Badge variant="outline" className="font-platform">
                  Pace: {assessment.preferences.pacePreference}
                </Badge>
              </div>
            )}
            
            {learningProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-platform">
                  <span>Progress</span>
                  <span>{Math.round(learningProgress)}%</span>
                </div>
                <Progress value={learningProgress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Streaming Learning Content */}
      {selectedPath && (
        <div className="lesson-content">
          <StreamingContent
            topic={{
              id: topic.id,
              title: topic.title,
              summary: topic.summary || undefined
            }}
            assessment={assessment!}
            selectedPath={selectedPath}
            onProgressUpdate={handleProgressUpdate}
            onConceptExpand={handleConceptExpand}
          />
        </div>
      )}

      {/* Concept Expansion Modal */}
      <Dialog open={!!expandedConcept} onOpenChange={() => handleConceptClose()}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {expandedConcept && (
            <ConceptExpansion
              concept={expandedConcept}
              topicTitle={topic.title}
              onClose={handleConceptClose}
              onNavigateToSubtopic={handleNavigateToSubtopic}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}