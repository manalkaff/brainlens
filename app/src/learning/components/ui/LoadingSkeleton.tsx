import React from 'react';
import { Card, CardContent, CardHeader } from '@src/components/ui/card';

interface LoadingSkeletonProps {
  variant?: 'content' | 'research' | 'chat' | 'quiz' | 'mindmap';
  lines?: number;
  showHeader?: boolean;
  className?: string;
}

interface SkeletonLineProps {
  width?: string;
  height?: string;
  className?: string;
}

// Basic skeleton line component
const SkeletonLine: React.FC<SkeletonLineProps> = ({ 
  width = '100%', 
  height = '1rem',
  className = '' 
}) => (
  <div 
    className={`bg-gray-200 rounded animate-pulse ${className}`}
    style={{ width, height }}
  />
);

// Content loading skeleton
const ContentSkeleton: React.FC<{ lines: number }> = ({ lines }) => (
  <div className="space-y-4">
    {/* Title skeleton */}
    <div className="space-y-2">
      <SkeletonLine width="60%" height="1.5rem" />
      <SkeletonLine width="40%" height="1rem" />
    </div>
    
    {/* Content lines */}
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonLine width={`${Math.random() * 30 + 70}%`} />
          <SkeletonLine width={`${Math.random() * 40 + 60}%`} />
          {i % 3 === 0 && <SkeletonLine width={`${Math.random() * 20 + 80}%`} />}
        </div>
      ))}
    </div>
    
    {/* Action buttons skeleton */}
    <div className="flex gap-2 pt-4">
      <SkeletonLine width="5rem" height="2rem" />
      <SkeletonLine width="4rem" height="2rem" />
    </div>
  </div>
);

// Research status skeleton
const ResearchSkeleton: React.FC = () => (
  <div className="space-y-4">
    {/* Header with status */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse" />
        <div className="space-y-1">
          <SkeletonLine width="12rem" height="1.25rem" />
          <SkeletonLine width="8rem" height="0.875rem" />
        </div>
      </div>
      <div className="flex gap-2">
        <SkeletonLine width="4rem" height="1.5rem" />
        <SkeletonLine width="2rem" height="2rem" />
      </div>
    </div>
    
    {/* Progress bar */}
    <div className="space-y-2">
      <div className="flex justify-between">
        <SkeletonLine width="6rem" height="0.875rem" />
        <SkeletonLine width="3rem" height="0.875rem" />
      </div>
      <SkeletonLine width="100%" height="0.75rem" />
    </div>
    
    {/* Agent status grid */}
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
          <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse" />
          <SkeletonLine width="4rem" height="0.875rem" />
        </div>
      ))}
    </div>
  </div>
);

// Chat skeleton
const ChatSkeleton: React.FC<{ messages?: number }> = ({ messages = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: messages }).map((_, i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          i % 2 === 0 ? 'bg-gray-100' : 'bg-blue-100'
        }`}>
          <div className="space-y-2">
            <SkeletonLine width={`${Math.random() * 40 + 60}%`} />
            <SkeletonLine width={`${Math.random() * 30 + 50}%`} />
            {Math.random() > 0.5 && <SkeletonLine width={`${Math.random() * 50 + 40}%`} />}
          </div>
        </div>
      </div>
    ))}
    
    {/* Input skeleton */}
    <div className="flex gap-2 pt-4 border-t">
      <SkeletonLine width="100%" height="2.5rem" />
      <SkeletonLine width="3rem" height="2.5rem" />
    </div>
  </div>
);

// Quiz skeleton
const QuizSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Question header */}
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <SkeletonLine width="8rem" height="1rem" />
        <SkeletonLine width="4rem" height="1rem" />
      </div>
      <SkeletonLine width="100%" height="0.5rem" />
    </div>
    
    {/* Question */}
    <div className="space-y-3">
      <SkeletonLine width="90%" height="1.25rem" />
      <SkeletonLine width="70%" height="1.25rem" />
    </div>
    
    {/* Answer options */}
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
          <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse" />
          <SkeletonLine width={`${Math.random() * 30 + 50}%`} />
        </div>
      ))}
    </div>
    
    {/* Action buttons */}
    <div className="flex justify-between pt-4">
      <SkeletonLine width="4rem" height="2.5rem" />
      <SkeletonLine width="6rem" height="2.5rem" />
    </div>
  </div>
);

// Mind map skeleton
const MindMapSkeleton: React.FC = () => (
  <div className="space-y-4">
    {/* Controls */}
    <div className="flex justify-between items-center">
      <div className="flex gap-2">
        <SkeletonLine width="3rem" height="2rem" />
        <SkeletonLine width="3rem" height="2rem" />
        <SkeletonLine width="3rem" height="2rem" />
      </div>
      <SkeletonLine width="6rem" height="2rem" />
    </div>
    
    {/* Mind map area */}
    <div className="relative h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mx-auto" />
          <SkeletonLine width="8rem" height="1rem" className="mx-auto" />
          <SkeletonLine width="12rem" height="0.875rem" className="mx-auto" />
        </div>
      </div>
      
      {/* Floating nodes */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-12 h-12 bg-gray-200 rounded-full animate-pulse"
          style={{
            top: `${Math.random() * 60 + 20}%`,
            left: `${Math.random() * 60 + 20}%`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  </div>
);

// Main loading skeleton component
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'content',
  lines = 4,
  showHeader = true,
  className = '',
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'content':
        return <ContentSkeleton lines={lines} />;
      case 'research':
        return <ResearchSkeleton />;
      case 'chat':
        return <ChatSkeleton messages={lines} />;
      case 'quiz':
        return <QuizSkeleton />;
      case 'mindmap':
        return <MindMapSkeleton />;
      default:
        return <ContentSkeleton lines={lines} />;
    }
  };

  if (showHeader) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="space-y-2">
            <SkeletonLine width="50%" height="1.5rem" />
            <SkeletonLine width="30%" height="1rem" />
          </div>
        </CardHeader>
        <CardContent>
          {renderSkeleton()}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {renderSkeleton()}
    </div>
  );
};

// Pulse animation component for individual elements
export const PulseLoader: React.FC<{ 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`${sizeClasses[size]} bg-gray-200 rounded-full animate-pulse ${className}`} />
  );
};

// Shimmer effect component
export const ShimmerEffect: React.FC<{ 
  width?: string;
  height?: string;
  className?: string;
}> = ({ width = '100%', height = '1rem', className = '' }) => (
  <div 
    className={`bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded ${className}`}
    style={{ width, height }}
  />
);

export default LoadingSkeleton;