import React, { useCallback, useMemo, useEffect } from 'react';
import { ReactFlow, addEdge, useNodesState, useEdgesState, Controls, Background, BackgroundVariant, MarkerType, Position, useReactFlow, ReactFlowProvider, } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TopicNode } from './TopicNode';
import { Card } from '../../../components/ui/card';
// Custom node types
const nodeTypes = {
    topicNode: TopicNode,
};
// Layout algorithms
const getHierarchicalLayout = (topics) => {
    const nodes = [];
    const edges = [];
    const levelWidth = 300;
    const levelHeight = 150;
    const nodeSpacing = 120;
    const processTopics = (topicList, level, parentX = 0, parentY = 0, parentId) => {
        const levelTopics = topicList.length;
        const startY = parentY - ((levelTopics - 1) * nodeSpacing) / 2;
        topicList.forEach((topic, index) => {
            const x = level * levelWidth;
            const y = startY + index * nodeSpacing;
            // Create node
            const node = {
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
const getRadialLayout = (topics) => {
    const nodes = [];
    const edges = [];
    const centerX = 400;
    const centerY = 300;
    const radiusIncrement = 200;
    const processTopics = (topicList, level, parentAngle = 0, parentId) => {
        const radius = level * radiusIncrement;
        const angleStep = (2 * Math.PI) / Math.max(topicList.length, 1);
        topicList.forEach((topic, index) => {
            const angle = parentAngle + (index - (topicList.length - 1) / 2) * angleStep;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            // Create node
            const node = {
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
const getForceLayout = (topics) => {
    const nodes = [];
    const edges = [];
    const centerX = 400;
    const centerY = 300;
    const spread = 150;
    const processTopics = (topicList, level, parentId) => {
        topicList.forEach((topic, index) => {
            // Use a simple force-like distribution
            const angle = (index / topicList.length) * 2 * Math.PI;
            const radius = level * spread + Math.random() * 50;
            const x = centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 100;
            const y = centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 100;
            // Create node
            const node = {
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
const getEdgeColor = (topic) => {
    if (topic.userProgress?.completed)
        return '#10b981'; // green
    if (topic.userProgress && topic.userProgress.timeSpent > 0)
        return '#3b82f6'; // blue
    return '#6b7280'; // gray
};
// Simple MindMapVisualization with full screen canvas
function MindMapVisualizationInner({ topics, selectedTopicId, onTopicSelect, }) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const reactFlowInstance = useReactFlow();
    // Generate hierarchical layout
    const { nodes: layoutNodes, edges: layoutEdges } = useMemo(() => {
        if (topics.length === 0)
            return { nodes: [], edges: [] };
        return getHierarchicalLayout(topics);
    }, [topics]);
    // Update nodes with click handlers
    useEffect(() => {
        const updatedNodes = layoutNodes.map((node) => ({
            ...node,
            data: {
                ...node.data,
                onClick: onTopicSelect,
                isHighlighted: node.id === selectedTopicId,
            },
        }));
        setNodes(updatedNodes);
        setEdges(layoutEdges);
    }, [layoutNodes, layoutEdges, selectedTopicId, onTopicSelect, setNodes, setEdges]);
    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
    return (<div className="h-full w-full">
      <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={nodeTypes} fitView fitViewOptions={{
            padding: 0.2,
            includeHiddenNodes: false,
        }} minZoom={0.1} maxZoom={2} defaultViewport={{ x: 0, y: 0, zoom: 0.8 }} attributionPosition="bottom-left" proOptions={{ hideAttribution: true }} className="bg-background">
        <Controls position="bottom-left" showZoom={true} showFitView={true} showInteractive={false}/>
        
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--muted))"/>
      </ReactFlow>

      {/* Empty State */}
      {nodes.length === 0 && (<div className="absolute inset-0 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <h3 className="text-lg font-medium mb-2">No Topics to Visualize</h3>
            <p className="text-muted-foreground">
              Start exploring topics to see them appear in the mind map
            </p>
          </Card>
        </div>)}
    </div>);
}
// Wrapper component with ReactFlowProvider
export function MindMapVisualization(props) {
    return (<ReactFlowProvider>
      <MindMapVisualizationInner {...props}/>
    </ReactFlowProvider>);
}
//# sourceMappingURL=MindMapVisualization.jsx.map