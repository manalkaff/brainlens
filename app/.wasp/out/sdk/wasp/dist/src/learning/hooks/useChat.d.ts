import type { ChatThread, Message } from 'wasp/entities';
interface ChatThreadWithMessages extends ChatThread {
    messages: Message[];
    messageCount: number;
    lastMessage?: Message;
}
interface SendMessageResponse {
    userMessage: Message;
    assistantMessage: Message;
    suggestedQuestions: string[];
    metadata: {
        confidence: number;
        processingTime: number;
        sourceCount: number;
    };
}
interface UseChatOptions {
    topicId: string;
    autoCreateThread?: boolean;
}
export declare function useChat({ topicId, autoCreateThread }: UseChatOptions): {
    threads: ChatThreadWithMessages[];
    activeThread: ChatThreadWithMessages | undefined;
    activeThreadId: string | undefined;
    suggestedQuestions: string[];
    loading: boolean;
    threadsLoading: boolean;
    error: string | undefined;
    createThread: (title?: string) => Promise<{
        id: string;
        userId: string;
        topicId: string;
        title: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    selectThread: (threadId: string) => void;
    sendMessage: (content: string) => Promise<SendMessageResponse>;
    updateThread: (threadId: string, updates: {
        title?: string;
    }) => Promise<{
        id: string;
        userId: string;
        topicId: string;
        title: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteThread: (threadId: string) => Promise<void>;
    exportThread: (threadId: string, format: "text" | "json" | "markdown") => Promise<{
        content: string;
        filename: string;
        mimeType: string;
    }>;
    clearError: () => void;
    refetchThreads: <TPageData>(options?: (import("@tanstack/query-core").RefetchOptions & import("@tanstack/query-core").RefetchQueryFilters<TPageData>) | undefined) => Promise<import("@tanstack/query-core").QueryObserverResult<({
        id: string;
        userId: string;
        topicId: string;
        title: string | null;
        createdAt: Date;
        updatedAt: Date;
    } & {
        messages: Message[];
        messageCount: number;
        lastMessage?: Message;
    })[], Error>>;
    refetchThread: <TPageData>(options?: (import("@tanstack/query-core").RefetchOptions & import("@tanstack/query-core").RefetchQueryFilters<TPageData>) | undefined) => Promise<import("@tanstack/query-core").QueryObserverResult<{
        id: string;
        userId: string;
        topicId: string;
        title: string | null;
        createdAt: Date;
        updatedAt: Date;
    } & {
        messages: Message[];
        messageCount: number;
        lastMessage?: Message;
    }, Error>>;
};
export {};
//# sourceMappingURL=useChat.d.ts.map