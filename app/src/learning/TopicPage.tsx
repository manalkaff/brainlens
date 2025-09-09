import React, { Suspense } from "react";
import { useAuth } from "wasp/client/auth";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsContent } from "../components/ui/tabs";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "../components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "../components/ui/breadcrumb";
import { Separator } from "../components/ui/separator";
import { TopicProvider, useTopicContext } from "./context/TopicContext";
import { ProgressIndicator } from "./components/ui/ProgressIndicator";
import {
  TabNavigation,
  TabStatusIndicator,
} from "./components/ui/TabNavigation";
import { LearnTab } from "./components/tabs/LearnTab";
import { ExploreTab } from "./components/tabs/ExploreTab";
import { AskTab } from "./components/tabs/AskTab";
import { MindMapTab } from "./components/tabs/MindMapTab";
import { QuizTab } from "./components/tabs/QuizTab";
import { SourcesTab } from "./components/tabs/SourcesTab";
import { HelpSystem } from "./components/help/HelpSystem";
import {
  OnboardingFlow,
  useOnboarding,
} from "./components/help/OnboardingFlow";
import StreamingErrorBoundary from "./components/ui/StreamingErrorBoundary";
import { useErrorHandler } from "./hooks/useErrorHandler";
import { LearningSidebar } from "./components/ui/LearningSidebar";

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

// Header breadcrumb component
function TopicBreadcrumb() {
  const { topic, isLoading } = useTopicContext();

  if (isLoading) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <div className="h-4 bg-muted rounded w-24 animate-pulse" />
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <span className="text-foreground font-medium">
            {topic?.title || "Topic"}
          </span>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// Lazy tab content component
function LazyTabContent({
  tabId,
  children,
}: {
  tabId: string;
  children: React.ReactNode;
}) {
  const { isTabLoaded } = useTopicContext();

  if (!isTabLoaded(tabId as any)) {
    return <TabContentLoader />;
  }

  return <Suspense fallback={<TabContentLoader />}>{children}</Suspense>;
}


// Main TopicPage component
export default function TopicPage() {
  const { data: user } = useAuth();
  const { slug } = useParams<{ slug: string }>();

  return (
    <StreamingErrorBoundary
      onRetry={() => window.location.reload()}
      onReset={() => (window.location.href = "/learn")}
      showDetails={process.env.NODE_ENV === "development"}
    >
      <TopicProvider key={slug}>
        <TopicPageContent key={slug} />
      </TopicProvider>
    </StreamingErrorBoundary>
  );
}

// Topic page content with combined navbar
function TopicPageContent() {
  const { activeTab, setActiveTab, isLoading, error } = useTopicContext();
  const { showOnboarding, setShowOnboarding, completeOnboarding } =
    useOnboarding();
  const { slug } = useParams<{ slug: string }>();
  const errorHandler = useErrorHandler({
    maxRetries: 3,
    onError: (error) => {
      console.error("Topic page error:", error);
    },
    onRetry: (attempt) => {
      console.log(`Retrying topic page operation, attempt ${attempt}`);
    },
  });

  if (error) {
    return (
      <StreamingErrorBoundary
        onRetry={() => window.location.reload()}
        onReset={() => window.location.reload()}
        showDetails={process.env.NODE_ENV === "development"}
      >
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-destructive mb-2">
                Error Loading Topic
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </StreamingErrorBoundary>
    );
  }

  return (
    <SidebarProvider>
      <LearningSidebar currentPath={`/learn/${slug}`} />
      <SidebarInset>
        {/* Combined Header with Tab Navigation */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          
          {/* Tab Navigation on the left */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
            className="flex items-center"
          >
            <TabNavigation className="h-auto" />
          </Tabs>
          
          {/* Title/Breadcrumb in center */}
          <div className="flex-1 flex justify-center">
            <TopicBreadcrumb />
          </div>
          
          <div className="flex items-center gap-2">
            <HelpSystem />
          </div>
        </header>

        {/* Main Content - Full Screen */}
        <div className="flex-1 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
            className="h-full"
          >
            <TabsContent value="learn" className="mt-0 h-full">
              <StreamingErrorBoundary
                onRetry={() => window.location.reload()}
                showDetails={process.env.NODE_ENV === "development"}
              >
                <div className="h-full p-6">
                  <Suspense fallback={<TabContentLoader />}>
                    <LearnTab />
                  </Suspense>
                </div>
              </StreamingErrorBoundary>
            </TabsContent>

            <TabsContent value="explore" className="mt-0 h-full">
              <StreamingErrorBoundary
                onRetry={() => window.location.reload()}
                showDetails={process.env.NODE_ENV === "development"}
              >
                <div className="h-full p-6">
                  <LazyTabContent tabId="explore">
                    <ExploreTab />
                  </LazyTabContent>
                </div>
              </StreamingErrorBoundary>
            </TabsContent>

            <TabsContent value="ask" className="mt-0 h-full">
              <StreamingErrorBoundary
                onRetry={() => window.location.reload()}
                showDetails={process.env.NODE_ENV === "development"}
              >
                <div className="h-full p-6">
                  <LazyTabContent tabId="ask">
                    <AskTab />
                  </LazyTabContent>
                </div>
              </StreamingErrorBoundary>
            </TabsContent>

            <TabsContent value="mindmap" className="mt-0 h-full">
              <StreamingErrorBoundary
                onRetry={() => window.location.reload()}
                showDetails={process.env.NODE_ENV === "development"}
              >
                <div className="h-full">
                  <LazyTabContent tabId="mindmap">
                    <MindMapTab />
                  </LazyTabContent>
                </div>
              </StreamingErrorBoundary>
            </TabsContent>

            <TabsContent value="quiz" className="mt-0 h-full">
              <StreamingErrorBoundary
                onRetry={() => window.location.reload()}
                showDetails={process.env.NODE_ENV === "development"}
              >
                <div className="h-full p-6">
                  <LazyTabContent tabId="quiz">
                    <QuizTab />
                  </LazyTabContent>
                </div>
              </StreamingErrorBoundary>
            </TabsContent>

            <TabsContent value="sources" className="mt-0 h-full">
              <StreamingErrorBoundary
                onRetry={() => window.location.reload()}
                showDetails={process.env.NODE_ENV === "development"}
              >
                <div className="h-full p-6">
                  <LazyTabContent tabId="sources">
                    <SourcesTab />
                  </LazyTabContent>
                </div>
              </StreamingErrorBoundary>
            </TabsContent>
          </Tabs>
        </div>

        {/* Onboarding Flow */}
        <OnboardingFlow
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={completeOnboarding}
          currentTab={activeTab}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
