import { useState } from 'react';
import { useAuth } from 'wasp/client/auth';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { createTopic } from 'wasp/client/operations';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { OnboardingFlow, useOnboarding } from './components/help/OnboardingFlow';

// Removed example topics for cleaner design

export default function TopicInputLandingPage() {
  const [topicInput, setTopicInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { data: user } = useAuth();
  const { showOnboarding, setShowOnboarding, completeOnboarding } = useOnboarding();

  const handleStartLearning = async () => {
    if (!topicInput.trim()) return;
    
    if (!user) {
      window.location.href = routes.SignupRoute.to;
      return;
    }
    
    setIsCreating(true);
    
    try {
      const topic = await createTopic({
        title: topicInput.trim(),
        summary: `Learn about ${topicInput.trim()}`,
        description: `Comprehensive learning material for ${topicInput.trim()}`
      });
      
      console.log('Topic created:', topic);
      window.location.href = `/learn/${topic.slug}`;
    } catch (error) {
      console.error('Failed to create topic:', error);
      alert('Failed to create topic. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/30'>
      <main className='flex flex-col items-center justify-center min-h-screen px-6 py-12'>
        <div className='w-full max-w-2xl mx-auto space-y-12'>
          
          {/* Hero Section */}
          <div className='text-center space-y-8'>
            <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 rounded-3xl shadow-lg shadow-blue-500/25'>
              <svg className='w-9 h-9 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' />
              </svg>
            </div>
            
            <div className='space-y-4'>
              <h1 className='text-5xl md:text-6xl font-bold bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 dark:from-white dark:via-slate-100 dark:to-blue-100 bg-clip-text text-transparent tracking-tight leading-tight'>
                BrainLens
              </h1>
              <p className='text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed'>
                Turn any topic into a comprehensive learning experience powered by AI research
              </p>
            </div>
          </div>
          
          {/* Main Input Card */}
          <Card className='border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm'>
            <CardContent className='p-8 space-y-6'>
              <div className='text-center space-y-2'>
                <h2 className='text-xl font-semibold text-slate-900 dark:text-slate-100'>
                  What would you like to learn?
                </h2>
                <p className='text-sm text-slate-500 dark:text-slate-400'>
                  Enter any topic to get started
                </p>
              </div>
              
              <div className='space-y-4'>
                <Textarea
                  placeholder='e.g., "How neural networks work", "Ancient Roman history", "React hooks patterns"...'
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  className='min-h-[120px] text-base resize-none border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 rounded-xl px-4 py-3 placeholder:text-slate-400 dark:placeholder:text-slate-500'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleStartLearning();
                    }
                  }}
                />
                
                <div className='flex items-center justify-between pt-2'>
                  <div className='flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500'>
                    <kbd className='px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700'>⌘</kbd>
                    <kbd className='px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700'>↵</kbd>
                  </div>
                  <Button
                    onClick={handleStartLearning}
                    disabled={!topicInput.trim() || isCreating}
                    className='px-8 py-2.5 h-11 font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200'
                    size='lg'
                  >
                    {isCreating ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2' />
                        Creating...
                      </>
                    ) : (
                      'Start Learning →'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Simple Feature Highlight */}
          <div className='flex items-center justify-center gap-8 text-center'>
            <div className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400'>
              <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
              AI Research
            </div>
            <div className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400'>
              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              Structured Learning
            </div>
            <div className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400'>
              <div className='w-2 h-2 bg-purple-500 rounded-full'></div>
              Progress Tracking
            </div>
          </div>
          
          {!user && (
            <div className='text-center pt-4'>
              <p className='text-sm text-slate-500 dark:text-slate-400'>
                <WaspRouterLink 
                  to={routes.SignupRoute.to} 
                  className='text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors'
                >
                  Sign up
                </WaspRouterLink>{' '}
                to save progress and unlock all features
              </p>
            </div>
          )}
        </div>
      </main>

      <OnboardingFlow
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={completeOnboarding}
      />
    </div>
  );
}