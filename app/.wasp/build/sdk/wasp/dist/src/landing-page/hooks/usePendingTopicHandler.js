import { useEffect } from 'react';
import { useAuth } from 'wasp/client/auth';
import { handlePendingTopicRedirect } from '../utils/pendingTopicHandler';
/**
 * Hook that handles pending topic creation after user authentication
 * Should be used in the main App component or a route that runs after auth
 */
export function usePendingTopicHandler() {
    const { data: user, isLoading } = useAuth();
    useEffect(() => {
        // Only run when user is authenticated and not loading
        if (!isLoading && user) {
            // Small delay to ensure auth is fully settled
            const timeoutId = setTimeout(async () => {
                try {
                    await handlePendingTopicRedirect();
                }
                catch (error) {
                    console.error('Error handling pending topic:', error);
                    // Could show a toast notification here if needed
                }
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [user, isLoading]);
}
//# sourceMappingURL=usePendingTopicHandler.js.map