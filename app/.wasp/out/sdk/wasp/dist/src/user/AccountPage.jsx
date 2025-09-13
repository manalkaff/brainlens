import { getCustomerPortalUrl, useQuery } from 'wasp/client/operations';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { SubscriptionStatus, parsePaymentPlanId, prettyPaymentPlanName } from '../payment/plans';
import { getUserProgressStats } from 'wasp/client/operations';
import { UsageDashboard } from '../learning/components/subscription/UsageDashboard';
import { BookOpen, Brain, Clock, TrendingUp } from 'lucide-react';
export default function AccountPage({ user }) {
    const { data: learningStats, isLoading: isLoadingStats } = useQuery(getUserProgressStats);
    return (<div className='mt-10 px-6 space-y-6'>
      {/* Account Information */}
      <Card className='lg:m-8'>
        <CardHeader>
          <CardTitle className='text-base font-semibold leading-6 text-foreground'>
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='space-y-0'>
            {!!user.email && (<div className='py-4 px-6'>
                <div className='grid grid-cols-1 sm:grid-cols-3 sm:gap-4'>
                  <dt className='text-sm font-medium text-muted-foreground'>Email address</dt>
                  <dd className='mt-1 text-sm text-foreground sm:col-span-2 sm:mt-0'>{user.email}</dd>
                </div>
              </div>)}
            {!!user.username && (<>
                <Separator />
                <div className='py-4 px-6'>
                  <div className='grid grid-cols-1 sm:grid-cols-3 sm:gap-4'>
                    <dt className='text-sm font-medium text-muted-foreground'>Username</dt>
                    <dd className='mt-1 text-sm text-foreground sm:col-span-2 sm:mt-0'>{user.username}</dd>
                  </div>
                </div>
              </>)}
            <Separator />
            <div className='py-4 px-6'>
              <div className='grid grid-cols-1 sm:grid-cols-3 sm:gap-4'>
                <dt className='text-sm font-medium text-muted-foreground'>Your Plan</dt>
                <UserCurrentPaymentPlan subscriptionStatus={user.subscriptionStatus} subscriptionPlan={user.subscriptionPlan} datePaid={user.datePaid} credits={user.credits}/>
              </div>
            </div>
            <Separator />
            <div className='py-4 px-6'>
              <div className='grid grid-cols-1 sm:grid-cols-3 sm:gap-4'>
                <dt className='text-sm font-medium text-muted-foreground'>About</dt>
                <dd className='mt-1 text-sm text-foreground sm:col-span-2 sm:mt-0'>I'm a cool customer.</dd>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Progress Overview */}
      <Card className='lg:m-8'>
        <CardHeader>
          <CardTitle className='text-base font-semibold leading-6 text-foreground flex items-center gap-2'>
            <BookOpen className='h-5 w-5'/>
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingStats ? (<div className="space-y-4">
              {[1, 2, 3].map((i) => (<div key={i} className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                </div>))}
            </div>) : learningStats ? (<div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{learningStats.totalTopics}</div>
                  <div className="text-sm text-blue-800">Topics Explored</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{learningStats.completedTopics}</div>
                  <div className="text-sm text-green-800">Completed</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(learningStats.totalTimeSpent / 60)}m
                  </div>
                  <div className="text-sm text-purple-800">Time Spent</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {learningStats.completionPercentage}%
                  </div>
                  <div className="text-sm text-orange-800">Completion</div>
                </div>
              </div>

              {/* Recent Activity */}
              {learningStats.recentActivity.length > 0 && (<div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4"/>
                    Recent Activity
                  </h4>
                  <div className="space-y-2">
                    {learningStats.recentActivity.slice(0, 3).map((activity) => (<div key={activity.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground"/>
                          <span className="text-sm font-medium">{activity.topic.title}</span>
                          {activity.completed && (<span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Completed
                            </span>)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(activity.timeSpent / 60)}m
                        </span>
                      </div>))}
                  </div>
                  <div className="mt-3">
                    <WaspRouterLink to="/learn" className="text-sm text-primary hover:text-primary/80 transition-colors duration-200">
                      View all learning topics →
                    </WaspRouterLink>
                  </div>
                </div>)}
            </div>) : (<div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
              <p className="text-muted-foreground mb-4">Start your learning journey!</p>
              <WaspRouterLink to="/learn" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors duration-200">
                <TrendingUp className="h-4 w-4"/>
                Explore Topics
              </WaspRouterLink>
            </div>)}
        </CardContent>
      </Card>

      {/* Usage Dashboard */}
      <Card className='lg:m-8'>
        <CardHeader>
          <CardTitle className='text-base font-semibold leading-6 text-foreground flex items-center gap-2'>
            <Brain className='h-5 w-5'/>
            Usage & Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UsageDashboard compact={false} showRecommendations={true}/>
        </CardContent>
      </Card>
    </div>);
}
function UserCurrentPaymentPlan({ subscriptionPlan, subscriptionStatus, datePaid, credits, }) {
    if (subscriptionStatus && subscriptionPlan && datePaid) {
        return (<>
        <dd className='mt-1 text-sm text-foreground sm:col-span-1 sm:mt-0'>
          {getUserSubscriptionStatusDescription({ subscriptionPlan, subscriptionStatus, datePaid })}
        </dd>
        {subscriptionStatus !== SubscriptionStatus.Deleted ? <CustomerPortalButton /> : <BuyMoreButton />}
      </>);
    }
    return (<>
      <dd className='mt-1 text-sm text-foreground sm:col-span-1 sm:mt-0'>Credits remaining: {credits}</dd>
      <BuyMoreButton />
    </>);
}
function getUserSubscriptionStatusDescription({ subscriptionPlan, subscriptionStatus, datePaid, }) {
    const planName = prettyPaymentPlanName(parsePaymentPlanId(subscriptionPlan));
    const endOfBillingPeriod = prettyPrintEndOfBillingPeriod(datePaid);
    return prettyPrintStatus(planName, subscriptionStatus, endOfBillingPeriod);
}
function prettyPrintStatus(planName, subscriptionStatus, endOfBillingPeriod) {
    const statusToMessage = {
        active: `${planName}`,
        past_due: `Payment for your ${planName} plan is past due! Please update your subscription payment information.`,
        cancel_at_period_end: `Your ${planName} plan subscription has been canceled, but remains active until the end of the current billing period${endOfBillingPeriod}`,
        deleted: `Your previous subscription has been canceled and is no longer active.`,
    };
    if (Object.keys(statusToMessage).includes(subscriptionStatus)) {
        return statusToMessage[subscriptionStatus];
    }
    else {
        throw new Error(`Invalid subscriptionStatus: ${subscriptionStatus}`);
    }
}
function prettyPrintEndOfBillingPeriod(date) {
    const oneMonthFromNow = new Date(date);
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    return ': ' + oneMonthFromNow.toLocaleDateString();
}
function BuyMoreButton() {
    return (<div className='ml-4 flex-shrink-0 sm:col-span-1 sm:mt-0'>
      <WaspRouterLink to={routes.PricingPageRoute.to} className='font-medium text-sm text-primary hover:text-primary/80 transition-colors duration-200'>
        Buy More/Upgrade
      </WaspRouterLink>
    </div>);
}
function CustomerPortalButton() {
    const { data: customerPortalUrl, isLoading: isCustomerPortalUrlLoading, error: customerPortalUrlError, } = useQuery(getCustomerPortalUrl);
    const handleClick = () => {
        if (customerPortalUrlError) {
            console.error('Error fetching customer portal url');
        }
        if (customerPortalUrl) {
            window.open(customerPortalUrl, '_blank');
        }
        else {
            console.error('Customer portal URL is not available');
        }
    };
    return (<div className='ml-4 flex-shrink-0 sm:col-span-1 sm:mt-0'>
      <Button onClick={handleClick} disabled={isCustomerPortalUrlLoading} variant='outline' size='sm' className='font-medium text-sm'>
        Manage Subscription
      </Button>
    </div>);
}
//# sourceMappingURL=AccountPage.jsx.map