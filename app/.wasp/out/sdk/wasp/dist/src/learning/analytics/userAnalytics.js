/**
 * User Analytics for BrainLens
 * Tracks user behavior, learning patterns, and engagement metrics
 */
export class UserAnalytics {
    sessions = new Map();
    actions = [];
    currentSession = null;
    userId = null;
    STORAGE_KEY = 'brainlens_user_analytics';
    SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    MAX_ACTIONS_HISTORY = 5000;
    constructor() {
        this.loadPersistedData();
        this.startSessionTracking();
    }
    /**
     * Set user ID for analytics tracking
     */
    setUserId(userId) {
        this.userId = userId;
        this.persistData();
    }
    /**
     * Start a new learning session
     */
    startSession(topicId) {
        if (!this.userId)
            return '';
        // End current session if exists
        if (this.currentSession) {
            this.endSession();
        }
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const session = {
            id: sessionId,
            userId: this.userId,
            topicId,
            startTime: new Date(),
            duration: 0,
            tabsVisited: [],
            actionsPerformed: [],
            completionStatus: 'paused'
        };
        this.currentSession = session;
        this.sessions.set(sessionId, session);
        this.persistData();
        console.log(`[Analytics] Started session ${sessionId} for topic ${topicId}`);
        return sessionId;
    }
    /**
     * End current session
     */
    endSession(status = 'completed') {
        if (!this.currentSession)
            return;
        this.currentSession.endTime = new Date();
        this.currentSession.duration = this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime();
        this.currentSession.completionStatus = status;
        console.log(`[Analytics] Ended session ${this.currentSession.id} (${status})`);
        this.currentSession = null;
        this.persistData();
    }
    /**
     * Track user action
     */
    trackAction(type, action, context = {}, duration) {
        const userAction = {
            id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            action,
            timestamp: new Date(),
            context,
            duration
        };
        this.actions.push(userAction);
        // Add to current session
        if (this.currentSession) {
            this.currentSession.actionsPerformed.push(userAction);
            // Track tab visits
            if (context.tabId && !this.currentSession.tabsVisited.includes(context.tabId)) {
                this.currentSession.tabsVisited.push(context.tabId);
            }
        }
        // Cleanup old actions
        if (this.actions.length > this.MAX_ACTIONS_HISTORY) {
            this.actions = this.actions.slice(-this.MAX_ACTIONS_HISTORY);
        }
        this.persistData();
    }
    /**
     * Track tab navigation
     */
    trackTabNavigation(fromTab, toTab, topicId) {
        this.trackAction('navigation', 'tab_change', {
            topicId,
            tabId: toTab,
            data: { fromTab, toTab }
        });
    }
    /**
     * Track content interaction
     */
    trackContentInteraction(action, topicId, data) {
        this.trackAction('content', action, { topicId, data });
    }
    /**
     * Track chat interaction
     */
    trackChatInteraction(action, data) {
        const startTime = Date.now();
        this.trackAction('chat', action, {
            topicId: this.currentSession?.topicId,
            data
        });
        // Track response time for AI responses
        if (action === 'message_sent') {
            return () => {
                const responseTime = Date.now() - startTime;
                this.trackAction('chat', 'response_time', {
                    topicId: this.currentSession?.topicId,
                    data: { responseTime }
                }, responseTime);
            };
        }
    }
    /**
     * Track mindmap interaction
     */
    trackMindmapInteraction(action, nodeId, data) {
        this.trackAction('mindmap', action, {
            topicId: this.currentSession?.topicId,
            elementId: nodeId,
            data
        });
    }
    /**
     * Track export action
     */
    trackExport(format, topicId, success, duration) {
        this.trackAction('export', `export_${format}`, {
            topicId,
            data: { format, success }
        }, duration);
    }
    /**
     * Track bookmark action
     */
    trackBookmark(action, topicId, sectionId) {
        this.trackAction('bookmark', `bookmark_${action}`, {
            topicId,
            elementId: sectionId
        });
    }
    /**
     * Get learning patterns for user
     */
    getLearningPatterns() {
        const userActions = this.actions.filter(a => this.currentSession?.userId === this.userId);
        const userSessions = Array.from(this.sessions.values()).filter(s => s.userId === this.userId);
        // Calculate preferred tabs
        const tabUsage = new Map();
        userActions
            .filter(a => a.type === 'navigation' && a.context.tabId)
            .forEach(a => {
            const tabId = a.context.tabId;
            const existing = tabUsage.get(tabId) || { count: 0, totalTime: 0 };
            tabUsage.set(tabId, {
                count: existing.count + 1,
                totalTime: existing.totalTime + (a.duration || 0)
            });
        });
        const preferredTabs = Array.from(tabUsage.entries()).map(([tab, data]) => ({
            tab,
            usage: data.count,
            avgTime: data.count > 0 ? data.totalTime / data.count : 0
        })).sort((a, b) => b.usage - a.usage);
        // Calculate peak learning hours
        const hourCounts = new Array(24).fill(0);
        userSessions.forEach(session => {
            const hour = session.startTime.getHours();
            hourCounts[hour]++;
        });
        const peakLearningHours = hourCounts
            .map((count, hour) => ({ hour, count }))
            .filter(h => h.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .map(h => h.hour);
        // Calculate other metrics
        const averageSessionDuration = userSessions.length > 0
            ? userSessions.reduce((sum, s) => sum + s.duration, 0) / userSessions.length
            : 0;
        const topicsCompleted = userSessions.filter(s => s.completionStatus === 'completed').length;
        const bookmarkUsage = userActions.filter(a => a.type === 'bookmark').length;
        const exportUsage = userActions.filter(a => a.type === 'export').length;
        const chatEngagement = userActions.filter(a => a.type === 'chat').length;
        const mindmapInteractions = userActions.filter(a => a.type === 'mindmap').length;
        return {
            preferredTabs,
            peakLearningHours,
            averageSessionDuration,
            topicsCompleted,
            bookmarkUsage,
            exportUsage,
            chatEngagement,
            mindmapInteractions
        };
    }
    /**
     * Get engagement metrics
     */
    getEngagementMetrics() {
        const userSessions = Array.from(this.sessions.values()).filter(s => s.userId === this.userId);
        if (userSessions.length === 0) {
            return {
                totalSessions: 0,
                totalLearningTime: 0,
                averageSessionDuration: 0,
                bounceRate: 0,
                completionRate: 0,
                retentionRate: 0,
                activeStreak: 0,
                lastActiveDate: new Date()
            };
        }
        const totalSessions = userSessions.length;
        const totalLearningTime = userSessions.reduce((sum, s) => sum + s.duration, 0);
        const averageSessionDuration = totalLearningTime / totalSessions;
        const completedSessions = userSessions.filter(s => s.completionStatus === 'completed').length;
        const abandonedSessions = userSessions.filter(s => s.completionStatus === 'abandoned').length;
        const shortSessions = userSessions.filter(s => s.duration < 30000).length; // Less than 30 seconds
        const bounceRate = totalSessions > 0 ? (shortSessions / totalSessions) * 100 : 0;
        const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
        // Calculate retention (sessions in last 7 days vs previous 7 days)
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const recentSessions = userSessions.filter(s => s.startTime >= weekAgo).length;
        const previousSessions = userSessions.filter(s => s.startTime >= twoWeeksAgo && s.startTime < weekAgo).length;
        const retentionRate = previousSessions > 0 ? (recentSessions / previousSessions) * 100 : 100;
        // Calculate active streak
        const sortedSessions = userSessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
        let activeStreak = 0;
        let lastDate = now;
        for (const session of sortedSessions) {
            const dayDiff = Math.floor((lastDate.getTime() - session.startTime.getTime()) / (24 * 60 * 60 * 1000));
            if (dayDiff <= 1) {
                activeStreak++;
                lastDate = session.startTime;
            }
            else {
                break;
            }
        }
        return {
            totalSessions,
            totalLearningTime,
            averageSessionDuration,
            bounceRate,
            completionRate,
            retentionRate,
            activeStreak,
            lastActiveDate: sortedSessions.length > 0 ? sortedSessions[0].startTime : new Date()
        };
    }
    /**
     * Get content metrics
     */
    getContentMetrics() {
        const userSessions = Array.from(this.sessions.values()).filter(s => s.userId === this.userId);
        const userActions = this.actions.filter(a => this.currentSession?.userId === this.userId);
        const topicEngagement = new Map();
        userSessions.forEach(session => {
            const existing = topicEngagement.get(session.topicId) || { views: 0, completions: 0, timeSpent: 0, struggles: 0 };
            topicEngagement.set(session.topicId, {
                views: existing.views + 1,
                completions: existing.completions + (session.completionStatus === 'completed' ? 1 : 0),
                timeSpent: existing.timeSpent + session.duration,
                struggles: existing.struggles + (session.completionStatus === 'abandoned' ? 1 : 0)
            });
        });
        const topicsViewed = topicEngagement.size;
        const topicsCompleted = Array.from(topicEngagement.values()).filter(t => t.completions > 0).length;
        const favoriteTopics = Array.from(topicEngagement.entries())
            .map(([topicId, data]) => ({
            topicId,
            engagementScore: data.views + (data.completions * 2) + (data.timeSpent / 60000) // Views + 2*completions + minutes spent
        }))
            .sort((a, b) => b.engagementScore - a.engagementScore)
            .slice(0, 5);
        const difficultTopics = Array.from(topicEngagement.entries())
            .filter(([_, data]) => data.struggles > 0)
            .map(([topicId, data]) => ({ topicId, struggles: data.struggles }))
            .sort((a, b) => b.struggles - a.struggles)
            .slice(0, 5);
        const fastestCompletions = userSessions
            .filter(s => s.completionStatus === 'completed')
            .sort((a, b) => a.duration - b.duration)
            .slice(0, 5)
            .map(s => ({ topicId: s.topicId, duration: s.duration }));
        return {
            topicsViewed,
            topicsCompleted,
            favoriteTopics,
            difficultTopics,
            fastestCompletions
        };
    }
    /**
     * Get all analytics data
     */
    getAnalyticsSummary() {
        return {
            patterns: this.getLearningPatterns(),
            engagement: this.getEngagementMetrics(),
            content: this.getContentMetrics(),
            currentSession: this.currentSession,
            totalActions: this.actions.length,
            totalSessions: this.sessions.size
        };
    }
    /**
     * Export analytics data
     */
    exportAnalytics() {
        return JSON.stringify({
            userId: this.userId,
            sessions: Array.from(this.sessions.values()),
            actions: this.actions,
            summary: this.getAnalyticsSummary(),
            exportedAt: new Date().toISOString()
        }, null, 2);
    }
    /**
     * Clear all analytics data
     */
    clearData() {
        this.sessions.clear();
        this.actions = [];
        this.currentSession = null;
        localStorage.removeItem(this.STORAGE_KEY);
    }
    /**
     * Private methods
     */
    startSessionTracking() {
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.currentSession) {
                this.endSession('paused');
            }
        });
        // Track before page unload
        window.addEventListener('beforeunload', () => {
            if (this.currentSession) {
                this.endSession('abandoned');
            }
        });
        // Auto-end sessions after timeout
        setInterval(() => {
            if (this.currentSession) {
                const sessionAge = Date.now() - this.currentSession.startTime.getTime();
                if (sessionAge > this.SESSION_TIMEOUT) {
                    this.endSession('abandoned');
                }
            }
        }, 60000); // Check every minute
        // Periodic cleanup
        setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000); // Every 5 minutes
    }
    cleanup() {
        // Remove sessions older than 30 days
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.startTime.getTime() < thirtyDaysAgo) {
                this.sessions.delete(sessionId);
            }
        }
        // Remove actions older than 7 days
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        this.actions = this.actions.filter(action => action.timestamp.getTime() > weekAgo);
        this.persistData();
    }
    persistData() {
        try {
            const data = {
                userId: this.userId,
                sessions: Array.from(this.sessions.entries()),
                actions: this.actions.slice(-1000), // Only persist last 1000 actions
                currentSession: this.currentSession,
                timestamp: Date.now()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        }
        catch (error) {
            console.warn('[Analytics] Failed to persist data:', error);
        }
    }
    loadPersistedData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                // Only load recent data (last 7 days)
                const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                if (parsed.timestamp && parsed.timestamp > weekAgo) {
                    this.userId = parsed.userId;
                    this.sessions = new Map(parsed.sessions || []);
                    this.actions = (parsed.actions || []).map((a) => ({
                        ...a,
                        timestamp: new Date(a.timestamp)
                    }));
                    // Don't restore current session - it should be started fresh
                    this.currentSession = null;
                }
            }
        }
        catch (error) {
            console.warn('[Analytics] Failed to load persisted data:', error);
        }
    }
}
// Export singleton instance
export const userAnalytics = new UserAnalytics();
export default userAnalytics;
//# sourceMappingURL=userAnalytics.js.map