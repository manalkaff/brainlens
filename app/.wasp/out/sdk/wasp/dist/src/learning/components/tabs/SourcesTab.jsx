import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Separator } from '../../../components/ui/separator';
import { Badge } from '../../../components/ui/badge';
import { useTopicContext } from '../../context/TopicContext';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { useTopicSources } from '../../hooks/useTopicSources';
import { fixTopicSources } from 'wasp/client/operations';
import { Search, Filter, Download, Calendar, Star, Globe, FileText, Video, Users, Calculator, BookOpen } from 'lucide-react';
// Agent configuration for display
const agentConfigs = {
    'General': {
        color: 'bg-gray-500',
        icon: <Globe className="w-3 h-3"/>,
        description: 'General web search results'
    },
    'Academic': {
        color: 'bg-blue-600',
        icon: <BookOpen className="w-3 h-3"/>,
        description: 'Academic papers and research'
    },
    'Computational': {
        color: 'bg-green-600',
        icon: <Calculator className="w-3 h-3"/>,
        description: 'Mathematical and computational data'
    },
    'Video': {
        color: 'bg-red-600',
        icon: <Video className="w-3 h-3"/>,
        description: 'Educational videos and tutorials'
    },
    'Social': {
        color: 'bg-purple-600',
        icon: <Users className="w-3 h-3"/>,
        description: 'Community discussions and insights'
    }
};
// Source type configuration
const sourceTypeConfigs = {
    'article': { icon: <FileText className="w-3 h-3"/>, label: 'Article' },
    'video': { icon: <Video className="w-3 h-3"/>, label: 'Video' },
    'academic': { icon: <BookOpen className="w-3 h-3"/>, label: 'Academic' },
    'discussion': { icon: <Users className="w-3 h-3"/>, label: 'Discussion' },
    'documentation': { icon: <FileText className="w-3 h-3"/>, label: 'Documentation' }
};
export function SourcesTab() {
    const { topic, isLoading: topicLoading } = useTopicContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAgent, setSelectedAgent] = useState('all');
    const [selectedSourceType, setSelectedSourceType] = useState('all');
    const [sortBy, setSortBy] = useState('relevance');
    const [viewMode, setViewMode] = useState('cards');
    // Use the sources hook
    const { sources: sourcesData, totalCount, isLoading: isSourcesLoading, error: sourcesError, filters, setFilters, refreshSources, exportSources } = useTopicSources({
        autoRefresh: true
    });
    // Update filters when local state changes
    React.useEffect(() => {
        const newFilters = {
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
    const handleExportSources = async (format = 'json') => {
        try {
            await exportSources(format);
        }
        catch (error) {
            console.error('Failed to export sources:', error);
            // You might want to show a toast or error message here
        }
    };
    if (topicLoading || isSourcesLoading) {
        return <LoadingSkeleton />;
    }
    if (!topic) {
        return (<Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Topic not found</p>
        </CardContent>
      </Card>);
    }
    if (sourcesError) {
        return (<Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Sources</h3>
            <p className="text-muted-foreground mb-4">{sourcesError.message}</p>
            <Button onClick={refreshSources} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>);
    }
    return (<div className="h-full flex flex-col space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent">
            Research Sources
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            All sources used to generate content for <span className="font-medium text-foreground">"{topic.title}"</span> and subtopics
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 text-foreground font-medium">
            <Search className="w-3.5 h-3.5 mr-1.5"/>
            {totalCount} sources found
          </Badge>
          <Button variant="outline" size="sm" onClick={() => handleExportSources('json')} className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200">
            <Download className="w-4 h-4"/>
            Export
          </Button>
          {totalCount === 0 && (<Button variant="default" size="sm" onClick={async () => {
                if (topic?.id) {
                    try {
                        const fixResult = await fixTopicSources({ topicId: topic.id });
                        console.log('FIX RESULT:', fixResult);
                        if (fixResult.success) {
                            alert('Research started! The page will refresh when research is complete and content is regenerated with proper sources.');
                        }
                    }
                    catch (error) {
                        console.error('Fix failed:', error);
                        alert('Failed to fix sources. Check console for details.');
                    }
                }
            }} className="flex items-center gap-2 hover:shadow-lg transition-all duration-200">
              <Search className="w-4 h-4"/>
              Fix Sources
            </Button>)}
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-r from-muted/20 via-background to-muted/20 border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary"/>
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/70"/>
            <Input placeholder="Search sources by title or content..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-11 h-12 border-border/50 bg-background/50 focus:bg-background focus:border-primary/30 transition-all duration-200"/>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-6 items-center">
            {/* Agent Filter */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-foreground min-w-[50px]">Agent:</label>
              <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)} className="px-4 py-2 border border-border/50 rounded-lg text-sm bg-background/50 hover:bg-background focus:bg-background focus:border-primary/30 transition-all duration-200 min-w-[120px]">
                <option value="all">All Agents</option>
                {Object.keys(agentConfigs).map(agent => (<option key={agent} value={agent}>{agent}</option>))}
              </select>
            </div>

            {/* Source Type Filter */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-foreground min-w-[35px]">Type:</label>
              <select value={selectedSourceType} onChange={(e) => setSelectedSourceType(e.target.value)} className="px-4 py-2 border border-border/50 rounded-lg text-sm bg-background/50 hover:bg-background focus:bg-background focus:border-primary/30 transition-all duration-200 min-w-[120px]">
                <option value="all">All Types</option>
                {Object.entries(sourceTypeConfigs).map(([type, config]) => (<option key={type} value={type}>{config.label}</option>))}
              </select>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-foreground min-w-[30px]">Sort:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border border-border/50 rounded-lg text-sm bg-background/50 hover:bg-background focus:bg-background focus:border-primary/30 transition-all duration-200 min-w-[120px]">
                <option value="relevance">Relevance</option>
                <option value="date">Date</option>
                <option value="agent">Agent</option>
              </select>
            </div>

            <Separator orientation="vertical" className="h-8 bg-border/30"/>

            {/* View Mode - Hidden since we're using grid layout */}
            <div className="hidden items-center gap-2 bg-muted/30 rounded-lg p-1 border border-border/30">
              {['cards', 'list', 'hierarchy'].map(mode => (<Button key={mode} variant={viewMode === mode ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode(mode)} className="px-4 py-2 text-xs h-8 font-medium transition-all duration-200">
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sources Grid */}
      <div className="flex-1 overflow-auto">
        {filteredAndSortedSources.length === 0 ? (<Card className="bg-gradient-to-br from-muted/30 via-background to-muted/20">
            <CardContent className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <Search className="w-16 h-16 mx-auto text-muted-foreground/50 mb-6"/>
                <h3 className="text-xl font-semibold mb-3 text-foreground">No sources found</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Try adjusting your search criteria or filters to discover more learning resources.
                </p>
              </div>
            </CardContent>
          </Card>) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {filteredAndSortedSources.map((source, index) => (<SourceCard key={source.id} source={source} index={index}/>))}
          </div>)}
      </div>
    </div>);
}
function SourceCard({ source, index = 0 }) {
    const agentConfig = agentConfigs[source.agent];
    const sourceTypeConfig = sourceTypeConfigs[source.sourceType];
    return (<Card className="h-fit group bg-gradient-to-br from-card via-card to-card/80 transition-all duration-500 ease-out hover:shadow-2xl hover:-translate-y-2 hover:border-primary/30 focus-within:shadow-2xl focus-within:border-primary/30 border border-border/50 hover:border-border shadow-lg" style={{
            animationDelay: `${index * 50}ms`,
        }}>
      <CardHeader className="pb-4">
        <div className="space-y-3">
          {/* Agent and Type Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${agentConfig.color} text-white text-xs px-2.5 py-1 font-medium shadow-sm`}>
              {agentConfig.icon}
              <span className="ml-1.5">{source.agent}</span>
            </Badge>
            <Badge variant="outline" className="text-xs px-2.5 py-1 font-medium bg-background/50 border-primary/20">
              {sourceTypeConfig.icon}
              <span className="ml-1.5">{sourceTypeConfig.label}</span>
            </Badge>
            <div className="flex items-center gap-1 ml-auto">
              <Star className="w-3.5 h-3.5 text-yellow-500"/>
              <span className="text-xs font-medium text-muted-foreground">
                {(source.relevanceScore * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          
          {/* Title */}
          {source.url ? (<a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-base leading-snug text-foreground line-clamp-2 hover:text-primary transition-colors duration-200 cursor-pointer" title={`Open: ${source.title}`}>
              {source.title}
            </a>) : (<h3 className="font-semibold text-base leading-snug text-foreground line-clamp-2">
              {source.title}
            </h3>)}
          
          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3"/>
              <span>{new Date(source.createdAt).toLocaleDateString()}</span>
            </div>
            {source.metadata?.domain && (<div className="flex items-center gap-1">
                <Globe className="w-3 h-3"/>
                <span className="truncate max-w-[120px]">{source.metadata.domain}</span>
              </div>)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        {/* Snippet */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
          {source.snippet}
        </p>
      </CardContent>
    </Card>);
}
//# sourceMappingURL=SourcesTab.jsx.map