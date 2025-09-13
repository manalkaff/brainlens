import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { CheckCircle, ArrowRight, ArrowLeft, Sparkles, BookOpen, Brain, Trophy } from 'lucide-react';
export function OnboardingFlow({ isOpen, onClose, onComplete, currentTab }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState(new Set());
    const steps = [
        {
            id: 'welcome',
            title: 'Welcome to AI-Powered Learning!',
            description: 'Let\'s take a quick tour of how this platform works',
            content: (<div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-primary"/>
            </div>
            <p className="text-muted-foreground">
              This platform uses advanced AI to research any topic you want to learn about, 
              then presents the information through multiple learning modalities tailored to your preferences.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 border rounded-lg">
              <Brain className="h-6 w-6 text-primary mx-auto mb-2"/>
              <h4 className="font-semibold text-sm">AI Research</h4>
              <p className="text-xs text-muted-foreground">Comprehensive topic analysis</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <BookOpen className="h-6 w-6 text-primary mx-auto mb-2"/>
              <h4 className="font-semibold text-sm">Structured Learning</h4>
              <p className="text-xs text-muted-foreground">Organized knowledge trees</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Trophy className="h-6 w-6 text-primary mx-auto mb-2"/>
              <h4 className="font-semibold text-sm">Progress Tracking</h4>
              <p className="text-xs text-muted-foreground">Monitor your learning journey</p>
            </div>
          </div>
        </div>)
        },
        {
            id: 'research-process',
            title: 'How AI Research Works',
            description: 'Understanding the research pipeline',
            content: (<div className="space-y-4">
          <p className="text-muted-foreground">
            When you enter a topic, our AI agents work together to research it comprehensively:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-semibold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-sm">General Research Agent</h4>
                <p className="text-xs text-muted-foreground">Gathers broad information and definitions</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-semibold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Academic Research Agent</h4>
                <p className="text-xs text-muted-foreground">Finds scholarly articles and research papers</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-semibold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Specialized Agents</h4>
                <p className="text-xs text-muted-foreground">Video content, community discussions, and technical details</p>
              </div>
            </div>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm">
              <strong>Tip:</strong> Research typically takes 2-5 minutes. You'll see real-time progress updates 
              as each agent completes its work.
            </p>
          </div>
        </div>)
        },
        {
            id: 'learning-tabs',
            title: 'Five Ways to Learn',
            description: 'Explore different learning modalities',
            content: (<div className="space-y-4">
          <p className="text-muted-foreground">
            Once research is complete, you can access your content through five specialized tabs:
          </p>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"/>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Learn</h4>
                <p className="text-xs text-muted-foreground">Personalized, guided learning experience</p>
              </div>
              {currentTab === 'learn' && <Badge variant="secondary" className="text-xs">Current</Badge>}
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"/>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Explore</h4>
                <p className="text-xs text-muted-foreground">Browse topic tree and detailed content</p>
              </div>
              {currentTab === 'explore' && <Badge variant="secondary" className="text-xs">Current</Badge>}
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-3 h-3 rounded-full bg-purple-500 flex-shrink-0"/>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Ask</h4>
                <p className="text-xs text-muted-foreground">Conversational Q&A with AI assistant</p>
              </div>
              {currentTab === 'ask' && <Badge variant="secondary" className="text-xs">Current</Badge>}
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0"/>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">MindMap</h4>
                <p className="text-xs text-muted-foreground">Visual knowledge representation</p>
              </div>
              {currentTab === 'mindmap' && <Badge variant="secondary" className="text-xs">Current</Badge>}
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"/>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Quiz</h4>
                <p className="text-xs text-muted-foreground">Test knowledge with adaptive questions</p>
              </div>
              {currentTab === 'quiz' && <Badge variant="secondary" className="text-xs">Current</Badge>}
            </div>
          </div>
        </div>)
        },
        {
            id: 'personalization',
            title: 'Personalized Learning',
            description: 'How we adapt to your needs',
            content: (<div className="space-y-4">
          <p className="text-muted-foreground">
            The platform adapts to your learning style and knowledge level:
          </p>
          
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Knowledge Assessment</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Take a quick assessment to determine your starting point and preferred learning approach.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Adaptive Content</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Content difficulty and presentation style adjust based on your interactions and progress.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Your learning progress, time spent, and achievements are automatically tracked and saved.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-primary/10 p-3 rounded-lg">
            <p className="text-sm">
              <strong>Pro Tip:</strong> Start with the Learn tab to take the assessment - it only takes 2-3 minutes 
              and significantly improves your learning experience!
            </p>
          </div>
        </div>)
        },
        {
            id: 'getting-started',
            title: 'Ready to Start Learning!',
            description: 'Your next steps',
            content: (<div className="space-y-4">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4"/>
            <p className="text-muted-foreground">
              You're all set! Here's what to do next:
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white font-semibold text-xs">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Start with the Learn Tab</h4>
                <p className="text-xs text-muted-foreground">
                  Take the knowledge assessment to personalize your experience
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white font-semibold text-xs">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Explore Other Tabs</h4>
                <p className="text-xs text-muted-foreground">
                  Try different learning modalities to find what works best for you
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white font-semibold text-xs">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Ask Questions</h4>
                <p className="text-xs text-muted-foreground">
                  Use the Ask tab whenever you need clarification or want to dive deeper
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Need help later? Click the <strong>Help</strong> button in the top navigation.
            </p>
          </div>
        </div>)
        }
    ];
    const progress = ((currentStep + 1) / steps.length) * 100;
    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCompletedSteps(prev => new Set([...prev, steps[currentStep].id]));
            setCurrentStep(currentStep + 1);
        }
        else {
            handleComplete();
        }
    };
    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };
    const handleComplete = () => {
        setCompletedSteps(prev => new Set([...prev, steps[currentStep].id]));
        onComplete();
        onClose();
    };
    const handleSkip = () => {
        onClose();
    };
    const currentStepData = steps[currentStep];
    return (<Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{currentStepData.title}</DialogTitle>
              <DialogDescription>{currentStepData.description}</DialogDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {currentStep + 1} of {steps.length}
            </Badge>
          </div>
          <Progress value={progress} className="mt-4"/>
        </DialogHeader>
        
        <div className="py-4">
          {currentStepData.content}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip Tour
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevious} disabled={currentStep === 0}>
              <ArrowLeft className="h-4 w-4 mr-1"/>
              Previous
            </Button>
            
            <Button size="sm" onClick={handleNext}>
              {currentStep === steps.length - 1 ? (<>
                  <CheckCircle className="h-4 w-4 mr-1"/>
                  Get Started
                </>) : (<>
                  Next
                  <ArrowRight className="h-4 w-4 ml-1"/>
                </>)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>);
}
// Hook to manage onboarding state
export function useOnboarding() {
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    useEffect(() => {
        // Check if user has seen onboarding before
        const seen = localStorage.getItem('learning-platform-onboarding-seen');
        if (!seen) {
            setShowOnboarding(true);
        }
        else {
            setHasSeenOnboarding(true);
        }
    }, []);
    const completeOnboarding = () => {
        localStorage.setItem('learning-platform-onboarding-seen', 'true');
        setHasSeenOnboarding(true);
        setShowOnboarding(false);
    };
    const resetOnboarding = () => {
        localStorage.removeItem('learning-platform-onboarding-seen');
        setHasSeenOnboarding(false);
        setShowOnboarding(true);
    };
    return {
        hasSeenOnboarding,
        showOnboarding,
        setShowOnboarding,
        completeOnboarding,
        resetOnboarding
    };
}
//# sourceMappingURL=OnboardingFlow.jsx.map