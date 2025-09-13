import { createTopic } from 'wasp/client/operations';
export const PENDING_TOPIC_KEY = 'pendingTopic';
/**
 * Stores a topic title for creation after user authentication
 */
export function storePendingTopic(topicTitle) {
    sessionStorage.setItem(PENDING_TOPIC_KEY, topicTitle.trim());
}
/**
 * Retrieves and clears the pending topic from storage
 */
export function getPendingTopic() {
    const topic = sessionStorage.getItem(PENDING_TOPIC_KEY);
    if (topic) {
        sessionStorage.removeItem(PENDING_TOPIC_KEY);
        return topic;
    }
    return null;
}
/**
 * Creates a topic from the pending topic if one exists
 * Returns the created topic or null if no pending topic
 */
export async function createPendingTopic() {
    const pendingTopic = getPendingTopic();
    if (!pendingTopic) {
        return null;
    }
    try {
        console.log('Creating pending topic:', pendingTopic);
        // Create the topic
        const topic = await createTopic({
            title: pendingTopic,
            summary: `Learn about ${pendingTopic}`,
            description: `Comprehensive learning material for ${pendingTopic}`
        });
        // Note: Research will be automatically started by ExploreTab
        console.log('Pending topic created, ExploreTab will handle research automatically');
        return { id: topic.id, slug: topic.slug };
    }
    catch (error) {
        console.error('Failed to create pending topic:', error);
        // Store the topic back if creation failed
        storePendingTopic(pendingTopic);
        throw error;
    }
}
/**
 * Checks if there's a pending topic and redirects to it after creation
 */
export async function handlePendingTopicRedirect() {
    try {
        const topic = await createPendingTopic();
        if (topic) {
            // Redirect to the created topic
            window.location.href = `/learn/${topic.slug}`;
            return true;
        }
        return false;
    }
    catch (error) {
        console.error('Failed to handle pending topic redirect:', error);
        return false;
    }
}
//# sourceMappingURL=pendingTopicHandler.js.map