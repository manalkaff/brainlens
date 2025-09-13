import { useQuery } from 'wasp/client/operations';
import { getLearningAnalytics } from 'wasp/client/operations';
import { cn } from '../../../lib/utils';
import DefaultLayout from '../../layout/DefaultLayout';
import { useRedirectHomeUnlessUserIsAdmin } from '../../useRedirectHomeUnlessUserIsAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { BookOpen, Users, MessageSquare, Brain, TrendingUp, Crown, Clock, Target, Award } from 'lucide-react';
const LearningAnalyticsDashboard = ({ user }) => {
    useRedirectHomeUnlessUserIsAdmin({ user });
    const { data: analytics, isLoading, error } = useQuery(getLearningAnalytics);
    if (error) {
        return (<DefaultLayout user={user}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="p-8">
            <CardContent className="text-center">
              <p className="text-lg font-semibold text-destructive">Failed to load learning analytics</p>
              <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
            </CardContent>
          </Card>
        </div>
      </DefaultLayout>);
    }
    return (<DefaultLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Learning Analytics</h1>
            <p className="text-muted-foreground">
              Monitor learning platform usage and user engagement
            </p>
          </div>
        </div>

        <div className={cn('space-y-6', {
            'opacity-25': !analytics,
        })}>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground"/>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.activeUsers || 0} active this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Topics Created</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground"/>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalTopics || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.averageTopicsPerUser.toFixed(1) || 0} per user
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chat Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground"/>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalChatMessages || 0}</div>
                <p className="text-xs text-muted-foreground">
                  AI conversations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quizzes Generated</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground"/>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalQuizzes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Knowledge assessments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Analytics */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500"/>
                  Subscription Overview
                </CardTitle>
                <CardDescription>
                  User distribution across subscription plans
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Subscribed Users</span>
                  <span className="text-2xl font-bold text-green-600">
                    {analytics?.subscribedUsers || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Free Users</span>
                  <span className="text-lg font-semibold">
                    {(analytics?.totalUsers || 0) - (analytics?.subscribedUsers || 0)}
                  </span>
                </div>
                <Progress value={analytics?.totalUsers ? (analytics.subscribedUsers / analytics.totalUsers) * 100 : 0} className="h-2"/>
                <p className="text-xs text-muted-foreground">
                  {analytics?.totalUsers ?
            Math.round((analytics.subscribedUsers / analytics.totalUsers) * 100) : 0}% subscription rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500"/>
                  Monthly Growth
                </CardTitle>
                <CardDescription>
                  New users and subscriptions this month
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">
                      {analytics?.monthlyGrowth.newUsers || 0}
                    </div>
                    <div className="text-xs text-blue-800">New Users</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">
                      {analytics?.monthlyGrowth.newSubscriptions || 0}
                    </div>
                    <div className="text-xs text-green-800">New Subscriptions</div>
                  </div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">
                    {analytics?.monthlyGrowth.newTopics || 0}
                  </div>
                  <div className="text-xs text-purple-800">New Topics Created</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage by Plan */}
          {analytics?.usageByPlan && analytics.usageByPlan.length > 0 && (<Card>
              <CardHeader>
                <CardTitle>Usage by Subscription Plan</CardTitle>
                <CardDescription>
                  How different subscription tiers are being utilized
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.usageByPlan.map((plan) => (<div key={plan.plan} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={plan.plan === 'pro' ? 'default' : 'secondary'}>
                          {plan.plan.charAt(0).toUpperCase() + plan.plan.slice(1)}
                        </Badge>
                        <span className="font-medium">{plan.userCount} users</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg usage: {plan.averageUsage}
                      </div>
                    </div>))}
                </div>
              </CardContent>
            </Card>)}

          {/* Top Users */}
          {analytics?.topUsers && analytics.topUsers.length > 0 && (<Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-orange-500"/>
                  Most Active Learners
                </CardTitle>
                <CardDescription>
                  Users with the highest learning engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topUsers.slice(0, 10).map((user, index) => (<div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.email || `User ${user.id.slice(0, 8)}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.topicsCreated} topics • {Math.round(user.totalTimeSpent / 60)}m spent
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.subscriptionStatus && (<Badge variant="outline" className="text-xs">
                            {user.subscriptionStatus}
                          </Badge>)}
                        <Clock className="h-4 w-4 text-muted-foreground"/>
                      </div>
                    </div>))}
                </div>
              </CardContent>
            </Card>)}

          {/* Engagement Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500"/>
                Engagement Metrics
              </CardTitle>
              <CardDescription>
                Average learning behavior and time investment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics?.averageTopicsPerUser.toFixed(1) || 0}
                  </div>
                  <div className="text-sm text-blue-800">Topics per User</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round((analytics?.averageTimeSpentPerUser || 0) / 60)}m
                  </div>
                  <div className="text-sm text-green-800">Avg Time per User</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {analytics?.totalTopics && analytics?.totalChatMessages ?
            Math.round(analytics.totalChatMessages / analytics.totalTopics) : 0}
                  </div>
                  <div className="text-sm text-purple-800">Messages per Topic</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {!analytics && !isLoading && (<div className="absolute inset-0 flex items-start justify-center bg-background/50">
            <div className="rounded-lg bg-card p-8 shadow-lg">
              <p className="text-2xl font-bold text-foreground">No learning analytics available</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Analytics will appear here once users start using the learning platform
              </p>
            </div>
          </div>)}

        {isLoading && (<div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="rounded-lg bg-card p-8 shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground text-center">Loading analytics...</p>
            </div>
          </div>)}
      </div>
    </DefaultLayout>);
};
export default LearningAnalyticsDashboard;
//# sourceMappingURL=LearningAnalyticsDashboardPage.jsx.map