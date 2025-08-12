import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { Request, Response } from 'express';

export async function generateContentHandler(req: Request, res: Response) {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await streamText({
      model: openai('gpt-4-turbo-preview'),
      prompt,
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the response
    for await (const chunk of result.textStream) {
      res.write(chunk);
    }

    res.end();
  } catch (error) {
    console.error('Content generation error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
}