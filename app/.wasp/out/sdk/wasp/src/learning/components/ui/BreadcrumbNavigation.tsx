import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
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

export function BreadcrumbNavigation({
  navigationPath,
  onNavigateToPath,
  onNavigateHome,
  className,
  showHome = true,
  maxItems = 5,
  compact = false
}: BreadcrumbNavigationProps) {
  // Don't render if no navigation path or only one item
  if (!navigationPath || navigationPath.length <= 1) {
    return null;
  }

  // Responsive max items based on screen size
  const getResponsiveMaxItems = () => {
    if (typeof window === 'undefined') return maxItems;
    
    const width = window.innerWidth;
    if (width < 640) return 2; // Mobile: show only 2 items
    if (width < 768) return 3; // Tablet: show 3 items
    return maxItems; // Desktop: show full maxItems
  };

  const responsiveMaxItems = getResponsiveMaxItems();

  // Truncate path if it's too long
  const displayPath = navigationPath.length > responsiveMaxItems 
    ? [
        navigationPath[0],
        { title: '...', path: [], topic: {} as TopicTreeItem },
        ...navigationPath.slice(-responsiveMaxItems + 2)
      ]
    : navigationPath;

  const handleHomeClick = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      onNavigateToPath([]);
    }
  };

  const handleBreadcrumbClick = (item: BreadcrumbItem, index: number) => {
    // Don't navigate if it's the current item (last in the path)
    if (index === displayPath.length - 1) {
      return;
    }

    // Don't navigate if it's the ellipsis item
    if (item.title === '...') {
      return;
    }

    onNavigateToPath(item.path);
  };

  return (
    <nav 
      className={cn(
        "flex items-center space-x-1 text-sm text-muted-foreground",
        compact && "space-x-0.5 text-xs",
        className
      )}
      aria-label="Breadcrumb navigation"
    >
      {/* Home button */}
      {showHome && (
        <>
          <Button
            variant="ghost"
            size={compact ? "sm" : "sm"}
            onClick={handleHomeClick}
            className={cn(
              "h-auto p-1 text-muted-foreground hover:text-foreground transition-colors",
              compact && "p-0.5"
            )}
            aria-label="Navigate to home"
          >
            <Home className={cn("w-4 h-4", compact && "w-3 h-3")} />
          </Button>
          <ChevronRight className={cn("w-4 h-4", compact && "w-3 h-3")} data-testid="chevron-right" />
        </>
      )}

      {/* Breadcrumb items */}
      {displayPath.map((item, index) => (
        <React.Fragment key={`${item.topic.id || 'ellipsis'}-${index}`}>
          {index > 0 && (
            <ChevronRight className={cn("w-4 h-4", compact && "w-3 h-3")} data-testid="chevron-right" />
          )}
          
          {item.title === '...' ? (
            <span className="px-1 text-muted-foreground">...</span>
          ) : (
            <Button
              variant="ghost"
              size={compact ? "sm" : "sm"}
              onClick={() => handleBreadcrumbClick(item, index)}
              disabled={index === displayPath.length - 1}
              className={cn(
                "h-auto p-1 font-normal hover:text-foreground transition-colors",
                compact && "p-0.5 text-xs",
                index === displayPath.length - 1 
                  ? "text-foreground font-medium cursor-default" 
                  : "text-muted-foreground cursor-pointer",
                index === displayPath.length - 1 && "hover:bg-transparent"
              )}
              aria-label={
                index === displayPath.length - 1 
                  ? `Current topic: ${item.title}`
                  : `Navigate to ${item.title}`
              }
              aria-current={index === displayPath.length - 1 ? "page" : undefined}
            >
              <span className={cn(
                "truncate max-w-[120px]",
                compact && "max-w-[80px]"
              )}>
                {item.title}
              </span>
            </Button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// Utility function to create breadcrumb items from navigation path
export function createBreadcrumbItems(
  navigationPath: { title: string; path: string[]; topic: TopicTreeItem }[]
): BreadcrumbItem[] {
  return navigationPath.map(item => ({
    title: item.title,
    path: item.path,
    topic: item.topic
  }));
}

export default BreadcrumbNavigation;