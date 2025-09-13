import { useState, useCallback, useEffect } from 'react';
import { getTopicSources, getSourceDetails, getSourcesByAgent, exportTopicSources } from 'wasp/client/operations';
import { useTopicContext } from '../context/TopicContext';
export function useTopicSources(options = {}) {
    const { topic } = useTopicContext();
    const { initialFilters = {}, autoRefresh = true } = options;
    const [filters, setFilters] = useState(initialFilters);
    const [sources, setSources] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    // Fetch sources from API
    const fetchSources = useCallback(async () => {
        if (!topic?.id)
            return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await getTopicSources({
                topicId: topic.id,
                filters
            });
            setSources(result?.sources || []);
            setTotalCount(result?.totalCount || 0);
        }
        catch (err) {
            console.error('Failed to fetch topic sources:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch sources'));
            setSources([]);
            setTotalCount(0);
        }
        finally {
            setIsLoading(false);
        }
    }, [topic?.id, filters]);
    // Auto-refresh when topic or filters change
    useEffect(() => {
        if (autoRefresh && topic?.id) {
            fetchSources();
        }
    }, [fetchSources, autoRefresh, topic?.id]);
    // Update filters and refetch when filters change
    const updateFilters = useCallback((newFilters) => {
        setFilters(newFilters);
    }, []);
    // Refetch when filters change
    useEffect(() => {
        if (topic?.id) {
            fetchSources();
        }
    }, [filters, fetchSources, topic?.id]);
    // Export sources
    const exportSources = useCallback(async (format = 'json') => {
        if (!topic?.id)
            return;
        try {
            const result = await exportTopicSources({
                topicId: topic.id,
                format,
                filters
            });
            // Create and download file
            const blob = new Blob([result?.data || ''], {
                type: format === 'json' ? 'application/json' : 'text/csv'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result?.filename || `sources-${topic.slug || 'topic'}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        catch (err) {
            console.error('Failed to export sources:', err);
            throw err;
        }
    }, [topic?.id, filters]);
    const refreshSources = useCallback(() => {
        fetchSources();
    }, [fetchSources]);
    return {
        sources,
        totalCount,
        isLoading,
        error,
        filters,
        setFilters: updateFilters,
        refreshSources,
        exportSources
    };
}
// Hook for getting detailed source information
export function useSourceDetails(sourceId) {
    const [sourceDetails, setSourceDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchSourceDetails = useCallback(async () => {
        if (!sourceId)
            return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await getSourceDetails({ sourceId });
            setSourceDetails(result);
        }
        catch (err) {
            console.error('Failed to fetch source details:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch source details'));
            setSourceDetails(null);
        }
        finally {
            setIsLoading(false);
        }
    }, [sourceId]);
    useEffect(() => {
        if (sourceId) {
            fetchSourceDetails();
        }
        else {
            setSourceDetails(null);
            setError(null);
        }
    }, [fetchSourceDetails, sourceId]);
    return {
        sourceDetails,
        isLoading,
        error,
        refreshDetails: fetchSourceDetails
    };
}
// Hook for getting sources grouped by agent
export function useSourcesByAgent(agentType) {
    const { topic } = useTopicContext();
    const [sourcesByAgent, setSourcesByAgent] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchSourcesByAgent = useCallback(async () => {
        if (!topic?.id)
            return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await getSourcesByAgent({
                topicId: topic.id,
                agentType
            });
            setSourcesByAgent(result?.sourcesByAgent || []);
        }
        catch (err) {
            console.error('Failed to fetch sources by agent:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch sources by agent'));
            setSourcesByAgent([]);
        }
        finally {
            setIsLoading(false);
        }
    }, [topic?.id, agentType]);
    useEffect(() => {
        if (topic?.id) {
            fetchSourcesByAgent();
        }
    }, [fetchSourcesByAgent, topic?.id]);
    return {
        sourcesByAgent,
        isLoading,
        error,
        refreshSourcesByAgent: fetchSourcesByAgent
    };
}
//# sourceMappingURL=useTopicSources.js.map