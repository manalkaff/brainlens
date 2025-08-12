import React, { useState } from 'react';
import { ChatThread, Message } from 'wasp/entities';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Badge } from '../../../components/ui/badge';
import { Plus, MessageCircle, Clock, Trash2, Download, MoreVertical } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { ChatExportDialog } from './ChatExportDialog';

interface ChatThreadWithMessages extends ChatThread {
  messages: Message[];
  messageCount: number;
  lastMessage?: Message;
}

interface ChatThreadSidebarProps {
  threads: ChatThreadWithMessages[];
  activeThreadId?: string;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  onDeleteThread?: (threadId: string) => void;
  loading?: boolean;
}

export function ChatThreadSidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  loading = false
}: ChatThreadSidebarProps) {
  const [exportDialogThread, setExportDialogThread] = useState<ChatThreadWithMessages | undefined>();
  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const truncateMessage = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Conversations</CardTitle>
          <Button
            onClick={onNewThread}
            disabled={loading}
            size="sm"
            variant="outline"
            className="h-8 px-2"
          >
            <Plus className="w-3 h-3 mr-1" />
            New
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {threads.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className={cn(
                    "group relative rounded-lg p-3 cursor-pointer transition-colors",
                    "hover:bg-muted/50",
                    activeThreadId === thread.id 
                      ? "bg-primary/10 border border-primary/20" 
                      : "border border-transparent"
                  )}
                  onClick={() => onSelectThread(thread.id)}
                >
                  {/* Thread Title */}
                  <div className="flex items-start justify-between mb-1">
                    <h4 className={cn(
                      "text-sm font-medium truncate pr-2",
                      activeThreadId === thread.id && "text-primary"
                    )}>
                      {thread.title || 'Untitled Chat'}
                    </h4>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExportDialogThread(thread);
                        }}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                        title="Export conversation"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      
                      {onDeleteThread && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteThread(thread.id);
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Last Message Preview */}
                  {thread.lastMessage && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {truncateMessage(thread.lastMessage.content)}
                    </p>
                  )}

                  {/* Thread Metadata */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        {thread.messageCount} messages
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatLastActivity(thread.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Export Dialog */}
      {exportDialogThread && (
        <ChatExportDialog
          threadId={exportDialogThread.id}
          threadTitle={exportDialogThread.title || 'Untitled Chat'}
          messageCount={exportDialogThread.messageCount}
          onClose={() => setExportDialogThread(undefined)}
        />
      )}
    </Card>
  );
}