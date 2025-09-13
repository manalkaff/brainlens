import React from 'react';
interface MessageInputProps {
    onSendMessage: (content: string) => void;
    disabled?: boolean;
    loading?: boolean;
    placeholder?: string;
    suggestedQuestions?: string[];
    onSelectSuggestion?: (question: string) => void;
}
export declare function MessageInput({ onSendMessage, disabled, loading, placeholder, suggestedQuestions, onSelectSuggestion }: MessageInputProps): React.JSX.Element;
export {};
//# sourceMappingURL=MessageInput.d.ts.map