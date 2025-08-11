import { useParams } from 'react-router-dom';
import { useAuth } from 'wasp/client/auth';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function TopicPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: user } = useAuth();

  // Convert slug back to readable title
  const topicTitle = slug
    ? slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Unknown Topic';

  return (
    <div className='min-h-screen bg-background'>
      {/* Header with Breadcrumb */}
      <header className='border-b'>
        <div className='container mx-auto px-4 py-4'>
          <nav className='flex items-center justify-between'>
            <div className='flex items-center space-x-2 text-sm'>
              <WaspRouterLink 
                to={routes.LandingPageRoute.to} 
                className='text-xl font-bold text-gradient-primary'
              >
                LearnAI
              </WaspRouterLink>
              <span className='text-muted-foreground'>/</span>
              <WaspRouterLink 
                to="/learn" 
                className='text-muted-foreground hover:text-foreground transition-colors'
              >
                Learn
              </WaspRouterLink>
              <span className='text-muted-foreground'>/</span>
              <span className='text-foreground font-medium'>{topicTitle}</span>
            </div>
            <div className='flex items-center space-x-4'>
              <Button variant='ghost' asChild>
                <WaspRouterLink to="/learn">← Back to Search</WaspRouterLink>
              </Button>
              <Button variant='ghost' asChild>
                <WaspRouterLink to={routes.AccountRoute.to}>Account</WaspRouterLink>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main className='container mx-auto px-4 py-8'>
        <div className='max-w-6xl mx-auto'>
          {/* Topic Header */}
          <div className='mb-8'>
            <h1 className='text-4xl font-bold text-foreground mb-4'>{topicTitle}</h1>
            <p className='text-lg text-muted-foreground'>
              AI-powered comprehensive learning experience
            </p>
          </div>

          {/* Research Status */}
          <Card className='mb-8'>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2'></div>
                Researching Topic
              </CardTitle>
              <CardDescription>
                Our AI agents are researching and organizing content for your learning experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex items-center text-sm'>
                  <div className='w-2 h-2 rounded-full bg-primary mr-3'></div>
                  Analyzing topic scope and complexity
                </div>
                <div className='flex items-center text-sm text-muted-foreground'>
                  <div className='w-2 h-2 rounded-full bg-muted mr-3'></div>
                  Gathering information from multiple sources
                </div>
                <div className='flex items-center text-sm text-muted-foreground'>
                  <div className='w-2 h-2 rounded-full bg-muted mr-3'></div>
                  Creating structured learning path
                </div>
                <div className='flex items-center text-sm text-muted-foreground'>
                  <div className='w-2 h-2 rounded-full bg-muted mr-3'></div>
                  Generating interactive content
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coming Soon - Learning Tabs */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <Card className='opacity-50'>
              <CardHeader>
                <CardTitle className='text-lg'>Learn Tab</CardTitle>
                <CardDescription>Guided, personalized learning experience</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground mb-4'>
                  Interactive learning with knowledge assessment and adaptive content
                </p>
                <Button disabled size='sm' className='w-full'>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className='opacity-50'>
              <CardHeader>
                <CardTitle className='text-lg'>Explore Tab</CardTitle>
                <CardDescription>Tree navigation and structured content</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground mb-4'>
                  Browse through hierarchical topic structure with rich content
                </p>
                <Button disabled size='sm' className='w-full'>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className='opacity-50'>
              <CardHeader>
                <CardTitle className='text-lg'>Ask Tab</CardTitle>
                <CardDescription>Conversational learning with AI</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground mb-4'>
                  Ask questions and get contextual answers about the topic
                </p>
                <Button disabled size='sm' className='w-full'>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className='opacity-50'>
              <CardHeader>
                <CardTitle className='text-lg'>MindMap Tab</CardTitle>
                <CardDescription>Visual knowledge representation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground mb-4'>
                  Interactive mind map showing topic relationships
                </p>
                <Button disabled size='sm' className='w-full'>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className='opacity-50'>
              <CardHeader>
                <CardTitle className='text-lg'>Quiz Tab</CardTitle>
                <CardDescription>Adaptive assessment system</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground mb-4'>
                  Test your knowledge with AI-generated quizzes
                </p>
                <Button disabled size='sm' className='w-full'>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className='border-primary/50'>
              <CardHeader>
                <CardTitle className='text-lg'>Progress</CardTitle>
                <CardDescription>Track your learning journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex justify-between text-sm'>
                    <span>Overall Progress</span>
                    <span>0%</span>
                  </div>
                  <div className='w-full bg-muted rounded-full h-2'>
                    <div className='bg-primary h-2 rounded-full w-0 transition-all duration-300'></div>
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Start learning to track your progress
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Temporary Message */}
          <Card className='mt-8 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'>
            <CardContent className='p-6'>
              <div className='flex items-start'>
                <svg className='h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' />
                </svg>
                <div>
                  <h3 className='text-sm font-medium text-amber-800 dark:text-amber-200'>
                    Development in Progress
                  </h3>
                  <p className='text-sm text-amber-700 dark:text-amber-300 mt-1'>
                    This is a placeholder page. The full learning experience with AI research, 
                    content generation, and interactive tabs will be implemented in upcoming tasks.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}