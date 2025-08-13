import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Badge } from '../../../components/ui/badge';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { HelpCircle, BookOpen, MessageCircle, Map, Brain, Trophy, Search, Lightbulb } from 'lucide-react';

interface HelpSystemProps {
  trigger?: React.ReactNode;
  defaultTab?: string;
}

export function HelpSystem({ trigger, defaultTab = 'overview' }: HelpSystemProps) {
  const [open, setOpen] = useState(false);

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="gap-2">
      <HelpCircle className="h-4 w-4" />
      Help
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Learning Platform Guide</DialogTitle>
          <DialogDescription>
            Everything you need to know about using the AI-powered learning platform
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh]">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tabs">Learning Tabs</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="tips">Tips & FAQ</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">1. Enter Topic</h3>
                      <p className="text-sm text-muted-foreground">
                        Type any topic you want to learn about. Our AI will research it comprehensively.
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Brain className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">2. AI Research</h3>
                      <p className="text-sm text-muted-foreground">
                        Multiple AI agents research your topic from different angles and create structured content.
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">3. Multi-Modal Learning</h3>
                      <p className="text-sm text-muted-foreground">
                        Access your content through 5 different learning modes tailored to your preferences.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Enter a topic you want to learn about on the main page</li>
                    <li>Wait for the AI to research and structure the content (this may take a few minutes)</li>
                    <li>Start with the <strong>Learn</strong> tab to take a knowledge assessment</li>
                    <li>Follow the personalized learning path or explore other tabs</li>
                    <li>Use the <strong>Ask</strong> tab to get answers to specific questions</li>
                    <li>Test your knowledge with the <strong>Quiz</strong> tab</li>
                  </ol>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tabs" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      Learn Tab
                    </CardTitle>
                    <CardDescription>Guided learning experience</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Take a knowledge assessment to personalize your experience</li>
                      <li>• Get recommended learning paths based on your level</li>
                      <li>• Follow structured, streaming content delivery</li>
                      <li>• Expand concepts for deeper understanding</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      Explore Tab
                    </CardTitle>
                    <CardDescription>Tree navigation and content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Browse the complete topic hierarchy</li>
                      <li>• Navigate through subtopics and related concepts</li>
                      <li>• Read detailed content with rich formatting</li>
                      <li>• Export content as PDF or Markdown</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      Ask Tab
                    </CardTitle>
                    <CardDescription>Conversational learning</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Ask questions about the topic in natural language</li>
                      <li>• Get contextual answers based on researched content</li>
                      <li>• Maintain conversation history across sessions</li>
                      <li>• Export conversations for later reference</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      MindMap Tab
                    </CardTitle>
                    <CardDescription>Visual knowledge representation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Visualize topic relationships as an interactive mind map</li>
                      <li>• Zoom, pan, and explore different layout options</li>
                      <li>• Click nodes to see summaries and navigate</li>
                      <li>• Export mind maps as images</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      Quiz Tab
                    </CardTitle>
                    <CardDescription>Adaptive assessment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Take quizzes generated from your reading history</li>
                      <li>• Multiple question types with adaptive difficulty</li>
                      <li>• Get detailed explanations for each answer</li>
                      <li>• Track your progress and improvement over time</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Research Pipeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• <strong>General Research Agent:</strong> Broad topic coverage</li>
                      <li>• <strong>Academic Agent:</strong> Scholarly articles and papers</li>
                      <li>• <strong>Computational Agent:</strong> Mathematical and technical content</li>
                      <li>• <strong>Video Agent:</strong> Educational video content</li>
                      <li>• <strong>Community Agent:</strong> Real-world discussions and perspectives</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Progress Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Time spent learning tracked automatically</li>
                      <li>• Completion status for topics and subtopics</li>
                      <li>• Bookmark interesting content sections</li>
                      <li>• Learning analytics and improvement trends</li>
                      <li>• Achievement badges and gamification</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Personalization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Knowledge level assessment</li>
                      <li>• Learning style preferences</li>
                      <li>• Adaptive difficulty adjustment</li>
                      <li>• Customized learning paths</li>
                      <li>• Pace preferences (self-paced vs guided)</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Export & Sharing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Export content as PDF or Markdown</li>
                      <li>• Save mind maps as images</li>
                      <li>• Export conversation transcripts</li>
                      <li>• Bookmark and save favorite sections</li>
                      <li>• Share learning progress (coming soon)</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tips" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Learning Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">For Best Results:</h4>
                      <ul className="space-y-1 text-sm list-disc list-inside">
                        <li>Start with the knowledge assessment in the Learn tab</li>
                        <li>Use specific, focused topic queries for better research results</li>
                        <li>Explore multiple tabs to reinforce learning through different modalities</li>
                        <li>Ask follow-up questions in the Ask tab to clarify concepts</li>
                        <li>Take quizzes regularly to test your understanding</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Topic Suggestions:</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">Machine Learning Basics</Badge>
                        <Badge variant="secondary">Quantum Computing</Badge>
                        <Badge variant="secondary">Web Development</Badge>
                        <Badge variant="secondary">Data Science</Badge>
                        <Badge variant="secondary">Blockchain Technology</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-1">How long does research take?</h4>
                      <p className="text-sm text-muted-foreground">
                        Research typically takes 2-5 minutes depending on topic complexity. You'll see real-time progress updates.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-1">Can I learn multiple topics simultaneously?</h4>
                      <p className="text-sm text-muted-foreground">
                        Yes! Each topic maintains separate progress and you can switch between them anytime.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-1">Is my progress saved?</h4>
                      <p className="text-sm text-muted-foreground">
                        All your progress, preferences, and bookmarks are automatically saved to your account.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-1">What if the AI gets something wrong?</h4>
                      <p className="text-sm text-muted-foreground">
                        While our AI is highly accurate, always verify important information from authoritative sources. Use the Ask tab to request clarifications.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-1">Can I suggest improvements?</h4>
                      <p className="text-sm text-muted-foreground">
                        We welcome feedback! Contact us through the account page or use the feedback option in the main menu.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}