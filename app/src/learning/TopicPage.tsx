import React, { Suspense } from 'react';
import { useAuth } from 'wasp/client/auth';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent } from '../components/ui/tabs';
import { TopicProvider, useTopicContext } from './context/TopicContext';
import { ProgressIndicator } from './components/ui/ProgressIndicator';
import { TabNavigation, TabStatusIndicator } from './components/ui/TabNavigation';
import { LearnTab } from './components/tabs/LearnTab';
import { ExploreTab } from './components/tabs/ExploreTab';
import { AskTab } from './components/tabs/AskTab';
import { MindMapTab } from './components/tabs/MindMapTab';
import { QuizTab } from './components/tabs/QuizTab';
import { HelpSystem } from './components/help/HelpSystem';
import { OnboardingFlow, useOnboarding } from './components/help/OnboardingFlow';

// Loading component for tab content
function TabContentLoader() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-32 bg-muted rounded" />
      </div>
    </div>
  );
}

// Topic header component
function TopicHeader() {
  const { topic, isLoading, error } = useTopicContext();

  if (isLoading) {
    return (
      <div className="mb-8 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/2 mb-4" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-destructive mb-4">Error Loading Topic</h1>
        <p className="text-lg text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-muted-foreground mb-4">Topic Not Found</h1>
        <p className="text-lg text-muted-foreground">
          The requested topic could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-foreground mb-2">{topic.title}</h1>
          {topic.summary && (
            <p className="text-lg text-muted-foreground mb-4">{topic.summary}</p>
          )}
          {topic.description && (
            <p className="text-muted-foreground">{topic.description}</p>
          )}
        </div>
      </div>
      
      {/* Progress Indicator */}
      <ProgressIndicator className="mb-6" />
      
      {/* Topic Metadata */}
      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
        <span>Depth: Level {topic.depth + 1}</span>
        <span>•</span>
        <span>Status: {topic.status}</span>
        {topic.parent && (
          <>
            <span>•</span>
            <span>Parent: {topic.parent.title}</span>
          </>
        )}
        {topic.children.length > 0 && (
          <>
            <span>•</span>
            <span>{topic.children.length} subtopics</span>
          </>
        )}
      </div>
    </div>
  );
}

// Lazy tab content component
function LazyTabContent({ tabId, children }: { tabId: string; children: React.ReactNode }) {
  const { isTabLoaded } = useTopicContext();
  
  if (!isTabLoaded(tabId as any)) {
    return <TabContentLoader />;
  }
  
  return (
    <Suspense fallback={<TabContentLoader />}>
      {children}
    </Suspense>
  );
}

// Main topic page content with tabs
function TopicPageContent() {
  const { activeTab, setActiveTab, isLoading, error } = useTopicContext();
  const { showOnboarding, setShowOnboarding, completeOnboarding } = useOnboarding();

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Topic</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <TopicHeader />
      
      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
          <TabNavigation />
          <TabStatusIndicator />
        </div>

        {/* Tab Content with Lazy Loading */}
        <div className="mt-6">
          <TabsContent value="learn" className="mt-0">
            <Suspense fallback={<TabContentLoader />}>
              <LearnTab />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="explore" className="mt-0">
            <LazyTabContent tabId="explore">
              <ExploreTab />
            </LazyTabContent>
          </TabsContent>
          
          <TabsContent value="ask" className="mt-0">
            <LazyTabContent tabId="ask">
              <AskTab />
            </LazyTabContent>
          </TabsContent>
          
          <TabsContent value="mindmap" className="mt-0">
            <LazyTabContent tabId="mindmap">
              <MindMapTab />
            </LazyTabContent>
          </TabsContent>
          
          <TabsContent value="quiz" className="mt-0">
            <LazyTabContent tabId="quiz">
              <QuizTab />
            </LazyTabContent>
          </TabsContent>
        </div>
      </Tabs>

      {/* Onboarding Flow */}
      <OnboardingFlow
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={completeOnboarding}
        currentTab={activeTab}
      />
    </div>
  );
}

// Main TopicPage component
export default function TopicPage() {
  const { data: user } = useAuth();

  return (
    <TopicProvider>
      <div className="min-h-screen bg-background">
        {/* Header with Breadcrumb */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                <WaspRouterLink 
                  to={routes.LandingPageRoute.to} 
                  className="text-xl font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  LearnAI
                </WaspRouterLink>
                <span className="text-muted-foreground">/</span>
                <WaspRouterLink 
                  to="/learn" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Learn
                </WaspRouterLink>
                <span className="text-muted-foreground">/</span>
                <span className="text-foreground font-medium">Topic</span>
              </div>
              <div className="flex items-center space-x-4">
                <HelpSystem />
                <Button variant="ghost" asChild>
                  <WaspRouterLink to="/learn">← Back to Search</WaspRouterLink>
                </Button>
                <Button variant="ghost" asChild>
                  <WaspRouterLink to={routes.AccountRoute.to}>Account</WaspRouterLink>
                </Button>
              </div>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <TopicPageContent />
          </div>
        </main>
      </div>
    </TopicProvider>
  );
}