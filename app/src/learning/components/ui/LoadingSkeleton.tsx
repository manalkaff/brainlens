import React from 'react';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';

export function LoadingSkeleton() {
  return (
    <div className="flex h-[calc(100vh-200px)] bg-background">
      {/* Left Sidebar Skeleton */}
      <div className="w-80 flex-shrink-0 border-r bg-card">
        {/* Sidebar Header Skeleton */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted rounded animate-pulse" />
            <div className="w-24 h-4 bg-muted rounded animate-pulse" />
          </div>
          <div className="w-8 h-8 bg-muted rounded animate-pulse" />
        </div>

        {/* Sidebar Content Skeleton */}
        <div className="p-4 space-y-4">
          {/* Search Skeleton */}
          <div className="w-full h-9 bg-muted rounded animate-pulse" />
          
          {/* Stats Skeleton */}
          <div className="flex gap-2">
            <div className="w-16 h-6 bg-muted rounded animate-pulse" />
            <div className="w-20 h-6 bg-muted rounded animate-pulse" />
          </div>

          {/* Tree Items Skeleton */}
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2 p-2">
                  <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                  <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="w-full h-4 bg-muted rounded animate-pulse" />
                    <div className="w-3/4 h-3 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="w-8 h-4 bg-muted rounded animate-pulse" />
                </div>
                
                {/* Child items skeleton */}
                {i < 3 && (
                  <div className="ml-6 space-y-1">
                    {Array.from({ length: 2 }).map((_, j) => (
                      <div key={j} className="flex items-center gap-2 p-2">
                        <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                        <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                        <div className="flex-1">
                          <div className="w-full h-3 bg-muted rounded animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Content Area Skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Header Skeleton */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted rounded animate-pulse" />
            <div className="w-32 h-4 bg-muted rounded animate-pulse" />
            <div className="w-1 h-4 bg-muted rounded animate-pulse" />
            <div className="w-48 h-3 bg-muted rounded animate-pulse" />
          </div>
          <div className="w-24 h-8 bg-muted rounded animate-pulse" />
        </div>

        {/* Content Area Skeleton */}
        <div className="flex-1 p-6">
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full animate-pulse" />
              
              <div className="space-y-2">
                <div className="w-32 h-6 bg-muted rounded animate-pulse mx-auto" />
                <div className="w-48 h-4 bg-muted rounded animate-pulse mx-auto" />
              </div>

              <div className="space-y-2">
                <div className="w-full h-4 bg-muted rounded animate-pulse" />
                <div className="w-3/4 h-4 bg-muted rounded animate-pulse mx-auto" />
              </div>
              
              <div className="w-full h-10 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Alternative compact loading skeleton for smaller spaces
export function CompactLoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Search Skeleton */}
      <div className="w-full h-8 bg-muted rounded animate-pulse" />
      
      {/* Stats Skeleton */}
      <div className="flex gap-2">
        <div className="w-12 h-5 bg-muted rounded animate-pulse" />
        <div className="w-16 h-5 bg-muted rounded animate-pulse" />
      </div>

      {/* Tree Items Skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 p-2">
            <div className="w-3 h-3 bg-muted rounded animate-pulse" />
            <div className="w-3 h-3 bg-muted rounded animate-pulse" />
            <div className="flex-1">
              <div className="w-full h-3 bg-muted rounded animate-pulse" />
            </div>
            <div className="w-6 h-3 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}