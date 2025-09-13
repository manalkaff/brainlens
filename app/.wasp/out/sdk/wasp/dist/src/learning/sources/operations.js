import { HttpError } from 'wasp/server';
// Helper function to map agent names from metadata to display names
function mapAgentName(agentFromMetadata) {
    if (!agentFromMetadata)
        return 'General';
    const lowerAgent = agentFromMetadata.toLowerCase();
    if (lowerAgent.includes('academic'))
        return 'Academic';
    if (lowerAgent.includes('computational') || lowerAgent.includes('wolfram'))
        return 'Computational';
    if (lowerAgent.includes('video') || lowerAgent.includes('youtube'))
        return 'Video';
    if (lowerAgent.includes('social') || lowerAgent.includes('reddit'))
        return 'Social';
    return 'General';
}
// Helper function to determine source type from metadata
function determineSourceType(metadata, url) {
    if (url) {
        if (url.includes('youtube.com') || url.includes('youtu.be'))
            return 'video';
        if (url.includes('reddit.com'))
            return 'discussion';
        if (url.includes('arxiv.org') || url.includes('scholar.google.com'))
            return 'academic';
        if (url.includes('docs.') || url.includes('documentation'))
            return 'documentation';
    }
    if (metadata?.sourceType)
        return metadata.sourceType;
    if (metadata?.sourceAgent) {
        const agent = metadata.sourceAgent.toLowerCase();
        if (agent.includes('academic'))
            return 'academic';
        if (agent.includes('video'))
            return 'video';
        if (agent.includes('social'))
            return 'discussion';
    }
    return 'article';
}
// Helper function to extract domain from URL
function extractDomain(url) {
    if (!url)
        return undefined;
    try {
        return new URL(url).hostname;
    }
    catch {
        return undefined;
    }
}
// Helper function to convert VectorDocument to SourceData
function vectorDocumentToSourceData(doc, topic) {
    const metadata = doc.metadata || {};
    // Try multiple possible field names for agent
    const agentField = metadata.sourceAgent || metadata.agent || metadata.agentType || metadata.source;
    const agent = mapAgentName(agentField);
    // Try multiple possible field names for URL
    const urlField = metadata.sourceUrl || metadata.url || metadata.link || metadata.href;
    const sourceType = determineSourceType(metadata, urlField);
    // Try multiple possible field names for title
    const titleField = metadata.sourceTitle || metadata.title || metadata.name || metadata.heading;
    const title = titleField || `Source Document ${doc.id.slice(0, 8)}`;
    // Create snippet from content
    const snippet = doc.content && doc.content.length > 300
        ? doc.content.substring(0, 300) + '...'
        : doc.content || 'No content available';
    // Try multiple possible field names for relevance score
    const relevanceScore = metadata.relevanceScore || metadata.score || metadata.relevance || 0.5;
    console.log(`Converting VectorDoc ${doc.id}:`, {
        title,
        agent,
        sourceType,
        url: urlField,
        hasContent: !!doc.content,
        metadataKeys: Object.keys(metadata)
    });
    return {
        id: doc.id,
        title,
        url: urlField,
        snippet,
        agent,
        sourceType,
        relevanceScore,
        createdAt: doc.createdAt.toISOString(),
        topicId: topic.id,
        topicTitle: topic.title,
        metadata: {
            confidence: metadata.confidence,
            completeness: metadata.completeness,
            publishedDate: metadata.publishedDate || metadata.date,
            author: metadata.author || metadata.creator,
            domain: extractDomain(urlField),
            sourceAgent: agentField,
            sourceUrl: urlField,
            sourceTitle: titleField,
        }
    };
}
/**
 * Get all sources for a topic and its subtopics with optional filtering
 */
export const getTopicSources = async ({ topicId, filters = {} }, context) => {
    if (!context.user) {
        throw new HttpError(401, 'Authentication required');
    }
    try {
        // Get the main topic
        const topic = await context.entities.Topic.findUnique({
            where: { id: topicId },
            include: {
                children: {
                    include: {
                        vectorDocuments: {
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                },
                vectorDocuments: {
                    orderBy: { createdAt: 'desc' }
                },
                generatedContent: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!topic) {
            throw new HttpError(404, 'Topic not found');
        }
        console.log('DEBUG: getTopicSources for', topic.title);
        console.log('VectorDocuments:', topic.vectorDocuments?.length || 0);
        console.log('GeneratedContent:', topic.generatedContent?.length || 0);
        // Collect all vector documents from topic and subtopics
        let allVectorDocuments = [...(topic.vectorDocuments || [])];
        // Add documents from all subtopics (recursively)
        const collectSubtopicDocuments = (topics) => {
            topics.forEach(subtopic => {
                console.log(`Subtopic: ${subtopic.title}, VectorDocs: ${subtopic.vectorDocuments?.length || 0}`);
                if (subtopic.vectorDocuments) {
                    allVectorDocuments = [...allVectorDocuments, ...subtopic.vectorDocuments];
                }
                if (subtopic.children) {
                    collectSubtopicDocuments(subtopic.children);
                }
            });
        };
        if (topic.children) {
            collectSubtopicDocuments(topic.children);
        }
        console.log('Total VectorDocuments collected:', allVectorDocuments.length);
        // Also check GeneratedContent for sources
        const generatedContentSources = [];
        if (topic.generatedContent) {
            topic.generatedContent.forEach((content) => {
                console.log('GeneratedContent item:', {
                    id: content.id,
                    contentType: content.contentType,
                    hasContent: !!content.content,
                    hasSources: !!content.sources,
                    sourcesType: typeof content.sources,
                    sourcesLength: Array.isArray(content.sources) ? content.sources.length : 'not array',
                    metadata: content.metadata ? Object.keys(content.metadata) : 'no metadata'
                });
                console.log('Raw sources field:', content.sources);
                console.log('Raw metadata field:', content.metadata);
                // Check if sources are in the top-level sources field
                if (content.sources && Array.isArray(content.sources)) {
                    console.log('Found sources in top-level sources field:', content.sources.length);
                    content.sources.forEach((source, index) => {
                        generatedContentSources.push({
                            id: `generated-${content.id}-${index}`,
                            title: source.title || `Source ${index + 1}`,
                            url: source.url,
                            snippet: source.snippet || source.content || 'No description available',
                            agent: mapAgentName(source.source || source.agent),
                            sourceType: determineSourceType(source, source.url),
                            relevanceScore: source.relevanceScore || source.score || 0.5,
                            createdAt: content.createdAt.toISOString(),
                            topicId: topic.id,
                            topicTitle: topic.title,
                            metadata: {
                                confidence: source.confidence,
                                completeness: source.completeness,
                                domain: extractDomain(source.url),
                                sourceAgent: source.source || source.agent,
                                sourceUrl: source.url,
                                sourceTitle: source.title,
                            }
                        });
                    });
                }
                // Also check if sources are in metadata.sources
                if (content.metadata && content.metadata.sources && Array.isArray(content.metadata.sources)) {
                    console.log('Found sources in metadata.sources field:', content.metadata.sources.length);
                    content.metadata.sources.forEach((source, index) => {
                        generatedContentSources.push({
                            id: `metadata-${content.id}-${index}`,
                            title: source.title || `Source ${index + 1}`,
                            url: source.url,
                            snippet: source.snippet || source.content || 'No description available',
                            agent: mapAgentName(source.source || source.agent),
                            sourceType: determineSourceType(source, source.url),
                            relevanceScore: source.relevanceScore || source.score || 0.5,
                            createdAt: content.createdAt.toISOString(),
                            topicId: topic.id,
                            topicTitle: topic.title,
                            metadata: {
                                confidence: source.confidence,
                                completeness: source.completeness,
                                domain: extractDomain(source.url),
                                sourceAgent: source.source || source.agent,
                                sourceUrl: source.url,
                                sourceTitle: source.title,
                            }
                        });
                    });
                }
            });
        }
        console.log('GeneratedContent sources found:', generatedContentSources.length);
        // Convert VectorDocuments to SourceData
        let vectorSources = allVectorDocuments.map(doc => {
            console.log('VectorDoc metadata:', JSON.stringify(doc.metadata, null, 2));
            return vectorDocumentToSourceData(doc, topic);
        });
        // Combine both sources
        let sources = [...vectorSources, ...generatedContentSources];
        // Apply filters
        if (filters.agent && filters.agent !== 'all') {
            sources = sources.filter(source => source.agent === filters.agent);
        }
        if (filters.sourceType && filters.sourceType !== 'all') {
            sources = sources.filter(source => source.sourceType === filters.sourceType);
        }
        if (filters.minRelevance !== undefined) {
            sources = sources.filter(source => source.relevanceScore >= (filters.minRelevance || 0));
        }
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            sources = sources.filter(source => source.title.toLowerCase().includes(searchLower) ||
                source.snippet.toLowerCase().includes(searchLower));
        }
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            sources = sources.filter(source => new Date(source.createdAt) >= fromDate);
        }
        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            sources = sources.filter(source => new Date(source.createdAt) <= toDate);
        }
        // Remove duplicates based on URL or title
        const uniqueSources = sources.reduce((unique, source) => {
            const key = source.url || source.title;
            const existing = unique.find(s => (s.url && s.url === source.url) || s.title === source.title);
            if (!existing) {
                unique.push(source);
            }
            else if (source.relevanceScore > existing.relevanceScore) {
                // Replace with higher relevance score
                const index = unique.indexOf(existing);
                unique[index] = source;
            }
            return unique;
        }, []);
        console.log('Final sources after deduplication:', uniqueSources.length);
        console.log('Sample sources:', uniqueSources.slice(0, 3).map(s => ({
            title: s.title,
            agent: s.agent,
            url: s.url
        })));
        return {
            sources: uniqueSources.map(source => ({
                ...source,
                metadata: source.metadata || {}
            })),
            totalCount: uniqueSources.length,
            topicTitle: topic.title,
            filters: filters || {}
        };
    }
    catch (error) {
        console.error('Error fetching topic sources:', error);
        throw new HttpError(500, 'Failed to fetch topic sources');
    }
};
/**
 * Get detailed information about a specific source
 */
export const getSourceDetails = async ({ sourceId }, context) => {
    if (!context.user) {
        throw new HttpError(401, 'Authentication required');
    }
    try {
        const vectorDoc = await context.entities.VectorDocument.findUnique({
            where: { id: sourceId },
            include: {
                topic: true
            }
        });
        if (!vectorDoc) {
            throw new HttpError(404, 'Source not found');
        }
        const sourceData = vectorDocumentToSourceData(vectorDoc, vectorDoc.topic);
        return {
            source: {
                ...sourceData,
                metadata: sourceData.metadata || {}
            },
            fullContent: vectorDoc.content,
            embedding: null, // Don't expose the embedding vector
            rawMetadata: vectorDoc.metadata || {}
        };
    }
    catch (error) {
        console.error('Error fetching source details:', error);
        throw new HttpError(500, 'Failed to fetch source details');
    }
};
/**
 * Get sources grouped by research agent
 */
export const getSourcesByAgent = async ({ topicId, agentType }, context) => {
    if (!context.user) {
        throw new HttpError(401, 'Authentication required');
    }
    try {
        // Get all sources for the topic first
        const result = await getTopicSources({ topicId, filters: { agent: agentType } }, context);
        // Group by agent
        const sourcesByAgent = {};
        result.sources.forEach(source => {
            if (!sourcesByAgent[source.agent]) {
                sourcesByAgent[source.agent] = {
                    agent: source.agent,
                    sources: [],
                    totalCount: 0,
                    avgRelevance: 0
                };
            }
            sourcesByAgent[source.agent].sources.push(source);
            sourcesByAgent[source.agent].totalCount++;
        });
        // Calculate average relevance for each agent
        Object.values(sourcesByAgent).forEach(agentGroup => {
            const totalRelevance = agentGroup.sources.reduce((sum, source) => sum + source.relevanceScore, 0);
            agentGroup.avgRelevance = totalRelevance / agentGroup.sources.length;
        });
        return {
            sourcesByAgent: Object.values(sourcesByAgent).map(group => ({
                ...group,
                sources: group.sources.map(source => ({
                    ...source,
                    metadata: source.metadata || {}
                }))
            })),
            totalSources: result?.totalCount || 0,
            topicTitle: result?.topicTitle || ''
        };
    }
    catch (error) {
        console.error('Error fetching sources by agent:', error);
        throw new HttpError(500, 'Failed to fetch sources by agent');
    }
};
/**
 * Fix topics that have content but no sources by triggering research first
 */
export const fixTopicSources = async ({ topicId }, context) => {
    if (!context.user) {
        throw new HttpError(401, 'Authentication required');
    }
    try {
        // Get topic data
        const topic = await context.entities.Topic.findUnique({
            where: { id: topicId },
            include: {
                vectorDocuments: true,
                generatedContent: true
            }
        });
        if (!topic) {
            throw new HttpError(404, 'Topic not found');
        }
        // Check if topic has content but no vector documents (sources)
        const hasContent = topic.generatedContent && topic.generatedContent.length > 0;
        const hasVectorDocs = topic.vectorDocuments && topic.vectorDocuments.length > 0;
        if (hasContent && !hasVectorDocs) {
            console.log(`Topic "${topic.title}" has content but no vector documents. Marking for research...`);
            // Mark topic for research by updating its status
            try {
                await context.entities.Topic.update({
                    where: { id: topic.id },
                    data: {
                        status: 'PENDING_RESEARCH',
                        cacheStatus: 'STALE'
                    }
                });
                // Delete existing content so it can be regenerated with proper sources
                await context.entities.GeneratedContent.deleteMany({
                    where: { topicId: topic.id }
                });
                return {
                    success: true,
                    message: `Marked topic "${topic.title}" for research. Content will be regenerated with proper sources.`,
                    action: 'MARKED_FOR_RESEARCH'
                };
            }
            catch (updateError) {
                console.error('Failed to mark topic for research:', updateError);
                throw new HttpError(500, 'Failed to mark topic for research');
            }
        }
        else if (!hasContent) {
            return {
                success: false,
                message: 'Topic has no content to fix',
                action: 'NO_ACTION_NEEDED'
            };
        }
        else {
            return {
                success: false,
                message: 'Topic already has vector documents (sources)',
                action: 'NO_ACTION_NEEDED'
            };
        }
    }
    catch (error) {
        console.error('Error fixing topic sources:', error);
        throw new HttpError(500, 'Failed to fix topic sources');
    }
};
/**
 * Debug topic data to understand source storage
 */
export const debugTopicData = async ({ topicId }, context) => {
    if (!context.user) {
        throw new HttpError(401, 'Authentication required');
    }
    try {
        // Get complete topic data
        const topic = await context.entities.Topic.findUnique({
            where: { id: topicId },
            include: {
                children: {
                    include: {
                        vectorDocuments: true,
                        generatedContent: true
                    }
                },
                vectorDocuments: true,
                generatedContent: true
            }
        });
        if (!topic) {
            throw new HttpError(404, 'Topic not found');
        }
        // Log raw data structure
        const debugInfo = {
            topic: {
                id: topic.id,
                title: topic.title,
                status: topic.status
            },
            vectorDocuments: {
                count: topic.vectorDocuments?.length || 0,
                samples: (topic.vectorDocuments || []).slice(0, 2).map((doc) => ({
                    id: doc.id,
                    hasContent: !!doc.content,
                    metadataKeys: doc.metadata ? Object.keys(doc.metadata) : [],
                    metadataSample: doc.metadata
                }))
            },
            generatedContent: {
                count: topic.generatedContent?.length || 0,
                items: (topic.generatedContent || []).map((content) => ({
                    id: content.id,
                    contentType: content.contentType,
                    hasContent: !!content.content,
                    sourcesField: {
                        exists: 'sources' in content,
                        type: typeof content.sources,
                        isArray: Array.isArray(content.sources),
                        length: Array.isArray(content.sources) ? content.sources.length : 'n/a',
                        sample: Array.isArray(content.sources) ? content.sources.slice(0, 2) : content.sources
                    },
                    metadataField: {
                        exists: 'metadata' in content,
                        type: typeof content.metadata,
                        keys: content.metadata && typeof content.metadata === 'object' ? Object.keys(content.metadata) : [],
                        hasSources: content.metadata && content.metadata.sources ? true : false,
                        sourcesInMetadata: content.metadata && content.metadata.sources ? {
                            type: typeof content.metadata.sources,
                            isArray: Array.isArray(content.metadata.sources),
                            length: Array.isArray(content.metadata.sources) ? content.metadata.sources.length : 'n/a'
                        } : null
                    }
                }))
            },
            children: {
                count: topic.children?.length || 0,
                summary: (topic.children || []).map((child) => ({
                    title: child.title,
                    vectorDocs: child.vectorDocuments?.length || 0,
                    generatedContent: child.generatedContent?.length || 0
                }))
            }
        };
        console.log('DEBUG TOPIC DATA:', JSON.stringify(debugInfo, null, 2));
        return debugInfo;
    }
    catch (error) {
        console.error('Error debugging topic data:', error);
        throw new HttpError(500, 'Failed to debug topic data');
    }
};
/**
 * Export topic sources in various formats
 */
export const exportTopicSources = async ({ topicId, format = 'json', filters = {} }, context) => {
    if (!context.user) {
        throw new HttpError(401, 'Authentication required');
    }
    try {
        const result = await getTopicSources({ topicId, filters }, context);
        const exportData = {
            metadata: {
                topicTitle: result?.topicTitle || '',
                exportDate: new Date().toISOString(),
                totalSources: result?.totalCount || 0,
                filters: result?.filters || {}
            },
            sources: (result?.sources || []).map(source => ({
                title: source.title,
                url: source.url,
                agent: source.agent,
                sourceType: source.sourceType,
                relevanceScore: source.relevanceScore,
                createdAt: source.createdAt,
                snippet: source.snippet,
                metadata: source.metadata
            }))
        };
        if (format === 'csv') {
            // Convert to CSV format
            const headers = ['Title', 'URL', 'Agent', 'Source Type', 'Relevance Score', 'Date', 'Domain'];
            const csvRows = [
                headers.join(','),
                ...exportData.sources.map(source => [
                    `"${source.title.replace(/"/g, '""')}"`,
                    source.url || '',
                    source.agent,
                    source.sourceType,
                    source.relevanceScore.toFixed(3),
                    source.createdAt,
                    source.metadata?.domain || ''
                ].join(','))
            ];
            return {
                data: csvRows.join('\n'),
                format: 'csv',
                filename: `sources-${(result?.topicTitle || 'topic').toLowerCase().replace(/\s+/g, '-')}.csv`
            };
        }
        // Default to JSON format
        return {
            data: JSON.stringify(exportData, null, 2),
            format: 'json',
            filename: `sources-${(result?.topicTitle || 'topic').toLowerCase().replace(/\s+/g, '-')}.json`
        };
    }
    catch (error) {
        console.error('Error exporting topic sources:', error);
        throw new HttpError(500, 'Failed to export topic sources');
    }
};
//# sourceMappingURL=operations.js.map