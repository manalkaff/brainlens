/**
 * Recovery strategies for different types of errors in the learning platform
 */
import { LearningPlatformError } from './errorTypes';
export interface RecoveryStrategy {
    canRecover: (error: LearningPlatformError) => boolean;
    recover: (error: LearningPlatformError, context?: any) => Promise<boolean>;
    description: string;
}
export declare const databaseConnectionRecovery: RecoveryStrategy;
export declare const aiServiceRecovery: RecoveryStrategy;
export declare const vectorStoreRecovery: RecoveryStrategy;
export declare const networkRecovery: RecoveryStrategy;
export declare const authenticationRecovery: RecoveryStrategy;
export declare const dataCorruptionRecovery: RecoveryStrategy;
export declare class RecoveryManager {
    private strategies;
    private recoveryHistory;
    private maxRecoveryAttempts;
    constructor();
    registerStrategy(strategy: RecoveryStrategy): void;
    attemptRecovery(error: LearningPlatformError, context?: any): Promise<{
        recovered: boolean;
        strategy?: RecoveryStrategy;
    }>;
    clearRecoveryHistory(): void;
    getRecoveryAttempts(error: LearningPlatformError): number;
}
export declare const globalRecoveryManager: RecoveryManager;
export declare function attemptAutomaticRecovery(error: LearningPlatformError, context?: any): Promise<boolean>;
export declare const learningOperationRecovery: RecoveryStrategy;
//# sourceMappingURL=recoveryStrategies.d.ts.map