import type { Request, Response } from 'express';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const generateSubtopicsHandler = async (req: Request, res: Response, context: any) => {
  try {
    if (!context.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { topicId, topicTitle, topicSummary, depth } = req.body;

    if (!topicId || !topicTitle) {
      return res.status(400).json({ error: 'Topic ID and title are required' });
    }

    // Limit depth to prevent infinite recursion
    if (depth >= 3) {
      return res.status(400).json({ error: 'Maximum topic depth reached' });
    }

    // Get the topic to understand its context
    const topic = await context.entities.Topic.findUnique({
      where: { id: topicId },
      include: {
        parent: true,
        children: true
      }
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Generate intelligent subtopics using AI
    const prompt = buildSubtopicGenerationPrompt(topicTitle, topicSummary, depth, topic.parent?.title);
    
    const result = await generateText({
      model: openai('gpt-4-turbo-preview'),
      prompt,
      temperature: 0.7,
    });

    // Parse the generated subtopics
    const subtopics = parseSubtopicsFromResponse(result.text);

    res.json({
      success: true,
      subtopics,
      parentTopic: topicTitle,
      depth: depth + 1
    });

  } catch (error) {
    console.error('Subtopic generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate subtopics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function buildSubtopicGenerationPrompt(
  topicTitle: string, 
  topicSummary: string | null, 
  currentDepth: number,
  parentTitle?: string
): string {
  const contextInfo = parentTitle ? `This topic is a subtopic of "${parentTitle}".` : 'This is a root-level topic.';
  const summaryInfo = topicSummary ? `Topic summary: ${topicSummary}` : '';
  
  return `You are an expert curriculum designer creating educational subtopics for "${topicTitle}".

Context:
- ${contextInfo}
- Current depth level: ${currentDepth}
- ${summaryInfo}

Generate 4-6 logical, well-structured subtopics that:
1. Break down "${topicTitle}" into comprehensive learning modules
2. Follow a logical learning progression from basic to advanced
3. Are specific enough to be actionable learning units
4. Are broad enough to contain substantial content
5. Avoid overlap while ensuring complete coverage

Requirements:
- Each subtopic should be 2-8 words long
- Focus on practical, learnable concepts
- Ensure subtopics are distinct and non-overlapping
- Order them from foundational to advanced concepts
- Make them engaging and clear for learners

Format your response as a simple numbered list:
1. [Subtopic 1]
2. [Subtopic 2]
3. [Subtopic 3]
4. [Subtopic 4]
5. [Subtopic 5]
6. [Subtopic 6]

Generate subtopics for: "${topicTitle}"`;
}

function parseSubtopicsFromResponse(response: string): string[] {
  const lines = response.split('\n');
  const subtopics: string[] = [];
  
  for (const line of lines) {
    // Match numbered list items (1. , 2. , etc.)
    const match = line.match(/^\d+\.\s*(.+)$/);
    if (match) {
      const subtopic = match[1].trim();
      if (subtopic.length > 0) {
        subtopics.push(subtopic);
      }
    }
  }
  
  // Fallback: if no numbered items found, try bullet points
  if (subtopics.length === 0) {
    for (const line of lines) {
      const match = line.match(/^[-*•]\s*(.+)$/);
      if (match) {
        const subtopic = match[1].trim();
        if (subtopic.length > 0) {
          subtopics.push(subtopic);
        }
      }
    }
  }
  
  // Ensure we have at least some subtopics
  if (subtopics.length === 0) {
    return [
      'Introduction and Overview',
      'Core Concepts',
      'Practical Applications',
      'Advanced Topics',
      'Best Practices'
    ];
  }
  
  return subtopics.slice(0, 6); // Limit to 6 subtopics
}