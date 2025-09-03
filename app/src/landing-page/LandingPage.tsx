import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from 'wasp/client/auth';
import { createTopic, startTopicResearch } from 'wasp/client/operations';
import { OnboardingFlow, useOnboarding } from '../learning/components/help/OnboardingFlow';
import { storePendingTopic } from './utils/pendingTopicHandler';
import { logPerformanceMetrics, requestIdleCallback, cancelIdleCallback } from './utils/performance';
import { HeroSection } from './components/HeroSection';
import { LazySection } from './components/LazySection';
import { 
  IntroductionSkeleton,
  FeaturesSkeleton,
  FAQSkeleton,
  FooterSkeleton
} from './components/SkeletonLoaders';

// Lazy load non-critical sections
const IntroductionSection = lazy(() => 
  import('./components/IntroductionSection').then(module => ({ 
    default: module.IntroductionSection 
  }))
);

const FeaturesSection = lazy(() => 
  import('./components/FeaturesSection').then(module => ({ 
    default: module.FeaturesSection 
  }))
);

const FAQSection = lazy(() => 
  import('./components/FAQSection').then(module => ({ 
    default: module.FAQSection 
  }))
);

const FooterSection = lazy(() => 
  import('./components/FooterSection').then(module => ({ 
    default: module.FooterSection 
  }))
);

export default function LandingPage() {
  const [isCreating, setIsCreating] = useState(false);
  const { data: user } = useAuth();
  const { showOnboarding, setShowOnboarding, completeOnboarding } = useOnboarding();

  // Performance monitoring
  useEffect(() => {
    let idleCallbackId: number | NodeJS.Timeout;

    // Log performance metrics after page load
    const handleLoad = () => {
      idleCallbackId = requestIdleCallback(() => {
        logPerformanceMetrics();
      });
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
      if (idleCallbackId) {
        cancelIdleCallback(idleCallbackId);
      }
    };
  }, []);

  const handleTopicSubmit = async (topicInput: string) => {
    if (!topicInput.trim()) {
      throw new Error('Please enter a topic to learn about');
    }
    
    // Redirect to signup if user is not authenticated
    if (!user) {
      // Store the topic for creation after login/signup
      storePendingTopic(topicInput.trim());
      window.location.href = '/signup';
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Step 1: Create the topic
      const topic = await createTopic({
        title: topicInput.trim(),
        summary: `Learn about ${topicInput.trim()}`,
        description: `Comprehensive learning material for ${topicInput.trim()}`
      });
      
      console.log('Topic created:', topic);
      
      // Step 2: Start research automatically (optional - don't fail if this fails)
      try {
        await startTopicResearch({ 
          topicId: topic.id,
          userContext: {
            userLevel: 'intermediate', // Default level, can be customized later
            learningStyle: 'mixed'
          }
        });
        console.log('Research started for topic:', topic.id);
      } catch (researchError) {
        console.warn('Failed to start research automatically:', researchError);
        // Don't block navigation if research fails - user can trigger it manually later
      }
      
      // Navigate to topic page
      setTimeout(() => {
        window.location.href = `/learn/${topic.slug}`;
      }, 1000); // Brief delay to show success message
      
    } catch (error) {
      console.error('Failed to create topic:', error);
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          // This shouldn't happen since we check auth above, but just in case
          sessionStorage.setItem('pendingTopic', topicInput.trim());
          window.location.href = '/login';
          return;
        }
        
        if (error.message.includes('credits') || error.message.includes('quota')) {
          throw new Error('You have reached your learning quota. Please upgrade your plan to continue.');
        }
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network connection failed. Please check your internet connection and try again.');
        }
      }
      
      // Re-throw the error for InputCard to handle
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Skip to main content link for keyboard users */}
      <a 
        href="#hero" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-primary-foreground"
      >
        Skip to main content
      </a>

      {/* Main content */}
      <main role="main">
        {/* Hero Section with Input Card */}
        <HeroSection 
          onTopicSubmit={handleTopicSubmit}
          isLoading={isCreating}
        />
        
        {/* Introduction Section - Lazy loaded */}
        <LazySection fallback={<IntroductionSkeleton />}>
          <Suspense fallback={<IntroductionSkeleton />}>
            <IntroductionSection />
          </Suspense>
        </LazySection>
        
        {/* Features Section - Lazy loaded */}
        <LazySection fallback={<FeaturesSkeleton />}>
          <Suspense fallback={<FeaturesSkeleton />}>
            <FeaturesSection />
          </Suspense>
        </LazySection>
        
        {/* FAQ Section - Lazy loaded */}
        <LazySection fallback={<FAQSkeleton />}>
          <Suspense fallback={<FAQSkeleton />}>
            <FAQSection />
          </Suspense>
        </LazySection>
      </main>
      
      {/* Footer Section - Lazy loaded */}
      <LazySection fallback={<FooterSkeleton />}>
        <Suspense fallback={<FooterSkeleton />}>
          <FooterSection />
        </Suspense>
      </LazySection>

      {/* Onboarding Flow */}
      <OnboardingFlow
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={completeOnboarding}
      />
    </div>
  );
}

