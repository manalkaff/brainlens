/**
 * Progress tracking for research sessions
 * Handles real-time progress broadcasting and monitoring
 */
export class ProgressTracker {
    subscribers = new Map();
    eventHistory = new Map();
    /**
     * Broadcast an event to all subscribers
     */
    async broadcastEvent(event) {
        const fullEvent = {
            ...event,
            timestamp: new Date()
        };
        // Store event in history
        const sessionHistory = this.eventHistory.get(event.sessionId) || [];
        sessionHistory.push(fullEvent);
        this.eventHistory.set(event.sessionId, sessionHistory);
        // Broadcast to subscribers
        this.subscribers.forEach(subscriber => {
            if (subscriber.active && subscriber.sessionId === event.sessionId) {
                try {
                    subscriber.callback(fullEvent);
                }
                catch (error) {
                    console.error('Error in progress subscriber:', error);
                }
            }
        });
    }
    /**
     * Subscribe to progress events for a session
     */
    subscribe(sessionId, callback) {
        const subscriberId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.subscribers.set(subscriberId, {
            id: subscriberId,
            sessionId,
            callback,
            active: true
        });
        return subscriberId;
    }
    /**
     * Unsubscribe from progress events
     */
    unsubscribe(subscriberId) {
        const subscriber = this.subscribers.get(subscriberId);
        if (subscriber) {
            subscriber.active = false;
            this.subscribers.delete(subscriberId);
        }
    }
    /**
     * Get event history for a session
     */
    getEventHistory(sessionId) {
        return this.eventHistory.get(sessionId) || [];
    }
    /**
     * Clean up old events and inactive subscribers
     */
    cleanup() {
        // Remove inactive subscribers
        Array.from(this.subscribers.entries()).forEach(([id, subscriber]) => {
            if (!subscriber.active) {
                this.subscribers.delete(id);
            }
        });
        // Keep only recent event history (last 1000 events per session)
        this.eventHistory.forEach((events, sessionId) => {
            if (events.length > 1000) {
                this.eventHistory.set(sessionId, events.slice(-1000));
            }
        });
    }
}
// Export singleton instance
export const progressTracker = new ProgressTracker();
//# sourceMappingURL=progressTracker.js.map