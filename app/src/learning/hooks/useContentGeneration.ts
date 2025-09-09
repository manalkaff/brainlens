import { useState, useCallback, useEffect } from 'react';
import { useQuery } from 'wasp/client/operations';
import { api } from 'wasp/client/api';
import type { TopicTreeItem } from '../components/ui/TopicTree';

interface ContentSection {
  id: string;
  title: string;
  content: string;
  level: number;
  isBookmarked: boolean;
  isRead: boolean;
}

interface UseContentGenerationOptions {
  topic: TopicTreeItem | null;
  autoGenerate?: boolean;
}

interface SourceAttribution {
  id: string;
  title: string;
  url?: string;
  source: string;
  contentType: string;
  relevanceScore?: number;
}

interface UseContentGenerationReturn {
  content: string;
  sections: ContentSection[];
  sources: SourceAttribution[];
  isGenerating: boolean;
  error: Error | null;
  generateContent: () => Promise<void>;
  refreshContent: () => void;
}

export function useContentGeneration({
  topic,
  autoGenerate = false
}: UseContentGenerationOptions): UseContentGenerationReturn {
  const [content, setContent] = useState<string>('');
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [sources, setSources] = useState<SourceAttribution[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Generate sample content based on topic
  const generateSampleContent = useCallback((topicTitle: string, topicSummary?: string | null): string => {
    return `# ${topicTitle}

${topicSummary || `This comprehensive guide covers everything you need to know about ${topicTitle}.`}

## Overview

${topicTitle} is a fundamental concept that plays a crucial role in its domain. Understanding its core principles and applications is essential for anyone looking to master this subject.

### Key Benefits

- **Comprehensive Understanding**: Gain deep insights into the subject matter
- **Practical Applications**: Learn how to apply concepts in real-world scenarios  
- **Best Practices**: Discover industry-standard approaches and methodologies
- **Problem Solving**: Develop skills to tackle common challenges

## Core Concepts

### Fundamental Principles

The foundation of ${topicTitle} rests on several key principles:

1. **First Principle**: The basic building block that everything else builds upon
2. **Second Principle**: How different components interact and work together
3. **Third Principle**: The underlying logic that governs behavior and outcomes

\`\`\`javascript
// Example code demonstrating core concepts
function demonstrateCore${topicTitle.replace(/\s+/g, '')}() {
  const example = {
    principle1: "Foundation",
    principle2: "Interaction", 
    principle3: "Logic"
  };
  
  return example;
}
\`\`\`

### Advanced Topics

Once you've mastered the fundamentals, you can explore more advanced aspects:

- **Advanced Technique 1**: Building on the basics to create more complex solutions
- **Advanced Technique 2**: Optimization strategies and performance considerations
- **Advanced Technique 3**: Integration with other systems and technologies

## Practical Examples

### Example 1: Basic Implementation

Here's a simple example to get you started:

\`\`\`python
# Basic implementation example
def basic_${topicTitle.toLowerCase().replace(/\s+/g, '_')}_example():
    """
    A simple example demonstrating basic concepts
    """
    result = "Hello, ${topicTitle}!"
    return result

# Usage
example_result = basic_${topicTitle.toLowerCase().replace(/\s+/g, '_')}_example()
print(example_result)
\`\`\`

### Example 2: Advanced Usage

For more complex scenarios, consider this approach:

\`\`\`typescript
interface ${topicTitle.replace(/\s+/g, '')}Config {
  option1: string;
  option2: number;
  option3: boolean;
}

class Advanced${topicTitle.replace(/\s+/g, '')} {
  private config: ${topicTitle.replace(/\s+/g, '')}Config;
  
  constructor(config: ${topicTitle.replace(/\s+/g, '')}Config) {
    this.config = config;
  }
  
  public execute(): string {
    // Advanced implementation logic here
    return \`Executing with \${this.config.option1}\`;
  }
}
\`\`\`

## Best Practices

### Do's and Don'ts

**Do:**
- ✅ Follow established conventions and standards
- ✅ Test your implementations thoroughly
- ✅ Document your code and processes
- ✅ Consider performance implications

**Don't:**
- ❌ Skip fundamental understanding for quick fixes
- ❌ Ignore error handling and edge cases
- ❌ Overcomplicate simple solutions
- ❌ Neglect security considerations

### Common Pitfalls

1. **Pitfall 1**: Rushing through the basics without proper understanding
   - *Solution*: Take time to master fundamentals before moving to advanced topics

2. **Pitfall 2**: Not considering scalability from the start
   - *Solution*: Design with growth and expansion in mind

3. **Pitfall 3**: Ignoring community best practices
   - *Solution*: Stay updated with industry standards and recommendations

## Tools and Resources

### Essential Tools

- **Tool 1**: Primary development environment and setup
- **Tool 2**: Testing and validation frameworks
- **Tool 3**: Documentation and collaboration platforms

### Learning Resources

- **Books**: Recommended reading for deeper understanding
- **Online Courses**: Structured learning paths and tutorials
- **Community Forums**: Places to ask questions and share knowledge
- **Documentation**: Official guides and reference materials

## Troubleshooting

### Common Issues

**Issue 1: Getting Started**
- *Problem*: Difficulty understanding where to begin
- *Solution*: Start with the overview section and work through examples step by step

**Issue 2: Implementation Challenges**
- *Problem*: Code not working as expected
- *Solution*: Check the examples section and verify your setup matches the requirements

**Issue 3: Performance Problems**
- *Problem*: Slow execution or resource usage
- *Solution*: Review the best practices section and consider optimization techniques

## Next Steps

After mastering ${topicTitle}, consider exploring these related topics:

- **Related Topic 1**: Natural progression from current knowledge
- **Related Topic 2**: Complementary skills that enhance understanding
- **Related Topic 3**: Advanced applications and specializations

## Conclusion

${topicTitle} is a valuable skill that opens up many opportunities. By following this guide and practicing the examples, you'll develop a solid foundation that you can build upon.

Remember to:
- Practice regularly with hands-on examples
- Join community discussions and forums
- Stay updated with latest developments
- Apply your knowledge to real-world projects

Happy learning!`;
  }, []);

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

  // Generate content for the current topic
  const generateContent = useCallback(async () => {
    if (!topic) return;

    console.log('🚀 CONTENT GENERATION API CALL:', {
      topicId: topic.id,
      topicTitle: topic.title,
      topicSlug: topic.slug,
      timestamp: new Date().toISOString()
    });

    setIsGenerating(true);
    setError(null);

    try {
      // Call the content generation API using Wasp's authenticated API wrapper
      const response = await api.post('/api/learning/generate-content', {
        topicId: topic.id,
        options: {
          userLevel: 'intermediate', // TODO: Get from user preferences
          learningStyle: 'textual', // TODO: Get from user preferences
          contentType: 'exploration',
          maxTokens: 4000,
          temperature: 0.7
        }
      });

      const result = response.data;

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.content) {
        throw new Error('No content received from API');
      }

      const generatedContent = result.content;
      const parsedSections = parseContentSections(generatedContent);
      const sourcesFromAPI = result.sources || [];

      setContent(generatedContent);
      setSections(parsedSections);
      setSources(sourcesFromAPI);
    } catch (err) {
      console.error('=== CONTENT GENERATION ERROR ===');
      console.error('Error details:', err);
      console.error('Error message:', err instanceof Error ? err.message : 'Unknown error');
      console.error('Stack trace:', err instanceof Error ? err.stack : 'No stack trace');
      console.error('================================');

      setError(err instanceof Error ? err : new Error('Failed to generate content'));

      // Provide a helpful error message instead of empty content
      const errorContent = `# Content Generation Error

We encountered an issue generating content for "${topic.title}". This could be due to:

## Possible Causes:
- **OpenAI API Key**: Make sure your \`OPENAI_API_KEY\` is set in your \`.env.server\` file
- **Network Issues**: Check your internet connection
- **Service Availability**: OpenAI services might be temporarily unavailable

## To Fix This:
1. Check your \`.env.server\` file and ensure \`OPENAI_API_KEY\` is set
2. Restart your Wasp development server with \`wasp start\`
3. Try generating content again

## Error Details:
\`\`\`
${err instanceof Error ? err.message : 'Unknown error'}
\`\`\`

*This is a development error message. In production, users would see a more user-friendly message.*`;

      setContent(errorContent);
      setSections(parseContentSections(errorContent));
    } finally {
      setIsGenerating(false);
    }
  }, [topic, parseContentSections]);

  // Auto-generate content when topic ID changes (avoid regenerating on topic object changes)
  useEffect(() => {
    if (topic?.id && autoGenerate) {
      generateContent();
    }
  }, [topic?.id, autoGenerate]); // Remove generateContent from deps to prevent infinite loops

  // Reset content when topic changes
  useEffect(() => {
    if (topic) {
      setContent('');
      setSections([]);
      setSources([]);
      setError(null);
    }
  }, [topic?.id]);

  const refreshContent = useCallback(() => {
    generateContent();
  }, [generateContent]);

  return {
    content,
    sections,
    sources,
    isGenerating,
    error,
    generateContent,
    refreshContent
  };
}

// Hook for managing content bookmarks and reading progress
export function useContentBookmarks(topicId: string | null) {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [readSections, setReadSections] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load bookmarks and read sections when topic changes
  useEffect(() => {
    if (!topicId) {
      setBookmarks([]);
      setReadSections([]);
      return;
    }

    const loadBookmarksAndReadSections = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, these would be Wasp operations
        // For now, we'll use local storage as a fallback
        const bookmarksKey = `bookmarks_${topicId}`;
        const readSectionsKey = `readSections_${topicId}`;

        const savedBookmarks = localStorage.getItem(bookmarksKey);
        const savedReadSections = localStorage.getItem(readSectionsKey);

        setBookmarks(savedBookmarks ? JSON.parse(savedBookmarks) : []);
        setReadSections(savedReadSections ? JSON.parse(savedReadSections) : []);
      } catch (error) {
        console.error('Failed to load bookmarks and read sections:', error);
        setBookmarks([]);
        setReadSections([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookmarksAndReadSections();
  }, [topicId]);

  const toggleBookmark = useCallback(async (sectionId: string) => {
    if (!topicId) return;

    try {
      const isCurrentlyBookmarked = bookmarks.includes(sectionId);
      let updatedBookmarks: string[];

      if (isCurrentlyBookmarked) {
        updatedBookmarks = bookmarks.filter(id => id !== sectionId);
      } else {
        updatedBookmarks = [...bookmarks, sectionId];
      }

      setBookmarks(updatedBookmarks);

      // Save to localStorage as fallback
      const bookmarksKey = `bookmarks_${topicId}`;
      localStorage.setItem(bookmarksKey, JSON.stringify(updatedBookmarks));

      // TODO: Call Wasp operation when available
      // if (isCurrentlyBookmarked) {
      //   await removeContentBookmark({ topicId, sectionId });
      // } else {
      //   await addContentBookmark({ topicId, sectionId });
      // }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  }, [topicId, bookmarks]);

  const markAsRead = useCallback(async (sectionId: string) => {
    if (!topicId || readSections.includes(sectionId)) return;

    try {
      const updatedReadSections = [...readSections, sectionId];
      setReadSections(updatedReadSections);

      // Save to localStorage as fallback
      const readSectionsKey = `readSections_${topicId}`;
      localStorage.setItem(readSectionsKey, JSON.stringify(updatedReadSections));

      // TODO: Call Wasp operation when available
      // await markContentAsRead({ topicId, sectionId });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [topicId, readSections]);

  const markAsUnread = useCallback(async (sectionId: string) => {
    if (!topicId) return;

    try {
      const updatedReadSections = readSections.filter(id => id !== sectionId);
      setReadSections(updatedReadSections);

      // Save to localStorage as fallback
      const readSectionsKey = `readSections_${topicId}`;
      localStorage.setItem(readSectionsKey, JSON.stringify(updatedReadSections));

      // TODO: Implement unread functionality in backend
    } catch (error) {
      console.error('Failed to mark as unread:', error);
    }
  }, [topicId, readSections]);

  const isBookmarked = useCallback((sectionId: string) => {
    return bookmarks.includes(sectionId);
  }, [bookmarks]);

  const isRead = useCallback((sectionId: string) => {
    return readSections.includes(sectionId);
  }, [readSections]);

  return {
    bookmarks,
    readSections,
    isLoading,
    toggleBookmark,
    markAsRead,
    markAsUnread,
    isBookmarked,
    isRead
  };
}