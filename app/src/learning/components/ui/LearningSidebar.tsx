import React from 'react';
import { useAuth } from 'wasp/client/auth';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { useQuery, getUserProgressStats } from 'wasp/client/operations';
import useColorMode from '../../../client/hooks/useColorMode';
import { 
  BookOpen, 
  Brain, 
  History, 
  Plus, 
  Settings, 
  User, 
  LogOut, 
  Search,
  Trophy,
  Clock,
  MoreHorizontal,
  Moon,
  Sun
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarSeparator,
  useSidebar,
} from '../../../components/ui/sidebar';

interface LearningSidebarProps {
  currentPath?: string;
}

function LearningSidebarContent({ currentPath }: LearningSidebarProps) {
  const { data: user } = useAuth();
  const { data: progressStats, isLoading } = useQuery(getUserProgressStats);
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Quick stats component
  const QuickStats = () => {
    if (isLoading || !progressStats) {
      return (
        <div className="px-2 py-3">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-2 bg-muted rounded w-full" />
          </div>
        </div>
      );
    }

    return (
      <div className="px-2 py-3 bg-sidebar-accent/50 rounded-lg mx-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-sidebar-foreground">Learning Progress</span>
          <Trophy className="h-4 w-4 text-yellow-500" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-sidebar-foreground/70">
            <span>{progressStats?.completedTopics || 0} of {progressStats?.totalTopics || 0} topics</span>
            <span>{Math.round(progressStats?.completionPercentage || 0)}%</span>
          </div>
          <Progress 
            value={progressStats?.completionPercentage || 0} 
            className="h-2" 
          />
          <div className="flex items-center gap-3 text-xs text-sidebar-foreground/70">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{Math.round((progressStats?.totalTimeSpent || 0) / 60)}h</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              <span>{progressStats?.topicsInProgress || 0} active</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Topic history component
  const TopicHistory = () => {
    if (isLoading || !progressStats?.recentActivity) {
      return (
        <SidebarGroup>
          <SidebarGroupLabel>Recent Topics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[1, 2, 3].map((i) => (
                <SidebarMenuItem key={i}>
                  <div className="animate-pulse flex items-center gap-2 p-2">
                    <div className="h-4 w-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded flex-1" />
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      );
    }

    return (
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center gap-2">
          <History className="h-4 w-4" />
          Recent Topics
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {(progressStats?.recentActivity || []).slice(0, 8).map((activity) => {
              const isCurrentTopic = currentPath === `/learn/${activity.topic.slug}`;
              const progressPercentage = activity.completed ? 100 : 
                (activity.timeSpent > 0 ? Math.min(activity.timeSpent / 30, 80) : 0); // Rough estimation
              
              return (
                <SidebarMenuItem key={activity.topic.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isCurrentTopic}
                    tooltip={`${activity.topic.title} - ${Math.round(progressPercentage)}% complete`}
                  >
                    <WaspRouterLink to={`/learn/${activity.topic.slug}` as any}>
                      <div className={cn(
                        'w-2 h-2 rounded-full mr-2',
                        activity.completed 
                          ? 'bg-green-500' 
                          : progressPercentage > 0 
                            ? 'bg-yellow-500' 
                            : 'bg-muted-foreground'
                      )} />
                      <span className="flex-1 truncate">{activity.topic.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(progressPercentage)}%
                      </Badge>
                    </WaspRouterLink>
                  </SidebarMenuButton>
                  <SidebarMenuAction showOnHover>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem asChild>
                          <WaspRouterLink to={`/learn/${activity.topic.slug}` as any}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Open Topic
                          </WaspRouterLink>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <span className="text-xs text-muted-foreground">
                            Last accessed: {activity.lastAccessed ? new Date(activity.lastAccessed).toLocaleDateString() : 'Never'}
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuAction>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  // User menu component
  const UserMenu = () => {
    const [colorMode, setColorMode] = useColorMode();
    
    const toggleDarkMode = () => {
      if (typeof setColorMode === 'function') {
        setColorMode(colorMode === 'light' ? 'dark' : 'light');
      }
    };
    
    return (
      <div className="flex items-center gap-2 p-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={undefined} />
          <AvatarFallback className="text-xs">{getUserInitials()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-sidebar-foreground truncate">
            {user?.email?.split('@')[0] || 'User'}
          </p>
          <p className="text-xs text-sidebar-foreground/70 truncate">
            {user?.email}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <WaspRouterLink to={routes.AccountRoute.to}>
                <User className="h-4 w-4 mr-2" />
                Account Settings
              </WaspRouterLink>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleDarkMode}>
              {colorMode === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 mr-2" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-2" />
                  Dark Mode
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = '/api/auth/logout'}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1">
          <Brain className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg text-primary">BrainLens</span>
        </div>
        <div className="px-2 pb-2">
          <Button asChild className="w-full" size="sm">
            <WaspRouterLink to="/learn">
              <Plus className="h-4 w-4 mr-2" />
              New Topic
            </WaspRouterLink>
          </Button>
        </div>
        <QuickStats />
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="gap-0">

        {/* Recent Topics */}
        <TopicHistory />
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border">
        <UserMenu />
      </SidebarFooter>
    </>
  );
}

export function LearningSidebar({ currentPath }: LearningSidebarProps) {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <LearningSidebarContent currentPath={currentPath} />
    </Sidebar>
  );
}