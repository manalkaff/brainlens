import type { CreateChatThread, GetChatThread, GetChatThreads, SendMessage, UpdateChatThread } from 'wasp/server/operations';
import type { ChatThread, Message } from 'wasp/entities';
type CreateChatThreadInput = {
    topicId: string;
    title?: string;
    userPreferences?: {
        knowledgeLevel?: 'beginner' | 'intermediate' | 'advanced';
        learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    };
};
type SendMessageInput = {
    threadId: string;
    content: string;
};
type UpdateChatThreadInput = {
    threadId: string;
    title?: string;
    userPreferences?: {
        knowledgeLevel?: 'beginner' | 'intermediate' | 'advanced';
        learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    };
};
type GetChatThreadsInput = {
    topicId?: string;
    limit?: number;
    offset?: number;
};
type ChatThreadWithMessages = ChatThread & {
    messages: Message[];
    messageCount: number;
    lastMessage?: Message;
};
type SendMessageResponse = {
    userMessage: Message;
    assistantMessage: Message;
    suggestedQuestions: string[];
    metadata: {
        confidence: number;
        processingTime: number;
        sourceCount: number;
    };
};
type ExportChatThreadInput = {
    threadId: string;
    format: 'text' | 'json' | 'markdown';
};
type ExportChatThreadResponse = {
    content: string;
    filename: string;
    mimeType: string;
};
/**
 * Create a new chat thread for a topic
 */
export declare const createChatThread: CreateChatThread<CreateChatThreadInput, ChatThread>;
/**
 * Get a specific chat thread with messages
 */
export declare const getChatThread: GetChatThread<{
    threadId: string;
}, ChatThreadWithMessages>;
/**
 * Get all chat threads for a user, optionally filtered by topic
 */
export declare const getChatThreads: GetChatThreads<GetChatThreadsInput, ChatThreadWithMessages[]>;
/**
 * Send a message and get AI response
 */
export declare const sendMessage: SendMessage<SendMessageInput, SendMessageResponse>;
/**
 * Update chat thread settings
 */
export declare const updateChatThread: UpdateChatThread<UpdateChatThreadInput, ChatThread>;
/**
 * Export conversation thread as text or JSON
 */
export declare const exportChatThread: (args: ExportChatThreadInput, context: any) => Promise<ExportChatThreadResponse>;
export {};
//# sourceMappingURL=operations.d.ts.map