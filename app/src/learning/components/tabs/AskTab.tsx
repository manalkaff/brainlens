import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { useTopicContext } from '../../context/TopicContext';

export function AskTab() {
  const { topic, isLoading } = useTopicContext();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-64 bg-muted rounded" />
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

  return (
    <div className="space-y-6">
      {/* Chat Interface */}
      <Card className="h-96">
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
            AI Learning Assistant
          </CardTitle>
          <CardDescription>
            Ask questions about {topic.title} and get contextual answers
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col h-full">
          {/* Chat Messages Area */}
          <div className="flex-1 border rounded-lg p-4 bg-muted/20 mb-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Welcome Message */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
                  AI
                </div>
                <div className="flex-1">
                  <div className="bg-background border rounded-lg p-3 shadow-sm">
                    <p className="text-sm">
                      Hello! I'm your AI learning assistant for <strong>{topic.title}</strong>. 
                      I can help answer questions, explain concepts, and guide you through the learning material. 
                      What would you like to know?
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Placeholder for future messages */}
              <div className="text-center text-muted-foreground text-sm py-8">
                Start a conversation by asking a question below
              </div>
            </div>
          </div>
          
          {/* Message Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Ask a question about this topic..."
              disabled
              className="flex-1 px-3 py-2 border rounded-lg bg-muted/50 text-muted-foreground"
            />
            <Button disabled size="sm">
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chat Threads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-3" />
              Conversation History
            </div>
            <Button disabled variant="outline" size="sm">
              New Chat
            </Button>
          </CardTitle>
          <CardDescription>
            Previous conversations about this topic
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-center text-muted-foreground text-sm py-8">
              No previous conversations yet. Start chatting to see your history here.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-purple-500 mr-3" />
            Suggested Questions
          </CardTitle>
          <CardDescription>
            Common questions about {topic.title} to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Button disabled variant="outline" className="justify-start h-auto p-3 text-left">
              <div>
                <div className="font-medium text-sm">What are the fundamentals?</div>
                <div className="text-xs text-muted-foreground">Learn the basic concepts and definitions</div>
              </div>
            </Button>
            <Button disabled variant="outline" className="justify-start h-auto p-3 text-left">
              <div>
                <div className="font-medium text-sm">How is this used in practice?</div>
                <div className="text-xs text-muted-foreground">Explore real-world applications and examples</div>
              </div>
            </Button>
            <Button disabled variant="outline" className="justify-start h-auto p-3 text-left">
              <div>
                <div className="font-medium text-sm">What are common challenges?</div>
                <div className="text-xs text-muted-foreground">Understand potential difficulties and solutions</div>
              </div>
            </Button>
            <Button disabled variant="outline" className="justify-start h-auto p-3 text-left">
              <div>
                <div className="font-medium text-sm">How do I get started?</div>
                <div className="text-xs text-muted-foreground">Step-by-step guidance for beginners</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}