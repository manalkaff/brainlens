import React from 'react';
import { Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TopicTreeItem } from '../ui/TopicTree';
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
}
export declare function MindMapVisualization(props: MindMapVisualizationProps): React.JSX.Element;
export {};
//# sourceMappingURL=MindMapVisualization.d.ts.map