import { useState } from 'react';
import { useAuth } from 'wasp/client/auth';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const exampleTopics = [
  "Machine Learning Fundamentals",
  "Quantum Computing Basics", 
  "Sustainable Energy Technologies",
  "Modern Web Development",
  "Blockchain and Cryptocurrencies",
  "Artificial Intelligence Ethics",
  "Data Science with Python",
  "Cloud Computing Architecture",
  "Cybersecurity Fundamentals",
  "Digital Marketing Strategy"
];

const recentTopics = [
  { title: "React Hooks Deep Dive", slug: "react-hooks-deep-dive", progress: 75 },
  { title: "Machine Learning Basics", slug: "machine-learning-basics", progress: 45 },
  { title: "TypeScript Advanced", slug: "typescript-advanced", progress: 90 }
];

export default function TopicSearchPage() {
  const [topicInput, setTopicInput] = useState('');
  const { data: user } = useAuth();

  const handleStartLearning = () => {
    if (!topicInput.trim()) return;
    
    // Create topic slug from input
    const slug = topicInput
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // Navigate to topic page
    window.location.href = `/learn/${slug}`;
  };

  const handleExampleClick = (topic: string) => {
    setTopicInput(topic);
  };

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='border-b'>
        <div className='container mx-auto px-4 py-4'>
          <nav className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <WaspRouterLink to={routes.LandingPageRoute.to} className='text-xl font-bold text-gradient-primary'>
                LearnAI
              </WaspRouterLink>
              <span className='text-muted-foreground'>/</span>
              <span className='text-foreground'>Learn</span>
            </div>
            <div className='flex items-center space-x-4'>
              <Button variant='ghost' asChild>
                <WaspRouterLink to="/home">About</WaspRouterLink>
              </Button>
              <Button variant='ghost' asChild>
                <WaspRouterLink to={routes.AccountRoute.to}>Account</WaspRouterLink>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto'>
          {/* Welcome Section */}
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-foreground mb-4'>
              What would you like to learn today?
            </h1>
            <p className='text-muted-foreground text-lg'>
              Enter any topic and get a comprehensive, AI-powered learning experience
            </p>
          </div>

          {/* Topic Input */}
          <Card className='mb-8'>
            <CardContent className='p-6'>
              <div className='relative'>
                <Textarea
                  placeholder="Describe what you want to learn about... (e.g., Machine Learning, Quantum Physics, Web Development)"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  className='min-h-[100px] text-base resize-none pr-24'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleStartLearning();
                    }
                  }}
                />
                <Button
                  onClick={handleStartLearning}
                  disabled={!topicInput.trim()}
                  className='absolute bottom-3 right-3'
                  size='sm'
                >
                  Start Learning →
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Recent Topics */}
            <Card>
              <CardHeader>
                <CardTitle>Continue Learning</CardTitle>
                <CardDescription>Pick up where you left off</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {recentTopics.map((topic) => (
                    <div key={topic.slug} className='flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors'>
                      <div className='flex-1'>
                        <h3 className='font-medium text-foreground'>{topic.title}</h3>
                        <div className='flex items-center mt-2'>
                          <div className='flex-1 bg-muted rounded-full h-2 mr-3'>
                            <div 
                              className='bg-primary h-2 rounded-full transition-all duration-300'
                              style={{ width: `${topic.progress}%` }}
                            />
                          </div>
                          <span className='text-sm text-muted-foreground'>{topic.progress}%</span>
                        </div>
                      </div>
                      <Button variant='ghost' size='sm' asChild>
                        <WaspRouterLink to={`/learn/${topic.slug}` as any}>
                          Continue
                        </WaspRouterLink>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Example Topics */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Topics</CardTitle>
                <CardDescription>Get started with these trending subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 gap-2'>
                  {exampleTopics.map((topic) => (
                    <Button
                      key={topic}
                      variant='ghost'
                      className='justify-start h-auto p-3 text-left'
                      onClick={() => handleExampleClick(topic)}
                    >
                      <div className='flex items-center'>
                        <div className='w-2 h-2 rounded-full bg-primary mr-3' />
                        {topic}
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Overview */}
          <div className='mt-12 grid grid-cols-1 md:grid-cols-3 gap-6'>
            <Card>
              <CardContent className='p-6 text-center'>
                <div className='mx-auto h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4'>
                  <svg className='h-6 w-6 text-primary' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z' />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-foreground mb-2'>AI Research</h3>
                <p className='text-sm text-muted-foreground'>
                  Comprehensive topic research with specialized AI agents
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className='p-6 text-center'>
                <div className='mx-auto h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4'>
                  <svg className='h-6 w-6 text-primary' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-foreground mb-2'>Multi-Modal Learning</h3>
                <p className='text-sm text-muted-foreground'>
                  Learn through guided content, mind maps, quizzes, and conversations
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className='p-6 text-center'>
                <div className='mx-auto h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4'>
                  <svg className='h-6 w-6 text-primary' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-foreground mb-2'>Progress Tracking</h3>
                <p className='text-sm text-muted-foreground'>
                  Track your learning journey with detailed analytics
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}