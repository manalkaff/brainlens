import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Switch } from '../../../components/ui/switch';
import { Slider } from '../../../components/ui/slider';
import { useTopicContext } from '../../context/TopicContext';
import { MindMapVisualization } from '../mindmap/MindMapVisualization';
import { useMindMap } from '../../hooks/useMindMap';
import { 
  LayoutGrid, 
  Filter, 
  BarChart3, 
  Settings,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';

export function MindMapTab() {
  const { topic, isLoading } = useTopicContext();

  // Convert topic tree to flat array for mind map
  const topics = useMemo(() => {
    if (!topic) return [];
    
    const flattenTopics = (topicItem: any): any[] => {
      const result = [topicItem];
      if (topicItem.children) {
        topicItem.children.forEach((child: any) => {
          result.push(...flattenTopics(child));
        });
      }
      return result;
    };
    
    return flattenTopics(topic);
  }, [topic]);

  const mindMap = useMindMap({
    topics,
    selectedTopicId: topic?.id || undefined,
    onTopicSelect: (selectedTopic) => {
      // Handle topic selection - could navigate or show details
      console.log('Selected topic:', selectedTopic);
    },
    defaultLayout: 'hierarchical'
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
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

  return (
    <div className="space-y-6">
      {/* Mind Map Visualization */}
      <MindMapVisualization
        topics={mindMap.filteredTopics}
        selectedTopicId={topic?.id}
        onTopicSelect={mindMap.handleTopicSelect}
        layout={mindMap.layout}
        onLayoutChange={mindMap.handleLayoutChange}
        searchQuery={mindMap.searchQuery}
        onSearchChange={mindMap.handleSearchChange}
        onExport={mindMap.exportMindMap}
      />

      {/* Mind Map Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Layout & View Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LayoutGrid className="w-4 h-4 mr-2" />
              Layout & View
            </CardTitle>
            <CardDescription>
              Customize the mind map appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Layout Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Layout Type</label>
              <div className="flex flex-col space-y-2">
                <Button
                  variant={mindMap.layout === 'hierarchical' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => mindMap.handleLayoutChange('hierarchical')}
                  className="justify-start"
                >
                  Hierarchical Tree
                </Button>
                <Button
                  variant={mindMap.layout === 'radial' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => mindMap.handleLayoutChange('radial')}
                  className="justify-start"
                >
                  Radial Layout
                </Button>
                <Button
                  variant={mindMap.layout === 'force' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => mindMap.handleLayoutChange('force')}
                  className="justify-start"
                >
                  Force-Directed
                </Button>
              </div>
            </div>

            {/* Depth Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Depth Range: {mindMap.filters.minDepth} - {mindMap.filters.maxDepth}
              </label>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground">Min Depth</label>
                  <Slider
                    value={[mindMap.filters.minDepth]}
                    onValueChange={([value]) => mindMap.updateFilters({ minDepth: value })}
                    max={3}
                    min={0}
                    step={1}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Max Depth</label>
                  <Slider
                    value={[mindMap.filters.maxDepth]}
                    onValueChange={([value]) => mindMap.updateFilters({ maxDepth: value })}
                    max={3}
                    min={0}
                    step={1}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </CardTitle>
            <CardDescription>
              Show or hide topics by status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Filters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Completed</span>
                </div>
                <Switch
                  checked={mindMap.filters.showCompleted}
                  onCheckedChange={(checked) => mindMap.updateFilters({ showCompleted: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">In Progress</span>
                </div>
                <Switch
                  checked={mindMap.filters.showInProgress}
                  onCheckedChange={(checked) => mindMap.updateFilters({ showInProgress: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-sm">Not Started</span>
                </div>
                <Switch
                  checked={mindMap.filters.showNotStarted}
                  onCheckedChange={(checked) => mindMap.updateFilters({ showNotStarted: checked })}
                />
              </div>
            </div>

            {/* Reset Filters */}
            <Button
              variant="outline"
              size="sm"
              onClick={mindMap.resetFilters}
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistics
            </CardTitle>
            <CardDescription>
              Mind map overview and progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Stats */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Topics</span>
                <Badge variant="secondary">{mindMap.statistics.all.total}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Visible</span>
                <Badge variant="outline">{mindMap.statistics.filtered.total}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Completion</span>
                <Badge variant="default">
                  {mindMap.statistics.all.completionPercentage}%
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Time</span>
                <Badge variant="secondary">
                  {Math.round(mindMap.statistics.all.totalTimeSpent / 60)}m
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Bookmarks</span>
                <Badge variant="outline">
                  {mindMap.statistics.all.totalBookmarks}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Max Depth</span>
                <Badge variant="secondary">
                  Level {mindMap.statistics.all.maxDepth}
                </Badge>
              </div>
            </div>

            {/* Progress Breakdown */}
            <div className="pt-3 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Completed</span>
                <span>{mindMap.statistics.all.completed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-600">In Progress</span>
                <span>{mindMap.statistics.all.inProgress}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Not Started</span>
                <span>{mindMap.statistics.all.notStarted}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Export & Actions
          </CardTitle>
          <CardDescription>
            Save, share, or manipulate your mind map
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline"
              onClick={() => mindMap.exportMindMap('png')}
            >
              Export as PNG
            </Button>
            <Button 
              variant="outline"
              onClick={() => mindMap.exportMindMap('svg')}
            >
              Export as SVG
            </Button>
            <Button 
              variant="outline"
              onClick={mindMap.toggleFullscreen}
            >
              {mindMap.isFullscreen ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Fullscreen View
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}