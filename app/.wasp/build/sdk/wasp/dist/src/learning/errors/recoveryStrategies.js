/**
 * Recovery strategies for different types of errors in the learning platform
 */
import { ErrorType } from './errorTypes';
// Database connection recovery
export const databaseConnectionRecovery = {
    canRecover: (error) => error.type === ErrorType.DATABASE_CONNECTION_ERROR,
    recover: async (error, context) => {
        try {
            // Wait for a moment before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Try a simple database query to test connection
            if (context?.entities?.Topic) {
                await context.entities.Topic.count();
                return true;
            }
            return false;
        }
        catch (recoveryError) {
            console.error('Database connection recovery failed:', recoveryError);
            return false;
        }
    },
    description: 'Attempt to reconnect to the database'
};
// AI service recovery
export const aiServiceRecovery = {
    canRecover: (error) => error.type === ErrorType.AI_API_ERROR ||
        error.type === ErrorType.AI_RATE_LIMIT_ERROR,
    recover: async (error, context) => {
        try {
            // For rate limit errors, wait longer
            const waitTime = error.type === ErrorType.AI_RATE_LIMIT_ERROR ? 60000 : 5000;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            // Try a simple AI request to test service
            // This would need to be implemented based on your AI service
            return true;
        }
        catch (recoveryError) {
            console.error('AI service recovery failed:', recoveryError);
            return false;
        }
    },
    description: 'Wait and retry AI service connection'
};
// Vector store recovery
export const vectorStoreRecovery = {
    canRecover: (error) => error.type === ErrorType.VECTOR_STORE_ERROR,
    recover: async (error, context) => {
        try {
            // Wait before retrying vector operations
            await new Promise(resolve => setTimeout(resolve, 3000));
            // Try to reconnect to vector store
            // This would need to be implemented based on your vector store
            return true;
        }
        catch (recoveryError) {
            console.error('Vector store recovery failed:', recoveryError);
            return false;
        }
    },
    description: 'Reconnect to vector database'
};
// Network connectivity recovery
export const networkRecovery = {
    canRecover: (error) => error.type === ErrorType.NETWORK_ERROR ||
        error.type === ErrorType.CONNECTION_ERROR,
    recover: async (error, context) => {
        try {
            // Check if network is available
            if (!navigator.onLine) {
                return false;
            }
            // Try a simple network request
            const response = await fetch('/api/health', {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        }
        catch (recoveryError) {
            console.error('Network recovery failed:', recoveryError);
            return false;
        }
    },
    description: 'Check network connectivity and retry'
};
// Authentication recovery
export const authenticationRecovery = {
    canRecover: (error) => error.type === ErrorType.AUTHENTICATION_ERROR ||
        error.type === ErrorType.SESSION_EXPIRED,
    recover: async (error, context) => {
        try {
            // Try to refresh the authentication token
            // This would need to be implemented based on your auth system
            // For now, redirect to login
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
            return false; // Always return false as we're redirecting
        }
        catch (recoveryError) {
            console.error('Authentication recovery failed:', recoveryError);
            return false;
        }
    },
    description: 'Refresh authentication or redirect to login'
};
// Data corruption recovery
export const dataCorruptionRecovery = {
    canRecover: (error) => error.type === ErrorType.PARSING_ERROR ||
        error.type === ErrorType.DATABASE_CONSTRAINT_ERROR,
    recover: async (error, context) => {
        try {
            // For parsing errors, try to clean and re-parse data
            if (error.type === ErrorType.PARSING_ERROR && error.context?.rawData) {
                // Attempt to clean the data
                const cleanedData = cleanCorruptedData(error.context.rawData);
                if (cleanedData) {
                    return true;
                }
            }
            // For constraint errors, try to resolve conflicts
            if (error.type === ErrorType.DATABASE_CONSTRAINT_ERROR) {
                // This would need specific implementation based on the constraint
                return false;
            }
            return false;
        }
        catch (recoveryError) {
            console.error('Data corruption recovery failed:', recoveryError);
            return false;
        }
    },
    description: 'Attempt to clean corrupted data'
};
// Helper function to clean corrupted data
function cleanCorruptedData(rawData) {
    try {
        if (typeof rawData === 'string') {
            // Remove null bytes and other problematic characters
            const cleaned = rawData.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '');
            return JSON.parse(cleaned);
        }
        return rawData;
    }
    catch (error) {
        return null;
    }
}
// Recovery manager class
export class RecoveryManager {
    strategies = [];
    recoveryHistory = new Map();
    maxRecoveryAttempts = 3;
    constructor() {
        // Register default recovery strategies
        this.registerStrategy(databaseConnectionRecovery);
        this.registerStrategy(aiServiceRecovery);
        this.registerStrategy(vectorStoreRecovery);
        this.registerStrategy(networkRecovery);
        this.registerStrategy(authenticationRecovery);
        this.registerStrategy(dataCorruptionRecovery);
    }
    registerStrategy(strategy) {
        this.strategies.push(strategy);
    }
    async attemptRecovery(error, context) {
        const errorKey = `${error.type}-${error.code}`;
        const attemptCount = this.recoveryHistory.get(errorKey) || 0;
        // Check if we've exceeded max attempts
        if (attemptCount >= this.maxRecoveryAttempts) {
            console.warn(`Max recovery attempts exceeded for error: ${errorKey}`);
            return { recovered: false };
        }
        // Find applicable recovery strategies
        const applicableStrategies = this.strategies.filter(strategy => strategy.canRecover(error));
        if (applicableStrategies.length === 0) {
            console.warn(`No recovery strategy found for error type: ${error.type}`);
            return { recovered: false };
        }
        // Try each strategy
        for (const strategy of applicableStrategies) {
            try {
                console.log(`Attempting recovery with strategy: ${strategy.description}`);
                const recovered = await strategy.recover(error, context);
                if (recovered) {
                    console.log(`Recovery successful with strategy: ${strategy.description}`);
                    // Reset attempt count on successful recovery
                    this.recoveryHistory.delete(errorKey);
                    return { recovered: true, strategy };
                }
            }
            catch (recoveryError) {
                console.error(`Recovery strategy failed: ${strategy.description}`, recoveryError);
            }
        }
        // Increment attempt count
        this.recoveryHistory.set(errorKey, attemptCount + 1);
        return { recovered: false };
    }
    clearRecoveryHistory() {
        this.recoveryHistory.clear();
    }
    getRecoveryAttempts(error) {
        const errorKey = `${error.type}-${error.code}`;
        return this.recoveryHistory.get(errorKey) || 0;
    }
}
// Global recovery manager instance
export const globalRecoveryManager = new RecoveryManager();
// Utility function for automatic recovery
export async function attemptAutomaticRecovery(error, context) {
    const result = await globalRecoveryManager.attemptRecovery(error, context);
    return result.recovered;
}
// Recovery strategy for specific learning platform operations
export const learningOperationRecovery = {
    canRecover: (error) => error.type === ErrorType.TOPIC_NOT_FOUND ||
        error.type === ErrorType.QUIZ_GENERATION_ERROR ||
        error.type === ErrorType.CHAT_ERROR,
    recover: async (error, context) => {
        try {
            switch (error.type) {
                case ErrorType.TOPIC_NOT_FOUND:
                    // Try to recreate the topic if we have enough context
                    if (context?.topicTitle) {
                        // This would need to be implemented
                        return false;
                    }
                    break;
                case ErrorType.QUIZ_GENERATION_ERROR:
                    // Try with simpler quiz parameters
                    if (context?.retryWithSimpler) {
                        return await context.retryWithSimpler();
                    }
                    break;
                case ErrorType.CHAT_ERROR:
                    // Reset chat session and try again
                    if (context?.resetChatSession) {
                        await context.resetChatSession();
                        return true;
                    }
                    break;
            }
            return false;
        }
        catch (recoveryError) {
            console.error('Learning operation recovery failed:', recoveryError);
            return false;
        }
    },
    description: 'Recover from learning platform specific errors'
};
// Register the learning operation recovery strategy
globalRecoveryManager.registerStrategy(learningOperationRecovery);
//# sourceMappingURL=recoveryStrategies.js.map