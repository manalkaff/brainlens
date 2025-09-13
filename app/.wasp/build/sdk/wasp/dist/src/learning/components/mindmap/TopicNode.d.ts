import React from 'react';
import { TopicTreeItem } from '../ui/TopicTree';
export interface TopicNodeData extends Record<string, unknown> {
    topic: TopicTreeItem;
    isHighlighted?: boolean;
    onClick?: (topic: TopicTreeItem) => void;
}
export interface TopicNodeProps {
    data: TopicNodeData;
    selected?: boolean;
}
export declare const TopicNode: React.MemoExoticComponent<({ data, selected }: TopicNodeProps) => React.JSX.Element>;
//# sourceMappingURL=TopicNode.d.ts.map