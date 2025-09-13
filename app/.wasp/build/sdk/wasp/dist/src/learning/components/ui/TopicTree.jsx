import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Search, BookOpen, CheckCircle, Clock, Bookmark } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
function TopicNode({ topic, path, level, isSelected, isExpanded, selectedTopicPath, expandedNodes, onToggleExpand, onSelect, onGenerateSubtopics, isGenerating, searchQuery }) {
    const hasChildren = topic.children && topic.children.length > 0;
    const canExpand = hasChildren || (level < 3 && onGenerateSubtopics); // Max 3 levels deep
    const isCompleted = topic.userProgress?.completed || false;
    const hasProgress = topic.userProgress && topic.userProgress.timeSpent > 0;
    const isBookmarked = topic.userProgress?.bookmarks && topic.userProgress.bookmarks.length > 0;
    // Highlight search matches
    const highlightText = (text, query) => {
        if (!query)
            return text;
        const regex = new RegExp(`(${query})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, index) => regex.test(part) ? (<mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>) : part);
    };
    const getStatusIcon = () => {
        if (isCompleted) {
            return <CheckCircle className="w-4 h-4 text-green-500"/>;
        }
        if (hasProgress) {
            return <Clock className="w-4 h-4 text-blue-500"/>;
        }
        return <BookOpen className="w-4 h-4 text-muted-foreground"/>;
    };
    const getStatusColor = () => {
        if (isCompleted)
            return 'border-l-green-500 bg-green-50 dark:bg-green-950';
        if (hasProgress)
            return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950';
        return 'border-l-muted bg-background';
    };
    return (<div className="space-y-1">
      <div className={`
          flex items-center gap-2 p-2 rounded-lg border-l-2 cursor-pointer transition-all
          ${getStatusColor()}
          ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:bg-muted/50'}
        `} style={{ marginLeft: `${level * 20}px` }} onClick={() => onSelect(topic, path)}>
        {/* Expand/Collapse Button */}
        {canExpand && (<Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) {
                    onToggleExpand(topic.id);
                }
                else if (onGenerateSubtopics && !isGenerating) {
                    onGenerateSubtopics(topic.id);
                }
            }} disabled={isGenerating}>
            {hasChildren ? (isExpanded ? (<ChevronDown className="w-4 h-4"/>) : (<ChevronRight className="w-4 h-4"/>)) : (<ChevronRight className="w-4 h-4 opacity-50"/>)}
          </Button>)}

        {/* Status Icon */}
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>

        {/* Topic Title */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {highlightText(topic.title, searchQuery || '')}
          </div>
          {topic.summary && (<div className="text-xs text-muted-foreground truncate">
              {highlightText(topic.summary, searchQuery || '')}
            </div>)}
        </div>

        {/* Badges and Indicators */}
        <div className="flex items-center gap-1">
          {isBookmarked && (<Bookmark className="w-3 h-3 text-yellow-500"/>)}
          
          {topic.userProgress?.timeSpent && topic.userProgress.timeSpent > 0 && (<Badge variant="secondary" className="text-xs">
              {Math.round(topic.userProgress.timeSpent / 60)}m
            </Badge>)}

          {hasChildren && (<Badge variant="outline" className="text-xs">
              {topic.children.length}
            </Badge>)}
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (<div className="space-y-1">
          {topic.children.map((child) => {
                const childPath = [...path, child.id];
                const isChildSelected = selectedTopicPath.length > 0 &&
                    selectedTopicPath[selectedTopicPath.length - 1] === child.id &&
                    selectedTopicPath.slice(0, -1).join('/') === path.join('/');
                return (<TopicNode key={child.id} topic={child} path={childPath} level={level + 1} isSelected={isChildSelected} isExpanded={expandedNodes.has(child.id)} selectedTopicPath={selectedTopicPath} expandedNodes={expandedNodes} onToggleExpand={onToggleExpand} onSelect={onSelect} onGenerateSubtopics={onGenerateSubtopics} isGenerating={isGenerating} searchQuery={searchQuery}/>);
            })}
        </div>)}

      {/* Generate Subtopics Button */}
      {!hasChildren && level < 3 && onGenerateSubtopics && isExpanded && (<div style={{ marginLeft: `${(level + 1) * 20}px` }}>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onGenerateSubtopics(topic.id)} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate Subtopics'}
          </Button>
        </div>)}
    </div>);
}
export function TopicTree({ topics, selectedTopicPath, onTopicSelect, onGenerateSubtopics, expandedNodes, onToggleExpand, isGenerating = false, searchQuery = '', onSearchChange, compact = false }) {
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
    // Filter topics based on search query with enhanced search capabilities
    const filteredTopics = useMemo(() => {
        if (!searchQuery)
            return topics;
        const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
        const filterTopics = (topicList) => {
            return topicList.reduce((acc, topic) => {
                // Enhanced search matching
                const searchableText = [
                    topic.title,
                    topic.summary || '',
                    topic.description || '',
                    ...(topic.metadata?.tags || [])
                ].join(' ').toLowerCase();
                const matchesSearch = searchTerms.every(term => searchableText.includes(term));
                // Also check if any content sections match (if available)
                const contentMatches = topic.metadata?.contentSections?.some((section) => searchTerms.some(term => section.toLowerCase().includes(term))) || false;
                const filteredChildren = filterTopics(topic.children || []);
                if (matchesSearch || contentMatches || filteredChildren.length > 0) {
                    acc.push({
                        ...topic,
                        children: filteredChildren
                    });
                    // Auto-expand nodes that have matching children or content
                    if (filteredChildren.length > 0 || contentMatches) {
                        onToggleExpand(topic.id);
                    }
                }
                return acc;
            }, []);
        };
        return filterTopics(topics);
    }, [topics, searchQuery]);
    // Use the passed onToggleExpand handler instead of local state
    const handleToggleExpand = onToggleExpand;
    const handleSearchChange = (value) => {
        setLocalSearchQuery(value);
        onSearchChange?.(value);
    };
    const getTopicStats = () => {
        const countTopics = (topicList) => {
            return topicList.reduce((acc, topic) => {
                const childStats = countTopics(topic.children || []);
                return {
                    total: acc.total + 1 + childStats.total,
                    completed: acc.completed + (topic.userProgress?.completed ? 1 : 0) + childStats.completed,
                    inProgress: acc.inProgress +
                        (topic.userProgress && topic.userProgress.timeSpent > 0 && !topic.userProgress.completed ? 1 : 0) +
                        childStats.inProgress
                };
            }, { total: 0, completed: 0, inProgress: 0 });
        };
        return countTopics(topics);
    };
    const stats = getTopicStats();
    if (compact) {
        return (<div className="space-y-4">

        {/* Topic Tree */}
        <div className="space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          {filteredTopics.length > 0 ? (filteredTopics.map((topic) => {
                const topicPath = [topic.id];
                const isTopicSelected = selectedTopicPath.length > 0 &&
                    selectedTopicPath[0] === topic.id &&
                    selectedTopicPath.length === 1;
                return (<TopicNode key={topic.id} topic={topic} path={topicPath} level={0} isSelected={isTopicSelected} isExpanded={expandedNodes.has(topic.id)} selectedTopicPath={selectedTopicPath} expandedNodes={expandedNodes} onToggleExpand={handleToggleExpand} onSelect={onTopicSelect} onGenerateSubtopics={onGenerateSubtopics} isGenerating={isGenerating} searchQuery={searchQuery}/>);
            })) : searchQuery ? (<div className="text-center py-6 text-muted-foreground">
              <Search className="w-6 h-6 mx-auto mb-2 opacity-50"/>
              <p className="text-xs">No matches found</p>
            </div>) : (<div className="text-center py-6 text-muted-foreground">
              <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-50"/>
              <p className="text-xs">No topics available</p>
            </div>)}
        </div>

      </div>);
    }
    return (<Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5"/>
            Topic Structure
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{stats.completed}/{stats.total} completed</Badge>
            {stats.inProgress > 0 && (<Badge variant="outline">{stats.inProgress} in progress</Badge>)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
          <Input placeholder="Search topics..." value={localSearchQuery} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10"/>
        </div>

        {/* Topic Tree */}
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {filteredTopics.length > 0 ? (filteredTopics.map((topic) => {
            const topicPath = [topic.id];
            const isTopicSelected = selectedTopicPath.length > 0 &&
                selectedTopicPath[0] === topic.id &&
                selectedTopicPath.length === 1;
            return (<TopicNode key={topic.id} topic={topic} path={topicPath} level={0} isSelected={isTopicSelected} isExpanded={expandedNodes.has(topic.id)} selectedTopicPath={selectedTopicPath} expandedNodes={expandedNodes} onToggleExpand={handleToggleExpand} onSelect={onTopicSelect} onGenerateSubtopics={onGenerateSubtopics} isGenerating={isGenerating} searchQuery={searchQuery}/>);
        })) : localSearchQuery ? (<div className="text-center py-8 text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50"/>
              <p>No topics found matching "{localSearchQuery}"</p>
            </div>) : (<div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50"/>
              <p>No topics available</p>
            </div>)}
        </div>

        {/* Quick Actions */}
        {topics.length > 0 && (<div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={() => {
                // Expand all nodes by calling onToggleExpand for each collapsed node
                const collectIds = (topicList) => {
                    topicList.forEach(topic => {
                        if (!expandedNodes.has(topic.id)) {
                            onToggleExpand(topic.id);
                        }
                        collectIds(topic.children || []);
                    });
                };
                collectIds(topics);
            }}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
                // Collapse all nodes by calling onToggleExpand for each expanded node
                expandedNodes.forEach(nodeId => {
                    onToggleExpand(nodeId);
                });
            }}>
              Collapse All
            </Button>
          </div>)}
      </CardContent>
    </Card>);
}
//# sourceMappingURL=TopicTree.jsx.map