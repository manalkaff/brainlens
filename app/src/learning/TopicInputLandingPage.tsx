import { useState } from 'react';
import { useAuth } from 'wasp/client/auth';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { createTopic } from 'wasp/client/operations';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { HelpSystem } from './components/help/HelpSystem';
import { OnboardingFlow, useOnboarding } from './components/help/OnboardingFlow';

const exampleTopics = [
  "Machine Learning Fundamentals",
  "Quantum Computing Basics", 
  "Sustainable Energy Technologies",
  "Modern Web Development",
  "Blockchain and Cryptocurrencies",
  "Artificial Intelligence Ethics"
];

export default function TopicInputLandingPage() {
  const [topicInput, setTopicInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { data: user } = useAuth();
  const { showOnboarding, setShowOnboarding, completeOnboarding } = useOnboarding();

  const handleStartLearning = async () => {
    if (!topicInput.trim()) return;
    
    if (!user) {
      // Redirect to signup if not authenticated
      window.location.href = routes.SignupRoute.to;
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Create the topic
      const topic = await createTopic({
        title: topicInput.trim(),
        summary: `Learn about ${topicInput.trim()}`,
        description: `Comprehensive learning material for ${topicInput.trim()}`
      });
      
      // For now, skip the research process and navigate directly
      // TODO: Implement research pipeline integration
      console.log('Topic created:', topic);
      
      // Navigate to the topic page
      window.location.href = `/learn/${topic.slug}`;
    } catch (error) {
      console.error('Failed to create topic:', error);
      alert('Failed to create topic. Please try again.');
      setIsCreating(false);
    }
  };

  const handleExampleClick = (topic: string) => {
    setTopicInput(topic);
  };

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <TopGradient />
      <BottomGradient />
      
      {/* Header */}
      <header className='absolute inset-x-0 top-0 z-50'>
        <nav className='flex items-center justify-between p-6 lg:px-8' aria-label='Global'>
          <div className='flex lg:flex-1'>
            <WaspRouterLink to={routes.LandingPageRoute.to} className='-m-1.5 p-1.5'>
              <span className='text-xl font-bold text-gradient-primary'>LearnAI</span>
            </WaspRouterLink>
          </div>
          <div className='flex lg:flex-1 lg:justify-end gap-4'>
            <HelpSystem />
            <Button variant='ghost' asChild>
              <WaspRouterLink to="/home">About</WaspRouterLink>
            </Button>
            {user ? (
              <Button variant='default' asChild>
                <WaspRouterLink to={routes.AccountRoute.to}>Dashboard</WaspRouterLink>
              </Button>
            ) : (
              <>
                <Button variant='ghost' asChild>
                  <WaspRouterLink to={routes.LoginRoute.to}>Sign In</WaspRouterLink>
                </Button>
                <Button variant='default' asChild>
                  <WaspRouterLink to={routes.SignupRoute.to}>Get Started</WaspRouterLink>
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className='relative isolate px-6 pt-14 lg:px-8'>
        <div className='mx-auto max-w-4xl py-32 sm:py-48 lg:py-56'>
          <div className='text-center'>
            <h1 className='text-4xl font-bold tracking-tight text-foreground sm:text-6xl'>
              Learn anything with{' '}
              <span className='text-gradient-primary'>AI-powered research</span>
            </h1>
            <p className='mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto'>
              Enter any topic and get a comprehensive, structured learning experience. 
              Our AI researches, organizes, and presents information through multiple learning modalities.
            </p>
            
            {/* Topic Input */}
            <div className='mt-10 max-w-2xl mx-auto'>
              <div className='relative'>
                <Textarea
                  placeholder="What would you like to learn about? (e.g., Machine Learning, Quantum Physics, Web Development...)"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  className='min-h-[120px] text-base resize-none pr-24'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleStartLearning();
                    }
                  }}
                />
                <Button
                  onClick={handleStartLearning}
                  disabled={!topicInput.trim() || isCreating}
                  className='absolute bottom-3 right-3'
                  size='sm'
                >
                  {isCreating ? 'Creating...' : 'Start Learning →'}
                </Button>
              </div>
              
              {!user && (
                <p className='mt-3 text-sm text-muted-foreground'>
                  Sign up to save your progress and access all features
                </p>
              )}
            </div>

            {/* Example Topics */}
            <div className='mt-12'>
              <p className='text-sm font-medium text-muted-foreground mb-4'>
                Quick start suggestions:
              </p>
              <div className='flex flex-wrap justify-center gap-2'>
                {exampleTopics.map((topic) => (
                  <Button
                    key={topic}
                    variant='outline'
                    size='sm'
                    onClick={() => handleExampleClick(topic)}
                    className='text-sm'
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>

            {/* Features Preview */}
            <div className='mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3'>
              <div className='text-center'>
                <div className='mx-auto h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4'>
                  <svg className='h-6 w-6 text-primary' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z' />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-foreground'>AI Research</h3>
                <p className='text-sm text-muted-foreground'>
                  Comprehensive topic research with multiple specialized AI agents
                </p>
              </div>
              
              <div className='text-center'>
                <div className='mx-auto h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4'>
                  <svg className='h-6 w-6 text-primary' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-foreground'>Multi-Modal Learning</h3>
                <p className='text-sm text-muted-foreground'>
                  Learn through guided content, mind maps, quizzes, and conversations
                </p>
              </div>
              
              <div className='text-center'>
                <div className='mx-auto h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4'>
                  <svg className='h-6 w-6 text-primary' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-foreground'>Progress Tracking</h3>
                <p className='text-sm text-muted-foreground'>
                  Track your learning journey with detailed progress analytics
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Onboarding Flow */}
      <OnboardingFlow
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={completeOnboarding}
      />
    </div>
  );
}

function TopGradient() {
  return (
    <div
      className='absolute top-0 right-0 -z-10 transform-gpu overflow-hidden w-full blur-3xl sm:top-0'
      aria-hidden='true'
    >
      <div
        className='aspect-[1020/880] w-[70rem] flex-none sm:right-1/4 sm:translate-x-1/2 dark:hidden bg-gradient-to-tr from-amber-400 to-purple-300 opacity-10'
        style={{
          clipPath: 'polygon(80% 20%, 90% 55%, 50% 100%, 70% 30%, 20% 50%, 50% 0)',
        }}
      />
    </div>
  );
}

function BottomGradient() {
  return (
    <div
      className='absolute inset-x-0 top-[calc(100%-40rem)] sm:top-[calc(100%-65rem)] -z-10 transform-gpu overflow-hidden blur-3xl'
      aria-hidden='true'
    >
      <div
        className='relative aspect-[1020/880] sm:-left-3/4 sm:translate-x-1/4 dark:hidden bg-gradient-to-br from-amber-400 to-purple-300 opacity-10 w-[90rem]'
        style={{
          clipPath: 'ellipse(80% 30% at 80% 50%)',
        }}
      />
    </div>
  );
}