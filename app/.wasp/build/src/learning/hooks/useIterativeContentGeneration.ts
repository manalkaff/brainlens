import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from 'wasp/client/operations';
import type { TopicTreeItem } from '../components/ui/TopicTree';
import { useIterativeResearch } from './useIterativeResearch';

interface ContentSection {
  id: string;
  title: string;
  content: string;
  level: number;
  isBookmarked: boolean;
  isRead: boolean;
}

interface SourceAttribution {
  id: string;
  title: string;
  url?: string;
  source: string;
  contentType: string;
  relevanceScore?: number;
}

interface UseIterativeContentGenerationOptions {
  topic: TopicTreeItem | null;
  activeTopicId?: string;
  autoStart?: boolean;
}

interface UseIterativeContentGenerationReturn {
  content: string;
  sections: ContentSection[];
  sources: SourceAttribution[];
  isGenerating: boolean;
  isResetting: boolean;
  error: Error | null;
  generateContent: () => Promise<void>;
  refreshContent: () => void;
  // Research system integration
  researchResult: any;
  isResearching: boolean;
  researchProgress: number;
}

/**
 * Enhanced content generation hook that uses the iterative research system
 * This replaces the old useContentGeneration hook
 */
export function useIterativeContentGeneration({
  topic,
  activeTopicId,
  autoStart = true
}: UseIterativeContentGenerationOptions): UseIterativeContentGenerationReturn {
  const [content, setContent] = useState<string>('');
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [sources, setSources] = useState<SourceAttribution[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Track the previous topic ID to prevent unnecessary content resets
  const previousTopicIdRef = useRef<string | null>(null);

  // Use iterative research system as primary content source
  const {
    isResearching,
    researchProgress,
    error: researchError,
    researchResult,
    startResearch,
    refreshResearch,
    clearError: clearResearchError
  } = useIterativeResearch({
    topicSlug: topic?.slug,
    autoStart,
    maxDepth: 3,
    userContext: { level: 'intermediate', interests: [] }
  });

  // Parse content into sections
  const parseContentSections = useCallback((markdownContent: string): ContentSection[] => {
    const lines = markdownContent.split('\n');
    const parsedSections: ContentSection[] = [];
    let currentSection: Partial<ContentSection> = {};
    let currentContent = '';

    for (const line of lines) {
      if (line.startsWith('#')) {
        // Save previous section if it exists
        if (currentSection.id && currentSection.title) {
          parsedSections.push({
            ...currentSection,
            content: currentContent.trim(),
            isBookmarked: false,
            isRead: false
          } as ContentSection);
        }

        // Start new section
        const level = (line.match(/^#+/) || [''])[0].length;
        const title = line.replace(/^#+\s*/, '');
        const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

        currentSection = { id, title, level };
        currentContent = '';
      } else {
        currentContent += line + '\n';
      }
    }

    // Add the last section
    if (currentSection.id && currentSection.title) {
      parsedSections.push({
        ...currentSection,
        content: currentContent.trim(),
        isBookmarked: false,
        isRead: false
      } as ContentSection);
    }

    return parsedSections;
  }, []);

  // Update content when research result is available
  useEffect(() => {
    if (researchResult) {
      const currentTopicId = activeTopicId || topic?.id;
      
      // Determine which content to show based on selection
      const contentToShow = researchResult.mainTopic.content.content;
      const sourcesToShow = researchResult.mainTopic.sources.map((source: any) => ({
        id: source.id,
        title: source.title,
        url: source.url,
        source: source.source,
        contentType: source.contentType,
        relevanceScore: source.relevanceScore
      }));

      setContent(contentToShow);
      setSections(parseContentSections(contentToShow));
      setSources(sourcesToShow);
      setError(null);
    }
  }, [researchResult, activeTopicId, topic?.id, parseContentSections]);

  // Handle research errors
  useEffect(() => {
    if (researchError) {
      setError(new Error(researchError));
    }
  }, [researchError]);

  // Generate content (delegate to research system)
  const generateContent = useCallback(async () => {
    if (!topic) return;

    console.log('🚀 Generating content using iterative research system for:', topic.title);
    setError(null);

    try {
      await startResearch({ forceRefresh: true });
    } catch (err) {
      console.error('Content generation failed:', err);
      setError(err instanceof Error ? err : new Error('Failed to generate content'));
    }
  }, [topic, startResearch]);

  // Smart content reset when active topic changes
  useEffect(() => {
    const currentTopicId = activeTopicId || topic?.id;
    const currentPrevious = previousTopicIdRef.current;
    
    console.log('🔄 Content reset check:', {
      currentTopicId,
      previousTopicId: currentPrevious,
      activeTopicId,
      mainTopicId: topic?.id,
      hasContent: !!content,
      willReset: currentTopicId !== currentPrevious && !!currentTopicId
    });
    
    // Reset content when switching to ANY different topic (including first load)
    if (currentTopicId && currentTopicId !== currentPrevious) {
      console.log('🔄 CLEARING CONTENT for topic change:', currentPrevious, '->', currentTopicId);
      
      // Set resetting state first to prevent old content from showing
      setIsResetting(true);
      
      // Clear content immediately and synchronously
      setContent('');
      setSections([]);
      setSources([]);
      setError(null);
      
      // Update the ref immediately to prevent loops
      previousTopicIdRef.current = currentTopicId;
      
      // Clear resetting state after a brief delay to ensure UI updates
      setTimeout(() => {
        setIsResetting(false);
      }, 50);
    }
  }, [activeTopicId, topic?.id, content]);

  const refreshContent = useCallback(() => {
    refreshResearch();
  }, [refreshResearch]);

  const clearError = useCallback(() => {
    setError(null);
    clearResearchError();
  }, [clearResearchError]);

  return {
    content,
    sections,
    sources,
    isGenerating: isResearching,
    isResetting,
    error,
    generateContent,
    refreshContent,
    // Research system integration
    researchResult,
    isResearching,
    researchProgress
  };
}