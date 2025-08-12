import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { useTopicContext } from '../../context/TopicContext';

export function ExploreTab() {
  const { topic, isLoading } = useTopicContext();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-64 bg-muted rounded" />
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
      {/* Topic Tree Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-3" />
            Topic Structure
          </CardTitle>
          <CardDescription>
            Navigate through the hierarchical structure of {topic.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mock tree structure */}
            <div className="space-y-2">
              <div className="flex items-center p-2 hover:bg-muted rounded-lg cursor-pointer">
                <div className="w-4 h-4 mr-2 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <span className="font-medium">{topic.title}</span>
              </div>
              
              {topic.children && topic.children.length > 0 ? (
                topic.children.map((child, index) => (
                  <div key={child.id} className="ml-6 flex items-center p-2 hover:bg-muted rounded-lg cursor-pointer opacity-75">
                    <div className="w-4 h-4 mr-2 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    </div>
                    <span className="text-sm">{child.title}</span>
                  </div>
                ))
              ) : (
                <div className="ml-6 space-y-2">
                  <div className="flex items-center p-2 opacity-50">
                    <div className="w-4 h-4 mr-2 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-muted" />
                    </div>
                    <span className="text-sm text-muted-foreground">Fundamentals & Core Concepts</span>
                  </div>
                  <div className="flex items-center p-2 opacity-50">
                    <div className="w-4 h-4 mr-2 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-muted" />
                    </div>
                    <span className="text-sm text-muted-foreground">Advanced Topics</span>
                  </div>
                  <div className="flex items-center p-2 opacity-50">
                    <div className="w-4 h-4 mr-2 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-muted" />
                    </div>
                    <span className="text-sm text-muted-foreground">Practical Applications</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t">
              <Button disabled variant="outline" className="w-full">
                Generate Content Structure (Coming Soon)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-orange-500 mr-3" />
            Rich Content Display
          </CardTitle>
          <CardDescription>
            MDX-rendered content with interactive elements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">Content Preview</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This area will display rich, structured content about {topic.title} including:
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Interactive code blocks and examples</li>
                <li>• Embedded diagrams and visualizations</li>
                <li>• Clickable headers for quick navigation</li>
                <li>• Bookmarkable sections</li>
                <li>• Export options (PDF, Markdown)</li>
              </ul>
            </div>
            
            <div className="flex space-x-2">
              <Button disabled variant="outline" size="sm">
                Export as PDF
              </Button>
              <Button disabled variant="outline" size="sm">
                Export as Markdown
              </Button>
              <Button disabled variant="outline" size="sm">
                Bookmark Section
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search within Topic */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-purple-500 mr-3" />
            Search & Navigation
          </CardTitle>
          <CardDescription>
            Find specific information within this topic
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search within topic..."
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-muted/50 text-muted-foreground"
              />
              <div className="absolute right-3 top-2.5">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Search functionality will be available once content is generated
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}