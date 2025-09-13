import React from 'react';
import type { ChatThread, Message } from 'wasp/entities';
interface ChatExportDialogProps {
    thread?: ChatThread & {
        messages: Message[];
    };
    onClose: () => void;
    topicTitle: string;
}
export declare function ChatExportDialog({ thread, onClose, topicTitle }: ChatExportDialogProps): React.JSX.Element;
export {};
//# sourceMappingURL=ChatExportDialog.d.ts.map