import React from 'react';
import { ChatThread, Message } from 'wasp/entities';
interface ChatThreadWithMessages extends ChatThread {
    messages: Message[];
    messageCount: number;
    lastMessage?: Message;
}
interface ChatInterfaceProps {
    thread?: ChatThreadWithMessages;
    onSendMessage: (content: string) => Promise<void>;
    loading?: boolean;
    error?: string;
    suggestedQuestions?: string[];
    topicTitle?: string;
}
export declare function ChatInterface({ thread, onSendMessage, loading, error, suggestedQuestions, topicTitle }: ChatInterfaceProps): React.JSX.Element;
export {};
//# sourceMappingURL=ChatInterface.d.ts.map