import React from 'react';
import { Message } from 'wasp/entities';
interface ChatMessageProps {
    message: Message;
    onCopy?: (content: string) => void;
    onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void;
}
export declare function ChatMessage({ message, onCopy, onFeedback }: ChatMessageProps): React.JSX.Element;
export {};
//# sourceMappingURL=ChatMessage.d.ts.map