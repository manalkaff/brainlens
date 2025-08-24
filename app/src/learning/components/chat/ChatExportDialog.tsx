import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Download, FileText, Code, FileDown, Loader2, X, File, FileImage } from 'lucide-react';
import { contentExportService } from '../../export/exportService';
import type { ChatThread, Message } from 'wasp/entities';

interface ChatExportDialogProps {
  thread?: ChatThread & { messages: Message[] };
  onClose: () => void;
  topicTitle: string;
}

export function ChatExportDialog({ 
  thread,
  onClose,
  topicTitle 
}: ChatExportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleExport = async (format: 'markdown' | 'html' | 'pdf') => {
    if (!thread?.messages) {
      setError('No conversation to export');
      return;
    }

    try {
      setLoading(true);
      setError(undefined);

      // Convert messages to content format
      const conversationContent = thread.messages
        .map(msg => {
          const role = msg.role === 'USER' ? 'User' : 'Assistant';
          const timestamp = new Date(msg.createdAt).toLocaleString();
          let content = `## ${role} (${timestamp})\n\n${msg.content}`;
          
          // Add metadata for assistant messages
          if (msg.role === 'ASSISTANT' && msg.metadata) {
            const metadata = msg.metadata as any;
            if (metadata.confidence) {
              content += `\n\n*Confidence: ${Math.round(metadata.confidence * 100)}%*`;
            }
            if (metadata.sources && metadata.sources.length > 0) {
              content += `\n\n**Sources:** ${metadata.sources.length} references`;
            }
          }
          
          return content;
        })
        .join('\n\n---\n\n');

      // Create topic-like object for export
      const mockTopic = {
        id: thread.id,
        title: thread.title || `Chat about ${topicTitle}`,
        summary: `Conversation about ${topicTitle} with ${thread.messages.length} messages`,
        description: `Exported conversation from ${new Date().toLocaleDateString()}`,
        createdAt: thread.createdAt,
        updatedAt: new Date()
      };

      const result = await contentExportService.exportTopicContent(
        mockTopic as any,
        conversationContent,
        { 
          format, 
          includeMetadata: true,
          includeProgress: false 
        }
      );

      // Create and trigger download
      const blob = new Blob([result.content], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onClose();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export conversation';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!thread?.messages) {
      setError('No conversation to copy');
      return;
    }

    try {
      setLoading(true);
      setError(undefined);

      const conversationText = thread.messages
        .map(msg => {
          const role = msg.role === 'USER' ? 'You' : 'AI Assistant';
          const timestamp = new Date(msg.createdAt).toLocaleTimeString();
          return `[${timestamp}] ${role}: ${msg.content}`;
        })
        .join('\n\n');

      await navigator.clipboard.writeText(conversationText);
      
      console.log('Conversation copied to clipboard');
      onClose();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to copy conversation';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const messageCount = thread?.messages?.length || 0;
  const threadTitle = thread?.title || `Chat about ${topicTitle}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Download className="w-5 h-5 mr-2" />
              <CardTitle>Export Conversation</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            Export "{threadTitle}" ({messageCount} messages)
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {messageCount === 0 && (
            <div className="p-3 bg-muted/50 border rounded-lg">
              <p className="text-sm text-muted-foreground">No messages to export</p>
            </div>
          )}

          {/* Enhanced Export Options */}
          {messageCount > 0 && (
            <div className="space-y-3">
              <div className="grid gap-2">
                <Button
                  onClick={() => handleExport('markdown')}
                  disabled={loading}
                  variant="outline"
                  className="justify-start h-auto p-4"
                >
                  <div className="flex items-center w-full">
                    <FileText className="w-5 h-5 mr-3 text-blue-600" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">Markdown (.md)</div>
                      <div className="text-xs text-muted-foreground">
                        Formatted text with headers, styling, and metadata
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Recommended
                    </Badge>
                  </div>
                </Button>

                <Button
                  onClick={() => handleExport('html')}
                  disabled={loading}
                  variant="outline"
                  className="justify-start h-auto p-4"
                >
                  <div className="flex items-center w-full">
                    <File className="w-5 h-5 mr-3 text-orange-600" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">HTML (.html)</div>
                      <div className="text-xs text-muted-foreground">
                        Web page format with styling and interactive elements
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleExport('pdf')}
                  disabled={loading}
                  variant="outline"
                  className="justify-start h-auto p-4"
                >
                  <div className="flex items-center w-full">
                    <FileImage className="w-5 h-5 mr-3 text-red-600" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">PDF (.pdf)</div>
                      <div className="text-xs text-muted-foreground">
                        Professional document format (converted from HTML)
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Coming Soon
                    </Badge>
                  </div>
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="border-t pt-4 space-y-2">
                <Button
                  onClick={handleCopyToClipboard}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  Copy to Clipboard
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={loading}
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}