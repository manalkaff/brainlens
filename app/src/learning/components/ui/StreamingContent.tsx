import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { ChevronRight, ChevronDown, BookOpen, Lightbulb, Target, Clock, RefreshCw } from 'lucide-react';
import { AssessmentResult } from './KnowledgeAssessment';
import { LearningPath } from './StartingPointRecommendation';
import { useStreamingContent } from '../../hooks/useStreamingContent';

interface StreamingContentProps {
  topic: {
    id: string;
    title: string;
    summary?: string;
  };
  assessment: AssessmentResult;
  selectedPath: LearningPath;
  onProgressUpdate?: (progress: number) => void;
  onConceptExpand?: (concept: string) => void;
}

interface ContentSection {
  id: string;
  title: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  concepts: string[];
  isExpanded: boolean;
  isCompleted: boolean;
}

export function StreamingContent({ 
  topic, 
  assessment, 
  selectedPath, 
  onProgressUpdate,
  onConceptExpand 
}: StreamingContentProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [staticSections, setStaticSections] = useState<ContentSection[]>([]);

  const {
    sections: streamingSections,
    currentSectionIndex,
    isGenerating,
    error,
    completion,
    progress,
    generateContent,
    regenerateSection
  } = useStreamingContent();

  // Generate static content sections based on assessment and selected path
  const generateStaticSections = (): ContentSection[] => {
    const baseSections: ContentSection[] = [];

    // Customize sections based on selected learning path
    if (selectedPath.id === 'fundamentals') {
      baseSections.push(
        {
          id: 'introduction',
          title: 'Introduction and Overview',
          content: '',
          difficulty: 'beginner',
          estimatedTime: 15,
          concepts: ['definition', 'core principles', 'importance'],
          isExpanded: false,
          isCompleted: false
        },
        {
          id: 'core-concepts',
          title: 'Core Concepts and Terminology',
          content: '',
          difficulty: 'beginner',
          estimatedTime: 20,
          concepts: ['terminology', 'key concepts', 'relationships'],
          isExpanded: false,
          isCompleted: false
        },
        {
          id: 'practical-examples',
          title: 'Practical Examples and Applications',
          content: '',
          difficulty: 'intermediate',
          estimatedTime: 25,
          concepts: ['examples', 'applications', 'use cases'],
          isExpanded: false,
          isCompleted: false
        }
      );
    } else if (selectedPath.id === 'practical') {
      baseSections.push(
        {
          id: 'use-cases',
          title: 'Common Use Cases',
          content: '',
          difficulty: 'intermediate',
          estimatedTime: 20,
          concepts: ['use cases', 'applications', 'scenarios'],
          isExpanded: false,
          isCompleted: false
        },
        {
          id: 'best-practices',
          title: 'Best Practices and Methodologies',
          content: '',
          difficulty: 'intermediate',
          estimatedTime: 25,
          concepts: ['best practices', 'methodologies', 'implementation'],
          isExpanded: false,
          isCompleted: false
        }
      );
    } else if (selectedPath.id === 'comprehensive') {
      baseSections.push(
        {
          id: 'advanced-concepts',
          title: 'Advanced Theoretical Concepts',
          content: '',
          difficulty: 'advanced',
          estimatedTime: 30,
          concepts: ['theory', 'advanced concepts', 'research'],
          isExpanded: false,
          isCompleted: false
        },
        {
          id: 'technical-details',
          title: 'Technical Implementation Details',
          content: '',
          difficulty: 'advanced',
          estimatedTime: 35,
          concepts: ['implementation', 'architecture', 'technical details'],
          isExpanded: false,
          isCompleted: false
        }
      );
    }

    // Add adaptive sections based on learning styles
    if (assessment.learningStyles.includes('visual')) {
      baseSections.push({
        id: 'visual-representations',
        title: 'Visual Models and Diagrams',
        content: '',
        difficulty: assessment.knowledgeLevel >= 3 ? 'intermediate' : 'beginner',
        estimatedTime: 15,
        concepts: ['diagrams', 'models', 'visualizations'],
        isExpanded: false,
        isCompleted: false
      });
    }

    if (assessment.learningStyles.includes('interactive')) {
      baseSections.push({
        id: 'interactive-examples',
        title: 'Interactive Examples and Exercises',
        content: '',
        difficulty: 'intermediate',
        estimatedTime: 20,
        concepts: ['exercises', 'practice', 'hands-on'],
        isExpanded: false,
        isCompleted: false
      });
    }

    return baseSections;
  };

  // Initialize static sections
  useEffect(() => {
    const sections = generateStaticSections();
    setStaticSections(sections);
  }, [topic, assessment, selectedPath]);

  // Update progress when streaming sections change
  useEffect(() => {
    onProgressUpdate?.(progress);
  }, [progress, onProgressUpdate]);

  // Start streaming content generation
  const startStreaming = async () => {
    await generateContent({
      topic: topic.title,
      knowledgeLevel: assessment.knowledgeLevel,
      learningStyles: assessment.learningStyles,
      contentDepth: assessment.preferences.contentDepth,
      difficultyPreference: assessment.preferences.difficultyPreference
    });
  };

  // Regenerate a specific section
  const handleRegenerateSection = async (sectionId: string) => {
    await regenerateSection(sectionId, {
      topic: topic.title,
      knowledgeLevel: assessment.knowledgeLevel,
      learningStyles: assessment.learningStyles,
      contentDepth: assessment.preferences.contentDepth,
      difficultyPreference: assessment.preferences.difficultyPreference
    });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleConceptClick = (concept: string) => {
    onConceptExpand?.(concept);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Combine static sections with streaming sections for display
  const displaySections = streamingSections.length > 0 ? streamingSections : staticSections;

  return (
    <div className="space-y-6">
      {/* Learning Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Target className="w-5 h-5 text-primary mr-2" />
              {selectedPath.title}
            </div>
            <Badge variant="secondary">
              {displaySections.filter(s => s.isComplete).length} / {displaySections.length} Complete
            </Badge>
          </CardTitle>
          <CardDescription>
            Personalized learning content based on your assessment results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Overall Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {!isGenerating && displaySections.length > 0 && progress === 0 && (
              <Button onClick={startStreaming} className="w-full">
                <BookOpen className="w-4 h-4 mr-2" />
                Start Learning Journey
              </Button>
            )}

            {isGenerating && (
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Generating personalized content...</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" size="sm" onClick={startStreaming} className="mt-2">
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Sections */}
      <div className="space-y-4">
        {displaySections.map((section, index) => (
          <Card 
            key={section.id} 
            className={`transition-all duration-300 ${
              section.isComplete ? 'border-green-200 bg-green-50/50' : 
              currentSectionIndex === index && isGenerating ? 'border-primary/50 bg-primary/5' :
              'opacity-60'
            }`}
          >
            <CardHeader 
              className="cursor-pointer"
              onClick={() => section.isComplete && toggleSection(section.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {section.isComplete ? (
                    expandedSections.has(section.id) ? 
                      <ChevronDown className="w-5 h-5 text-muted-foreground" /> :
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted flex items-center justify-center">
                      <span className="text-xs font-medium">{index + 1}</span>
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription className="flex items-center space-x-2 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{section.estimatedTime} min</span>
                      <Badge className={getDifficultyColor(section.difficulty)}>
                        {section.difficulty}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {section.isComplete && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegenerateSection(section.id);
                        }}
                        className="opacity-60 hover:opacity-100"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            {section.isComplete && expandedSections.has(section.id) && (
              <CardContent>
                <div className="space-y-4">
                  {/* Streaming Content Display */}
                  <div className="prose prose-sm max-w-none">
                    {section.content ? (
                      <div className="whitespace-pre-wrap text-muted-foreground">
                        {section.content}
                      </div>
                    ) : (
                      <div className="p-4 border-2 border-dashed border-muted rounded-lg">
                        <p className="text-sm text-muted-foreground text-center">
                          Content will be generated here
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Key Concepts */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Lightbulb className="w-4 h-4 mr-1" />
                      Key Concepts:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {section.concepts.map((concept) => (
                        <Button
                          key={concept}
                          variant="outline"
                          size="sm"
                          onClick={() => handleConceptClick(concept)}
                          className="text-xs"
                        >
                          {concept}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}

            {currentSectionIndex === index && isGenerating && (
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="animate-pulse w-2 h-2 bg-primary rounded-full"></div>
                    <span>Generating content...</span>
                  </div>
                  {/* Show streaming content as it's being generated */}
                  {completion && (
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-muted-foreground">
                        {completion}
                        <span className="animate-pulse">|</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Adaptive Difficulty Adjustment */}
      {progress > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adaptive Learning</CardTitle>
            <CardDescription>
              Content difficulty adjusts based on your interactions and progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="font-medium">Current Level</div>
                <div className="text-muted-foreground">
                  {assessment.knowledgeLevel <= 2 ? 'Beginner' : 
                   assessment.knowledgeLevel <= 3 ? 'Intermediate' : 'Advanced'}
                </div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="font-medium">Pace</div>
                <div className="text-muted-foreground capitalize">{assessment.preferences.pacePreference}</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="font-medium">Content Depth</div>
                <div className="text-muted-foreground capitalize">{assessment.preferences.contentDepth}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}