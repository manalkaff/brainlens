import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { useTopicContext } from '../../context/TopicContext';

export function MindMapTab() {
  const { topic, isLoading } = useTopicContext();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Topic not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mind Map Visualization */}
      <Card className="h-96">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-purple-500 mr-3" />
              Interactive Mind Map
            </div>
            <div className="flex space-x-2">
              <Button disabled variant="outline" size="sm">
                Zoom In
              </Button>
              <Button disabled variant="outline" size="sm">
                Zoom Out
              </Button>
              <Button disabled variant="outline" size="sm">
                Fullscreen
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Visual representation of {topic.title} and its relationships
          </CardDescription>
        </CardHeader>
        <CardContent className="h-full">
          <div className="h-full border rounded-lg bg-muted/10 flex items-center justify-center relative overflow-hidden">
            {/* Mock Mind Map Visualization */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Central Node */}
                <div className="w-32 h-16 bg-primary text-primary-foreground rounded-lg flex items-center justify-center text-sm font-medium shadow-lg">
                  {topic.title}
                </div>
                
                {/* Connected Nodes */}
                <div className="absolute -top-12 -left-20 w-24 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center text-xs opacity-75">
                  Concepts
                </div>
                <div className="absolute -top-12 left-16 w-24 h-12 bg-green-500 text-white rounded-lg flex items-center justify-center text-xs opacity-75">
                  Applications
                </div>
                <div className="absolute top-20 -left-20 w-24 h-12 bg-orange-500 text-white rounded-lg flex items-center justify-center text-xs opacity-75">
                  Examples
                </div>
                <div className="absolute top-20 left-16 w-24 h-12 bg-purple-500 text-white rounded-lg flex items-center justify-center text-xs opacity-75">
                  Resources
                </div>
                
                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
                  <line x1="64" y1="32" x2="44" y2="20" stroke="#94a3b8" strokeWidth="2" opacity="0.5" />
                  <line x1="64" y1="32" x2="84" y2="20" stroke="#94a3b8" strokeWidth="2" opacity="0.5" />
                  <line x1="64" y1="48" x2="44" y2="68" stroke="#94a3b8" strokeWidth="2" opacity="0.5" />
                  <line x1="64" y1="48" x2="84" y2="68" stroke="#94a3b8" strokeWidth="2" opacity="0.5" />
                </svg>
              </div>
            </div>
            
            {/* Overlay Message */}
            <div className="absolute bottom-4 left-4 right-4 bg-background/90 border rounded-lg p-3">
              <p className="text-sm text-muted-foreground text-center">
                Interactive mind map will be generated using React Flow once content is available
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mind Map Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
              Layout Options
            </CardTitle>
            <CardDescription>
              Choose how to organize the mind map
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button disabled variant="outline" className="w-full justify-start">
                Hierarchical Layout
              </Button>
              <Button disabled variant="outline" className="w-full justify-start">
                Radial Layout
              </Button>
              <Button disabled variant="outline" className="w-full justify-start">
                Force-Directed Layout
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-3" />
              Mind Map Features
            </CardTitle>
            <CardDescription>
              Interactive features and controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Color by completion</span>
                <div className="w-8 h-4 bg-muted rounded-full opacity-50" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Size by content depth</span>
                <div className="w-8 h-4 bg-muted rounded-full opacity-50" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Show connections</span>
                <div className="w-8 h-4 bg-muted rounded-full opacity-50" />
              </div>
              <Button disabled variant="outline" className="w-full mt-4">
                Search in Mind Map
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-orange-500 mr-3" />
            Export & Share
          </CardTitle>
          <CardDescription>
            Save or share your mind map
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button disabled variant="outline">
              Export as PNG
            </Button>
            <Button disabled variant="outline">
              Export as SVG
            </Button>
            <Button disabled variant="outline">
              Share Link
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}