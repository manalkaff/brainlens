import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../components/ui/accordion';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Search, Clock, Users, Brain, Zap, Shield, BookOpen } from 'lucide-react';
const faqData = [
    {
        id: 'research-time',
        question: 'How long does the AI research process take?',
        answer: 'Research typically takes 2-5 minutes depending on the complexity of your topic. Simple topics like "Basic Math" might complete in 2-3 minutes, while complex topics like "Quantum Machine Learning" could take 4-5 minutes. You\'ll see real-time progress updates showing which AI agents are working and what they\'ve discovered.',
        category: 'Research Process',
        tags: ['time', 'research', 'ai', 'progress']
    },
    {
        id: 'multiple-topics',
        question: 'Can I learn multiple topics at the same time?',
        answer: 'Absolutely! You can research and learn multiple topics simultaneously. Each topic maintains its own progress, bookmarks, and learning preferences. Switch between topics anytime using the topic search page or your account dashboard.',
        category: 'Learning Management',
        tags: ['topics', 'progress', 'multitasking']
    },
    {
        id: 'progress-saved',
        question: 'Is my learning progress automatically saved?',
        answer: 'Yes, everything is automatically saved to your account including: learning progress, time spent, completed sections, bookmarks, quiz scores, chat conversations, and your personalization preferences. You can access your progress from any device.',
        category: 'Progress Tracking',
        tags: ['progress', 'saving', 'sync', 'account']
    },
    {
        id: 'ai-accuracy',
        question: 'How accurate is the AI-generated content?',
        answer: 'Our AI uses multiple specialized research agents and cross-references information from academic sources, reputable websites, and community discussions. While highly accurate, we recommend verifying critical information from authoritative sources. Use the Ask tab to request clarifications or additional sources.',
        category: 'AI & Accuracy',
        tags: ['accuracy', 'ai', 'verification', 'sources']
    },
    {
        id: 'personalization-works',
        question: 'How does the personalization system work?',
        answer: 'The system personalizes your experience through: 1) Initial knowledge assessment to determine your level, 2) Learning style preferences (visual, auditory, hands-on, etc.), 3) Adaptive difficulty based on your interactions, 4) Content recommendations based on your progress and interests.',
        category: 'Personalization',
        tags: ['personalization', 'assessment', 'adaptive', 'preferences']
    },
    {
        id: 'offline-access',
        question: 'Can I access content offline?',
        answer: 'Currently, the platform requires an internet connection for full functionality. However, you can export content as PDF or Markdown files for offline reading. We\'re working on offline mode for future releases.',
        category: 'Technical',
        tags: ['offline', 'export', 'pdf', 'markdown']
    },
    {
        id: 'quiz-generation',
        question: 'How are quiz questions generated?',
        answer: 'Quiz questions are dynamically generated based on the content you\'ve explored and your reading history. The AI creates multiple question types (multiple choice, true/false, fill-in-blank) and adapts difficulty based on your performance to maintain optimal challenge level.',
        category: 'Quizzes',
        tags: ['quiz', 'questions', 'adaptive', 'difficulty']
    },
    {
        id: 'data-privacy',
        question: 'How is my learning data protected?',
        answer: 'We take privacy seriously. Your learning data is encrypted, stored securely, and never shared with third parties. You can export or delete your data anytime. We only use aggregated, anonymized data to improve the platform.',
        category: 'Privacy & Security',
        tags: ['privacy', 'security', 'data', 'encryption']
    },
    {
        id: 'topic-suggestions',
        question: 'What makes a good topic for research?',
        answer: 'Best results come from specific, focused topics like "Machine Learning Fundamentals" rather than broad ones like "Technology". Good topics are: specific enough to research thoroughly, broad enough to have subtopics, and aligned with your learning goals.',
        category: 'Topic Selection',
        tags: ['topics', 'suggestions', 'research', 'quality']
    },
    {
        id: 'export-options',
        question: 'What export options are available?',
        answer: 'You can export: 1) Topic content as PDF or Markdown, 2) Mind maps as PNG/SVG images, 3) Chat conversations as text files, 4) Quiz results and progress reports, 5) Bookmarked content collections.',
        category: 'Export & Sharing',
        tags: ['export', 'pdf', 'markdown', 'mindmap', 'chat']
    },
    {
        id: 'subscription-limits',
        question: 'What are the usage limits for free accounts?',
        answer: 'Free accounts can research 3 topics per month with full access to all learning features. Premium accounts have unlimited topic research, priority processing, advanced analytics, and early access to new features.',
        category: 'Subscription',
        tags: ['limits', 'free', 'premium', 'subscription']
    },
    {
        id: 'mobile-experience',
        question: 'Does the platform work well on mobile devices?',
        answer: 'Yes! The platform is fully responsive and optimized for mobile devices. All features work on smartphones and tablets, though some complex visualizations like mind maps work best on larger screens.',
        category: 'Technical',
        tags: ['mobile', 'responsive', 'tablet', 'smartphone']
    },
    {
        id: 'learning-styles',
        question: 'How does the platform accommodate different learning styles?',
        answer: 'The platform offers multiple learning modalities: visual learners benefit from mind maps and diagrams, auditory learners from conversational AI, kinesthetic learners from interactive quizzes, and reading/writing learners from structured text content.',
        category: 'Learning Styles',
        tags: ['learning styles', 'visual', 'auditory', 'kinesthetic', 'modalities']
    },
    {
        id: 'feedback-improvement',
        question: 'How can I provide feedback or suggest improvements?',
        answer: 'We welcome feedback! You can: 1) Use the feedback button in your account settings, 2) Contact support through the help menu, 3) Join our community forum for feature discussions, 4) Rate and review content to help improve AI recommendations.',
        category: 'Feedback',
        tags: ['feedback', 'suggestions', 'improvement', 'community']
    },
    {
        id: 'technical-issues',
        question: 'What should I do if I encounter technical issues?',
        answer: 'For technical issues: 1) Try refreshing the page, 2) Check your internet connection, 3) Clear browser cache if problems persist, 4) Contact support with details about the issue, your browser, and any error messages.',
        category: 'Technical Support',
        tags: ['technical', 'issues', 'troubleshooting', 'support']
    }
];
const categories = Array.from(new Set(faqData.map(item => item.category)));
export function FAQ() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const filteredFAQs = faqData.filter(item => {
        const matchesSearch = searchTerm === '' ||
            item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = selectedCategory === null || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Research Process': return <Brain className="h-4 w-4"/>;
            case 'Learning Management': return <BookOpen className="h-4 w-4"/>;
            case 'Progress Tracking': return <Clock className="h-4 w-4"/>;
            case 'AI & Accuracy': return <Zap className="h-4 w-4"/>;
            case 'Privacy & Security': return <Shield className="h-4 w-4"/>;
            case 'Technical': return <Users className="h-4 w-4"/>;
            default: return <BookOpen className="h-4 w-4"/>;
        }
    };
    return (<div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5"/>
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>
            Find answers to common questions about the AI-powered learning platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input placeholder="Search questions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={selectedCategory === null ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelectedCategory(null)}>
                All Categories
              </Badge>
              {categories.map(category => (<Badge key={category} variant={selectedCategory === category ? "default" : "outline"} className="cursor-pointer flex items-center gap-1" onClick={() => setSelectedCategory(category)}>
                  {getCategoryIcon(category)}
                  {category}
                </Badge>))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Items */}
      <Card>
        <CardContent className="p-0">
          {filteredFAQs.length === 0 ? (<div className="p-6 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50"/>
              <p>No questions found matching your search.</p>
              <p className="text-sm">Try different keywords or browse all categories.</p>
            </div>) : (<Accordion type="single" collapsible className="w-full">
              {filteredFAQs.map((item, index) => (<AccordionItem key={item.id} value={item.id} className="px-6">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-1">
                        <div className="font-medium">{item.question}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getCategoryIcon(item.category)}
                            <span className="ml-1">{item.category}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <div className="space-y-3">
                      <p>{item.answer}</p>
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map(tag => (<Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>))}
            </Accordion>)}
        </CardContent>
      </Card>

      {/* Quick Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Still Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Contact Support</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Get personalized help from our support team
              </p>
              <Badge variant="outline" className="text-xs">
                Response within 24 hours
              </Badge>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Community Forum</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Connect with other learners and share tips
              </p>
              <Badge variant="outline" className="text-xs">
                Active community
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>);
}
//# sourceMappingURL=FAQ.jsx.map