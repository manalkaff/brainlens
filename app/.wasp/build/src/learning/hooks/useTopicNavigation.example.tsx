import React from 'react';
import { useTopicNavigation } from './useTopicNavigation';
import type { TopicTreeItem } from '../components/ui/TopicTree';

// Example usage of the useTopicNavigation hook
export function TopicNavigationExample({ topics }: { topics: TopicTreeItem[] }) {
  const {
    selectedTopic,
    selectedSubtopic,
    contentPath,
    isGeneratingContent,
    navigationHistory,
    selectTopic,
    selectSubtopic,
    navigateToPath,
    generateContentForTopic,
    getTopicContent,
    setTopicContent,
    getNavigationBreadcrumbs,
    isTopicSelected,
    canNavigateBack,
    canNavigateForward,
    navigateBack,
    navigateForward
  } = useTopicNavigation(topics);

  const breadcrumbs = getNavigationBreadcrumbs();
  const currentTopic = selectedSubtopic || selectedTopic;

  return (
    <div className="p-4 space-y-4">
      {/* Navigation History Controls */}
      <div className="flex gap-2">
        <button
          onClick={navigateBack}
          disabled={!canNavigateBack}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          onClick={navigateForward}
          disabled={!canNavigateForward}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Forward →
        </button>
      </div>

      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-gray-400">/</span>}
              <button
                onClick={() => navigateToPath(crumb.path)}
                className="text-blue-600 hover:underline"
              >
                {crumb.title}
              </button>
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Current Topic Display */}
      {currentTopic && (
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-bold">{currentTopic.title}</h2>
          {currentTopic.summary && (
            <p className="text-gray-600 mt-2">{currentTopic.summary}</p>
          )}
          
          {/* Content Path */}
          <div className="mt-2 text-sm text-gray-500">
            Path: {contentPath.join(' → ')}
          </div>

          {/* Content Display */}
          <div className="mt-4">
            {(() => {
              const cachedContent = getTopicContent(currentTopic.id);
              if (cachedContent) {
                return (
                  <div className="bg-gray-50 p-3 rounded">
                    <h3 className="font-semibold">Cached Content:</h3>
                    <p className="mt-2">{cachedContent.content}</p>
                    {cachedContent.sources.length > 0 && (
                      <div className="mt-2">
                        <h4 className="font-medium">Sources:</h4>
                        <ul className="list-disc list-inside">
                          {cachedContent.sources.map((source, idx) => (
                            <li key={idx}>
                              <a href={source.url || '#'} className="text-blue-600 hover:underline">
                                {source.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-2">No content available</p>
                    <button
                      onClick={() => generateContentForTopic(currentTopic)}
                      disabled={isGeneratingContent}
                      className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
                    >
                      {isGeneratingContent ? 'Generating...' : 'Generate Content'}
                    </button>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      )}

      {/* Topic Tree Navigation */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Topics</h3>
        <div className="space-y-2">
          {topics.map((topic) => (
            <TopicTreeNode
              key={topic.id}
              topic={topic}
              level={0}
              isSelected={isTopicSelected(topic.id)}
              onSelect={selectTopic}
              onSelectSubtopic={selectSubtopic}
              isTopicSelected={isTopicSelected}
            />
          ))}
        </div>
      </div>

      {/* Navigation History */}
      {navigationHistory.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Recent Navigation</h3>
          <div className="space-y-1">
            {navigationHistory.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <button
                  onClick={() => selectTopic(item.topic)}
                  className="text-blue-600 hover:underline"
                >
                  {item.topic.title}
                </button>
                <span className="text-gray-400 text-xs">
                  {item.source} • {item.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for rendering topic tree nodes
interface TopicTreeNodeProps {
  topic: TopicTreeItem;
  level: number;
  isSelected: boolean;
  onSelect: (topic: TopicTreeItem) => void;
  onSelectSubtopic: (subtopic: TopicTreeItem) => void;
  isTopicSelected: (topicId: string) => boolean;
}

function TopicTreeNode({
  topic,
  level,
  isSelected,
  onSelect,
  onSelectSubtopic,
  isTopicSelected
}: TopicTreeNodeProps) {
  const hasChildren = topic.children && topic.children.length > 0;

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
          isSelected ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-50'
        }`}
        style={{ marginLeft: `${level * 20}px` }}
        onClick={() => level === 0 ? onSelect(topic) : onSelectSubtopic(topic)}
      >
        <span className="font-medium">{topic.title}</span>
        {hasChildren && (
          <span className="text-xs text-gray-500">({topic.children.length})</span>
        )}
      </div>

      {hasChildren && (
        <div className="space-y-1">
          {topic.children.map((child) => (
            <TopicTreeNode
              key={child.id}
              topic={child}
              level={level + 1}
              isSelected={isTopicSelected(child.id)}
              onSelect={onSelect}
              onSelectSubtopic={onSelectSubtopic}
              isTopicSelected={isTopicSelected}
            />
          ))}
        </div>
      )}
    </div>
  );
}