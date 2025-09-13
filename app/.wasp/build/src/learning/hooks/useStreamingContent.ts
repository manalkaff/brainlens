import { useState, useCallback, useRef } from 'react';
import { useResearchStreaming } from './useResearchStreaming';

interface StreamingContentOptions {
  topic: string;
  topicId: string;
  knowledgeLevel: number;
  learningStyles: string[];
  contentDepth: 'overview' | 'detailed' | 'comprehensive';
  difficultyPreference: 'gentle' | 'moderate' | 'challenging';
  enableRealTimeUpdates?: boolean;
}

interface ContentSection {
  id: string;
  title: string;
  content: string;
  isComplete: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  concepts: string[];
  isExpanded: boolean;
  agent?: string;
  progress?: number;
  isActive?: boolean;
}

export function useStreamingContent() {
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [researchTopicId, setResearchTopicId] = useState<string | null>(null);

  const [completion, setCompletion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Research streaming integration
  const researchStreaming = researchTopicId ? useResearchStreaming({
    topicId: researchTopicId,
    onStatusUpdate: (status) => {
      console.log('Research status:', status);
      // Update sections based on research progress
      if (status.status === 'completed') {
        setIsGenerating(false);
      }
    },
    onContentUpdate: (content) => {
      // Update section content as it streams in
      setSections(prev => prev.map((section, index) => 
        index === currentSectionIndex && content.agent
          ? { 
              ...section, 
              content: section.content + content.partialContent,
              agent: content.agent,
              isActive: !content.isComplete,
              isComplete: content.isComplete
            }
          : section
      ));
    },
    onError: (errorData) => {
      setError(new Error(errorData.error));
    },
    onComplete: (result) => {
      setIsGenerating(false);
      setSections(prev => prev.map(section => ({ ...section, isComplete: true, isActive: false })));
    }
  }) : null;

  const complete = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/learning/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let content = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        content += chunk;
        setCompletion(content);
      }

      // Mark current section as complete and move to next
      setSections(prev => prev.map((section, index) => 
        index === currentSectionIndex 
          ? { ...section, content, isComplete: true }
          : section
      ));
      
      if (currentSectionIndex < sections.length - 1) {
        setCurrentSectionIndex(prev => prev + 1);
      } else {
        setIsGenerating(false);
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Streaming content generation error:', error);
      setIsGenerating(false);
    } finally {
      setIsLoading(false);
    }
  }, [currentSectionIndex, sections.length]);

  const generateContent = useCallback(async (options: StreamingContentOptions) => {
    setIsGenerating(true);
    setCurrentSectionIndex(0);
    setError(null);
    setResearchTopicId(options.topicId);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    try {
      // Initialize sections based on learning path and preferences
      const initialSections: ContentSection[] = [
        {
          id: 'introduction',
          title: 'Introduction and Overview',
          content: '',
          isComplete: false,
          difficulty: 'beginner',
          estimatedTime: 10,
          concepts: [],
          isExpanded: false,
          isActive: true,
          progress: 0
        },
        {
          id: 'core-concepts',
          title: 'Core Concepts',
          content: '',
          isComplete: false,
          difficulty: 'intermediate',
          estimatedTime: 15,
          concepts: [],
          isExpanded: false,
          isActive: false,
          progress: 0
        },
        {
          id: 'practical-applications',
          title: 'Practical Applications',
          content: '',
          isComplete: false,
          difficulty: 'intermediate',
          estimatedTime: 20,
          concepts: [],
          isExpanded: false,
          isActive: false,
          progress: 0
        }
      ];

      // Customize sections based on learning styles
      if (options.learningStyles.includes('visual')) {
        initialSections.push({
          id: 'visual-representations',
          title: 'Visual Models and Diagrams',
          content: '',
          isComplete: false,
          difficulty: 'intermediate',
          estimatedTime: 12,
          concepts: [],
          isExpanded: false,
          isActive: false,
          progress: 0
        });
      }

      if (options.learningStyles.includes('interactive')) {
        initialSections.push({
          id: 'interactive-examples',
          title: 'Interactive Examples',
          content: '',
          isComplete: false,
          difficulty: 'advanced',
          estimatedTime: 25,
          concepts: [],
          isExpanded: false,
          isActive: false,
          progress: 0
        });
      }

      setSections(initialSections);

      // Start enhanced research with streaming if enabled
      if (options.enableRealTimeUpdates) {
        const response = await fetch('/api/research/enhanced', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topicId: options.topicId,
            topic: options.topic,
            enableStreaming: true,
            userContext: {
              userLevel: options.knowledgeLevel >= 4 ? 'advanced' : options.knowledgeLevel >= 2 ? 'intermediate' : 'beginner',
              learningStyle: options.learningStyles[0] || 'mixed',
              preferences: {
                contentDepth: options.contentDepth,
                difficultyPreference: options.difficultyPreference
              }
            }
          }),
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) {
          throw new Error(`Research failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Enhanced research started:', result);
      } else {
        // Fallback to traditional content generation
        const prompt = createPrompt(options, initialSections[0]);
        await complete(prompt);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
        setIsGenerating(false);
      }
    }
  }, [complete]);

  const createPrompt = (options: StreamingContentOptions, section: ContentSection): string => {
    const difficultyMap = {
      1: 'complete beginner',
      2: 'novice',
      3: 'intermediate',
      4: 'advanced',
      5: 'expert'
    };

    const difficulty = difficultyMap[options.knowledgeLevel as keyof typeof difficultyMap] || 'beginner';
    
    return `
You are an expert educator creating personalized learning content about "${options.topic}".

Student Profile:
- Knowledge Level: ${difficulty}
- Learning Styles: ${options.learningStyles.join(', ')}
- Content Depth Preference: ${options.contentDepth}
- Difficulty Preference: ${options.difficultyPreference}

Current Section: ${section.title}

Create engaging, educational content for this section that:
1. Matches the student's knowledge level and preferences
2. Uses their preferred learning styles
3. Provides the appropriate level of detail
4. Is structured and easy to follow
5. Includes relevant examples and explanations

Content should be informative, engaging, and tailored to their specific learning profile.
Write in a conversational, educational tone.

Generate the content now:
    `.trim();
  };

  const regenerateSection = useCallback(async (sectionId: string, options: StreamingContentOptions) => {
    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;

    setCurrentSectionIndex(sectionIndex);
    setSections(prev => prev.map((section, index) => 
      index === sectionIndex 
        ? { ...section, content: '', isComplete: false }
        : section
    ));

    const prompt = createPrompt(options, sections[sectionIndex]);
    await complete(prompt);
  }, [sections, complete]);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (researchStreaming) {
      researchStreaming.disconnect();
    }
    setIsGenerating(false);
    setResearchTopicId(null);
  }, [researchStreaming]);

  const pauseGeneration = useCallback(() => {
    // Pause streaming if available
    if (researchStreaming) {
      researchStreaming.disconnect();
    }
  }, [researchStreaming]);

  const resumeGeneration = useCallback(() => {
    // Resume streaming if available
    if (researchStreaming && researchTopicId) {
      researchStreaming.connect();
    }
  }, [researchStreaming, researchTopicId]);

  const getProgress = useCallback(() => {
    if (sections.length === 0) return 0;
    const completedSections = sections.filter(s => s.isComplete).length;
    const activeSection = sections.find(s => s.isActive);
    const activeSectionProgress = activeSection?.progress || 0;
    
    return ((completedSections + (activeSectionProgress / 100)) / sections.length) * 100;
  }, [sections]);

  const getOverallStatus = useCallback(() => {
    if (error) return 'error';
    if (isGenerating) return 'generating';
    if (sections.length > 0 && sections.every(s => s.isComplete)) return 'complete';
    if (sections.length > 0) return 'partial';
    return 'idle';
  }, [error, isGenerating, sections]);

  return {
    // Content state
    sections,
    currentSectionIndex,
    completion,
    
    // Status
    isGenerating: isGenerating || isLoading,
    isLoading,
    error,
    progress: getProgress(),
    status: getOverallStatus(),
    
    // Research streaming state
    researchStreaming: researchStreaming ? {
      isConnected: researchStreaming.isConnected,
      currentStatus: researchStreaming.currentStatus,
      statusMessage: researchStreaming.statusMessage,
      hasErrors: researchStreaming.hasErrors,
      errors: researchStreaming.errors
    } : null,
    
    // Actions
    generateContent,
    regenerateSection,
    cancelGeneration,
    pauseGeneration,
    resumeGeneration,
    
    // Utilities
    getEstimatedTimeRemaining: useCallback(() => {
      const remainingSections = sections.filter(s => !s.isComplete);
      return remainingSections.reduce((total, section) => total + section.estimatedTime, 0);
    }, [sections]),
    
    getCompletedSectionsCount: useCallback(() => {
      return sections.filter(s => s.isComplete).length;
    }, [sections])
  };
}