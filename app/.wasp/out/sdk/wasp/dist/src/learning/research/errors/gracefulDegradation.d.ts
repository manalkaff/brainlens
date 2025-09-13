/**
 * Graceful degradation strategies for research agents
 */
import { type ResearchResult } from '../agents';
export interface DegradationStrategy {
    name: string;
    priority: number;
    execute: (agentName: string, topic: string, context?: any, error?: string) => Promise<ResearchResult | null>;
}
export declare class GracefulDegradation {
    private strategies;
    handleAgentFailure(agentName: string, topic: string, context?: any, error?: string): Promise<ResearchResult | null>;
    private useCachedResults;
    private useSimplifiedSearch;
    private useDefaultContent;
    addStrategy(strategy: DegradationStrategy): void;
    getStrategies(): DegradationStrategy[];
}
export declare const gracefulDegradation: GracefulDegradation;
//# sourceMappingURL=gracefulDegradation.d.ts.map