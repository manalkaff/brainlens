import { useState, useCallback } from 'react';
import { useCompletion } from 'ai/react';

interface StreamingContentOptions {
  topic: string;
  knowledgeLevel: number;
  learningStyles: string[];
  contentDepth: 'overview' | 'detailed' | 'comprehensive';
  difficultyPreference: 'gentle' | 'moderate' | 'challenging';
}

interface ContentSection {
  id: string;
  title: string;
  content: string;
  isComplete: boolean;
}

export function useStreamingContent() {
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const { complete, completion, isLoading, error } = useCompletion({
    api: '/api/learning/generate-content',
    onFinish: (prompt, completion) => {
      // Mark current section as complete and move to next
      setSections(prev => prev.map((section, index) => 
        index === currentSectionIndex 
          ? { ...section, content: completion, isComplete: true }
          : section
      ));
      
      if (currentSectionIndex < sections.length - 1) {
        setCurrentSectionIndex(prev => prev + 1);
      } else {
        setIsGenerating(false);
      }
    },
    onError: (error) => {
      console.error('Streaming content generation error:', error);
      setIsGenerating(false);
    }
  });

  const generateContent = useCallback(async (options: StreamingContentOptions) => {
    setIsGenerating(true);
    setCurrentSectionIndex(0);
    
    // Initialize sections based on learning path and preferences
    const initialSections: ContentSection[] = [
      {
        id: 'introduction',
        title: 'Introduction and Overview',
        content: '',
        isComplete: false
      },
      {
        id: 'core-concepts',
        title: 'Core Concepts',
        content: '',
        isComplete: false
      },
      {
        id: 'practical-applications',
        title: 'Practical Applications',
        content: '',
        isComplete: false
      }
    ];

    // Customize sections based on learning styles
    if (options.learningStyles.includes('visual')) {
      initialSections.push({
        id: 'visual-representations',
        title: 'Visual Models and Diagrams',
        content: '',
        isComplete: false
      });
    }

    if (options.learningStyles.includes('interactive')) {
      initialSections.push({
        id: 'interactive-examples',
        title: 'Interactive Examples',
        content: '',
        isComplete: false
      });
    }

    setSections(initialSections);

    // Start generating content for the first section
    const prompt = createPrompt(options, initialSections[0]);
    await complete(prompt);
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

  const getProgress = useCallback(() => {
    if (sections.length === 0) return 0;
    const completedSections = sections.filter(s => s.isComplete).length;
    return (completedSections / sections.length) * 100;
  }, [sections]);

  return {
    sections,
    currentSectionIndex,
    isGenerating: isGenerating || isLoading,
    error,
    completion,
    progress: getProgress(),
    generateContent,
    regenerateSection
  };
}