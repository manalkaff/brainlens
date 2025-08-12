import { useState, useCallback } from 'react';

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
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  concepts: string[];
  isExpanded: boolean;
}

export function useStreamingContent() {
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const [completion, setCompletion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const complete = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/learning/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        isExpanded: false
      },
      {
        id: 'core-concepts',
        title: 'Core Concepts',
        content: '',
        isComplete: false,
        difficulty: 'intermediate',
        estimatedTime: 15,
        concepts: [],
        isExpanded: false
      },
      {
        id: 'practical-applications',
        title: 'Practical Applications',
        content: '',
        isComplete: false,
        difficulty: 'intermediate',
        estimatedTime: 20,
        concepts: [],
        isExpanded: false
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
        isExpanded: false
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
        isExpanded: false
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