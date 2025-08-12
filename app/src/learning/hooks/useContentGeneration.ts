import { useState, useCallback, useEffect } from 'react';
import { useQuery } from 'wasp/client/operations';
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

interface UseContentGenerationReturn {
  content: string;
  sections: ContentSection[];
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

    setIsGenerating(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real implementation, this would call an AI service
      // For now, we'll generate sample content
      const generatedContent = generateSampleContent(topic.title, topic.summary);
      const parsedSections = parseContentSections(generatedContent);

      setContent(generatedContent);
      setSections(parsedSections);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate content'));
    } finally {
      setIsGenerating(false);
    }
  }, [topic, generateSampleContent, parseContentSections]);

  // Auto-generate content when topic changes
  useEffect(() => {
    if (topic && autoGenerate) {
      generateContent();
    }
  }, [topic, autoGenerate, generateContent]);

  // Reset content when topic changes
  useEffect(() => {
    if (topic) {
      setContent('');
      setSections([]);
      setError(null);
    }
  }, [topic?.id]);

  const refreshContent = useCallback(() => {
    generateContent();
  }, [generateContent]);

  return {
    content,
    sections,
    isGenerating,
    error,
    generateContent,
    refreshContent
  };
}

// Hook for managing content bookmarks and reading progress
export function useContentBookmarks(topicId: string | null) {
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [readSections, setReadSections] = useState<Set<string>>(new Set());

  const toggleBookmark = useCallback((sectionId: string) => {
    setBookmarks(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(sectionId)) {
        newBookmarks.delete(sectionId);
      } else {
        newBookmarks.add(sectionId);
      }
      return newBookmarks;
    });
  }, []);

  const markAsRead = useCallback((sectionId: string) => {
    setReadSections(prev => new Set([...prev, sectionId]));
  }, []);

  const markAsUnread = useCallback((sectionId: string) => {
    setReadSections(prev => {
      const newReadSections = new Set(prev);
      newReadSections.delete(sectionId);
      return newReadSections;
    });
  }, []);

  const isBookmarked = useCallback((sectionId: string) => {
    return bookmarks.has(sectionId);
  }, [bookmarks]);

  const isRead = useCallback((sectionId: string) => {
    return readSections.has(sectionId);
  }, [readSections]);

  // Reset when topic changes
  useEffect(() => {
    if (topicId) {
      setBookmarks(new Set());
      setReadSections(new Set());
    }
  }, [topicId]);

  return {
    bookmarks: Array.from(bookmarks),
    readSections: Array.from(readSections),
    toggleBookmark,
    markAsRead,
    markAsUnread,
    isBookmarked,
    isRead
  };
}