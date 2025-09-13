export interface PromptTemplate {
    agentName: string;
    basePrompt: string;
    queryOptimizers: QueryOptimizer[];
    contextEnhancers: ContextEnhancer[];
}
export interface QueryOptimizer {
    name: string;
    description: string;
    optimize: (topic: string, context?: any) => string[];
}
export interface ContextEnhancer {
    name: string;
    description: string;
    enhance: (topic: string, context?: any) => Record<string, any>;
}
export declare const AGENT_PROMPTS: {
    readonly GENERAL: {
        readonly agentName: "General Research Agent";
        readonly basePrompt: "Research comprehensive information about {topic} including definitions, key concepts, applications, and current developments";
        readonly variations: readonly ["Provide a comprehensive overview of {topic} covering fundamental concepts, practical applications, and recent developments", "Explain {topic} in detail, including its definition, key principles, real-world uses, and current trends", "Research {topic} thoroughly, focusing on core concepts, applications, benefits, challenges, and future outlook"];
    };
    readonly ACADEMIC: {
        readonly agentName: "Academic Research Agent";
        readonly basePrompt: "Find peer-reviewed research, academic papers, and scholarly articles about {topic} focusing on latest findings and theoretical frameworks";
        readonly variations: readonly ["Search for recent academic research on {topic}, emphasizing peer-reviewed studies, theoretical frameworks, and empirical findings", "Locate scholarly articles and research papers about {topic}, prioritizing recent publications and methodological approaches", "Find academic literature on {topic} with focus on research methodologies, theoretical models, and scientific evidence"];
    };
    readonly COMPUTATIONAL: {
        readonly agentName: "Computational Agent";
        readonly basePrompt: "Analyze mathematical, scientific, or computational aspects of {topic} including formulas, calculations, and technical specifications";
        readonly variations: readonly ["Examine the mathematical and computational properties of {topic}, including relevant formulas, algorithms, and technical details", "Analyze {topic} from a quantitative perspective, focusing on mathematical models, calculations, and computational methods", "Investigate the technical and mathematical aspects of {topic}, including equations, algorithms, and computational approaches"];
    };
    readonly VIDEO: {
        readonly agentName: "Video Learning Agent";
        readonly basePrompt: "Discover educational videos, tutorials, and visual explanations about {topic} suitable for different learning levels";
        readonly variations: readonly ["Find educational videos and tutorials about {topic} that cater to beginners, intermediate, and advanced learners", "Search for visual learning content on {topic}, including tutorials, demonstrations, and educational videos", "Locate video-based educational resources for {topic} with clear explanations and visual demonstrations"];
    };
    readonly COMMUNITY: {
        readonly agentName: "Community Discussion Agent";
        readonly basePrompt: "Find real-world discussions, practical applications, common questions, and user experiences related to {topic}";
        readonly variations: readonly ["Search for community discussions about {topic}, including user experiences, practical tips, and common questions", "Find real-world perspectives on {topic} from forums, discussions, and user-generated content", "Locate community-driven content about {topic}, focusing on practical applications and user experiences"];
    };
};
export declare class GeneralQueryOptimizer implements QueryOptimizer {
    name: string;
    description: string;
    optimize(topic: string, context?: any): string[];
}
export declare class AcademicQueryOptimizer implements QueryOptimizer {
    name: string;
    description: string;
    optimize(topic: string, context?: any): string[];
}
export declare class ComputationalQueryOptimizer implements QueryOptimizer {
    name: string;
    description: string;
    optimize(topic: string, context?: any): string[];
}
export declare class VideoQueryOptimizer implements QueryOptimizer {
    name: string;
    description: string;
    optimize(topic: string, context?: any): string[];
}
export declare class CommunityQueryOptimizer implements QueryOptimizer {
    name: string;
    description: string;
    optimize(topic: string, context?: any): string[];
}
export declare class TopicContextEnhancer implements ContextEnhancer {
    name: string;
    description: string;
    enhance(topic: string, context?: any): Record<string, any>;
    private extractKeyTerms;
    private identifyRelatedConcepts;
    private generateSearchFilters;
}
export declare class UserContextEnhancer implements ContextEnhancer {
    name: string;
    description: string;
    enhance(topic: string, context?: any): Record<string, any>;
}
export declare class PromptTemplateManager {
    private static templates;
    private static optimizers;
    private static enhancers;
    private static initializeTemplates;
    static getTemplate(agentName: string): PromptTemplate | undefined;
    static getAllTemplates(): PromptTemplate[];
    static optimizeQuery(agentName: string, topic: string, context?: any): string[];
    static enhanceContext(agentName: string, topic: string, context?: any): Record<string, any>;
    static generatePrompt(agentName: string, topic: string, context?: any): string;
}
export declare function getOptimizedQueries(agentName: string, topic: string, context?: any): string[];
export declare function getEnhancedPrompt(agentName: string, topic: string, context?: any): string;
export declare function getEnhancedContext(agentName: string, topic: string, context?: any): Record<string, any>;
//# sourceMappingURL=prompts.d.ts.map