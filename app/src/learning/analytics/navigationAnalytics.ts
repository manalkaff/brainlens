// Navigation analytics tracking for subtopic navigation
interface NavigationEvent {
  event: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  data: Record<string, any>;
}

interface SubtopicNavigationData {
  fromTopic: string;
  toSubtopic: string;
  subtopicTitle: string;
  navigationDepth: number;
  navigationSource: 'sidebar' | 'cards' | 'breadcrumb' | 'url';
  timestamp: string;
}

interface ContentGenerationData {
  topicId: string;
  topicTitle: string;
  generationTrigger: 'manual' | 'automatic';
  generationTime?: number;
  success: boolean;
  errorMessage?: string;
}

interface LoadingStateData {
  topicId: string;
  loadingType: 'navigation' | 'content_generation' | 'subtopic_expansion';
  duration: number;
  success: boolean;
}

class NavigationAnalytics {
  private events: NavigationEvent[] = [];
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadUserId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadUserId(): void {
    // In a real app, this would get the user ID from auth context
    // For now, we'll use a stored session user ID or generate one
    const storedUserId = localStorage.getItem('analytics_user_id');
    if (storedUserId) {
      this.userId = storedUserId;
    } else {
      this.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('analytics_user_id', this.userId);
    }
  }

  private trackEvent(event: string, data: Record<string, any>): void {
    const analyticsEvent: NavigationEvent = {
      event,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
      data
    };

    this.events.push(analyticsEvent);
    
    // Keep only last 1000 events to prevent memory issues
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Navigation Analytics:', analyticsEvent);
    }

    // In production, you would send this to your analytics service
    this.sendToAnalyticsService(analyticsEvent);
  }

  private async sendToAnalyticsService(event: NavigationEvent): Promise<void> {
    try {
      // In a real implementation, you would send to your analytics service
      // For now, we'll just store in localStorage for debugging
      const storedEvents = JSON.parse(localStorage.getItem('navigation_analytics') || '[]');
      storedEvents.push(event);
      
      // Keep only last 100 events in localStorage
      const recentEvents = storedEvents.slice(-100);
      localStorage.setItem('navigation_analytics', JSON.stringify(recentEvents));
      
      // Example of sending to a real analytics service:
      // await fetch('/api/analytics/track', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  // Track subtopic navigation via cards
  trackSubtopicCardClick(data: SubtopicNavigationData): void {
    this.trackEvent('subtopic_card_clicked', {
      ...data,
      navigationSource: 'cards'
    });
  }

  // Track subtopic navigation via sidebar
  trackSubtopicSidebarClick(data: SubtopicNavigationData): void {
    this.trackEvent('subtopic_sidebar_clicked', {
      ...data,
      navigationSource: 'sidebar'
    });
  }

  // Track breadcrumb navigation
  trackBreadcrumbClick(data: SubtopicNavigationData): void {
    this.trackEvent('breadcrumb_clicked', {
      ...data,
      navigationSource: 'breadcrumb'
    });
  }

  // Track content generation events
  trackContentGeneration(data: ContentGenerationData): void {
    this.trackEvent('content_generation', data);
  }

  // Track loading states
  trackLoadingState(data: LoadingStateData): void {
    this.trackEvent('loading_state', data);
  }

  // Track user engagement patterns
  trackTimeSpent(topicId: string, timeSpent: number): void {
    this.trackEvent('time_spent', {
      topicId,
      timeSpent,
      timestamp: new Date().toISOString()
    });
  }

  // Track search and filter usage
  trackSearch(query: string, resultsCount: number): void {
    this.trackEvent('topic_search', {
      query,
      resultsCount,
      timestamp: new Date().toISOString()
    });
  }

  // Track error events
  trackError(error: string, context: Record<string, any>): void {
    this.trackEvent('navigation_error', {
      error,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // Get analytics summary for debugging
  getAnalyticsSummary(): {
    totalEvents: number;
    eventTypes: Record<string, number>;
    recentEvents: NavigationEvent[];
  } {
    const eventTypes: Record<string, number> = {};
    
    this.events.forEach(event => {
      eventTypes[event.event] = (eventTypes[event.event] || 0) + 1;
    });

    return {
      totalEvents: this.events.length,
      eventTypes,
      recentEvents: this.events.slice(-10)
    };
  }

  // Clear analytics data (useful for testing)
  clearAnalytics(): void {
    this.events = [];
    localStorage.removeItem('navigation_analytics');
  }
}

// Create singleton instance
export const navigationAnalytics = new NavigationAnalytics();

// Export types for use in components
export type {
  NavigationEvent,
  SubtopicNavigationData,
  ContentGenerationData,
  LoadingStateData
};

// Hook for using analytics in React components
export function useNavigationAnalytics() {
  return {
    trackSubtopicCardClick: (data: SubtopicNavigationData) => 
      navigationAnalytics.trackSubtopicCardClick(data),
    
    trackSubtopicSidebarClick: (data: SubtopicNavigationData) => 
      navigationAnalytics.trackSubtopicSidebarClick(data),
    
    trackBreadcrumbClick: (data: SubtopicNavigationData) => 
      navigationAnalytics.trackBreadcrumbClick(data),
    
    trackContentGeneration: (data: ContentGenerationData) => 
      navigationAnalytics.trackContentGeneration(data),
    
    trackLoadingState: (data: LoadingStateData) => 
      navigationAnalytics.trackLoadingState(data),
    
    trackTimeSpent: (topicId: string, timeSpent: number) => 
      navigationAnalytics.trackTimeSpent(topicId, timeSpent),
    
    trackSearch: (query: string, resultsCount: number) => 
      navigationAnalytics.trackSearch(query, resultsCount),
    
    trackError: (error: string, context: Record<string, any>) => 
      navigationAnalytics.trackError(error, context),
    
    getAnalyticsSummary: () => navigationAnalytics.getAnalyticsSummary(),
    
    clearAnalytics: () => navigationAnalytics.clearAnalytics()
  };
}