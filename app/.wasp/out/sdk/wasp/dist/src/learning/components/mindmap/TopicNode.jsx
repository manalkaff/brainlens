import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { BookOpen, CheckCircle, Clock } from 'lucide-react';
export const TopicNode = memo(({ data, selected }) => {
    const { topic, isHighlighted, onClick } = data;
    const isCompleted = topic.userProgress?.completed || false;
    const hasProgress = topic.userProgress && topic.userProgress.timeSpent > 0;
    // Simple fixed size for all nodes
    const nodeWidth = 200;
    const nodeHeight = 80;
    // Get node color based on completion status
    const getNodeColor = () => {
        if (isCompleted)
            return 'bg-emerald-50 border-emerald-300 text-emerald-900';
        if (hasProgress)
            return 'bg-blue-50 border-blue-300 text-blue-900';
        return 'bg-white border-gray-200 text-gray-900';
    };
    // Get status icon
    const getStatusIcon = () => {
        if (isCompleted)
            return <CheckCircle className="w-4 h-4 text-emerald-600"/>;
        if (hasProgress)
            return <Clock className="w-4 h-4 text-blue-600"/>;
        return <BookOpen className="w-4 h-4 text-gray-500"/>;
    };
    const handleClick = () => {
        onClick?.(topic);
    };
    return (<>
      {/* Connection handles */}
      <Handle type="target" position={Position.Left} style={{
            background: isCompleted ? '#10b981' : hasProgress ? '#3b82f6' : '#6b7280',
            width: 6,
            height: 6,
            border: 'none',
        }}/>
      <Handle type="source" position={Position.Right} style={{
            background: isCompleted ? '#10b981' : hasProgress ? '#3b82f6' : '#6b7280',
            width: 6,
            height: 6,
            border: 'none',
        }}/>

      {/* Main Node - Clean and Simple */}
      <div className={`
          relative border rounded-xl cursor-pointer shadow-sm hover:shadow-md
          ${getNodeColor()}
          ${selected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
          ${isHighlighted ? 'ring-2 ring-amber-400 ring-offset-1' : ''}
        `} style={{ width: nodeWidth, height: nodeHeight }} onClick={handleClick}>
        <div className="p-4 h-full flex flex-col justify-between">
          {/* Header with status icon */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <h3 className="font-medium text-sm leading-tight line-clamp-2 flex-1">
                {topic.title}
              </h3>
            </div>
          </div>

          {/* Summary if available */}
          {topic.summary && (<p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {topic.summary}
            </p>)}

          {/* Progress indicator for in-progress items */}
          {hasProgress && !isCompleted && (<div className="mt-2 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{
                width: `${Math.min(100, (topic.userProgress?.timeSpent || 0) / 60 * 10)}%`
            }}/>
            </div>)}
        </div>
      </div>
    </>);
});
TopicNode.displayName = 'TopicNode';
//# sourceMappingURL=TopicNode.jsx.map