import React from 'react';
import { Link } from 'wasp/client/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { CreditCard, Zap, Clock, MessageSquare, Brain, BookOpen, Crown, TrendingUp } from 'lucide-react';
const operationIcons = {
    TOPIC_RESEARCH: BookOpen,
    AI_CHAT_MESSAGE: MessageSquare,
    QUIZ_GENERATION: Brain,
    CONTENT_GENERATION: Zap,
};
const operationNames = {
    TOPIC_RESEARCH: 'Topic Research',
    AI_CHAT_MESSAGE: 'AI Chat',
    QUIZ_GENERATION: 'Quiz Generation',
    CONTENT_GENERATION: 'Content Generation',
};
export function UpgradePrompt({ reason, operation, currentCredits = 0, requiredCredits = 0, resetDate, isSubscribed = false, subscriptionPlan, usageStats, onClose }) {
    const OperationIcon = operationIcons[operation] || Zap;
    const operationName = operationNames[operation] || operation;
    const formatResetTime = (date) => {
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
        }
        else {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
        }
    };
    const getUsageProgress = () => {
        if (!usageStats)
            return null;
        const progressItems = [
            {
                label: 'Topics this month',
                current: usageStats.topicsThisMonth,
                limit: usageStats.limits.topicsPerMonth,
                icon: BookOpen
            },
            {
                label: 'Chat messages today',
                current: usageStats.chatMessagesToday,
                limit: usageStats.limits.chatMessagesPerDay,
                icon: MessageSquare
            },
            {
                label: 'Quizzes this week',
                current: usageStats.quizzesThisWeek,
                limit: usageStats.limits.quizzesPerWeek,
                icon: Brain
            }
        ];
        return progressItems.map((item) => {
            const percentage = (item.current / item.limit) * 100;
            const ItemIcon = item.icon;
            return (<div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <ItemIcon className="h-4 w-4 text-muted-foreground"/>
              <span>{item.label}</span>
            </div>
            <span className="font-medium">
              {item.current}/{item.limit}
            </span>
          </div>
          <Progress value={Math.min(percentage, 100)} className={`h-2 ${percentage >= 100 ? 'bg-red-100' : ''}`}/>
        </div>);
        });
    };
    if (reason === 'credits') {
        return (<Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-orange-600"/>
            </div>
            <div>
              <CardTitle className="text-lg text-orange-900">
                Insufficient Credits
              </CardTitle>
              <CardDescription className="text-orange-700">
                You need {requiredCredits} credits for {operationName}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-center gap-2">
              <OperationIcon className="h-4 w-4 text-muted-foreground"/>
              <span className="font-medium">{operationName}</span>
            </div>
            <Badge variant="secondary">{requiredCredits} credits</Badge>
          </div>

          <div className="p-3 bg-white rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current balance</span>
              <span className="font-medium">{currentCredits} credits</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link to="/pricing">
                <CreditCard className="h-4 w-4 mr-2"/>
                Buy Credits
              </Link>
            </Button>
            
            {!isSubscribed && (<Button asChild variant="outline" className="flex-1">
                <Link to="/pricing">
                  <Crown className="h-4 w-4 mr-2"/>
                  Upgrade Plan
                </Link>
              </Button>)}
          </div>

          {onClose && (<Button variant="ghost" onClick={onClose} className="w-full">
              Cancel
            </Button>)}
        </CardContent>
      </Card>);
    }
    // Feature limit reached
    return (<Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="h-5 w-5 text-blue-600"/>
          </div>
          <div>
            <CardTitle className="text-lg text-blue-900">
              {isSubscribed ? 'Plan Limit Reached' : 'Free Tier Limit Reached'}
            </CardTitle>
            <CardDescription className="text-blue-700">
              You've reached your {subscriptionPlan || 'free'} plan limit for {operationName}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {usageStats && (<div className="space-y-3">
            <h4 className="font-medium text-sm text-blue-900">Current Usage</h4>
            {getUsageProgress()}
          </div>)}

        {resetDate && (<div className="p-3 bg-white rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Resets in</span>
              <span className="font-medium">{formatResetTime(resetDate)}</span>
            </div>
          </div>)}

        <div className="space-y-2">
          {!isSubscribed ? (<>
              <Button asChild className="w-full">
                <Link to="/pricing">
                  <Crown className="h-4 w-4 mr-2"/>
                  Upgrade to Hobby Plan
                </Link>
              </Button>
              <p className="text-xs text-center text-blue-600">
                Get 3x more usage + priority support
              </p>
            </>) : subscriptionPlan === 'hobby' ? (<>
              <Button asChild className="w-full">
                <Link to="/pricing">
                  <TrendingUp className="h-4 w-4 mr-2"/>
                  Upgrade to Pro Plan
                </Link>
              </Button>
              <p className="text-xs text-center text-blue-600">
                Unlimited learning features + advanced AI
              </p>
            </>) : (<div className="text-center p-3 bg-white rounded-lg border">
              <p className="text-sm text-muted-foreground">
                You're on the Pro plan. Limits reset {resetDate ? `in ${formatResetTime(resetDate)}` : 'soon'}.
              </p>
            </div>)}
        </div>

        {onClose && (<Button variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>)}
      </CardContent>
    </Card>);
}
// Hook to use upgrade prompts
export function useUpgradePrompt() {
    const [upgradePrompt, setUpgradePrompt] = React.useState({
        show: false,
        props: {}
    });
    const showUpgradePrompt = (props) => {
        setUpgradePrompt({
            show: true,
            props: {
                ...props,
                onClose: () => setUpgradePrompt(prev => ({ ...prev, show: false }))
            }
        });
    };
    const hideUpgradePrompt = () => {
        setUpgradePrompt(prev => ({ ...prev, show: false }));
    };
    return {
        upgradePrompt,
        showUpgradePrompt,
        hideUpgradePrompt
    };
}
//# sourceMappingURL=UpgradePrompt.jsx.map