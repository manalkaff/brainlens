import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Download, FileText, Code, FileDown, Loader2 } from 'lucide-react';
import { exportChatThread } from 'wasp/client/operations';

interface ChatExportDialogProps {
  threadId: string;
  threadTitle: string;
  messageCount: number;
  onClose: () => void;
}

export function ChatExportDialog({ 
  threadId, 
  threadTitle, 
  messageCount, 
  onClose 
}: ChatExportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleExport = async (format: 'text' | 'json' | 'markdown') => {
    try {
      setLoading(true);
      setError(undefined);

      const result = await exportChatThread({
        threadId,
        format
      });

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
    try {
      setLoading(true);
      setError(undefined);

      const result = await exportChatThread({
        threadId,
        format: 'text'
      });

      await navigator.clipboard.writeText(result.content);
      
      // Could show a toast notification here
      console.log('Conversation copied to clipboard');
      onClose();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to copy conversation';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2" />
            Export Conversation
          </CardTitle>
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

          {/* Export Options */}
          <div className="space-y-3">
            <div className="grid gap-2">
              <Button
                onClick={() => handleExport('markdown')}
                disabled={loading}
                variant="outline"
                className="justify-start h-auto p-3"
              >
                <div className="flex items-center w-full">
                  <FileText className="w-4 h-4 mr-3" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">Markdown (.md)</div>
                    <div className="text-xs text-muted-foreground">
                      Formatted text with headers and styling
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Recommended
                  </Badge>
                </div>
              </Button>

              <Button
                onClick={() => handleExport('text')}
                disabled={loading}
                variant="outline"
                className="justify-start h-auto p-3"
              >
                <div className="flex items-center w-full">
                  <FileDown className="w-4 h-4 mr-3" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">Plain Text (.txt)</div>
                    <div className="text-xs text-muted-foreground">
                      Simple text format, compatible everywhere
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => handleExport('json')}
                disabled={loading}
                variant="outline"
                className="justify-start h-auto p-3"
              >
                <div className="flex items-center w-full">
                  <Code className="w-4 h-4 mr-3" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">JSON (.json)</div>
                    <div className="text-xs text-muted-foreground">
                      Structured data with metadata
                    </div>
                  </div>
                </div>
              </Button>
            </div>

            {/* Copy to Clipboard */}
            <div className="border-t pt-3">
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

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}