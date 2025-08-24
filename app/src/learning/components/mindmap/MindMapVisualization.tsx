import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Connection,
  NodeTypes,
  MarkerType,
  Position,
  useReactFlow,
  ReactFlowProvider,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TopicTreeItem } from '../ui/TopicTree';
import { TopicNode } from './TopicNode';
import { Button } from '../../../components/ui/button';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Download, 
  Search, 
  Minimize,
  RotateCcw,
  Move,
  Focus,
  Grid3X3,
  Circle,
  Zap
} from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';

export type LayoutType = 'hierarchical' | 'radial' | 'force';

export interface MindMapNode extends Node {
  data: {
    topic: TopicTreeItem;
    isHighlighted?: boolean;
    onClick?: (topic: TopicTreeItem) => void;
  };
}

interface MindMapVisualizationProps {
  topics: TopicTreeItem[];
  selectedTopicId?: string;
  onTopicSelect: (topic: TopicTreeItem) => void;
  layout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onExport?: (format: 'png' | 'svg') => void;
}

// Custom node types
const nodeTypes: NodeTypes = {
  topicNode: TopicNode,
};

// Layout algorithms
const getHierarchicalLayout = (topics: TopicTreeItem[]): { nodes: MindMapNode[]; edges: Edge[] } => {
  const nodes: MindMapNode[] = [];
  const edges: Edge[] = [];
  const levelWidth = 300;
  const levelHeight = 150;
  const nodeSpacing = 120;

  const processTopics = (topicList: TopicTreeItem[], level: number, parentX: number = 0, parentY: number = 0, parentId?: string) => {
    const levelTopics = topicList.length;
    const startY = parentY - ((levelTopics - 1) * nodeSpacing) / 2;

    topicList.forEach((topic, index) => {
      const x = level * levelWidth;
      const y = startY + index * nodeSpacing;

      // Create node
      const node: MindMapNode = {
        id: topic.id,
        type: 'topicNode',
        position: { x, y },
        data: {
          topic,
          isHighlighted: false,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
      nodes.push(node);

      // Create edge to parent
      if (parentId) {
        edges.push({
          id: `${parentId}-${topic.id}`,
          source: parentId,
          target: topic.id,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
          style: {
            strokeWidth: 2,
            stroke: getEdgeColor(topic),
          },
        });
      }

      // Process children
      if (topic.children && topic.children.length > 0) {
        processTopics(topic.children, level + 1, x, y, topic.id);
      }
    });
  };

  processTopics(topics, 0);
  return { nodes, edges };
};

const getRadialLayout = (topics: TopicTreeItem[]): { nodes: MindMapNode[]; edges: Edge[] } => {
  const nodes: MindMapNode[] = [];
  const edges: Edge[] = [];
  const centerX = 400;
  const centerY = 300;
  const radiusIncrement = 200;

  const processTopics = (topicList: TopicTreeItem[], level: number, parentAngle: number = 0, parentId?: string) => {
    const radius = level * radiusIncrement;
    const angleStep = (2 * Math.PI) / Math.max(topicList.length, 1);

    topicList.forEach((topic, index) => {
      const angle = parentAngle + (index - (topicList.length - 1) / 2) * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      // Create node
      const node: MindMapNode = {
        id: topic.id,
        type: 'topicNode',
        position: { x, y },
        data: {
          topic,
          isHighlighted: false,
        },
      };
      nodes.push(node);

      // Create edge to parent
      if (parentId) {
        edges.push({
          id: `${parentId}-${topic.id}`,
          source: parentId,
          target: topic.id,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
          style: {
            strokeWidth: 2,
            stroke: getEdgeColor(topic),
          },
        });
      }

      // Process children
      if (topic.children && topic.children.length > 0) {
        processTopics(topic.children, level + 1, angle, topic.id);
      }
    });
  };

  // Add center node for root topics
  if (topics.length > 0) {
    const rootTopic = topics[0];
    nodes.push({
      id: 'center',
      type: 'topicNode',
      position: { x: centerX, y: centerY },
      data: {
        topic: {
          ...rootTopic,
          title: 'Learning Center',
          summary: 'Explore topics radiating from here',
        },
        isHighlighted: false,
      },
    });

    processTopics(topics, 1, 0, 'center');
  }

  return { nodes, edges };
};

const getForceLayout = (topics: TopicTreeItem[]): { nodes: MindMapNode[]; edges: Edge[] } => {
  const nodes: MindMapNode[] = [];
  const edges: Edge[] = [];
  const centerX = 400;
  const centerY = 300;
  const spread = 150;

  const processTopics = (topicList: TopicTreeItem[], level: number, parentId?: string) => {
    topicList.forEach((topic, index) => {
      // Use a simple force-like distribution
      const angle = (index / topicList.length) * 2 * Math.PI;
      const radius = level * spread + Math.random() * 50;
      const x = centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 100;
      const y = centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 100;

      // Create node
      const node: MindMapNode = {
        id: topic.id,
        type: 'topicNode',
        position: { x, y },
        data: {
          topic,
          isHighlighted: false,
        },
      };
      nodes.push(node);

      // Create edge to parent
      if (parentId) {
        edges.push({
          id: `${parentId}-${topic.id}`,
          source: parentId,
          target: topic.id,
          type: 'straight',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
          style: {
            strokeWidth: 2,
            stroke: getEdgeColor(topic),
          },
        });
      }

      // Process children
      if (topic.children && topic.children.length > 0) {
        processTopics(topic.children, level + 1, topic.id);
      }
    });
  };

  processTopics(topics, 0);
  return { nodes, edges };
};

const getEdgeColor = (topic: TopicTreeItem): string => {
  if (topic.userProgress?.completed) return '#10b981'; // green
  if (topic.userProgress && topic.userProgress.timeSpent > 0) return '#3b82f6'; // blue
  return '#6b7280'; // gray
};

// Enhanced MindMapVisualization with interactive features
function MindMapVisualizationInner({
  topics,
  selectedTopicId,
  onTopicSelect,
  layout,
  onLayoutChange,
  searchQuery = '',
  onSearchChange,
  onExport,
}: MindMapVisualizationProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<MindMapNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  
  const reactFlowInstance = useReactFlow();
  const mindMapRef = useRef<HTMLDivElement>(null);

  // Generate layout based on current layout type
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(() => {
    if (topics.length === 0) return { nodes: [], edges: [] };

    switch (layout) {
      case 'hierarchical':
        return getHierarchicalLayout(topics);
      case 'radial':
        return getRadialLayout(topics);
      case 'force':
        return getForceLayout(topics);
      default:
        return getHierarchicalLayout(topics);
    }
  }, [topics, layout]);

  // Update nodes with click handlers and highlighting
  useEffect(() => {
    const updatedNodes = layoutNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onClick: onTopicSelect,
        isHighlighted: !!(
          node.id === selectedTopicId ||
          (localSearchQuery && (
            node.data.topic.title.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
            (node.data.topic.summary && node.data.topic.summary.toLowerCase().includes(localSearchQuery.toLowerCase()))
          ))
        ),
      },
    }));

    setNodes(updatedNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, selectedTopicId, localSearchQuery, onTopicSelect, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    onSearchChange?.(value);
  };

  // Enhanced zoom controls
  const handleZoomIn = useCallback(() => {
    reactFlowInstance.zoomIn();
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance.zoomOut();
  }, [reactFlowInstance]);

  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
  }, [reactFlowInstance]);

  const handleResetView = useCallback(() => {
    reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 800 });
  }, [reactFlowInstance]);

  // Enhanced export functionality
  const handleExport = useCallback(async (format: 'png' | 'svg') => {
    if (!mindMapRef.current) return;

    try {
      // For a real implementation, you would use html2canvas or similar
      // This is a placeholder implementation
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx && mindMapRef.current) {
        const rect = mindMapRef.current.getBoundingClientRect();
        canvas.width = Math.floor(rect.width);
        canvas.height = Math.floor(rect.height);
        
        // Draw a placeholder export
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        ctx.font = '16px Arial';
        ctx.fillText('Mind Map Export', 20, 30);
        ctx.fillText(`Format: ${format.toUpperCase()}`, 20, 60);
        ctx.fillText(`Topics: ${nodes.length}`, 20, 90);
        
        // Create download link
        const link = document.createElement('a');
        link.download = `mindmap-${Date.now()}.${format === 'svg' ? 'svg' : 'png'}`;
        
        if (format === 'png') {
          link.href = canvas.toDataURL('image/png');
        } else {
          // For SVG, create a simple SVG representation
          const svg = `
            <svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="white"/>
              <text x="20" y="30" font-family="Arial" font-size="16">Mind Map Export</text>
              <text x="20" y="60" font-family="Arial" font-size="16">Format: SVG</text>
              <text x="20" y="90" font-family="Arial" font-size="16">Topics: ${nodes.length}</text>
            </svg>
          `;
          const blob = new Blob([svg], { type: 'image/svg+xml' });
          link.href = URL.createObjectURL(blob);
        }
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      onExport?.(format);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [mindMapRef, nodes.length, onExport]);

  // Fullscreen functionality
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      mindMapRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Search highlighting functionality
  useEffect(() => {
    if (!localSearchQuery) {
      setHighlightedNodes(new Set());
      return;
    }

    const highlighted = new Set<string>();
    nodes.forEach(node => {
      const topic = (node as MindMapNode).data.topic;
      const searchLower = localSearchQuery.toLowerCase();
      
      if (
        topic.title.toLowerCase().includes(searchLower) ||
        (topic.summary && topic.summary.toLowerCase().includes(searchLower)) ||
        (topic.description && topic.description.toLowerCase().includes(searchLower))
      ) {
        highlighted.add(node.id);
      }
    });
    
    setHighlightedNodes(highlighted);
  }, [localSearchQuery, nodes]);

  // Focus on search results
  const focusOnSearchResults = useCallback(() => {
    if (highlightedNodes.size === 0) return;

    const highlightedNodesList = nodes.filter(node => highlightedNodes.has(node.id));
    if (highlightedNodesList.length === 0) return;

    // Calculate bounding box of highlighted nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    highlightedNodesList.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + 150); // Approximate node width
      maxY = Math.max(maxY, node.position.y + 80);  // Approximate node height
    });

    // Fit view to highlighted nodes
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;

    reactFlowInstance.fitBounds(
      { x: minX - 50, y: minY - 50, width: width + 100, height: height + 100 },
      { duration: 800 }
    );
  }, [highlightedNodes, nodes, reactFlowInstance]);

  const getNodeStats = () => {
    const total = nodes.length;
    const completed = nodes.filter(node => node.data.topic.userProgress?.completed).length;
    const inProgress = nodes.filter(node => 
      node.data.topic.userProgress && 
      node.data.topic.userProgress.timeSpent > 0 && 
      !node.data.topic.userProgress.completed
    ).length;
    
    return { total, completed, inProgress };
  };

  const stats = getNodeStats();

  return (
    <div 
      ref={mindMapRef}
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-96'} border rounded-lg overflow-hidden`}
    >
      {/* Enhanced Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between bg-background/95 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search in mind map..."
              value={localSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 w-48 h-8"
            />
            {highlightedNodes.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={focusOnSearchResults}
                title="Focus on search results"
              >
                <Focus className="w-3 h-3" />
              </Button>
            )}
          </div>
          
          <div className="flex gap-1">
            <Badge variant="secondary" className="text-xs">
              {stats.completed}/{stats.total} completed
            </Badge>
            {stats.inProgress > 0 && (
              <Badge variant="outline" className="text-xs">
                {stats.inProgress} in progress
              </Badge>
            )}
            {highlightedNodes.size > 0 && (
              <Badge variant="default" className="text-xs">
                {highlightedNodes.size} found
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout Buttons with Icons */}
          <div className="flex border rounded-md">
            <Button
              variant={layout === 'hierarchical' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onLayoutChange('hierarchical')}
              className="rounded-r-none"
              title="Hierarchical Layout"
            >
              <Grid3X3 className="w-4 h-4 mr-1" />
              Tree
            </Button>
            <Button
              variant={layout === 'radial' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onLayoutChange('radial')}
              className="rounded-none border-x"
              title="Radial Layout"
            >
              <Circle className="w-4 h-4 mr-1" />
              Radial
            </Button>
            <Button
              variant={layout === 'force' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onLayoutChange('force')}
              className="rounded-l-none"
              title="Force-Directed Layout"
            >
              <Zap className="w-4 h-4 mr-1" />
              Force
            </Button>
          </div>

          {/* View Controls */}
          <div className="flex border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="rounded-r-none"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="rounded-none border-x"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFitView}
              className="rounded-none border-r"
              title="Fit View"
            >
              <Move className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetView}
              className="rounded-l-none"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Export Buttons */}
          <div className="flex border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleExport('png')}
              className="rounded-r-none"
              title="Export as PNG"
            >
              <Download className="w-4 h-4 mr-1" />
              PNG
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleExport('svg')}
              className="rounded-l-none border-l"
              title="Export as SVG"
            >
              <Download className="w-4 h-4 mr-1" />
              SVG
            </Button>
          </div>

          {/* Fullscreen Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* React Flow with Enhanced Features */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        minZoom={0.05}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        {/* Enhanced Controls */}
        <Controls 
          position="bottom-left"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
          }}
        />
        
        {/* Enhanced MiniMap */}
        <MiniMap 
          position="bottom-right"
          nodeColor={(node) => {
            const mindMapNode = node as MindMapNode;
            const topic = mindMapNode.data.topic;
            
            // Priority: Search highlight > Progress status
            if (highlightedNodes.has(node.id)) {
              return '#f59e0b'; // Amber for search results
            }
            
            // Enhanced color coding with progress intensity
            if (topic.userProgress?.completed) {
              return '#059669'; // Darker green for completed
            }
            
            if (topic.userProgress && topic.userProgress.timeSpent > 0) {
              // Gradient based on time spent (simplified)
              const intensity = Math.min(topic.userProgress.timeSpent / 300, 1); // 5 minutes = full intensity
              const blueIntensity = Math.round(59 + (130 * intensity)); // 59 to 189
              const greenIntensity = Math.round(130 + (112 * intensity)); // 130 to 242
              return `rgb(59, ${greenIntensity}, ${blueIntensity})`;
            }
            
            return '#9ca3af'; // Neutral gray for not started
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
          }}
        />
        
        {/* Enhanced Background */}
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#e2e8f0"
        />

        {/* Search Results Panel */}
        {highlightedNodes.size > 0 && (
          <Panel position="top-right" className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
            <div className="text-sm">
              <div className="font-medium mb-2">Search Results</div>
              <div className="text-muted-foreground">
                Found {highlightedNodes.size} topic{highlightedNodes.size !== 1 ? 's' : ''} matching "{localSearchQuery}"
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={focusOnSearchResults}
                className="mt-2 w-full"
              >
                <Focus className="w-4 h-4 mr-2" />
                Focus Results
              </Button>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* Empty State */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <Card className="p-8 text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Topics to Visualize</h3>
            <p className="text-muted-foreground mb-4">
              Start exploring topics to see them appear in the mind map
            </p>
            <div className="flex justify-center gap-2">
              <Badge variant="outline">Interactive</Badge>
              <Badge variant="outline">Searchable</Badge>
              <Badge variant="outline">Exportable</Badge>
            </div>
          </Card>
        </div>
      )}

      {/* Fullscreen Indicator */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
            Press ESC to exit fullscreen
          </Badge>
        </div>
      )}
    </div>
  );
}

// Wrapper component with ReactFlowProvider
export function MindMapVisualization(props: MindMapVisualizationProps) {
  return (
    <ReactFlowProvider>
      <MindMapVisualizationInner {...props} />
    </ReactFlowProvider>
  );
}