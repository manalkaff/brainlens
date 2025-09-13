import React from 'react';
import { ChatThread, Message } from 'wasp/entities';
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
export declare function ChatThreadSidebar({ threads, activeThreadId, onSelectThread, onNewThread, onDeleteThread, loading }: ChatThreadSidebarProps): React.JSX.Element;
export {};
//# sourceMappingURL=ChatThreadSidebar.d.ts.map