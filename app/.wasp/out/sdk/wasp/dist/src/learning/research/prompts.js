// Agent-specific prompts and query optimization system
// Base prompt templates for each agent type
export const AGENT_PROMPTS = {
    GENERAL: {
        agentName: 'General Research Agent',
        basePrompt: 'Research comprehensive information about {topic} including definitions, key concepts, applications, and current developments',
        variations: [
            'Provide a comprehensive overview of {topic} covering fundamental concepts, practical applications, and recent developments',
            'Explain {topic} in detail, including its definition, key principles, real-world uses, and current trends',
            'Research {topic} thoroughly, focusing on core concepts, applications, benefits, challenges, and future outlook'
        ]
    },
    ACADEMIC: {
        agentName: 'Academic Research Agent',
        basePrompt: 'Find peer-reviewed research, academic papers, and scholarly articles about {topic} focusing on latest findings and theoretical frameworks',
        variations: [
            'Search for recent academic research on {topic}, emphasizing peer-reviewed studies, theoretical frameworks, and empirical findings',
            'Locate scholarly articles and research papers about {topic}, prioritizing recent publications and methodological approaches',
            'Find academic literature on {topic} with focus on research methodologies, theoretical models, and scientific evidence'
        ]
    },
    COMPUTATIONAL: {
        agentName: 'Computational Agent',
        basePrompt: 'Analyze mathematical, scientific, or computational aspects of {topic} including formulas, calculations, and technical specifications',
        variations: [
            'Examine the mathematical and computational properties of {topic}, including relevant formulas, algorithms, and technical details',
            'Analyze {topic} from a quantitative perspective, focusing on mathematical models, calculations, and computational methods',
            'Investigate the technical and mathematical aspects of {topic}, including equations, algorithms, and computational approaches'
        ]
    },
    VIDEO: {
        agentName: 'Video Learning Agent',
        basePrompt: 'Discover educational videos, tutorials, and visual explanations about {topic} suitable for different learning levels',
        variations: [
            'Find educational videos and tutorials about {topic} that cater to beginners, intermediate, and advanced learners',
            'Search for visual learning content on {topic}, including tutorials, demonstrations, and educational videos',
            'Locate video-based educational resources for {topic} with clear explanations and visual demonstrations'
        ]
    },
    COMMUNITY: {
        agentName: 'Community Discussion Agent',
        basePrompt: 'Find real-world discussions, practical applications, common questions, and user experiences related to {topic}',
        variations: [
            'Search for community discussions about {topic}, including user experiences, practical tips, and common questions',
            'Find real-world perspectives on {topic} from forums, discussions, and user-generated content',
            'Locate community-driven content about {topic}, focusing on practical applications and user experiences'
        ]
    }
};
// Query optimization strategies for different agent types
export class GeneralQueryOptimizer {
    name = 'General Query Optimizer';
    description = 'Optimizes queries for broad, comprehensive coverage';
    optimize(topic, context) {
        const baseQueries = [
            `"${topic}" definition overview`,
            `${topic} applications uses`,
            `${topic} benefits advantages`,
            `${topic} challenges problems`,
            `${topic} current trends 2024`,
            `${topic} future developments`,
            `how ${topic} works`,
            `${topic} examples case studies`
        ];
        // Add context-specific queries if available
        if (context?.userLevel) {
            if (context.userLevel === 'beginner') {
                baseQueries.push(`${topic} for beginners`, `${topic} simple explanation`);
            }
            else if (context.userLevel === 'advanced') {
                baseQueries.push(`${topic} advanced concepts`, `${topic} expert analysis`);
            }
        }
        return baseQueries;
    }
}
export class AcademicQueryOptimizer {
    name = 'Academic Query Optimizer';
    description = 'Optimizes queries for scholarly and peer-reviewed content';
    optimize(topic, context) {
        const baseQueries = [
            `"${topic}" peer reviewed research`,
            `${topic} systematic review meta-analysis`,
            `${topic} theoretical framework`,
            `${topic} empirical study findings`,
            `${topic} research methodology`,
            `${topic} academic literature review`,
            `${topic} scholarly articles 2023 2024`,
            `${topic} research gaps future work`
        ];
        // Add field-specific academic queries
        if (context?.academicField) {
            baseQueries.push(`${topic} ${context.academicField} research`);
        }
        return baseQueries;
    }
}
export class ComputationalQueryOptimizer {
    name = 'Computational Query Optimizer';
    description = 'Optimizes queries for mathematical and computational content';
    optimize(topic, context) {
        const baseQueries = [
            `${topic} mathematical formula equation`,
            `${topic} algorithm implementation`,
            `${topic} computational complexity`,
            `${topic} mathematical model`,
            `${topic} calculation method`,
            `${topic} technical specifications`,
            `${topic} programming implementation`,
            `${topic} mathematical properties`
        ];
        // Add domain-specific computational queries
        if (context?.domain) {
            if (context.domain === 'machine-learning') {
                baseQueries.push(`${topic} ML algorithm`, `${topic} neural network`);
            }
            else if (context.domain === 'statistics') {
                baseQueries.push(`${topic} statistical analysis`, `${topic} probability`);
            }
        }
        return baseQueries;
    }
}
export class VideoQueryOptimizer {
    name = 'Video Query Optimizer';
    description = 'Optimizes queries for educational video content';
    optimize(topic, context) {
        const baseQueries = [
            `${topic} tutorial explained`,
            `${topic} educational video`,
            `${topic} step by step guide`,
            `${topic} visual explanation`,
            `${topic} demonstration example`,
            `${topic} beginner tutorial`,
            `${topic} advanced course`,
            `${topic} practical examples`
        ];
        // Add learning level specific queries
        if (context?.learningLevel) {
            baseQueries.push(`${topic} ${context.learningLevel} level`);
        }
        return baseQueries;
    }
}
export class CommunityQueryOptimizer {
    name = 'Community Query Optimizer';
    description = 'Optimizes queries for community discussions and user experiences';
    optimize(topic, context) {
        const baseQueries = [
            `${topic} reddit discussion`,
            `${topic} user experience review`,
            `${topic} common problems solutions`,
            `${topic} tips tricks advice`,
            `${topic} real world application`,
            `${topic} community questions`,
            `${topic} practical guide`,
            `${topic} user feedback opinions`
        ];
        // Add platform-specific queries
        if (context?.platforms) {
            context.platforms.forEach((platform) => {
                baseQueries.push(`${topic} ${platform} discussion`);
            });
        }
        return baseQueries;
    }
}
// Context enhancers to add relevant information to search queries
export class TopicContextEnhancer {
    name = 'Topic Context Enhancer';
    description = 'Enhances queries with topic-specific context';
    enhance(topic, context) {
        const enhancement = {
            originalTopic: topic,
            searchTerms: this.extractKeyTerms(topic),
            relatedConcepts: this.identifyRelatedConcepts(topic),
            searchFilters: this.generateSearchFilters(topic, context)
        };
        return enhancement;
    }
    extractKeyTerms(topic) {
        // Simple keyword extraction - in production, this would use NLP
        const words = topic.toLowerCase().split(/\s+/);
        return words.filter(word => word.length > 2);
    }
    identifyRelatedConcepts(topic) {
        // This would use AI or a knowledge graph in production
        const conceptMap = {
            'machine learning': ['artificial intelligence', 'neural networks', 'deep learning', 'algorithms'],
            'quantum computing': ['quantum mechanics', 'qubits', 'superposition', 'entanglement'],
            'blockchain': ['cryptocurrency', 'distributed ledger', 'smart contracts', 'decentralization'],
            'climate change': ['global warming', 'greenhouse gases', 'carbon emissions', 'sustainability']
        };
        const lowerTopic = topic.toLowerCase();
        for (const [key, concepts] of Object.entries(conceptMap)) {
            if (lowerTopic.includes(key)) {
                return concepts;
            }
        }
        return [];
    }
    generateSearchFilters(topic, context) {
        const filters = {
            language: context?.language || 'en',
            timeRange: context?.timeRange || 'recent',
            contentType: context?.contentType || 'all'
        };
        return filters;
    }
}
export class UserContextEnhancer {
    name = 'User Context Enhancer';
    description = 'Enhances queries based on user preferences and history';
    enhance(topic, context) {
        const enhancement = {
            userLevel: context?.userLevel || 'intermediate',
            learningStyle: context?.learningStyle || 'mixed',
            previousTopics: context?.previousTopics || [],
            preferences: context?.preferences || {}
        };
        // Adjust search strategy based on user level
        if (enhancement.userLevel === 'beginner') {
            enhancement.searchStrategy = 'comprehensive-basics';
            enhancement.contentComplexity = 'low';
        }
        else if (enhancement.userLevel === 'advanced') {
            enhancement.searchStrategy = 'deep-technical';
            enhancement.contentComplexity = 'high';
        }
        return enhancement;
    }
}
// Prompt template manager
export class PromptTemplateManager {
    static templates = new Map();
    static optimizers = new Map();
    static enhancers = new Map();
    static {
        // Initialize optimizers
        const optimizers = [
            new GeneralQueryOptimizer(),
            new AcademicQueryOptimizer(),
            new ComputationalQueryOptimizer(),
            new VideoQueryOptimizer(),
            new CommunityQueryOptimizer()
        ];
        optimizers.forEach(optimizer => {
            this.optimizers.set(optimizer.name, optimizer);
        });
        // Initialize enhancers
        const enhancers = [
            new TopicContextEnhancer(),
            new UserContextEnhancer()
        ];
        enhancers.forEach(enhancer => {
            this.enhancers.set(enhancer.name, enhancer);
        });
        // Initialize templates
        this.initializeTemplates();
    }
    static initializeTemplates() {
        const templateConfigs = [
            {
                agentName: 'General Research Agent',
                basePrompt: AGENT_PROMPTS.GENERAL.basePrompt,
                queryOptimizers: [this.optimizers.get('General Query Optimizer')],
                contextEnhancers: [
                    this.enhancers.get('Topic Context Enhancer'),
                    this.enhancers.get('User Context Enhancer')
                ]
            },
            {
                agentName: 'Academic Research Agent',
                basePrompt: AGENT_PROMPTS.ACADEMIC.basePrompt,
                queryOptimizers: [this.optimizers.get('Academic Query Optimizer')],
                contextEnhancers: [
                    this.enhancers.get('Topic Context Enhancer'),
                    this.enhancers.get('User Context Enhancer')
                ]
            },
            {
                agentName: 'Computational Agent',
                basePrompt: AGENT_PROMPTS.COMPUTATIONAL.basePrompt,
                queryOptimizers: [this.optimizers.get('Computational Query Optimizer')],
                contextEnhancers: [
                    this.enhancers.get('Topic Context Enhancer'),
                    this.enhancers.get('User Context Enhancer')
                ]
            },
            {
                agentName: 'Video Learning Agent',
                basePrompt: AGENT_PROMPTS.VIDEO.basePrompt,
                queryOptimizers: [this.optimizers.get('Video Query Optimizer')],
                contextEnhancers: [
                    this.enhancers.get('Topic Context Enhancer'),
                    this.enhancers.get('User Context Enhancer')
                ]
            },
            {
                agentName: 'Community Discussion Agent',
                basePrompt: AGENT_PROMPTS.COMMUNITY.basePrompt,
                queryOptimizers: [this.optimizers.get('Community Query Optimizer')],
                contextEnhancers: [
                    this.enhancers.get('Topic Context Enhancer'),
                    this.enhancers.get('User Context Enhancer')
                ]
            }
        ];
        templateConfigs.forEach(config => {
            this.templates.set(config.agentName, config);
        });
    }
    static getTemplate(agentName) {
        return this.templates.get(agentName);
    }
    static getAllTemplates() {
        return Array.from(this.templates.values());
    }
    static optimizeQuery(agentName, topic, context) {
        const template = this.getTemplate(agentName);
        if (!template) {
            throw new Error(`Template not found for agent: ${agentName}`);
        }
        let optimizedQueries = [];
        template.queryOptimizers.forEach(optimizer => {
            const queries = optimizer.optimize(topic, context);
            optimizedQueries = [...optimizedQueries, ...queries];
        });
        // Remove duplicates and return
        return [...new Set(optimizedQueries)];
    }
    static enhanceContext(agentName, topic, context) {
        const template = this.getTemplate(agentName);
        if (!template) {
            throw new Error(`Template not found for agent: ${agentName}`);
        }
        let enhancedContext = { ...context };
        template.contextEnhancers.forEach(enhancer => {
            const enhancement = enhancer.enhance(topic, context);
            enhancedContext = { ...enhancedContext, ...enhancement };
        });
        return enhancedContext;
    }
    static generatePrompt(agentName, topic, context) {
        const template = this.getTemplate(agentName);
        if (!template) {
            throw new Error(`Template not found for agent: ${agentName}`);
        }
        // Enhance context first
        const enhancedContext = this.enhanceContext(agentName, topic, context);
        // Replace placeholders in the base prompt
        let prompt = template.basePrompt.replace(/{topic}/g, topic);
        // Add context-specific enhancements to the prompt
        if (enhancedContext.userLevel) {
            prompt += ` Target the content for ${enhancedContext.userLevel} level understanding.`;
        }
        if (enhancedContext.relatedConcepts && enhancedContext.relatedConcepts.length > 0) {
            prompt += ` Consider related concepts: ${enhancedContext.relatedConcepts.join(', ')}.`;
        }
        if (enhancedContext.searchStrategy) {
            prompt += ` Use a ${enhancedContext.searchStrategy} approach.`;
        }
        return prompt;
    }
}
// Export utility functions
export function getOptimizedQueries(agentName, topic, context) {
    return PromptTemplateManager.optimizeQuery(agentName, topic, context);
}
export function getEnhancedPrompt(agentName, topic, context) {
    return PromptTemplateManager.generatePrompt(agentName, topic, context);
}
export function getEnhancedContext(agentName, topic, context) {
    return PromptTemplateManager.enhanceContext(agentName, topic, context);
}
//# sourceMappingURL=prompts.js.map