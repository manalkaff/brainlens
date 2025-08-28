import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Separator } from '../../../components/ui/separator';
import { Badge } from '../../../components/ui/badge';
import { useTopicContext } from '../../context/TopicContext';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { useTopicSources, type SourceData, type SourceFilters } from '../../hooks/useTopicSources';
import { fixTopicSources } from 'wasp/client/operations';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Download, 
  Calendar,
  Star,
  Globe,
  FileText,
  Video,
  Users,
  Calculator,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  Copy
} from 'lucide-react';

// Type alias for backward compatibility
type Source = SourceData;

// Agent configuration for display
const agentConfigs = {
  'General': { 
    color: 'bg-gray-500', 
    icon: <Globe className="w-3 h-3" />,
    description: 'General web search results'
  },
  'Academic': { 
    color: 'bg-blue-600', 
    icon: <BookOpen className="w-3 h-3" />,
    description: 'Academic papers and research'
  },
  'Computational': { 
    color: 'bg-green-600', 
    icon: <Calculator className="w-3 h-3" />,
    description: 'Mathematical and computational data'
  },
  'Video': { 
    color: 'bg-red-600', 
    icon: <Video className="w-3 h-3" />,
    description: 'Educational videos and tutorials'
  },
  'Social': { 
    color: 'bg-purple-600', 
    icon: <Users className="w-3 h-3" />,
    description: 'Community discussions and insights'
  }
};

// Source type configuration
const sourceTypeConfigs = {
  'article': { icon: <FileText className="w-3 h-3" />, label: 'Article' },
  'video': { icon: <Video className="w-3 h-3" />, label: 'Video' },
  'academic': { icon: <BookOpen className="w-3 h-3" />, label: 'Academic' },
  'discussion': { icon: <Users className="w-3 h-3" />, label: 'Discussion' },
  'documentation': { icon: <FileText className="w-3 h-3" />, label: 'Documentation' }
};

export function SourcesTab() {
  const { topic, isLoading: topicLoading } = useTopicContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedSourceType, setSelectedSourceType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'agent'>('relevance');
  const [viewMode, setViewMode] = useState<'list' | 'cards' | 'hierarchy'>('cards');
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  // Use the sources hook
  const {
    sources: sourcesData,
    totalCount,
    isLoading: isSourcesLoading,
    error: sourcesError,
    filters,
    setFilters,
    refreshSources,
    exportSources
  } = useTopicSources({
    autoRefresh: true
  });

  // Update filters when local state changes
  React.useEffect(() => {
    const newFilters: SourceFilters = {
      agent: selectedAgent === 'all' ? undefined : selectedAgent,
      sourceType: selectedSourceType === 'all' ? undefined : selectedSourceType,
      search: searchQuery || undefined
    };
    setFilters(newFilters);
  }, [searchQuery, selectedAgent, selectedSourceType, setFilters]);

  // Filter and sort sources
  const filteredAndSortedSources = useMemo(() => {
    let filtered = [...sourcesData];

    // Sort sources
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return b.relevanceScore - a.relevanceScore;
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'agent':
          return a.agent.localeCompare(b.agent);
        default:
          return 0;
      }
    });

    return filtered;
  }, [sourcesData, sortBy]);

  const toggleSourceExpansion = (sourceId: string) => {
    setExpandedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sourceId)) {
        newSet.delete(sourceId);
      } else {
        newSet.add(sourceId);
      }
      return newSet;
    });
  };

  const handleExportSources = async (format: 'json' | 'csv' = 'json') => {
    try {
      await exportSources(format);
    } catch (error) {
      console.error('Failed to export sources:', error);
      // You might want to show a toast or error message here
    }
  };


  if (topicLoading || isSourcesLoading) {
    return <LoadingSkeleton />;
  }

  if (!topic) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Topic not found</p>
        </CardContent>
      </Card>
    );
  }

  if (sourcesError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Sources</h3>
            <p className="text-muted-foreground mb-4">{sourcesError.message}</p>
            <Button onClick={refreshSources} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Research Sources</h2>
          <p className="text-muted-foreground">
            All sources used to generate content for "{topic.title}" and subtopics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {totalCount} sources found
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportSources('json')}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          {totalCount === 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                if (topic?.id) {
                  try {
                    const fixResult = await fixTopicSources({ topicId: topic.id });
                    console.log('FIX RESULT:', fixResult);
                    if (fixResult.success) {
                      alert('Research started! The page will refresh when research is complete and content is regenerated with proper sources.');
                    }
                  } catch (error) {
                    console.error('Fix failed:', error);
                    alert('Failed to fix sources. Check console for details.');
                  }
                }
              }}
              className="flex items-center gap-2"
            >
              Fix Sources
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search sources by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Agent Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Agent:</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="all">All Agents</option>
                {Object.keys(agentConfigs).map(agent => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>

            {/* Source Type Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Type:</label>
              <select
                value={selectedSourceType}
                onChange={(e) => setSelectedSourceType(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="all">All Types</option>
                {Object.entries(sourceTypeConfigs).map(([type, config]) => (
                  <option key={type} value={type}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Date</option>
                <option value="agent">Agent</option>
              </select>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* View Mode */}
            <div className="flex items-center gap-1 border rounded-md p-1">
              {['cards', 'list', 'hierarchy'].map(mode => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode(mode as any)}
                  className="px-3 py-1 text-xs h-7"
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sources List */}
      <div className="flex-1 overflow-auto">
        {filteredAndSortedSources.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sources found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedSources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                isExpanded={expandedSources.has(source.id)}
                onToggleExpand={() => toggleSourceExpansion(source.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Individual Source Card Component
interface SourceCardProps {
  source: Source;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function SourceCard({ source, isExpanded, onToggleExpand }: SourceCardProps) {
  const agentConfig = agentConfigs[source.agent];
  const sourceTypeConfig = sourceTypeConfigs[source.sourceType];
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${agentConfig.color} text-white text-xs px-2 py-1`}>
                {agentConfig.icon}
                <span className="ml-1">{source.agent}</span>
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-1">
                {sourceTypeConfig.icon}
                <span className="ml-1">{sourceTypeConfig.label}</span>
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-muted-foreground">
                  {(source.relevanceScore * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            
            <h3 className="font-semibold text-base mb-2 leading-tight">
              {source.title}
            </h3>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(source.createdAt).toLocaleDateString()}
              </div>
              {source.metadata?.domain && (
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {source.metadata.domain}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 ml-4">
            {source.url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(source.url, '_blank')}
                className="h-8 w-8 p-0"
                title="Open source"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(source.url || source.title)}
              className="h-8 w-8 p-0"
              title="Copy link"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="h-8 w-8 p-0"
              title={isExpanded ? "Collapse" : "Expand details"}
            >
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          {source.snippet}
        </p>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t pt-4 space-y-3">
            {source.metadata && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                {source.metadata.confidence !== undefined && (
                  <div>
                    <label className="font-medium text-muted-foreground">Confidence:</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${source.metadata.confidence * 100}%` }}
                        />
                      </div>
                      <span>{(source.metadata.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}
                {source.metadata.completeness !== undefined && (
                  <div>
                    <label className="font-medium text-muted-foreground">Completeness:</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${source.metadata.completeness * 100}%` }}
                        />
                      </div>
                      <span>{(source.metadata.completeness * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}
                {source.metadata.author && (
                  <div>
                    <label className="font-medium text-muted-foreground">Author:</label>
                    <p className="mt-1">{source.metadata.author}</p>
                  </div>
                )}
              </div>
            )}

            {source.url && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(source.url, '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Original Source
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}