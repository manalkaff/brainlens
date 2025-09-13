import React from 'react';
import { useQuery } from 'wasp/client/operations';
import { getUserUsageStats, getUpgradeRecommendation } from 'wasp/client/operations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Link } from 'wasp/client/router';
import { 
  CreditCard, 
  BookOpen, 
  MessageSquare, 
  Brain, 
  TrendingUp, 
  Clock,
  Crown,
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface UsageDashboardProps {
  compact?: boolean;
  showRecommendations?: boolean;
}

export function UsageDashboard({ 
  compact = false, 
  showRecommendations = true 
}: UsageDashboardProps) {
  const { 
    data: usageStats, 
    isLoading: isLoadingUsage, 
    error: usageError 
  } = useQuery(getUserUsageStats);

  const { 
    data: recommendation, 
    isLoading: isLoadingRecommendation 
  } = useQuery(getUpgradeRecommendation, undefined, {
    enabled: showRecommendations
  });

  if (isLoadingUsage) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (usageError || !usageStats) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load usage statistics. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const getStatusColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-orange-600';
    return 'text-green-600';
  };

  const getProgressColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const usageItems = [
    {
      label: 'Topics Researched',
      current: usageStats.topicsThisMonth,
      limit: usageStats.limits.topicsPerMonth,
      icon: BookOpen,
      period: 'this month',
      description: 'New learning topics created'
    },
    {
      label: 'AI Chat Messages',
      current: usageStats.chatMessagesToday,
      limit: usageStats.limits.chatMessagesPerDay,
      icon: MessageSquare,
      period: 'today',
      description: 'Questions asked to AI assistant'
    },
    {
      label: 'Quizzes Generated',
      current: usageStats.quizzesThisWeek,
      limit: usageStats.limits.quizzesPerWeek,
      icon: Brain,
      period: 'this week',
      description: 'Knowledge assessments created'
    }
  ];

  const formatResetDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {usageItems.map((item) => {
          const percentage = (item.current / item.limit) * 100;
          const ItemIcon = item.icon;
          
          return (
            <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <ItemIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${getStatusColor(item.current, item.limit)}`}>
                  {item.current}/{item.limit}
                </span>
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${getProgressColor(item.current, item.limit)}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {usageStats.subscriptionInfo.isSubscribed ? (
                  <Crown className="h-5 w-5 text-yellow-500" />
                ) : (
                  <CreditCard className="h-5 w-5 text-gray-500" />
                )}
                {usageStats.subscriptionInfo.isSubscribed 
                  ? `${usageStats.subscriptionInfo.plan?.charAt(0).toUpperCase()}${usageStats.subscriptionInfo.plan?.slice(1)} Plan`
                  : 'Free Plan'
                }
              </CardTitle>
              <CardDescription>
                {usageStats.subscriptionInfo.isSubscribed 
                  ? 'You have access to premium learning features'
                  : 'Upgrade to unlock unlimited learning potential'
                }
              </CardDescription>
            </div>
            <Badge variant={usageStats.subscriptionInfo.isSubscribed ? 'default' : 'secondary'}>
              {usageStats.subscriptionInfo.status || 'Free'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Usage Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        {usageItems.map((item) => {
          const percentage = (item.current / item.limit) * 100;
          const ItemIcon = item.icon;
          const isNearLimit = percentage >= 80;
          
          return (
            <Card key={item.label} className={isNearLimit ? 'border-orange-200 bg-orange-50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ItemIcon className={`h-4 w-4 ${isNearLimit ? 'text-orange-600' : 'text-muted-foreground'}`} />
                    <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                  </div>
                  {isNearLimit && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                </div>
                <CardDescription className="text-xs">{item.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getStatusColor(item.current, item.limit)}`}>
                    {item.current}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    of {item.limit} {item.period}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className={`h-2 ${isNearLimit ? '[&>div]:bg-orange-500' : ''}`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{Math.round(percentage)}% used</span>
                    <span>{item.limit - item.current} remaining</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reset Information */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Usage Resets</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {formatResetDate(usageStats.lastResetDate)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Recommendation */}
      {showRecommendations && recommendation && recommendation.shouldUpgrade && (
        <Alert className="border-blue-200 bg-blue-50">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <p className="font-medium">Upgrade Recommended</p>
              <p className="text-sm">{recommendation.reason}</p>
              {recommendation.savings && (
                <p className="text-xs">
                  Save up to ${recommendation.savings}/month compared to buying credits
                </p>
              )}
              <Button asChild size="sm" className="mt-2">
                <Link to="/pricing">
                  <Crown className="h-3 w-3 mr-1" />
                  Upgrade to {recommendation.recommendedPlan}
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/pricing">
            <CreditCard className="h-4 w-4 mr-2" />
            View Plans
          </Link>
        </Button>
        
        {!usageStats.subscriptionInfo.isSubscribed && (
          <Button asChild size="sm">
            <Link to="/pricing">
              <Zap className="h-4 w-4 mr-2" />
              Upgrade Now
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}