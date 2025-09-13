import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { 
  BookOpen, 
  MessageCircle, 
  Map, 
  Brain, 
  Trophy, 
  Play, 
  CheckCircle, 
  ArrowRight,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';

interface GuideStep {
  title: string;
  description: string;
  tips?: string[];
}

interface TabGuide {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  purpose: string;
  bestFor: string[];
  steps: GuideStep[];
  proTips: string[];
}

const tabGuides: TabGuide[] = [
  {
    id: 'learn',
    name: 'Learn Tab',
    icon: <BookOpen className="h-5 w-5" />,
    color: 'bg-blue-500',
    description: 'Personalized, guided learning experience',
    purpose: 'Provides a structured learning path tailored to your knowledge level and learning preferences.',
    bestFor: ['First-time learners', 'Structured learning', 'Personalized experience', 'Guided progression'],
    steps: [
      {
        title: 'Take Knowledge Assessment',
        description: 'Complete a quick 2-3 minute assessment to determine your current knowledge level and learning preferences.',
        tips: [
          'Be honest about your knowledge level for best results',
          'Consider your preferred learning pace and style',
          'You can retake the assessment anytime'
        ]
      },
      {
        title: 'Choose Learning Path',
        description: 'Select from recommended learning paths based on your assessment results.',
        tips: [
          'Beginner paths start with fundamentals',
          'Advanced paths focus on complex concepts',
          'Interactive paths include more hands-on elements'
        ]
      },
      {
        title: 'Follow Streaming Content',
        description: 'Content is delivered progressively, adapting to your pace and understanding.',
        tips: [
          'Click on highlighted concepts for deeper explanations',
          'Take breaks when suggested to improve retention',
          'Progress is automatically saved'
        ]
      },
      {
        title: 'Expand Concepts',
        description: 'Click on any concept to get detailed explanations without losing your place.',
        tips: [
          'Use concept expansion to clarify confusing terms',
          'Related concepts are automatically suggested',
          'Expansions are tailored to your knowledge level'
        ]
      }
    ],
    proTips: [
      'Start here for any new topic - the assessment significantly improves your experience',
      'Use the "Restart Assessment" button if your knowledge level changes',
      'Concept expansions are context-aware and won\'t repeat information you already know',
      'The system learns from your interactions to improve future recommendations'
    ]
  },
  {
    id: 'explore',
    name: 'Explore Tab',
    icon: <Map className="h-5 w-5" />,
    color: 'bg-green-500',
    description: 'Browse topic hierarchy and detailed content',
    purpose: 'Allows free-form exploration of the complete topic structure with detailed content.',
    bestFor: ['Self-directed learners', 'Research purposes', 'Comprehensive coverage', 'Reference material'],
    steps: [
      {
        title: 'Navigate Topic Tree',
        description: 'Use the hierarchical tree view to browse all topics and subtopics.',
        tips: [
          'Green indicators show completed sections',
          'Gray indicators show unexplored areas',
          'Click to expand/collapse sections'
        ]
      },
      {
        title: 'Read Detailed Content',
        description: 'Access comprehensive content with rich formatting, code blocks, and diagrams.',
        tips: [
          'Use the table of contents for quick navigation',
          'Bookmark important sections for later reference',
          'Content includes examples and practical applications'
        ]
      },
      {
        title: 'Search Within Content',
        description: 'Use the search function to find specific information within the topic.',
        tips: [
          'Search works across all subtopics',
          'Results are highlighted in context',
          'Use specific terms for better results'
        ]
      },
      {
        title: 'Export Content',
        description: 'Export sections or entire topics as PDF or Markdown files.',
        tips: [
          'PDF exports include formatting and images',
          'Markdown exports are great for note-taking apps',
          'You can export individual sections or entire topics'
        ]
      }
    ],
    proTips: [
      'Use this tab when you need comprehensive reference material',
      'The search function is powerful - try searching for specific concepts across all content',
      'Bookmark frequently referenced sections for quick access',
      'Export important content for offline reading or sharing with others'
    ]
  },
  {
    id: 'ask',
    name: 'Ask Tab',
    icon: <MessageCircle className="h-5 w-5" />,
    color: 'bg-purple-500',
    description: 'Conversational learning with AI assistant',
    purpose: 'Provides interactive Q&A sessions with context-aware AI responses.',
    bestFor: ['Clarifying concepts', 'Interactive learning', 'Specific questions', 'Conversational style'],
    steps: [
      {
        title: 'Start a Conversation',
        description: 'Ask questions in natural language about any aspect of the topic.',
        tips: [
          'Be specific in your questions for better answers',
          'Ask follow-up questions to dive deeper',
          'The AI remembers conversation context'
        ]
      },
      {
        title: 'Get Contextual Answers',
        description: 'Receive answers based on the researched content and your learning history.',
        tips: [
          'Answers reference specific parts of the content',
          'Ask for examples or clarifications',
          'Request different explanations if needed'
        ]
      },
      {
        title: 'Manage Chat Threads',
        description: 'Create multiple conversation threads for different aspects of the topic.',
        tips: [
          'Use separate threads for different subtopics',
          'Name your threads for easy reference',
          'All conversations are automatically saved'
        ]
      },
      {
        title: 'Export Conversations',
        description: 'Save important conversations as text files for future reference.',
        tips: [
          'Export includes both questions and answers',
          'Great for creating study notes',
          'Share conversations with study partners'
        ]
      }
    ],
    proTips: [
      'Ask "Can you explain this differently?" if the first explanation doesn\'t click',
      'Use this tab to test your understanding by asking the AI to quiz you',
      'Ask for real-world examples to make abstract concepts concrete',
      'The AI can help you connect concepts from different parts of the topic'
    ]
  },
  {
    id: 'mindmap',
    name: 'MindMap Tab',
    icon: <Brain className="h-5 w-5" />,
    color: 'bg-orange-500',
    description: 'Visual knowledge representation',
    purpose: 'Displays topic relationships as an interactive visual mind map.',
    bestFor: ['Visual learners', 'Understanding relationships', 'Big picture view', 'Creative thinking'],
    steps: [
      {
        title: 'Navigate the Mind Map',
        description: 'Use mouse controls to zoom, pan, and explore the visual representation.',
        tips: [
          'Mouse wheel to zoom in/out',
          'Click and drag to pan around',
          'Double-click nodes to focus on them'
        ]
      },
      {
        title: 'Understand Visual Cues',
        description: 'Different colors and sizes represent completion status and content depth.',
        tips: [
          'Larger nodes have more detailed content',
          'Color coding shows your progress',
          'Connected lines show relationships'
        ]
      },
      {
        title: 'Interact with Nodes',
        description: 'Click nodes to see summaries and navigate to detailed content.',
        tips: [
          'Hover for quick previews',
          'Click for detailed summaries',
          'Double-click to navigate to content'
        ]
      },
      {
        title: 'Change Layout Options',
        description: 'Switch between different layout algorithms to find the best view.',
        tips: [
          'Hierarchical layout shows clear structure',
          'Radial layout emphasizes central concepts',
          'Force-directed layout reveals natural groupings'
        ]
      }
    ],
    proTips: [
      'Use the mind map to identify knowledge gaps - look for disconnected or sparse areas',
      'The radial layout is great for seeing how everything connects to the main topic',
      'Export mind maps as images to include in presentations or study materials',
      'Use fullscreen mode for complex topics with many subtopics'
    ]
  },
  {
    id: 'quiz',
    name: 'Quiz Tab',
    icon: <Trophy className="h-5 w-5" />,
    color: 'bg-red-500',
    description: 'Test knowledge with adaptive questions',
    purpose: 'Provides adaptive assessments to test and reinforce your learning.',
    bestFor: ['Testing knowledge', 'Reinforcement', 'Identifying gaps', 'Gamified learning'],
    steps: [
      {
        title: 'Generate Quiz',
        description: 'Create quizzes based on content you\'ve explored and your reading history.',
        tips: [
          'Quizzes adapt to your demonstrated knowledge level',
          'Questions cover recently studied material',
          'Multiple question types keep it engaging'
        ]
      },
      {
        title: 'Take Adaptive Questions',
        description: 'Answer questions that adjust in difficulty based on your performance.',
        tips: [
          'Read questions carefully - some have multiple correct aspects',
          'Don\'t guess randomly - the system learns from your patterns',
          'Take your time - there\'s no time pressure'
        ]
      },
      {
        title: 'Review Explanations',
        description: 'Get detailed explanations for each answer, whether correct or incorrect.',
        tips: [
          'Read explanations even for correct answers',
          'Explanations often include additional context',
          'Links to relevant content sections are provided'
        ]
      },
      {
        title: 'Track Progress',
        description: 'Monitor your quiz performance and improvement trends over time.',
        tips: [
          'Focus on areas with consistently low scores',
          'Celebrate improvements in difficult topics',
          'Use trends to guide further study'
        ]
      }
    ],
    proTips: [
      'Take quizzes regularly - spaced repetition improves long-term retention',
      'Don\'t worry about perfect scores - the goal is learning, not testing',
      'Use quiz results to identify which sections need more study',
      'The adaptive system means everyone gets appropriately challenging questions'
    ]
  }
];

interface UserGuidesProps {
  defaultTab?: string;
}

export function UserGuides({ defaultTab = 'learn' }: UserGuidesProps) {
  const [selectedGuide, setSelectedGuide] = useState(defaultTab);

  const currentGuide = tabGuides.find(guide => guide.id === selectedGuide) || tabGuides[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Learning Tab Guides
          </CardTitle>
          <CardDescription>
            Detailed guides for each learning tab to help you get the most out of the platform
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tab Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Choose a Tab</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tabGuides.map(guide => (
                <Button
                  key={guide.id}
                  variant={selectedGuide === guide.id ? "default" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => setSelectedGuide(guide.id)}
                >
                  <div className={`w-3 h-3 rounded-full ${guide.color}`} />
                  {guide.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Guide Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${currentGuide.color} text-white`}>
                  {currentGuide.icon}
                </div>
                <div>
                  <CardTitle>{currentGuide.name}</CardTitle>
                  <CardDescription>{currentGuide.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="steps">Step-by-Step</TabsTrigger>
                  <TabsTrigger value="tips">Pro Tips</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Purpose</h4>
                    <p className="text-muted-foreground">{currentGuide.purpose}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Best For</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentGuide.bestFor.map(item => (
                        <Badge key={item} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">Quick Start</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {currentGuide.id === 'learn' && "Start with the knowledge assessment to personalize your experience."}
                      {currentGuide.id === 'explore' && "Use the topic tree to navigate to areas of interest."}
                      {currentGuide.id === 'ask' && "Ask your first question about anything you want to understand better."}
                      {currentGuide.id === 'mindmap' && "Zoom out to see the full topic structure, then explore connections."}
                      {currentGuide.id === 'quiz' && "Generate your first quiz based on content you've already explored."}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="steps" className="space-y-4">
                  <div className="space-y-4">
                    {currentGuide.steps.map((step, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-3 text-lg">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {index + 1}
                            </div>
                            {step.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground mb-3">{step.description}</p>
                          {step.tips && (
                            <div>
                              <h5 className="font-semibold text-sm mb-2">Tips:</h5>
                              <ul className="space-y-1">
                                {step.tips.map((tip, tipIndex) => (
                                  <li key={tipIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="tips" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Pro Tips for {currentGuide.name}
                    </h4>
                    <div className="space-y-3">
                      {currentGuide.proTips.map((tip, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-primary font-semibold text-xs">{index + 1}</span>
                          </div>
                          <p className="text-sm">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Need More Help?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        If you're still having trouble with {currentGuide.name.toLowerCase()}, try these resources:
                      </p>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Ask in the community forum
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Play className="h-4 w-4 mr-2" />
                          Watch tutorial videos
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Contact support
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}