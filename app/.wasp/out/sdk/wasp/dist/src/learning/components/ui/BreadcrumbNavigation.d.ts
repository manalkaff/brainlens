import React from 'react';
import type { TopicTreeItem } from './TopicTree';
interface BreadcrumbItem {
    title: string;
    path: string[];
    topic: TopicTreeItem;
}
interface BreadcrumbNavigationProps {
    navigationPath: BreadcrumbItem[];
    onNavigateToPath: (path: string[]) => void;
    onNavigateHome?: () => void;
    className?: string;
    showHome?: boolean;
    maxItems?: number;
    compact?: boolean;
}
export declare function BreadcrumbNavigation({ navigationPath, onNavigateToPath, onNavigateHome, className, showHome, maxItems, compact }: BreadcrumbNavigationProps): React.JSX.Element | null;
export declare function createBreadcrumbItems(navigationPath: {
    title: string;
    path: string[];
    topic: TopicTreeItem;
}[]): BreadcrumbItem[];
export default BreadcrumbNavigation;
//# sourceMappingURL=BreadcrumbNavigation.d.ts.map